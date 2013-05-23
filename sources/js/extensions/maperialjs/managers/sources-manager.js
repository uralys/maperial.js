//-------------------------------------------//
//- SourcesManager
//-------------------------------------------//

function SourcesManager(maperial){
   this.maperial = maperial;

   this.data      = {};
   this.requests  = {};
   this.load      = {};
   this.errors    = {};

   this.sources   = [];

   this.buildSources(this.maperial.config.layers);
}

//---------------------------------------------------------------------------//

/**
 * this.sources is filled with every required source.
 * if many layers require the same source, this source is put once in this.sources.
 * This way, only one source is loaded, and the data is copied in each layer.
 */
//TODO : tout pourri ! on doit pouvoir avoir plusieurs rasters
SourcesManager.prototype.buildSources = function(layers){

   console.log("  fetching sources...");
   var isRegisterdOSM;

   for(var i = 0; i < layers.length; i++){
      var type = layers[i].source.type;
      var params;

      switch(type){
         case Source.MaperialOSM:
            if(isRegisterdOSM) continue;
            isRegisterdOSM = true;
            break;

         case Source.Raster:
            params = {rasterUID : layers[i].source.params.uid };
            break;

         case Source.Images:
         case Source.WMS:
            params = {src : layers[i].source.params.src };
            break;
      }

      this.sources.push(new Source(type, params));
   }

}
//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.releaseEverything = function () {
   for(requestId in this.requests){
      this.requests[requestId].abort();
   }
}

//----------------------------------------------------------------------------------------------------------------------//

// TODO !! source.type => source.id !! si on veut plusieurs fois le meme type !!
SourcesManager.prototype.requestId = function (source, x, y, z) {
   return source.type + "_" + x + "_" + y + "_" + z;
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.release = function (x, y ,z) {

   for(var i = 0; i< this.sources.length; i++){
      var requestId = this.requestId(this.sources[i], x, y, z);

      this.requests[requestId].abort();
      delete this.data[requestId];
      delete this.errors[requestId];
      delete this.load[requestId];
      delete this.requests[requestId];
   }

}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.loadSources = function (x, y ,z) {

   for(var i = 0; i< this.sources.length; i++){

      var source = this.sources[i];
      var requestId = this.requestId(source, x, y, z);

      if (this.requests[requestId])
         return false;

      switch(source.type){

         case Source.MaperialOSM:
            this.LoadVectorial ( source, x, y, z );
            break;

         case Source.Raster:
            this.LoadRaster ( source, x, y, z );
            break;

         case Source.Images:
            this.LoadImage ( source, x, y, z );
            break;

         case Source.WMS:
            this.LoadWMS ( source, x, y, z );
            break;
      }
   }

}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.LoadVectorial = function ( source, x, y, z ) {
   var me = this;
   var requestId = this.requestId(source, x, y, z);

   this.requests[requestId] = $.ajax({
      type     : "GET",
      url      : this.getURL(source, x, y, z),
      dataType : "json",  
      timeout  : Maperial.tileDLTimeOut,
      success  : function(data) {
         if ( ! data ) {
            me.errors[requestId] = true;
         }
         else {
            me.data[requestId] = data;
         }

         me.load[requestId] = true;
         me.maperial.mapRenderer.sourceReady(source, x, y, z);
      },
      error : function() {
         me.errors[requestId]   = true;
         me.load[requestId]    = true;

         me.maperial.mapRenderer.sourceReady(source, x, y, z);
      }
   });
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.LoadImage = function ( source, x, y, z ) {
   var me         = this;   
   var url        = this.getURL(source, x, y, z);
   var requestId  = this.requestId(source, x, y, z);

   this.requests[requestId] = new Image();

   this.requests[requestId].onload = function (oEvent) {      
      var img = me.requests[requestId]
      me.errors[requestId] = false;
      me.load[requestId]  = true;
      me.data[requestId]  = img;

      me.maperial.mapRenderer.sourceReady(source, x, y, z);
   };

   this.requests[requestId].onerror = function (oEvent) {
      me.errors[requestId] = true;
      me.load[requestId]  = true;
      me.maperial.mapRenderer.sourceReady(source, x, y, z);
   }

   this.requests[requestId].abort = function () {
      this.src = ''
   }

   // TODO opti : quest ce qui est le plus couteux : ce "try catch" + abort systematique ou un "if (requests && !data){abort}" ?
   function ajaxTimeout() { try{ me.requests[requestId].abort(); }catch(e){} }
   var tm = setTimeout(ajaxTimeout, Maperial.tileDLTimeOut);

   //http://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
//   this.requests[requestId].crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'

   this.requests[requestId].src = url;
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.LoadRaster = function ( source, x, y, z ) {

   var requestId = this.requestId(source, x, y, z);

   if ( ! this.getURL(source, x, y, z) ) {
      this.errors[requestId] = true;
      this.load[requestId] = true;
      return ;
   }

   // https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/Sending_and_Receiving_Binary_Data
   // JQuery can not use XMLHttpRequest V2 (binary data)
   var me = this;   
   this.requests[requestId] = new XMLHttpRequest();
   this.requests[requestId].open ("GET", this.getURL(source, x, y, z), true);
   this.requests[requestId].responseType = "arraybuffer";

   this.requests[requestId].onload = function (oEvent) {      
      var arrayBuffer = me.requests[requestId].response;  // Note: not this.requests[requestId].responseText
      if (arrayBuffer && ( me.requests[requestId].status != 200 || arrayBuffer.byteLength <= 0 )) {
         arrayBuffer = null;
      }

      me.errors[requestId] = arrayBuffer != null;
      me.load[requestId]  = true;
      me.data[requestId]  = arrayBuffer;
      me.maperial.mapRenderer.sourceReady(source, x, y, z);
   };

   this.requests[requestId].onerror = function (oEvent) {
      me.errors[requestId] = true;
      me.load[requestId]  = true;
      me.maperial.mapRenderer.sourceReady(source, x, y, z);
   }

   // TODO opti : quest ce qui est le plus couteux : ce "try catch" + abort systematique ou un "if (requests && !data){abort}" ?
   function ajaxTimeout() { try{ me.requests[requestId].abort(); }catch(e){} }
   var tm = setTimeout(ajaxTimeout, Maperial.tileDLTimeOut);

   this.requests[requestId].send(null);
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.LoadWMS = function ( source, x, y, z ) {
   var me         = this;   
   var url        = this.getWMSURL(source, x, y, z);
   var requestId  = this.requestId(source, x, y, z);

   this.requests[requestId] = new Image();

   this.requests[requestId].onload = function (oEvent) {      
      var img = me.requests[requestId]
      me.errors[requestId] = false;
      me.load[requestId]  = true;
      me.data[requestId]  = img;

      me.maperial.mapRenderer.sourceReady(source, x, y, z);
   };

   this.requests[requestId].onerror = function (oEvent) {
      me.errors[requestId] = true;
      me.load[requestId]  = true;
      me.maperial.mapRenderer.sourceReady(source, x, y, z);
   }

   this.requests[requestId].abort = function () {
      this.src = ''
   }

   // TODO opti : quest ce qui est le plus couteux : ce "try catch" + abort systematique ou un "if (requests && !data){abort}" ?
   function ajaxTimeout() { try{ me.requests[requestId].abort(); }catch(e){} }
   var tm = setTimeout(ajaxTimeout, Maperial.tileDLTimeOut);

   //http://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
   this.requests[requestId].crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'

   this.requests[requestId].src = url;
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.isTileLoaded = function ( x, y, z) {

   for(var i = 0; i< this.sources.length; i++){
      var source = this.sources[i];
      var requestId = this.requestId(source, x, y, z);

      if (!this.load[requestId])
         return false;
   }

   return true;
}

//-------------------------------------------//

SourcesManager.prototype.getData = function ( source, x, y, z) {
   var requestId = this.requestId(source, x, y, z);
   return this.data[requestId];
}

//-------------------------------------------//

SourcesManager.prototype.getURL = function (source, tx, ty, z) {

   switch(source.type){

      case Source.MaperialOSM:
         return Maperial.apiURL + "/api/tile?x="+tx+"&y="+ty+"&z="+z;

      case Source.Raster:
         return Maperial.apiURL + "/api/tile/"+source.params.rasterUID+"?x="+tx+"&y="+ty+"&z="+z;

      case Source.Images:
         return this.getImageURL(source, tx, ty, z)
   }
}


SourcesManager.prototype.getImageURL = function (source, tx, ty, z) {

   var src = null;
   if ( source.params === undefined || source.params.src === undefined )
      source.params.src = Source.IMAGES_OSM;
   
   var gty = (Math.pow ( 2,z ) - 1) - ty;
   
   console.log("src "+ source.params.src);
  
   switch (source.params.src) {
      case Source.IMAGES_MAPQUEST :             // need to check http://developer.mapquest.com/web/products/open/map
         var r = Math.floor ( Math.random() * 4 + 1 ) % (4 + 1) // Betwen [0,4]
         return "http://otile"+r+".mqcdn.com/tiles/1.0.0/osm/"+z+"/"+tx+"/"+gty+".png";
         break;
   
   //    case Source.IMAGES_MAPQUEST_SATELLITE :   // need to check http://developer.mapquest.com/web/products/open/map
   //    var r = Math.floor ( Math.random() * 4 + 1 ) % (4 + 1) // Betwen [0,4]
   //    return "http://otile"+r+".mqcdn.com/tiles/1.0.0/sat/"+z+"/"+tx+"/"+gty+".png";
   
      case Source.IMAGES_MAPQUEST_SATELLITE : 
         return "http://irs.gis-lab.info/?layers=landsat&request=GetTile&z="+z+"&x="+tx+"&y="+gty;
         break;
   
      case Source.WMSB:
         console.log("WMSB");
         return this.getWMSURL(source, tx, ty, z);
         break;
         
//      case Source.IMAGES_OSM:                   // http://wiki.openstreetmap.org/wiki/Tile_usage_policy
//      default :
//         console.log("OSM");
//         return "http://tile.openstreetmap.org/"+z+"/"+tx+"/"+gty+".png"
//         break;
//   
//         //http://irs.gis-lab.info/
//         //http://www.thunderforest.com/ 
//   
//         // Check nokia
//   
//         // Unautorized :(
//         //case "google satellite":
//         //   return "http://khm1.google.com/kh/v=101&x="+tx+"&y="+gty+"&z="+z
//         //case "google street":
//         //   return "http://mt0.google.com/vt/x="+tx+"&y="+gty+"&z="+z
   }
// http://www.neongeo.com/wiki/doku.php?id=map_servers

//http://www.opencyclemap.org/docs/
}
//-------------------------------------------//
/*
 * 
   var w = this.context.mapCanvas.width();
   var h = this.context.mapCanvas.height();

   var centerP = this.context.coordS.MetersToPixels(this.context.centerM.x, this.context.centerM.y, this.context.zoom);
   var shiftX = w/2;
   var shiftY = h/2;
   
   var topLeftP = new Point(centerP.x - shiftX, centerP.x - shiftY)
   var topLeftM = this.context.coordS.PixelsToMeters(topLeftP.x, topLeftP.y, this.context.zoom)

   var bottomRightP = new Point(centerP.x + shiftX, centerP.x + shiftY)
   var bottomRightM = this.context.coordS.PixelsToMeters(bottomRightP.x, bottomRightP.y, this.context.zoom)
   
   // once initialized, these may be re-used as often as neededv

   // transforming point coordinates
   var topLeft = new Proj4js.Point(topLeftP.x, topLeftP.y);   //any object will do as long as it has 'x' and 'y' properties
   Proj4js.transform(source, dest, topLeft);      //do the transformation.  x and y are modified in place

   var bottomRight = new Proj4js.Point(bottomRightP.x, bottomRightP.y);   //any object will do as long as it has 'x' and 'y' properties
   Proj4js.transform(source, dest, bottomRight);      //do the transformation.  x and y are modified in place

   
   console.log("------------------")
   console.log(w + " | " + h)
   console.log(topLeft.x + " | " + topLeft.y)
   console.log(bottomRight.x + " | " + bottomRight.y)
 */
SourcesManager.prototype.getWMSURL = function (source, tx, ty, z) {

   var topLeftP     = new Point(tx * Maperial.tileSize, ty*Maperial.tileSize)
   var topLeftM     = this.maperial.context.coordS.PixelsToMeters(topLeftP.x, topLeftP.y, this.maperial.context.zoom)
   
   var bottomRightP = new Point(topLeftP.x + Maperial.tileSize, topLeftP.y + Maperial.tileSize)
   var bottomRightM = this.maperial.context.coordS.PixelsToMeters(bottomRightP.x, bottomRightP.y, this.maperial.context.zoom)

   switch(source.params.src){
      
      case Source.WMS_1:
     
         var source  = new Proj4js.Proj('EPSG:900913');   // Mercator
         var dest    = new Proj4js.Proj('EPSG:2154');     // Lambert 93
         
         var topLeft = new Proj4js.Point(topLeftM.x, topLeftM.y);
         Proj4js.transform(source, dest, topLeft); 

         var bottomRight = new Proj4js.Point(bottomRightM.x, bottomRightM.y);
         Proj4js.transform(source, dest, bottomRight); 
         
         console.log("http://ws.carmen.developpement-durable.gouv.fr/cgi-bin/mapserv?map=/mnt/data_carmen/PACA/Publication/environnement.map&LAYERS=layer227&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A2154&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize)
         break;

      case Source.WMS_3:
         // http://www.mapmatters.org/wms/624097
         break;
         
      case Source.WMS_2:
      default:
         // http://www.mapmatters.org/server/4114
         
         var topLeft = topLeftM;
         var bottomRight = bottomRightM;
         return("http://geowww.agrocampus-ouest.fr/geoserver/ows?SERVICE=WMS&LAYERS=france%3Arh_france_1000ha&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize)
         break;
   }
}
