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

   for(var i = 0; i < layers.length; i++){
      
      if(this.sourceRegistered(layers[i].source.id))
         continue
         
      var type = layers[i].source.type;
      var params;
      
      switch(type){
         case Source.MaperialOSM:
         case Source.SRTM:
         case Source.Shade:
            // no params required for SourcesManager
            break;
            
         case Source.Raster:
            params = {rasterUID : layers[i].source.params.uid };
            break;

         case Source.Images:
         case Source.WMS:
            params = {src : layers[i].source.params.src }
            this.centerWMS( layers[i].source.params.src, "prepare" )
            break;
      }

      console.log("     adding source " + layers[i].source.id);
      this.sources.push(new Source(layers[i].source.id, type, params));
   }

}

/**
 * Return true if the source with this id is already in this.sources
 */
SourcesManager.prototype.sourceRegistered = function(id){
   
   for(var i = 0; i < this.sources.length; i++){
      if(this.sources[i].id == id)
         return true
   }
   
   return false
}

//----------------------------------------------------------------------------------------------------------------------//

/**
 * type = "prepare" or "place"
 */
SourcesManager.prototype.centerWMS = function (src, type) {
   
   switch(src){
      // US - only
      case Source.IMAGES_STAMEN_TERRAIN : 
         this.maperial.centerMap(40.68, -74.12, 7, type)
         break;

         // Bretagne
      case Source.WMS_BRETAGNECANTONS : 
         this.maperial.centerMap(48.27, -2.87, 9, type)
         break;

         // Rennes
      case Source.WMS_SOLS_ILEETVILAINE : 
         this.maperial.centerMap(48.11, -1.78, 10, type)
         break;
   }   
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.releaseEverything = function () {

   this.stopEverything()
   
   for(requestId in this.requests){
      try{
         this.requests[requestId].abort();
      }
      catch(e){}
   }
}

SourcesManager.prototype.stopEverything = function () {
   //   cancel image downloads
   if(window.stop !== undefined)
      window.stop();
   else if(document.execCommand !== undefined)
      document.execCommand("Stop", false);
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.requestId = function (source, x, y, z) {
   return source.id + "_" + x + "_" + y + "_" + z;
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.release = function (x, y ,z) {

   for(var i = 0; i< this.sources.length; i++){
      var requestId = this.requestId(this.sources[i], x, y, z);

      if(!this.load[requestId]){
         try{
            this.requests[requestId].abort();
         }
         catch(e){}
      }
      
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
         case Source.Shade:
         case Source.MaperialOSM:
            this.LoadVectorial ( source, x, y, z );
            break;

         case Source.SRTM:
         case Source.Raster:
            this.LoadRaster ( source, x, y, z );
            break;

         case Source.Images:
         case Source.WMS:
            this.LoadImage ( source, x, y, z );
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
            me.maperial.mapRenderer.sourceReady(source, null, x, y, z);
         }
         else {
            me.data[requestId] = data;
            me.maperial.mapRenderer.sourceReady(source, data, x, y, z);
         }

         me.load[requestId] = true;
      },
      error : function() {
         me.errors[requestId]  = true;
         me.load[requestId]    = true;

         me.maperial.mapRenderer.sourceReady(source, null, x, y, z);
      }
   });
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.LoadImage = function ( source, x, y, z ) {
   var me         = this;   
   var url        = this.getURL(source, x, y, z);
   var requestId  = this.requestId(source, x, y, z);

   this.requests[requestId] = new Image();

   //http://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
   this.requests[requestId].crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'

   this.requests[requestId].onload = function (oEvent) {      
      var img = me.requests[requestId]
      me.errors[requestId] = false;
      me.load[requestId]  = true;
      me.data[requestId]  = img;

      me.maperial.mapRenderer.sourceReady(source, me.data[requestId], x, y, z);
   };

   this.requests[requestId].onerror = function (oEvent) {
      me.errors[requestId] = true;
      me.load[requestId]  = true;
      me.maperial.mapRenderer.sourceReady(source, null, x, y, z);
   }

   this.requests[requestId].abort = function () {
      me.requests[requestId].src = ""
   }

   this.requests[requestId].src = url;
//
//   this.requests[requestId].onabort = function () {
//      me.requests[requestId] = new Image();
//      me.requests[requestId].src = "http://static.maperial.localhost/images/global/nofound.png"
//   }
//
//   setTimeout(function () { 
//      if ( ! me.load[requestId] ) {
//         me.requests[requestId].onabort();
//      }
//   }, Maperial.tileDLTimeOut);
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
      me.maperial.mapRenderer.sourceReady(source, me.data[requestId], x, y, z);
   };

   this.requests[requestId].onerror = function (oEvent) {
      me.errors[requestId] = true;
      me.load[requestId]  = true;
      me.maperial.mapRenderer.sourceReady(source, null, x, y, z);
   }
   
   function ajaxTimeout() { 
      if ( ! me.load[requestId] ) {
         try{ 
            me.requests[requestId].abort(); 
         }catch(e){} 
      }
   }
   var tm = setTimeout(ajaxTimeout, Maperial.tileDLTimeOut);

   this.requests[requestId].send(null);
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

//SourcesManager.prototype.getData = function ( source, x, y, z) {
//   var requestId = this.requestId(source, x, y, z);
//   return this.data[requestId];
//}

//-------------------------------------------//

SourcesManager.prototype.getURL = function (source, tx, ty, z) {

   switch(source.type){

      case Source.MaperialOSM:
         return Maperial.apiURL + "/api/tile?x="+tx+"&y="+ty+"&z="+z;

      case Source.SRTM:
         return Maperial.apiURL + "/api/srtm?x="+tx+"&y="+ty+"&z="+z;
         //return "http://192.168.0.1:8081/api/srtm?x="+tx+"&y="+ty+"&z="+z;

      case Source.Shade:
         return Maperial.apiURL + "/api/srtm?x="+tx+"&y="+ty+"&z="+z;
         //return "http://192.168.0.1:8081/api/srtm?x="+tx+"&y="+ty+"&z="+z;
         
         
      case Source.Raster:
         return Maperial.apiURL + "/api/tile/"+source.params.rasterUID+"?x="+tx+"&y="+ty+"&z="+z;

      case Source.Images:
         return this.getImageURL(source, tx, ty, z)

      case Source.WMS:
         return this.getWMSURL(source, tx, ty, z)
   }
}


SourcesManager.prototype.getImageURL = function (source, tx, ty, z) {

   var src = null;
   if ( source.params === undefined || source.params.src === undefined )
      source.params.src = Source.IMAGES_OSM;
   
   var gty = (Math.pow ( 2,z ) - 1) - ty;
   var server = ["a", "b", "c", "d"];
   
   switch (source.params.src) {
      case Source.IMAGES_MAPQUEST : // need to check http://developer.mapquest.com/web/products/open/map
         var r = Utils.random1(4);
         return "http://otile"+r+".mqcdn.com/tiles/1.0.0/osm/"+z+"/"+tx+"/"+gty+".png";
         break;
   
       case Source.IMAGES_MAPQUEST_SATELLITE : // need to check http://developer.mapquest.com/web/products/open/map
          var r = Utils.random1(4);
          return "http://otile"+r+".mqcdn.com/tiles/1.0.0/sat/"+z+"/"+tx+"/"+gty+".png";
   

       case Source.IMAGES_OCM_CYCLE :
          var s = Utils.random0(2);
          return "http://"+server[s]+".tile.opencyclemap.org/cycle/"+z+"/"+tx+"/"+gty+".png";

       case Source.IMAGES_OCM_TRANSPORT :
          var s = Utils.random0(2);
          return "http://"+server[s]+".tile2.opencyclemap.org/transport/"+z+"/"+tx+"/"+gty+".png";
       
       case Source.IMAGES_OCM_LANDSCAPE :
          var s = Utils.random0(2);
          return "http://"+server[s]+".tile3.opencyclemap.org/landscape/"+z+"/"+tx+"/"+gty+".png";



       case Source.IMAGES_STAMEN_WATERCOLOR :
          var s = Utils.random0(3);
          return "http://"+server[s]+".tile.stamen.com/watercolor/"+z+"/"+tx+"/"+gty+".jpg"    
       
       case Source.IMAGES_STAMEN_TERRAIN : // US only
          var s = Utils.random0(3);
          return "http://"+server[s]+".tile.stamen.com/terrain/"+z+"/"+tx+"/"+gty+".jpg"
       
       case Source.IMAGES_STAMEN_TONER :
          var s = Utils.random0(3);
          return "http://"+server[s]+".tile.stamen.com/toner/"+z+"/"+tx+"/"+gty+".jpg"
  
       case Source.IMAGES_STAMEN_TONER_BG :
          var s = Utils.random0(3);
          return "http://"+server[s]+".tile.stamen.com/toner-background/"+z+"/"+tx+"/"+gty+".jpg"
   
         
      case Source.IMAGES_OSM:  // http://wiki.openstreetmap.org/wiki/Tile_usage_policy
      default :
         var s = Utils.random0(2);
         return "http://"+server[s]+".tile.openstreetmap.org/"+z+"/"+tx+"/"+gty+".png"
         break;

//        // Use google API
//       case Source.IMAGES_GOOGLE_SATELLITE :
//          return "http://khm1.google.com/kh/v=121&x="+tx+"&y="+gty+"&z="+z
//       case Source.IMAGES_GOOGLE_TERRAIN :
//          return "http://mt0.googleapis.com/vt?x="+tx+"&y="+gty+"&z="+z;

         // PB JPG ?
//      case Source.IRS_SATELLITE: 
//         return "http://irs.gis-lab.info/?layers=landsat&request=GetTile&z="+z+"&x="+tx+"&y="+gty;
//         //http://irs.gis-lab.info/
      
//         // Check nokia
//   
      
//      http://www.neongeo.com/wiki/doku.php?id=map_servers
   }

}

//-------------------------------------------//

/**
 * Source.WMS_BRETAGNECANTONS 
 *    geo1 : "http://geobretagne.fr/geoserver/ows?SERVICE=WMS&LAYERS=d22%3AASS_LIN_22&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize
 * 
 * Source.WMS_FRANCECOURSDEAU 
 * Source.WMS_SOLS_ILEETVILAINE 
 *    geo2 : "http://geowww.agrocampus-ouest.fr/geoserver/ows?SERVICE=WMS&LAYERS=france%3Arh_france_1000ha&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize

 * Source.WMS_CORINE_LAND_COVER 
 *    geo3 : "http://sd1878-2.sivit.org/geoserver/gwc/service/wms?SERVICE=WMS&LAYERS=topp%3ACLC06_WGS&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize
 */ 
SourcesManager.prototype.getWMSURL = function (source, tx, ty, z) {

   var topLeftP     = new Point(tx * Maperial.tileSize, ty*Maperial.tileSize)
   var topLeftM     = this.maperial.context.coordS.PixelsToMeters(topLeftP.x, topLeftP.y, this.maperial.context.zoom)
   
   var bottomRightP = new Point(topLeftP.x + Maperial.tileSize, topLeftP.y + Maperial.tileSize)
   var bottomRightM = this.maperial.context.coordS.PixelsToMeters(bottomRightP.x, bottomRightP.y, this.maperial.context.zoom)

   switch(source.params.src){
      
      case Source.WMS_BRETAGNECANTONS:
         //http://www.mapmatters.org/wms/602246

         var topLeft       = topLeftM;
         var bottomRight   = bottomRightM;
         
         return("http://api.maperial.com/geo1?SERVICE=WMS&LAYERS=bzh%3ACANTON&FORMAT=image%2Fpng&VERSION=1.1.1&REQUEST=GetMap&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize)
         break;

      case Source.WMS_FRANCECOURSDEAU:
         //http://www.mapmatters.org/wms/647145
         
         var topLeft       = topLeftM;
         var bottomRight   = bottomRightM;

         return("http://api.maperial.com/geo2?SERVICE=WMS&LAYERS=france%3Arh_france_1000ha&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize)
         break;

      case Source.WMS_SOLS_ILEETVILAINE:
         //http://www.mapmatters.org/wms/647148
         
         var topLeft       = topLeftM;
         var bottomRight   = bottomRightM;
         
         return("http://api.maperial.com/geo2?SERVICE=WMS&LAYERS=igcs%3Aucs35&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize)
         break;

      case Source.WMS_CORINE_LAND_COVER:

         var topLeft       = topLeftM;
         var bottomRight   = bottomRightM;

         return("http://api.maperial.com/geo3?SERVICE=WMS&LAYERS=topp%3ACLC06_WGS&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize)
         break;

         
//      case Source.WMS4:
         // http://www.mapmatters.org/wms/624097
         // http://www.mapmatters.org/wms/603594
         // http://www.mapmatters.org/server/4114
         // Bretagne : http://www.mapmatters.org/server/3525   (leurs png n'ont pas dalpha :( )
//         
//         
//         console.log("http://ws.carmen.developpement-durable.gouv.fr/cgi-bin/mapserv?map=/mnt/data_carmen/PACA/Publication/environnement.map&LAYERS=layer227&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A2154&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize)
//         break;
         
         
         break;
   }
}
