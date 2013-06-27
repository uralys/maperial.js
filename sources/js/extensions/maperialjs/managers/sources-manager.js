//-------------------------------------------//
//- SourcesManager
//-------------------------------------------//

function SourcesManager(){

   this.data      = {};
   this.requests  = {};
   this.complete  = {};
   this.errors    = {};

   this.sources   = [];
   this.receivers = [];

   this.requestsCounter = new HashMap();
}

//---------------------------------------------------------------------------//

/**
 * this.sources is filled with every required source.
 * if many layers require the same source, this source is put once in this.sources.
 * This way, only one source is loaded, and the data is copied in each layer.
 */
SourcesManager.prototype.addReceiver = function(receiver){
   console.log("  fetching sources for receiver " + receiver.name + "...");

   for(var i = 0; i < receiver.config.layers.length; i++){
      this.addSource(receiver.name, receiver.config.layers[i])
   }
   
   this.receivers.push(receiver)
}

SourcesManager.prototype.addSource = function(receiverName, layer){
   
   console.log("     adding source " + layer.source.id + " for receiver " + receiverName );

   var source = this.getSource(layer.source.id)
   
   if(source){
      var nbLayers = source.receivers.get(receiverName) || 0
      source.receivers.put(receiverName, nbLayers + 1)
      return
   }
      
   var type = layer.source.type;
   var params;
   
   switch(type){
      case Source.MaperialOSM:
      case Source.SRTM:
         // no params required for SourcesManager
         break;
         
      case Source.Raster:
         params = {rasterUID : layer.source.params.uid };
         break;

      case Source.Images:
      case Source.WMS:
         params = {src : layer.source.params.src }
         //this.centerWMS( layer.source.params.src, "prepare", receiverName )
         break;
   }

   console.log("        --> source " + layer.source.id + " in sources");
   this.sources.push(new Source(layer.source.id, type, params, receiverName));
}

/**
 * Return the source with this id is already in this.sources
 */
SourcesManager.prototype.getSource = function(id){

   for(var i = 0; i < this.sources.length; i++){
      if(this.sources[i].id == id)
         return this.sources[i]
   }
   
   return null
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.detachSource = function(sourceId, receiverName, removeAll){

   var source = this.getSource(sourceId)
   
   var nbLayers = source.receivers.get(receiverName) || 0
   
   if(removeAll)
      source.receivers.put(receiverName, 0)
   else
      source.receivers.put(receiverName, nbLayers - 1)
   
   
   if(source.receivers.get(receiverName) == 0){

      for(var i = 0; i < this.sources.length; i++){
         if(this.sources[i].id == sourceId)
            break;
      }
      
      console.log("SourceManager.detachSource", sourceId, receiverName)
      this.sources.splice(i, 1);
   }
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.releaseReceiver = function (receiverName) {
   
   console.log("SourceManager.release", receiverName)
   
   var sourcesToDetach = []
   for(var i = 0; i < this.sources.length; i++){
         
      if(this.sources[i].isForMe(receiverName)){
         sourcesToDetach.push(this.sources[i].id)
      }
         
   }

   for(var i = 0; i < sourcesToDetach.length; i++){
      this.detachSource(sourcesToDetach[i], receiverName, true)
   }
   
   this.receivers.splice(i, 1);
}

//---------------------------------------------------------------------------//

SourcesManager.prototype.releaseAllReceivers = function(){

   while(this.receivers.length > 0)
      this.releaseReceiver(this.receivers[0].name)
            
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.releaseNetwork = function () {
   
   for(var requestId in this.requests){

      if(!this.complete[requestId]){
         try{
            this.requests[requestId].abort();
         }
         catch(e){}
      }

      delete this.data[requestId];
      delete this.errors[requestId];
      delete this.complete[requestId];
      delete this.requests[requestId];
   }
   
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.requestId = function (source, x, y, z) {
   return source.id + "_" + x + "_" + y + "_" + z;
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.release = function (x, y, z, receiverName) {

   for(var i = 0; i< this.sources.length; i++){

      if(!this.sources[i].isForMe(receiverName))
         continue
         
      var requestId = this.requestId(this.sources[i], x, y, z);
      var nbRequests = this.requestsCounter.get(requestId) || 0
      
      if(nbRequests > 1){
         this.requestsCounter.put(requestId, nbRequests - 1)
      }
      else{
         if(!this.complete[requestId]){
            
            try{
               this.requests[requestId].abort();
            }
            catch(e){}
         }

         delete this.data[requestId];
         delete this.errors[requestId];
         delete this.complete[requestId];
         delete this.requests[requestId];
      }
   }

}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.loadSources = function (x, y, z, receiverName) {

   for(var i = 0; i< this.sources.length; i++){

      //------------------------------------------//

      var source = this.sources[i];
      if(!source.isForMe(receiverName))
         continue
      
      //------------------------------------------//
         
      var requestId = this.requestId(source, x, y, z);
      
      //------------------------------------------//
      
      var nbRequests = this.requestsCounter.get(requestId) || 0
      this.requestsCounter.put(requestId, nbRequests + 1)

      //------------------------------------------//

      if (this.requests[requestId]){
         if (this.complete[requestId])
            $(window).trigger(MaperialEvents.SOURCE_READY, [source, this.data[requestId], x, y, z])
         
         continue
      }

      //------------------------------------------//

      switch(source.type){
         case Source.MaperialOSM:
            this.LoadVectorial ( source, x, y, z );
            break;

         case Source.SRTM:
         case Source.Raster:
            this.LoadRaster ( source, x, y, z );
            break;

         case Source.Images:
         case Source.WMS:
            this.LoadImage ( source, x, y, z, receiverName );
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
            $(window).trigger(MaperialEvents.SOURCE_READY, [source, data, x, y, z])
//            me.maperial.mapRenderer.sourceReady(source, data, x, y, z);
         }

         me.complete[requestId] = true;
      },
      error : function() {
         me.errors[requestId]  = true;
         me.complete[requestId]    = true;
      }
   });
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.LoadImage = function ( source, x, y, z, receiverName ) {
   var me         = this;   
   var url        = this.getURL(source, x, y, z, receiverName);
   var requestId  = this.requestId(source, x, y, z);

   this.requests[requestId] = new Image();

   //http://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
   this.requests[requestId].crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'

   this.requests[requestId].onload = function (oEvent) {      
      var img = me.requests[requestId]
      me.errors[requestId] = false;
      me.complete[requestId]  = true;
      me.data[requestId]  = img;

      $(window).trigger(MaperialEvents.SOURCE_READY, [source, me.data[requestId], x, y, z])
//      me.maperial.mapRenderer.sourceReady(source, me.data[requestId], x, y, z);
   };

   this.requests[requestId].onerror = function (oEvent) {
      me.errors[requestId] = true;
      me.complete[requestId]  = true;
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
//      if ( ! me.complete[requestId] ) {
//         me.requests[requestId].onabort();
//      }
//   }, Maperial.tileDLTimeOut);
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.LoadRaster = function ( source, x, y, z ) {

   var requestId = this.requestId(source, x, y, z);

   if ( ! this.getURL(source, x, y, z) ) {
      this.errors[requestId] = true;
      this.complete[requestId] = true;
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
      me.complete[requestId]  = true;
      me.data[requestId]  = arrayBuffer;

      $(window).trigger(MaperialEvents.SOURCE_READY, [source, me.data[requestId], x, y, z])
     // me.maperial.mapRenderer.sourceReady(source, me.data[requestId], x, y, z);
   };

   this.requests[requestId].onerror = function (oEvent) {
      me.errors[requestId] = true;
      me.complete[requestId]  = true;
   }
   
   function ajaxTimeout() { 
      if ( ! me.complete[requestId] ) {
         try{ 
            me.requests[requestId].abort(); 
         }catch(e){
            console.log("------------> LoadRaster")
            console.log(e)
         } 
      }
   }
   var tm = setTimeout(ajaxTimeout, Maperial.tileDLTimeOut);

   this.requests[requestId].send(null);
}

//----------------------------------------------------------------------------------------------------------------------//

SourcesManager.prototype.isTileLoaded = function ( x, y, z, receiverName) {
   
   for(var i = 0; i< this.sources.length; i++){
      var source = this.sources[i];
      if(!source.isForMe(receiverName))
         continue
         
      var requestId = this.requestId(source, x, y, z);

      if (!this.complete[requestId])
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

SourcesManager.prototype.getURL = function (source, tx, ty, z, receiverName) {

   switch(source.type){

      case Source.MaperialOSM:
         return Maperial.apiURL + "/api/tile?x="+tx+"&y="+ty+"&z="+z;

      case Source.SRTM:
         return Maperial.apiURL + "/api/srtm?x="+tx+"&y="+ty+"&z="+z;
         
      case Source.Raster:
         return Maperial.apiURL + "/api/tile/"+source.params.rasterUID+"?x="+tx+"&y="+ty+"&z="+z;

      case Source.Images:
         return this.getImageURL(source, tx, ty, z)

      case Source.WMS:
         return this.getWMSURL(source, tx, ty, z, receiverName)
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
          return "http://"+server[s]+".tile.stamen.com/toner/"+z+"/"+tx+"/"+gty+".png"
  
       case Source.IMAGES_STAMEN_TONER_BG :
          var s = Utils.random0(3);
          return "http://"+server[s]+".tile.stamen.com/toner-background/"+z+"/"+tx+"/"+gty+".png"
   
         
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
SourcesManager.prototype.getWMSURL = function (source, tx, ty, z, receiverName) {
   
   for(var i = 0; i < this.receivers.length; i++){
      if(this.receivers[i].name == receiverName){
         var receiver = this.receivers[i]
         break;
      }
   }
   
   var topLeftP     = new Point(tx * Maperial.tileSize, ty*Maperial.tileSize)
   var topLeftM     = receiver.context.coordS.PixelsToMeters(topLeftP.x, topLeftP.y, receiver.context.zoom)
   
   var bottomRightP = new Point(topLeftP.x + Maperial.tileSize, topLeftP.y + Maperial.tileSize)
   var bottomRightM = receiver.context.coordS.PixelsToMeters(bottomRightP.x, bottomRightP.y, receiver.context.zoom)

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
