!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Maperial=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
//------------------------------------------------------------------//

var GradiantColor           = _dereq_('../../libs/gradient-color.js'),
    ColorbarData            = _dereq_('../models/data/colorbar-data.js'),
    utils                   = _dereq_('../../../tools/utils.js');

//------------------------------------------------------------------//

function ColorbarManager(){
   this.colorbarsToLoad    = null;
   this.nextFunction       = null;

   window.maperialColorbars = window.maperialColorbars || {};  // cache containing all previously loaded colorbars
}

//-------------------------------------------//

ColorbarManager.prototype.createColorbar = function(options) {

   if(!options){
      options = { 
            beginAlphaAtZero : true 
      };
   }

   var steps         = options.steps || ColorbarManager.defaultSteps,
   colorbarData  = new ColorbarData({
      beginAlphaAtZero : options.beginAlphaAtZero
   });

   for(var step in steps){
      colorbarData.Set(step, new GradiantColor(steps[step].r, steps[step].g, steps[step].b, steps[step].a));
   }

   var colorbar = this.addColorbar(colorbarData);
   return colorbar;
}

//----------------------------//

ColorbarManager.prototype.addColorbar = function( colorbarData ) {

   var uid = utils.generateUID();

   window.maperialColorbars[uid] = {
         uid      : uid, 
         name     : uid, 
         data     : colorbarData,   /**  1 common data for every mapview      **/
         tex      : {},             /**  1 tex/mapview                        **/
         version  : -1              /**  force not to be sync to build tex    **/
   };

   return window.maperialColorbars[uid];
}

//-------------------------------------------//

ColorbarManager.prototype.noColorbar = function() {
   return $.isEmptyObject(window.maperialColorbars);   
}

//-------------------------------------------//

ColorbarManager.prototype.getColorbar = function(uid){
   return window.maperialColorbars[uid];
}

//-------------------------------------------//

ColorbarManager.prototype.fetchColorbars = function(colorbarUIDs, next) {

   this.nextFunction = next;

   if(colorbarUIDs.length > 0){
      var colorbarUID = colorbarUIDs.shift();
      this.colorbarsToLoad = colorbarUIDs;
      this.loadColorbar(colorbarUID);
   }
   else{
      next();
   }
}

//-------------------//

ColorbarManager.prototype.loadColorbar = function(colorbarUID) {

   var me = this;

   if(window.maperialColorbars[colorbarUID]){
      this.loadNextColorbar();
      return;
   }

   var colorbarURL = this.getURL(colorbarUID);
   console.log("  fetching : " + colorbarURL);

   $.ajax({  
      type: "GET",  
      url: colorbarURL,
      dataType: "json",
      success: function (json) {
         /*
         window.maperialColorbars[colorbarUID] = {
               uid : colorbarUID, 
               name: colorbarUID, 
               content:json, 
               data: me.convertJsonToData(json)
         };
         */
         var cb = new ColorBarData ( );
         cb.FromJson (json) 
         me.SetColorBar (colorbarUID,cb ) 
         me.loadNextColorbar();
      }
   });

}

//----------------------------//

ColorbarManager.prototype.loadNextColorbar = function() {
   this.fetchColorbars(this.colorbarsToLoad, this.nextFunction);
}

//----------------------------//

ColorbarManager.prototype.getURL = function(colorbarUID) {
   return Maperial.apiURL + "/api/colorbar/" + colorbarUID;
}

//----------------------------//

ColorbarManager.defaultSteps = {

      "0.0" : {
         "r" : 0.0,
         "g" : 0.0,
         "b" : 1.0,
         "a" : 0.0
      },
      
      "0.10" : {
         "r" : 0.0,
         "g" : 0.0,
         "b" : 1.0,
         "a" : 1.0
      },
      
      "0.15" : {
         "r" : 0.0,
         "g" : 1.0,
         "b" : 1.0,
         "a" : 1.0
      },
      
      "0.45" : {
         "r" : 0.0,
         "g" : 1.0,
         "b" : 0.0,
         "a" : 1.0
      },
      
      "0.75" : {
         "r" : 1.0,
         "g" : 1.0,
         "b" : 0.0,
         "a" : 1.0
      },
      
      "1.0" : {
         "r" : 1.0,
         "g" : 0.0,
         "b" : 0.0,
         "a" : 1.0
      },
}

/*
ColorbarManager.prototype.convertJsonToData = function(colorbarJson) {
   
   var data = [];   
   var previousStep = 0;
   for (var i in colorbarJson) {
      for ( var n = previousStep; n <= parseInt(i); n++) {
         data.push ( colorbarJson[i].r );
         data.push ( colorbarJson[i].g );
         data.push ( colorbarJson[i].b );
         data.push ( colorbarJson[i].a * 255 );
      }
      
      previousStep = n;
   }
   
   return new Uint8Array(data);
}
*/

//------------------------------------------------------------------//

module.exports = ColorbarManager;

},{"../../../tools/utils.js":41,"../../libs/gradient-color.js":36,"../models/data/colorbar-data.js":8}],2:[function(_dereq_,module,exports){
//------------------------------------------------------------------//

var Layer                   = _dereq_('../models/layer.js'),
    DynamicalLayer          = _dereq_('../models/layers/dynamical-layer.js'),
    ImageLayer              = _dereq_('../models/layers/image-layer.js'),
    HeatmapLayer            = _dereq_('../models/layers/heatmap-layer.js');

//------------------------------------------------------------------//

function LayerManager(mapView){
   this.mapView = mapView;
}

//-------------------------------------------//

LayerManager.prototype.addLayer = function(layerType, params) {

   console.log("  adding layer " + layerType)
   var layer = null

   switch(layerType){

      // ------------------------------------------//

      case Layer.Dynamical :
         layer = new DynamicalLayer(params, this.defaultDynamicalComposition());
         break;

         // ------------------------------------------//
         
      case Layer.Heat :
          layer = new HeatmapLayer(params, this.defaultComposition());
          break;

          // ------------------------------------------//

      case Layer.Vectorial :
         break;

         // ------------------------------------------//

      case Layer.Raster :
         break;

         // ------------------------------------------//

      case Layer.Images :
      case Layer.WMS:
         layer = new ImageLayer(params, this.defaultComposition());
         break;

         // ------------------------------------------//

      case Layer.SRTM :
         break;

         // ------------------------------------------//

      case Layer.Shade :
         break;

   }

   for (var key in this.mapView.tiles) {
      this.mapView.tiles[key].createLayerPart(layer, this.mapView.layers.length);
   }  

   this.mapView.layers.push(layer);

   return layer;
}

//=======================================================================================//
//Default settings

LayerManager.prototype.defaultMulBlend = function() {
   return {
      shader : Maperial.MulBlend,
      params : LayerManager.defaultMulBlendParams
   };
}

LayerManager.prototype.defaultComposition = function() {
   return {
      shader : Maperial.AlphaBlend,
      params : LayerManager.defaultAlphaBlendParams
   };
}

LayerManager.prototype.defaultDynamicalComposition = function() {
    return {
        shader : Maperial.AlphaBlend,
        params : {
            uParams : 1
        }
    };
}

//-------------------------------------------//

LayerManager.defaultMulBlendParams = {
      uParams : [ 0.0, 0.0, 1 ]
}


LayerManager.defaultAlphaBlendParams = {
      uParams : 0.5
}

LayerManager.defaultAlphaClipParams = {
      uParams : 0.5
}

//------------------------------------------------------------------//

module.exports = LayerManager;
},{"../models/layer.js":12,"../models/layers/dynamical-layer.js":13,"../models/layers/heatmap-layer.js":14,"../models/layers/image-layer.js":15}],3:[function(_dereq_,module,exports){

var utils       = _dereq_('../../../tools/utils.js');

//------------------------------------------------------------------//

function SourceManager(){

   this.data      = {};
   this.requests  = {};
   this.complete  = {};
   this.errors    = {};

   this.requestsCounter = {};
}

//---------------------------------------------------------------------------//

SourceManager.prototype.releaseNetwork = function () {
   
   for(var requestId in this.requests){

      if(!this.complete[requestId] || this.errors[requestId] || !this.data[requestId]){
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

SourceManager.prototype.requestId = function (sourceId, x, y, z) {
   return sourceId + "_" + x + "_" + y + "_" + z;
}

//----------------------------------------------------------------------------------------------------------------------//

SourceManager.prototype.release = function (sourceId, x, y, z) {

   var requestId = this.requestId(sourceId, x, y, z);
   var nbRequests = this.requestsCounter[requestId] || 0

   if(nbRequests > 1){
      this.requestsCounter[requestId] = nbRequests - 1
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

//----------------------------------------------------------------------------------------------------------------------//

SourceManager.prototype.LoadVectorial = function ( sourceId, x, y, z ) {
   var url = "/api/tile?x="+tx+"&y="+ty+"&z="+z;
   var requestId = this.requestId(sourceId, x, y, z);
   this.LoadAPISource(url, requestId)
   
}

SourceManager.prototype.LoadSRTM = function ( sourceId, x, y, z ) {
   var url = "/api/srtm?x="+tx+"&y="+ty+"&z="+z;
   var requestId = this.requestId(sourceId, x, y, z);
   this.LoadAPISource(url, requestId)
   
}

//----------------------------------------------------------------------------------------------------------------------//

SourceManager.prototype.LoadAPISource = function ( url, requestId ) {
   var me = this;
   
   this.requests[requestId] = $.ajax({
      type     : "GET",
      url      : url,
      dataType : "json",  
      timeout  : Maperial.tileDLTimeOut,
      success  : function(data) {
         if ( ! data ) {
            me.errors[requestId] = true;
         }
         else {
            me.data[requestId] = data;
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

SourceManager.prototype.LoadImage = function ( sourceId, x, y, z ) {
   
   var me         = this;   
   var url        = this.getImageURL(sourceId, x, y, z);
   var requestId  = this.requestId(sourceId, x, y, z);

   this.requests[requestId] = new Image();

   //http://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
   this.requests[requestId].crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'

   this.requests[requestId].onload = function (oEvent) {      
      var img                 = me.requests[requestId]
      me.errors[requestId]    = false;
      me.complete[requestId]  = true;
      me.data[requestId]      = img;
   };

   this.requests[requestId].onerror = function (oEvent) {
      me.errors[requestId]    = true;
      me.complete[requestId]  = true;
   }

   this.requests[requestId].abort = function () {
      me.requests[requestId].src = ""
   }

   this.requests[requestId].src = url;
}

//----------------------------------------------------------------------------------------------------------------------//

SourceManager.prototype.LoadRaster = function ( source, x, y, z ) {

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

      me.errors[requestId] = arrayBuffer == null;
      me.complete[requestId]  = true;
      me.data[requestId]  = arrayBuffer;
      
      $(window).trigger(MaperialEvents.SOURCE_READY, [source, me.data[requestId], x, y, z])
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

SourceManager.prototype.getData = function ( source, x, y, z ) {
   var requestId = this.requestId(source, x, y, z);
   return this.data[requestId];
}

//-------------------------------------------//
//
//SourceManager.prototype.getURL = function (source, tx, ty, z) {
//
//   switch(source.type){
//
//      case Source.MaperialOSM:
//         return Maperial.tileURL + "/api/tile?x="+tx+"&y="+ty+"&z="+z;
//
//      case Source.SRTM:
//         return Maperial.tileURL + "/api/srtm?x="+tx+"&y="+ty+"&z="+z;
//         
//      case Source.Raster:
//         return Maperial.tileURL + "/api/tile/"+source.params.rasterUID+"?x="+tx+"&y="+ty+"&z="+z;
//
//      case Source.Images:
//         return this.getImageURL(source, tx, ty, z)
//
//      case Source.WMS:
//         return this.getWMSURL(source, tx, ty, z)
//   }
//}


SourceManager.prototype.getImageURL = function (sourceId, tx, ty, z) {

   var gty = (Math.pow ( 2,z ) - 1) - ty;
   var server = ["a", "b", "c", "d"];
   
   switch (sourceId) {
      case Source.IMAGES_MAPQUEST : // need to check http://developer.mapquest.com/web/products/open/map
         var r = utils.random1(4);
         return "http://otile"+r+".mqcdn.com/tiles/1.0.0/osm/"+z+"/"+tx+"/"+gty+".png";
         break;
   
       case Source.IMAGES_MAPQUEST_SATELLITE : // need to check http://developer.mapquest.com/web/products/open/map
          var r = utils.random1(4);
          return "http://otile"+r+".mqcdn.com/tiles/1.0.0/sat/"+z+"/"+tx+"/"+gty+".png";
   

       case Source.IMAGES_OCM_CYCLE :
          var s = utils.random0(2);
          return "http://"+server[s]+".tile.opencyclemap.org/cycle/"+z+"/"+tx+"/"+gty+".png";

       case Source.IMAGES_OCM_TRANSPORT :
          var s = utils.random0(2);
          return "http://"+server[s]+".tile2.opencyclemap.org/transport/"+z+"/"+tx+"/"+gty+".png";
       
       case Source.IMAGES_OCM_LANDSCAPE :
          var s = utils.random0(2);
          return "http://"+server[s]+".tile3.opencyclemap.org/landscape/"+z+"/"+tx+"/"+gty+".png";



       case Source.IMAGES_STAMEN_WATERCOLOR :
          var s = utils.random0(3);
          return "http://"+server[s]+".tile.stamen.com/watercolor/"+z+"/"+tx+"/"+gty+".jpg"    
       
       case Source.IMAGES_STAMEN_TERRAIN : // US only
          var s = utils.random0(3);
          return "http://"+server[s]+".tile.stamen.com/terrain/"+z+"/"+tx+"/"+gty+".jpg"
       
       case Source.IMAGES_STAMEN_TONER :
          var s = utils.random0(3);
          return "http://"+server[s]+".tile.stamen.com/toner/"+z+"/"+tx+"/"+gty+".png"
  
       case Source.IMAGES_STAMEN_TONER_BG :
          var s = utils.random0(3);
          return "http://"+server[s]+".tile.stamen.com/toner-background/"+z+"/"+tx+"/"+gty+".png"
   
         
      case Source.IMAGES_OSM:  // http://wiki.openstreetmap.org/wiki/Tile_usage_policy
      default :
         var s = utils.random0(2);
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
SourceManager.prototype.getWMSURL = function (source, tx, ty, z) {
   
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
         
      default :
         var topLeft       = topLeftM;
         var bottomRight   = bottomRightM;
      
         return(source.params.src + "&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize)
         
   }
}

//------------------------------------------------------------------//

module.exports = SourceManager;

},{"../../../tools/utils.js":41}],4:[function(_dereq_,module,exports){
//------------------------------------------------------------------//

var VectorialStyle     = _dereq_('../models/vectorial-style.js'),
    Style              = _dereq_('../models/style.js');

//---------------------------------------------------------------------------//

function StyleManager(){
   this.styles = {};

   window.maperialStyles   = window.maperialStyles || {};  // cache containing all previously loaded styles
   window.maperialSymb     = window.maperialSymb   || {};  
   window.maperialFont     = window.maperialFont   || {};
}

//---------------------------------------------------------------------------//

StyleManager.prototype.getStyle = function(uid){
   return window.maperialStyles[uid];
}

StyleManager.prototype.addStyle = function ( style ) {
   window.maperialStyles[style.uid] = style;
}

//---------------------------------------------------------------------------//

StyleManager.prototype.createCustomStyle = function ( params ) {

   var style = new VectorialStyle({
         type              : Style.Custom,
         symbol            : params.symbol,
         horizontalAlign   : params.horizontalAlign,
         verticalAlign     : params.verticalAlign,
      });

   this.addStyle(style);
   return style;
}

//---------------------------------------------------------------------------//

StyleManager.prototype.getSymbURL = function(name) {
   return Maperial.staticURL + "/" + name;
}

StyleManager.prototype.getFontURL = function(name) {
   return Maperial.staticURL + "/font/" + name.replace(" ","_") + "_400.font.js";
}

//---------------------------------------------------------------------------//

StyleManager.prototype.LoadFontList = function(fontList,next) {
   var loaded   = 0;
   var nbToLoad = Object.keys(fontList).length;
   
   if ( nbToLoad == 0 )  {
      next();
      return;
   }

   for ( var key in fontList ) {
      if ( key in window.maperialFont ) {
         loaded = loaded + 1
         if ( loaded == nbToLoad ) next(); 
         continue
      }
      //
      url = this.getFontURL(key)
      var req = $.ajax({  
         type: "GET",  
         url: url,
         dataType : "script",
         success: function (_data) {
            window.maperialFont[key] = true;
            loaded = loaded + 1
            if ( loaded == nbToLoad ) next(); 
         },
         error : function() {
            window.maperialFont[key] = false;
            loaded = loaded + 1
            if ( loaded == nbToLoad ) next(); 
         }
      });
   }
}

//---------------------------------------------------------------------------//

StyleManager.prototype.LoadSymbList = function(symbList,next) {
   var loaded   = 0;
   var nbToLoad = Object.keys(symbList).length;
   
   if ( nbToLoad == 0 )  {
      next();
      return;
   }
   
   for ( var key in symbList ) {
      if ( key in window.maperialSymb ){
         loaded = loaded + 1
         if ( loaded == nbToLoad ) next(); 
         continue
      }
      url = this.getSymbURL(key)
      window.maperialSymb[key] = new Object()
      //window.maperialSymb[key].data = null;
      
      var _key = key;
      if ( key.indexOf(".svg") == -1 )  {
         window.maperialSymb[key].type = "img";
         var req = new Image();
         req._key = _key;
         //http://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
         req.crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'
         req.onload = function (oEvent) {    
            window.maperialSymb[this._key].data = this;
            loaded = loaded + 1
            if ( loaded == nbToLoad ) next();
         };
         req.onerror = function (oEvent) {
            loaded = loaded + 1
            if ( loaded == nbToLoad ) next();
         }
         req.src = url;
      }
      else {
         window.maperialSymb[key].type = "svg";
         
         var req = $.ajax({  
            type: "GET",  
            _key : _key ,
            url: url,
            dataType : "xml",//"text",
            success: function (_data) {
               window.maperialSymb[this._key].data = _data
               loaded = loaded + 1
               if ( loaded == nbToLoad ) next();
            },
            error : function() {
               loaded = loaded + 1
               if ( loaded == nbToLoad ) next();
            }
         });
      }
   }
}

//------------------------------------------------------------------//

module.exports = StyleManager;

},{"../models/style.js":17,"../models/vectorial-style.js":18}],5:[function(_dereq_,module,exports){
//------------------------------------------------------------------//

var CoordinateSystem = _dereq_('../libs/coordinate-system.js');

//------------------------------------------------------------------//

function MapContext (mapView) {
   
   this.mapView            = mapView
   
   this.assets             = null
   this.coordS             = new CoordinateSystem ( Maperial.tileSize );

   this.centerM            = this.coordS.LatLonToMeters( this.startLatitude() , this.startLongitude() );
   this.mouseM             = this.centerM;     // Mouse coordinates in meters
   this.mouseP             = null;             // Mouse coordinates inside the canvas
   this.zoom               = this.startZoom();

}

//-----------------------------------------------------------------------------------//

MapContext.prototype.startZoom = function() {
   
   // Options
   if(this.mapView.options.defaultZoom)
      return this.mapView.options.defaultZoom;
   
   // Default
   else
      return Maperial.DEFAULT_ZOOM;
   
}

//------------------------------------------------------------------//

MapContext.prototype.startLatitude = function() {
   
   // BoundingBox
   if(this.latMin)
      return (this.latMin + this.latMax)/2;
   
   // Options
   else if(this.mapView.options.latitude) 
      return this.mapView.options.latitude;
   
   // Default
   else         
      return Maperial.DEFAULT_LATITUDE;
   
}

//------------------------------------------------------------------//

MapContext.prototype.startLongitude = function() {
   
   // BoundingBox
   if(this.lonMin)       
      return (this.lonMin + this.lonMax)/2;
   
   // Options
   else if(this.mapView.options.longitude)     
      return this.mapView.options.longitude;
   
   // Default
   else                                
      return Maperial.DEFAULT_LONGITUDE;
   
}

//------------------------------------------------------------------//

module.exports = MapContext;
},{"../libs/coordinate-system.js":34}],6:[function(_dereq_,module,exports){
//------------------------------------------------------------------//

var MapContext              = _dereq_('./map-context.js'),
    MouseListener           = _dereq_('./mouse-listener.js'),
    MapRenderer             = _dereq_('./rendering/map-renderer.js'),
    LayerManager            = _dereq_('./managers/layer-manager.js'),
    Layer                   = _dereq_('./models/layer.js'),
    utils                   = _dereq_('../../tools/utils.js');

//------------------------------------------------------------------//

function MapView(maperial, options){

   //--------------------------------------------------------------//
   
   console.log("  prepare MapView : " + options.container.id);
   
   //--------------------------------------------------------------//

   this.maperial           = maperial;
   this.options            = options;
   this.id                 = utils.generateUID() + "_" + this.options.container.id;
   this.type               = options.type;
   
   //--------------------------------------------------------------//

   this.prepareContainer();
   new MouseListener(this);
   
   //--------------------------------------------------------------//

   this.layers             = [] // array to use push and splice : index is useful here
   this.tiles              = {} // hashmap : tiles[key] = tile
   this.dynamicalRenderers = {} // hashmap : dynamicalRenderers[dynamicalData.id] = dynamicalRenderer
   
   this.context            = new MapContext(this);
   
   this.mapRenderer        = new MapRenderer(this);
   this.layerManager       = new LayerManager(this);

   //--------------------------------------------------------------//
   
   this.shaders            = [Maperial.AlphaClip, Maperial.AlphaBlend, Maperial.MulBlend];

};

//------------------------------------------------------------------//
// Container
//------------------------------------------------------------------//

MapView.prototype.prepareContainer = function ()   {
   
   this.canvas = document.createElement('canvas');
   this.canvas.className = this.type;
   this.options.container.appendChild(this.canvas); 

   this.width       = this.options.container.clientWidth;
   this.height      = this.options.container.clientHeight;
   
   this.setCanvasSize();
}

MapView.prototype.setCanvasSize = function() {
    this.canvas.width = this.width;   
    this.canvas.height = this.height;   
}

//------------------------------------------------------------------//
// API
//------------------------------------------------------------------//

MapView.prototype.addImageLayer = function (sourceId)   {
   this.layerManager.addLayer(Layer.Images, sourceId)
}

//------------------------------------------------------------------//

MapView.prototype.addOSMLayer = function (styleId)   {
   
   if(!styleId)
      styleId = Maperial.DEFAULT_STYLE_UID
      
}

//------------------------------------------------------------------//

MapView.prototype.addDynamicalLayer = function (dynamicalData, options)   {
   
   //-------------------------------------------
   // Checking options
   
   var options = utils.prepareOptions(options, "style");
   if(!options){
      console.log("Wrong call to addDynamicalLayer. Check the options");
   }
   
   //-------------------------------------------
   // Proceed

   this.layerManager.addLayer(Layer.Dynamical, {
      mapView           : this, 
      dynamicalData     : dynamicalData, 
      style             : options.style
   });

}

//------------------------------------------------------------------//

MapView.prototype.addHeatmapLayer = function (heatmapData, options)   {
    
    //-------------------------------------------
    // Checking options
    
    var options = utils.prepareOptions(options, "colorbar");
    if(!options){
        console.log("Wrong call to addHeatmapLayer. Check the options");
    }
    
    //-------------------------------------------
    // Proceed
    
    this.layerManager.addLayer(Layer.Heat, {
        mapView        : this, 
        heatmapData    : heatmapData, 
        colorbar       : options.colorbar,
        options        : options
    });
    
}

//------------------------------------------------------------------//

MapView.prototype.addRasterLayer      = function (options)   {}
MapView.prototype.addShadeLayer       = function (options)   {}
MapView.prototype.addWMSLayer         = function (options)   {}

//------------------------------------------------------------------//

module.exports = MapView;

},{"../../tools/utils.js":41,"./managers/layer-manager.js":2,"./map-context.js":5,"./models/layer.js":12,"./mouse-listener.js":19,"./rendering/map-renderer.js":28}],7:[function(_dereq_,module,exports){
//------------------------------------------------------------------//

var MapView                 = _dereq_('./map-view.js'),
    SourceManager           = _dereq_('./managers/source-manager.js'),
    StyleManager            = _dereq_('./managers/style-manager.js'),
    ColorbarManager         = _dereq_('./managers/colorbar-manager.js'),
    DynamicalData           = _dereq_('./models/data/dynamical-data.js'),
    HeatmapData             = _dereq_('./models/data/heatmap-data.js'),
    Source                  = _dereq_('./models/source.js'),
    utils                   = _dereq_('../../tools/utils.js');

//------------------------------------------------------------------//

function Maperial(options){
   console.log("-----------------------");
   console.log("Creating a Maperial");
   this.options   = options;
   this.views     = {};
   
   /* global content */
   window.sourceManager    = window.sourceManager     || new SourceManager();
   window.styleManager     = window.styleManager      || new StyleManager();
   window.colorbarManager  = window.colorbarManager   || new ColorbarManager();
   
   /* global entities for API*/
   window.DynamicalData = DynamicalData;
   window.HeatmapData   = HeatmapData;
   window.Source        = Source;
};

//------------------------------------------------------------------//
//Views types
//TYPE = css class

Maperial.MAIN                    = "maperial-main";
Maperial.ANCHOR                  = "maperial-anchor";
Maperial.LENS                    = "maperial-lens";      // camera centered on what is under it
Maperial.MINIFIER                = "maperial-minifier";   // camera centered on the parent's center
Maperial.MAGNIFIER               = "maperial-magnifier";  // camera centered on what is under the mouse

//------------------------------------------------------------------//
//Vectorial layers types

Maperial.OSM                     = "tiles";   
Maperial.VECTORIAL_DATA          = "data";

//------------------------------------------------------------------//

Maperial.staticURL              = (window.location.hostname.indexOf("localhost") !== -1) ? 'http://static.maperial.localhost' : 'http://static.maperial.com';

Maperial.apiURL                 = 'http://api.maperial.com';
Maperial.tileURL                = 'http://api.maperial.com';

//------------------------------------------------------------------//

Maperial.DEFAULT_ZOOM           = 10;
Maperial.DEFAULT_LATITUDE       = 48.813;
Maperial.DEFAULT_LONGITUDE      = 2.313;

//Clermont City
//Maperial.DEFAULT_LATITUDE       = 45.779017;
//Maperial.DEFAULT_LONGITUDE      = 3.10617;

//------------------------------------------------------------------//

Maperial.bgdimg                 = "symbols/water.png";

Maperial.refreshRate            = 1000/30;   // ms
Maperial.tileDLTimeOut          = 60000;     // ms
Maperial.tileSize               = 256;

Maperial.autoMoveSpeedRate      = 0.2;
Maperial.autoMoveMillis         = 700;
Maperial.autoMoveDeceleration   = 0.005;
Maperial.autoMoveAnalyseSize    = 10;

Maperial.DEFAULT_STYLE_UID      = "1_style_13ed75438c8b2ed8914";
Maperial.DEFAULT_COLORBAR_UID   = "1_colorbar_13c630ec3a5068919c3";

Maperial.AlphaClip              = "AlphaClip";
Maperial.AlphaBlend             = "AlphaBlend";
Maperial.MulBlend               = "MulBlend";

Maperial.globalDataCpt          = 0;

//------------------------------------------------------------------//
// API
//------------------------------------------------------------------//

/**
 * options:
 * 
 *    # mandatory ----------
 *       
 *       view : "div.id"  (can be used as only param)
 *       
 *    # others -------------
 *    
 *       type
 *          Maperial.MAIN (default)
 *          Maperial.ANCHOR
 *          Maperial.LENS
 *          Maperial.MINIFIER
 *          Maperial.MAGNIFIER
 *       
 *       defaultZoom
 *          default Maperial.DEFAULT_ZOOM
 *       
 *       latitude 
 *          default Maperial.DEFAULT_LATITUDE
 *
 *       longitude
 *          default Maperial.DEFAULT_LONGITUDE
 *       
 */
Maperial.prototype.addView = function (options) {

   //-------------------------------------------
   // Checking options
   
   var options = utils.prepareOptions(options, "container");
   if(!options){
      console.log("Wrong call to createView. Check the options");
   }

   //-------------------------------------------
   // Checking view 

   console.log("Adding view in container " + options.container  + "...");
   
   if(document.getElementById(options.container) == null){
      console.log("Container " + options.container  + " could not be found");
      return;
   }
   
   options.container = document.getElementById(options.container);

   //-------------------------------------------
   // Set defaults

   if(options.type === undefined){
      options.type = Maperial.MAIN;
   }
   
   if(options.latitude === undefined){
      options.latitude = Maperial.DEFAULT_LATITUDE;
   }
   
   if(options.longitude === undefined){
      options.longitude = Maperial.DEFAULT_LONGITUDE;
   }

   //-------------------------------------------
   // Proceed
   
   var view =  new MapView(this, options);
   this.views[view.id] = view;
   
   return view;
}

//------------------------------------------------------------------//

module.exports = Maperial;

},{"../../tools/utils.js":41,"./managers/colorbar-manager.js":1,"./managers/source-manager.js":3,"./managers/style-manager.js":4,"./map-view.js":6,"./models/data/dynamical-data.js":9,"./models/data/heatmap-data.js":10,"./models/source.js":16}],8:[function(_dereq_,module,exports){

var utils       = _dereq_('../../../../tools/utils.js'),
    RGBAColor   = _dereq_('../../../libs/rgba-color.js');
    
//-----------------------------------------------------------------------------------//

function ColorbarData (options) {
   this.uid                = utils.generateUID();
   this.version            = 0;
   
   this.data               = options.data               ||  {};
   this.beginAlphaAtZero   = options.beginAlphaAtZero   || false;
}

//-----------------------------------------------------------------------------------//

ColorbarData.prototype.IsValid = function (  ) {
   var rTmp = Object.keys(this.data);
   return rTmp.length >= 2
}

ColorbarData.prototype.FromJson = function ( inJson ) {
   this.data = {} // reset ...
   for (var i in inJson) {
      // Constant or GradiantColor ???
      this.Set ( i , new GradiantColor (inJson[i].r , inJson[i].g , inJson[i].b , inJson[i].a) )
   }
}

ColorbarData.prototype.ToJson = function  (  ) {
   var r = {}
   for (var i in this.data){
      // Constant or GradiantColor ???
      r[i] = {"r":this.data[i].r,"g":this.data[i].g,"b":this.data[i].b,"a":this.data[i].a}
   }
   return r;
}

ColorbarData.prototype.SetMin  = function( inV , inC ){
   if (typeof (inV) == "undefined")
      return;
   if (typeof (inC) == "undefined")
      return;
   //var k = Object.keys(this.data)
   toRemove = [];
   for ( var i in this.data ) {
      if ( parseFloat(i) <= parseFloat(inV) ) {
         toRemove.push(i);
      }
   }
   for (var i = 0 ; i < toRemove.lenght ; i++) {
      delete this.data[toRemove[i]];
   }
   
   this.data[inV] = inC;

   this.version ++;
}

ColorbarData.prototype.SetMax  = function( inV , inC ){

   if (typeof (inV) == "undefined")
      return ;

   if (typeof (inC) == "undefined")
      return; 

   for ( var i in this.data ) {
      if ( parseFloat(i) >= parseFloat(inV) ) {
         toRemove.push(i)
      }
   }

   for (var i = 0 ; i < toRemove.lenght ; i++) {
      delete this.data[toRemove[i]]
   }

   this.data[inV] = inC;

   this.version ++;
}

ColorbarData.prototype.Set     = function( inV , inC ){
   if (typeof (inV) == "undefined")
      return;
   if (typeof (inC) == "undefined")
      return;
   this.data[inV] = inC;

   this.version ++;
}

ColorbarData.prototype.Indexes = function(  ){
   var rTmp = Object.keys(this.data);
   var r    = []
   for (var i = 0 ; i < rTmp.length ; ++i) {
      r.push ( parseFloat( rTmp[i] ) ) 
   }
   return r;
}

ColorbarData.prototype.Remove  = function( inV ){
   if ( inV in this.data){
      delete this.data[inV]
      this.version ++;
   }

}

ColorbarData.prototype.Move    = function( inVOld, inVNew ){
   if ( inV in this.data) {
      var c = this.data[inVOld]
      delete this.data[inVOld]
      this.data[inVNew] = c
   }
}

ColorbarData.prototype.GetByKey    = function( inV ){ 
   if ( inV in this.data )
      return this.data[inV]
   return null
}

ColorbarData.prototype.GetBounds     = function(  ){
   var k = Object.keys(this.data); 
   
   if (k.length < 2)
      return [0.0,0.0]; //Invalid

   for (var i = 0 ; i < k.length ; ++ i ){
      k[i] = parseFloat(k[i]);
   }
   k.sort()
   
   var min = k[0];
   var max = k[k.length-1];
   return [min,max];
}

ColorbarData.prototype.Get     = function( inT ){ //[0.0,1.0]

   var k = Object.keys(this.data); 

   if (k.length < 2)
      return null; //Invalid
   
   var min = parseFloat(k[0]);
   var max = parseFloat(k[k.length-1]);
   var v   = (max - min) * inT + min;
   if (v < min) v = min;
   if (v > max) v = max;
   
   var isStep = false;
   for(var key in this.data){
      if(parseFloat(key) == v){
         isStep   = true;
         v        = key;
         break;
      }
   }
   
   if ( isStep ){
      if ( parseFloat(v) == min && this.beginAlphaAtZero ){
         return new RGBAColor ( this.data[v].r ,  this.data[v].g , this.data[v].b , 0 )
      }
      else {
         return new RGBAColor ( this.data[v].r ,  this.data[v].g , this.data[v].b , this.data[v].a )
      }
   }
   else{
      var keyUp, keyDown;
      
      for ( var i = 1 ; i < k.length ; i++ ) {
         if ( v < k[i] ) {
            keyUp    = k[i] 
            keyDown  = k[i-1] 
            break;
         }
      }   
      if (!keyUp) 
         return null //Error
         
      var c0 = this.data[keyDown];
      var c1 = this.data[keyUp];
      
      var v0 = parseFloat(keyDown);
      var v1 = parseFloat(keyUp);
      
      var t = (v - v0) / (v1 - v0);
      
      return c1.GetWith(c0,t);
   }
   
}

//------------------------------------------------------------------//

module.exports = ColorbarData;
},{"../../../../tools/utils.js":41,"../../../libs/rgba-color.js":40}],9:[function(_dereq_,module,exports){

var utils       = _dereq_('../../../../tools/utils.js'),
    Proj4js     = _dereq_('../../../libs/proj4js-compressed.js');

//----------------------------------------------------------------------------------//

function DynamicalData  () {
   
   this.points             = {};
   this.id                 = utils.generateUID();
   this.version            = 0;
   
   this.minx               = 100000000000;
   this.maxx               = -100000000000;
   this.miny               = 100000000000;
   this.maxy               = -100000000000;
   this.srcPrj             = new Proj4js.Proj('EPSG:4326'  );      //source coordinates will be in Longitude/Latitude
   this.dstPrj             = new Proj4js.Proj('EPSG:900913');     //destination coordinates google
}

//----------------------------------------------------------------------------------//

DynamicalData.prototype.addPoint = function ( latitude, longitude, data) {

    var id   = utils.generateUID(),
        p    = new Proj4js.Point(longitude, latitude);
    
   Proj4js.transform(this.srcPrj, this.dstPrj, p);
   this.minx = Math.min (this.minx , p.x);
   this.maxx = Math.max (this.maxx , p.x);
   this.miny = Math.min (this.miny , p.y);
   this.maxy = Math.max (this.maxy , p.y);

   var point = {
         id       : id,
         lat      : latitude,
         lon      : longitude,
         x        : p.x,
         y        : p.y,
         data     : data,
   };

   this.points[id] = point;
   this.version ++;
   
   return point;
}

//----------------------------------------------------------------------------------//

DynamicalData.prototype.removePoint = function (point) {
   if(point){
       delete this.points[point.id];
       this.version ++;
   }
}

//----------------------------------------------------------------------------------//

DynamicalData.prototype.removeAll = function () {
    this.points = {};
    this.version ++;
}

//------------------------------------------------------------------//

module.exports = DynamicalData;
},{"../../../../tools/utils.js":41,"../../../libs/proj4js-compressed.js":39}],10:[function(_dereq_,module,exports){

var utils       = _dereq_('../../../../tools/utils.js'),
    Proj4js     = _dereq_('../../../libs/proj4js-compressed.js');

//----------------------------------------------------------------------------------//

function HeatmapData  () {
   
   this.points             = {},
   this.content            = {"h":Maperial.tileSize , "w":Maperial.tileSize , "l" : [] }
   this.id                 = utils.generateUID();
   this.version            = 0;
   this.nbPoints           = 0;
   
   this.minx               = 100000000000;
   this.maxx               = -100000000000;
   this.miny               = 100000000000;
   this.maxy               = -100000000000;
   this.srcPrj             = new Proj4js.Proj('EPSG:4326'  );      //source coordinates will be in Longitude/Latitude
   this.dstPrj             = new Proj4js.Proj('EPSG:900913');     //destination coordinates google
}

//----------------------------------------------------------------------------------//

HeatmapData.prototype.addPoint = function ( latitude, longitude, diameter, scale) {

   var id   = utils.generateUID(),
       p    = new Proj4js.Point(longitude, latitude),
       attr = {
         diameter : diameter, 
         scale    : scale
       };
   
   Proj4js.transform(this.srcPrj, this.dstPrj, p);
   this.minx = Math.min (this.minx , p.x);
   this.maxx = Math.max (this.maxx , p.x);
   this.miny = Math.min (this.miny , p.y);
   this.maxy = Math.max (this.maxy , p.y);
//
//   var point = {
//         id       : id,
//         lat      : latitude,
//         lon      : longitude,
//         x        : p.x,
//         y        : p.y,
//         diameter : diameter,
//         scale    : scale,
//   };

   var point = {'c':null,'g':[[[p.x,p.y]]],'a':[attr]}  ;

   this.content.l.push (point) ;
   this.points[id] = point;
   this.version ++;
   this.nbPoints ++;
   
   return point;
}

//----------------------------------------------------------------------------------//

HeatmapData.prototype.removePoint = function (point) {
    if(point){
        delete this.points[point.id];
        this.version ++;
        this.nbPoints --;
    }
}

//------------------------------------------------------------------//

module.exports = HeatmapData;

},{"../../../../tools/utils.js":41,"../../../libs/proj4js-compressed.js":39}],11:[function(_dereq_,module,exports){
//-----------------------------------------------------------------------------------//

function ImageData (sourceId, x, y, z) {
   
   this.sourceId  = sourceId;
   this.x         = x;
   this.y         = y;
   this.z         = z;

   this.content   = null;

   sourceManager.LoadImage(sourceId, x, y, z)
}

//-----------------------------------------------------------------------------------//

ImageData.prototype.tryToFillContent = function(){
   this.content = sourceManager.getData(this.sourceId, this.x, this.y, this.z);
}

ImageData.prototype.release = function(){
   sourceManager.release(this.sourceId, this.x, this.y, this.z);
}

//------------------------------------------------------------------//

module.exports = ImageData;
},{}],12:[function(_dereq_,module,exports){
//-----------------------------------------------------------------------------------//

function Layer(){}

//------------------------------------------------------------------//
//Layer Types

Layer.Dynamical   = "Layer.Dynamical";
Layer.Heat        = "Layer.Heat";
Layer.Vectorial   = "Layer.Vectorial";
Layer.Raster      = "Layer.Raster";
Layer.Images      = "Layer.Images";
Layer.WMS         = "Layer.WMS";
Layer.SRTM        = "Layer.SRTM";
Layer.Shade       = "Layer.Shade";

//------------------------------------------------------------------//

module.exports = Layer;

},{}],13:[function(_dereq_,module,exports){

var utils       = _dereq_('../../../../tools/utils.js'),
    Layer       = _dereq_('../layer.js');

//-----------------------------------------------------------------------------------//

function DynamicalLayer (params, composition) {
   this.id                 = utils.generateUID();
   this.type               = Layer.Dynamical;
   this.mapView            = params.mapView;
   this.dynamicalData      = params.dynamicalData;

   this.style              = styleManager.createCustomStyle(params.style);
   this.composition        = composition;

   this.renderer           = this.mapView.mapRenderer.addDynamicalRenderer(this.dynamicalData, this.style);
}

//-----------------------------------------------------------------------------------//

module.exports = DynamicalLayer;
},{"../../../../tools/utils.js":41,"../layer.js":12}],14:[function(_dereq_,module,exports){

var utils       = _dereq_('../../../../tools/utils.js'),
    Layer       = _dereq_('../layer.js');

//-----------------------------------------------------------------------------------//

function HeatmapLayer (params, composition) {
   this.id                 = utils.generateUID();
   this.type               = Layer.Heat;
   this.mapView            = params.mapView;
   this.heatmapData        = params.heatmapData;
   this.colorbar           = params.colorbar;
   this.options            = params.options;
   
   this.composition        = composition;
   
   this.renderer           = this.mapView.mapRenderer.addHeatmapRenderer(this.heatmapData, this.colorbar, this.options);
}

//-----------------------------------------------------------------------------------//

module.exports = HeatmapLayer;

//-----------------------------------------------------------------------------------//
},{"../../../../tools/utils.js":41,"../layer.js":12}],15:[function(_dereq_,module,exports){

var utils       = _dereq_('../../../../tools/utils.js'),
    Layer       = _dereq_('../layer.js');

//-----------------------------------------------------------------------------------//

function ImageLayer (sourceId, composition) {
   
   this.id              = utils.generateUID();
   this.type            = Layer.Images;
   this.sourceId        = sourceId;
   this.composition     = composition;
   
}

//-----------------------------------------------------------------------------------//

module.exports = ImageLayer;

},{"../../../../tools/utils.js":41,"../layer.js":12}],16:[function(_dereq_,module,exports){

//-----------------------------------------------------------------------------------//

function Source (id, type, params) {
   this.id     = id;
   this.type   = type;
   this.params = params;
}

//-----------------------------------------------------------------------------------//
// MaperialOSM public default styles

Source.MAPERIAL_BROWNIE             = "maperial.brownie";
Source.MAPERIAL_CLASSIC             = "maperial.classic";
Source.MAPERIAL_COOKIES             = "maperial.cookies";
Source.MAPERIAL_YELLOW              = "maperial.yellow";
Source.MAPERIAL_FLUO                = "maperial.fluo";
Source.MAPERIAL_GREEN               = "maperial.green";
Source.MAPERIAL_LIGHT               = "maperial.light";
Source.MAPERIAL_PINK                = "maperial.pink";

Source.MAPERIAL_BROWNIE_ID          = "1_style_13ed76485efa16fefdd";
Source.MAPERIAL_CLASSIC_ID          = "1_style_13ed75438c8b2ed8914";
Source.MAPERIAL_COOKIES_ID          = "1_style_13e79200fc1adea5718";
Source.MAPERIAL_FLUO_ID             = "1_style_13ed736f4d4bdf58b0e";
Source.MAPERIAL_GREEN_ID            = "1_style_13ed6abc87adcbf3937";
Source.MAPERIAL_LIGHT_ID            = "1_style_13dd0e7695bfc2941e7";
Source.MAPERIAL_PINK_ID             = "1_style_13ed780ed7174481e7e";
Source.MAPERIAL_YELLOW_ID           = "1_style_13ea3369f7dbbf63b42";

//-----------------------------------------------------------------------------------//
// Images.src

Source.IMAGES_MAPQUEST              = "images.mapquest";
Source.IMAGES_MAPQUEST_SATELLITE    = "images.mapquest.satellite";
Source.IMAGES_OSM                   = "images.osm";

//http://www.thunderforest.com/ 
Source.IMAGES_OCM_CYCLE             = "images.ocm.cycle";
Source.IMAGES_OCM_TRANSPORT         = "images.ocm.transport";
Source.IMAGES_OCM_LANDSCAPE         = "images.ocm.landscape";

// http://maps.stamen.com/
// Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.
Source.IMAGES_STAMEN_WATERCOLOR     = "images.stamen.watercolor";
Source.IMAGES_STAMEN_TERRAIN        = "images.stamen.terrain";
Source.IMAGES_STAMEN_TONER          = "images.stamen.toner";
Source.IMAGES_STAMEN_TONER_BG       = "images.stamen.toner-background";

// API for business ?
// &style= 5,3 ==> possibilité plein de modifs !
//Source.IMAGES_GOOGLE_SATELLITE      = "images.google.satellite";
//Source.IMAGES_GOOGLE_TERRAIN        = "images.google.terrain";

//-----------------------------------------------------------------------------------//
// WMS.src

Source.WMS_BRETAGNECANTONS          = "wms.bretagnecantons";
Source.WMS_FRANCECOURSDEAU          = "wms.francecoursdeau";
Source.WMS_SOLS_ILEETVILAINE        = "wms.sols_ileetvilaine";
Source.WMS_CORINE_LAND_COVER        = "wms.corine_land_cover";

//-----------------------------------------------------------------------------------//

module.exports = Source;
},{}],17:[function(_dereq_,module,exports){
//-----------------------------------------------------------------------------------//

function Style(){}

//------------------------------------------------------------------//

Style.Vectorial   = "Style.Vectorial";
Style.Custom      = "Style.Custom";

//------------------------------------------------------------------//

module.exports = Style;

},{}],18:[function(_dereq_,module,exports){
//------------------------------------------------------------------//

var Style               = _dereq_('./style.js'),
    PointSymbolizer     = _dereq_('../rendering/symbolizers/point-symbolizer.js'),
    utils               = _dereq_('../../../tools/utils.js');

//-----------------------------------------------------------------------------------//

function VectorialStyle (options) {   
   this.uid                = utils.generateUID();
   
   this.type               = options.type;
   this.symbol             = options.symbol;
   this.horizontalAlign    = options.horizontalAlign  || "center";
   this.verticalAlign      = options.verticalAlign    || "bottom";

   this.content            = {};
   this.curId              = 0;

   var ps = new PointSymbolizer(this.symbol);
   ps.Alignement(this.horizontalAlign, this.verticalAlign);

   this.symbId = this.AddSymbolizer ( ps , 18 , 0  );
   
   // register 
   window.maperialStyles[this.uid] = this
}

//-----------------------------------------------------------------------------------//

VectorialStyle.prototype.AddSymbolizer = function( inSymb , inZMin, inZMax , inId ) {
   // only apply on custom style !
   if ( this.type != Style.Custom )
      return null;
      
   if (typeof inId === "undefined") {   
      var idStr            = "" + this.curId;
      idStr                = new Array(3 - idStr.length + 1).join('0') + idStr;
      this.curId           = this.curId + 1;
      
      //var tmp              = jQuery.extend({}, inSymb);
      this.content[idStr]  = {
         visible  : true,
         layer    : "back",
         s        : [
            {
               zmin  : inZMin,
               zmax  : inZMax,
               s     : [inSymb],
            }
         ]
      }
      return idStr;
   }
   else {
      if ( ! ( inId in this.content ) )
         return null;
      this.content[inId].s.push (
         {
            zmin  : inZMin,
            zmax  : inZMax,
            s     : [inSymb],
         }
      )
   }
}

VectorialStyle.prototype.AddSymbsComposer = function( inSymbComp,inId) {
   // only apply on custom style !
   if ( this.type != Style.Custom )
      return null;

   if (typeof inId === "undefined") {   
      var idStr            = "" + this.curId;
      idStr                = new Array(3 - idStr.length + 1).join('0') + idStr;
      this.curId           = this.curId + 1;
      this.content[idStr]  = {
         visible  : true,
         layer    : "back",
         s        : [
            {
               zmin  : inSymbComp.zmin,
               zmax  : inSymbComp.zmax,
               s     : inSymbComp.symbs,
            }
         ]
      }
      return idStr;
   }
   else {
      if ( ! ( inId in this.content ) )
         return null;
      this.content[inId].s.push (
         {
            zmin  : inSymbComp.zmin,
            zmax  : inSymbComp.zmax,
            s     : inSymbComp.symbs,
         }
      )
   }
}

VectorialStyle.prototype.SetVisible = function( inId , visible) {
   if ( ! ( inId in this.content ) )
      return false;
   this.content[inId].visible = visible;
}

//------------------------------------------------------------------//

module.exports = VectorialStyle;

},{"../../../tools/utils.js":41,"../rendering/symbolizers/point-symbolizer.js":29,"./style.js":17}],19:[function(_dereq_,module,exports){
//---------------------------------------------------------------------------------------//

var Hammer      = _dereq_('../libs/hammer.js'),
utils       = _dereq_('../../tools/utils.js');

//---------------------------------------------------------------------------------------//

function MouseListener(mapView){

    console.log("  listening mouse...");

    this.mapView            = mapView;
    this.lastWheelMillis    = new Date().getTime();
    this.initListeners();
}

//---------------------------------------------------------------------------------------//

MouseListener.prototype.initListeners = function () {

    var mouse = this;

    switch(this.mapView.type){

        case Maperial.MAIN:
        case Maperial.ANCHOR:

            this.hammer             = new Hammer(this.mapView.canvas);
            this.hammer.drag        = this.drag.bind(this);

            this.hammer.on("drag", this.hammer.drag);

            //this.mapView.canvas.addEventListener("click", this.down        .bind(this));
            //this.mapView.canvas.addEventListener("click", this.down        .bind(this));

//          .mousedown  (  )
//          .mouseup    ( this.up          .bind(this) )
//          .mouseleave ( this.leave       .bind(this))
//          .mousemove  ( Utils.apply ( this , "move" ))
//          .dblclick   ( Utils.apply ( this , "doubleClick" ))
//          .bind('mousewheel', Utils.apply ( this , "wheel"))   
            break;

        case Maperial.LENS:
        case Maperial.MINIFIER:
        case Maperial.MAGNIFIER:
            this.context.mapCanvas
            .dblclick   ( Utils.apply ( this , "doubleClick" ))
            .bind('mousewheel', Utils.apply ( this , "wheelOnZoomer"))   
            break;
    }

}

//----------------------------------------------------------------------//

MouseListener.prototype.removeListeners = function () {

    this.hammer.off("drag", this.hammer.drag);

//  this.context.mapCanvas.off("mousedown");
//  this.context.mapCanvas.off("mouseup");
//  this.context.mapCanvas.off("mousemove");
//  this.context.mapCanvas.off("mouseleave");
//  this.context.mapCanvas.unbind('dblclick');  
//  this.context.mapCanvas.unbind('mousewheel');  
//  this.context.mapCanvas.unbind('wheelOnZoomer');  
}

//---------------------------------------------------------------------------------------//

MouseListener.prototype.down = function (event) {

    event.preventDefault();

    this.mouseDown = true;
    this.context.mapCanvas.trigger(MaperialEvents.MOUSE_DOWN);
}

MouseListener.prototype.leave = function (event) {
    if(this.mouseDown)
        this.up(event);
}

MouseListener.prototype.up = function (event) {
    this.context.mapCanvas.removeClass( 'movable' )
    this.mouseDown = false; 
    this.context.mapCanvas.trigger(MaperialEvents.MOUSE_UP);
}

MouseListener.prototype.drag = function (event) {

//  event.preventDefault();

    this.mapView.context.mouseP = utils.getPoint(event);
    this.mapView.context.mouseM = this.convertCanvasPointToMeters ( this.mapView.context.mouseP );

//  if (!this.mouseDown){
//  this.context.mapCanvas.trigger(MaperialEvents.UPDATE_LATLON);

//  $(window).trigger(MaperialEvents.MOUSE_MOVE, [this.mapView.map, this.mapView.name, this.mapView.type]);
//  }
//  else{
//  this.context.mapCanvas.addClass( 'movable' )
//  $(window).trigger(MaperialEvents.DRAGGING_MAP, [this.mapView.name]);
//  }
}

MouseListener.prototype.doubleClick = function (event) {

    if(!this.mapView.zoomable)
        return

        this.context.zoom = Math.min(18, this.context.zoom + 1);
    this.context.centerM = this.convertCanvasPointToMeters(this.context.mouseP);

    // refresh mouse
    this.context.mouseP = Utils.getPoint(event);
    this.context.mouseM = this.convertCanvasPointToMeters ( this.context.mouseP );

    this.mapView.refreshCurrentLatLon();

    $(window).trigger(MaperialEvents.ZOOM_TO_REFRESH, [this.mapView.map, this.mapView.name, this.mapView.type, this.context.zoom]);

}

//----------------------------------------------------------------------//

MouseListener.prototype.wheel = function (event, delta) {

    if(!this.mapView.zoomable)
        return

        event.preventDefault();

    if(this.hasJustWheeled())
        return;

    var previousZoom = this.context.zoom

    if (delta > 0) {
        this.context.zoom = Math.min(18, this.context.zoom + 1);
        this.context.centerM = this.convertCanvasPointToMeters(this.context.mouseP);
    }
    else if (delta < 0) {

        var centerP = this.context.coordS.MetersToPixels(this.context.centerM.x, this.context.centerM.y, this.context.zoom);
        var oldShiftP = new Point( this.context.mapCanvas.width()/2 - this.context.mouseP.x , this.context.mapCanvas.height()/2 - this.context.mouseP.y);

        this.context.zoom = Math.max(0, this.context.zoom - 1);

        var r = this.context.coordS.Resolution ( this.context.zoom );
        var newShiftM = new Point(oldShiftP.x * r, oldShiftP.y * r);
        this.context.centerM = new Point(this.context.mouseM.x + newShiftM.x, this.context.mouseM.y - newShiftM.y);
    }

    // refresh mouse
    this.context.mouseP = Utils.getPoint(event);
    this.context.mouseM = this.convertCanvasPointToMeters ( this.context.mouseP );

    this.mapView.refreshCurrentLatLon();

    $(window).trigger(MaperialEvents.ZOOM_TO_REFRESH, [this.mapView.map, this.mapView.name, this.mapView.type, this.context.zoom]);
}

//----------------------------------------------------------------------//

MouseListener.prototype.wheelOnZoomer = function (event, delta) {

    if(!this.mapView.zoomable)
        return

        event.preventDefault();

    if(this.hasJustWheeled() || delta == 0)
        return;

    this.context.zoom = Math.min(18, this.context.zoom + 1 * delta/Math.abs(delta));
    var mainZoom = this.mapView.maperial.getZoom(this.mapView.map)

    switch(this.mapView.type){
        case Maperial.LENS :
        case Maperial.MAGNIFIER : 
            if(this.context.zoom < mainZoom)
                this.context.zoom = mainZoom
                break;

        case Maperial.MINIFIER : 
            if(this.context.zoom > mainZoom)
                this.context.zoom = mainZoom
                break;
    }

    this.mapView.deltaZoom = this.context.zoom - mainZoom

    $(window).trigger(MaperialEvents.ZOOM_TO_REFRESH, [this.mapView.map, this.mapView.name, this.mapView.type, this.context.zoom]);
}

//----------------------------------------------------------------------//
//Utils

MouseListener.prototype.hasJustWheeled = function () {
    var hasJustWheeled = new Date().getTime() - this.lastWheelMillis < 300;
    this.lastWheelMillis = new Date().getTime();

    return hasJustWheeled;
}

/**
 * param  mouseP : Point with coordinates in pixels, in the Canvas coordinates system
 * return mouseM : Point with coordinates in meters, in the Meters coordinates system
 */
MouseListener.prototype.convertCanvasPointToMeters = function (canvasPoint) {

    var w = this.mapView.canvas.width,
        h = this.mapView.canvas.height,

        centerP = this.mapView.context.coordS.MetersToPixels(
            this.mapView.context.centerM.x, 
            this.mapView.context.centerM.y, 
            this.mapView.context.zoom
        ),
        
        shiftX = w/2 - canvasPoint.x,
        shiftY = h/2 - canvasPoint.y,
        
        meters = this.mapView.context.coordS.PixelsToMeters(
            centerP.x - shiftX, 
            centerP.y + shiftY, 
            this.mapView.context.zoom
        );
    
    console.log(meters);
    return meters;
}

//------------------------------------------------------------------//

module.exports = MouseListener;


},{"../../tools/utils.js":41,"../libs/hammer.js":37}],20:[function(_dereq_,module,exports){
//------------------------------------------------------------------------------------------//

function ColorbarRenderer ( mapView ) {
   this.mapView  = mapView;
   this.gl       = mapView.context.assets.ctx;
}

//------------------------------------------------------------------------------------------//

ColorbarRenderer.prototype.refreshAllColorBars = function () {

   var colorbars = maperialColorbars;

   this.gl.flush();
   this.gl.finish();

   for ( var colorbarUID in colorbars ) {
      var colorbar = colorbars[colorbarUID];
      if(colorbar.version != colorbar.data.version){
         this.renderColorbar(colorbar);
         colorbar.version = colorbar.data.version;
      }
   }

   return true;
}

//------------------------------------------------------------------------------------------//

ColorbarRenderer.prototype.renderColorbar = function (colorbar) {

   if ( colorbar == null  || ! colorbar.data.IsValid () ) {
      console.log ( "Invalid colorbar data : " + colorbarUID );
   }

   if(!colorbar.tex)
      colorbar.tex = {};

   // Raster it !
   var data = [];
   for (var i = 0.0 ; i < 1.0 ; i+= 1.0/256) {
      var c = colorbar.data.Get ( i ) ;
      data.push ( c.Ri() );
      data.push ( c.Gi() );
      data.push ( c.Bi() );
      data.push ( c.Ai() );
   }

   data = new Uint8Array(data);
   
   if ( colorbar.tex[this.mapView.id] ) {
      this.deleteTexture ( colorbar.tex[this.mapView.id] );
   }

   try {
      colorbar.tex[this.mapView.id] = this.gl.createTexture();
      this.gl.bindTexture  (this.gl.TEXTURE_2D, colorbar.tex[this.mapView.id] );
      this.gl.pixelStorei  (this.gl.UNPACK_FLIP_Y_WEBGL  , false    );
      this.gl.texImage2D   (this.gl.TEXTURE_2D, 0 , this.gl.RGBA, 256 , 1 , 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data );
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE);
      this.gl.bindTexture  (this.gl.TEXTURE_2D, null );
   } catch (e) { 
      this.deleteTexture ( colorbar.tex[this.mapView.id] );
      console.log ( "Error in colorbar building : " + colorbarUID );
   }
}

//------------------------------------------------------------------------------------------//

ColorbarRenderer.prototype.deleteTexture = function (tex) {
   this.gl.deleteTexture ( tex );
   delete tex;
   tex = null;
}

//------------------------------------------------------------------//

module.exports = ColorbarRenderer;

},{}],21:[function(_dereq_,module,exports){

var utils                   = _dereq_('../../../tools/utils.js'),
    ExtendCanvasContext     = _dereq_('./tools/render-text.js'),
    TileRenderer            = _dereq_('./tile-renderer.js');
    
//------------------------------------------------------------------------------------------//

function DynamicalRenderer ( gl, dynamicalData, style ) {
   // They don't realy need mapView ... And it's the same for all gl XX layers no ?
   // upgrade : One GL canvas for every GL renderers : views +  DynamicalRenderers

   this.id              = utils.generateUID();
   this.dynamicalData   = dynamicalData;
   this.style           = style;
   
   this.gl              = gl;
   this.cnv             = null;
   this.ctx             = null;
   this.layerCount      = 0;
   this.z               = null;
   this.tx              = null;
   this.ty              = null; 
   this.nbtx            = null;
   this.nbty            = null;
   
   this.w               = 0;
   this.h               = 0;
   
   this.version         = 0;
   this.tex             = [];
   
   this.initialResolution   = 2 * Math.PI * 6378137 / Maperial.tileSize;
   this.originShift         = 2 * Math.PI * 6378137 / 2.0 ;
}

//------------------------------------------------------------------------------------------//

DynamicalRenderer.prototype.isSync = function () {
    if(this.version == this.dynamicalData.version){
        return true;
    }
    else{
       if(this.cnv)
          this.Reset();
       
       return false;
    }
}

//------------------------------------------------------------------------------------------//

DynamicalRenderer.prototype.Refresh = function ( z , tileX, tileY, nbTX , nbTY ) {

   var cameraMoved = this.z != z || this.tx == null || tileX < this.tx || tileY < this.ty || tileX + nbTX > this.tx + this.nbtx || tileY + nbTY > this.ty + this.nbty,
       dataChanged = this.version != this.dynamicalData.version;

   if (cameraMoved || dataChanged) {

      this.Reset();
      //TODO track cette version, et check si le slider l'update plus vite que le rendering : swap de 2 etats : uptodate/yetupdating  
      this.version = this.dynamicalData.version;

      var nbTX2 = 1;
      while ( nbTX2 < nbTX ) nbTX2 = nbTX2 * 2;
      var nbTY2 = 1;
      while ( nbTY2 < nbTY ) nbTY2 = nbTY2 * 2;
      
      var sizeX   = nbTX2 * Maperial.tileSize;
      var sizeY   = nbTY2 * Maperial.tileSize;

      this.w = sizeX;
      this.h = sizeY;

      this.AllocCanvas (sizeX,sizeY) ;
      
      var dx = nbTX2 - (nbTX);
      var dy = nbTY2 - (nbTY);
      
      var tx = tileX - Math.floor ( dx / 2.0 );
      var ty = tileY - Math.floor ( dy / 2.0 );
      
      this.tx     = tx;
      this.ty     = ty;
      this.nbtx   = nbTX2
      this.nbty   = nbTY2;
      this.z      = z;
      
      var tmpP    = Math.pow ( 2 , this.z);
      var res     = this.initialResolution / tmpP;
      var mapSize = Maperial.tileSize * tmpP;
      this.scaleX = (1 / res);
      this.scaleY = - (1 / res);
      this.trX    = (this.originShift / res) - this.tx * Maperial.tileSize;
      this.trY    = this.h - ((this.originShift / res) - this.ty * Maperial.tileSize);
   }
}

DynamicalRenderer.prototype.AllocCanvas = function ( sizeX, sizeY) {
   this.cnv             = document.createElement("canvas");
   this.cnv.height      = sizeY ;
   this.cnv.width       = sizeX ;
   this.ctx             = this.cnv.getContext("2d");
   ExtendCanvasContext  ( this.ctx );
   this.ctx.globalCompositeOperation="source-over";

   // Clear ...
   this.ctx.beginPath   (  );
   this.ctx.rect        ( 0,0,this.cnv.width,this.cnv.height );
   this.ctx.closePath   (  );
   this.ctx.fillStyle    = 'rgba(255,255,255,0.0)';
   this.ctx.fill        (  );
   
   this.ctx.setTexViewBox(-1,-1,sizeX+1,sizeY+1)
}

DynamicalRenderer.prototype.Reset = function (  ) {
   var gl            = this.gl;
   this.layerCount   = 0
   if (this.cnv) {
      delete      this.cnv;
      this.cnv    = null;
   }
   if (this.tex.length) {
      for (var i = 0 ; i < this.tex.length ; ++i) {
         gl.deleteTexture ( this.tex[i] );
      }
      this.tex = [];
   }
}

DynamicalRenderer.prototype.Release = function (  ) {
   this.Reset();
}

DynamicalRenderer.prototype.IsUpToDate = function ( ) {
   return this.layerCount == null;
}

DynamicalRenderer.prototype.Update = function () {

   if (this.cnv == null || this.layerCount == null || this.style == null)
      return 0;

   var gl         = this.gl;

   this.ctx._sx = this.scaleX;
   this.ctx._sy = this.scaleY;
   this.ctx._tx = this.trX;
   this.ctx._ty = this.trY;

   var rendererStatus   = TileRenderer.RenderDynamicalLayer (this.ctx , this.dynamicalData , this.z , this.style , this.layerCount ) ;
   this.layerCount      = rendererStatus[0];

   var diffT = 0;
   if (this.IsUpToDate()) { // Render is finished, build GL Texture
      var date    = (new Date)
      var startT  = date.getTime()
      this._BuildTexture();
      diffT   = date.getTime() - startT;
   }
   
   return rendererStatus[1] + diffT
}

DynamicalRenderer.prototype.GetTex = function ( tx , ty) {
   var i = tx - this.tx;
   var j = ty - this.ty;
   if ( i >= this.nbtx || j >= this.nbty || this.layerCount != null || i < 0 || j < 0) {
      console.log ( "invalid custom tile")
      return null
   }
   j = this.nbty - j - 1
   return this.tex [ i + j * this.nbtx ]
}

DynamicalRenderer.prototype._BuildTexture = function () {

   var gl            = this.gl,
       tileCanvas    = document.createElement('canvas');
   
   tileCanvas.width  = Maperial.tileSize;
   tileCanvas.height = Maperial.tileSize;
   var tileCanvasCtx = tileCanvas.getContext('2d');
   
   tileCanvasCtx.globalCompositeOperation="copy";
   
   for (var j = 0 ; j < this.nbty ; j = j + 1 ) {
      for (var i = 0 ; i < this.nbtx ; i = i + 1 ) {
      
         var tx   = this.tx + i
         var ty   = this.ty + j
         var tex  = gl.createTexture();
      
         tileCanvasCtx.drawImage(this.cnv, i*Maperial.tileSize, j*Maperial.tileSize , Maperial.tileSize , Maperial.tileSize , 0 , 0 , Maperial.tileSize , Maperial.tileSize);
      
         gl.bindTexture  (gl.TEXTURE_2D           , tex           );
         gl.pixelStorei  (gl.UNPACK_FLIP_Y_WEBGL  , false         );
         gl.texImage2D   (gl.TEXTURE_2D           , 0                      , gl.RGBA    , gl.RGBA, gl.UNSIGNED_BYTE, tileCanvas);
         gl.texParameteri(gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
         gl.texParameteri(gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
         this.tex.push ( tex );
      }
   }
   
   gl.bindTexture  (gl.TEXTURE_2D , null );
   delete tileCanvasCtx;
   delete tileCanvas;
}

//------------------------------------------------------------------//

module.exports = DynamicalRenderer;

},{"../../../tools/utils.js":41,"./tile-renderer.js":30,"./tools/render-text.js":33}],22:[function(_dereq_,module,exports){

var utils                   = _dereq_('../../../tools/utils.js'),
    GLTools                 = _dereq_("./tools/gl-tools.js"),
    CoordinateSystem        = _dereq_('../../libs/coordinate-system.js');
    
//------------------------------------------------------------------------------------------//

function HeatmapRenderer ( mapView, heatmapData, colorbar, options ) {
   // They don't realy need mapView ... And it's the same for all gl XX layers no ?

   this.id              = utils.generateUID();
   this.mapView         = mapView;
   this.heatmapData     = heatmapData;
   this.colorbar        = colorbar;
   this.options         = options;
   
   this.gl              = mapView.context.assets.ctx;
   this.assets          = mapView.context.assets;
   this.layerCount      = 0;
   this.z               = null;
   this.tx              = this.ty = this.nbtx = this.nbty = null;
   this.w               = this.h = 0;
   this.frmB            = null;
   this.texB            = null;
   this.cs              = new CoordinateSystem (Maperial.tileSize)

   this.version         = 0;
   this.tex             = [];

   this.initialResolution   = 2 * Math.PI * 6378137 / Maperial.tileSize;
   this.originShift         = 2 * Math.PI * 6378137 / 2.0 ;
}

//------------------------------------------------------------------------------------------//

HeatmapRenderer.prototype.isSync = function () {
  if(this.version == this.heatmapData.version){
      return true;
  }
  else{
     if(this.texB){
        console.log("not sync : reset");
        this.Reset();
     }
     
     return false;
  }
}

//------------------------------------------------------------------------------------------//

HeatmapRenderer.prototype.Refresh = function ( z , tileX, tileY, nbTX , nbTY ) {
   
   var cameraMoved = this.z != z || this.tx == null || tileX < this.tx || tileY < this.ty || tileX + nbTX > this.tx + this.nbtx || tileY + nbTY > this.ty + this.nbty,
       dataChanged = this.version != this.heatmapData.version;

   if (cameraMoved || dataChanged) {
      
      console.log("refesh : reset");
      this.Reset();
      this.version = this.heatmapData.version;
      
      var nbTX2 = 1;
      while ( nbTX2 < nbTX ) nbTX2 = nbTX2 * 2;
      var nbTY2 = 1;
      while ( nbTY2 < nbTY ) nbTY2 = nbTY2 * 2;
      
      var sizeX   = nbTX2 * 256;
      var sizeY   = nbTY2 * 256;
      
      this.w = sizeX;
      this.h = sizeY;
   
      console.log("AllocBuffer");
      this.AllocBuffer (sizeX,sizeY) ;
      
      var dx = nbTX2 - (nbTX);
      var dy = nbTY2 - (nbTY);
      
      var tx = tileX - Math.floor ( dx / 2.0 );
      var ty = tileY - Math.floor ( dy / 2.0 );
      
      this.tx     = tx;
      this.ty     = ty;
      this.nbtx   = nbTX2
      this.nbty   = nbTY2;
      this.z      = z;
      
      var tmpP    = Math.pow ( 2 , this.z);
      var res     = this.initialResolution / tmpP;
      var mapSize = 256 * tmpP;
      this.scaleX = (1 / res);
      this.scaleY = - (1 / res);
      this.trX    = (this.originShift / res) - this.tx * 256;
      this.trY    = this.h - ((this.originShift / res) - this.ty * 256);
   }
}

HeatmapRenderer.prototype.AllocBuffer = function ( sizeX , sizeY ) {
   var gltools       = new GLTools();
   var fbtx          = gltools.CreateFrameBufferTex(this.gl,sizeX,sizeY);
   this.frmB         = fbtx[0];
   this.texB         = fbtx[1];
}

HeatmapRenderer.prototype.Reset = function (  ) {
   var gl            = this.gl;
   this.layerCount   = 0
   if ( this.texB ) {
      gl.deleteTexture ( this.texB );
      delete      this.texB;
      this.texB    = null;
   }
   if ( this.frmB ) {
      gl.deleteFramebuffer ( this.frmB );
      delete      this.frmB;
      this.frmB    = null;
   }
   if (this.tex.length) {
      for (var i = 0 ; i < this.tex.length ; ++i) {
         gl.deleteTexture ( this.tex[i] );
      }
      this.tex = [];
   }
}

HeatmapRenderer.prototype.Release = function (  ) {
   this.Reset()
}

HeatmapRenderer.prototype.IsUpToDate = function ( ) {
   return this.layerCount == null;
}

HeatmapRenderer.prototype.Update = function () {
   if (this.frmB == null || this.layerCount == null)
      return 0;
   console.log("heat Update");
      
   var gl       = this.gl;
//   this.scaleX;
//   this.scaleY;
//   this.trX;
//   this.trY;
   
   gl.bindFramebuffer         ( gl.FRAMEBUFFER, this.frmB );
   this.gl.clearColor         ( 0.0, 0.0, 0.0, 0.0  );
   this.gl.disable            ( this.gl.DEPTH_TEST  );
   gl.viewport                ( 0, 0, this.frmB.width, this.frmB.height);
   gl.clear                   ( gl.COLOR_BUFFER_BIT );
      
   var mvMatrix               = mat4.create();
   var pMatrix                = mat4.create();
   mat4.identity              ( mvMatrix );
   mat4.identity              ( pMatrix );
   mat4.ortho                 ( 0, this.frmB.width , 0, this.frmB.height, 0, 1, pMatrix ); // Y swap !

   var prog = null;
   if ( typeof this.options.fill !== 'undefined' && this.options.fill == "linear" ) {
      prog                   = this.assets.prog[ "HeatLinear" ]
   }
   else { // default gaussian   
      prog                   = this.assets.prog[ "HeatGaussian" ]
   }
   
   gl.useProgram              (prog);

   gl.uniformMatrix4fv        (prog.params.pMatrixUniform.name , false, pMatrix);
   gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.circleVertexPositionBuffer);
   gl.enableVertexAttribArray (prog.attr.vertexPositionAttribute);
   gl.vertexAttribPointer     (prog.attr.vertexPositionAttribute, this.assets.circleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
                              
   gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.circleVertexTextureBuffer);
   gl.enableVertexAttribArray (prog.attr.textureCoordAttribute);
   gl.vertexAttribPointer     (prog.attr.textureCoordAttribute, this.assets.circleVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

   var date    = new Date();
   var startT  = date.getTime();
   var diffT   = 0.0
   
   this.gl.enable(this.gl.BLEND);
   this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
   
   var defaultScale     = typeof this.options.scale !== 'undefined'             ? this.options.scale        : 1.0;
   var defaultDiameter  = typeof this.options.diameter !== 'undefined'          ? this.options.diameter     : 100;
   var unit             = typeof this.options.diameterUnit !== 'undefined'      ? this.options.diameterUnit : "pixel";
   var res              = this.cs.Resolution ( this.z )
   
   if  ( typeof this.options.diameterUnit !== 'undefined' ) {
      if ( this.options.diameterUnit == "meter" ) {
         unit             = 1 // meter
         // Need to be compute with all point !
      }
      else if ( this.options.diameterUnit == "metereq" ) {
         unit             = 2 // metereq
         defaultDiameter = defaultDiameter / res
      }
   }
   
   for (var i = this.layerCount ; i < this.heatmapData.content["l"].length ; ++i ) {
      var layer   = this.heatmapData.content["l"][i];
      var ll      = layer["g"]; // liste de listes de lignes
      var al      = null; // attributlist
      if ("a" in layer) al = layer["a"];
      if (ll == null)   continue;
      
      for ( var l = 0 ; l < ll.length ; ++l ) {
         var   lines = ll[l]; // liste de lignes
         var   attr  = null; // attribut
         if (al) attr = al[l] // attributlist

         var scale      = defaultScale
         var diameter   = defaultDiameter

         if ( attr && typeof (attr) == typeof ({}) ) {
            scale     = typeof attr.scale !== 'undefined' ? attr.scale : scale;
            if ( typeof attr.diameter !== 'undefined' ) {
               diameter = attr.diameter;
               if ( unit == 2 ) {
                  defaultDiameter = defaultDiameter / res
               }
            }
         }
         
         for ( var li = 0 ; li < lines.length ; ++li ) {
            var line = lines[li];
            if (line.length == 2) {
               var localScale = defaultScale
               var localDiam  = defaultDiameter 
               if (unit == 1) {
                  var tmp1 = this.cs.MetersToPixelsAccurate(line[0]   ,line[1],this.z )
                  var tmp2 = this.cs.MetersToPixelsAccurate(line[0] + diameter ,line[1],this.z )
                  diameter = tmp2.x - tmp1.x
               }
               
               mat4.identity              ( mvMatrix );
               var tmpx = line[0] * this.scaleX + this.trX;
               var tmpy = line[1] * this.scaleY + this.trY;
               mat4.translate         ( mvMatrix, [ tmpx , tmpy , 0] );
               mat4.scale             ( mvMatrix, [ diameter , diameter , 1.0] );               
               gl.uniformMatrix4fv    ( prog.params.mvMatrixUniform.name, false, mvMatrix );
               gl.uniform1f           ( prog.params.uParams.name , scale ); 
               gl.drawArrays          ( gl.TRIANGLE_FAN, 0, this.assets.circleVertexPositionBuffer.numItems );
            }
         }
      }
      diffT   = date.getTime() - startT;
      if ( diffT > 10 )
         break;
   }
   
   this.gl.disable(this.gl.BLEND);
   this.layerCount = i + 1
   gl.bindFramebuffer ( gl.FRAMEBUFFER, null );
   
   if ( this.layerCount >= this.heatmapData.content["l"].length ) {
      this._BuildTexture();
      gl.deleteFramebuffer       ( this.frmB );
      delete this.frmB;
      this.frmB = null;
      this.layerCount = null;
   }
   return diffT
}

HeatmapRenderer.prototype.GetTex = function ( tx , ty ) {
   var i = tx - this.tx;
   var j = ty - this.ty;
   if ( i >= this.nbtx || j >= this.nbty || this.layerCount != null || i < 0 || j < 0) {
      console.log ( "invalid custom tile")
      return null
   }
   j = this.nbty - j - 1
   return this.tex [ i + j * this.nbtx ]
   //return this.texB;
}

HeatmapRenderer.prototype._BuildTexture = function () {
   console.log("heat _BuildTexture");
   
   var gltools                = new GLTools ()
   var gl                     = this.gl;

   var mvMatrix               = mat4.create();
   var pMatrix                = mat4.create();
   mat4.identity              ( pMatrix );
   mat4.ortho                 ( 0, 256 , 0, 256, 0, 1, pMatrix ); // Y swap !

   var prog                   = this.assets.prog[ "Clut" ]
   gl.useProgram              (prog);

   var colorBbounds           = this.colorbar.data.GetBounds ()

   gl.uniform4fv              (prog.params.uParams.name ,[0.0,1.0,colorBbounds[0],colorBbounds[1]] ); 
   
   gl.uniformMatrix4fv        (prog.params.pMatrixUniform.name , false, pMatrix);
         
   gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
   gl.enableVertexAttribArray (prog.attr.vertexPositionAttribute);
   gl.vertexAttribPointer     (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
                              
   gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
   gl.enableVertexAttribArray (prog.attr.textureCoordAttribute);
   gl.vertexAttribPointer     (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);


         
   for (var j = 0 ; j < this.nbty ; j = j + 1 ) {
      for (var i = 0 ; i < this.nbtx ; i = i + 1 ) {
         var fbtx         = gltools.CreateFrameBufferTex(gl,256,256);
         var frmB         = fbtx[0];
         var tex          = fbtx[1];
      
         gl.bindFramebuffer         ( gl.FRAMEBUFFER, frmB );
         gl.disable                 ( gl.DEPTH_TEST  );
         gl.viewport                ( 0, 0, 256, 256 );

         gl.activeTexture           (gl.TEXTURE0);
//         gl.bindTexture             (gl.TEXTURE_2D, this.texB);
         gl.bindTexture             (gl.TEXTURE_2D, tex);
         gl.uniform1i               (prog.params.uSamplerTex1.name, 0);
         
         gl.activeTexture           (gl.TEXTURE1);
         gl.bindTexture             (gl.TEXTURE_2D, this.colorbar.tex[this.mapView.id] );
         gl.uniform1i               (prog.params.uSamplerTex2.name, 1);      
               
         mat4.identity              ( mvMatrix );
         mat4.translate             ( mvMatrix, [- i*256, - j*256 , 0.0] );
         mat4.scale                 ( mvMatrix, [this.nbtx , this.nbty , 1.0] );
         
         gl.uniformMatrix4fv        ( prog.params.mvMatrixUniform.name, false, mvMatrix );
         gl.drawArrays              (gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

         this.tex.push ( tex );
         gl.deleteFramebuffer ( frmB );
      }
   }
   gl.bindFramebuffer         ( gl.FRAMEBUFFER, null );
   gl.activeTexture           (gl.TEXTURE0);
   gl.bindTexture             (gl.TEXTURE_2D, null );
   gl.activeTexture           (gl.TEXTURE1);
   gl.bindTexture             (gl.TEXTURE_2D, null );
}

//------------------------------------------------------------------//

module.exports = HeatmapRenderer;

},{"../../../tools/utils.js":41,"../../libs/coordinate-system.js":34,"./tools/gl-tools.js":32}],23:[function(_dereq_,module,exports){

function DynamicalLayerPart ( layer, tile ) {
   
   this.layer     = layer;
   this.tile      = tile;
   this.x         = tile.x;
   this.y         = tile.y;
   this.z         = tile.z;

   this.version   = null;
   this.tex       = null;
   
   this.renderer  = layer.renderer;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.IsUpToDate = function ( ) {
   var isUpTodate = this.renderer.isSync() && this.tex != null;
   
   if(!isUpTodate)
       this.Reset();
   
   return isUpTodate;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.DataReady = function(){

   if(this.renderer.IsUpToDate()){
      return true;
   }
   else{
      this.renderer.Update();
      return false;
   }
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.GetType = function ( ) {
   return this.layer.type;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.prepare = function () {

}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.Reset = function (  ) {
   this.tex = null;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.Release = function (  ) {
   this.tex = null;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.Update = function () {
    if (this.tex == null ) {   
        this.tex = this.renderer.GetTex(this.x,this.y)
    }
    return 0;
}

//------------------------------------------------------------------//

module.exports = DynamicalLayerPart;
},{}],24:[function(_dereq_,module,exports){

var ImageData       = _dereq_("../../models/data/image-data.js");

//-----------------------------------------------------------------------------------//

function ImageLayerPart (layer, tile, gl, inZoom) {
   this.tile      = tile;
   this.gl        = gl;
   this.layer     = layer;

   this.tex       = null;
   this.w         = 0;
   this.h         = 0;
   this.z         = inZoom;

   this.data      = new ImageData(layer.sourceId, tile.x, tile.y, tile.z);
}

//-----------------------------------------------------------------------------------//

ImageLayerPart.prototype.DataReady = function(){

   if(this.data.content){
      return true
   }
   else{
      this.data.tryToFillContent()

      if(this.data.content){
         this.prepare()
         return true
      }
   }

   return false;
}

//-----------------------------------------------------------------------------------//

ImageLayerPart.prototype.GetType = function ( ) {
   return this.layer.type;
}

//-----------------------------------------------------------------------------------//

ImageLayerPart.prototype.prepare = function () {
   this.w = this.data.content.width;      
   this.h = this.data.content.height; 
}

//-----------------------------------------------------------------------------------//

ImageLayerPart.prototype.Reset = function (  ) {
   if (this.tex) {
      this.gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
}

ImageLayerPart.prototype.Release = function (  ) {
   this.Reset()

   if (this.data.content) {
      delete this.data.content;
      this.data.content = null;
   }
}

//-----------------------------------------------------------------------------------//

ImageLayerPart.prototype.IsUpToDate = function ( ) {
   return this.tex != null;
}

//-----------------------------------------------------------------------------------//

ImageLayerPart.prototype.Update = function () {

   if (this.tex)
      return 0;

   var date    = (new Date)
   var startT  = date.getTime()

   var gl = this.gl;

   if (this.data.content != null && this.data.content.width > 0) {

      this.tex             = gl.createTexture();
      gl.bindTexture       ( gl.TEXTURE_2D           , this.tex     );
      gl.pixelStorei       ( gl.UNPACK_FLIP_Y_WEBGL  , false        );
      gl.texImage2D        ( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.data.content);
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
      gl.bindTexture       ( gl.TEXTURE_2D           , null         );
   }
   else { // create fake

      this.tex             = gl.createTexture();
      gl.bindTexture       ( gl.TEXTURE_2D           , this.tex     );
      gl.pixelStorei       ( gl.UNPACK_FLIP_Y_WEBGL  , false        );
      var byteArray        = new Uint8Array        ( [1,1,1,0 , 1,1,1,0 , 1,1,1,0 , 1,1,1,0] );
      gl.texImage2D        ( gl.TEXTURE_2D           , 0                           , gl.RGBA, 2 , 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray)
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
      gl.bindTexture       ( gl.TEXTURE_2D           , null         );
      this.w = 2;
      this.h = 2;
   }

   var diffT   = date.getTime() - startT;   
   return diffT
   
}

//------------------------------------------------------------------//

module.exports = ImageLayerPart;

},{"../../models/data/image-data.js":11}],25:[function(_dereq_,module,exports){

function RasterLayerPart ( mapView , inZoom) {
   this.mapView = mapView;
   this.assets = mapView.context.assets;
   this.gl     = this.assets.ctx;
   
   this.tex    = null;
   this.data   = null;
   this.w      = 0;
   this.h      = 0;
   this.z      = inZoom;
}

RasterLayerPart.prototype.GetType = function ( ) {
   return LayerManager.Raster;
}

RasterLayerPart.prototype.Reset = function (  ) {
   var gl = this.gl;
   if (this.tex) {
      gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
}

RasterLayerPart.prototype.Release = function (  ) {
   var gl = this.gl;
   if (this.tex) {
      gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
   if (this.data) {
      delete this.data;
      this.data = null;
   }
}

RasterLayerPart.prototype.IsUpToDate = function ( ) {
   return this.tex != null;
}

RasterLayerPart.prototype.Update = function ( params ) {
   if (this.tex)
      return 0;

   var date    = (new Date)
   var startT  = date.getTime()
      
   var gl = this.gl;
   var colorbarUID = params.colorbars[params.selectedColorbar];
   var colorbar = this.mapView.colorbarsManager.getColorbar(colorbarUID).tex;
   
   if ( !colorbar ) { 
      console.log("Invalid color bar : setting default") ;
   }

   if ( this.data && colorbar) {
   
      var gltools                = new GLTools ()
      var fbtx                   = gltools.CreateFrameBufferTex(gl,this.w,this.h)
      var tmpTex                 = gl.createTexture (      );
      this.tex                   = fbtx[1];
      gl.bindTexture             (gl.TEXTURE_2D, tmpTex);      
      gl.pixelStorei             (gl.UNPACK_FLIP_Y_WEBGL  , false );
      gl.texImage2D              (gl.TEXTURE_2D, 0, gl.LUMINANCE, this.w , this.h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.data)
      //this._glSetData            (  );
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S    , gl.CLAMP_TO_EDGE);
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T    , gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer         ( gl.FRAMEBUFFER, fbtx[0] );
      this.gl.clearColor         ( 1.0, 1.0, 1.0, 1.0  );
      this.gl.disable            ( this.gl.DEPTH_TEST  );
      gl.viewport                ( 0, 0, fbtx[0].width, fbtx[0].height);
      gl.clear                   ( gl.COLOR_BUFFER_BIT );

      mvMatrix                   = mat4.create();
      pMatrix                    = mat4.create();
      mat4.identity              ( mvMatrix );
      mat4.scale                 ( mvMatrix, [this.w  / Maperial.tileSize , this.h / Maperial.tileSize, 1.0] );
      mat4.identity              ( pMatrix );
      mat4.ortho                 ( 0, fbtx[0].width , 0, fbtx[0].height, 0, 1, pMatrix ); // Y swap !
      
      var prog                   = this.assets.prog[ "Clut" ]
      
      gl.useProgram              (prog);
      gl.uniformMatrix4fv        (prog.params.pMatrixUniform.name , false, pMatrix);
      gl.uniformMatrix4fv        (prog.params.mvMatrixUniform.name, false, mvMatrix);
      gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
      gl.enableVertexAttribArray (prog.attr.vertexPositionAttribute);
      gl.vertexAttribPointer     (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
                                 
      gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
      gl.enableVertexAttribArray (prog.attr.textureCoordAttribute);
      gl.vertexAttribPointer     (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
   
      gl.activeTexture           (gl.TEXTURE0);
      gl.bindTexture             (gl.TEXTURE_2D, tmpTex);
      gl.uniform1i               (prog.params.uSamplerTex1.name, 0);
      
      gl.activeTexture           (gl.TEXTURE1);
      gl.bindTexture             (gl.TEXTURE_2D, colorbar );
      gl.uniform1i               (prog.params.uSamplerTex2.name, 1);
         
      gl.uniform4fv              (prog.params.uParams.name ,[0.0,2.0,0.0,1.0] ); 
         
      gl.drawArrays              (gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

      gl.bindFramebuffer         ( gl.FRAMEBUFFER, null );
      gl.activeTexture           (gl.TEXTURE0);
      gl.bindTexture             (gl.TEXTURE_2D, null );
      gl.activeTexture           (gl.TEXTURE1);
      gl.bindTexture             (gl.TEXTURE_2D, null );

      gl.deleteTexture           (tmpTex);
      gl.deleteFramebuffer       (fbtx[0]);
   }
   else { // create fake
      this.tex             = gl.createTexture();
      gl.bindTexture       ( gl.TEXTURE_2D           , this.tex     );
      gl.pixelStorei       ( gl.UNPACK_FLIP_Y_WEBGL  , false        );
      var byteArray        = new Uint8Array        ( [1,1,1,0 , 1,1,1,0 , 1,1,1,0 , 1,1,1,0] );
      gl.texImage2D        ( gl.TEXTURE_2D           , 0                           , gl.RGBA, 2 , 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray)
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
      gl.bindTexture       ( gl.TEXTURE_2D           , null         );
      this.w = 2;
      this.h = 2;
   }
   var diffT   = date.getTime() - startT;   
   return diffT
}

function RasterLayer8 ( maperial , inZoom) {
   this.__proto__.__proto__.constructor.apply(this, arguments);
}

RasterLayer8.prototype.__proto__ = RasterLayerPart.prototype; // Not ie compatible ???

RasterLayer8.prototype.Init = function ( data ) {
   if (this.tex)
      return;
   if (data) {
      var byteArray              = new Uint8Array        ( data );
      var nx                     = byteArray[0] + 1
      byteArray                  = new Uint8Array        ( data.slice(1) );
      var ny                     = byteArray.length / nx;
      
      this.w                     = nx;      
      this.h                     = ny; 
      this.data                  = byteArray;
   }
}

function RasterLayer16 ( maperial , inZoom) {
   this.__proto__.__proto__.constructor.apply(this, arguments);
}

RasterLayer16.prototype.__proto__ = RasterLayerPart.prototype; // Not ie compatible ???

RasterLayer16.prototype.Init = function ( data ) {
   if (this.tex)
      return;
   if (data) {
      this.data = new Uint8Array  (data.slice (256*256*2))
      this.w                     = 256;      
      this.h                     = 256; 

      /*d = data['c']
      var newV                   = []
      for (var y = 0 ; y < 256 ; y++ ) {
         for (var x = 0 ; x < 256 ; x++ ) {
            newV.push( Math.ceil( d[y * 256 + x ] * 255 / 9322.0) )
         }
      }
      var byteArray              = new Uint8Array        ( newV );
      this.w                     = 256;      
      this.h                     = 256; 
      this.data                  = byteArray;
      */
   }
}

//------------------------------------------------------------------//

module.exports = {
        RasterLayer8    : RasterLayer8,
        RasterLayer16   : RasterLayer16
};

},{}],26:[function(_dereq_,module,exports){

function ShadeLayerPart ( mapView , inZoom) {
   this.mapView = mapView;
   this.assets = mapView.context.assets;
   this.gl     = this.assets.ctx;
   
   this.tex    = null;
   this.data   = null;
   this.w      = 0;
   this.h      = 0;
   this.z      = inZoom;
}

ShadeLayerPart.prototype.GetType = function ( ) {
   return LayerManager.Shade;
}

ShadeLayerPart.prototype.Init = function ( data ) {
   if (this.tex)
      return;
   
   console.log("init shade")
   
   if (data) {
      var newV                   = []
      /*
      for (var y = 255 ; y >= 0 ; y-- ) {
         for (var x = 0 ; x < 256 ; x++ ) {
            newV.push(data[y + x * 256] & 255)
            newV.push((data[y + x * 256] >> 8) & 255)
            newV.push(0)
         }
      }
      var byteArray              = new Uint8Array        ( newV );
      */
      /*
      for (var y = 0 ; y <= 256 ; y++ ) {
         for (var x = 0 ; x < 256 ; x++ ) {
            newV.push(data [y * 256 + x ] & 255)
            newV.push((data[y * 256 + x ] >> 8) & 255)
            newV.push(0)
         }
      }
      var byteArray              = new Uint8Array        ( newV );
      */
      /*
      var byteArray              = new Uint8Array        ( data['s'] );
      this.w                     = 256;      
      this.h                     = 256; 
      this.data                  = byteArray;
      */
      var byteArray              = new Uint8Array        ( data );
      var nl = []
      for ( var i = 0 ; i < 256*256*2 ; i = i+2 ) {

         var a = ( byteArray[i] / 255.0 ) * 2.0 - 1.0;
         var b = ( byteArray[i+1] / 255.0 ) * 2.0 - 1.0;
         var tmp = - (a*a) - (b*b) + 1.0
         var c = Math.sqrt( tmp );

         var tt = (a*a) + (b*b) + (c*c);
         
         nl.push(  Math.ceil( ((a + 1.0)/2.0) * 255));
         nl.push(  Math.ceil( ((b + 1.0)/2.0) * 255));
         nl.push(  Math.ceil( ((c + 1.0)/2.0) * 255));
      }
      this.data = new Uint8Array  (nl)
      this.w                     = 256;      
      this.h                     = 256; 
   }
}

ShadeLayerPart.prototype.Reset = function (  ) {
   var gl = this.gl;
   if (this.tex) {
      gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
}

ShadeLayerPart.prototype.Release = function (  ) {
   var gl = this.gl;
   if (this.tex) {
      gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
   if (this.data) {
      delete this.data;
      this.data = null;
   }
}

ShadeLayerPart.prototype.IsUpToDate = function ( ) {
   return this.tex != null;
}

ShadeLayerPart.prototype.Update = function ( params ) {
   if (this.tex)
      return 0;

   var date    = (new Date)
   var startT  = date.getTime()
   
   var gl = this.gl;

   if ( this.data ) {
      var gltools                = new GLTools ()
      var fbtx                   = gltools.CreateFrameBufferTex(gl,this.w,this.h)
      var tmpTex                 = gl.createTexture (      );
      this.tex                   = fbtx[1];
      gl.bindTexture             (gl.TEXTURE_2D, tmpTex);      
      gl.pixelStorei             (gl.UNPACK_FLIP_Y_WEBGL  , false );
      gl.texImage2D              (gl.TEXTURE_2D, 0, gl.RGB, this.w , this.h, 0, gl.RGB, gl.UNSIGNED_BYTE, this.data)
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S    , gl.CLAMP_TO_EDGE);
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T    , gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer         ( gl.FRAMEBUFFER, fbtx[0] );
      this.gl.clearColor         ( 1.0, 1.0,1.0, 1.0  );
      this.gl.disable            ( this.gl.DEPTH_TEST  );
      gl.viewport                ( 0, 0, fbtx[0].width, fbtx[0].height);
      gl.clear                   ( gl.COLOR_BUFFER_BIT );

      var mvMatrix               = mat4.create();
      var pMatrix                = mat4.create();
      mat4.identity              ( mvMatrix );
      mat4.scale                 ( mvMatrix, [this.w  / Maperial.tileSize , this.h / Maperial.tileSize, 1.0] );
      mat4.identity              ( pMatrix );
      mat4.ortho                 ( 0, fbtx[0].width , 0, fbtx[0].height, 0, 1, pMatrix ); // Y swap !

      var prog                   = this.assets.prog[ "Shade" ]
      
      gl.useProgram              (prog);
      gl.uniformMatrix4fv        (prog.params.pMatrixUniform.name , false, pMatrix);
      gl.uniformMatrix4fv        (prog.params.mvMatrixUniform.name, false, mvMatrix);
      gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
      gl.enableVertexAttribArray (prog.attr.vertexPositionAttribute);
      gl.vertexAttribPointer     (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
                                 
      gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
      gl.enableVertexAttribArray (prog.attr.textureCoordAttribute);
      gl.vertexAttribPointer     (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
   
      gl.activeTexture           (gl.TEXTURE0);
      gl.bindTexture             (gl.TEXTURE_2D, tmpTex);
      gl.uniform1i               (prog.params.uSamplerTex1.name, 0);

      gl.uniform3fv              (prog.params.uLight.name   , [-params.uLight[0],-params.uLight[1],-params.uLight[2]]);
      gl.uniform1f               (prog.params.uScale.name   , params.scale);
      //gl.uniform3fv              (prog.params.uLight.name   , [0.0,0.0,-50.0] ); 
      //gl.uniform1f               (prog.params.uScale.name   , 1); 
      var r                      = this.mapView.context.coordS.Resolution ( this.z );
      gl.uniform1f               (prog.params.uPixRes.name  , r ); 
         
      gl.drawArrays              (gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

      gl.bindFramebuffer         ( gl.FRAMEBUFFER, null );
      gl.activeTexture           (gl.TEXTURE0);
      gl.bindTexture             (gl.TEXTURE_2D, null );
      
      gl.deleteTexture           (tmpTex);
      gl.deleteFramebuffer       (fbtx[0]);
   }
   else { // create fake
      this.tex             = gl.createTexture();
      gl.bindTexture       ( gl.TEXTURE_2D           , this.tex     );
      gl.pixelStorei       ( gl.UNPACK_FLIP_Y_WEBGL  , false        );
      var byteArray        = new Uint8Array        ( [1,1,1,0 , 1,1,1,0 , 1,1,1,0 , 1,1,1,0] );
      gl.texImage2D        ( gl.TEXTURE_2D           , 0                           , gl.RGBA, 2 , 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray)
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
      gl.bindTexture       ( gl.TEXTURE_2D           , null         );
      this.w = 2;
      this.h = 2;
   }
   
   var diffT   = date.getTime() - startT;   
   return diffT
}

//------------------------------------------------------------------//

module.exports = ShadeLayerPart;

},{}],27:[function(_dereq_,module,exports){
//=============================================================//

VectorialLayerPart.BACK   = "back";
VectorialLayerPart.FRONT  = "front";

//=============================================================//

function VectorialLayerPart ( mapView, inZoom ) {
   this.mapView = mapView;
   
   this.gl     = mapView.context.assets.ctx;

   this.cnv    = null;
   this.tex    = null;
   this.ctx    = null;
   this.data   = null;
   this.z      = inZoom;
   
   this.layerCount = 0;
}

VectorialLayerPart.prototype.AllocCanvas = function ( ) {
   this.cnv             = document.createElement("canvas");
   this.cnv.height      = Maperial.tileSize ;
   this.cnv.width       = Maperial.tileSize ;
   this.ctx             = this.cnv.getContext("2d");
   ExtendCanvasContext  ( this.ctx );
   this.ctx.globalCompositeOperation="source-over";

   // Clear ...
   
   if (Maperial.bgdimg in window.maperialSymb) {
      var symb = window.maperialSymb[Maperial.bgdimg];
      this.ctx.drawImage( symb.data, 0 , 0 );
   }else {
      this.ctx.beginPath   (  );
      this.ctx.rect        ( 0,0,this.cnv.width,this.cnv.height );
      this.ctx.closePath   (  );
      this.ctx.fillStyle    = 'rgba(255,255,255,0.0)';
      this.ctx.fill        (  );
   }
}

VectorialLayerPart.prototype.GetType = function ( ) {
   return LayerManager.Vector;
}

VectorialLayerPart.prototype.Init = function ( data ) {
   if (this.tex)
      return;
      
   this.data   = data;
   var gl      = this.gl;
   
   if (data) {
      this.AllocCanvas();
   }
}

VectorialLayerPart.prototype.Reset = function (  ) {
   var gl            = this.gl;
   this.layerCount   = 0
   if (this.cnv) {
      delete this.cnv;
      this.cnv          = null;
      this.AllocCanvas ( );
   }
   if (this.tex) {
      gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
}

VectorialLayerPart.prototype.Release = function (  ) {
   var gl = this.gl;
   if (this.tex) {
      gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
   if (this.cnv) {
      delete this.cnv;
      this.cnv = null;
   }
}

VectorialLayerPart.prototype.IsUpToDate = function ( ) {
   return this.layerCount == null;
}

VectorialLayerPart.prototype.Update = function ( params, layerPosition ) {
   var gl = this.gl;
   if (this.tex == null ) {
      if (this.data) {
         this.tex             = gl.createTexture();
      }
      else { // create fake !
         this.tex             = gl.createTexture();
         this.layerCount      = null;
         gl.bindTexture       ( gl.TEXTURE_2D           , this.tex     );
         gl.pixelStorei       ( gl.UNPACK_FLIP_Y_WEBGL  , false        );
         var byteArray        = new Uint8Array        ( [1,1,1,0 , 1,1,1,0 , 1,1,1,0 , 1,1,1,0] );
         gl.texImage2D        ( gl.TEXTURE_2D           , 0                           , gl.RGBA, 2 , 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray)
         gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
         gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
         gl.bindTexture       ( gl.TEXTURE_2D           , null         );
         return 2;
      }
   }

   var osmVisibilities = this.mapView.context.osmVisibilities;
   var styleUID   = params.styles[params.selectedStyle];
   var style      = this.mapView.stylesManager.getStyle(styleUID).content;

   if ( ! style ) {
      console.log ( "Invalid style");
      this.layerCount = null;
      this._BuildTexture();
      return 2;
   }
   var rendererStatus   = TileRenderer.RenderLayers (osmVisibilities, layerPosition,  this.ctx , this.data , this.z , style , this.layerCount ) ;

   this.layerCount      = rendererStatus[0];
   
   var diffT = 0;
   if (this.IsUpToDate()) { // Render is finished, build GL Texture
      var date    = (new Date)
      var startT  = date.getTime()
      this._BuildTexture();
      diffT   = date.getTime() - startT;
   }
   
   return rendererStatus[1] + diffT
}

VectorialLayerPart.prototype._BuildTexture = function (  ) {
   var gl = this.gl;
   gl.bindTexture  (gl.TEXTURE_2D           , this.tex     );
   gl.pixelStorei  (gl.UNPACK_FLIP_Y_WEBGL  , false        );
   gl.texImage2D   (gl.TEXTURE_2D           , 0                           , gl.RGBA    , gl.RGBA, gl.UNSIGNED_BYTE, this.cnv);
   gl.texParameteri(gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
   gl.texParameteri(gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
   gl.bindTexture  (gl.TEXTURE_2D           , null         );
}

//------------------------------------------------------------------//

module.exports = VectorialLayerPart;

},{}],28:[function(_dereq_,module,exports){

var GLTools                 = _dereq_("./tools/gl-tools.js"),
Point                   = _dereq_('../../libs/point.js'),
Tile                    = _dereq_('./tile.js'),
ColorbarRenderer        = _dereq_('./colorbar-renderer.js'),
DynamicalRenderer       = _dereq_('./dynamical-renderer.js'),
HeatmapRenderer         = _dereq_('./heatmap-renderer.js'),
utils                   = _dereq_('../../../tools/utils.js'),
mat4                    = _dereq_('../../libs/gl-matrix-min.js').mat4;

//=====================================================================================//

function MapRenderer(mapView) {

    console.log("  starting MapRenderer for view " + mapView.id + "...");

    this.mapView               = mapView;

    /** init GL **/
    this.start();

    this.assets                = mapView.context.assets;
    this.gl                    = mapView.context.assets.ctx

    this.dynamicalRenderers    = {};
    this.colorbarRenderer      = new ColorbarRenderer(this.mapView);
}

//----------------------------------------------------------------------//

MapRenderer.prototype.start = function () {

    this.gl                = null;
    this.drawSceneInterval = null;

    try {
        // Try to grab the standard context. If it fails, fallback to experimental.
        this.gl = this.mapView.canvas.getContext("webgl") || this.mapView.canvas.getContext("experimental-webgl");
        this.fitToSize();
    } catch (e) {}

    if (!this.gl) {
        console.log("     Could not initialise WebGL")
        return false;
    }

    this.gltools = new GLTools ()
    this.InitGL()

    this.drawSceneInterval = setInterval( utils.apply ( this, "DrawScene" ) , Maperial.refreshRate);
    return true;
} 

//----------------------------------------------------------------------//

MapRenderer.prototype.fitToSize = function () {

    if(this.gl){
        this.gl.viewportWidth  = this.mapView.canvas.width();
        this.gl.viewportHeight = this.mapView.canvas.height();
    }
    else{
        console.log("---------> couldn't fitToSize")      
    }

}

MapRenderer.prototype.InitGL = function () {

    this.glAsset         = new Object();
    this.glAsset.ctx     = this.gl;
    this.mapView.context.assets  = this.glAsset;

    GlobalInitGL( this.glAsset , this.gl , this.gltools);

}

//----------------------------------------------------------------------//

MapRenderer.prototype.addDynamicalRenderer = function(dynamicalData, style){
    var renderer = new DynamicalRenderer(this.gl, dynamicalData, style);
    this.dynamicalRenderers[renderer.id] = renderer;
    return renderer;
}

//---------------------------------------------------------------------------//

MapRenderer.prototype.addHeatmapRenderer = function(heatmapData, colorbar, options){
    var renderer = new HeatmapRenderer(this.mapView, heatmapData, colorbar, options);
    this.dynamicalRenderers[renderer.id] = renderer;
    return renderer;
}

//----------------------------------------------------------------------//

MapRenderer.prototype.DrawScene = function ( ) {

    var w = this.mapView.canvas.clientWidth,
        h = this.mapView.canvas.clientHeight,

        w2 = Math.floor ( w / 2 ),
        h2 = Math.floor ( h / 2 ),

        r       = this.mapView.context.coordS.Resolution ( this.mapView.context.zoom ),
        originM = new Point( this.mapView.context.centerM.x - w2 * r , this.mapView.context.centerM.y + h2 * r ),
        tileC   = this.mapView.context.coordS.MetersToTile ( originM.x, originM.y , this.mapView.context.zoom ),

        originP = this.mapView.context.coordS.MetersToPixels ( originM.x, originM.y, this.mapView.context.zoom ),
        shift   = new Point ( Math.floor ( tileC.x * Maperial.tileSize - originP.x ) , Math.floor ( - ( (tileC.y+1) * Maperial.tileSize - originP.y ) ) ),

        nbTileX = Math.floor ( w  / Maperial.tileSize + 1 ),
        nbTileY = Math.floor ( h  / Maperial.tileSize + 1 ) ; 

    //-----------------------------------------------------------------//

    // TODO : utiliser le principe de version des colorbars ici aussi
//  this.renderAllColorBars();

    //-----------------------------------------------------------------//

    this.colorbarRenderer.refreshAllColorBars();

    //-----------------------------------------------------------------//

    if ( this.UpdateTiles ( tileC.x , tileC.x + nbTileX , tileC.y - nbTileY , tileC.y , this.forceTileRedraw ) || this.forceGlobalRedraw) {

        var mvMatrix      = mat4.create(),
            pMatrix       = mat4.create();
        
        mat4.identity    ( pMatrix );
        mat4.ortho       ( 0, w , h, 0 , 0, 1, pMatrix ); // Y swap !
        
        this.gl.viewport ( 0, 0, w , h);
        this.gl.clear    ( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

        for ( var wx = shift.x, tx = tileC.x ; wx < w ; wx = wx + Maperial.tileSize , tx = tx + 1) {
            for ( var wy = shift.y, ty = tileC.y ; wy < h ; wy = wy+ Maperial.tileSize , ty = ty - 1) {
                mat4.identity (mvMatrix);
                mat4.translate(mvMatrix, [wx, wy , 0]);
                var key  = tx + "," + ty + "," + this.mapView.context.zoom;
                var tile = this.mapView.tiles[key]
                tile.Render ( pMatrix, mvMatrix );
            }
        }
    }

    //-----------------------------------------------------------------//

    for( var rendererId in this.dynamicalRenderers) {
        var renderer = this.dynamicalRenderers[rendererId];
        renderer.Refresh ( this.mapView.context.zoom , tileC.x , tileC.y - nbTileY , nbTileX + 1 , nbTileY + 1 ) ;
    }

    //-----------------------------------------------------------------//

    this.forceGlobalRedraw  = true;
    this.forceTileRedraw    = false;
}

//----------------------------------------------------------------------//

MapRenderer.prototype.UpdateTiles = function ( txB , txE , tyB , tyE, forceTileRedraw ) {

    var keyList = [];
    var zoom = this.mapView.context.zoom;

    for ( tx = txB ; tx <= txE ; tx++) {
        for ( ty = tyB ; ty <= tyE ; ty++) {
            var key = tx + "," + ty + "," + zoom;
            keyList.push(key)

            if ( this.mapView.tiles[key] == null ) {
                this.mapView.tiles[key] = this.createTile(tx, ty, zoom);
            }
        }
    }

    // unload unnecessary loaded tile
    for (var key in this.mapView.tiles) {
        var isInKeyList = false
        for (var ki = 0 ; ki < keyList.length ; ki++) {
            if (keyList[ki] === key) isInKeyList = true
        }
        if ( ! isInKeyList ) {
            this.mapView.tiles[key].Release();
            delete this.mapView.tiles[key];
        }
    }

    if ( forceTileRedraw ) {
        for (var key in this.mapView.tiles) {
            var tile = this.mapView.tiles[key].Reset ( );
        }
    }

    var tileModified  = false;
    var timeRemaining = Maperial.refreshRate - 5;

    for (var ki = 0 ; ki < keyList.length ; ki++) {      
        var tile = this.mapView.tiles[keyList[ki]];
        if (tile && !tile.IsUpToDate () )  {
            tileModified = true
            timeRemaining = tile.Update( timeRemaining )
            if ( timeRemaining <= 0 )
                break;
        }
    }

    return tileModified
}


MapRenderer.prototype.createTile = function ( x,y,z ) {
    return new Tile (this.mapView, x,y,z);
}

//------------------------------------------------------------------//
//PRIVATE
//----------------------------------------------------------------------//

function GlobalInitGL( glAsset , gl , glTools) {

    glAsset.shaderData                = null;
    glAsset.shaderError               = false;
    var me                            = glAsset;

    glAsset.ShaderReq  = $.ajax({
        type     : "GET",
        url      : Maperial.staticURL + "/shaders/all.json",
        dataType : "json",
        async    : false,
        success  : function(data, textStatus, jqXHR) {
            me.shaderData = data;
            for (k in me.shaderData) {
                me.shaderData[k].code = me.shaderData[k].code.replace (/---/g,"\n") 
            }
        },
        error : function(jqXHR, textStatus, errorThrown) {
            me.shaderError = true
            console.log ( Maperial.staticURL + "/shaders/all.json" + " : loading failed : " + textStatus );
        }
    });

    var vertices                                  = [ 0.0  , 0.0  , 0.0,     256.0, 0.0  , 0.0,      0.0  , 256.0, 0.0,      256.0, 256.0, 0.0 ];
    glAsset.squareVertexPositionBuffer            = gl.createBuffer();
    gl.bindBuffer   ( gl.ARRAY_BUFFER, glAsset.squareVertexPositionBuffer );
    gl.bufferData   ( gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW );
    glAsset.squareVertexPositionBuffer.itemSize   = 3;
    glAsset.squareVertexPositionBuffer.numItems   = 4;

    var textureCoords                             = [ 0.0, 0.0,     1.0, 0.0,      0.0, 1.0,      1.0, 1.0 ]; // Y swap
    glAsset.squareVertexTextureBuffer             = gl.createBuffer();
    gl.bindBuffer   ( gl.ARRAY_BUFFER, glAsset.squareVertexTextureBuffer );
    gl.bufferData   ( gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW );
    glAsset.squareVertexTextureBuffer.itemSize    = 2;
    glAsset.squareVertexTextureBuffer.numItems    = 4;

    var nb = 1;
    vertices                                      = [ 0.0, 0.0, 0.0 ]; // center
    textureCoords                                 = [ 0.0, 0.0 ]; 
    for (var i = 0 ; i <= 360 ; i += 5 ) {
        var a = i * (2.0 * Math.PI / 360.0);
        vertices.push ( Math.sin(a) * 0.5 )
        vertices.push ( Math.cos(a) * 0.5 )
        vertices.push ( 0.0 )
        textureCoords.push (1.0)
        textureCoords.push (1.0)
        nb += 1;
    }

    //GL_TRIANGLE_FAN
    glAsset.circleVertexPositionBuffer            = gl.createBuffer();
    gl.bindBuffer   ( gl.ARRAY_BUFFER, glAsset.circleVertexPositionBuffer );
    gl.bufferData   ( gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW );
    glAsset.circleVertexPositionBuffer.itemSize   = 3;
    glAsset.circleVertexPositionBuffer.numItems   = nb;

    glAsset.circleVertexTextureBuffer             = gl.createBuffer();
    gl.bindBuffer   ( gl.ARRAY_BUFFER, glAsset.circleVertexTextureBuffer );
    gl.bufferData   ( gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW );
    glAsset.circleVertexTextureBuffer.itemSize    = 2;
    glAsset.circleVertexTextureBuffer.numItems    = nb;

    gl.clearColor   ( 1.0, 1.0, 1.0, 1.0  );
    gl.disable      ( gl.DEPTH_TEST  );

    glAsset.prog = {}
    glAsset.prog["HeatGaussian"]         = glTools.MakeProgram   ( "vertexTex" , "fragmentHeatGaussian" , glAsset); 
    glAsset.prog["HeatLinear"]           = glTools.MakeProgram   ( "vertexTex" , "fragmentHeatLinear"   , glAsset); 
    glAsset.prog["Tex"]                  = glTools.MakeProgram   ( "vertexTex" , "fragmentTex"          , glAsset); 
    glAsset.prog["Clut"]                 = glTools.MakeProgram   ( "vertexTex" , "fragmentClut"         , glAsset);
    glAsset.prog["Shade"]                = glTools.MakeProgram   ( "vertexTex" , "fragmentShade"        , glAsset);
    glAsset.prog[Maperial.MulBlend]      = glTools.MakeProgram   ( "vertexTex" , "fragmentMulBlend"     , glAsset);
    glAsset.prog[Maperial.AlphaClip]     = glTools.MakeProgram   ( "vertexTex" , "fragmentAlphaClip"    , glAsset);
    glAsset.prog[Maperial.AlphaBlend]    = glTools.MakeProgram   ( "vertexTex" , "fragmentAlphaBlend"   , glAsset);
}

//------------------------------------------------------------------//

module.exports = MapRenderer;

},{"../../../tools/utils.js":41,"../../libs/gl-matrix-min.js":35,"../../libs/point.js":38,"./colorbar-renderer.js":20,"./dynamical-renderer.js":21,"./heatmap-renderer.js":22,"./tile.js":31,"./tools/gl-tools.js":32}],29:[function(_dereq_,module,exports){


function PointSymbolizer (symbName,opacity) {
   this.rt        = "PointSymbolizer";
   this.file      = symbName;
   this.opacity   = typeof opacity !== 'undefined' ? opacity : 1.0;
   this.Load ([symbName])
}

PointSymbolizer.prototype.Load = function  (symblist) {
   var symbs = {}
   for ( var i = 0 ; i < symblist.length ; i++) {
      symbs[symblist[i]] = 1
   }
   styleManager.LoadSymbList (symbs,function(){})
}

PointSymbolizer.prototype.Translate = function  ( trX, trY ) {
   this.trX = trX
   this.trY = trY
}

PointSymbolizer.prototype.Alignement = function  ( xAlign, yAlign ) { // top, bottom, left,right , center (default)
   this.centerX = xAlign
   this.centerY = yAlign
}

PointSymbolizer.prototype.SetCustomFunction = function  (fctCustom, fctInit) {
   if (typeof fctCustom == 'function') {
      this.custom = fctCustom
   }
   if (typeof fctInit == 'function') {
      this._init = fctInit;
      this._init();
   }
}

//------------------------------------------------------------------//

module.exports = PointSymbolizer;
},{}],30:[function(_dereq_,module,exports){

var TileRenderer = {};

//----------------------------------------------------------------------------------------------//
/*
 * subLayerId + zoom = ruleId = unique
 */

TileRenderer.layerDummyColors = [];
TileRenderer.ApplyStyle = function ( ctx , line , attr, subLayerId , zoom , style ) {

   try {
      var subLayer = style [ subLayerId ] // on a 1 seul symbolizer par layer
      
      if ( !subLayer.visible ) return;

      for (var _s = 0 ; _s < subLayer.s.length ; _s++ ) {
         var curStyle = subLayer.s[_s];
         if ( zoom >= curStyle.zmax && zoom <= curStyle.zmin) {            
            for (var _ss = 0 ; _ss < curStyle.s.length ; _ss++){ 
               var params = curStyle.s[_ss];
               if ( "custom" in params && typeof (params.custom) == 'function' ) {
                  params.custom (attr)
               }
               if ( TileRenderer[params.rt] ) 
                  TileRenderer[ params.rt ] ( ctx , line, attr, params )
            }
         }
      }
   }
   catch (e) {
//    console.log ( "ApplyStyle Failed : " + e );
   }
}

/**
 *  data = json qui contient toutes les donnees de la map.
 *  data["l"] = <layers> = toutes les donnees lieees au Layers
 *  			contient une liste de <layerGroup>
 *  <layerGroup> contient une liste de <layer> (ll) et une liste de sources (liee)
 *  <layer> contient une liste de <rule> 
 *  <rule> contient une liste de <style> 
 *  
 * Un layer est une liste de g group
 */
TileRenderer.maxRenderTime = 0
TileRenderer.RenderLayers = function (osmVisibilities, layerPosition , ctx , data , zoom , style , cursor  ) {

   //-------------------------------------------------//

   if(!data)
      return cursor;
   
   //-------------------------------------------------//

   var beginAt;
   var limitTime = false;

   if(typeof(cursor)==='undefined' || cursor == null) {
      beginAt = 0;
   }
   else {
      beginAt = cursor;
      limitTime = true;
   }

   //-------------------------------------------------//

   var date    = new Date();
   var startT  = date.getTime();

   //-------------------------------------------------//

   for (var i = beginAt ; i < data["l"].length ; ++i ) {
      
      var layer = data["l"][i]; // layerGroup
      var subLayerId = layer["c"]; // class - il devrait y avoir une class par Layer, pas par LayerGroup ?
      
      if( osmVisibilities != null &&  layerPosition != null &&  osmVisibilities[subLayerId] != layerPosition )
         continue;
      
      var ll = layer["g"]; // liste de listes de lignes
      var al = null; // attributlist
      if ("a" in layer) al = layer["a"];
      if (ll == null) 
         continue;

      for ( var l = 0 ; l < ll.length ; ++l ) {
         var lines = ll[l]; // liste de lignes
         var attr  = null; // attribut
         if (al) attr = al[l] // attributlist
         for ( var li = 0 ; li < lines.length ; ++li ) 
         {
            var line = lines[li];
            TileRenderer.ApplyStyle ( ctx , line , attr , subLayerId , zoom, style );
         }
      }
      if (limitTime) {
         var diffT   = (new Date).getTime() - startT;
         TileRenderer.maxRenderTime = Math.max(TileRenderer.maxRenderTime, diffT);
         if ( diffT > 10 )
            break;

      }
   }
   
   //-------------------------------------------------//
   
   var diffT   = (new Date).getTime() - startT;
   if ( i < data["l"].length )
      return [ i+1 , diffT ];
   else 
      return [ null , diffT ] ;
}

//------------------------------------------------------------------------------------------------//

/**
 * 
 */
TileRenderer.RenderDynamicalLayer = function (ctx , data , zoom , style , cursor) {
    
    //-------------------------------------------------//
    
    if(!data)
        return cursor;
    
    //-------------------------------------------------//
    
    var beginAt;
    var limitTime = false;
    
    if(typeof(cursor)==='undefined' || cursor == null) {
        beginAt = 0;
    }
    else {
        beginAt = cursor;
        limitTime = true;
    }
    
    //-------------------------------------------------//
    
    var date    = new Date();
    var startT  = date.getTime();
    
    //-------------------------------------------------//
    // rendering points only
    // todo : render lines
    
    var i = beginAt;
    for (var id in data.points ) {
        
        var point = data.points[id];
        
        TileRenderer.ApplyStyle ( ctx, [point.x, point.y], point.data, style.symbId, zoom, style.content );
        
        if (limitTime) {
            var diffT   = (new Date).getTime() - startT;
            TileRenderer.maxRenderTime = Math.max(TileRenderer.maxRenderTime, diffT);
            if ( diffT > 10 )
                break;
        }
        
        i++;
    }
    
    //-------------------------------------------------//
    
    var diffT   = (new Date).getTime() - startT;
    if ( i < Object.keys(data.points).length )
        return [ i+1 , diffT ];
    else 
        return [ null , diffT ] ;
}

//------------------------------------------------------------------------------------------------//

TileRenderer.FindSubLayerId = function ( point, ctx , data , zoom, styleContent, layerPosition, osmVisibilities ) {

   ctx.scale(1,1);
   var i;
   for (i = data["l"].length - 1 ; i >= 0  ; i-- ) {
      
      // render the symbolizers
      var layer = data["l"][i]; // layerGroup
      var subLayerId = layer["c"]; // class - il devrait y avoir une class par Layer, pas par LayerGroup ?
      
      if(osmVisibilities[subLayerId] != layerPosition)
         continue;

      var subLayer = styleContent [ subLayerId ];
      
      if ( !subLayer.visible ) 
         continue;
      
      // clear
      ctx.fillStyle = "#fff";
      ctx.fillRect(point.x, point.y, 1, 1);
      
      var ll = layer["g"]; // liste de listes de lignes
      var al = null; // attributlist
      if ("a" in layer) al = layer["a"]
      if (ll == null) 
         continue
         
      for ( var l = 0 ; l < ll.length ; ++l ) {
         var lines = ll[l] // liste de lignes
         var attr  = null // attribut
         if (al) attr = al[l] // attributlist
         for ( var li = 0 ; li < lines.length ; ++li ) 
         {
            TileRenderer.ApplyLookupStyle ( ctx , lines[li] , attr , subLayer , zoom);
         }
      }

      // now get the pixel and its color to know if this layer is under the click
      // NOTE : getImageData : coord for the canvas, not the ctx => no translation
      var pixel = ctx.getImageData(0, 0, 1, 1).data;
      
      // retrieve the color
      var color = ("000000" + Utils.rgbToHex(pixel[0], pixel[1], pixel[2])).slice(-6);
      
      if(color != "ffffff")
         return subLayerId;
   }
   
   return false;
}

TileRenderer.ApplyLookupStyle = function ( ctx , line , attr, subLayer , zoom  ) {
   try {
      for (var _s = 0 ; _s < subLayer.s.length ; _s++ ) {
         var curStyle = subLayer.s[_s];

         if ( zoom >= curStyle.zmax && zoom <= curStyle.zmin ) {
            for (var _ss = 0 ; _ss < curStyle.s.length ; _ss++){ 
               var params = curStyle.s[_ss];

               if ( TileRenderer[params.rt] ) 
               { 
                  var params = jQuery.extend(true, {}, params);
                  params["alpha"] = "1";
                  params["fill"] = "#000000";
                  params["stroke"] = "#000000";

                  TileRenderer[ params.rt ] ( ctx , line, attr, params )
               }
            }
         }
      }
   }
   catch (e) {
//    console.log ( "ApplyStyle Failed : " + e );
   }
}

//----------------------------------------------------------------------------------------------//

// v2 @deprecated ? 
TileRenderer.DrawImages = function (tile, ctx, wx, wy ) {
   
   if ( tile && tile.IsLoaded() && tile.IsUpToDate()) {
      ctx.beginPath();
      ctx.rect(wx, wy , Maperial.tileSize, Maperial.tileSize);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.closePath();
      
      tile.RenderVectorialLayers(ctx, wx, wy);
   }
   else {
      ctx.beginPath();
      ctx.rect(wx, wy , Maperial.tileSize, Maperial.tileSize);
      ctx.closePath();
      ctx.fillStyle = '#EEEEEE';
      ctx.fill();
      ctx.beginPath();
      ctx.closePath();
   }
}

//----------------------------------------------------------------------------------------------//
//Symbolizer rendering

TileRenderer.LineSymbolizer = function( ctx , line , attr , params ) {
   ctx.save()
   if  ( "dasharray" in params ) {
      var daStr = params  ["dasharray"].split(",");
      var da = $.map( daStr , function(n){ return parseInt(n); });
      RenderLineDA(ctx,line,da);
   }
   else {
      RenderLine(ctx,line);   
   }
   if ( "alpha" in params ) {
      ctx.globalAlpha=params["alpha"]
   }
   if ( "width" in params ) {
      ctx.lineWidth = params["width"] ;
   }
   if ( "linejoin" in params ) 
      ctx.lineJoin= params["linejoin"] ;
   if ( "linecap" in params )
      ctx.lineCap = params ["linecap"];
   if ( "stroke" in params ) {
      ctx.strokeStyle= params["stroke"]
      ctx.stroke();
   }
   ctx.restore()
}

TileRenderer.PolygonSymbolizer = function ( ctx , line , attr , params ) {
   ctx.save()
   RenderLine(ctx,line);   
   if ( "alpha" in params ) 
      ctx.globalAlpha=params["alpha"]
   if ( "fill" in params ) {
      ctx.fillStyle= params["fill"]
      ctx.fill();
   }
   ctx.restore()
}

TileRenderer.LinePatternSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   console.log ("Not yet implemented : LinePatternSymbolizer")
   // ctx.restore()
}

TileRenderer.PolygonPatternSymbolizer = function ( ctx , line , attr , params ) {
   if ( "file" in params ) {
      var symb = window.maperialSymb[params.file];
   
      ctx.save()
      RenderLine(ctx,line);
      ctx.clip()
      if ( "alpha" in params ) 
         ctx.globalAlpha=params["alpha"]
      ctx.drawImage( symb.data, 0 , 0 );
      ctx.restore()
   }
   // ctx.save()
   //console.log ("Not yet implemented : PolygonPatternSymbolizer")
   //console.log ( line )
   //console.log ( params )
   // ctx.restore()
}

TileRenderer.PointSymbolizer = function ( ctx , line , attr , params ) {
   if ( params.file in window.maperialSymb ) {
      var sx = 1.0;
      var sy = 1.0;
      if ('_sx' in ctx ) {
         sx = ctx._sx;
         sy = ctx._sy;
      }
      
      var trX = 0;
      var trY = 0;
      if ( 'trX' in params )
         trX = params.trX;
      if ( 'trY' in params )
         trY = params.trY;

      var symb = window.maperialSymb[params.file];
      if (symb.type == "svg") {
         var w    = 0.0
         var h    = 0.0
         var node = symb.data.getElementsByTagName("svg")[0]
         if (node) {
            w = parseInt(node.getAttribute("width"));
            h = parseInt(node.getAttribute("height"));
         }
         
         var shiftX = - (w / 2.0); // default centered
         var shiftY = - (h / 2.0); // default centered
         if ('centerX' in params) {
            if (params.centerX == "left")
               shiftX = 0;
            else if (params.centerX == "right")
               shiftX = -w
         }
         if ('centerY' in params) {
            if (params.centerY == "top")
               shiftY = 0;
            else if (params.centerY == "bottom")
               shiftY = -h
         }
         
         ctx.save()
         if ('_tx' in ctx ) {
            ctx.translate (ctx._tx,ctx._ty)
         }
         if ( "opacity" in params ) {
            ctx.globalAlpha=params["opacity"]
         }
         ctx.drawSvg( symb.data, (line[0]*sx) + shiftX + trX, (line[1]*sy) + shiftY + trY);
         ctx.restore()
      }
      else { //"img"
         var shiftX = -(symb.data.width / 2.0); // default centered
         var shiftY = -(symb.data.height / 2.0); // default centered
         if ('centerX' in params) {
            if (params.centerX == "left")
               shiftX = 0;
            else if (params.centerX == "right")
               shiftX = -symb.data.width
         }
         if ('centerY' in params) {
            if (params.centerY == "top")
               shiftY = 0;
            else if (params.centerY == "bottom")
               shiftY = -symb.data.height
         }
         
         ctx.save()
         if ('_tx' in ctx ) {
            ctx.translate (ctx._tx,ctx._ty)
         }
         if ( "opacity" in params ) {
            ctx.globalAlpha=params["opacity"]
         }
         ctx.drawImage( symb.data, (line[0]*sx) + shiftX + trX, (line[1]*sy) + shiftY + trY);
         ctx.restore()
      }
   }
}

TileRenderer.TextSymbolizer = function ( ctx , line , attr , params ) {
   if (! attr)
      return false;
   
   var fontname = ("face-name" in params && params["face-name"]) ? params["face-name"] : "DejaVu Sans";
   var size     = "size" in params ? params.size+"px" : "8px";   
   var font     = size + " " + fontname;
   
   ctx.save();
   ctx.SetFont(font);
   if ( "opacity" in params ) {
      ctx.globalAlpha=params["opacity"]
   }
   var fillit  = false
   var stokeit = false
   var cutSize = 0;
   var center  = false;

   var translate = [ '_tx' in ctx ? ctx._tx : 0.0 , '_ty' in ctx ? ctx._ty : 0.0 ];
   if ("dx" in params) translate[0] += parseInt( params["dx"] )
   if ("dy" in params) translate[1] += parseInt( params["dy"] )
   if ("shield-dx" in params) translate[0] += parseInt( params["shield-dx"] )
   if ("shield-dy" in params) translate[1] += parseInt( params["shield-dy"] )
   
   if ( "halo-fill" in params &&  "halo-radius" in params ) {
      ctx.lineWidth  = parseInt ( params["halo-radius"] ) * 2 ;
      ctx.strokeStyle= params["halo-fill"];
      stokeit = true
   }
   if ( "wrap-width" in params ) {
      cutSize = parseInt(params["wrap-width"]);
   }
   if (line.length > 2) {
      center = true;
   }
   if ( "placement" in params && params["placement"] == "point" ) {
      center = true;
   }
   if ( "fill" in params ) {
      ctx.fillStyle= params["fill"];
      fillit = true
   }
   var txt = attr
   if ("text-transform" in params) {
      if (params["text-transform"] == "uppercase") {
         txt = txt.toUpperCase()
      }
      else if (params["text-transform"] == "lowercase") {
         txt = txt.toLowerCase()()
      }
   }

   var colDetection = [true,true]
   if ('collisionThis' in params)
      colDetection[0] = params['collisionThis']
   if ('collisionOther' in params)
      colDetection[1] = params['collisionOther']
      
   isRenderer = false
   if (stokeit && fillit) {
      isRenderer = ctx.strokeAndFillText (txt,line,cutSize,center,translate,colDetection)
   }
   else if (stokeit) {
      isRenderer = ctx.strokeText (txt,line,cutSize,center,translate,colDetection)
   }
   else if (fillit) {
      isRenderer = ctx.fillText (txt,line,cutSize,center,translate,colDetection)
   }
   ctx.restore();
   return isRenderer;
}

TileRenderer.RasterSymbolizer = function( ctx , line , attr , params ) {
   // ctx.save()
   //console.log ("Not yet implemented : RasterSymbolizer")
   // ctx.restore()
}

TileRenderer.ShieldSymbolizer = function ( ctx , line , attr , params ) {
   rendererT = this.TextSymbolizer (ctx , line , attr + '', params)
   if (rendererT) {
      var tx,ty;
      if ("shield-dx" in params) tx = parseInt( params["shield-dx"] )
      if ("shield-dy" in params) ty = parseInt( params["shield-dy"] )
      ctx.save()
      ctx.translate (tx,ty)
      this.PointSymbolizer(ctx , line , attr , params)
      ctx.restore ( )
   }
}

TileRenderer.BuildingSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   //console.log ("Not yet implemented : BuildingSymbolizer")
   // ctx.restore()
}

TileRenderer.MarkersSymbolizer = function ( ctx , line , attr , params ) {
   var placement = "point"
   if ( "placement" in params ) placement = params["placement"]
   
   var geom;
   if (placement == "point" ) { geom = "ellipse" }
   else                       { geom = "arrow"   }
   
   if ( "marker-type" in params ) geom = params["marker-type"]
   
   var file = null
   if ( "file" in params ) file = params["file"]
   
   if ( geom == "ellipse" && placement == "point" && !file) {
      var sx = 1.0;
      var sy = 1.0;
      if ('_sx' in ctx ) {
         sx = ctx._sx;
         sy = ctx._sy;
      }
      
      ctx.save()

      if ('_tx' in ctx ) {
         ctx.translate (ctx._tx,ctx._ty)
      }
      
      var w = 10.0
      var h = 10.0
      if ( "width" in params )   {  w=parseFloat(params["width"])  }
      if ( "height" in params )  {  h=parseFloat(params["height"]) }
      
      w=h // I don't know why our style is broken => draw allipse and not circle ...
      ctx.scale(1,h/w)
      ctx.beginPath();
      ctx.arc( line[0] * sx, line[1] * sy , w ,0 , Math.PI*2 , false );
      
      if ( "stroke-opacity" in params ){  ctx.globalAlpha=params["stroke-opacity"]}
      else                             {  ctx.globalAlpha=1 }
      if ( "stroke-width" in params )  {  ctx.lineWidth = params["stroke-width"] ;}
      
      if ( "stroke" in params ) {
         ctx.strokeStyle= params["stroke"]
         ctx.stroke();
      }
      
      if ( "opacity" in params ) {  ctx.globalAlpha=params["opacity"]   }
      else                       {  ctx.globalAlpha=1                   }
      if ( "fill" in params ) {
         ctx.fillStyle= params["fill"]
         ctx.fill();
      }
      
      ctx.restore()
   }
   else {
      console.log ("Not yet implemented : MarkersSymbolizer (not ellipse / placement point)")
   }
}

TileRenderer.GlyphSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   console.log ("Not yet implemented : GlyphSymbolizer")
   // ctx.restore()
}

//------------------------------------------------------------------//

module.exports = TileRenderer;

},{}],31:[function(_dereq_,module,exports){

var GLTools                 = _dereq_("./tools/gl-tools.js"),
    Layer                   = _dereq_("../models/layer.js"),
    DynamicalLayerPart      = _dereq_('./layerparts/dynamical-layer-part.js'),
    ImageLayerPart          = _dereq_('./layerparts/image-layer-part.js'),
    RasterLayer8            = _dereq_('./layerparts/raster-layer-part.js').RasterLayer8,
    RasterLayer16           = _dereq_('./layerparts/raster-layer-part.js').RasterLayer16,
    ShadeLayerPart          = _dereq_('./layerparts/shade-layer-part.js'),
    VectorialLayerPart      = _dereq_('./layerparts/vectorial-layer-part.js');
    
//----------------------------------------------------------------------------------------------------------------------//

function Tile (mapView, x, y, z) {

   this.mapView      = mapView;
   this.gl           = mapView.context.assets.ctx
   this.assets       = mapView.context.assets

   this.x            = x;
   this.y            = y;
   this.z            = z;

   this.layerParts   = [];

   // preparing double buffering to render as texture !
   this.frameBufferL = [];
   this.texL         = [];
   this.nbErrors     = 0;

   this.Refresh();
   this.buildLayerParts();
   this.prepareBuffering();
}


//-----------------------------------------------------------------------------------------------------------------------//
//STATUS MANAGEMENT
//-----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Refresh = function () {
   this.tex = null;
}

Tile.prototype.IsUpToDate = function () {
    var textureReady            = this.textureReady(),
        allLayerPartsAreReady   = true;
    
    for(var i = 0; i< this.layerParts.length; i++){
        if (! this.layerParts[i].IsUpToDate ()){
            allLayerPartsAreReady = false;
            break;
        }
    }
    
   return textureReady && allLayerPartsAreReady;
}

//-----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.textureReady = function ( ) {
   return this.tex != null || this.layerParts.length == 0;
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Release = function() {

   sourceManager.release(this.x, this.y, this.z, this.mapView.id);

   for(var i = 0; i < this.config.layers.length; i++){
      try{
         this.layerParts[i].Release();
      }
      catch(e){
         console.log("------------> tile.Release")
         console.log(e, this.layerParts[i])
      } 
   }

   var gl = this.gl;
   for ( var i = 0 ; i < 2 ; i = i + 1 ) {
      gl.deleteFramebuffer ( this.frameBufferL[i] );
      gl.deleteTexture     ( this.texL[i] );
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.ReleaseLayer = function (id) {

   if(this.layerParts[id]){
      this.layerParts[id].Release();
      this.layerParts[id].Reset();
   }

   this.Refresh();
}

Tile.prototype.ResetLayer = function (id) {

   if(this.layerParts[id])
      this.layerParts[id].Reset();

   this.Refresh();
}

Tile.prototype.Reset = function (onlyFuse) {

   onlyFuse = (typeof(onlyFuse)==='undefined')?false:onlyFuse;

   if (!onlyFuse) {
      for (var i = 0; i < this.layerParts.length; i++) {      
         this.layerParts[i].Reset();
      }
   }

   this.Refresh();
}


//-----------------------------------------------------------------------------------------------------------------------//
//LAYER PARTS MANAGEMENT
//-----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.buildLayerParts = function () {
   for(var i = 0; i< this.mapView.layers.length; i++){
      this.createLayerPart(this.mapView.layers[i], i)
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.createLayerPart = function (layer, index) {

   switch(layer.type){

      case Layer.Images:
         this.layerParts.splice(index, 0, new ImageLayerPart     ( layer, this, this.mapView.context.assets.ctx , this.z));
         break;
         
      case Layer.Dynamical:
      case Layer.Heat:
         this.layerParts.splice(index, 0, new DynamicalLayerPart  ( layer, this ));
         break;
      
      case Layer.Vector:
         this.layerParts.splice(index, 0, new VectorialLayerPart ( layer, this.mapView , this.z));
         break;

      case Layer.Raster:
         this.layerParts.splice(index, 0, new RasterLayer8    ( layer, this.mapView , this.z));
         break;

      case Layer.SRTM:
         this.layerParts.splice(index, 0, new RasterLayer16    ( layer, this.mapView , this.z));
         break;

      case Layer.Shade:
         this.layerParts.splice(index, 0, new ShadeLayerPart    ( layer, this.mapView , this.z));
         break;
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.addLayer = function (layerConfig) {
   this.createLayerFromConfig(layerConfig, this.config.layers.length - 1)
   sourceManager.loadSources(this.x, this.y, this.z, this.mapView.id)
   this.Refresh()
}

Tile.prototype.changeLayer = function (layerConfig, index) {
   this.removeLayer(index)
   this.createLayerFromConfig(layerConfig, index)
   sourceManager.loadSources(this.x, this.y, this.z, this.mapView.id)
   this.Refresh()
}

Tile.prototype.removeLayer = function (position) {
   if(this.layerParts.length > 0){
      this.layerParts[position].Release()
      this.layerParts.splice(position, 1)
      this.Refresh()
   }
   //  else : all layers are released because no layer remains
}

/**
 * Exactly the same as Layer.exchangeLayers
 * exchangedIds contains a mapping between old layerIndexes and the new one, after a layer reposition
 * example, with 3 layers, after moving layer0 (ui bottom) to the top (becomes layer 2) : 
 * exchangedIds = {
   {0: 1},
   {1: 2},
   {2: 0}
 } 
 */
Tile.prototype.exchangeLayers = function(exchangedIds) {

   var newLayers = [];
   for(id in exchangedIds){
      newLayers.push(this.layerParts[exchangedIds[id]]);
   }

   this.layerParts = newLayers;
   this.Refresh();
}

//----------------------------------------------------------------------------------------------------------------------//

//TODO v2 : A mettre dans chaque layerpart.prepare (layerParts[i].Init -> layerParts[i].prepare)

//Tile.prototype.sourceReady = function ( source, data , li) { /* li is for customRenderer => HEAT/Vector can use the same source (same source gid)!!!*/

//if(!data){
//console.log("-------> tile.sourceReady : DATA NULL !")
//this.Release();
//this.Reset();
//return
//}
//if  ( (typeof(li) ==='undefined') || li < 0 || li >= this.config.layers.length) {
//for(var i = 0; i< this.config.layers.length; i++){

//if(this.config.layers[i].source.id != source.id )
//continue;

//try{
//this.layerParts[i].Init( data )
//}
//catch(e){
//console.log("-------> ERROR")
//}
//}   
//}
//else {
//if ( this.config.layers[li].source.id == source.id )
//this.layerParts[li].Init( data )
//}
//}

//----------------------------------------------------------------------------------------------------------------------//

//v2 @deprecated ? 
Tile.prototype.RenderVectorialLayers = function ( context, wx, wy ) {
   for (var i = 0; i < this.layerParts.length; i++) {
      if (this.layerParts[i].GetType() == Layer.Vector && this.layerParts[i].IsUpToDate() && this.layerParts[i].cnv) {
         context.drawImage(this.layerParts[i].cnv, wx, wy);
      }
   }
}

//-----------------------------------------------------------------------------------------------------------------------//
//RENDERING
//-----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.prepareBuffering = function () {
   var gltools = new GLTools ()
   for ( var i = 0 ; i < 2 ; i = i + 1 ) {
      var fbtx = gltools.CreateFrameBufferTex(this.gl, Maperial.tileSize, Maperial.tileSize);
      this.frameBufferL.push        ( fbtx[0] );
      this.texL.push                ( fbtx[1] );
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Update = function ( maxTime ) {

   //--------------------------------------//

   var date                 = (new Date)
   var startT               = date.getTime()
   var diffT                = 0
   var noLayerPartUpdate    = true;

   //--------------------------------------//
   // layerParts update

   for(var i = 0; i< this.layerParts.length; i++){
      if (! this.layerParts[i].IsUpToDate() ){
         if(this.layerParts[i].DataReady() ) {
            this.layerParts[i].Update( this.layerParts[i].params, i );
            noLayerPartUpdate = false

            diffT   = date.getTime() - startT;
            if ( maxTime - diffT <= 0 )
               break;
         }
      }
   }

   //--------------------------------------//
   // tile.tex update

   if (noLayerPartUpdate && this.textureReady()){
      return maxTime - 1 ;
   }
   else{
      if ( !noLayerPartUpdate && (maxTime - diffT > 0) ) {
         console.log("tile refresh + compose");
         this.Refresh();
         this.Compose();
         diffT   = date.getTime() - startT;
      }

      return maxTime - diffT; 
   }

}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Compose = function () {
   
   //-------------------------//
   
   var layerPartsToCompose = []
   for(var i = 0; i < this.layerParts.length; i++){
      if(this.layerParts[i].IsUpToDate())
         layerPartsToCompose.push(this.layerParts[i]);
   }

   //-------------------------//

   var backTex = layerPartsToCompose[0].tex
   var destFb  = this.frameBufferL[ 0 ]
   var tmpI    = 0;

   if ( layerPartsToCompose.length > 1 ) {

      for( var i = 1 ; i < layerPartsToCompose.length ; i++ ) {
         var frontTex   = layerPartsToCompose[i].tex;
         if (frontTex) {
            var composition = layerPartsToCompose[i].layer.composition,
                prog        = this.assets.prog[ composition.shader ],
                params      = composition.params;

            this.Fuse      ( backTex,frontTex,destFb, prog , params);
         }
         else {
            this.Copy (backTex, destFb);
         }
         backTex        = this.texL[tmpI];
         this.tex       = backTex;

         tmpI           = ( tmpI + 1 ) % 2;
         destFb         = this.frameBufferL[ tmpI ];
      }
   }
   else {
      this.Copy (backTex, destFb);
      this.tex = this.texL[0];
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Copy = function ( backTex , destFB ) {

   var gl                           = this.gl;

   gl.bindFramebuffer               ( gl.FRAMEBUFFER, destFB );

   this.gl.clearColor               ( 1.0, 1.0, 1.0, 1.0  );
   this.gl.disable                  ( this.gl.DEPTH_TEST  );
   gl.viewport                      ( 0, 0, destFB.width, destFB.height);
   gl.clear                         ( gl.COLOR_BUFFER_BIT );

   var mvMatrix                     = mat4.create();
   var pMatrix                      = mat4.create();
   mat4.identity                    ( pMatrix );
   mat4.identity                    ( mvMatrix );
   mat4.ortho                       ( 0, destFB.width , 0, destFB.height, 0, 1, pMatrix ); // Y swap !

   var prog = this.assets.prog["Tex"];

   this.gl.useProgram               (prog);
   this.gl.uniformMatrix4fv         (prog.params.pMatrixUniform.name, false, pMatrix);
   this.gl.uniformMatrix4fv         (prog.params.mvMatrixUniform.name, false, mvMatrix);
   this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
   this.gl.enableVertexAttribArray  (prog.attr.vertexPositionAttribute);
   this.gl.vertexAttribPointer      (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

   this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
   this.gl.enableVertexAttribArray  (prog.attr.textureCoordAttribute);
   this.gl.vertexAttribPointer      (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

   this.gl.activeTexture            (this.gl.TEXTURE0);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, backTex );
   this.gl.uniform1i                (prog.params.uSamplerTex1.name, 0);
   this.gl.drawArrays               (this.gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

   gl.bindFramebuffer               ( gl.FRAMEBUFFER, null );
   this.gl.activeTexture            (this.gl.TEXTURE0);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, null );
}
//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Fuse = function ( backTex,frontTex,destFB, prog, params ) {

   var gl                           = this.gl;
   gl.bindFramebuffer               ( gl.FRAMEBUFFER, destFB );

   this.gl.clearColor               ( 1.0, 1.0, 1.0, 1.0  );
   this.gl.disable                  ( this.gl.DEPTH_TEST  );
   gl.viewport                      ( 0, 0, destFB.width, destFB.height);
   gl.clear                         ( gl.COLOR_BUFFER_BIT );

   var mvMatrix                     = mat4.create();
   var pMatrix                      = mat4.create();
   mat4.identity                    ( pMatrix );
   mat4.identity                    ( mvMatrix );
   mat4.ortho                       ( 0, destFB.width , 0, destFB.height, 0, 1, pMatrix ); // Y swap !


   this.gl.useProgram               (prog);
   this.gl.uniformMatrix4fv         (prog.params.pMatrixUniform.name , false, pMatrix);
   this.gl.uniformMatrix4fv         (prog.params.mvMatrixUniform.name, false, mvMatrix);
   this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
   this.gl.enableVertexAttribArray  (prog.attr.vertexPositionAttribute);
   this.gl.vertexAttribPointer      (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

   this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
   this.gl.enableVertexAttribArray  (prog.attr.textureCoordAttribute);
   this.gl.vertexAttribPointer      (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);


   this.gl.activeTexture            (this.gl.TEXTURE0);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, backTex );
   this.gl.uniform1i                (prog.params.uSamplerTex1.name, 0);

   this.gl.activeTexture            (this.gl.TEXTURE1);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, frontTex );
   this.gl.uniform1i                (prog.params.uSamplerTex2.name, 1);

   for (var p in params) {
      // WRONG !!!!! always  uniform3fv ???
      //this.gl.uniform3fv             (prog.params[p] , params[p] ); 
      this.gl[prog.params[p].fct] (prog.params[p].name, params[p] ); 
   }

   this.gl.drawArrays               (this.gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

   this.gl.bindFramebuffer          (this.gl.FRAMEBUFFER, null );
   this.gl.activeTexture            (this.gl.TEXTURE0);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, null );
   this.gl.activeTexture            (this.gl.TEXTURE1);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, null );
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Render = function (pMatrix, mvMatrix) {
   
   if ( this.textureReady() ) {
      var prog                         = this.assets.prog["Tex"];
      this.gl.useProgram               (prog);
      this.gl.uniformMatrix4fv         (prog.params.pMatrixUniform.name, false, pMatrix);
      this.gl.uniformMatrix4fv         (prog.params.mvMatrixUniform.name, false, mvMatrix);
      this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
      this.gl.enableVertexAttribArray  (prog.attr.vertexPositionAttribute);
      this.gl.vertexAttribPointer      (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
      this.gl.enableVertexAttribArray  (prog.attr.textureCoordAttribute);
      this.gl.vertexAttribPointer      (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.activeTexture            (this.gl.TEXTURE0);
      this.gl.bindTexture              (this.gl.TEXTURE_2D, this.tex );

      var err = this.gl.getError();
      if ( err != 0 )
         console.log ( err );

      this.gl.uniform1i                (prog.params.uSamplerTex1.name, 0);
      this.gl.drawArrays               (this.gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

      this.gl.activeTexture            (this.gl.TEXTURE0);
      this.gl.bindTexture              (this.gl.TEXTURE_2D, null );

      var err = this.gl.getError();
      if ( err != 0 )
         console.log ( err );
   }
}

//------------------------------------------------------------------//

module.exports = Tile;


},{"../models/layer.js":12,"./layerparts/dynamical-layer-part.js":23,"./layerparts/image-layer-part.js":24,"./layerparts/raster-layer-part.js":25,"./layerparts/shade-layer-part.js":26,"./layerparts/vectorial-layer-part.js":27,"./tools/gl-tools.js":32}],32:[function(_dereq_,module,exports){

function GLTools () {}

GLTools.prototype.RenderLayer = function  ( ctx ,  layer ) {
    id = layer["i"]
    cl = layer["c"]
    ll = layer["g"]
    if (ll == null) return 
    for ( l = 0 ; l < ll.length ; ++l ) {
        lines = ll[l]
        for ( li = 0 ; li < lines.length ; ++li ) {
            line = lines[li]
            ctx.beginPath();
            ctx.moveTo(line[0],line[1]);
            for (p = 2 ; p < line.length - 1 ; p = p + 2) {
                ctx.lineTo(line[p],line[p+1]);      
            }
            if ( line[line.length-1] == "c")
                ctx.closePath()
                this[cl](ctx); 
        }
    }
}

GLTools.prototype.LoadCanvasAsTexture = function  ( gl , inUrl , inCallback ) {
    var tex     = gl.createTexture();
    tex.isLoad  = false; 
    tex.error   = false;
    tex.req     = $.ajax({
        type     : "GET",
        url      : inUrl,
        dataType : "json",  
        success  : function(data, textStatus, jqXHR) {
            tex.svgRenderer = document.createElement("canvas");
            tex.svgRenderer.height = 256;
            tex.svgRenderer.width  = 256;

            for ( i = 0 ; i < data["l"].length ; ++i ) {
                RenderLayer  (  tex.svgRenderer.getContext("2d") , data["l"][i] )
            }

            //canvg(tex.svgRenderer, data);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.svgRenderer);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
            tex.isLoad    = true;
            tex.Error     = false;
            inCallback() ;
        },
        error : function(jqXHR, textStatus, errorThrown) {
            tex.isLoad = true;
            tex.error  = true;
            console.log ( inUrl + " : loading failed : " + textStatus );
            inCallback ({},{});
        }
    });    
    return tex
}

GLTools.prototype.LoadSvgAsTexture = function  ( gl , inUrl , inCallback ) {
    /*var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.error   = false;
      tex.req     = $.ajax({
         type     : "GET",
         url      : inUrl,
         dataType : "text",  
         success  : function(data, textStatus, jqXHR) {
            tex.svgRenderer = document.createElement("canvas");
            canvg(tex.svgRenderer, data
               //,{
               //   ignoreMouse       : true,
               //   ignoreAnimation   : true,
               //   ignoreDimensions  : true,
               //   renderCallback    : function() {
               //      gl.bindTexture(gl.TEXTURE_2D, tex);
               //      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
               //      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.svgRenderer);
               //      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
               //      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
               //      gl.bindTexture(gl.TEXTURE_2D, null);
               //      tex.isLoad    = true;
               //      tex.Error     = false;
               //      inCallback() ;
               //   }
               ///
            );
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.svgRenderer);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
            tex.isLoad    = true;
            tex.Error     = false;
            inCallback() ;
         },
         error : function(jqXHR, textStatus, errorThrown) {
            shader.isLoad = true;
            shader.error  = true;
            console.log ( inUrl + " : loading failed : " + textStatus );
            inCallback ({},{});
         }
      });    */
    var tex     = gl.createTexture();
    tex.isLoad  = false; 
    tex.error   = false;
    var img     = new Image;
    tex.req     = $.ajax({
        type     : "GET",
        url      : inUrl,
        dataType : "text",  
        success  : function(data, textStatus, jqXHR) {
            img.onload = function(){
                tex.svgRenderer = document.createElement("canvas");
                var ctx = tex.svgRenderer.getContext('2d');
                ctx.drawImage(img,0,0);

                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.svgRenderer);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.bindTexture(gl.TEXTURE_2D, null);
                tex.isLoad    = true;
                tex.Error     = false;
                inCallback() ;  
            };
            img.src    = "data:image/svg+xml;base64,"+btoa(data);
        },
        error : function(jqXHR, textStatus, errorThrown) {
            shader.isLoad = true;
            shader.error  = true;
            console.log ( inUrl + " : loading failed : " + textStatus );
            inCallback ({},{});
        }
    });
    return tex
}

GLTools.prototype.CreateFrameBufferTex = function  ( gl , sizeX, sizeY , linear /*, useFloat*/) {
    linear = typeof linear !== 'undefined' ? linear : false;
    //useFloat = typeof useFloat !== 'undefined' ? useFloat : false;

    var fb                        = gl.createFramebuffer();
    var tex                       = gl.createTexture(); 

    gl.bindFramebuffer            ( gl.FRAMEBUFFER, fb);
    fb.width                      = sizeX;
    fb.height                     = sizeY;

    gl.bindTexture                ( gl.TEXTURE_2D, tex );
    if (linear) {
        gl.texParameteri              ( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
        gl.texParameteri              ( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
    }else {
        gl.texParameteri              ( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
        gl.texParameteri              ( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    }
    //if (! useFloat ) {
    gl.texImage2D                 ( gl.TEXTURE_2D, 0, gl.RGBA, fb.width, fb.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
    /*}
      else {
         gl.texImage2D                 ( gl.TEXTURE_2D, 0, gl.RGBA, fb.width, fb.height, 0, gl.RGBA, gl.FLOAT, null );
      }*/
    gl.framebufferTexture2D       ( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0 );
    gl.bindTexture                ( gl.TEXTURE_2D, null );
    gl.bindFramebuffer            ( gl.FRAMEBUFFER, null );

    return [fb,tex];
}

GLTools.prototype.BuildShader = function  ( gl , inShader ) {
    var shader        = new Object ( );
    shader.error      = false;
    shader.obj        = null;
    shader.attributes = inShader.attributes;
    shader.parameters = inShader.parameters;

    if (inShader.type == "x-shader/x-fragment") {
        shader.obj = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (inShader.type == "x-shader/x-vertex") {
        shader.obj = gl.createShader(gl.VERTEX_SHADER);
    } else {
        shader.error  = true;
        return;
    }

    gl.shaderSource   ( shader.obj, inShader.code );
    gl.compileShader  ( shader.obj );
    if (!gl.getShaderParameter(shader.obj, gl.COMPILE_STATUS)) {
        shader.error  = true;
        console.log ( "Build " + inShader.name + " : Failed ! " );
        console.log (gl.getShaderInfoLog(shader.obj));            
    }
    return shader;
}

GLTools.prototype.MakeProgram = function ( inVertexName , inFragmentName , inAssets ) {
    if (! inAssets.shaderData ) {
        console.log ( "invalid shader data" );
        return null;
    }
    if ( ! ( inVertexName in inAssets.shaderData ) ) {
        console.log ( inVertexName + " not in shader data" );
        return null;
    }
    if ( ! ( inFragmentName in inAssets.shaderData ) ) {
        console.log ( inFragmentName + " not in shader data" );
        return null;
    }
    var vert             = inAssets.shaderData[inVertexName];
    vert.name            = inVertexName
    var frag             = inAssets.shaderData[inFragmentName];
    frag.name            = inFragmentName

    var gl               = inAssets.ctx;
    var vertObj          = this.BuildShader(gl,vert);
    var fragObj          = this.BuildShader(gl,frag);

    if ( vertObj.error || fragObj.error ) {
        return null;
    }
    var shaderProgram    = gl.createProgram();
    shaderProgram.error  = false;
    shaderProgram.attr   = {};
    shaderProgram.params = {};
    var attributes       = {};
    var parameters       = {};

    jQuery.extend( attributes, vertObj.attributes );
    jQuery.extend( parameters, vertObj.parameters );
    jQuery.extend( attributes, fragObj.attributes );
    jQuery.extend( parameters, fragObj.parameters );

    gl.attachShader( shaderProgram , vertObj.obj );
    gl.attachShader( shaderProgram , fragObj.obj);
    gl.linkProgram ( shaderProgram );
    if (! gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log ( "Could not link programm with " +inVertexName + " and " + inFragmentName);
        shaderProgram.error  = true;
        return ;
    }
    gl.useProgram(shaderProgram);
    for (var key in attributes) {
        shaderProgram.attr[key]    = gl.getAttribLocation( shaderProgram, attributes[key] ); 
    }
    for (var key in parameters) {
        shaderProgram.params[key] = {}
        shaderProgram.params[key]["name"] = gl.getUniformLocation(shaderProgram, parameters[key][0]);
        shaderProgram.params[key]["fct"]  = parameters[key][1];
    }
    return shaderProgram;
}

GLTools.prototype.LoadTexture = function  (gl , url , callback) {
    /*
      var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.image   = new Image();
      tex.image.onload = function () {
         gl.bindTexture(gl.TEXTURE_2D, tex);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.bindTexture(gl.TEXTURE_2D, null);
         tex.isLoad = true;
         delete tex.image;
         callback() ; 
      }

      tex.image.src = url;
      return tex;
     */
    var tex     = gl.createTexture();
    tex.isLoad  = false; 
    tex.error   = false;
    var   img   = new Image();
    img.onload  = function () {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        tex.isLoad = true;
        delete img;
        callback() ; 
    };
    img.onerror =  function () {
        tex.isLoad = true;
        tex.error  = true;
        delete img;
    };
    img.onabort = function () {
        tex.isLoad = true;
        tex.error  = true;
        delete img;
    };

    img.src = url;
    return tex;
}


GLTools.prototype.LoadCsvTexture = function (gl , url , callback) {
    /*
      var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.image   = new Image();
      tex.image.onload = function () {
         gl.bindTexture(gl.TEXTURE_2D, tex);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.bindTexture(gl.TEXTURE_2D, null);
         tex.isLoad = true;
         delete tex.image;
         callback() ; 
      }

      tex.image.src = url;
      return tex;
     */

    var svgRenderer = document.createElement("canvas");
    canvg(this.svgRenderer, 'test/auv.svg');
    var tex     = gl.createTexture();
    tex.isLoad  = false; 
    tex.error   = false;
    var   img   = new Image();
    img.onload  = function () {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        tex.isLoad = true;
        delete img;
        callback() ; 
    };
    img.onerror =  function () {
        tex.isLoad = true;
        tex.error  = true;
        delete img;
    };
    img.onabort = function () {
        tex.isLoad = true;
        tex.error  = true;
        delete img;
    };

    img.src = url;
    return tex;
}


GLTools.prototype.LoadData = function (gl, inUrl ) {
    var tex     = gl.createTexture();
    tex.isLoad  = false;
    tex.error   = false;

    tex.req = $.ajax({
        type     : "GET",
        url      : inUrl,
        dataType : "json",  
        success  : function(data, textStatus, jqXHR) {
            tex.isLoad = true;
            tex.error  = false;

            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl[data.input_type], data.width , data.height, 0, gl[data.output_type], gl.UNSIGNED_BYTE, new Uint8Array(data.data));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        },
        error : function(jqXHR, textStatus, errorThrown) {
            tex.isLoad = true;
            tex.error  = true;
            console.log ( inUrl + " : loading failed : " + textStatus );
        }
    });

    tex.src = inUrl;
    return tex;   
}


//------------------------------------------------------------------//

module.exports = GLTools;

},{}],33:[function(_dereq_,module,exports){

var FontFamily = function () {
   var styles = {}, mapping = {
      oblique: 'italic',
      italic: 'oblique'
   };
   this.add = function(font) {
      (styles[font.style] || (styles[font.style] = {}))[font.weight] = font;
   };
   this.get = function(style, weight) {
      if(typeof(style)==='undefined')  style  = 'normal';
      if(typeof(weight)==='undefined') weight = 'normal';
      var weights = styles[style] || styles[mapping[style]]
         || styles.normal || styles.italic || styles.oblique;
      if (!weights) return null;
      // we don't have to worry about "bolder" and "lighter"
      // because IE's currentStyle returns a numeric value for it,
      // and other browsers use the computed value anyway
      weight = {
         normal: 400,
         bold: 700
      }[weight] || parseInt(weight, 10);
      if (weights[weight]) return weights[weight];
      // http://www.w3.org/TR/CSS21/fonts.html#propdef-font-weight
      // Gecko uses x99/x01 for lighter/bolder
      var up = {
         1: 1,
         99: 0
      }[weight % 100], alts = [], min, max;
      if (up === undefined) up = weight > 400;
      if (weight == 500) weight = 400;
      for (var alt in weights) {
         if (!hasOwnProperty(weights, alt)) continue;
         alt = parseInt(alt, 10);
         if (!min || alt < min) min = alt;
         if (!max || alt > max) max = alt;
         alts.push(alt);
      }
      if (weight < min) weight = min;
      if (weight > max) weight = max;
      alts.sort(function(a, b) {
         return (up
            ? (a >= weight && b >= weight) ? a < b : a > b
            : (a <= weight && b <= weight) ? a > b : a < b) ? -1 : 1;
      });
      return weights[alts[0]];
   };
}

var globalFonts = function () {
   var __gf = {};
   __gf.d   = {};
   __gf.Add = function ( data ) {
      if (!data) return api;
		var font = new Font(data)
      var family = font.family;
		if (!__gf.d[family]) __gf.d[family] = new FontFamily();
		__gf.d[family].add(font);
		return __gf;
   }
   
   __gf.Get = function ( name, style, weight ) {
      if ( ! __gf.d[name] ) 
         return null
      return __gf.d[name].get ( style, weight)
   }
   
   return __gf;
}();

function FromPoint ( p ) {
   if (p.length != 2) {
      console.log ("Invalid Point");
      return;
   }
   this.p     = p;
   this.acc   = 0;
}

FromPoint.prototype.Reset = function (  ) {
   this.acc   = 0;
}

FromPoint.prototype.IsValid = function (  ) {
   return ! (this.p === undefined);
}

FromPoint.prototype.Advance = function ( cs ) {
   var oacc = this.acc
   this.acc = this.acc + cs;        // next
   return [ this.p[0] + oacc , this.p[1] , 0.0]
}

function FollowLine (l) {
   if (l.length < 4) {
      console.log ("Invalid line");
      return;
   }
   this.l     = l;
   this.acc   = 0;
   this.pi    = 0;
}

FollowLine.prototype.Reset = function (  ) {
   this.acc   = 0;
   this.pi    = 0;
}

FollowLine.prototype.IsValid = function (  ) {
   return ! (this.l === undefined);
}

FollowLine.prototype.Advance = function ( cs ) {
   if ( this.pi + 3 >= this.l.length )
      return null;
         
   var p       = [ this.l[this.pi]     , this.l[this.pi + 1] ];
   var pnext   = [ this.l[this.pi + 2] , this.l[this.pi + 3] ];
   var v       = [ pnext[0] - p[0]     , pnext[1] - p[1] ]
   var n       = Math.sqrt ( v[0] * v[0] + v[1] * v[1] ) 
   var vn      = [ v[0] / n , v[1] / n ]
   var Von     = [ vn[1]    , -vn[0]   ]
   var nacc    = this.acc + cs;        // next
   var macc    = this.acc + cs / 2.0 ; // middle
   var p0      = [ p[0] + vn[0] * this.acc , p[1] + vn[1] * this.acc]
   var pm      = [ p[0] + vn[0] * macc     , p[1] + vn[1] * macc]
   var shift   = [0,0]
   
   intPoints   = []
   if ( nacc > n ) {
      while (nacc > n) {
         this.pi  = this.pi + 2
         if ( this.pi + 3 < this.l.length ) {
            nacc        = nacc - n;
            p           = [ this.l[this.pi]     , this.l[this.pi + 1] ];
            pnext       = [ this.l[this.pi + 2] , this.l[this.pi + 3] ];
            v           = [ pnext[0] - p[0]     , pnext[1] - p[1] ]
            n           = Math.sqrt ( v[0] * v[0] + v[1] * v[1] ) 
            intPoints.push ( p[0] )
            intPoints.push ( p[1] )
         }
         else return null;
      }
      vn          = [ v[0] / n , v[1] / n ]
      var p1      = [ p[0] + vn[0] * nacc  , p[1] + vn[1] * nacc]
      var vtmp    = [ p1[0] - p0[0] , p1[1] - p0[1] ]
      var ntmp    = Math.sqrt ( vtmp[0] * vtmp[0] + vtmp[1] * vtmp[1] )
      var vntmp   = [ vtmp[0] / ntmp , vtmp[1] / ntmp ]
      Von         = [ vntmp[1]    , -vntmp[0] ]
      /* Test shift with distance between Real middle point (pm2) , and base middle point (pm)
      var pm2        = [ p0[0] + vtmp[0]/2.0 , p0[1] + vtmp[1]/2.0 ]
      var vtmp2      = [ pm[0] - pm2[0] , pm[1] - pm2[1] ]
      var ntmp2      = Math.sqrt ( vtmp2[0] * vtmp2[0] + vtmp2[1] * vtmp2[1] )
      var vntmp2     = [ vtmp2[0] / ntmp2 , vtmp2[1] / ntmp2 ]
      var stmp       = ( vntmp2[0] * Von[0] + vntmp2[1] * Von[1] ) * ntmp2;
      shift          = [ Von[0] * stmp , Von[1] * stmp ];
      */
      var pm2        = [ p0[0] + vtmp[0]/2.0 , p0[1] + vtmp[1]/2.0 ]
      var sacc       = 0
      for ( var j = 0 ; j < intPoints.length ; j+=2) {
         var vtmp2      = [ intPoints[j] - pm2[0] , intPoints[j+1] - pm2[1] ]
         var ntmp2      = Math.sqrt ( vtmp2[0] * vtmp2[0] + vtmp2[1] * vtmp2[1] )
         var vntmp2     = [ vtmp2[0] / ntmp2 , vtmp2[1] / ntmp2 ]
         sacc           += ( vntmp2[0] * Von[0] + vntmp2[1] * Von[1] ) * ntmp2;
      }
      sacc              /= (intPoints.length / 2.0) + 2.0;
      shift             = [ Von[0] * sacc , Von[1] * sacc ];
   }
   
   this.acc = nacc
   var a    = Math.acos(-Von[1]);
   if ( Von[0] < 0 ) a = -a 
   //if ( Von[1] > 0 ) { a = a + Math.PI }
   
   return [p0[0]+shift[0],p0[1]+shift[1],a]
}

function TextOnLine ( ctx, l, txt , fill) {
   var fl = new FollowLine (l)
   if ( ! fl.IsValid())
      return
      
   ctx.beginPath();
   
   for (i in txt) {
      var c  = txt[i];
      var cs = ctx.measureText(c).width
      var tr = fl.Advance ( cs )
      if (!tr) return
      ctx.save( )
      ctx.translate ( tr[0] , tr[1] );
      ctx.rotate(tr[2]);
      if (fill)
         ctx.fillText(c,0,0);
      else
         ctx.strokeText(c,0,0);
      ctx.restore()
   }
}

function hasOwnProperty(obj, property) {
   return obj.hasOwnProperty(property);
}

var FontSize = function(value, base) {
   this.value = parseFloat(value);
   this.unit = String(value).match(/[a-z%]*$/)[0] || 'px';

   this.convert = function(value) {
      return value / base * this.value;
   };

   this.convertFrom = function(value) {
      return value / this.value * base;
   };

   this.toString = function() {
      return this.value + this.unit;
   };
}

var Font = function (data) {
   var face = this.face = data.face, ligatureCache = [], wordSeparators = {
      '\u0020': 1,
      '\u00a0': 1,
      '\u3000': 1
   };
   this.glyphs = (function(glyphs) {
      var key, fallbacks = {
         '\u2011': '\u002d',
         '\u00ad': '\u2011'
      };
      for (key in fallbacks) {
         if (!hasOwnProperty(fallbacks, key)) continue;
         if (!glyphs[key]) glyphs[key] = glyphs[fallbacks[key]];
      }
      return glyphs;
   })(data.glyphs);

   this.w = data.w;
   this.baseSize = parseInt(face['units-per-em'], 10);

   this.family = face['font-family'].toLowerCase();
   this.weight = face['font-weight'];
   this.style = face['font-style'] || 'normal';

   this.viewBox = (function () {
      var parts = face.bbox.split(/\s+/);
      var box = {
         minX: parseInt(parts[0], 10),
         minY: parseInt(parts[1], 10),
         maxX: parseInt(parts[2], 10),
         maxY: parseInt(parts[3], 10)
      };
      box.width = box.maxX - box.minX;
      box.height = box.maxY - box.minY;
      box.toString = function() {
         return [ this.minX, this.minY, this.width, this.height ].join(' ');
      };
      return box;
   })();

   this.ascent = -parseInt(face.ascent, 10);
   this.descent = -parseInt(face.descent, 10);

   this.height = -this.ascent + this.descent;

   this.spacing = function(chars, letterSpacing, wordSpacing) {
      var glyphs = this.glyphs, glyph,
         kerning, k,
         jumps = [],
         width = 0, w,
         i = -1, j = -1, chr;
      while (chr = chars[++i]) {
         glyph = glyphs[chr] || this.missingGlyph;
         if (!glyph) continue;
         if (kerning) {
            width -= k = kerning[chr] || 0;
            jumps[j] -= k;
         }
         w = glyph.w;
         if (isNaN(w)) w = +this.w; // may have been a String in old fonts
         if (w > 0) {
            w += letterSpacing;
            if (wordSeparators[chr]) w += wordSpacing;
         }
         width += jumps[++j] = ~~w; // get rid of decimals
         kerning = glyph.k;
      }
      jumps.total = width;
      return jumps;
   };

   this.applyLigatures = function(text, ligatures) {
      // find cached ligature configuration for this font
      for (var i=0, ligatureConfig; i<ligatureCache.length && !ligatureConfig; i++)
         if (ligatureCache[i].ligatures === ligatures)
            ligatureConfig = ligatureCache[i];

      // if there is none, it needs to be created and cached
      if (!ligatureConfig) {
         // identify letter groups to prepare regular expression that matches these
         var letterGroups = [];
         for (var letterGroup in ligatures) {
            if (this.glyphs[ligatures[letterGroup]]) {
               letterGroups.push(letterGroup);
            }
         }

         // sort by longer groups first, then alphabetically (to aid caching by this key)
         var regexpText = letterGroups.sort(function(a, b) {
            return b.length - a.length || a > b;
         }).join('|');

         ligatureCache.push(ligatureConfig = {
            ligatures: ligatures,
            // create regular expression for matching desired ligatures that are present in the font
            regexp: regexpText.length > 0 
               ? regexpCache[regexpText] || (regexpCache[regexpText] = new RegExp(regexpText, 'g'))
               : null
         });
      }

      // return applied ligatures or original text if none exist for given configuration
      return ligatureConfig.regexp
         ? text.replace(ligatureConfig.regexp, function(match) {
            return ligatures[match] || match;
         })
         : text;
   };
}
/*
function RenderTextCufon (text,font, size, ctx ,l ,fill) {
	function generateFromVML(path, context) {
		var atX = 0, atY = 0;
		var code = [], re = /([mrvxe])([^a-z]*)/g, match;
		generate: for (var i = 0; match = re.exec(path); ++i) {
			var c = match[2].split(',');
			switch (match[1]) {
				case 'v':
					code[i] = { m: 'bezierCurveTo', a: [ atX + ~~c[0], atY + ~~c[1], atX + ~~c[2], atY + ~~c[3], atX += ~~c[4], atY += ~~c[5] ] };
					break;
				case 'r':
					code[i] = { m: 'lineTo', a: [ atX += ~~c[0], atY += ~~c[1] ] };
					break;
				case 'm':
					code[i] = { m: 'moveTo', a: [ atX = ~~c[0], atY = ~~c[1] ] };
					break;
				case 'x':
					code[i] = { m: 'closePath' };
					break;
				case 'e':
					break generate;
			}
			context[code[i].m].apply(context, code[i].a);
		}
		return code;
	}

	function interpret(code, context) {
		for (var i = 0, l = code.length; i < l; ++i) {
			var line = code[i];
			context[line.m].apply(context, line.a);
		}
	}
   
   if ( l.length == 2 ) { var fl = new FromPoint (l) }
   else {var fl = new FollowLine (l)}
   
   if ( ! fl.IsValid())
      return
      
   // Shift ==> Render at middle line and not at baseline !
   var shift      = parseInt(font.face["x-height"]) /100 * size.value 
   var viewBox    = font.viewBox;
   var expandTop  = 0, expandRight = 0, expandBottom = 0, expandLeft = 0;

   //var chars = Cufon.CSS.textTransform(options.ligatures ? font.applyLigatures(text, options.ligatures) : text, style).split(''); // ligature ?? UpperCase ?? lowerCase ?? Capitalize ?? Interesting !      
   var chars = text.split('')
   var jumps = font.spacing(chars,
      ~~size.convertFrom(0), // letter spacing
      ~~size.convertFrom(0)  // word spacing
   );
   
   if (!jumps.length) return null; // there's nothing to render

   var width    = jumps.total;
   expandRight += viewBox.width - jumps[jumps.length - 1];
   expandLeft  += viewBox.minX;

   var height = size.convert(viewBox.height);
   var roundedHeight = Math.ceil(height);
   var roundingFactor = roundedHeight / height;
   var stretchedWidth = width * roundingFactor;

   // minY has no part in canvas.height
   expandTop += viewBox.minY;

   var g = ctx
   var scale = height / viewBox.height;
   // var pixelRatio = window.devicePixelRatio || 1;
   // if (pixelRatio != 1) {
      // canvas.width = canvasWidth * pixelRatio;
      // canvas.height = canvasHeight * pixelRatio;
      // g.scale(pixelRatio, pixelRatio);
   // }

   
   // proper horizontal scaling is performed later
   //g.translate ( 0,shift);
   //g.scale(scale, scale * roundingFactor);
   //g.scale(scale, scale );
   //g.translate(-expandLeft, -expandTop);
   //g.save();

   //function renderText() {
      //var glyphs = font.glyphs, glyph, i = -1, j = -1, chr;
      ////g.scale(roundingFactor, 1);
      //while (chr = chars[++i]) {
         //g.save()                                  // new
         //var tr = fl.Advance ( jumps[(j+1)] * scale )                // new
         ////g.translate ( tr[0] /scale, tr[1] /scale);            // new
         ////g.rotate(tr[2]);                          // new
      
         //var glyph = glyphs[chars[i]] || font.missingGlyph;
         //if (!glyph) {continue;g.resore();}
         //if (glyph.d) {
            //g.beginPath();
            //// the following moveTo is for Opera 9.2. if we don't
            //// do this, it won't forget the previous path which
            //// results in garbled text.
            //g.moveTo(0, 0);
            //if (glyph.code) interpret(glyph.code, g);
            //else glyph.code = generateFromVML('m' + glyph.d, g);
            //g.fill();
         //}
         //g.restore(); // new
         //g.translate(jumps[++j], 0);
      //}
   //}
   //g.fillStyle="rgba(0,0,0,1.0)";
   //renderText();
   //g.restore();

   // proper horizontal scaling is performed later
   
   //g.scale(scale, scale * roundingFactor);
   
   //g.translate(-expandLeft, -expandTop);
   g.save();
   if (!fill) {
      ctx.lineWidth    = ctx.lineWidth / scale;
   }
   function renderText() {
      var glyphs = font.glyphs, glyph, i = -1, j = -1, chr;
      //g.scale(roundingFactor, 1);
      var accJ = 0;
      while (chr = chars[++i]) {
         var tr = fl.Advance ( jumps[(j+1)] * scale )                // new
         if ( !tr) return;
         g.save()                                  // new
         g.translate ( tr[0] , tr[1] );            // new
         g.rotate(tr[2]);                          // new
         g.translate ( 0,shift);
         g.scale(scale, scale );
         //g.translate(accJ, 0);
         var glyph = glyphs[chars[i]] || font.missingGlyph;
         if (!glyph) {g.restore();continue;}
         if (glyph.d) {
            g.beginPath();
            // the following moveTo is for Opera 9.2. if we don't
            // do this, it won't forget the previous path which
            // results in garbled text.
            g.moveTo(0, 0);
            if (glyph.code) interpret(glyph.code, g);
            else glyph.code = generateFromVML('m' + glyph.d, g);
            if ( fill ) {
               g.fill();
            }
            else { 
               g.stroke();
            }
         }
         accJ += jumps[++j];
         g.restore(); // new
      }
   }
   renderText();
   g.restore();
};*/

/*
function InitRenderTextPoint(text , font, size, l)  {
   var shift      = parseInt(font.face["x-height"]) /100 * size.value 
   var viewBox    = font.viewBox;

   var chars = text.split('')
   var jumps = font.spacing(chars, ~~size.convertFrom(0), ~~size.convertFrom(0) );
   
   if (!jumps.length) return null; // there's nothing to render
   
   var width          = jumps.total;
   var height         = size.convert(viewBox.height);
   var roundedHeight  = Math.ceil(height);
   var roundingFactor = roundedHeight / height;
   var stretchedWidth = width * roundingFactor;
   var scale          = height / viewBox.height;

   var txtCtx   = new Object  () ;
   txtCtx.scale = scale;
   txtCtx.chars = chars;
   txtCtx.shift = shift;
   txtCtx.jumps = jumps;
   txtCtx.h     = height;
   txtCtx.w     = size.convert(stretchedWidth);
   
   txtCtx.bbox   = new Object()
   txtCtx.bbox.x = l[0] - 8
   txtCtx.bbox.y = l[1] - txtCtx.h - 8
   txtCtx.bbox.w = txtCtx.w + 16
   txtCtx.bbox.h = txtCtx.h + 16
   txtCtx.bbox.t = text
   
   txtCtx.fl = new FromPoint (l) 
   
   if ( ! txtCtx.fl.IsValid())
      return null;
      
   return txtCtx
}
*/

function InitRenderText2( text , font, size, l , cutSize, center , translate , scale__) {

   var shift      = parseInt(font.face["x-height"]) /100 * size.value 
   var viewBox    = font.viewBox;

   var height         = size.convert(viewBox.height);
   var roundedHeight  = Math.ceil(height);
   var roundingFactor = roundedHeight / height;
   var scale = height / viewBox.height;

   var descent       = size.convert(font.descent);
   var ascent        = size.convert(font.ascent);
   var realH         = descent - ascent; // == size ....
   
   var px = 0
   var py = 0
   if (l.length > 2) {

      var minx = l[0]
      var maxx = l[0]
      var miny = l[1]
      var maxy = l[1]
      for ( var i = 2 ; i < l.length-1 ; i = i + 2 ) {
         minx = (l[i] < minx)? l[i] : minx;
         maxx = (l[i] > maxx)? l[i] : maxx;
         miny = (l[i+1] < miny)? l[i+1] : miny;
         maxy = (l[i+1] > maxy)? l[i+1] : maxy;
      }
      var boxw = maxx-minx;
      var boxh = maxy-miny;
      px   = minx + boxw/2.0
      py   = miny + boxh/2.0
   }
   else {
      px   = l[0]
      py   = l[1]
   }
   px   = px * scale__[0] + translate[0]
   py   = py * scale__[1] + translate[1]
      
   var maxW       = cutSize; // px
   var maxChar    = Math.floor ( (maxW / size.value) * 6 );   
   var textArray  = []
   var charsArray = []
   var jumpsArray = []
   var txtTmp     = text;
   if ( maxW > 0 ) {
      while ( txtTmp.length > maxChar ) {
         var spIdx = txtTmp.indexOf (' ',maxChar)
         if (spIdx < 0)
            break;
         var str = txtTmp.substring( 0 , spIdx);
         txtTmp  = txtTmp.substring( spIdx + 1 )
         var chars = str.split('')
         var jumps = font.spacing(chars,
            ~~size.convertFrom(0), // letter spacing
            ~~size.convertFrom(0)  // word spacing
         )
         if (!jumps.length) continue; 
         
         charsArray.push ( chars )
         jumpsArray.push ( jumps )
         textArray.push  ( str )
      }
   }
   if ( txtTmp.length > 0 ) {
      var chars = txtTmp.split('')
      var jumps = font.spacing(chars,
         ~~size.convertFrom(0), // letter spacing
         ~~size.convertFrom(0)  // word spacing
      )
      if ( jumps.length > 0) {
         charsArray.push ( chars )
         jumpsArray.push ( jumps )
         textArray.push(txtTmp) 
      }
   }      
   
   var txtCtx     = new Object  () ;
   txtCtx.scale   = scale;
   txtCtx.chars   = charsArray;
   txtCtx.shift   = shift;
   txtCtx.jumps   = jumpsArray;
   txtCtx.fl      = []
   var bbox       = new Object()
   bbox.x         = 1000000000
   bbox.y         = 1000000000
   bbox.x2        = -1000000000
   bbox.y2        = -1000000000
   
   for ( var i = 0 ; i < jumpsArray.length ; i=i+1 ) {
      var stretchedWidth = jumpsArray[i].total * roundingFactor;
      var w              = size.convert(stretchedWidth);
      var y              = py -  ( jumpsArray.length - 1 - i ) * ( height )
      var x              = px
      if (center) {
         x = x - w / 2.0;
      }
      txtCtx.fl.push ( new FromPoint ([x,y]) );
      
      var bbx  = x - 3
      var bby  = y + ascent - 3
      var bbx2 = bbx + w + 6
      var bby2 = bby + realH + 6
      
      bbox.x  = bbx < bbox.x ? bbx : bbox.x;
      bbox.y  = bby < bbox.y ? bby : bbox.y;
      bbox.x2 = bbx2 > bbox.x2 ? bbx2 : bbox.x2;
      bbox.y2  = bby2 > bbox.y2 ? bby2 : bbox.y2;
   }

   if (!jumpsArray.length) return null;

   txtCtx.bbox = new Object() 
   txtCtx.bbox.x = bbox.x
   txtCtx.bbox.y = bbox.y
   txtCtx.bbox.w = bbox.x2 - bbox.x
   txtCtx.bbox.h = bbox.y2 - bbox.y
   txtCtx.bbox.t = text
   
   return txtCtx;
}
/*
function InitRenderText( text , font, size, l ) {


   var shift      = parseInt(font.face["x-height"]) /100 * size.value 
   var viewBox    = font.viewBox;

   var chars = text.split('')
   var jumps = font.spacing(chars,
      ~~size.convertFrom(0), // letter spacing
      ~~size.convertFrom(0)  // word spacing
   );
   
   if (!jumps.length) return null; // there's nothing to render

   var width    = jumps.total;

   var height = size.convert(viewBox.height);
   var roundedHeight = Math.ceil(height);
   var roundingFactor = roundedHeight / height;
   var stretchedWidth = width * roundingFactor;

   var scale = height / viewBox.height;

   var txtCtx = new Object  () ;
   txtCtx.scale = scale;
   txtCtx.chars = chars;
   txtCtx.shift = shift;
   txtCtx.jumps = jumps;
   
   txtCtx.h     = height;
   txtCtx.w     = size.convert(stretchedWidth);
   
   txtCtx.bbox = new Object()
   if ( l.length == 2 ) {
      txtCtx.bbox.x = l[0] - 8
      txtCtx.bbox.y = l[1] - txtCtx.h - 8
      txtCtx.bbox.w = txtCtx.w + 16
      txtCtx.bbox.h = txtCtx.h + 16
      txtCtx.bbox.t = text
   }
   else {
      // todo
   }

   
   if ( l.length == 2 )           { txtCtx.fl = new FromPoint (l)  }
   else if (l[l.length-1] == "c") { 
   
      var minx = 99999
      var maxx = -99999
      var miny = 99999
      var maxy = -99999
      for ( var i = 0 ; i < l.length-1 ; i = i + 2 ) {
         minx = (l[i] < minx)? l[i] : minx;
         maxx = (l[i] > maxx)? l[i] : maxx;
         miny = (l[i+1] < miny)? l[i+1] : miny;
         maxy = (l[i+1] > maxy)? l[i+1] : maxy;
      }
      var boxw = maxx-minx;
      var boxh = maxy-miny;
      var cx = minx + boxw/2.0 - txtCtx.w / 2.0
      var cy = miny + boxh/2.0
      
      txtCtx.fl = new FromPoint ([cx,cy])
   }
   else                           { txtCtx.fl = new FollowLine (l) }
   
   if ( ! txtCtx.fl.IsValid())
      return null;
      
   return txtCtx
}
*/
//function RenderTextCufon (text,font, size, ctx ,l ,fill) {
function RenderTextCufon (txtCtx, font, ctx ,fill) {
	function generateFromVML(path, context) {
		var atX = 0, atY = 0;
		var code = [], re = /([mrvxe])([^a-z]*)/g, match;
		generate: for (var i = 0; match = re.exec(path); ++i) {
			var c = match[2].split(',');
			switch (match[1]) {
				case 'v':
					code[i] = { m: 'bezierCurveTo', a: [ atX + ~~c[0], atY + ~~c[1], atX + ~~c[2], atY + ~~c[3], atX += ~~c[4], atY += ~~c[5] ] };
					break;
				case 'r':
					code[i] = { m: 'lineTo', a: [ atX += ~~c[0], atY += ~~c[1] ] };
					break;
				case 'm':
					code[i] = { m: 'moveTo', a: [ atX = ~~c[0], atY = ~~c[1] ] };
					break;
				case 'x':
					code[i] = { m: 'closePath' };
					break;
				case 'e':
					break generate;
			}
			context[code[i].m].apply(context, code[i].a);
		}
		return code;
	}

	function interpret(code, context) {
		for (var i = 0, l = code.length; i < l; ++i) {
			var line = code[i];
			context[line.m].apply(context, line.a);
		}
	}

   
   ctx.save();
   if (!fill) {
      ctx.lineWidth    = ctx.lineWidth / txtCtx.scale;
   }
   for ( var idx = 0 ; idx < txtCtx.jumps.length  ; ++idx) { 
      var glyphs = font.glyphs, glyph, i = -1, j = -1, chr;
      var accJ = 0;
      while (chr = txtCtx.chars[idx][++i]) {
         var tr = txtCtx.fl[idx].Advance ( txtCtx.jumps[idx][(j+1)] * txtCtx.scale )                // new
         if ( !tr) return;
         ctx.save()                                  // new
         ctx.translate ( tr[0] , tr[1] );            // new
         ctx.rotate(tr[2]);                          // new
         ctx.translate ( 0,txtCtx.shift);
         ctx.scale(txtCtx.scale, txtCtx.scale );
         var glyph = glyphs[txtCtx.chars[idx][i]] || font.missingGlyph;
         if (!glyph) {ctx.restore();continue;}
         if (glyph.d) {
            ctx.beginPath();
            // the following moveTo is for Opera 9.2. if we don't
            // do this, it won't forget the previous path which
            // results in garbled text.
            ctx.moveTo(0, 0);
            if (glyph.code) interpret(glyph.code, ctx);
            else glyph.code = generateFromVML('m' + glyph.d, ctx);
            if ( fill ) {
               ctx.fill();
            }
            else { 
               ctx.stroke();
            }
         }
         accJ += txtCtx.jumps[idx][++j];
         ctx.restore(); // new
      }
   }
   ctx.restore();
};

function BoxesIntersect(a, b) {

   return ! ((b.x >= a.x + a.w)   // trop à droite
            || (b.x + b.w <= a.x) // trop à gauche
            || (b.y >= a.y + a.h) // trop en bas
            || (b.y + b.h <= a.y))// trop en haut
    
   /*
   return (Math.abs((a.x + a.w/2.0) - (b.x + b.w/2.0)) * 2 <= (a.w + b.w)) &&
         (Math.abs((a.y + a.h/2.0) - (b.y + b.h/2.0)) * 2 <= (a.h + b.h));
   */
}

function ExtendCanvasContext ( ctx ) {
   ctx.viewBBox = new Object ();
   ctx.viewBBox.x = -1;
   ctx.viewBBox.y = -1;
   ctx.viewBBox.w = 258;
   ctx.viewBBox.h = 258;

   ctx._textBBox  = [ ] ;
   
   Object.getPrototypeOf(ctx).setTexViewBox = function ( x,y,w,h) {
      this.viewBBox.x = x;
      this.viewBBox.y = y;
      this.viewBBox.w = w;
      this.viewBBox.h = h;
   }
   /*
   Object.getPrototypeOf(ctx).fillTextOnLine = function ( txt , l ) {
      ctx.save()
      ctx.textBaseline="middle";
      TextOnLine ( this, l, txt, true );
      ctx.restore()
   }
   Object.getPrototypeOf(ctx).strokeTextOnLine = function ( txt , l ) {
      ctx.save()
      ctx.textBaseline="middle";
      TextOnLine ( this, l, txt, false );
      ctx.restore()
   }
   */
   Object.getPrototypeOf(ctx).fillText = function ( txt , l , cutSize, center, translate,collisionDetection) {
      var fname = this.fontParams["family"].replace ( /(^["' \t])|(["' \t]$)/g, "" ).toLowerCase();
      var _font = globalFonts.Get(fname,this.fontParams["style"],this.fontParams["weight"]);
      if (!_font) {
         console.error ("fillTextOnLine2 : font error 2");
         return false;
      }
      var scale = [1.0,1.0];
      if ('_sx' in ctx ) {
         scale[0] = ctx._sx;
         scale[1] = ctx._sy;
      }
      var _size = new FontSize ( this.fontParams["size"] , _font.baseSize );
      var txtCtx = InitRenderText2 (txt , _font, _size,  l , cutSize, center, translate,scale);
      if (!txtCtx)
         return false;
      skipIt = false
      if (collisionDetection[0]) {
         for ( b in this._textBBox ) {
            if ( BoxesIntersect ( this._textBBox[b] , txtCtx.bbox ) ) {
               skipIt = true
               break
            }
         }
      }
      if (!skipIt) {
         if (collisionDetection[1])
            this._textBBox.push(txtCtx.bbox)
         if (  BoxesIntersect ( this.viewBBox , txtCtx.bbox ) ) {
            this.save()
            RenderTextCufon ( txtCtx , _font ,this , true);
            this.restore()
         }
      }
      return !skipIt;
   }
   Object.getPrototypeOf(ctx).strokeText = function ( txt , l , cutSize, center, translate,collisionDetection) {
      
      var fname = this.fontParams["family"].replace ( /(^["' \t])|(["' \t]$)/g, "" ).toLowerCase();
      var _font = globalFonts.Get(fname,this.fontParams["style"],this.fontParams["weight"]);
      if (!_font) {
         console.error ("fillTextOnLine2 : font error 2");
         return false;
      }
      var scale = [1.0,1.0];
      if ('_sx' in ctx ) {
         scale[0] = ctx._sx;
         scale[1] = ctx._sy;
      }
      var _size = new FontSize ( this.fontParams["size"] , _font.baseSize );
      var txtCtx = InitRenderText2 (txt , _font, _size, l , cutSize, center, translate,scale);
      if (!txtCtx)
         return false;
      skipIt = false
      if (collisionDetection[0]) {
         for ( b in this._textBBox ) {
            if ( BoxesIntersect ( this._textBBox[b] , txtCtx.bbox ) ) {
               skipIt = true
               break
            }
         }
      }
      if (!skipIt) {
         if (collisionDetection[1]) 
            this._textBBox.push(txtCtx.bbox)
         if (  BoxesIntersect ( this.viewBBox , txtCtx.bbox ) ) {
            this.save()
            RenderTextCufon ( txtCtx , _font , this  , false);
            this.restore()
         }
      }
      return !skipIt;
   }
   
   Object.getPrototypeOf(ctx).strokeAndFillText = function ( txt , l , cutSize, center, translate , collisionDetection) {
      var fname = this.fontParams["family"].replace ( /(^["' \t])|(["' \t]$)/g, "" ).toLowerCase();
      var _font = globalFonts.Get(fname,this.fontParams["style"],this.fontParams["weight"]);
      if (!_font) {
         console.error ("fillTextOnLine2 : font error 2");
         return false;
      }
      var scale = [1.0,1.0];
      if ('_sx' in this ) {
         scale[0] = this._sx;
         scale[1] = this._sy;
      }
      var _size = new FontSize ( this.fontParams["size"] , _font.baseSize );
      var txtCtx = InitRenderText2 (txt , _font, _size, l , cutSize, center, translate,scale);
      if (!txtCtx)
         return false;
      var skipIt = false
      if (collisionDetection[0]) {
         for ( var b = 0; b < this._textBBox.length; b++ ) {
            if ( BoxesIntersect ( this._textBBox[b] , txtCtx.bbox ) ) {
               skipIt = true
               break
            }
         }
      }
      if (!skipIt) {
         if (collisionDetection[1])
            this._textBBox.push(txtCtx.bbox)
         
         if (  BoxesIntersect ( this.viewBBox , txtCtx.bbox ) ) {
            this.save()
            /*this.fillStyle="rgba(255,0,0,1)";
            this.rect(txtCtx.bbox.x,txtCtx.bbox.y,txtCtx.bbox.w,txtCtx.bbox.h);
            this.fill ()*/
            RenderTextCufon ( txtCtx , _font , this  , false);
            this.restore()
            for ( var i = 0 ; i < txtCtx.fl.length ; i=i+1 )
               txtCtx.fl[i].Reset()
            this.save()
            RenderTextCufon ( txtCtx , _font , this  , true);
            
            this.restore()
         }
      }
      return !skipIt;
      /*else {
         this.save()
         this.fillStyle="rgba(0,255,0,1)";
         this.fillRect(txtCtx.bbox.x,txtCtx.bbox.y,txtCtx.bbox.w,txtCtx.bbox.h);
         this.restore()
      }*/
   }
   
   
   Object.getPrototypeOf(ctx).SetFont = function ( cssfont ) {
      this.font   = cssfont;
      var $test   = $('<span />').appendTo('body');
      $test.css('font', cssfont);
      //console.log($test.css('fontWeight'));console.log($test.css('fontStyle'));console.log($test.css('fontVariant'));console.log($test.css('fontSize'));console.log($test.css('lineHeight'));console.log($test.css('fontFamily'));
      var family = $test.css('fontFamily');
      var size   = parseInt ( $test.css('fontSize') );
      var weight = $test.css('fontWeight');
      var style  = $test.css('fontStyle');      
      this.fontParams = { "family":family, "size":size, "weight":weight, "style":style };
      $test.remove();
   }
   
}


//------------------------------------------------------------------//

module.exports = ExtendCanvasContext;

},{}],34:[function(_dereq_,module,exports){

var Point = _dereq_('./point.js');

//------------------------------------------------------------------//

function CoordinateSystem ( inTileSize ) {
    this.tileSize           = inTileSize;
    this.initialResolution  = 2 * Math.PI * 6378137 / inTileSize;   //# 156543.03392804062 for tileSize 256 pixels
    this.originShift        = 2 * Math.PI* 6378137 / 2.0 ;
}

//------------------------------------------------------------------//

//"Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913"
CoordinateSystem.prototype.LatLonToMeters = function ( lat, lon ) {
    mx = lon * this.originShift / 180.0 ;
    my = Math.log( Math.tan((90 + lat) * Math.PI / 360.0 )) / (Math.PI / 180.0) ;
    my = my * this.originShift / 180.0 ;
    return new Point(mx,my);
}

//"Converts XY point from Spherical Mercator EPSG:900913 to lat/lon in WGS84 Datum"
CoordinateSystem.prototype.MetersToLatLon = function ( mx, my ) {
    lon = (mx / this.originShift) * 180.0 ;
    lat = (my / this.originShift) * 180.0 ;
    lat = 180 / Math.PI * (2 * Math.atan( Math.exp( lat * Math.PI / 180.0)) - Math.PI / 2.0) ;
    return new Point (lon, lat) ;
}

//"Converts pixel coordinates in given zoom level of pyramid to EPSG:900913"
CoordinateSystem.prototype.PixelsToMeters = function ( px, py, zoom) {
    res = this.Resolution( zoom );
    mx  = px * res - this.originShift;
    my  = py * res - this.originShift;
    return new Point ( mx, my );
}

//"Converts EPSG:900913 to pyramid pixel coordinates in given zoom level"  
CoordinateSystem.prototype.MetersToPixels = function ( mx, my, zoom) {
    res = this.Resolution( zoom );
    px = (mx + this.originShift) / res;
    py = (my + this.originShift) / res;
    return new Point ( px, py );
}

CoordinateSystem.prototype.MetersToPixelsAccurate = function ( mx, my, zoom ) {

    var lat = this.MetersToLatLon(mx, my).y;
    res = this.ResolutionByLat( zoom, lat );

    px = (mx + this.originShift) / res;
    py = (my + this.originShift) / res;
    return new Point ( px, py );
}

//"Returns a tile covering region in given pixel coordinates"
CoordinateSystem.prototype.PixelsToTile = function ( px, py) {
    tx = Math.floor( Math.ceil( px / this.tileSize ) - 1 );
    ty = Math.floor( Math.ceil( py / this.tileSize ) - 1 );
    return new Point ( tx, ty );
}

//"Move the origin of pixel coordinates to top-left corner"
CoordinateSystem.prototype.PixelsToRaster = function ( px, py, zoom) {
    mapSize = this.tileSize * Math.pow ( 2 , zoom );
    return new Point ( px, mapSize - py );
}

//"Returns tile for given mercator coordinates"
CoordinateSystem.prototype.MetersToTile = function ( mx, my, zoom) {
    p = this.MetersToPixels( mx, my, zoom);
    return this.PixelsToTile( p.x, p.y ) ;
}
/*
//"Returns bounds of the given tile in EPSG:900913 coordinates"
CoordinateSystem.prototype.TileBounds = function ( tx, ty, zoom) {
  min = this.PixelsToMeters( tx*this.tileSize, ty*this.tileSize, zoom )
  max = this.PixelsToMeters( (tx+1)*this.tileSize, (ty+1)*this.tileSize, zoom )
  return ( minx, miny, maxx, maxy )
}

CoordinateSystem.prototype.TileLatLonBounds = function ( tx, ty, zoom ):
  "Returns bounds of the given tile in latutude/longitude using WGS84 datum"

  bounds = this.TileBounds( tx, ty, zoom)
  minLat, minLon = this.MetersToLatLon(bounds[0], bounds[1])
  maxLat, maxLon = this.MetersToLatLon(bounds[2], bounds[3])

  return ( minLat, minLon, maxLat, maxLon )
 */
//"Resolution (meters/pixel) for given zoom level (measured at Equator)"  

CoordinateSystem.prototype.Resolution = function ( zoom ) {
    return this.initialResolution / Math.pow ( 2 , zoom);
}

CoordinateSystem.prototype.ResolutionByLat = function ( zoom, lat ) {
    var R = 6378 * Math.cos((lat/180)*Math.PI);
    return (2 * Math.PI * R*1000 / this.tileSize) / Math.pow ( 2 , zoom);
}

/*  
CoordinateSystem.prototype.ZoomForPixelSize = function ( pixelSize ):
  "Maximal scaledown zoom of the pyramid closest to the pixelSize."

  for i in range(30):
      if pixelSize > this.Resolution(i):
          return i-1 if i!=0 else 0 # We don't want to scale up
 */

//"Converts TMS tile coordinates to Google Tile coordinates"
CoordinateSystem.prototype.GoogleTile = function ( tx, ty, zoom) {
    //coordinate origin is moved from bottom-left to top-left corner of the extent
    return new Point ( tx, (Math.pow ( 2,zoom ) - 1) - ty );

}


//------------------------------------------------------------------//

module.exports = CoordinateSystem;

/*
CoordinateSystem.prototype.QuadTree = function ( tx, ty, zoom ):
  "Converts TMS tile coordinates to Microsoft QuadTree"

  quadKey = ""
  ty = (2**zoom - 1) - ty
  for i in range(zoom, 0, -1):
      digit = 0
      mask = 1 << (i-1)
      if (tx & mask) != 0:
          digit += 1
      if (ty & mask) != 0:
          digit += 2
      quadKey += str(digit)

  return quadKey
 */
},{"./point.js":38}],35:[function(_dereq_,module,exports){
(function (global){
// gl-matrix 1.3.7 - https://github.com/toji/gl-matrix/blob/master/LICENSE.md
(function(w,D){"object"===typeof exports?module.exports=D(global):"function"===typeof define&&define.amd?define([],function(){return D(w)}):D(w)})(this,function(w){function D(a){return o=a}function G(){return o="undefined"!==typeof Float32Array?Float32Array:Array}var E={};(function(){if("undefined"!=typeof Float32Array){var a=new Float32Array(1),b=new Int32Array(a.buffer);E.invsqrt=function(c){a[0]=c;b[0]=1597463007-(b[0]>>1);var d=a[0];return d*(1.5-0.5*c*d*d)}}else E.invsqrt=function(a){return 1/
Math.sqrt(a)}})();var o=null;G();var r={create:function(a){var b=new o(3);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2]):b[0]=b[1]=b[2]=0;return b},createFrom:function(a,b,c){var d=new o(3);d[0]=a;d[1]=b;d[2]=c;return d},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])},add:function(a,b,c){if(!c||a===c)return a[0]+=b[0],a[1]+=b[1],a[2]+=b[2],a;c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];
return c},subtract:function(a,b,c){if(!c||a===c)return a[0]-=b[0],a[1]-=b[1],a[2]-=b[2],a;c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];return c},multiply:function(a,b,c){if(!c||a===c)return a[0]*=b[0],a[1]*=b[1],a[2]*=b[2],a;c[0]=a[0]*b[0];c[1]=a[1]*b[1];c[2]=a[2]*b[2];return c},negate:function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];return b},scale:function(a,b,c){if(!c||a===c)return a[0]*=b,a[1]*=b,a[2]*=b,a;c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;return c},normalize:function(a,b){b||(b=a);var c=
a[0],d=a[1],e=a[2],g=Math.sqrt(c*c+d*d+e*e);if(!g)return b[0]=0,b[1]=0,b[2]=0,b;if(1===g)return b[0]=c,b[1]=d,b[2]=e,b;g=1/g;b[0]=c*g;b[1]=d*g;b[2]=e*g;return b},cross:function(a,b,c){c||(c=a);var d=a[0],e=a[1],a=a[2],g=b[0],f=b[1],b=b[2];c[0]=e*b-a*f;c[1]=a*g-d*b;c[2]=d*f-e*g;return c},length:function(a){var b=a[0],c=a[1],a=a[2];return Math.sqrt(b*b+c*c+a*a)},squaredLength:function(a){var b=a[0],c=a[1],a=a[2];return b*b+c*c+a*a},dot:function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]},direction:function(a,
b,c){c||(c=a);var d=a[0]-b[0],e=a[1]-b[1],a=a[2]-b[2],b=Math.sqrt(d*d+e*e+a*a);if(!b)return c[0]=0,c[1]=0,c[2]=0,c;b=1/b;c[0]=d*b;c[1]=e*b;c[2]=a*b;return c},lerp:function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);return d},dist:function(a,b){var c=b[0]-a[0],d=b[1]-a[1],e=b[2]-a[2];return Math.sqrt(c*c+d*d+e*e)}},H=null,y=new o(4);r.unproject=function(a,b,c,d,e){e||(e=a);H||(H=x.create());var g=H;y[0]=2*(a[0]-d[0])/d[2]-1;y[1]=2*(a[1]-d[1])/d[3]-1;y[2]=
2*a[2]-1;y[3]=1;x.multiply(c,b,g);if(!x.inverse(g))return null;x.multiplyVec4(g,y);if(0===y[3])return null;e[0]=y[0]/y[3];e[1]=y[1]/y[3];e[2]=y[2]/y[3];return e};var L=r.createFrom(1,0,0),M=r.createFrom(0,1,0),N=r.createFrom(0,0,1),z=r.create();r.rotationTo=function(a,b,c){c||(c=k.create());var d=r.dot(a,b);if(1<=d)k.set(O,c);else if(-0.999999>d)r.cross(L,a,z),1.0E-6>r.length(z)&&r.cross(M,a,z),1.0E-6>r.length(z)&&r.cross(N,a,z),r.normalize(z),k.fromAngleAxis(Math.PI,z,c);else{var d=Math.sqrt(2*(1+
d)),e=1/d;r.cross(a,b,z);c[0]=z[0]*e;c[1]=z[1]*e;c[2]=z[2]*e;c[3]=0.5*d;k.normalize(c)}1<c[3]?c[3]=1:-1>c[3]&&(c[3]=-1);return c};r.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+"]"};var A={create:function(a){var b=new o(9);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3],b[4]=a[4],b[5]=a[5],b[6]=a[6],b[7]=a[7],b[8]=a[8]):b[0]=b[1]=b[2]=b[3]=b[4]=b[5]=b[6]=b[7]=b[8]=0;return b},createFrom:function(a,b,c,d,e,g,f,h,j){var i=new o(9);i[0]=a;i[1]=b;i[2]=c;i[3]=d;i[4]=e;i[5]=g;i[6]=f;i[7]=h;i[8]=j;return i},
determinant:function(a){var b=a[3],c=a[4],d=a[5],e=a[6],g=a[7],f=a[8];return a[0]*(f*c-d*g)+a[1]*(-f*b+d*e)+a[2]*(g*b-c*e)},inverse:function(a,b){var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],j=a[6],i=a[7],m=a[8],l=m*f-h*i,C=-m*g+h*j,q=i*g-f*j,n=c*l+d*C+e*q;if(!n)return null;n=1/n;b||(b=A.create());b[0]=l*n;b[1]=(-m*d+e*i)*n;b[2]=(h*d-e*f)*n;b[3]=C*n;b[4]=(m*c-e*j)*n;b[5]=(-h*c+e*g)*n;b[6]=q*n;b[7]=(-i*c+d*j)*n;b[8]=(f*c-d*g)*n;return b},multiply:function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],
f=a[3],h=a[4],j=a[5],i=a[6],m=a[7],a=a[8],l=b[0],C=b[1],q=b[2],n=b[3],k=b[4],p=b[5],o=b[6],s=b[7],b=b[8];c[0]=l*d+C*f+q*i;c[1]=l*e+C*h+q*m;c[2]=l*g+C*j+q*a;c[3]=n*d+k*f+p*i;c[4]=n*e+k*h+p*m;c[5]=n*g+k*j+p*a;c[6]=o*d+s*f+b*i;c[7]=o*e+s*h+b*m;c[8]=o*g+s*j+b*a;return c},multiplyVec2:function(a,b,c){c||(c=b);var d=b[0],b=b[1];c[0]=d*a[0]+b*a[3]+a[6];c[1]=d*a[1]+b*a[4]+a[7];return c},multiplyVec3:function(a,b,c){c||(c=b);var d=b[0],e=b[1],b=b[2];c[0]=d*a[0]+e*a[3]+b*a[6];c[1]=d*a[1]+e*a[4]+b*a[7];c[2]=
d*a[2]+e*a[5]+b*a[8];return c},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>Math.abs(a[3]-b[3])&&1.0E-6>Math.abs(a[4]-b[4])&&1.0E-6>Math.abs(a[5]-b[5])&&1.0E-6>Math.abs(a[6]-b[6])&&1.0E-6>Math.abs(a[7]-b[7])&&1.0E-6>Math.abs(a[8]-b[8])},identity:function(a){a||(a=A.create());a[0]=1;a[1]=0;a[2]=0;a[3]=0;
a[4]=1;a[5]=0;a[6]=0;a[7]=0;a[8]=1;return a},transpose:function(a,b){if(!b||a===b){var c=a[1],d=a[2],e=a[5];a[1]=a[3];a[2]=a[6];a[3]=c;a[5]=a[7];a[6]=d;a[7]=e;return a}b[0]=a[0];b[1]=a[3];b[2]=a[6];b[3]=a[1];b[4]=a[4];b[5]=a[7];b[6]=a[2];b[7]=a[5];b[8]=a[8];return b},toMat4:function(a,b){b||(b=x.create());b[15]=1;b[14]=0;b[13]=0;b[12]=0;b[11]=0;b[10]=a[8];b[9]=a[7];b[8]=a[6];b[7]=0;b[6]=a[5];b[5]=a[4];b[4]=a[3];b[3]=0;b[2]=a[2];b[1]=a[1];b[0]=a[0];return b},str:function(a){return"["+a[0]+", "+a[1]+
", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+"]"}},x={create:function(a){var b=new o(16);a&&(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3],b[4]=a[4],b[5]=a[5],b[6]=a[6],b[7]=a[7],b[8]=a[8],b[9]=a[9],b[10]=a[10],b[11]=a[11],b[12]=a[12],b[13]=a[13],b[14]=a[14],b[15]=a[15]);return b},createFrom:function(a,b,c,d,e,g,f,h,j,i,m,l,C,q,n,k){var p=new o(16);p[0]=a;p[1]=b;p[2]=c;p[3]=d;p[4]=e;p[5]=g;p[6]=f;p[7]=h;p[8]=j;p[9]=i;p[10]=m;p[11]=l;p[12]=C;p[13]=q;p[14]=n;p[15]=k;return p},set:function(a,
b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>Math.abs(a[3]-b[3])&&1.0E-6>Math.abs(a[4]-b[4])&&1.0E-6>Math.abs(a[5]-b[5])&&1.0E-6>Math.abs(a[6]-b[6])&&1.0E-6>Math.abs(a[7]-b[7])&&1.0E-6>Math.abs(a[8]-b[8])&&1.0E-6>Math.abs(a[9]-b[9])&&1.0E-6>
Math.abs(a[10]-b[10])&&1.0E-6>Math.abs(a[11]-b[11])&&1.0E-6>Math.abs(a[12]-b[12])&&1.0E-6>Math.abs(a[13]-b[13])&&1.0E-6>Math.abs(a[14]-b[14])&&1.0E-6>Math.abs(a[15]-b[15])},identity:function(a){a||(a=x.create());a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;return a},transpose:function(a,b){if(!b||a===b){var c=a[1],d=a[2],e=a[3],g=a[6],f=a[7],h=a[11];a[1]=a[4];a[2]=a[8];a[3]=a[12];a[4]=c;a[6]=a[9];a[7]=a[13];a[8]=d;a[9]=g;a[11]=
a[14];a[12]=e;a[13]=f;a[14]=h;return a}b[0]=a[0];b[1]=a[4];b[2]=a[8];b[3]=a[12];b[4]=a[1];b[5]=a[5];b[6]=a[9];b[7]=a[13];b[8]=a[2];b[9]=a[6];b[10]=a[10];b[11]=a[14];b[12]=a[3];b[13]=a[7];b[14]=a[11];b[15]=a[15];return b},determinant:function(a){var b=a[0],c=a[1],d=a[2],e=a[3],g=a[4],f=a[5],h=a[6],j=a[7],i=a[8],m=a[9],l=a[10],C=a[11],q=a[12],n=a[13],k=a[14],a=a[15];return q*m*h*e-i*n*h*e-q*f*l*e+g*n*l*e+i*f*k*e-g*m*k*e-q*m*d*j+i*n*d*j+q*c*l*j-b*n*l*j-i*c*k*j+b*m*k*j+q*f*d*C-g*n*d*C-q*c*h*C+b*n*h*C+
g*c*k*C-b*f*k*C-i*f*d*a+g*m*d*a+i*c*h*a-b*m*h*a-g*c*l*a+b*f*l*a},inverse:function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],j=a[6],i=a[7],m=a[8],l=a[9],k=a[10],q=a[11],n=a[12],o=a[13],p=a[14],r=a[15],s=c*h-d*f,v=c*j-e*f,t=c*i-g*f,u=d*j-e*h,w=d*i-g*h,x=e*i-g*j,y=m*o-l*n,z=m*p-k*n,F=m*r-q*n,A=l*p-k*o,D=l*r-q*o,E=k*r-q*p,B=s*E-v*D+t*A+u*F-w*z+x*y;if(!B)return null;B=1/B;b[0]=(h*E-j*D+i*A)*B;b[1]=(-d*E+e*D-g*A)*B;b[2]=(o*x-p*w+r*u)*B;b[3]=(-l*x+k*w-q*u)*B;b[4]=(-f*E+j*F-i*z)*B;b[5]=
(c*E-e*F+g*z)*B;b[6]=(-n*x+p*t-r*v)*B;b[7]=(m*x-k*t+q*v)*B;b[8]=(f*D-h*F+i*y)*B;b[9]=(-c*D+d*F-g*y)*B;b[10]=(n*w-o*t+r*s)*B;b[11]=(-m*w+l*t-q*s)*B;b[12]=(-f*A+h*z-j*y)*B;b[13]=(c*A-d*z+e*y)*B;b[14]=(-n*u+o*v-p*s)*B;b[15]=(m*u-l*v+k*s)*B;return b},toRotationMat:function(a,b){b||(b=x.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b},toMat3:function(a,b){b||(b=A.create());b[0]=
a[0];b[1]=a[1];b[2]=a[2];b[3]=a[4];b[4]=a[5];b[5]=a[6];b[6]=a[8];b[7]=a[9];b[8]=a[10];return b},toInverseMat3:function(a,b){var c=a[0],d=a[1],e=a[2],g=a[4],f=a[5],h=a[6],j=a[8],i=a[9],m=a[10],l=m*f-h*i,k=-m*g+h*j,q=i*g-f*j,n=c*l+d*k+e*q;if(!n)return null;n=1/n;b||(b=A.create());b[0]=l*n;b[1]=(-m*d+e*i)*n;b[2]=(h*d-e*f)*n;b[3]=k*n;b[4]=(m*c-e*j)*n;b[5]=(-h*c+e*g)*n;b[6]=q*n;b[7]=(-i*c+d*j)*n;b[8]=(f*c-d*g)*n;return b},multiply:function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],f=a[3],h=a[4],j=a[5],
i=a[6],m=a[7],l=a[8],k=a[9],q=a[10],n=a[11],o=a[12],p=a[13],r=a[14],a=a[15],s=b[0],v=b[1],t=b[2],u=b[3];c[0]=s*d+v*h+t*l+u*o;c[1]=s*e+v*j+t*k+u*p;c[2]=s*g+v*i+t*q+u*r;c[3]=s*f+v*m+t*n+u*a;s=b[4];v=b[5];t=b[6];u=b[7];c[4]=s*d+v*h+t*l+u*o;c[5]=s*e+v*j+t*k+u*p;c[6]=s*g+v*i+t*q+u*r;c[7]=s*f+v*m+t*n+u*a;s=b[8];v=b[9];t=b[10];u=b[11];c[8]=s*d+v*h+t*l+u*o;c[9]=s*e+v*j+t*k+u*p;c[10]=s*g+v*i+t*q+u*r;c[11]=s*f+v*m+t*n+u*a;s=b[12];v=b[13];t=b[14];u=b[15];c[12]=s*d+v*h+t*l+u*o;c[13]=s*e+v*j+t*k+u*p;c[14]=s*g+
v*i+t*q+u*r;c[15]=s*f+v*m+t*n+u*a;return c},multiplyVec3:function(a,b,c){c||(c=b);var d=b[0],e=b[1],b=b[2];c[0]=a[0]*d+a[4]*e+a[8]*b+a[12];c[1]=a[1]*d+a[5]*e+a[9]*b+a[13];c[2]=a[2]*d+a[6]*e+a[10]*b+a[14];return c},multiplyVec4:function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2],b=b[3];c[0]=a[0]*d+a[4]*e+a[8]*g+a[12]*b;c[1]=a[1]*d+a[5]*e+a[9]*g+a[13]*b;c[2]=a[2]*d+a[6]*e+a[10]*g+a[14]*b;c[3]=a[3]*d+a[7]*e+a[11]*g+a[15]*b;return c},translate:function(a,b,c){var d=b[0],e=b[1],b=b[2],g,f,h,j,i,m,l,k,q,
n,o,p;if(!c||a===c)return a[12]=a[0]*d+a[4]*e+a[8]*b+a[12],a[13]=a[1]*d+a[5]*e+a[9]*b+a[13],a[14]=a[2]*d+a[6]*e+a[10]*b+a[14],a[15]=a[3]*d+a[7]*e+a[11]*b+a[15],a;g=a[0];f=a[1];h=a[2];j=a[3];i=a[4];m=a[5];l=a[6];k=a[7];q=a[8];n=a[9];o=a[10];p=a[11];c[0]=g;c[1]=f;c[2]=h;c[3]=j;c[4]=i;c[5]=m;c[6]=l;c[7]=k;c[8]=q;c[9]=n;c[10]=o;c[11]=p;c[12]=g*d+i*e+q*b+a[12];c[13]=f*d+m*e+n*b+a[13];c[14]=h*d+l*e+o*b+a[14];c[15]=j*d+k*e+p*b+a[15];return c},scale:function(a,b,c){var d=b[0],e=b[1],b=b[2];if(!c||a===c)return a[0]*=
d,a[1]*=d,a[2]*=d,a[3]*=d,a[4]*=e,a[5]*=e,a[6]*=e,a[7]*=e,a[8]*=b,a[9]*=b,a[10]*=b,a[11]*=b,a;c[0]=a[0]*d;c[1]=a[1]*d;c[2]=a[2]*d;c[3]=a[3]*d;c[4]=a[4]*e;c[5]=a[5]*e;c[6]=a[6]*e;c[7]=a[7]*e;c[8]=a[8]*b;c[9]=a[9]*b;c[10]=a[10]*b;c[11]=a[11]*b;c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15];return c},rotate:function(a,b,c,d){var e=c[0],g=c[1],c=c[2],f=Math.sqrt(e*e+g*g+c*c),h,j,i,m,l,k,q,n,o,p,r,s,v,t,u,w,x,y,z,A;if(!f)return null;1!==f&&(f=1/f,e*=f,g*=f,c*=f);h=Math.sin(b);j=Math.cos(b);i=1-j;b=a[0];
f=a[1];m=a[2];l=a[3];k=a[4];q=a[5];n=a[6];o=a[7];p=a[8];r=a[9];s=a[10];v=a[11];t=e*e*i+j;u=g*e*i+c*h;w=c*e*i-g*h;x=e*g*i-c*h;y=g*g*i+j;z=c*g*i+e*h;A=e*c*i+g*h;e=g*c*i-e*h;g=c*c*i+j;d?a!==d&&(d[12]=a[12],d[13]=a[13],d[14]=a[14],d[15]=a[15]):d=a;d[0]=b*t+k*u+p*w;d[1]=f*t+q*u+r*w;d[2]=m*t+n*u+s*w;d[3]=l*t+o*u+v*w;d[4]=b*x+k*y+p*z;d[5]=f*x+q*y+r*z;d[6]=m*x+n*y+s*z;d[7]=l*x+o*y+v*z;d[8]=b*A+k*e+p*g;d[9]=f*A+q*e+r*g;d[10]=m*A+n*e+s*g;d[11]=l*A+o*e+v*g;return d},rotateX:function(a,b,c){var d=Math.sin(b),
b=Math.cos(b),e=a[4],g=a[5],f=a[6],h=a[7],j=a[8],i=a[9],m=a[10],l=a[11];c?a!==c&&(c[0]=a[0],c[1]=a[1],c[2]=a[2],c[3]=a[3],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[4]=e*b+j*d;c[5]=g*b+i*d;c[6]=f*b+m*d;c[7]=h*b+l*d;c[8]=e*-d+j*b;c[9]=g*-d+i*b;c[10]=f*-d+m*b;c[11]=h*-d+l*b;return c},rotateY:function(a,b,c){var d=Math.sin(b),b=Math.cos(b),e=a[0],g=a[1],f=a[2],h=a[3],j=a[8],i=a[9],m=a[10],l=a[11];c?a!==c&&(c[4]=a[4],c[5]=a[5],c[6]=a[6],c[7]=a[7],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=
a[15]):c=a;c[0]=e*b+j*-d;c[1]=g*b+i*-d;c[2]=f*b+m*-d;c[3]=h*b+l*-d;c[8]=e*d+j*b;c[9]=g*d+i*b;c[10]=f*d+m*b;c[11]=h*d+l*b;return c},rotateZ:function(a,b,c){var d=Math.sin(b),b=Math.cos(b),e=a[0],g=a[1],f=a[2],h=a[3],j=a[4],i=a[5],m=a[6],l=a[7];c?a!==c&&(c[8]=a[8],c[9]=a[9],c[10]=a[10],c[11]=a[11],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[0]=e*b+j*d;c[1]=g*b+i*d;c[2]=f*b+m*d;c[3]=h*b+l*d;c[4]=e*-d+j*b;c[5]=g*-d+i*b;c[6]=f*-d+m*b;c[7]=h*-d+l*b;return c},frustum:function(a,b,c,d,e,g,f){f||
(f=x.create());var h=b-a,j=d-c,i=g-e;f[0]=2*e/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2*e/j;f[6]=0;f[7]=0;f[8]=(b+a)/h;f[9]=(d+c)/j;f[10]=-(g+e)/i;f[11]=-1;f[12]=0;f[13]=0;f[14]=-(2*g*e)/i;f[15]=0;return f},perspective:function(a,b,c,d,e){a=c*Math.tan(a*Math.PI/360);b*=a;return x.frustum(-b,b,-a,a,c,d,e)},ortho:function(a,b,c,d,e,g,f){f||(f=x.create());var h=b-a,j=d-c,i=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/j;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/i;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/j;f[14]=
-(g+e)/i;f[15]=1;return f},lookAt:function(a,b,c,d){d||(d=x.create());var e,g,f,h,j,i,m,l,k=a[0],o=a[1],a=a[2];f=c[0];h=c[1];g=c[2];m=b[0];c=b[1];e=b[2];if(k===m&&o===c&&a===e)return x.identity(d);b=k-m;c=o-c;m=a-e;l=1/Math.sqrt(b*b+c*c+m*m);b*=l;c*=l;m*=l;e=h*m-g*c;g=g*b-f*m;f=f*c-h*b;(l=Math.sqrt(e*e+g*g+f*f))?(l=1/l,e*=l,g*=l,f*=l):f=g=e=0;h=c*f-m*g;j=m*e-b*f;i=b*g-c*e;(l=Math.sqrt(h*h+j*j+i*i))?(l=1/l,h*=l,j*=l,i*=l):i=j=h=0;d[0]=e;d[1]=h;d[2]=b;d[3]=0;d[4]=g;d[5]=j;d[6]=c;d[7]=0;d[8]=f;d[9]=
i;d[10]=m;d[11]=0;d[12]=-(e*k+g*o+f*a);d[13]=-(h*k+j*o+i*a);d[14]=-(b*k+c*o+m*a);d[15]=1;return d},fromRotationTranslation:function(a,b,c){c||(c=x.create());var d=a[0],e=a[1],g=a[2],f=a[3],h=d+d,j=e+e,i=g+g,a=d*h,m=d*j,d=d*i,k=e*j,e=e*i,g=g*i,h=f*h,j=f*j,f=f*i;c[0]=1-(k+g);c[1]=m+f;c[2]=d-j;c[3]=0;c[4]=m-f;c[5]=1-(a+g);c[6]=e+h;c[7]=0;c[8]=d+j;c[9]=e-h;c[10]=1-(a+k);c[11]=0;c[12]=b[0];c[13]=b[1];c[14]=b[2];c[15]=1;return c},str:function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+
a[5]+", "+a[6]+", "+a[7]+", "+a[8]+", "+a[9]+", "+a[10]+", "+a[11]+", "+a[12]+", "+a[13]+", "+a[14]+", "+a[15]+"]"}},k={create:function(a){var b=new o(4);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3]):b[0]=b[1]=b[2]=b[3]=0;return b},createFrom:function(a,b,c,d){var e=new o(4);e[0]=a;e[1]=b;e[2]=c;e[3]=d;return e},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>
Math.abs(a[3]-b[3])},identity:function(a){a||(a=k.create());a[0]=0;a[1]=0;a[2]=0;a[3]=1;return a}},O=k.identity();k.calculateW=function(a,b){var c=a[0],d=a[1],e=a[2];if(!b||a===b)return a[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e)),a;b[0]=c;b[1]=d;b[2]=e;b[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return b};k.dot=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]};k.inverse=function(a,b){var c=a[0],d=a[1],e=a[2],g=a[3],c=(c=c*c+d*d+e*e+g*g)?1/c:0;if(!b||a===b)return a[0]*=-c,a[1]*=-c,a[2]*=-c,a[3]*=
c,a;b[0]=-a[0]*c;b[1]=-a[1]*c;b[2]=-a[2]*c;b[3]=a[3]*c;return b};k.conjugate=function(a,b){if(!b||a===b)return a[0]*=-1,a[1]*=-1,a[2]*=-1,a;b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=a[3];return b};k.length=function(a){var b=a[0],c=a[1],d=a[2],a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)};k.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=Math.sqrt(c*c+d*d+e*e+g*g);if(0===f)return b[0]=0,b[1]=0,b[2]=0,b[3]=0,b;f=1/f;b[0]=c*f;b[1]=d*f;b[2]=e*f;b[3]=g*f;return b};k.add=function(a,b,c){if(!c||
a===c)return a[0]+=b[0],a[1]+=b[1],a[2]+=b[2],a[3]+=b[3],a;c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];c[3]=a[3]+b[3];return c};k.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],a=a[3],f=b[0],h=b[1],j=b[2],b=b[3];c[0]=d*b+a*f+e*j-g*h;c[1]=e*b+a*h+g*f-d*j;c[2]=g*b+a*j+d*h-e*f;c[3]=a*b-d*f-e*h-g*j;return c};k.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2],b=a[0],f=a[1],h=a[2],a=a[3],j=a*d+f*g-h*e,i=a*e+h*d-b*g,k=a*g+b*e-f*d,d=-b*d-f*e-h*g;c[0]=j*a+d*-b+i*-h-k*-f;c[1]=i*a+
d*-f+k*-b-j*-h;c[2]=k*a+d*-h+j*-f-i*-b;return c};k.scale=function(a,b,c){if(!c||a===c)return a[0]*=b,a[1]*=b,a[2]*=b,a[3]*=b,a;c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;c[3]=a[3]*b;return c};k.toMat3=function(a,b){b||(b=A.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,j=e+e,i=c*f,k=c*h,c=c*j,l=d*h,d=d*j,e=e*j,f=g*f,h=g*h,g=g*j;b[0]=1-(l+e);b[1]=k+g;b[2]=c-h;b[3]=k-g;b[4]=1-(i+e);b[5]=d+f;b[6]=c+h;b[7]=d-f;b[8]=1-(i+l);return b};k.toMat4=function(a,b){b||(b=x.create());var c=a[0],d=a[1],e=a[2],g=
a[3],f=c+c,h=d+d,j=e+e,i=c*f,k=c*h,c=c*j,l=d*h,d=d*j,e=e*j,f=g*f,h=g*h,g=g*j;b[0]=1-(l+e);b[1]=k+g;b[2]=c-h;b[3]=0;b[4]=k-g;b[5]=1-(i+e);b[6]=d+f;b[7]=0;b[8]=c+h;b[9]=d-f;b[10]=1-(i+l);b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};k.slerp=function(a,b,c,d){d||(d=a);var e=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3],g,f;if(1<=Math.abs(e))return d!==a&&(d[0]=a[0],d[1]=a[1],d[2]=a[2],d[3]=a[3]),d;g=Math.acos(e);f=Math.sqrt(1-e*e);if(0.001>Math.abs(f))return d[0]=0.5*a[0]+0.5*b[0],d[1]=0.5*a[1]+0.5*b[1],
d[2]=0.5*a[2]+0.5*b[2],d[3]=0.5*a[3]+0.5*b[3],d;e=Math.sin((1-c)*g)/f;c=Math.sin(c*g)/f;d[0]=a[0]*e+b[0]*c;d[1]=a[1]*e+b[1]*c;d[2]=a[2]*e+b[2]*c;d[3]=a[3]*e+b[3]*c;return d};k.fromRotationMatrix=function(a,b){b||(b=k.create());var c=a[0]+a[4]+a[8],d;if(0<c)d=Math.sqrt(c+1),b[3]=0.5*d,d=0.5/d,b[0]=(a[7]-a[5])*d,b[1]=(a[2]-a[6])*d,b[2]=(a[3]-a[1])*d;else{d=k.fromRotationMatrix.s_iNext=k.fromRotationMatrix.s_iNext||[1,2,0];c=0;a[4]>a[0]&&(c=1);a[8]>a[3*c+c]&&(c=2);var e=d[c],g=d[e];d=Math.sqrt(a[3*c+
c]-a[3*e+e]-a[3*g+g]+1);b[c]=0.5*d;d=0.5/d;b[3]=(a[3*g+e]-a[3*e+g])*d;b[e]=(a[3*e+c]+a[3*c+e])*d;b[g]=(a[3*g+c]+a[3*c+g])*d}return b};A.toQuat4=k.fromRotationMatrix;(function(){var a=A.create();k.fromAxes=function(b,c,d,e){a[0]=c[0];a[3]=c[1];a[6]=c[2];a[1]=d[0];a[4]=d[1];a[7]=d[2];a[2]=b[0];a[5]=b[1];a[8]=b[2];return k.fromRotationMatrix(a,e)}})();k.identity=function(a){a||(a=k.create());a[0]=0;a[1]=0;a[2]=0;a[3]=1;return a};k.fromAngleAxis=function(a,b,c){c||(c=k.create());var a=0.5*a,d=Math.sin(a);
c[3]=Math.cos(a);c[0]=d*b[0];c[1]=d*b[1];c[2]=d*b[2];return c};k.toAngleAxis=function(a,b){b||(b=a);var c=a[0]*a[0]+a[1]*a[1]+a[2]*a[2];0<c?(b[3]=2*Math.acos(a[3]),c=E.invsqrt(c),b[0]=a[0]*c,b[1]=a[1]*c,b[2]=a[2]*c):(b[3]=0,b[0]=1,b[1]=0,b[2]=0);return b};k.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"};var J={create:function(a){var b=new o(2);a?(b[0]=a[0],b[1]=a[1]):(b[0]=0,b[1]=0);return b},createFrom:function(a,b){var c=new o(2);c[0]=a;c[1]=b;return c},add:function(a,b,c){c||
(c=b);c[0]=a[0]+b[0];c[1]=a[1]+b[1];return c},subtract:function(a,b,c){c||(c=b);c[0]=a[0]-b[0];c[1]=a[1]-b[1];return c},multiply:function(a,b,c){c||(c=b);c[0]=a[0]*b[0];c[1]=a[1]*b[1];return c},divide:function(a,b,c){c||(c=b);c[0]=a[0]/b[0];c[1]=a[1]/b[1];return c},scale:function(a,b,c){c||(c=a);c[0]=a[0]*b;c[1]=a[1]*b;return c},dist:function(a,b){var c=b[0]-a[0],d=b[1]-a[1];return Math.sqrt(c*c+d*d)},set:function(a,b){b[0]=a[0];b[1]=a[1];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-
b[0])&&1.0E-6>Math.abs(a[1]-b[1])},negate:function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];return b},normalize:function(a,b){b||(b=a);var c=a[0]*a[0]+a[1]*a[1];0<c?(c=Math.sqrt(c),b[0]=a[0]/c,b[1]=a[1]/c):b[0]=b[1]=0;return b},cross:function(a,b,c){a=a[0]*b[1]-a[1]*b[0];if(!c)return a;c[0]=c[1]=0;c[2]=a;return c},length:function(a){var b=a[0],a=a[1];return Math.sqrt(b*b+a*a)},squaredLength:function(a){var b=a[0],a=a[1];return b*b+a*a},dot:function(a,b){return a[0]*b[0]+a[1]*b[1]},direction:function(a,
b,c){c||(c=a);var d=a[0]-b[0],a=a[1]-b[1],b=d*d+a*a;if(!b)return c[0]=0,c[1]=0,c[2]=0,c;b=1/Math.sqrt(b);c[0]=d*b;c[1]=a*b;return c},lerp:function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);return d},str:function(a){return"["+a[0]+", "+a[1]+"]"}},I={create:function(a){var b=new o(4);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3]):b[0]=b[1]=b[2]=b[3]=0;return b},createFrom:function(a,b,c,d){var e=new o(4);e[0]=a;e[1]=b;e[2]=c;e[3]=d;return e},set:function(a,b){b[0]=a[0];b[1]=a[1];
b[2]=a[2];b[3]=a[3];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>Math.abs(a[3]-b[3])},identity:function(a){a||(a=I.create());a[0]=1;a[1]=0;a[2]=0;a[3]=1;return a},transpose:function(a,b){if(!b||a===b){var c=a[1];a[1]=a[2];a[2]=c;return a}b[0]=a[0];b[1]=a[2];b[2]=a[1];b[3]=a[3];return b},determinant:function(a){return a[0]*a[3]-a[2]*a[1]},inverse:function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=c*g-e*
d;if(!f)return null;f=1/f;b[0]=g*f;b[1]=-d*f;b[2]=-e*f;b[3]=c*f;return b},multiply:function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],a=a[3];c[0]=d*b[0]+e*b[2];c[1]=d*b[1]+e*b[3];c[2]=g*b[0]+a*b[2];c[3]=g*b[1]+a*b[3];return c},rotate:function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],a=a[3],f=Math.sin(b),b=Math.cos(b);c[0]=d*b+e*f;c[1]=d*-f+e*b;c[2]=g*b+a*f;c[3]=g*-f+a*b;return c},multiplyVec2:function(a,b,c){c||(c=b);var d=b[0],b=b[1];c[0]=d*a[0]+b*a[1];c[1]=d*a[2]+b*a[3];return c},scale:function(a,
b,c){c||(c=a);var d=a[1],e=a[2],g=a[3],f=b[0],b=b[1];c[0]=a[0]*f;c[1]=d*b;c[2]=e*f;c[3]=g*b;return c},str:function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"}},K={create:function(a){var b=new o(4);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3]):(b[0]=0,b[1]=0,b[2]=0,b[3]=0);return b},createFrom:function(a,b,c,d){var e=new o(4);e[0]=a;e[1]=b;e[2]=c;e[3]=d;return e},add:function(a,b,c){c||(c=b);c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];c[3]=a[3]+b[3];return c},subtract:function(a,b,c){c||(c=
b);c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];c[3]=a[3]-b[3];return c},multiply:function(a,b,c){c||(c=b);c[0]=a[0]*b[0];c[1]=a[1]*b[1];c[2]=a[2]*b[2];c[3]=a[3]*b[3];return c},divide:function(a,b,c){c||(c=b);c[0]=a[0]/b[0];c[1]=a[1]/b[1];c[2]=a[2]/b[2];c[3]=a[3]/b[3];return c},scale:function(a,b,c){c||(c=a);c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;c[3]=a[3]*b;return c},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>
Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>Math.abs(a[3]-b[3])},negate:function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=-a[3];return b},length:function(a){var b=a[0],c=a[1],d=a[2],a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)},squaredLength:function(a){var b=a[0],c=a[1],d=a[2],a=a[3];return b*b+c*c+d*d+a*a},lerp:function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);d[3]=a[3]+c*(b[3]-a[3]);return d},str:function(a){return"["+a[0]+", "+
a[1]+", "+a[2]+", "+a[3]+"]"}};w&&(w.glMatrixArrayType=o,w.MatrixArray=o,w.setMatrixArrayType=D,w.determineMatrixArrayType=G,w.glMath=E,w.vec2=J,w.vec3=r,w.vec4=K,w.mat2=I,w.mat3=A,w.mat4=x,w.quat4=k);return{glMatrixArrayType:o,MatrixArray:o,setMatrixArrayType:D,determineMatrixArrayType:G,glMath:E,vec2:J,vec3:r,vec4:K,mat2:I,mat3:A,mat4:x,quat4:k}});
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],36:[function(_dereq_,module,exports){
//------------------------------------------------------------------//

var RGBAColor = _dereq_('./rgba-color.js');

//------------------------------------------------------------------//

function GradiantColor( r,g,b,a ) {
    if (typeof (a) == "undefined")
        a = 1.0;
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
}

GradiantColor.prototype.GetWith  = function( inC , inT ){
    var r = ((this.r - inC.r) * inT) + inC.r;
    var g = ((this.g - inC.g) * inT) + inC.g;
    var b = ((this.b - inC.b) * inT) + inC.b;
    var a = ((this.a - inC.a) * inT) + inC.a;
    return new RGBAColor(r,g,b,a);
}

//------------------------------------------------------------------//

module.exports = GradiantColor;

},{"./rgba-color.js":40}],37:[function(_dereq_,module,exports){
/*! Hammer.JS - v1.1.2 - 2014-04-25
 * http://eightmedia.github.io/hammer.js
 *
 * Copyright (c) 2014 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window, undefined) {
  'use strict';

/**
 * @main
 * @module hammer
 *
 * @class Hammer
 * @static
 */

/**
 * Hammer, use this to create instances
 * ````
 * var hammertime = new Hammer(myElement);
 * ````
 *
 * @method Hammer
 * @param {HTMLElement} element
 * @param {Object} [options={}]
 * @return {Hammer.Instance}
 */
var Hammer = function Hammer(element, options) {
    return new Hammer.Instance(element, options || {});
};

/**
 * version, as defined in package.json
 * the value will be set at each build
 * @property VERSION
 * @final
 * @type {String}
 */
Hammer.VERSION = '1.1.2';

/**
 * default settings.
 * more settings are defined per gesture at `/gestures`. Each gesture can be disabled/enabled
 * by setting it's name (like `swipe`) to false.
 * You can set the defaults for all instances by changing this object before creating an instance.
 * @example
 * ````
 *  Hammer.defaults.drag = false;
 *  Hammer.defaults.behavior.touchAction = 'pan-y';
 *  delete Hammer.defaults.behavior.userSelect;
 * ````
 * @property defaults
 * @type {Object}
 */
Hammer.defaults = {
    /**
     * this setting object adds styles and attributes to the element to prevent the browser from doing
     * its native behavior. The css properties are auto prefixed for the browsers when needed.
     * @property defaults.behavior
     * @type {Object}
     */
    behavior: {
        /**
         * Disables text selection to improve the dragging gesture. When the value is `none` it also sets
         * `onselectstart=false` for IE on the element. Mainly for desktop browsers.
         * @property defaults.behavior.userSelect
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Specifies whether and how a given region can be manipulated by the user (for instance, by panning or zooming).
         * Used by IE10>. By default this makes the element blocking any touch event.
         * @property defaults.behavior.touchAction
         * @type {String}
         * @default: 'none'
         */
        touchAction: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @property defaults.behavior.touchCallout
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @property defaults.behavior.contentZooming
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents.
         * Mainly for desktop browsers.
         * @property defaults.behavior.userDrag
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in Safari on iPhone. This property obeys the alpha value, if specified.
         *
         * If you don't specify an alpha value, Safari on iPhone applies a default alpha value
         * to the color. To disable tap highlighting, set the alpha value to 0 (invisible).
         * If you set the alpha value to 1.0 (opaque), the element is not visible when tapped.
         * @property defaults.behavior.tapHighlightColor
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

/**
 * hammer document where the base events are added at
 * @property DOCUMENT
 * @type {HTMLElement}
 * @default window.document
 */
Hammer.DOCUMENT = document;

/**
 * detect support for pointer events
 * @property HAS_POINTEREVENTS
 * @type {Boolean}
 */
Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;

/**
 * detect support for touch events
 * @property HAS_TOUCHEVENTS
 * @type {Boolean}
 */
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

/**
 * detect mobile browsers
 * @property IS_MOBILE
 * @type {Boolean}
 */
Hammer.IS_MOBILE = /mobile|tablet|ip(ad|hone|od)|android|silk/i.test(navigator.userAgent);

/**
 * detect if we want to support mouseevents at all
 * @property NO_MOUSEEVENTS
 * @type {Boolean}
 */
Hammer.NO_MOUSEEVENTS = (Hammer.HAS_TOUCHEVENTS && Hammer.IS_MOBILE) || Hammer.HAS_POINTEREVENTS;

/**
 * interval in which Hammer recalculates current velocity/direction/angle in ms
 * @property CALCULATE_INTERVAL
 * @type {Number}
 * @default 25
 */
Hammer.CALCULATE_INTERVAL = 25;

/**
 * eventtypes per touchevent (start, move, end) are filled by `Event.determineEventTypes` on `setup`
 * the object contains the DOM event names per type (`EVENT_START`, `EVENT_MOVE`, `EVENT_END`)
 * @property EVENT_TYPES
 * @private
 * @writeOnce
 * @type {Object}
 */
var EVENT_TYPES = {};

/**
 * direction strings, for safe comparisons
 * @property DIRECTION_DOWN|LEFT|UP|RIGHT
 * @final
 * @type {String}
 * @default 'down' 'left' 'up' 'right'
 */
var DIRECTION_DOWN = Hammer.DIRECTION_DOWN = 'down';
var DIRECTION_LEFT = Hammer.DIRECTION_LEFT = 'left';
var DIRECTION_UP = Hammer.DIRECTION_UP = 'up';
var DIRECTION_RIGHT = Hammer.DIRECTION_RIGHT = 'right';

/**
 * pointertype strings, for safe comparisons
 * @property POINTER_MOUSE|TOUCH|PEN
 * @final
 * @type {String}
 * @default 'mouse' 'touch' 'pen'
 */
var POINTER_MOUSE = Hammer.POINTER_MOUSE = 'mouse';
var POINTER_TOUCH = Hammer.POINTER_TOUCH = 'touch';
var POINTER_PEN = Hammer.POINTER_PEN = 'pen';

/**
 * eventtypes
 * @property EVENT_START|MOVE|END|RELEASE|TOUCH
 * @final
 * @type {String}
 * @default 'start' 'change' 'move' 'end' 'release' 'touch'
 */
var EVENT_START = Hammer.EVENT_START = 'start';
var EVENT_MOVE = Hammer.EVENT_MOVE = 'move';
var EVENT_END = Hammer.EVENT_END = 'end';
var EVENT_RELEASE = Hammer.EVENT_RELEASE = 'release';
var EVENT_TOUCH = Hammer.EVENT_TOUCH = 'touch';

/**
 * if the window events are set...
 * @property READY
 * @writeOnce
 * @type {Boolean}
 * @default false
 */
Hammer.READY = false;

/**
 * plugins namespace
 * @property plugins
 * @type {Object}
 */
Hammer.plugins = Hammer.plugins || {};

/**
 * gestures namespace
 * see `/gestures` for the definitions
 * @property gestures
 * @type {Object}
 */
Hammer.gestures = Hammer.gestures || {};

/**
 * setup events to detect gestures on the document
 * this function is called when creating an new instance
 * @private
 */
function setup() {
    if(Hammer.READY) {
        return;
    }

    // find what eventtypes we add listeners to
    Event.determineEventTypes();

    // Register all gestures inside Hammer.gestures
    Utils.each(Hammer.gestures, function(gesture) {
        Detection.register(gesture);
    });

    // Add touch events on the document
    Event.onTouch(Hammer.DOCUMENT, EVENT_MOVE, Detection.detect);
    Event.onTouch(Hammer.DOCUMENT, EVENT_END, Detection.detect);

    // Hammer is ready...!
    Hammer.READY = true;
}

/**
 * @module hammer
 *
 * @class Utils
 * @static
 */
var Utils = Hammer.utils = {
    /**
     * extend method, could also be used for cloning when `dest` is an empty object.
     * changes the dest object
     * @method extend
     * @param {Object} dest
     * @param {Object} src
     * @param {Boolean} [merge=false]  do a merge
     * @return {Object} dest
     */
    extend: function extend(dest, src, merge) {
        for(var key in src) {
            if(!src.hasOwnProperty(key) || (dest[key] !== undefined && merge)) {
                continue;
            }
            dest[key] = src[key];
        }
        return dest;
    },

    /**
     * simple addEventListener wrapper
     * @method on
     * @param {HTMLElement} element
     * @param {String} type
     * @param {Function} handler
     */
    on: function on(element, type, handler) {
        element.addEventListener(type, handler, false);
    },

    /**
     * simple removeEventListener wrapper
     * @method off
     * @param {HTMLElement} element
     * @param {String} type
     * @param {Function} handler
     */
    off: function off(element, type, handler) {
        element.removeEventListener(type, handler, false);
    },

    /**
     * forEach over arrays and objects
     * @method each
     * @param {Object|Array} obj
     * @param {Function} iterator
     * @param {any} iterator.item
     * @param {Number} iterator.index
     * @param {Object|Array} iterator.obj the source object
     * @param {Object} context value to use as `this` in the iterator
     */
    each: function each(obj, iterator, context) {
        var i, len;

        // native forEach on arrays
        if('forEach' in obj) {
            obj.forEach(iterator, context);
        // arrays
        } else if(obj.length !== undefined) {
            for(i = 0, len = obj.length; i < len; i++) {
                if(iterator.call(context, obj[i], i, obj) === false) {
                    return;
                }
            }
        // objects
        } else {
            for(i in obj) {
                if(obj.hasOwnProperty(i) &&
                    iterator.call(context, obj[i], i, obj) === false) {
                    return;
                }
            }
        }
    },

    /**
     * find if a string contains the string using indexOf
     * @method inStr
     * @param {String} src
     * @param {String} find
     * @return {Boolean} found
     */
    inStr: function inStr(src, find) {
        return src.indexOf(find) > -1;
    },

    /**
     * find if a array contains the object using indexOf or a simple polyfill
     * @method inArray
     * @param {String} src
     * @param {String} find
     * @return {Boolean|Number} false when not found, or the index
     */
    inArray: function inArray(src, find) {
        if(src.indexOf) {
            var index = src.indexOf(find);
            return (index === -1) ? false : index;
        } else {
            for(var i = 0, len = src.length; i < len; i++) {
                if(src[i] === find) {
                    return i;
                }
            }
            return false;
        }
    },

    /**
     * convert an array-like object (`arguments`, `touchlist`) to an array
     * @method toArray
     * @param {Object} obj
     * @return {Array}
     */
    toArray: function toArray(obj) {
        return Array.prototype.slice.call(obj, 0);
    },

    /**
     * find if a node is in the given parent
     * @method hasParent
     * @param {HTMLElement} node
     * @param {HTMLElement} parent
     * @return {Boolean} found
     */
    hasParent: function hasParent(node, parent) {
        while(node) {
            if(node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    },

    /**
     * get the center of all the touches
     * @method getCenter
     * @param {Array} touches
     * @return {Object} center contains `pageX`, `pageY`, `clientX` and `clientY` properties
     */
    getCenter: function getCenter(touches) {
        var pageX = [],
            pageY = [],
            clientX = [],
            clientY = [],
            min = Math.min,
            max = Math.max;

        // no need to loop when only one touch
        if(touches.length === 1) {
            return {
                pageX: touches[0].pageX,
                pageY: touches[0].pageY,
                clientX: touches[0].clientX,
                clientY: touches[0].clientY
            };
        }

        Utils.each(touches, function(touch) {
            pageX.push(touch.pageX);
            pageY.push(touch.pageY);
            clientX.push(touch.clientX);
            clientY.push(touch.clientY);
        });

        return {
            pageX: (min.apply(Math, pageX) + max.apply(Math, pageX)) / 2,
            pageY: (min.apply(Math, pageY) + max.apply(Math, pageY)) / 2,
            clientX: (min.apply(Math, clientX) + max.apply(Math, clientX)) / 2,
            clientY: (min.apply(Math, clientY) + max.apply(Math, clientY)) / 2
        };
    },

    /**
     * calculate the velocity between two points. unit is in px per ms.
     * @method getVelocity
     * @param {Number} deltaTime
     * @param {Number} deltaX
     * @param {Number} deltaY
     * @return {Object} velocity `x` and `y`
     */
    getVelocity: function getVelocity(deltaTime, deltaX, deltaY) {
        return {
            x: Math.abs(deltaX / deltaTime) || 0,
            y: Math.abs(deltaY / deltaTime) || 0
        };
    },

    /**
     * calculate the angle between two coordinates
     * @method getAngle
     * @param {Touch} touch1
     * @param {Touch} touch2
     * @return {Number} angle
     */
    getAngle: function getAngle(touch1, touch2) {
        var x = touch2.clientX - touch1.clientX,
            y = touch2.clientY - touch1.clientY;

        return Math.atan2(y, x) * 180 / Math.PI;
    },

    /**
     * do a small comparision to get the direction between two touches.
     * @method getDirection
     * @param {Touch} touch1
     * @param {Touch} touch2
     * @return {String} direction matches `DIRECTION_LEFT|RIGHT|UP|DOWN`
     */
    getDirection: function getDirection(touch1, touch2) {
        var x = Math.abs(touch1.clientX - touch2.clientX),
            y = Math.abs(touch1.clientY - touch2.clientY);

        if(x >= y) {
            return touch1.clientX - touch2.clientX > 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
        }
        return touch1.clientY - touch2.clientY > 0 ? DIRECTION_UP : DIRECTION_DOWN;
    },

    /**
     * calculate the distance between two touches
     * @method getDistance
     * @param {Touch}touch1
     * @param {Touch} touch2
     * @return {Number} distance
     */
    getDistance: function getDistance(touch1, touch2) {
        var x = touch2.clientX - touch1.clientX,
            y = touch2.clientY - touch1.clientY;

        return Math.sqrt((x * x) + (y * y));
    },

    /**
     * calculate the scale factor between two touchLists
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @method getScale
     * @param {Array} start array of touches
     * @param {Array} end array of touches
     * @return {Number} scale
     */
    getScale: function getScale(start, end) {
        // need two fingers...
        if(start.length >= 2 && end.length >= 2) {
            return this.getDistance(end[0], end[1]) / this.getDistance(start[0], start[1]);
        }
        return 1;
    },

    /**
     * calculate the rotation degrees between two touchLists
     * @method getRotation
     * @param {Array} start array of touches
     * @param {Array} end array of touches
     * @return {Number} rotation
     */
    getRotation: function getRotation(start, end) {
        // need two fingers
        if(start.length >= 2 && end.length >= 2) {
            return this.getAngle(end[1], end[0]) - this.getAngle(start[1], start[0]);
        }
        return 0;
    },

    /**
     * find out if the direction is vertical   *
     * @method isVertical
     * @param {String} direction matches `DIRECTION_UP|DOWN`
     * @return {Boolean} is_vertical
     */
    isVertical: function isVertical(direction) {
        return direction == DIRECTION_UP || direction == DIRECTION_DOWN;
    },

    /**
     * set css properties with their prefixes
     * @param {HTMLElement} element
     * @param {String} prop
     * @param {String} value
     * @param {Boolean} [toggle=true]
     * @return {Boolean}
     */
    setPrefixedCss: function setPrefixedCss(element, prop, value, toggle) {
        var prefixes = ['', 'Webkit', 'Moz', 'O', 'ms'];
        prop = Utils.toCamelCase(prop);

        for(var i = 0; i < prefixes.length; i++) {
            var p = prop;
            // prefixes
            if(prefixes[i]) {
                p = prefixes[i] + p.slice(0, 1).toUpperCase() + p.slice(1);
            }

            // test the style
            if(p in element.style) {
                element.style[p] = (toggle == null || toggle) && value || '';
                break;
            }
        }
    },

    /**
     * toggle browser default behavior by setting css properties.
     * `userSelect='none'` also sets `element.onselectstart` to false
     * `userDrag='none'` also sets `element.ondragstart` to false
     *
     * @method toggleBehavior
     * @param {HtmlElement} element
     * @param {Object} props
     * @param {Boolean} [toggle=true]
     */
    toggleBehavior: function toggleBehavior(element, props, toggle) {
        if(!props || !element || !element.style) {
            return;
        }

        // set the css properties
        Utils.each(props, function(value, prop) {
            Utils.setPrefixedCss(element, prop, value, toggle);
        });

        var falseFn = toggle && function() {
            return false;
        };

        // also the disable onselectstart
        if(props.userSelect == 'none') {
            element.onselectstart = falseFn;
        }
        // and disable ondragstart
        if(props.userDrag == 'none') {
            element.ondragstart = falseFn;
        }
    },

    /**
     * convert a string with underscores to camelCase
     * so prevent_default becomes preventDefault
     * @param {String} str
     * @return {String} camelCaseStr
     */
    toCamelCase: function toCamelCase(str) {
        return str.replace(/[_-]([a-z])/g, function(s) {
            return s[1].toUpperCase();
        });
    }
};


/**
 * @module hammer
 */
/**
 * @class Event
 * @static
 */
var Event = Hammer.event = {
    /**
     * when touch events have been fired, this is true
     * this is used to stop mouse events
     * @property prevent_mouseevents
     * @private
     * @type {Boolean}
     */
    preventMouseEvents: false,

    /**
     * if EVENT_START has been fired
     * @property started
     * @private
     * @type {Boolean}
     */
    started: false,

    /**
     * when the mouse is hold down, this is true
     * @property should_detect
     * @private
     * @type {Boolean}
     */
    shouldDetect: false,

    /**
     * simple event binder with a hook and support for multiple types
     * @method on
     * @param {HTMLElement} element
     * @param {String} type
     * @param {Function} handler
     * @param {Function} [hook]
     * @param {Object} hook.type
     */
    on: function on(element, type, handler, hook) {
        var types = type.split(' ');
        Utils.each(types, function(type) {
            Utils.on(element, type, handler);
            hook && hook(type);
        });
    },

    /**
     * simple event unbinder with a hook and support for multiple types
     * @method off
     * @param {HTMLElement} element
     * @param {String} type
     * @param {Function} handler
     * @param {Function} [hook]
     * @param {Object} hook.type
     */
    off: function off(element, type, handler, hook) {
        var types = type.split(' ');
        Utils.each(types, function(type) {
            Utils.off(element, type, handler);
            hook && hook(type);
        });
    },

    /**
     * the core touch event handler.
     * this finds out if we should to detect gestures
     * @method onTouch
     * @param {HTMLElement} element
     * @param {String} eventType matches `EVENT_START|MOVE|END`
     * @param {Function} handler
     * @return onTouchHandler {Function} the core event handler
     */
    onTouch: function onTouch(element, eventType, handler) {
        var self = this;

        var onTouchHandler = function onTouchHandler(ev) {
            var srcType = ev.type.toLowerCase(),
                isPointer = Hammer.HAS_POINTEREVENTS,
                isMouse = Utils.inStr(srcType, 'mouse'),
                triggerType;

            // if we are in a mouseevent, but there has been a touchevent triggered in this session
            // we want to do nothing. simply break out of the event.
            if(isMouse && self.preventMouseEvents) {
                return;

            // mousebutton must be down
            } else if(isMouse && eventType == EVENT_START && ev.button === 0) {
                self.preventMouseEvents = false;
                self.shouldDetect = true;
            } else if(isPointer && eventType == EVENT_START) {
                self.shouldDetect = (ev.buttons === 1);
            // just a valid start event, but no mouse
            } else if(!isMouse && eventType == EVENT_START) {
                self.preventMouseEvents = true;
                self.shouldDetect = true;
            }

            // update the pointer event before entering the detection
            if(isPointer && eventType != EVENT_END) {
                PointerEvent.updatePointer(eventType, ev);
            }

            // we are in a touch/down state, so allowed detection of gestures
            if(self.shouldDetect) {
                triggerType = self.doDetect.call(self, ev, eventType, element, handler);
            }

            // ...and we are done with the detection
            // so reset everything to start each detection totally fresh
            if(triggerType == EVENT_END) {
                self.preventMouseEvents = false;
                self.shouldDetect = false;
                PointerEvent.reset();
            // update the pointerevent object after the detection
            }

            if(isPointer && eventType == EVENT_END) {
                PointerEvent.updatePointer(eventType, ev);
            }
        };

        this.on(element, EVENT_TYPES[eventType], onTouchHandler);
        return onTouchHandler;
    },

    /**
     * the core detection method
     * this finds out what hammer-touch-events to trigger
     * @method doDetect
     * @param {Object} ev
     * @param {String} eventType matches `EVENT_START|MOVE|END`
     * @param {HTMLElement} element
     * @param {Function} handler
     * @return {String} triggerType matches `EVENT_START|MOVE|END`
     */
    doDetect: function doDetect(ev, eventType, element, handler) {
        var touchList = this.getTouchList(ev, eventType);
        var touchListLength = touchList.length;
        var triggerType = eventType;
        var triggerChange = touchList.trigger; // used by fakeMultitouch plugin
        var changedLength = touchListLength;

        // at each touchstart-like event we want also want to trigger a TOUCH event...
        if(eventType == EVENT_START) {
            triggerChange = EVENT_TOUCH;
        // ...the same for a touchend-like event
        } else if(eventType == EVENT_END) {
            triggerChange = EVENT_RELEASE;

            // keep track of how many touches have been removed
            changedLength = touchList.length - ((ev.changedTouches) ? ev.changedTouches.length : 1);
        }

        // after there are still touches on the screen,
        // we just want to trigger a MOVE event. so change the START or END to a MOVE
        // but only after detection has been started, the first time we actualy want a START
        if(changedLength > 0 && this.started) {
            triggerType = EVENT_MOVE;
        }

        // detection has been started, we keep track of this, see above
        this.started = true;

        // generate some event data, some basic information
        var evData = this.collectEventData(element, triggerType, touchList, ev);

        // trigger the triggerType event before the change (TOUCH, RELEASE) events
        // but the END event should be at last
        if(eventType != EVENT_END) {
            handler.call(Detection, evData);
        }

        // trigger a change (TOUCH, RELEASE) event, this means the length of the touches changed
        if(triggerChange) {
            evData.changedLength = changedLength;
            evData.eventType = triggerChange;

            handler.call(Detection, evData);

            evData.eventType = triggerType;
            delete evData.changedLength;
        }

        // trigger the END event
        if(triggerType == EVENT_END) {
            handler.call(Detection, evData);

            // ...and we are done with the detection
            // so reset everything to start each detection totally fresh
            this.started = false;
        }

        return triggerType;
    },

    /**
     * we have different events for each device/browser
     * determine what we need and set them in the EVENT_TYPES constant
     * the `onTouch` method is bind to these properties.
     * @method determineEventTypes
     * @return {Object} events
     */
    determineEventTypes: function determineEventTypes() {
        var types;
        if(Hammer.HAS_POINTEREVENTS) {
            if(window.PointerEvent) {
                types = [
                    'pointerdown',
                    'pointermove',
                    'pointerup pointercancel lostpointercapture'
                ];
            } else {
                types = [
                    'MSPointerDown',
                    'MSPointerMove',
                    'MSPointerUp MSPointerCancel MSLostPointerCapture'
                ];
            }
        } else if(Hammer.NO_MOUSEEVENTS) {
            types = [
                'touchstart',
                'touchmove',
                'touchend touchcancel'
            ];
        } else {
            types = [
                'touchstart mousedown',
                'touchmove mousemove',
                'touchend touchcancel mouseup'
            ];
        }

        EVENT_TYPES[EVENT_START] = types[0];
        EVENT_TYPES[EVENT_MOVE] = types[1];
        EVENT_TYPES[EVENT_END] = types[2];
        return EVENT_TYPES;
    },

    /**
     * create touchList depending on the event
     * @method getTouchList
     * @param {Object} ev
     * @param {String} eventType
     * @return {Array} touches
     */
    getTouchList: function getTouchList(ev, eventType) {
        // get the fake pointerEvent touchlist
        if(Hammer.HAS_POINTEREVENTS) {
            return PointerEvent.getTouchList();
        }

        // get the touchlist
        if(ev.touches) {
            if(eventType == EVENT_MOVE) {
                return ev.touches;
            }

            var identifiers = [];
            var concat = [].concat(Utils.toArray(ev.touches), Utils.toArray(ev.changedTouches));
            var touchList = [];

            Utils.each(concat, function(touch) {
                if(Utils.inArray(identifiers, touch.identifier) === false) {
                    touchList.push(touch);
                }
                identifiers.push(touch.identifier);
            });

            return touchList;
        }

        // make fake touchList from mouse position
        ev.identifier = 1;
        return [ev];
    },

    /**
     * collect basic event data
     * @method collectEventData
     * @param {HTMLElement} element
     * @param {String} eventType matches `EVENT_START|MOVE|END`
     * @param {Array} touches
     * @param {Object} ev
     * @return {Object} ev
     */
    collectEventData: function collectEventData(element, eventType, touches, ev) {
        // find out pointerType
        var pointerType = POINTER_TOUCH;
        if(Utils.inStr(ev.type, 'mouse') || PointerEvent.matchType(POINTER_MOUSE, ev)) {
            pointerType = POINTER_MOUSE;
        } else if(PointerEvent.matchType(POINTER_PEN, ev)) {
            pointerType = POINTER_PEN;
        }

        return {
            center: Utils.getCenter(touches),
            timeStamp: Date.now(),
            target: ev.target,
            touches: touches,
            eventType: eventType,
            pointerType: pointerType,
            srcEvent: ev,

            /**
             * prevent the browser default actions
             * mostly used to disable scrolling of the browser
             */
            preventDefault: function() {
                var srcEvent = this.srcEvent;
                srcEvent.preventManipulation && srcEvent.preventManipulation();
                srcEvent.preventDefault && srcEvent.preventDefault();
            },

            /**
             * stop bubbling the event up to its parents
             */
            stopPropagation: function() {
                this.srcEvent.stopPropagation();
            },

            /**
             * immediately stop gesture detection
             * might be useful after a swipe was detected
             * @return {*}
             */
            stopDetect: function() {
                return Detection.stopDetect();
            }
        };
    }
};


/**
 * @module hammer
 *
 * @class PointerEvent
 * @static
 */
var PointerEvent = Hammer.PointerEvent = {
    /**
     * holds all pointers, by `identifier`
     * @property pointers
     * @type {Object}
     */
    pointers: {},

    /**
     * get the pointers as an array
     * @method getTouchList
     * @return {Array} touchlist
     */
    getTouchList: function getTouchList() {
        var touchlist = [];
        // we can use forEach since pointerEvents only is in IE10
        Utils.each(this.pointers, function(pointer) {
            touchlist.push(pointer);
        });
        return touchlist;
    },

    /**
     * update the position of a pointer
     * @method updatePointer
     * @param {String} eventType matches `EVENT_START|MOVE|END`
     * @param {Object} pointerEvent
     */
    updatePointer: function updatePointer(eventType, pointerEvent) {
        if(eventType == EVENT_END || (eventType != EVENT_END && pointerEvent.buttons !== 1)) {
            delete this.pointers[pointerEvent.pointerId];
        } else {
            pointerEvent.identifier = pointerEvent.pointerId;
            this.pointers[pointerEvent.pointerId] = pointerEvent;
        }
    },

    /**
     * check if ev matches pointertype
     * @method matchType
     * @param {String} pointerType matches `POINTER_MOUSE|TOUCH|PEN`
     * @param {PointerEvent} ev
     */
    matchType: function matchType(pointerType, ev) {
        if(!ev.pointerType) {
            return false;
        }

        var pt = ev.pointerType,
            types = {};

        types[POINTER_MOUSE] = (pt === (ev.MSPOINTER_TYPE_MOUSE || POINTER_MOUSE));
        types[POINTER_TOUCH] = (pt === (ev.MSPOINTER_TYPE_TOUCH || POINTER_TOUCH));
        types[POINTER_PEN] = (pt === (ev.MSPOINTER_TYPE_PEN || POINTER_PEN));
        return types[pointerType];
    },

    /**
     * reset the stored pointers
     * @method reset
     */
    reset: function resetList() {
        this.pointers = {};
    }
};


/**
 * @module hammer
 *
 * @class Detection
 * @static
 */
var Detection = Hammer.detection = {
    // contains all registred Hammer.gestures in the correct order
    gestures: [],

    // data of the current Hammer.gesture detection session
    current: null,

    // the previous Hammer.gesture session data
    // is a full clone of the previous gesture.current object
    previous: null,

    // when this becomes true, no gestures are fired
    stopped: false,

    /**
     * start Hammer.gesture detection
     * @method startDetect
     * @param {Hammer.Instance} inst
     * @param {Object} eventData
     */
    startDetect: function startDetect(inst, eventData) {
        // already busy with a Hammer.gesture detection on an element
        if(this.current) {
            return;
        }

        this.stopped = false;

        // holds current session
        this.current = {
            inst: inst, // reference to HammerInstance we're working for
            startEvent: Utils.extend({}, eventData), // start eventData for distances, timing etc
            lastEvent: false, // last eventData
            lastCalcEvent: false, // last eventData for calculations.
            futureCalcEvent: false, // last eventData for calculations.
            lastCalcData: {}, // last lastCalcData
            name: '' // current gesture we're in/detected, can be 'tap', 'hold' etc
        };

        this.detect(eventData);
    },

    /**
     * Hammer.gesture detection
     * @method detect
     * @param {Object} eventData
     * @return {any}
     */
    detect: function detect(eventData) {
        if(!this.current || this.stopped) {
            return;
        }

        // extend event data with calculations about scale, distance etc
        eventData = this.extendEventData(eventData);

        // hammer instance and instance options
        var inst = this.current.inst,
            instOptions = inst.options;

        // call Hammer.gesture handlers
        Utils.each(this.gestures, function triggerGesture(gesture) {
            // only when the instance options have enabled this gesture
            if(!this.stopped && inst.enabled && instOptions[gesture.name]) {
                // if a handler returns false, we stop with the detection
                if(gesture.handler.call(gesture, eventData, inst) === false) {
                    this.stopDetect();
                    return false;
                }
            }
        }, this);

        // store as previous event event
        if(this.current) {
            this.current.lastEvent = eventData;
        }

        if(eventData.eventType == EVENT_END) {
            this.stopDetect();
        }

        return eventData;
    },

    /**
     * clear the Hammer.gesture vars
     * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
     * to stop other Hammer.gestures from being fired
     * @method stopDetect
     */
    stopDetect: function stopDetect() {
        // clone current data to the store as the previous gesture
        // used for the double tap gesture, since this is an other gesture detect session
        this.previous = Utils.extend({}, this.current);

        // reset the current
        this.current = null;
        this.stopped = true;
    },

    /**
     * calculate velocity, angle and direction
     * @method getVelocityData
     * @param {Object} ev
     * @param {Object} center
     * @param {Number} deltaTime
     * @param {Number} deltaX
     * @param {Number} deltaY
     */
    getCalculatedData: function getCalculatedData(ev, center, deltaTime, deltaX, deltaY) {
        var cur = this.current,
            recalc = false,
            calcEv = cur.lastCalcEvent,
            calcData = cur.lastCalcData;

        if(calcEv && ev.timeStamp - calcEv.timeStamp > Hammer.CALCULATE_INTERVAL) {
            center = calcEv.center;
            deltaTime = ev.timeStamp - calcEv.timeStamp;
            deltaX = ev.center.clientX - calcEv.center.clientX;
            deltaY = ev.center.clientY - calcEv.center.clientY;
            recalc = true;
        }

        if(ev.eventType == EVENT_TOUCH || ev.eventType == EVENT_RELEASE) {
            cur.futureCalcEvent = ev;
        }

        if(!cur.lastCalcEvent || recalc) {
            calcData.velocity = Utils.getVelocity(deltaTime, deltaX, deltaY);
            calcData.angle = Utils.getAngle(center, ev.center);
            calcData.direction = Utils.getDirection(center, ev.center);

            cur.lastCalcEvent = cur.futureCalcEvent || ev;
            cur.futureCalcEvent = ev;
        }

        ev.velocityX = calcData.velocity.x;
        ev.velocityY = calcData.velocity.y;
        ev.interimAngle = calcData.angle;
        ev.interimDirection = calcData.direction;
    },

    /**
     * extend eventData for Hammer.gestures
     * @method extendEventData
     * @param {Object} ev
     * @return {Object} ev
     */
    extendEventData: function extendEventData(ev) {
        var cur = this.current,
            startEv = cur.startEvent,
            lastEv = cur.lastEvent || startEv;

        // update the start touchlist to calculate the scale/rotation
        if(ev.eventType == EVENT_TOUCH || ev.eventType == EVENT_RELEASE) {
            startEv.touches = [];
            Utils.each(ev.touches, function(touch) {
                startEv.touches.push({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            });
        }

        var deltaTime = ev.timeStamp - startEv.timeStamp,
            deltaX = ev.center.clientX - startEv.center.clientX,
            deltaY = ev.center.clientY - startEv.center.clientY;

        this.getCalculatedData(ev, lastEv.center, deltaTime, deltaX, deltaY);

        Utils.extend(ev, {
            startEvent: startEv,

            deltaTime: deltaTime,
            deltaX: deltaX,
            deltaY: deltaY,

            distance: Utils.getDistance(startEv.center, ev.center),
            angle: Utils.getAngle(startEv.center, ev.center),
            direction: Utils.getDirection(startEv.center, ev.center),
            scale: Utils.getScale(startEv.touches, ev.touches),
            rotation: Utils.getRotation(startEv.touches, ev.touches)
        });

        return ev;
    },

    /**
     * register new gesture
     * @method register
     * @param {Object} gesture object, see `gestures/` for documentation
     * @return {Array} gestures
     */
    register: function register(gesture) {
        // add an enable gesture options if there is no given
        var options = gesture.defaults || {};
        if(options[gesture.name] === undefined) {
            options[gesture.name] = true;
        }

        // extend Hammer default options with the Hammer.gesture options
        Utils.extend(Hammer.defaults, options, true);

        // set its index
        gesture.index = gesture.index || 1000;

        // add Hammer.gesture to the list
        this.gestures.push(gesture);

        // sort the list by index
        this.gestures.sort(function(a, b) {
            if(a.index < b.index) {
                return -1;
            }
            if(a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return this.gestures;
    }
};


/**
 * @module hammer
 */

/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 *
 * @class Instance
 * @constructor
 * @param {HTMLElement} element
 * @param {Object} [options={}] options are merged with `Hammer.defaults`
 * @return {Hammer.Instance}
 */
Hammer.Instance = function(element, options) {
    var self = this;

    // setup HammerJS window events and register all gestures
    // this also sets up the default options
    setup();

    /**
     * @property element
     * @type {HTMLElement}
     */
    this.element = element;

    /**
     * @property enabled
     * @type {Boolean}
     * @protected
     */
    this.enabled = true;

    /**
     * options, merged with the defaults
     * options with an _ are converted to camelCase
     * @property options
     * @type {Object}
     */
    Utils.each(options, function(value, name) {
        delete options[name];
        options[Utils.toCamelCase(name)] = value;
    });

    this.options = Utils.extend(Utils.extend({}, Hammer.defaults), options || {});

    // add some css to the element to prevent the browser from doing its native behavoir
    if(this.options.behavior) {
        Utils.toggleBehavior(this.element, this.options.behavior, true);
    }

    /**
     * event start handler on the element to start the detection
     * @property eventStartHandler
     * @type {Object}
     */
    this.eventStartHandler = Event.onTouch(element, EVENT_START, function(ev) {
        if(self.enabled && ev.eventType == EVENT_START) {
            Detection.startDetect(self, ev);
        } else if(ev.eventType == EVENT_TOUCH) {
            Detection.detect(ev);
        }
    });

    /**
     * keep a list of user event handlers which needs to be removed when calling 'dispose'
     * @property eventHandlers
     * @type {Array}
     */
    this.eventHandlers = [];
};

Hammer.Instance.prototype = {
    /**
     * bind events to the instance
     * @method on
     * @chainable
     * @param {String} gestures multiple gestures by splitting with a space
     * @param {Function} handler
     * @param {Object} handler.ev event object
     */
    on: function onEvent(gestures, handler) {
        var self = this;
        Event.on(self.element, gestures, handler, function(type) {
            self.eventHandlers.push({ gesture: type, handler: handler });
        });
        return self;
    },

    /**
     * unbind events to the instance
     * @method off
     * @chainable
     * @param {String} gestures
     * @param {Function} handler
     */
    off: function offEvent(gestures, handler) {
        var self = this;

        Event.off(self.element, gestures, handler, function(type) {
            var index = Utils.inArray({ gesture: type, handler: handler });
            if(index !== false) {
                self.eventHandlers.splice(index, 1);
            }
        });
        return self;
    },

    /**
     * trigger gesture event
     * @method trigger
     * @chainable
     * @param {String} gesture
     * @param {Object} [eventData]
     */
    trigger: function triggerEvent(gesture, eventData) {
        // optional
        if(!eventData) {
            eventData = {};
        }

        // create DOM event
        var event = Hammer.DOCUMENT.createEvent('Event');
        event.initEvent(gesture, true, true);
        event.gesture = eventData;

        // trigger on the target if it is in the instance element,
        // this is for event delegation tricks
        var element = this.element;
        if(Utils.hasParent(eventData.target, element)) {
            element = eventData.target;
        }

        element.dispatchEvent(event);
        return this;
    },

    /**
     * enable of disable hammer.js detection
     * @method enable
     * @chainable
     * @param {Boolean} state
     */
    enable: function enable(state) {
        this.enabled = state;
        return this;
    },

    /**
     * dispose this hammer instance
     * @method dispose
     * @return {Null}
     */
    dispose: function dispose() {
        var i, eh;

        // undo all changes made by stop_browser_behavior
        Utils.toggleBehavior(this.element, this.options.behavior, false);

        // unbind all custom event handlers
        for(i = -1; (eh = this.eventHandlers[++i]);) {
            Utils.off(this.element, eh.gesture, eh.handler);
        }

        this.eventHandlers = [];

        // unbind the start event listener
        Event.off(this.element, EVENT_TYPES[EVENT_START], this.eventStartHandler);

        return null;
    }
};


/**
 * @module gestures
 */
/**
 * Move with x fingers (default 1) around on the page.
 * Preventing the default browser behavior is a good way to improve feel and working.
 * ````
 *  hammertime.on("drag", function(ev) {
 *    console.log(ev);
 *    ev.gesture.preventDefault();
 *  });
 * ````
 *
 * @class Drag
 * @static
 */
/**
 * @event drag
 * @param {Object} ev
 */
/**
 * @event dragstart
 * @param {Object} ev
 */
/**
 * @event dragend
 * @param {Object} ev
 */
/**
 * @event drapleft
 * @param {Object} ev
 */
/**
 * @event dragright
 * @param {Object} ev
 */
/**
 * @event dragup
 * @param {Object} ev
 */
/**
 * @event dragdown
 * @param {Object} ev
 */

/**
 * @param {String} name
 */
(function(name) {
    var triggered = false;

    function dragGesture(ev, inst) {
        var cur = Detection.current;

        // max touches
        if(inst.options.dragMaxTouches > 0 &&
            ev.touches.length > inst.options.dragMaxTouches) {
            return;
        }

        switch(ev.eventType) {
            case EVENT_START:
                triggered = false;
                break;

            case EVENT_MOVE:
                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.distance < inst.options.dragMinDistance &&
                    cur.name != name) {
                    return;
                }

                var startCenter = cur.startEvent.center;

                // we are dragging!
                if(cur.name != name) {
                    cur.name = name;
                    if(inst.options.dragDistanceCorrection && ev.distance > 0) {
                        // When a drag is triggered, set the event center to dragMinDistance pixels from the original event center.
                        // Without this correction, the dragged distance would jumpstart at dragMinDistance pixels instead of at 0.
                        // It might be useful to save the original start point somewhere
                        var factor = Math.abs(inst.options.dragMinDistance / ev.distance);
                        startCenter.pageX += ev.deltaX * factor;
                        startCenter.pageY += ev.deltaY * factor;
                        startCenter.clientX += ev.deltaX * factor;
                        startCenter.clientY += ev.deltaY * factor;

                        // recalculate event data using new start point
                        ev = Detection.extendEventData(ev);
                    }
                }

                // lock drag to axis?
                if(cur.lastEvent.dragLockToAxis ||
                    ( inst.options.dragLockToAxis &&
                        inst.options.dragLockMinDistance <= ev.distance
                        )) {
                    ev.dragLockToAxis = true;
                }

                // keep direction on the axis that the drag gesture started on
                var lastDirection = cur.lastEvent.direction;
                if(ev.dragLockToAxis && lastDirection !== ev.direction) {
                    if(Utils.isVertical(lastDirection)) {
                        ev.direction = (ev.deltaY < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                    } else {
                        ev.direction = (ev.deltaX < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                    }
                }

                // first time, trigger dragstart event
                if(!triggered) {
                    inst.trigger(name + 'start', ev);
                    triggered = true;
                }

                // trigger events
                inst.trigger(name, ev);
                inst.trigger(name + ev.direction, ev);

                var isVertical = Utils.isVertical(ev.direction);

                // block the browser events
                if((inst.options.dragBlockVertical && isVertical) ||
                    (inst.options.dragBlockHorizontal && !isVertical)) {
                    ev.preventDefault();
                }
                break;

            case EVENT_RELEASE:
                if(triggered && ev.changedLength <= inst.options.dragMaxTouches) {
                    inst.trigger(name + 'end', ev);
                    triggered = false;
                }
                break;

            case EVENT_END:
                triggered = false;
                break;
        }
    }

    Hammer.gestures.Drag = {
        name: name,
        index: 50,
        handler: dragGesture,
        defaults: {
            /**
             * minimal movement that have to be made before the drag event gets triggered
             * @property dragMinDistance
             * @type {Number}
             * @default 10
             */
            dragMinDistance: 10,

            /**
             * Set dragDistanceCorrection to true to make the starting point of the drag
             * be calculated from where the drag was triggered, not from where the touch started.
             * Useful to avoid a jerk-starting drag, which can make fine-adjustments
             * through dragging difficult, and be visually unappealing.
             * @property dragDistanceCorrection
             * @type {Boolean}
             * @default true
             */
            dragDistanceCorrection: true,

            /**
             * set 0 for unlimited, but this can conflict with transform
             * @property dragMaxTouches
             * @type {Number}
             * @default 1
             */
            dragMaxTouches: 1,

            /**
             * prevent default browser behavior when dragging occurs
             * be careful with it, it makes the element a blocking element
             * when you are using the drag gesture, it is a good practice to set this true
             * @property dragBlockHorizontal
             * @type {Boolean}
             * @default false
             */
            dragBlockHorizontal: false,

            /**
             * same as `dragBlockHorizontal`, but for vertical movement
             * @property dragBlockVertical
             * @type {Boolean}
             * @default false
             */
            dragBlockVertical: false,

            /**
             * dragLockToAxis keeps the drag gesture on the axis that it started on,
             * It disallows vertical directions if the initial direction was horizontal, and vice versa.
             * @property dragLockToAxis
             * @type {Boolean}
             * @default false
             */
            dragLockToAxis: false,

            /**
             * drag lock only kicks in when distance > dragLockMinDistance
             * This way, locking occurs only when the distance has become large enough to reliably determine the direction
             * @property dragLockMinDistance
             * @type {Number}
             * @default 25
             */
            dragLockMinDistance: 25
        }
    };
})('drag');

/**
 * @module gestures
 */
/**
 * trigger a simple gesture event, so you can do anything in your handler.
 * only usable if you know what your doing...
 *
 * @class Gesture
 * @static
 */
/**
 * @event gesture
 * @param {Object} ev
 */
Hammer.gestures.Gesture = {
    name: 'gesture',
    index: 1337,
    handler: function releaseGesture(ev, inst) {
        inst.trigger(this.name, ev);
    }
};

/**
 * @module gestures
 */
/**
 * Touch stays at the same place for x time
 *
 * @class Hold
 * @static
 */
/**
 * @event hold
 * @param {Object} ev
 */

/**
 * @param {String} name
 */
(function(name) {
    var timer;

    function holdGesture(ev, inst) {
        var options = inst.options,
            current = Detection.current;

        switch(ev.eventType) {
            case EVENT_START:
                clearTimeout(timer);

                // set the gesture so we can check in the timeout if it still is
                current.name = name;

                // set timer and if after the timeout it still is hold,
                // we trigger the hold event
                timer = setTimeout(function() {
                    if(current && current.name == name) {
                        inst.trigger(name, ev);
                    }
                }, options.holdTimeout);
                break;

            case EVENT_MOVE:
                if(ev.distance > options.holdThreshold) {
                    clearTimeout(timer);
                }
                break;

            case EVENT_RELEASE:
                clearTimeout(timer);
                break;
        }
    }

    Hammer.gestures.Hold = {
        name: name,
        index: 10,
        defaults: {
            /**
             * @property holdTimeout
             * @type {Number}
             * @default 500
             */
            holdTimeout: 500,

            /**
             * movement allowed while holding
             * @property holdThreshold
             * @type {Number}
             * @default 2
             */
            holdThreshold: 2
        },
        handler: holdGesture
    };
})('hold');

/**
 * @module gestures
 */
/**
 * when a touch is being released from the page
 *
 * @class Release
 * @static
 */
/**
 * @event release
 * @param {Object} ev
 */
Hammer.gestures.Release = {
    name: 'release',
    index: Infinity,
    handler: function releaseGesture(ev, inst) {
        if(ev.eventType == EVENT_RELEASE) {
            inst.trigger(this.name, ev);
        }
    }
};

/**
 * @module gestures
 */
/**
 * triggers swipe events when the end velocity is above the threshold
 * for best usage, set `preventDefault` (on the drag gesture) to `true`
 * ````
 *  hammertime.on("dragleft swipeleft", function(ev) {
 *    console.log(ev);
 *    ev.gesture.preventDefault();
 *  });
 * ````
 *
 * @class Swipe
 * @static
 */
/**
 * @event swipe
 * @param {Object} ev
 */
/**
 * @event swipeleft
 * @param {Object} ev
 */
/**
 * @event swiperight
 * @param {Object} ev
 */
/**
 * @event swipeup
 * @param {Object} ev
 */
/**
 * @event swipedown
 * @param {Object} ev
 */
Hammer.gestures.Swipe = {
    name: 'swipe',
    index: 40,
    defaults: {
        /**
         * @property swipeMinTouches
         * @type {Number}
         * @default 1
         */
        swipeMinTouches: 1,

        /**
         * @property swipeMaxTouches
         * @type {Number}
         * @default 1
         */
        swipeMaxTouches: 1,

        /**
         * horizontal swipe velocity
         * @property swipeVelocityX
         * @type {Number}
         * @default 0.6
         */
        swipeVelocityX: 0.6,

        /**
         * vertical swipe velocity
         * @property swipeVelocityY
         * @type {Number}
         * @default 0.6
         */
        swipeVelocityY: 0.6
    },

    handler: function swipeGesture(ev, inst) {
        if(ev.eventType == EVENT_RELEASE) {
            var touches = ev.touches.length,
                options = inst.options;

            // max touches
            if(touches < options.swipeMinTouches ||
                touches > options.swipeMaxTouches) {
                return;
            }

            // when the distance we moved is too small we skip this gesture
            // or we can be already in dragging
            if(ev.velocityX > options.swipeVelocityX ||
                ev.velocityY > options.swipeVelocityY) {
                // trigger swipe events
                inst.trigger(this.name, ev);
                inst.trigger(this.name + ev.direction, ev);
            }
        }
    }
};

/**
 * @module gestures
 */
/**
 * Single tap and a double tap on a place
 *
 * @class Tap
 * @static
 */
/**
 * @event tap
 * @param {Object} ev
 */
/**
 * @event doubletap
 * @param {Object} ev
 */

/**
 * @param {String} name
 */
(function(name) {
    var hasMoved = false;

    function tapGesture(ev, inst) {
        var options = inst.options,
            current = Detection.current,
            prev = Detection.previous,
            sincePrev,
            didDoubleTap;

        switch(ev.eventType) {
            case EVENT_START:
                hasMoved = false;
                break;

            case EVENT_MOVE:
                hasMoved = hasMoved || (ev.distance > options.tapMaxDistance);
                break;

            case EVENT_END:
                if(ev.srcEvent.type != 'touchcancel' && ev.deltaTime < options.tapMaxTime && !hasMoved) {
                    // previous gesture, for the double tap since these are two different gesture detections
                    sincePrev = prev && prev.lastEvent && ev.timeStamp - prev.lastEvent.timeStamp;
                    didDoubleTap = false;

                    // check if double tap
                    if(prev && prev.name == name &&
                        (sincePrev && sincePrev < options.doubleTapInterval) &&
                        ev.distance < options.doubleTapDistance) {
                        inst.trigger('doubletap', ev);
                        didDoubleTap = true;
                    }

                    // do a single tap
                    if(!didDoubleTap || options.tapAlways) {
                        current.name = name;
                        inst.trigger(current.name, ev);
                    }
                }
        }
    }

    Hammer.gestures.Tap = {
        name: name,
        index: 100,
        handler: tapGesture,
        defaults: {
            /**
             * max time of a tap, this is for the slow tappers
             * @property tapMaxTime
             * @type {Number}
             * @default 250
             */
            tapMaxTime: 250,

            /**
             * max distance of movement of a tap, this is for the slow tappers
             * @property tapMaxDistance
             * @type {Number}
             * @default 10
             */
            tapMaxDistance: 10,

            /**
             * always trigger the `tap` event, even while double-tapping
             * @property tapAlways
             * @type {Boolean}
             * @default true
             */
            tapAlways: true,

            /**
             * max distance between two taps
             * @property doubleTapDistance
             * @type {Number}
             * @default 20
             */
            doubleTapDistance: 20,

            /**
             * max time between two taps
             * @property doubleTapInterval
             * @type {Number}
             * @default 300
             */
            doubleTapInterval: 300
        }
    };
})('tap');

/**
 * @module gestures
 */
/**
 * when a touch is being touched at the page
 *
 * @class Touch
 * @static
 */
/**
 * @event touch
 * @param {Object} ev
 */
Hammer.gestures.Touch = {
    name: 'touch',
    index: -Infinity,
    defaults: {
        /**
         * call preventDefault at touchstart, and makes the element blocking by disabling the scrolling of the page,
         * but it improves gestures like transforming and dragging.
         * be careful with using this, it can be very annoying for users to be stuck on the page
         * @property preventDefault
         * @type {Boolean}
         * @default false
         */
        preventDefault: false,

        /**
         * disable mouse events, so only touch (or pen!) input triggers events
         * @property preventMouse
         * @type {Boolean}
         * @default false
         */
        preventMouse: false
    },
    handler: function touchGesture(ev, inst) {
        if(inst.options.preventMouse && ev.pointerType == POINTER_MOUSE) {
            ev.stopDetect();
            return;
        }

        if(inst.options.preventDefault) {
            ev.preventDefault();
        }

        if(ev.eventType == EVENT_TOUCH) {
            inst.trigger('touch', ev);
        }
    }
};

/**
 * @module gestures
 */
/**
 * User want to scale or rotate with 2 fingers
 * Preventing the default browser behavior is a good way to improve feel and working. This can be done with the
 * `preventDefault` option.
 *
 * @class Transform
 * @static
 */
/**
 * @event transform
 * @param {Object} ev
 */
/**
 * @event transformstart
 * @param {Object} ev
 */
/**
 * @event transformend
 * @param {Object} ev
 */
/**
 * @event pinchin
 * @param {Object} ev
 */
/**
 * @event pinchout
 * @param {Object} ev
 */
/**
 * @event rotate
 * @param {Object} ev
 */

/**
 * @param {String} name
 */
(function(name) {
    var triggered = false;

    function transformGesture(ev, inst) {
        switch(ev.eventType) {
            case EVENT_START:
                triggered = false;
                break;

            case EVENT_MOVE:
                // at least multitouch
                if(ev.touches.length < 2) {
                    return;
                }

                var scaleThreshold = Math.abs(1 - ev.scale);
                var rotationThreshold = Math.abs(ev.rotation);

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(scaleThreshold < inst.options.transformMinScale &&
                    rotationThreshold < inst.options.transformMinRotation) {
                    return;
                }

                // we are transforming!
                Detection.current.name = name;

                // first time, trigger dragstart event
                if(!triggered) {
                    inst.trigger(name + 'start', ev);
                    triggered = true;
                }

                inst.trigger(name, ev); // basic transform event

                // trigger rotate event
                if(rotationThreshold > inst.options.transformMinRotation) {
                    inst.trigger('rotate', ev);
                }

                // trigger pinch event
                if(scaleThreshold > inst.options.transformMinScale) {
                    inst.trigger('pinch', ev);
                    inst.trigger('pinch' + (ev.scale < 1 ? 'in' : 'out'), ev);
                }
                break;

            case EVENT_RELEASE:
                if(triggered && ev.changedLength < 2) {
                    inst.trigger(name + 'end', ev);
                    triggered = false;
                }
                break;
        }
    }

    Hammer.gestures.Transform = {
        name: name,
        index: 45,
        defaults: {
            /**
             * minimal scale factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
             * @property transformMinScale
             * @type {Number}
             * @default 0.01
             */
            transformMinScale: 0.01,

            /**
             * rotation in degrees
             * @property transformMinRotation
             * @type {Number}
             * @default 1
             */
            transformMinRotation: 1
        },

        handler: transformGesture
    };
})('transform');

/**
 * @module hammer
 */

// AMD export
if(typeof define == 'function' && define.amd) {
    define(function() {
        return Hammer;
    });
// commonjs export
} else if(typeof module !== 'undefined' && module.exports) {
    module.exports = Hammer;
// browser export
} else {
    window.Hammer = Hammer;
}

})(window);
},{}],38:[function(_dereq_,module,exports){
function Point ( x , y ) {
   return {
       x : x, 
       y : y
   }
}

//------------------------------------------------------------------//

module.exports = Point;
},{}],39:[function(_dereq_,module,exports){
/*
  proj4js.js -- Javascript reprojection library. 
  
  Authors:      Mike Adair madairATdmsolutions.ca
                Richard Greenwood richATgreenwoodmap.com
                Didier Richard didier.richardATign.fr
                Stephen Irons stephen.ironsATclear.net.nz
                Olivier Terral oterralATgmail.com
                
  License:      
 Copyright (c) 2012, Mike Adair, Richard Greenwood, Didier Richard, 
                     Stephen Irons and Olivier Terral

 Permission is hereby granted, free of charge, to any person obtaining a
 copy of this software and associated documentation files (the "Software"),
 to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense,
 and/or sell copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included
 in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 DEALINGS IN THE SOFTWARE.
 
 Note: This program is an almost direct port of the C library PROJ.4.
*/
var Proj4js={defaultDatum:"WGS84",transform:function(a,c,b){if(!a.readyToUse)return this.reportError("Proj4js initialization for:"+a.srsCode+" not yet complete"),b;if(!c.readyToUse)return this.reportError("Proj4js initialization for:"+c.srsCode+" not yet complete"),b;if(a.datum&&c.datum&&((a.datum.datum_type==Proj4js.common.PJD_3PARAM||a.datum.datum_type==Proj4js.common.PJD_7PARAM)&&"WGS84"!=c.datumCode||(c.datum.datum_type==Proj4js.common.PJD_3PARAM||c.datum.datum_type==Proj4js.common.PJD_7PARAM)&&
"WGS84"!=a.datumCode)){var d=Proj4js.WGS84;this.transform(a,d,b);a=d}"enu"!=a.axis&&this.adjust_axis(a,!1,b);"longlat"==a.projName?(b.x*=Proj4js.common.D2R,b.y*=Proj4js.common.D2R):(a.to_meter&&(b.x*=a.to_meter,b.y*=a.to_meter),a.inverse(b));a.from_greenwich&&(b.x+=a.from_greenwich);b=this.datum_transform(a.datum,c.datum,b);c.from_greenwich&&(b.x-=c.from_greenwich);"longlat"==c.projName?(b.x*=Proj4js.common.R2D,b.y*=Proj4js.common.R2D):(c.forward(b),c.to_meter&&(b.x/=c.to_meter,b.y/=c.to_meter));
"enu"!=c.axis&&this.adjust_axis(c,!0,b);return b},datum_transform:function(a,c,b){if(a.compare_datums(c)||a.datum_type==Proj4js.common.PJD_NODATUM||c.datum_type==Proj4js.common.PJD_NODATUM)return b;if(a.es!=c.es||a.a!=c.a||a.datum_type==Proj4js.common.PJD_3PARAM||a.datum_type==Proj4js.common.PJD_7PARAM||c.datum_type==Proj4js.common.PJD_3PARAM||c.datum_type==Proj4js.common.PJD_7PARAM)a.geodetic_to_geocentric(b),(a.datum_type==Proj4js.common.PJD_3PARAM||a.datum_type==Proj4js.common.PJD_7PARAM)&&a.geocentric_to_wgs84(b),
(c.datum_type==Proj4js.common.PJD_3PARAM||c.datum_type==Proj4js.common.PJD_7PARAM)&&c.geocentric_from_wgs84(b),c.geocentric_to_geodetic(b);return b},adjust_axis:function(a,c,b){for(var d=b.x,e=b.y,f=b.z||0,g,i,h=0;3>h;h++)if(!c||!(2==h&&void 0===b.z))switch(0==h?(g=d,i="x"):1==h?(g=e,i="y"):(g=f,i="z"),a.axis[h]){case "e":b[i]=g;break;case "w":b[i]=-g;break;case "n":b[i]=g;break;case "s":b[i]=-g;break;case "u":void 0!==b[i]&&(b.z=g);break;case "d":void 0!==b[i]&&(b.z=-g);break;default:return alert("ERROR: unknow axis ("+
a.axis[h]+") - check definition of "+a.projName),null}return b},reportError:function(){},extend:function(a,c){a=a||{};if(c)for(var b in c){var d=c[b];void 0!==d&&(a[b]=d)}return a},Class:function(){for(var a=function(){this.initialize.apply(this,arguments)},c={},b,d=0;d<arguments.length;++d)b="function"==typeof arguments[d]?arguments[d].prototype:arguments[d],Proj4js.extend(c,b);a.prototype=c;return a},bind:function(a,c){var b=Array.prototype.slice.apply(arguments,[2]);return function(){var d=b.concat(Array.prototype.slice.apply(arguments,
[0]));return a.apply(c,d)}},scriptName:"proj4js-compressed.js",defsLookupService:"http://spatialreference.org/ref",libPath:null,getScriptLocation:function(){if(this.libPath)return this.libPath;for(var a=this.scriptName,c=a.length,b=document.getElementsByTagName("script"),d=0;d<b.length;d++){var e=b[d].getAttribute("src");if(e){var f=e.lastIndexOf(a);if(-1<f&&f+c==e.length){this.libPath=e.slice(0,-c);break}}}return this.libPath||""},loadScript:function(a,c,b,d){var e=document.createElement("script");
e.defer=!1;e.type="text/javascript";e.id=a;e.src=a;e.onload=c;e.onerror=b;e.loadCheck=d;/MSIE/.test(navigator.userAgent)&&(e.onreadystatechange=this.checkReadyState);document.getElementsByTagName("head")[0].appendChild(e)},checkReadyState:function(){if("loaded"==this.readyState)if(this.loadCheck())this.onload();else this.onerror()}};
Proj4js.Proj=Proj4js.Class({readyToUse:!1,title:null,projName:null,units:null,datum:null,x0:0,y0:0,localCS:!1,queue:null,initialize:function(a,c){this.srsCodeInput=a;this.queue=[];c&&this.queue.push(c);if(0<=a.indexOf("GEOGCS")||0<=a.indexOf("GEOCCS")||0<=a.indexOf("PROJCS")||0<=a.indexOf("LOCAL_CS"))this.parseWKT(a),this.deriveConstants(),this.loadProjCode(this.projName);else{if(0==a.indexOf("urn:")){var b=a.split(":");if(("ogc"==b[1]||"x-ogc"==b[1])&&"def"==b[2]&&"crs"==b[3])a=b[4]+":"+b[b.length-
1]}else 0==a.indexOf("http://")&&(b=a.split("#"),b[0].match(/epsg.org/)?a="EPSG:"+b[1]:b[0].match(/RIG.xml/)&&(a="IGNF:"+b[1]));this.srsCode=a.toUpperCase();0==this.srsCode.indexOf("EPSG")?(this.srsCode=this.srsCode,this.srsAuth="epsg",this.srsProjNumber=this.srsCode.substring(5)):0==this.srsCode.indexOf("IGNF")?(this.srsCode=this.srsCode,this.srsAuth="IGNF",this.srsProjNumber=this.srsCode.substring(5)):0==this.srsCode.indexOf("CRS")?(this.srsCode=this.srsCode,this.srsAuth="CRS",this.srsProjNumber=
this.srsCode.substring(4)):(this.srsAuth="",this.srsProjNumber=this.srsCode);this.loadProjDefinition()}},loadProjDefinition:function(){if(Proj4js.defs[this.srsCode])this.defsLoaded();else{var a=Proj4js.getScriptLocation()+"defs/"+this.srsAuth.toUpperCase()+this.srsProjNumber+".js";Proj4js.loadScript(a,Proj4js.bind(this.defsLoaded,this),Proj4js.bind(this.loadFromService,this),Proj4js.bind(this.checkDefsLoaded,this))}},loadFromService:function(){Proj4js.loadScript(Proj4js.defsLookupService+"/"+this.srsAuth+
"/"+this.srsProjNumber+"/proj4js/",Proj4js.bind(this.defsLoaded,this),Proj4js.bind(this.defsFailed,this),Proj4js.bind(this.checkDefsLoaded,this))},defsLoaded:function(){this.parseDefs();this.loadProjCode(this.projName)},checkDefsLoaded:function(){return Proj4js.defs[this.srsCode]?!0:!1},defsFailed:function(){Proj4js.reportError("failed to load projection definition for: "+this.srsCode);Proj4js.defs[this.srsCode]=Proj4js.defs.WGS84;this.defsLoaded()},loadProjCode:function(a){if(Proj4js.Proj[a])this.initTransforms();
else{var c=Proj4js.getScriptLocation()+"projCode/"+a+".js";Proj4js.loadScript(c,Proj4js.bind(this.loadProjCodeSuccess,this,a),Proj4js.bind(this.loadProjCodeFailure,this,a),Proj4js.bind(this.checkCodeLoaded,this,a))}},loadProjCodeSuccess:function(a){Proj4js.Proj[a].dependsOn?this.loadProjCode(Proj4js.Proj[a].dependsOn):this.initTransforms()},loadProjCodeFailure:function(a){Proj4js.reportError("failed to find projection file for: "+a)},checkCodeLoaded:function(a){return Proj4js.Proj[a]?!0:!1},initTransforms:function(){Proj4js.extend(this,
Proj4js.Proj[this.projName]);this.init();this.readyToUse=!0;if(this.queue)for(var a;a=this.queue.shift();)a.call(this,this)},wktRE:/^(\w+)\[(.*)\]$/,parseWKT:function(a){if(a=a.match(this.wktRE)){var c=a[1],b=a[2].split(","),d;d="TOWGS84"==c.toUpperCase()?c:b.shift();d=d.replace(/^\"/,"");d=d.replace(/\"$/,"");for(var a=[],e=0,f="",g=0;g<b.length;++g){for(var i=b[g],h=0;h<i.length;++h)"["==i.charAt(h)&&++e,"]"==i.charAt(h)&&--e;f+=i;0===e?(a.push(f),f=""):f+=","}switch(c){case "LOCAL_CS":this.projName=
"identity";this.localCS=!0;this.srsCode=d;break;case "GEOGCS":this.projName="longlat";this.geocsCode=d;this.srsCode||(this.srsCode=d);break;case "PROJCS":this.srsCode=d;break;case "PROJECTION":this.projName=Proj4js.wktProjections[d];break;case "DATUM":this.datumName=d;break;case "LOCAL_DATUM":this.datumCode="none";break;case "SPHEROID":this.ellps=d;this.a=parseFloat(a.shift());this.rf=parseFloat(a.shift());break;case "PRIMEM":this.from_greenwich=parseFloat(a.shift());break;case "UNIT":this.units=
d;this.unitsPerMeter=parseFloat(a.shift());break;case "PARAMETER":c=d.toLowerCase();b=parseFloat(a.shift());switch(c){case "false_easting":this.x0=b;break;case "false_northing":this.y0=b;break;case "scale_factor":this.k0=b;break;case "central_meridian":this.long0=b*Proj4js.common.D2R;break;case "latitude_of_origin":this.lat0=b*Proj4js.common.D2R}break;case "TOWGS84":this.datum_params=a;break;case "AXIS":c=d.toLowerCase();b=a.shift();switch(b){case "EAST":b="e";break;case "WEST":b="w";break;case "NORTH":b=
"n";break;case "SOUTH":b="s";break;case "UP":b="u";break;case "DOWN":b="d";break;default:b=" "}this.axis||(this.axis="enu");switch(c){case "x":this.axis=b+this.axis.substr(1,2);break;case "y":this.axis=this.axis.substr(0,1)+b+this.axis.substr(2,1);break;case "z":this.axis=this.axis.substr(0,2)+b}}for(g=0;g<a.length;++g)this.parseWKT(a[g])}},parseDefs:function(){this.defData=Proj4js.defs[this.srsCode];var a,c;if(this.defData){for(var b=this.defData.split("+"),d=0;d<b.length;d++)switch(c=b[d].split("="),
a=c[0].toLowerCase(),c=c[1],a.replace(/\s/gi,"")){case "title":this.title=c;break;case "proj":this.projName=c.replace(/\s/gi,"");break;case "units":this.units=c.replace(/\s/gi,"");break;case "datum":this.datumCode=c.replace(/\s/gi,"");break;case "nadgrids":this.nagrids=c.replace(/\s/gi,"");break;case "ellps":this.ellps=c.replace(/\s/gi,"");break;case "a":this.a=parseFloat(c);break;case "b":this.b=parseFloat(c);break;case "rf":this.rf=parseFloat(c);break;case "lat_0":this.lat0=c*Proj4js.common.D2R;
break;case "lat_1":this.lat1=c*Proj4js.common.D2R;break;case "lat_2":this.lat2=c*Proj4js.common.D2R;break;case "lat_ts":this.lat_ts=c*Proj4js.common.D2R;break;case "lon_0":this.long0=c*Proj4js.common.D2R;break;case "alpha":this.alpha=parseFloat(c)*Proj4js.common.D2R;break;case "lonc":this.longc=c*Proj4js.common.D2R;break;case "x_0":this.x0=parseFloat(c);break;case "y_0":this.y0=parseFloat(c);break;case "k_0":this.k0=parseFloat(c);break;case "k":this.k0=parseFloat(c);break;case "r_a":this.R_A=!0;break;
case "zone":this.zone=parseInt(c,10);break;case "south":this.utmSouth=!0;break;case "towgs84":this.datum_params=c.split(",");break;case "to_meter":this.to_meter=parseFloat(c);break;case "from_greenwich":this.from_greenwich=c*Proj4js.common.D2R;break;case "pm":c=c.replace(/\s/gi,"");this.from_greenwich=Proj4js.PrimeMeridian[c]?Proj4js.PrimeMeridian[c]:parseFloat(c);this.from_greenwich*=Proj4js.common.D2R;break;case "axis":c=c.replace(/\s/gi,""),3==c.length&&-1!="ewnsud".indexOf(c.substr(0,1))&&-1!=
"ewnsud".indexOf(c.substr(1,1))&&-1!="ewnsud".indexOf(c.substr(2,1))&&(this.axis=c)}this.deriveConstants()}},deriveConstants:function(){"@null"==this.nagrids&&(this.datumCode="none");if(this.datumCode&&"none"!=this.datumCode){var a=Proj4js.Datum[this.datumCode];a&&(this.datum_params=a.towgs84?a.towgs84.split(","):null,this.ellps=a.ellipse,this.datumName=a.datumName?a.datumName:this.datumCode)}this.a||Proj4js.extend(this,Proj4js.Ellipsoid[this.ellps]?Proj4js.Ellipsoid[this.ellps]:Proj4js.Ellipsoid.WGS84);
this.rf&&!this.b&&(this.b=(1-1/this.rf)*this.a);if(0===this.rf||Math.abs(this.a-this.b)<Proj4js.common.EPSLN)this.sphere=!0,this.b=this.a;this.a2=this.a*this.a;this.b2=this.b*this.b;this.es=(this.a2-this.b2)/this.a2;this.e=Math.sqrt(this.es);this.R_A&&(this.a*=1-this.es*(Proj4js.common.SIXTH+this.es*(Proj4js.common.RA4+this.es*Proj4js.common.RA6)),this.a2=this.a*this.a,this.b2=this.b*this.b,this.es=0);this.ep2=(this.a2-this.b2)/this.b2;this.k0||(this.k0=1);this.axis||(this.axis="enu");this.datum=
new Proj4js.datum(this)}});Proj4js.Proj.longlat={init:function(){},forward:function(a){return a},inverse:function(a){return a}};Proj4js.Proj.identity=Proj4js.Proj.longlat;
Proj4js.defs={WGS84:"+title=long/lat:WGS84 +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees","EPSG:4326":"+title=long/lat:WGS84 +proj=longlat +a=6378137.0 +b=6356752.31424518 +ellps=WGS84 +datum=WGS84 +units=degrees","EPSG:4269":"+title=long/lat:NAD83 +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees","EPSG:3875":"+title= Google Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs"};
Proj4js.defs["EPSG:3785"]=Proj4js.defs["EPSG:3875"];Proj4js.defs.GOOGLE=Proj4js.defs["EPSG:3875"];Proj4js.defs["EPSG:900913"]=Proj4js.defs["EPSG:3875"];Proj4js.defs["EPSG:102113"]=Proj4js.defs["EPSG:3875"];
Proj4js.common={PI:3.141592653589793,HALF_PI:1.5707963267948966,TWO_PI:6.283185307179586,FORTPI:0.7853981633974483,R2D:57.29577951308232,D2R:0.017453292519943295,SEC_TO_RAD:4.84813681109536E-6,EPSLN:1.0E-10,MAX_ITER:20,COS_67P5:0.3826834323650898,AD_C:1.0026,PJD_UNKNOWN:0,PJD_3PARAM:1,PJD_7PARAM:2,PJD_GRIDSHIFT:3,PJD_WGS84:4,PJD_NODATUM:5,SRS_WGS84_SEMIMAJOR:6378137,SIXTH:0.16666666666666666,RA4:0.04722222222222222,RA6:0.022156084656084655,RV4:0.06944444444444445,RV6:0.04243827160493827,msfnz:function(a,
c,b){a*=c;return b/Math.sqrt(1-a*a)},tsfnz:function(a,c,b){b*=a;b=Math.pow((1-b)/(1+b),0.5*a);return Math.tan(0.5*(this.HALF_PI-c))/b},phi2z:function(a,c){for(var b=0.5*a,d,e=this.HALF_PI-2*Math.atan(c),f=0;15>=f;f++)if(d=a*Math.sin(e),d=this.HALF_PI-2*Math.atan(c*Math.pow((1-d)/(1+d),b))-e,e+=d,1.0E-10>=Math.abs(d))return e;alert("phi2z has NoConvergence");return-9999},qsfnz:function(a,c){var b;return 1.0E-7<a?(b=a*c,(1-a*a)*(c/(1-b*b)-0.5/a*Math.log((1-b)/(1+b)))):2*c},asinz:function(a){1<Math.abs(a)&&
(a=1<a?1:-1);return Math.asin(a)},e0fn:function(a){return 1-0.25*a*(1+a/16*(3+1.25*a))},e1fn:function(a){return 0.375*a*(1+0.25*a*(1+0.46875*a))},e2fn:function(a){return 0.05859375*a*a*(1+0.75*a)},e3fn:function(a){return a*a*a*(35/3072)},mlfn:function(a,c,b,d,e){return a*e-c*Math.sin(2*e)+b*Math.sin(4*e)-d*Math.sin(6*e)},srat:function(a,c){return Math.pow((1-a)/(1+a),c)},sign:function(a){return 0>a?-1:1},adjust_lon:function(a){return a=Math.abs(a)<this.PI?a:a-this.sign(a)*this.TWO_PI},adjust_lat:function(a){return a=
Math.abs(a)<this.HALF_PI?a:a-this.sign(a)*this.PI},latiso:function(a,c,b){if(Math.abs(c)>this.HALF_PI)return+Number.NaN;if(c==this.HALF_PI)return Number.POSITIVE_INFINITY;if(c==-1*this.HALF_PI)return-1*Number.POSITIVE_INFINITY;b*=a;return Math.log(Math.tan((this.HALF_PI+c)/2))+a*Math.log((1-b)/(1+b))/2},fL:function(a,c){return 2*Math.atan(a*Math.exp(c))-this.HALF_PI},invlatiso:function(a,c){var b=this.fL(1,c),d=0,e=0;do d=b,e=a*Math.sin(d),b=this.fL(Math.exp(a*Math.log((1+e)/(1-e))/2),c);while(1.0E-12<
Math.abs(b-d));return b},sinh:function(a){a=Math.exp(a);return(a-1/a)/2},cosh:function(a){a=Math.exp(a);return(a+1/a)/2},tanh:function(a){a=Math.exp(a);return(a-1/a)/(a+1/a)},asinh:function(a){return(0<=a?1:-1)*Math.log(Math.abs(a)+Math.sqrt(a*a+1))},acosh:function(a){return 2*Math.log(Math.sqrt((a+1)/2)+Math.sqrt((a-1)/2))},atanh:function(a){return Math.log((a-1)/(a+1))/2},gN:function(a,c,b){c*=b;return a/Math.sqrt(1-c*c)},pj_enfn:function(a){var c=[];c[0]=this.C00-a*(this.C02+a*(this.C04+a*(this.C06+
a*this.C08)));c[1]=a*(this.C22-a*(this.C04+a*(this.C06+a*this.C08)));var b=a*a;c[2]=b*(this.C44-a*(this.C46+a*this.C48));b*=a;c[3]=b*(this.C66-a*this.C68);c[4]=b*a*this.C88;return c},pj_mlfn:function(a,c,b,d){b*=c;c*=c;return d[0]*a-b*(d[1]+c*(d[2]+c*(d[3]+c*d[4])))},pj_inv_mlfn:function(a,c,b){for(var d=1/(1-c),e=a,f=Proj4js.common.MAX_ITER;f;--f){var g=Math.sin(e),i=1-c*g*g,i=(this.pj_mlfn(e,g,Math.cos(e),b)-a)*i*Math.sqrt(i)*d,e=e-i;if(Math.abs(i)<Proj4js.common.EPSLN)return e}Proj4js.reportError("cass:pj_inv_mlfn: Convergence error");
return e},C00:1,C02:0.25,C04:0.046875,C06:0.01953125,C08:0.01068115234375,C22:0.75,C44:0.46875,C46:0.013020833333333334,C48:0.007120768229166667,C66:0.3645833333333333,C68:0.005696614583333333,C88:0.3076171875};
Proj4js.datum=Proj4js.Class({initialize:function(a){this.datum_type=Proj4js.common.PJD_WGS84;a.datumCode&&"none"==a.datumCode&&(this.datum_type=Proj4js.common.PJD_NODATUM);if(a&&a.datum_params){for(var c=0;c<a.datum_params.length;c++)a.datum_params[c]=parseFloat(a.datum_params[c]);if(0!=a.datum_params[0]||0!=a.datum_params[1]||0!=a.datum_params[2])this.datum_type=Proj4js.common.PJD_3PARAM;if(3<a.datum_params.length&&(0!=a.datum_params[3]||0!=a.datum_params[4]||0!=a.datum_params[5]||0!=a.datum_params[6]))this.datum_type=
Proj4js.common.PJD_7PARAM,a.datum_params[3]*=Proj4js.common.SEC_TO_RAD,a.datum_params[4]*=Proj4js.common.SEC_TO_RAD,a.datum_params[5]*=Proj4js.common.SEC_TO_RAD,a.datum_params[6]=a.datum_params[6]/1E6+1}a&&(this.a=a.a,this.b=a.b,this.es=a.es,this.ep2=a.ep2,this.datum_params=a.datum_params)},compare_datums:function(a){return this.datum_type!=a.datum_type||this.a!=a.a||5.0E-11<Math.abs(this.es-a.es)?!1:this.datum_type==Proj4js.common.PJD_3PARAM?this.datum_params[0]==a.datum_params[0]&&this.datum_params[1]==
a.datum_params[1]&&this.datum_params[2]==a.datum_params[2]:this.datum_type==Proj4js.common.PJD_7PARAM?this.datum_params[0]==a.datum_params[0]&&this.datum_params[1]==a.datum_params[1]&&this.datum_params[2]==a.datum_params[2]&&this.datum_params[3]==a.datum_params[3]&&this.datum_params[4]==a.datum_params[4]&&this.datum_params[5]==a.datum_params[5]&&this.datum_params[6]==a.datum_params[6]:this.datum_type==Proj4js.common.PJD_GRIDSHIFT||a.datum_type==Proj4js.common.PJD_GRIDSHIFT?(alert("ERROR: Grid shift transformations are not implemented."),
!1):!0},geodetic_to_geocentric:function(a){var c=a.x,b=a.y,d=a.z?a.z:0,e,f,g;if(b<-Proj4js.common.HALF_PI&&b>-1.001*Proj4js.common.HALF_PI)b=-Proj4js.common.HALF_PI;else if(b>Proj4js.common.HALF_PI&&b<1.001*Proj4js.common.HALF_PI)b=Proj4js.common.HALF_PI;else if(b<-Proj4js.common.HALF_PI||b>Proj4js.common.HALF_PI)return Proj4js.reportError("geocent:lat out of range:"+b),null;c>Proj4js.common.PI&&(c-=2*Proj4js.common.PI);f=Math.sin(b);g=Math.cos(b);e=this.a/Math.sqrt(1-this.es*f*f);b=(e+d)*g*Math.cos(c);
c=(e+d)*g*Math.sin(c);d=(e*(1-this.es)+d)*f;a.x=b;a.y=c;a.z=d;return 0},geocentric_to_geodetic:function(a){var c,b,d,e,f,g,i,h,j,k,l=a.x;d=a.y;var m=a.z?a.z:0;c=Math.sqrt(l*l+d*d);b=Math.sqrt(l*l+d*d+m*m);if(1.0E-12>c/this.a){if(l=0,1.0E-12>b/this.a)return}else l=Math.atan2(d,l);d=m/b;e=c/b;f=1/Math.sqrt(1-this.es*(2-this.es)*e*e);i=e*(1-this.es)*f;h=d*f;k=0;do k++,g=this.a/Math.sqrt(1-this.es*h*h),b=c*i+m*h-g*(1-this.es*h*h),g=this.es*g/(g+b),f=1/Math.sqrt(1-g*(2-g)*e*e),g=e*(1-g)*f,f*=d,j=f*i-g*
h,i=g,h=f;while(1.0E-24<j*j&&30>k);c=Math.atan(f/Math.abs(g));a.x=l;a.y=c;a.z=b;return a},geocentric_to_geodetic_noniter:function(a){var c=a.x,b=a.y,d=a.z?a.z:0,e,f,g,i,h,c=parseFloat(c),b=parseFloat(b),d=parseFloat(d);h=!1;if(0!=c)e=Math.atan2(b,c);else if(0<b)e=Proj4js.common.HALF_PI;else if(0>b)e=-Proj4js.common.HALF_PI;else if(h=!0,e=0,0<d)f=Proj4js.common.HALF_PI;else if(0>d)f=-Proj4js.common.HALF_PI;else return;g=c*c+b*b;c=Math.sqrt(g);b=d*Proj4js.common.AD_C;g=Math.sqrt(b*b+g);b/=g;g=c/g;b=
d+this.b*this.ep2*b*b*b;i=c-this.a*this.es*g*g*g;g=Math.sqrt(b*b+i*i);b/=g;g=i/g;i=this.a/Math.sqrt(1-this.es*b*b);d=g>=Proj4js.common.COS_67P5?c/g-i:g<=-Proj4js.common.COS_67P5?c/-g-i:d/b+i*(this.es-1);!1==h&&(f=Math.atan(b/g));a.x=e;a.y=f;a.z=d;return a},geocentric_to_wgs84:function(a){if(this.datum_type==Proj4js.common.PJD_3PARAM)a.x+=this.datum_params[0],a.y+=this.datum_params[1],a.z+=this.datum_params[2];else if(this.datum_type==Proj4js.common.PJD_7PARAM){var c=this.datum_params[3],b=this.datum_params[4],
d=this.datum_params[5],e=this.datum_params[6],f=e*(d*a.x+a.y-c*a.z)+this.datum_params[1],c=e*(-b*a.x+c*a.y+a.z)+this.datum_params[2];a.x=e*(a.x-d*a.y+b*a.z)+this.datum_params[0];a.y=f;a.z=c}},geocentric_from_wgs84:function(a){if(this.datum_type==Proj4js.common.PJD_3PARAM)a.x-=this.datum_params[0],a.y-=this.datum_params[1],a.z-=this.datum_params[2];else if(this.datum_type==Proj4js.common.PJD_7PARAM){var c=this.datum_params[3],b=this.datum_params[4],d=this.datum_params[5],e=this.datum_params[6],f=(a.x-
this.datum_params[0])/e,g=(a.y-this.datum_params[1])/e,e=(a.z-this.datum_params[2])/e;a.x=f+d*g-b*e;a.y=-d*f+g+c*e;a.z=b*f-c*g+e}}});
Proj4js.Point=Proj4js.Class({initialize:function(a,c,b){"object"==typeof a?(this.x=a[0],this.y=a[1],this.z=a[2]||0):"string"==typeof a&&"undefined"==typeof c?(a=a.split(","),this.x=parseFloat(a[0]),this.y=parseFloat(a[1]),this.z=parseFloat(a[2])||0):(this.x=a,this.y=c,this.z=b||0)},clone:function(){return new Proj4js.Point(this.x,this.y,this.z)},toString:function(){return"x="+this.x+",y="+this.y},toShortString:function(){return this.x+", "+this.y}});
Proj4js.PrimeMeridian={greenwich:0,lisbon:-9.131906111111,paris:2.337229166667,bogota:-74.080916666667,madrid:-3.687938888889,rome:12.452333333333,bern:7.439583333333,jakarta:106.807719444444,ferro:-17.666666666667,brussels:4.367975,stockholm:18.058277777778,athens:23.7163375,oslo:10.722916666667};
Proj4js.Ellipsoid={MERIT:{a:6378137,rf:298.257,ellipseName:"MERIT 1983"},SGS85:{a:6378136,rf:298.257,ellipseName:"Soviet Geodetic System 85"},GRS80:{a:6378137,rf:298.257222101,ellipseName:"GRS 1980(IUGG, 1980)"},IAU76:{a:6378140,rf:298.257,ellipseName:"IAU 1976"},airy:{a:6377563.396,b:6356256.91,ellipseName:"Airy 1830"},"APL4.":{a:6378137,rf:298.25,ellipseName:"Appl. Physics. 1965"},NWL9D:{a:6378145,rf:298.25,ellipseName:"Naval Weapons Lab., 1965"},mod_airy:{a:6377340.189,b:6356034.446,ellipseName:"Modified Airy"},
andrae:{a:6377104.43,rf:300,ellipseName:"Andrae 1876 (Den., Iclnd.)"},aust_SA:{a:6378160,rf:298.25,ellipseName:"Australian Natl & S. Amer. 1969"},GRS67:{a:6378160,rf:298.247167427,ellipseName:"GRS 67(IUGG 1967)"},bessel:{a:6377397.155,rf:299.1528128,ellipseName:"Bessel 1841"},bess_nam:{a:6377483.865,rf:299.1528128,ellipseName:"Bessel 1841 (Namibia)"},clrk66:{a:6378206.4,b:6356583.8,ellipseName:"Clarke 1866"},clrk80:{a:6378249.145,rf:293.4663,ellipseName:"Clarke 1880 mod."},CPM:{a:6375738.7,rf:334.29,
ellipseName:"Comm. des Poids et Mesures 1799"},delmbr:{a:6376428,rf:311.5,ellipseName:"Delambre 1810 (Belgium)"},engelis:{a:6378136.05,rf:298.2566,ellipseName:"Engelis 1985"},evrst30:{a:6377276.345,rf:300.8017,ellipseName:"Everest 1830"},evrst48:{a:6377304.063,rf:300.8017,ellipseName:"Everest 1948"},evrst56:{a:6377301.243,rf:300.8017,ellipseName:"Everest 1956"},evrst69:{a:6377295.664,rf:300.8017,ellipseName:"Everest 1969"},evrstSS:{a:6377298.556,rf:300.8017,ellipseName:"Everest (Sabah & Sarawak)"},
fschr60:{a:6378166,rf:298.3,ellipseName:"Fischer (Mercury Datum) 1960"},fschr60m:{a:6378155,rf:298.3,ellipseName:"Fischer 1960"},fschr68:{a:6378150,rf:298.3,ellipseName:"Fischer 1968"},helmert:{a:6378200,rf:298.3,ellipseName:"Helmert 1906"},hough:{a:6378270,rf:297,ellipseName:"Hough"},intl:{a:6378388,rf:297,ellipseName:"International 1909 (Hayford)"},kaula:{a:6378163,rf:298.24,ellipseName:"Kaula 1961"},lerch:{a:6378139,rf:298.257,ellipseName:"Lerch 1979"},mprts:{a:6397300,rf:191,ellipseName:"Maupertius 1738"},
new_intl:{a:6378157.5,b:6356772.2,ellipseName:"New International 1967"},plessis:{a:6376523,rf:6355863,ellipseName:"Plessis 1817 (France)"},krass:{a:6378245,rf:298.3,ellipseName:"Krassovsky, 1942"},SEasia:{a:6378155,b:6356773.3205,ellipseName:"Southeast Asia"},walbeck:{a:6376896,b:6355834.8467,ellipseName:"Walbeck"},WGS60:{a:6378165,rf:298.3,ellipseName:"WGS 60"},WGS66:{a:6378145,rf:298.25,ellipseName:"WGS 66"},WGS72:{a:6378135,rf:298.26,ellipseName:"WGS 72"},WGS84:{a:6378137,rf:298.257223563,ellipseName:"WGS 84"},
sphere:{a:6370997,b:6370997,ellipseName:"Normal Sphere (r=6370997)"}};
Proj4js.Datum={WGS84:{towgs84:"0,0,0",ellipse:"WGS84",datumName:"WGS84"},GGRS87:{towgs84:"-199.87,74.79,246.62",ellipse:"GRS80",datumName:"Greek_Geodetic_Reference_System_1987"},NAD83:{towgs84:"0,0,0",ellipse:"GRS80",datumName:"North_American_Datum_1983"},NAD27:{nadgrids:"@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat",ellipse:"clrk66",datumName:"North_American_Datum_1927"},potsdam:{towgs84:"606.0,23.0,413.0",ellipse:"bessel",datumName:"Potsdam Rauenberg 1950 DHDN"},carthage:{towgs84:"-263.0,6.0,431.0",
ellipse:"clark80",datumName:"Carthage 1934 Tunisia"},hermannskogel:{towgs84:"653.0,-212.0,449.0",ellipse:"bessel",datumName:"Hermannskogel"},ire65:{towgs84:"482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15",ellipse:"mod_airy",datumName:"Ireland 1965"},nzgd49:{towgs84:"59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993",ellipse:"intl",datumName:"New Zealand Geodetic Datum 1949"},OSGB36:{towgs84:"446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894",ellipse:"airy",datumName:"Airy 1830"}};
Proj4js.WGS84=new Proj4js.Proj("WGS84");Proj4js.Datum.OSB36=Proj4js.Datum.OSGB36;Proj4js.wktProjections={"Lambert Tangential Conformal Conic Projection":"lcc",Mercator:"merc","Popular Visualisation Pseudo Mercator":"merc",Mercator_1SP:"merc",Transverse_Mercator:"tmerc","Transverse Mercator":"tmerc","Lambert Azimuthal Equal Area":"laea","Universal Transverse Mercator System":"utm"};
Proj4js.Proj.aea={init:function(){Math.abs(this.lat1+this.lat2)<Proj4js.common.EPSLN?Proj4js.reportError("aeaInitEqualLatitudes"):(this.temp=this.b/this.a,this.es=1-Math.pow(this.temp,2),this.e3=Math.sqrt(this.es),this.sin_po=Math.sin(this.lat1),this.cos_po=Math.cos(this.lat1),this.con=this.t1=this.sin_po,this.ms1=Proj4js.common.msfnz(this.e3,this.sin_po,this.cos_po),this.qs1=Proj4js.common.qsfnz(this.e3,this.sin_po,this.cos_po),this.sin_po=Math.sin(this.lat2),this.cos_po=Math.cos(this.lat2),this.t2=
this.sin_po,this.ms2=Proj4js.common.msfnz(this.e3,this.sin_po,this.cos_po),this.qs2=Proj4js.common.qsfnz(this.e3,this.sin_po,this.cos_po),this.sin_po=Math.sin(this.lat0),this.cos_po=Math.cos(this.lat0),this.t3=this.sin_po,this.qs0=Proj4js.common.qsfnz(this.e3,this.sin_po,this.cos_po),this.ns0=Math.abs(this.lat1-this.lat2)>Proj4js.common.EPSLN?(this.ms1*this.ms1-this.ms2*this.ms2)/(this.qs2-this.qs1):this.con,this.c=this.ms1*this.ms1+this.ns0*this.qs1,this.rh=this.a*Math.sqrt(this.c-this.ns0*this.qs0)/
this.ns0)},forward:function(a){var c=a.x,b=a.y;this.sin_phi=Math.sin(b);this.cos_phi=Math.cos(b);var b=Proj4js.common.qsfnz(this.e3,this.sin_phi,this.cos_phi),b=this.a*Math.sqrt(this.c-this.ns0*b)/this.ns0,d=this.ns0*Proj4js.common.adjust_lon(c-this.long0),c=b*Math.sin(d)+this.x0,b=this.rh-b*Math.cos(d)+this.y0;a.x=c;a.y=b;return a},inverse:function(a){var c,b,d;a.x-=this.x0;a.y=this.rh-a.y+this.y0;0<=this.ns0?(c=Math.sqrt(a.x*a.x+a.y*a.y),b=1):(c=-Math.sqrt(a.x*a.x+a.y*a.y),b=-1);d=0;0!=c&&(d=Math.atan2(b*
a.x,b*a.y));b=c*this.ns0/this.a;c=(this.c-b*b)/this.ns0;1.0E-10<=this.e3?(b=1-0.5*(1-this.es)*Math.log((1-this.e3)/(1+this.e3))/this.e3,b=1.0E-10<Math.abs(Math.abs(b)-Math.abs(c))?this.phi1z(this.e3,c):0<=c?0.5*Proj4js.common.PI:-0.5*Proj4js.common.PI):b=this.phi1z(this.e3,c);d=Proj4js.common.adjust_lon(d/this.ns0+this.long0);a.x=d;a.y=b;return a},phi1z:function(a,c){var b,d,e,f,g=Proj4js.common.asinz(0.5*c);if(a<Proj4js.common.EPSLN)return g;for(var i=a*a,h=1;25>=h;h++)if(b=Math.sin(g),d=Math.cos(g),
e=a*b,f=1-e*e,b=0.5*f*f/d*(c/(1-i)-b/f+0.5/a*Math.log((1-e)/(1+e))),g+=b,1.0E-7>=Math.abs(b))return g;Proj4js.reportError("aea:phi1z:Convergence error");return null}};
Proj4js.Proj.sterea={dependsOn:"gauss",init:function(){Proj4js.Proj.gauss.init.apply(this);this.rc?(this.sinc0=Math.sin(this.phic0),this.cosc0=Math.cos(this.phic0),this.R2=2*this.rc,this.title||(this.title="Oblique Stereographic Alternative")):Proj4js.reportError("sterea:init:E_ERROR_0")},forward:function(a){var c,b,d,e;a.x=Proj4js.common.adjust_lon(a.x-this.long0);Proj4js.Proj.gauss.forward.apply(this,[a]);c=Math.sin(a.y);b=Math.cos(a.y);d=Math.cos(a.x);e=this.k0*this.R2/(1+this.sinc0*c+this.cosc0*
b*d);a.x=e*b*Math.sin(a.x);a.y=e*(this.cosc0*c-this.sinc0*b*d);a.x=this.a*a.x+this.x0;a.y=this.a*a.y+this.y0;return a},inverse:function(a){var c,b,d,e;a.x=(a.x-this.x0)/this.a;a.y=(a.y-this.y0)/this.a;a.x/=this.k0;a.y/=this.k0;(e=Math.sqrt(a.x*a.x+a.y*a.y))?(d=2*Math.atan2(e,this.R2),c=Math.sin(d),b=Math.cos(d),d=Math.asin(b*this.sinc0+a.y*c*this.cosc0/e),c=Math.atan2(a.x*c,e*this.cosc0*b-a.y*this.sinc0*c)):(d=this.phic0,c=0);a.x=c;a.y=d;Proj4js.Proj.gauss.inverse.apply(this,[a]);a.x=Proj4js.common.adjust_lon(a.x+
this.long0);return a}};function phi4z(a,c,b,d,e,f,g,i,h){var j,k,l,m,n,o,h=f;for(o=1;15>=o;o++)if(j=Math.sin(h),l=Math.tan(h),i=l*Math.sqrt(1-a*j*j),k=Math.sin(2*h),m=c*h-b*k+d*Math.sin(4*h)-e*Math.sin(6*h),n=c-2*b*Math.cos(2*h)+4*d*Math.cos(4*h)-6*e*Math.cos(6*h),j=2*m+i*(m*m+g)-2*f*(i*m+1),l=a*k*(m*m+g-2*f*m)/(2*i),i=2*(f-m)*(i*n-2/k)-2*n,j/=l+i,h+=j,1.0E-10>=Math.abs(j))return h;Proj4js.reportError("phi4z: No convergence");return null}
function e4fn(a){var c;c=1+a;a=1-a;return Math.sqrt(Math.pow(c,c)*Math.pow(a,a))}
Proj4js.Proj.poly={init:function(){0==this.lat0&&(this.lat0=90);this.temp=this.b/this.a;this.es=1-Math.pow(this.temp,2);this.e=Math.sqrt(this.es);this.e0=Proj4js.common.e0fn(this.es);this.e1=Proj4js.common.e1fn(this.es);this.e2=Proj4js.common.e2fn(this.es);this.e3=Proj4js.common.e3fn(this.es);this.ml0=Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0)},forward:function(a){var c,b,d,e,f;d=a.y;b=Proj4js.common.adjust_lon(a.x-this.long0);1.0E-7>=Math.abs(d)?(f=this.x0+this.a*b,c=this.y0-
this.a*this.ml0):(c=Math.sin(d),b=Math.cos(d),d=Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,d),e=Proj4js.common.msfnz(this.e,c,b),b=c,f=this.x0+this.a*e*Math.sin(b)/c,c=this.y0+this.a*(d-this.ml0+e*(1-Math.cos(b))/c));a.x=f;a.y=c;return a},inverse:function(a){var c,b;a.x-=this.x0;a.y-=this.y0;c=this.ml0+a.y/this.a;if(1.0E-7>=Math.abs(c))c=a.x/this.a+this.long0,b=0;else{c=c*c+a.x/this.a*(a.x/this.a);c=phi4z(this.es,this.e0,this.e1,this.e2,this.e3,this.al,c,void 0,b);if(1!=c)return c;c=Proj4js.common.adjust_lon(Proj4js.common.asinz(NaN*
a.x/this.a)/Math.sin(b)+this.long0)}a.x=c;a.y=b;return a}};
Proj4js.Proj.equi={init:function(){this.x0||(this.x0=0);this.y0||(this.y0=0);this.lat0||(this.lat0=0);this.long0||(this.long0=0)},forward:function(a){var c=a.y,b=this.x0+this.a*Proj4js.common.adjust_lon(a.x-this.long0)*Math.cos(this.lat0),c=this.y0+this.a*c;this.t1=b;this.t2=Math.cos(this.lat0);a.x=b;a.y=c;return a},inverse:function(a){a.x-=this.x0;a.y-=this.y0;var c=a.y/this.a;Math.abs(c)>Proj4js.common.HALF_PI&&Proj4js.reportError("equi:Inv:DataError");var b=Proj4js.common.adjust_lon(this.long0+
a.x/(this.a*Math.cos(this.lat0)));a.x=b;a.y=c}};
Proj4js.Proj.merc={init:function(){this.lat_ts&&(this.k0=this.sphere?Math.cos(this.lat_ts):Proj4js.common.msfnz(this.es,Math.sin(this.lat_ts),Math.cos(this.lat_ts)))},forward:function(a){var c=a.x,b=a.y;if(90<b*Proj4js.common.R2D&&-90>b*Proj4js.common.R2D&&180<c*Proj4js.common.R2D&&-180>c*Proj4js.common.R2D)return Proj4js.reportError("merc:forward: llInputOutOfRange: "+c+" : "+b),null;if(Math.abs(Math.abs(b)-Proj4js.common.HALF_PI)<=Proj4js.common.EPSLN)return Proj4js.reportError("merc:forward: ll2mAtPoles"),null;
if(this.sphere)c=this.x0+this.a*this.k0*Proj4js.common.adjust_lon(c-this.long0),b=this.y0+this.a*this.k0*Math.log(Math.tan(Proj4js.common.FORTPI+0.5*b));else var d=Math.sin(b),b=Proj4js.common.tsfnz(this.e,b,d),c=this.x0+this.a*this.k0*Proj4js.common.adjust_lon(c-this.long0),b=this.y0-this.a*this.k0*Math.log(b);a.x=c;a.y=b;return a},inverse:function(a){var c=a.x-this.x0,b=a.y-this.y0;if(this.sphere)b=Proj4js.common.HALF_PI-2*Math.atan(Math.exp(-b/this.a*this.k0));else if(b=Math.exp(-b/(this.a*this.k0)),
b=Proj4js.common.phi2z(this.e,b),-9999==b)return Proj4js.reportError("merc:inverse: lat = -9999"),null;c=Proj4js.common.adjust_lon(this.long0+c/(this.a*this.k0));a.x=c;a.y=b;return a}};Proj4js.Proj.utm={dependsOn:"tmerc",init:function(){this.zone?(this.lat0=0,this.long0=(6*Math.abs(this.zone)-183)*Proj4js.common.D2R,this.x0=5E5,this.y0=this.utmSouth?1E7:0,this.k0=0.9996,Proj4js.Proj.tmerc.init.apply(this),this.forward=Proj4js.Proj.tmerc.forward,this.inverse=Proj4js.Proj.tmerc.inverse):Proj4js.reportError("utm:init: zone must be specified for UTM")}};
Proj4js.Proj.eqdc={init:function(){this.mode||(this.mode=0);this.temp=this.b/this.a;this.es=1-Math.pow(this.temp,2);this.e=Math.sqrt(this.es);this.e0=Proj4js.common.e0fn(this.es);this.e1=Proj4js.common.e1fn(this.es);this.e2=Proj4js.common.e2fn(this.es);this.e3=Proj4js.common.e3fn(this.es);this.sinphi=Math.sin(this.lat1);this.cosphi=Math.cos(this.lat1);this.ms1=Proj4js.common.msfnz(this.e,this.sinphi,this.cosphi);this.ml1=Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat1);0!=this.mode?
(Math.abs(this.lat1+this.lat2)<Proj4js.common.EPSLN&&Proj4js.reportError("eqdc:Init:EqualLatitudes"),this.sinphi=Math.sin(this.lat2),this.cosphi=Math.cos(this.lat2),this.ms2=Proj4js.common.msfnz(this.e,this.sinphi,this.cosphi),this.ml2=Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat2),this.ns=Math.abs(this.lat1-this.lat2)>=Proj4js.common.EPSLN?(this.ms1-this.ms2)/(this.ml2-this.ml1):this.sinphi):this.ns=this.sinphi;this.g=this.ml1+this.ms1/this.ns;this.ml0=Proj4js.common.mlfn(this.e0,
this.e1,this.e2,this.e3,this.lat0);this.rh=this.a*(this.g-this.ml0)},forward:function(a){var c=a.x,b=this.a*(this.g-Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,a.y)),d=this.ns*Proj4js.common.adjust_lon(c-this.long0),c=this.x0+b*Math.sin(d),b=this.y0+this.rh-b*Math.cos(d);a.x=c;a.y=b;return a},inverse:function(a){a.x-=this.x0;a.y=this.rh-a.y+this.y0;var c,b;0<=this.ns?(b=Math.sqrt(a.x*a.x+a.y*a.y),c=1):(b=-Math.sqrt(a.x*a.x+a.y*a.y),c=-1);var d=0;0!=b&&(d=Math.atan2(c*a.x,c*a.y));c=this.phi3z(this.g-
b/this.a,this.e0,this.e1,this.e2,this.e3);d=Proj4js.common.adjust_lon(this.long0+d/this.ns);a.x=d;a.y=c;return a},phi3z:function(a,c,b,d,e){var f,g;f=a;for(var i=0;15>i;i++)if(g=(a+b*Math.sin(2*f)-d*Math.sin(4*f)+e*Math.sin(6*f))/c-f,f+=g,1.0E-10>=Math.abs(g))return f;Proj4js.reportError("PHI3Z-CONV:Latitude failed to converge after 15 iterations");return null}};
Proj4js.Proj.tmerc={init:function(){this.e0=Proj4js.common.e0fn(this.es);this.e1=Proj4js.common.e1fn(this.es);this.e2=Proj4js.common.e2fn(this.es);this.e3=Proj4js.common.e3fn(this.es);this.ml0=this.a*Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0)},forward:function(a){var c=a.y,b=Proj4js.common.adjust_lon(a.x-this.long0),d,e;d=Math.sin(c);var f=Math.cos(c);if(this.sphere){var g=f*Math.sin(b);if(1.0E-10>Math.abs(Math.abs(g)-1))return Proj4js.reportError("tmerc:forward: Point projects into infinity"),
93;e=0.5*this.a*this.k0*Math.log((1+g)/(1-g));d=Math.acos(f*Math.cos(b)/Math.sqrt(1-g*g));0>c&&(d=-d);c=this.a*this.k0*(d-this.lat0)}else{e=f*b;var b=Math.pow(e,2),f=this.ep2*Math.pow(f,2),g=Math.tan(c),i=Math.pow(g,2);d=1-this.es*Math.pow(d,2);d=this.a/Math.sqrt(d);c=this.a*Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,c);e=this.k0*d*e*(1+b/6*(1-i+f+b/20*(5-18*i+Math.pow(i,2)+72*f-58*this.ep2)))+this.x0;c=this.k0*(c-this.ml0+d*g*b*(0.5+b/24*(5-i+9*f+4*Math.pow(f,2)+b/30*(61-58*i+Math.pow(i,
2)+600*f-330*this.ep2))))+this.y0}a.x=e;a.y=c;return a},inverse:function(a){var c,b,d,e;if(this.sphere){b=Math.exp(a.x/(this.a*this.k0));var f=0.5*(b-1/b);d=this.lat0+a.y/(this.a*this.k0);e=Math.cos(d);c=Math.sqrt((1-e*e)/(1+f*f));b=Proj4js.common.asinz(c);0>d&&(b=-b);c=0==f&&0==e?this.long0:Proj4js.common.adjust_lon(Math.atan2(f,e)+this.long0)}else{var f=a.x-this.x0,g=a.y-this.y0;b=c=(this.ml0+g/this.k0)/this.a;for(e=0;;e++){d=(c+this.e1*Math.sin(2*b)-this.e2*Math.sin(4*b)+this.e3*Math.sin(6*b))/
this.e0-b;b+=d;if(Math.abs(d)<=Proj4js.common.EPSLN)break;if(6<=e)return Proj4js.reportError("tmerc:inverse: Latitude failed to converge"),95}if(Math.abs(b)<Proj4js.common.HALF_PI){c=Math.sin(b);d=Math.cos(b);var i=Math.tan(b);e=this.ep2*Math.pow(d,2);var g=Math.pow(e,2),h=Math.pow(i,2),j=Math.pow(h,2);c=1-this.es*Math.pow(c,2);var k=this.a/Math.sqrt(c);c=k*(1-this.es)/c;var f=f/(k*this.k0),l=Math.pow(f,2);b-=k*i*l/c*(0.5-l/24*(5+3*h+10*e-4*g-9*this.ep2-l/30*(61+90*h+298*e+45*j-252*this.ep2-3*g)));
c=Proj4js.common.adjust_lon(this.long0+f*(1-l/6*(1+2*h+e-l/20*(5-2*e+28*h-3*g+8*this.ep2+24*j)))/d)}else b=Proj4js.common.HALF_PI*Proj4js.common.sign(g),c=this.long0}a.x=c;a.y=b;return a}};Proj4js.defs.GOOGLE="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";Proj4js.defs["EPSG:900913"]=Proj4js.defs.GOOGLE;
Proj4js.Proj.gstmerc={init:function(){var a=this.b/this.a;this.e=Math.sqrt(1-a*a);this.lc=this.long0;this.rs=Math.sqrt(1+this.e*this.e*Math.pow(Math.cos(this.lat0),4)/(1-this.e*this.e));var a=Math.sin(this.lat0),c=Math.asin(a/this.rs),b=Math.sin(c);this.cp=Proj4js.common.latiso(0,c,b)-this.rs*Proj4js.common.latiso(this.e,this.lat0,a);this.n2=this.k0*this.a*Math.sqrt(1-this.e*this.e)/(1-this.e*this.e*a*a);this.xs=this.x0;this.ys=this.y0-this.n2*c;this.title||(this.title="Gauss Schreiber transverse mercator")},
forward:function(a){var c=a.y,b=this.rs*(a.x-this.lc),c=this.cp+this.rs*Proj4js.common.latiso(this.e,c,Math.sin(c)),d=Math.asin(Math.sin(b)/Proj4js.common.cosh(c)),d=Proj4js.common.latiso(0,d,Math.sin(d));a.x=this.xs+this.n2*d;a.y=this.ys+this.n2*Math.atan(Proj4js.common.sinh(c)/Math.cos(b));return a},inverse:function(a){var c=a.x,b=a.y,d=Math.atan(Proj4js.common.sinh((c-this.xs)/this.n2)/Math.cos((b-this.ys)/this.n2)),c=Math.asin(Math.sin((b-this.ys)/this.n2)/Proj4js.common.cosh((c-this.xs)/this.n2)),
c=Proj4js.common.latiso(0,c,Math.sin(c));a.x=this.lc+d/this.rs;a.y=Proj4js.common.invlatiso(this.e,(c-this.cp)/this.rs);return a}};
Proj4js.Proj.ortho={init:function(){this.sin_p14=Math.sin(this.lat0);this.cos_p14=Math.cos(this.lat0)},forward:function(a){var c,b,d,e,f;b=a.y;d=Proj4js.common.adjust_lon(a.x-this.long0);c=Math.sin(b);b=Math.cos(b);e=Math.cos(d);f=this.sin_p14*c+this.cos_p14*b*e;if(0<f||Math.abs(f)<=Proj4js.common.EPSLN)var g=1*this.a*b*Math.sin(d),i=this.y0+1*this.a*(this.cos_p14*c-this.sin_p14*b*e);else Proj4js.reportError("orthoFwdPointError");a.x=g;a.y=i;return a},inverse:function(a){var c,b,d,e;a.x-=this.x0;
a.y-=this.y0;c=Math.sqrt(a.x*a.x+a.y*a.y);c>this.a+1.0E-7&&Proj4js.reportError("orthoInvDataError");b=Proj4js.common.asinz(c/this.a);d=Math.sin(b);e=Math.cos(b);b=this.long0;Math.abs(c);d=Proj4js.common.asinz(e*this.sin_p14+a.y*d*this.cos_p14/c);c=Math.abs(this.lat0)-Proj4js.common.HALF_PI;Math.abs(c)<=Proj4js.common.EPSLN&&(b=0<=this.lat0?Proj4js.common.adjust_lon(this.long0+Math.atan2(a.x,-a.y)):Proj4js.common.adjust_lon(this.long0-Math.atan2(-a.x,a.y)));Math.sin(d);a.x=b;a.y=d;return a}};
Proj4js.Proj.krovak={init:function(){this.a=6377397.155;this.es=0.006674372230614;this.e=Math.sqrt(this.es);this.lat0||(this.lat0=0.863937979737193);this.long0||(this.long0=0.4334234309119251);this.k0||(this.k0=0.9999);this.s45=0.785398163397448;this.s90=2*this.s45;this.fi0=this.lat0;this.e2=this.es;this.e=Math.sqrt(this.e2);this.alfa=Math.sqrt(1+this.e2*Math.pow(Math.cos(this.fi0),4)/(1-this.e2));this.uq=1.04216856380474;this.u0=Math.asin(Math.sin(this.fi0)/this.alfa);this.g=Math.pow((1+this.e*Math.sin(this.fi0))/
(1-this.e*Math.sin(this.fi0)),this.alfa*this.e/2);this.k=Math.tan(this.u0/2+this.s45)/Math.pow(Math.tan(this.fi0/2+this.s45),this.alfa)*this.g;this.k1=this.k0;this.n0=this.a*Math.sqrt(1-this.e2)/(1-this.e2*Math.pow(Math.sin(this.fi0),2));this.s0=1.37008346281555;this.n=Math.sin(this.s0);this.ro0=this.k1*this.n0/Math.tan(this.s0);this.ad=this.s90-this.uq},forward:function(a){var c,b,d;b=a.y;d=Proj4js.common.adjust_lon(a.x-this.long0);c=Math.pow((1+this.e*Math.sin(b))/(1-this.e*Math.sin(b)),this.alfa*
this.e/2);c=2*(Math.atan(this.k*Math.pow(Math.tan(b/2+this.s45),this.alfa)/c)-this.s45);b=-d*this.alfa;d=Math.asin(Math.cos(this.ad)*Math.sin(c)+Math.sin(this.ad)*Math.cos(c)*Math.cos(b));c=this.n*Math.asin(Math.cos(c)*Math.sin(b)/Math.cos(d));d=this.ro0*Math.pow(Math.tan(this.s0/2+this.s45),this.n)/Math.pow(Math.tan(d/2+this.s45),this.n);a.y=d*Math.cos(c)/1;a.x=d*Math.sin(c)/1;this.czech&&(a.y*=-1,a.x*=-1);return a},inverse:function(a){var c,b,d;c=a.x;a.x=a.y;a.y=c;this.czech&&(a.y*=-1,a.x*=-1);
c=Math.sqrt(a.x*a.x+a.y*a.y);b=Math.atan2(a.y,a.x)/Math.sin(this.s0);d=2*(Math.atan(Math.pow(this.ro0/c,1/this.n)*Math.tan(this.s0/2+this.s45))-this.s45);c=Math.asin(Math.cos(this.ad)*Math.sin(d)-Math.sin(this.ad)*Math.cos(d)*Math.cos(b));b=Math.asin(Math.cos(d)*Math.sin(b)/Math.cos(c));a.x=this.long0-b/this.alfa;b=c;var e=d=0;do a.y=2*(Math.atan(Math.pow(this.k,-1/this.alfa)*Math.pow(Math.tan(c/2+this.s45),1/this.alfa)*Math.pow((1+this.e*Math.sin(b))/(1-this.e*Math.sin(b)),this.e/2))-this.s45),1.0E-10>
Math.abs(b-a.y)&&(d=1),b=a.y,e+=1;while(0==d&&15>e);return 15<=e?(Proj4js.reportError("PHI3Z-CONV:Latitude failed to converge after 15 iterations"),null):a}};
Proj4js.Proj.somerc={init:function(){var a=this.lat0;this.lambda0=this.long0;var c=Math.sin(a),b=this.a,d=1/this.rf,d=2*d-Math.pow(d,2),e=this.e=Math.sqrt(d);this.R=this.k0*b*Math.sqrt(1-d)/(1-d*Math.pow(c,2));this.alpha=Math.sqrt(1+d/(1-d)*Math.pow(Math.cos(a),4));this.b0=Math.asin(c/this.alpha);this.K=Math.log(Math.tan(Math.PI/4+this.b0/2))-this.alpha*Math.log(Math.tan(Math.PI/4+a/2))+this.alpha*e/2*Math.log((1+e*c)/(1-e*c))},forward:function(a){var c=Math.log(Math.tan(Math.PI/4-a.y/2)),b=this.e/
2*Math.log((1+this.e*Math.sin(a.y))/(1-this.e*Math.sin(a.y))),b=2*(Math.atan(Math.exp(-this.alpha*(c+b)+this.K))-Math.PI/4),d=this.alpha*(a.x-this.lambda0),c=Math.atan(Math.sin(d)/(Math.sin(this.b0)*Math.tan(b)+Math.cos(this.b0)*Math.cos(d))),b=Math.asin(Math.cos(this.b0)*Math.sin(b)-Math.sin(this.b0)*Math.cos(b)*Math.cos(d));a.y=this.R/2*Math.log((1+Math.sin(b))/(1-Math.sin(b)))+this.y0;a.x=this.R*c+this.x0;return a},inverse:function(a){for(var c=(a.x-this.x0)/this.R,b=2*(Math.atan(Math.exp((a.y-
this.y0)/this.R))-Math.PI/4),d=Math.asin(Math.cos(this.b0)*Math.sin(b)+Math.sin(this.b0)*Math.cos(b)*Math.cos(c)),c=this.lambda0+Math.atan(Math.sin(c)/(Math.cos(this.b0)*Math.cos(c)-Math.sin(this.b0)*Math.tan(b)))/this.alpha,b=0,e=d,f=-1E3,g=0;1.0E-7<Math.abs(e-f);){if(20<++g){Proj4js.reportError("omercFwdInfinity");return}b=1/this.alpha*(Math.log(Math.tan(Math.PI/4+d/2))-this.K)+this.e*Math.log(Math.tan(Math.PI/4+Math.asin(this.e*Math.sin(e))/2));f=e;e=2*Math.atan(Math.exp(b))-Math.PI/2}a.x=c;a.y=
e;return a}};
Proj4js.Proj.stere={ssfn_:function(a,c,b){c*=b;return Math.tan(0.5*(Proj4js.common.HALF_PI+a))*Math.pow((1-c)/(1+c),0.5*b)},TOL:1.0E-8,NITER:8,CONV:1.0E-10,S_POLE:0,N_POLE:1,OBLIQ:2,EQUIT:3,init:function(){this.phits=this.lat_ts?this.lat_ts:Proj4js.common.HALF_PI;var a=Math.abs(this.lat0);this.mode=Math.abs(a)-Proj4js.common.HALF_PI<Proj4js.common.EPSLN?0>this.lat0?this.S_POLE:this.N_POLE:a>Proj4js.common.EPSLN?this.OBLIQ:this.EQUIT;this.phits=Math.abs(this.phits);if(this.es){var c;switch(this.mode){case this.N_POLE:case this.S_POLE:Math.abs(this.phits-Proj4js.common.HALF_PI)<
Proj4js.common.EPSLN?this.akm1=2*this.k0/Math.sqrt(Math.pow(1+this.e,1+this.e)*Math.pow(1-this.e,1-this.e)):(a=Math.sin(this.phits),this.akm1=Math.cos(this.phits)/Proj4js.common.tsfnz(this.e,this.phits,a),a*=this.e,this.akm1/=Math.sqrt(1-a*a));break;case this.EQUIT:this.akm1=2*this.k0;break;case this.OBLIQ:a=Math.sin(this.lat0),c=2*Math.atan(this.ssfn_(this.lat0,a,this.e))-Proj4js.common.HALF_PI,a*=this.e,this.akm1=2*this.k0*Math.cos(this.lat0)/Math.sqrt(1-a*a),this.sinX1=Math.sin(c),this.cosX1=Math.cos(c)}}else switch(this.mode){case this.OBLIQ:this.sinph0=
Math.sin(this.lat0),this.cosph0=Math.cos(this.lat0);case this.EQUIT:this.akm1=2*this.k0;break;case this.S_POLE:case this.N_POLE:this.akm1=Math.abs(this.phits-Proj4js.common.HALF_PI)>=Proj4js.common.EPSLN?Math.cos(this.phits)/Math.tan(Proj4js.common.FORTPI-0.5*this.phits):2*this.k0}},forward:function(a){var c=a.x,c=Proj4js.common.adjust_lon(c-this.long0),b=a.y,d,e;if(this.sphere){var f,g,i;f=Math.sin(b);g=Math.cos(b);i=Math.cos(c);c=Math.sin(c);switch(this.mode){case this.EQUIT:e=1+g*i;e<=Proj4js.common.EPSLN&&
Proj4js.reportError("stere:forward:Equit");e=this.akm1/e;d=e*g*c;e*=f;break;case this.OBLIQ:e=1+this.sinph0*f+this.cosph0*g*i;e<=Proj4js.common.EPSLN&&Proj4js.reportError("stere:forward:Obliq");e=this.akm1/e;d=e*g*c;e*=this.cosph0*f-this.sinph0*g*i;break;case this.N_POLE:i=-i,b=-b;case this.S_POLE:Math.abs(b-Proj4js.common.HALF_PI)<this.TOL&&Proj4js.reportError("stere:forward:S_POLE"),e=this.akm1*Math.tan(Proj4js.common.FORTPI+0.5*b),d=c*e,e*=i}}else{i=Math.cos(c);c=Math.sin(c);f=Math.sin(b);var h;
if(this.mode==this.OBLIQ||this.mode==this.EQUIT)h=2*Math.atan(this.ssfn_(b,f,this.e)),g=Math.sin(h-Proj4js.common.HALF_PI),h=Math.cos(h);switch(this.mode){case this.OBLIQ:b=this.akm1/(this.cosX1*(1+this.sinX1*g+this.cosX1*h*i));e=b*(this.cosX1*g-this.sinX1*h*i);d=b*h;break;case this.EQUIT:b=2*this.akm1/(1+h*i);e=b*g;d=b*h;break;case this.S_POLE:b=-b,i=-i,f=-f;case this.N_POLE:d=this.akm1*Proj4js.common.tsfnz(this.e,b,f),e=-d*i}d*=c}a.x=d*this.a+this.x0;a.y=e*this.a+this.y0;return a},inverse:function(a){var c=
(a.x-this.x0)/this.a,b=(a.y-this.y0)/this.a,d,e,f,g=d=0,i,h=f=0;if(this.sphere){g=Math.sqrt(c*c+b*b);h=2*Math.atan(g/this.akm1);f=Math.sin(h);h=Math.cos(h);d=0;switch(this.mode){case this.EQUIT:e=Math.abs(g)<=Proj4js.common.EPSLN?0:Math.asin(b*f/g);if(0!=h||0!=c)d=Math.atan2(c*f,h*g);break;case this.OBLIQ:e=Math.abs(g)<=Proj4js.common.EPSLN?this.phi0:Math.asin(h*this.sinph0+b*f*this.cosph0/g);h-=this.sinph0*Math.sin(e);if(0!=h||0!=c)d=Math.atan2(c*f*this.cosph0,h*g);break;case this.N_POLE:b=-b;case this.S_POLE:e=
Math.abs(g)<=Proj4js.common.EPSLN?this.phi0:Math.asin(this.mode==this.S_POLE?-h:h),d=0==c&&0==b?0:Math.atan2(c,b)}a.x=Proj4js.common.adjust_lon(d+this.long0);a.y=e}else{i=Math.sqrt(c*c+b*b);switch(this.mode){case this.OBLIQ:case this.EQUIT:d=2*Math.atan2(i*this.cosX1,this.akm1);f=Math.cos(d);e=Math.sin(d);g=0==i?Math.asin(f*this.sinX1):Math.asin(f*this.sinX1+b*e*this.cosX1/i);d=Math.tan(0.5*(Proj4js.common.HALF_PI+g));c*=e;b=i*this.cosX1*f-b*this.sinX1*e;h=Proj4js.common.HALF_PI;f=0.5*this.e;break;
case this.N_POLE:b=-b;case this.S_POLE:d=-i/this.akm1,g=Proj4js.common.HALF_PI-2*Math.atan(d),h=-Proj4js.common.HALF_PI,f=-0.5*this.e}for(i=this.NITER;i--;g=e)if(e=this.e*Math.sin(g),e=2*Math.atan(d*Math.pow((1+e)/(1-e),f))-h,Math.abs(g-e)<this.CONV)return this.mode==this.S_POLE&&(e=-e),d=0==c&&0==b?0:Math.atan2(c,b),a.x=Proj4js.common.adjust_lon(d+this.long0),a.y=e,a}}};
Proj4js.Proj.nzmg={iterations:1,init:function(){this.A=[];this.A[1]=0.6399175073;this.A[2]=-0.1358797613;this.A[3]=0.063294409;this.A[4]=-0.02526853;this.A[5]=0.0117879;this.A[6]=-0.0055161;this.A[7]=0.0026906;this.A[8]=-0.001333;this.A[9]=6.7E-4;this.A[10]=-3.4E-4;this.B_re=[];this.B_im=[];this.B_re[1]=0.7557853228;this.B_im[1]=0;this.B_re[2]=0.249204646;this.B_im[2]=0.003371507;this.B_re[3]=-0.001541739;this.B_im[3]=0.04105856;this.B_re[4]=-0.10162907;this.B_im[4]=0.01727609;this.B_re[5]=-0.26623489;
this.B_im[5]=-0.36249218;this.B_re[6]=-0.6870983;this.B_im[6]=-1.1651967;this.C_re=[];this.C_im=[];this.C_re[1]=1.3231270439;this.C_im[1]=0;this.C_re[2]=-0.577245789;this.C_im[2]=-0.007809598;this.C_re[3]=0.508307513;this.C_im[3]=-0.112208952;this.C_re[4]=-0.15094762;this.C_im[4]=0.18200602;this.C_re[5]=1.01418179;this.C_im[5]=1.64497696;this.C_re[6]=1.9660549;this.C_im[6]=2.5127645;this.D=[];this.D[1]=1.5627014243;this.D[2]=0.5185406398;this.D[3]=-0.03333098;this.D[4]=-0.1052906;this.D[5]=-0.0368594;
this.D[6]=0.007317;this.D[7]=0.0122;this.D[8]=0.00394;this.D[9]=-0.0013},forward:function(a){for(var c=1.0E-5*((a.y-this.lat0)/Proj4js.common.SEC_TO_RAD),b=a.x-this.long0,d=1,e=0,f=1;10>=f;f++)d*=c,e+=this.A[f]*d;for(var c=e,d=1,g=0,i=0,h=0,f=1;6>=f;f++)e=d*c-g*b,g=g*c+d*b,d=e,i=i+this.B_re[f]*d-this.B_im[f]*g,h=h+this.B_im[f]*d+this.B_re[f]*g;a.x=h*this.a+this.x0;a.y=i*this.a+this.y0;return a},inverse:function(a){for(var c=(a.y-this.y0)/this.a,b=(a.x-this.x0)/this.a,d=1,e=0,f,g=0,i=0,h=1;6>=h;h++)f=
d*c-e*b,e=e*c+d*b,d=f,g=g+this.C_re[h]*d-this.C_im[h]*e,i=i+this.C_im[h]*d+this.C_re[h]*e;for(d=0;d<this.iterations;d++){var j=g,k=i,l;f=c;e=b;for(h=2;6>=h;h++)l=j*g-k*i,k=k*g+j*i,j=l,f+=(h-1)*(this.B_re[h]*j-this.B_im[h]*k),e+=(h-1)*(this.B_im[h]*j+this.B_re[h]*k);for(var j=1,k=0,m=this.B_re[1],n=this.B_im[1],h=2;6>=h;h++)l=j*g-k*i,k=k*g+j*i,j=l,m+=h*(this.B_re[h]*j-this.B_im[h]*k),n+=h*(this.B_im[h]*j+this.B_re[h]*k);i=m*m+n*n;g=(f*m+e*n)/i;i=(e*m-f*n)/i}c=g;b=1;g=0;for(h=1;9>=h;h++)b*=c,g+=this.D[h]*
b;h=this.lat0+1E5*g*Proj4js.common.SEC_TO_RAD;a.x=this.long0+i;a.y=h;return a}};Proj4js.Proj.mill={init:function(){},forward:function(a){var c=a.y,b=this.x0+this.a*Proj4js.common.adjust_lon(a.x-this.long0),c=this.y0+1.25*this.a*Math.log(Math.tan(Proj4js.common.PI/4+c/2.5));a.x=b;a.y=c;return a},inverse:function(a){a.x-=this.x0;a.y-=this.y0;var c=Proj4js.common.adjust_lon(this.long0+a.x/this.a),b=2.5*(Math.atan(Math.exp(0.8*a.y/this.a))-Proj4js.common.PI/4);a.x=c;a.y=b;return a}};
Proj4js.Proj.gnom={init:function(){this.sin_p14=Math.sin(this.lat0);this.cos_p14=Math.cos(this.lat0);this.infinity_dist=1E3*this.a;this.rc=1},forward:function(a){var c,b,d,e,f;b=a.y;d=Proj4js.common.adjust_lon(a.x-this.long0);c=Math.sin(b);b=Math.cos(b);e=Math.cos(d);f=this.sin_p14*c+this.cos_p14*b*e;0<f||Math.abs(f)<=Proj4js.common.EPSLN?(d=this.x0+1*this.a*b*Math.sin(d)/f,c=this.y0+1*this.a*(this.cos_p14*c-this.sin_p14*b*e)/f):(Proj4js.reportError("orthoFwdPointError"),d=this.x0+this.infinity_dist*
b*Math.sin(d),c=this.y0+this.infinity_dist*(this.cos_p14*c-this.sin_p14*b*e));a.x=d;a.y=c;return a},inverse:function(a){var c,b,d,e;a.x=(a.x-this.x0)/this.a;a.y=(a.y-this.y0)/this.a;a.x/=this.k0;a.y/=this.k0;(c=Math.sqrt(a.x*a.x+a.y*a.y))?(e=Math.atan2(c,this.rc),b=Math.sin(e),d=Math.cos(e),e=Proj4js.common.asinz(d*this.sin_p14+a.y*b*this.cos_p14/c),c=Math.atan2(a.x*b,c*this.cos_p14*d-a.y*this.sin_p14*b),c=Proj4js.common.adjust_lon(this.long0+c)):(e=this.phic0,c=0);a.x=c;a.y=e;return a}};
Proj4js.Proj.sinu={init:function(){this.sphere?(this.n=1,this.es=this.m=0,this.C_y=Math.sqrt((this.m+1)/this.n),this.C_x=this.C_y/(this.m+1)):this.en=Proj4js.common.pj_enfn(this.es)},forward:function(a){var c,b;c=a.x;b=a.y;c=Proj4js.common.adjust_lon(c-this.long0);if(this.sphere){if(this.m)for(var d=this.n*Math.sin(b),e=Proj4js.common.MAX_ITER;e;--e){var f=(this.m*b+Math.sin(b)-d)/(this.m+Math.cos(b));b-=f;if(Math.abs(f)<Proj4js.common.EPSLN)break}else b=1!=this.n?Math.asin(this.n*Math.sin(b)):b;
c=this.a*this.C_x*c*(this.m+Math.cos(b));b*=this.a*this.C_y}else d=Math.sin(b),e=Math.cos(b),b=this.a*Proj4js.common.pj_mlfn(b,d,e,this.en),c=this.a*c*e/Math.sqrt(1-this.es*d*d);a.x=c;a.y=b;return a},inverse:function(a){var c,b;a.x-=this.x0;a.y-=this.y0;if(this.sphere)a.y/=this.C_y,c=this.m?Math.asin((this.m*a.y+Math.sin(a.y))/this.n):1!=this.n?Math.asin(Math.sin(a.y)/this.n):a.y,b=a.x/(this.C_x*(this.m+Math.cos(a.y)));else{c=Proj4js.common.pj_inv_mlfn(a.y/this.a,this.es,this.en);var d=Math.abs(c);
d<Proj4js.common.HALF_PI?(d=Math.sin(c),b=this.long0+a.x*Math.sqrt(1-this.es*d*d)/(this.a*Math.cos(c)),b=Proj4js.common.adjust_lon(b)):d-Proj4js.common.EPSLN<Proj4js.common.HALF_PI&&(b=this.long0)}a.x=b;a.y=c;return a}};
Proj4js.Proj.vandg={init:function(){this.R=6370997},forward:function(a){var c=a.y,b=Proj4js.common.adjust_lon(a.x-this.long0);Math.abs(c);var d=Proj4js.common.asinz(2*Math.abs(c/Proj4js.common.PI));(Math.abs(b)<=Proj4js.common.EPSLN||Math.abs(Math.abs(c)-Proj4js.common.HALF_PI)<=Proj4js.common.EPSLN)&&Math.tan(0.5*d);var e=0.5*Math.abs(Proj4js.common.PI/b-b/Proj4js.common.PI),f=e*e,g=Math.sin(d),d=Math.cos(d),d=d/(g+d-1),g=d*(2/g-1),g=g*g,f=Proj4js.common.PI*this.R*(e*(d-g)+Math.sqrt(f*(d-g)*(d-g)-
(g+f)*(d*d-g)))/(g+f);0>b&&(f=-f);b=this.x0+f;f=Math.abs(f/(Proj4js.common.PI*this.R));c=0<=c?this.y0+Proj4js.common.PI*this.R*Math.sqrt(1-f*f-2*e*f):this.y0-Proj4js.common.PI*this.R*Math.sqrt(1-f*f-2*e*f);a.x=b;a.y=c;return a},inverse:function(a){var c,b,d,e,f,g,i,h;a.x-=this.x0;a.y-=this.y0;h=Proj4js.common.PI*this.R;c=a.x/h;d=a.y/h;e=c*c+d*d;f=-Math.abs(d)*(1+e);b=f-2*d*d+c*c;g=-2*f+1+2*d*d+e*e;h=d*d/g+(2*b*b*b/g/g/g-9*f*b/g/g)/27;i=(f-b*b/3/g)/g;f=2*Math.sqrt(-i/3);h=3*h/i/f;1<Math.abs(h)&&(h=
0<=h?1:-1);h=Math.acos(h)/3;b=0<=a.y?(-f*Math.cos(h+Proj4js.common.PI/3)-b/3/g)*Proj4js.common.PI:-(-f*Math.cos(h+Proj4js.common.PI/3)-b/3/g)*Proj4js.common.PI;Math.abs(c);c=Proj4js.common.adjust_lon(this.long0+Proj4js.common.PI*(e-1+Math.sqrt(1+2*(c*c-d*d)+e*e))/2/c);a.x=c;a.y=b;return a}};
Proj4js.Proj.cea={init:function(){},forward:function(a){var c=a.y,b=this.x0+this.a*Proj4js.common.adjust_lon(a.x-this.long0)*Math.cos(this.lat_ts),c=this.y0+this.a*Math.sin(c)/Math.cos(this.lat_ts);a.x=b;a.y=c;return a},inverse:function(a){a.x-=this.x0;a.y-=this.y0;var c=Proj4js.common.adjust_lon(this.long0+a.x/this.a/Math.cos(this.lat_ts)),b=Math.asin(a.y/this.a*Math.cos(this.lat_ts));a.x=c;a.y=b;return a}};
Proj4js.Proj.eqc={init:function(){this.x0||(this.x0=0);this.y0||(this.y0=0);this.lat0||(this.lat0=0);this.long0||(this.long0=0);this.lat_ts||(this.lat_ts=0);this.title||(this.title="Equidistant Cylindrical (Plate Carre)");this.rc=Math.cos(this.lat_ts)},forward:function(a){var c=a.y,b=Proj4js.common.adjust_lon(a.x-this.long0),c=Proj4js.common.adjust_lat(c-this.lat0);a.x=this.x0+this.a*b*this.rc;a.y=this.y0+this.a*c;return a},inverse:function(a){var c=a.y;a.x=Proj4js.common.adjust_lon(this.long0+(a.x-
this.x0)/(this.a*this.rc));a.y=Proj4js.common.adjust_lat(this.lat0+(c-this.y0)/this.a);return a}};
Proj4js.Proj.cass={init:function(){this.sphere||(this.en=Proj4js.common.pj_enfn(this.es),this.m0=Proj4js.common.pj_mlfn(this.lat0,Math.sin(this.lat0),Math.cos(this.lat0),this.en))},C1:0.16666666666666666,C2:0.008333333333333333,C3:0.041666666666666664,C4:0.3333333333333333,C5:0.06666666666666667,forward:function(a){var c,b,d=a.x,e=a.y,d=Proj4js.common.adjust_lon(d-this.long0);this.sphere?(c=Math.asin(Math.cos(e)*Math.sin(d)),b=Math.atan2(Math.tan(e),Math.cos(d))-this.phi0):(this.n=Math.sin(e),this.c=
Math.cos(e),b=Proj4js.common.pj_mlfn(e,this.n,this.c,this.en),this.n=1/Math.sqrt(1-this.es*this.n*this.n),this.tn=Math.tan(e),this.t=this.tn*this.tn,this.a1=d*this.c,this.c*=this.es*this.c/(1-this.es),this.a2=this.a1*this.a1,c=this.n*this.a1*(1-this.a2*this.t*(this.C1-(8-this.t+8*this.c)*this.a2*this.C2)),b-=this.m0-this.n*this.tn*this.a2*(0.5+(5-this.t+6*this.c)*this.a2*this.C3));a.x=this.a*c+this.x0;a.y=this.a*b+this.y0;return a},inverse:function(a){a.x-=this.x0;a.y-=this.y0;var c=a.x/this.a,b=
a.y/this.a;if(this.sphere)this.dd=b+this.lat0,b=Math.asin(Math.sin(this.dd)*Math.cos(c)),c=Math.atan2(Math.tan(c),Math.cos(this.dd));else{var d=Proj4js.common.pj_inv_mlfn(this.m0+b,this.es,this.en);this.tn=Math.tan(d);this.t=this.tn*this.tn;this.n=Math.sin(d);this.r=1/(1-this.es*this.n*this.n);this.n=Math.sqrt(this.r);this.r*=(1-this.es)*this.n;this.dd=c/this.n;this.d2=this.dd*this.dd;b=d-this.n*this.tn/this.r*this.d2*(0.5-(1+3*this.t)*this.d2*this.C3);c=this.dd*(1+this.t*this.d2*(-this.C4+(1+3*this.t)*
this.d2*this.C5))/Math.cos(d)}a.x=Proj4js.common.adjust_lon(this.long0+c);a.y=b;return a}};
Proj4js.Proj.gauss={init:function(){var a=Math.sin(this.lat0),c=Math.cos(this.lat0),c=c*c;this.rc=Math.sqrt(1-this.es)/(1-this.es*a*a);this.C=Math.sqrt(1+this.es*c*c/(1-this.es));this.phic0=Math.asin(a/this.C);this.ratexp=0.5*this.C*this.e;this.K=Math.tan(0.5*this.phic0+Proj4js.common.FORTPI)/(Math.pow(Math.tan(0.5*this.lat0+Proj4js.common.FORTPI),this.C)*Proj4js.common.srat(this.e*a,this.ratexp))},forward:function(a){var c=a.x,b=a.y;a.y=2*Math.atan(this.K*Math.pow(Math.tan(0.5*b+Proj4js.common.FORTPI),
this.C)*Proj4js.common.srat(this.e*Math.sin(b),this.ratexp))-Proj4js.common.HALF_PI;a.x=this.C*c;return a},inverse:function(a){for(var c=a.x/this.C,b=a.y,d=Math.pow(Math.tan(0.5*b+Proj4js.common.FORTPI)/this.K,1/this.C),e=Proj4js.common.MAX_ITER;0<e;--e){b=2*Math.atan(d*Proj4js.common.srat(this.e*Math.sin(a.y),-0.5*this.e))-Proj4js.common.HALF_PI;if(1.0E-14>Math.abs(b-a.y))break;a.y=b}if(!e)return Proj4js.reportError("gauss:inverse:convergence failed"),null;a.x=c;a.y=b;return a}};
Proj4js.Proj.omerc={init:function(){this.mode||(this.mode=0);this.lon1||(this.lon1=0,this.mode=1);this.lon2||(this.lon2=0);this.lat2||(this.lat2=0);var a=1-Math.pow(this.b/this.a,2);Math.sqrt(a);this.sin_p20=Math.sin(this.lat0);this.cos_p20=Math.cos(this.lat0);this.con=1-this.es*this.sin_p20*this.sin_p20;this.com=Math.sqrt(1-a);this.bl=Math.sqrt(1+this.es*Math.pow(this.cos_p20,4)/(1-a));this.al=this.a*this.bl*this.k0*this.com/this.con;Math.abs(this.lat0)<Proj4js.common.EPSLN?this.el=this.d=this.ts=
1:(this.ts=Proj4js.common.tsfnz(this.e,this.lat0,this.sin_p20),this.con=Math.sqrt(this.con),this.d=this.bl*this.com/(this.cos_p20*this.con),this.f=0<this.d*this.d-1?0<=this.lat0?this.d+Math.sqrt(this.d*this.d-1):this.d-Math.sqrt(this.d*this.d-1):this.d,this.el=this.f*Math.pow(this.ts,this.bl));0!=this.mode?(this.g=0.5*(this.f-1/this.f),this.gama=Proj4js.common.asinz(Math.sin(this.alpha)/this.d),this.longc-=Proj4js.common.asinz(this.g*Math.tan(this.gama))/this.bl,this.con=Math.abs(this.lat0),this.con>
Proj4js.common.EPSLN&&Math.abs(this.con-Proj4js.common.HALF_PI)>Proj4js.common.EPSLN?(this.singam=Math.sin(this.gama),this.cosgam=Math.cos(this.gama),this.sinaz=Math.sin(this.alpha),this.cosaz=Math.cos(this.alpha),this.u=0<=this.lat0?this.al/this.bl*Math.atan(Math.sqrt(this.d*this.d-1)/this.cosaz):-(this.al/this.bl)*Math.atan(Math.sqrt(this.d*this.d-1)/this.cosaz)):Proj4js.reportError("omerc:Init:DataError")):(this.sinphi=Math.sin(this.at1),this.ts1=Proj4js.common.tsfnz(this.e,this.lat1,this.sinphi),
this.sinphi=Math.sin(this.lat2),this.ts2=Proj4js.common.tsfnz(this.e,this.lat2,this.sinphi),this.h=Math.pow(this.ts1,this.bl),this.l=Math.pow(this.ts2,this.bl),this.f=this.el/this.h,this.g=0.5*(this.f-1/this.f),this.j=(this.el*this.el-this.l*this.h)/(this.el*this.el+this.l*this.h),this.p=(this.l-this.h)/(this.l+this.h),this.dlon=this.lon1-this.lon2,this.dlon<-Proj4js.common.PI&&(this.lon2-=2*Proj4js.common.PI),this.dlon>Proj4js.common.PI&&(this.lon2+=2*Proj4js.common.PI),this.dlon=this.lon1-this.lon2,
this.longc=0.5*(this.lon1+this.lon2)-Math.atan(this.j*Math.tan(0.5*this.bl*this.dlon)/this.p)/this.bl,this.dlon=Proj4js.common.adjust_lon(this.lon1-this.longc),this.gama=Math.atan(Math.sin(this.bl*this.dlon)/this.g),this.alpha=Proj4js.common.asinz(this.d*Math.sin(this.gama)),Math.abs(this.lat1-this.lat2)<=Proj4js.common.EPSLN?Proj4js.reportError("omercInitDataError"):this.con=Math.abs(this.lat1),this.con<=Proj4js.common.EPSLN||Math.abs(this.con-Proj4js.common.HALF_PI)<=Proj4js.common.EPSLN?Proj4js.reportError("omercInitDataError"):
Math.abs(Math.abs(this.lat0)-Proj4js.common.HALF_PI)<=Proj4js.common.EPSLN&&Proj4js.reportError("omercInitDataError"),this.singam=Math.sin(this.gam),this.cosgam=Math.cos(this.gam),this.sinaz=Math.sin(this.alpha),this.cosaz=Math.cos(this.alpha),this.u=0<=this.lat0?this.al/this.bl*Math.atan(Math.sqrt(this.d*this.d-1)/this.cosaz):-(this.al/this.bl)*Math.atan(Math.sqrt(this.d*this.d-1)/this.cosaz))},forward:function(a){var c,b,d,e,f;d=a.x;b=a.y;c=Math.sin(b);e=Proj4js.common.adjust_lon(d-this.longc);
d=Math.sin(this.bl*e);Math.abs(Math.abs(b)-Proj4js.common.HALF_PI)>Proj4js.common.EPSLN?(c=Proj4js.common.tsfnz(this.e,b,c),c=this.el/Math.pow(c,this.bl),f=0.5*(c-1/c),c=(f*this.singam-d*this.cosgam)/(0.5*(c+1/c)),b=Math.cos(this.bl*e),1.0E-7>Math.abs(b)?d=this.al*this.bl*e:(d=this.al*Math.atan((f*this.cosgam+d*this.singam)/b)/this.bl,0>b&&(d+=Proj4js.common.PI*this.al/this.bl))):(c=0<=b?this.singam:-this.singam,d=this.al*b/this.bl);Math.abs(Math.abs(c)-1)<=Proj4js.common.EPSLN&&Proj4js.reportError("omercFwdInfinity");
e=0.5*this.al*Math.log((1-c)/(1+c))/this.bl;d-=this.u;c=this.y0+d*this.cosaz-e*this.sinaz;a.x=this.x0+e*this.cosaz+d*this.sinaz;a.y=c;return a},inverse:function(a){var c,b,d,e;a.x-=this.x0;a.y-=this.y0;c=a.x*this.cosaz-a.y*this.sinaz;d=a.y*this.cosaz+a.x*this.sinaz;d+=this.u;b=Math.exp(-this.bl*c/this.al);c=0.5*(b-1/b);b=0.5*(b+1/b);d=Math.sin(this.bl*d/this.al);e=(d*this.cosgam+c*this.singam)/b;Math.abs(Math.abs(e)-1)<=Proj4js.common.EPSLN?(c=this.longc,e=0<=e?Proj4js.common.HALF_PI:-Proj4js.common.HALF_PI):
(b=1/this.bl,e=Math.pow(this.el/Math.sqrt((1+e)/(1-e)),b),e=Proj4js.common.phi2z(this.e,e),c=this.longc-Math.atan2(c*this.cosgam-d*this.singam,b)/this.bl,c=Proj4js.common.adjust_lon(c));a.x=c;a.y=e;return a}};
Proj4js.Proj.lcc={init:function(){this.lat2||(this.lat2=this.lat0);this.k0||(this.k0=1);if(Math.abs(this.lat1+this.lat2)<Proj4js.common.EPSLN)Proj4js.reportError("lcc:init: Equal Latitudes");else{var a=this.b/this.a;this.e=Math.sqrt(1-a*a);var a=Math.sin(this.lat1),c=Math.cos(this.lat1),c=Proj4js.common.msfnz(this.e,a,c),b=Proj4js.common.tsfnz(this.e,this.lat1,a),d=Math.sin(this.lat2),e=Math.cos(this.lat2),e=Proj4js.common.msfnz(this.e,d,e),d=Proj4js.common.tsfnz(this.e,this.lat2,d),f=Proj4js.common.tsfnz(this.e,
this.lat0,Math.sin(this.lat0));this.ns=Math.abs(this.lat1-this.lat2)>Proj4js.common.EPSLN?Math.log(c/e)/Math.log(b/d):a;this.f0=c/(this.ns*Math.pow(b,this.ns));this.rh=this.a*this.f0*Math.pow(f,this.ns);this.title||(this.title="Lambert Conformal Conic")}},forward:function(a){var c=a.x,b=a.y;if(!(90>=b&&-90<=b&&180>=c&&-180<=c))return Proj4js.reportError("lcc:forward: llInputOutOfRange: "+c+" : "+b),null;var d=Math.abs(Math.abs(b)-Proj4js.common.HALF_PI);if(d>Proj4js.common.EPSLN)b=Proj4js.common.tsfnz(this.e,
b,Math.sin(b)),b=this.a*this.f0*Math.pow(b,this.ns);else{d=b*this.ns;if(0>=d)return Proj4js.reportError("lcc:forward: No Projection"),null;b=0}c=this.ns*Proj4js.common.adjust_lon(c-this.long0);a.x=this.k0*b*Math.sin(c)+this.x0;a.y=this.k0*(this.rh-b*Math.cos(c))+this.y0;return a},inverse:function(a){var c,b,d,e=(a.x-this.x0)/this.k0,f=this.rh-(a.y-this.y0)/this.k0;0<this.ns?(c=Math.sqrt(e*e+f*f),b=1):(c=-Math.sqrt(e*e+f*f),b=-1);d=0;0!=c&&(d=Math.atan2(b*e,b*f));if(0!=c||0<this.ns){if(b=1/this.ns,
c=Math.pow(c/(this.a*this.f0),b),c=Proj4js.common.phi2z(this.e,c),-9999==c)return null}else c=-Proj4js.common.HALF_PI;d=Proj4js.common.adjust_lon(d/this.ns+this.long0);a.x=d;a.y=c;return a}};
Proj4js.Proj.laea={S_POLE:1,N_POLE:2,EQUIT:3,OBLIQ:4,init:function(){var a=Math.abs(this.lat0);this.mode=Math.abs(a-Proj4js.common.HALF_PI)<Proj4js.common.EPSLN?0>this.lat0?this.S_POLE:this.N_POLE:Math.abs(a)<Proj4js.common.EPSLN?this.EQUIT:this.OBLIQ;if(0<this.es)switch(this.qp=Proj4js.common.qsfnz(this.e,1),this.mmf=0.5/(1-this.es),this.apa=this.authset(this.es),this.mode){case this.N_POLE:case this.S_POLE:this.dd=1;break;case this.EQUIT:this.rq=Math.sqrt(0.5*this.qp);this.dd=1/this.rq;this.xmf=
1;this.ymf=0.5*this.qp;break;case this.OBLIQ:this.rq=Math.sqrt(0.5*this.qp),a=Math.sin(this.lat0),this.sinb1=Proj4js.common.qsfnz(this.e,a)/this.qp,this.cosb1=Math.sqrt(1-this.sinb1*this.sinb1),this.dd=Math.cos(this.lat0)/(Math.sqrt(1-this.es*a*a)*this.rq*this.cosb1),this.ymf=(this.xmf=this.rq)/this.dd,this.xmf*=this.dd}else this.mode==this.OBLIQ&&(this.sinph0=Math.sin(this.lat0),this.cosph0=Math.cos(this.lat0))},forward:function(a){var c,b,d=a.x,e=a.y,d=Proj4js.common.adjust_lon(d-this.long0);if(this.sphere){var f,
g,i;i=Math.sin(e);g=Math.cos(e);f=Math.cos(d);switch(this.mode){case this.OBLIQ:case this.EQUIT:b=this.mode==this.EQUIT?1+g*f:1+this.sinph0*i+this.cosph0*g*f;if(b<=Proj4js.common.EPSLN)return Proj4js.reportError("laea:fwd:y less than eps"),null;b=Math.sqrt(2/b);c=b*g*Math.sin(d);b*=this.mode==this.EQUIT?i:this.cosph0*i-this.sinph0*g*f;break;case this.N_POLE:f=-f;case this.S_POLE:if(Math.abs(e+this.phi0)<Proj4js.common.EPSLN)return Proj4js.reportError("laea:fwd:phi < eps"),null;b=Proj4js.common.FORTPI-
0.5*e;b=2*(this.mode==this.S_POLE?Math.cos(b):Math.sin(b));c=b*Math.sin(d);b*=f}}else{var h=g=0,j=0;f=Math.cos(d);d=Math.sin(d);i=Math.sin(e);i=Proj4js.common.qsfnz(this.e,i);if(this.mode==this.OBLIQ||this.mode==this.EQUIT)g=i/this.qp,h=Math.sqrt(1-g*g);switch(this.mode){case this.OBLIQ:j=1+this.sinb1*g+this.cosb1*h*f;break;case this.EQUIT:j=1+h*f;break;case this.N_POLE:j=Proj4js.common.HALF_PI+e;i=this.qp-i;break;case this.S_POLE:j=e-Proj4js.common.HALF_PI,i=this.qp+i}if(Math.abs(j)<Proj4js.common.EPSLN)return Proj4js.reportError("laea:fwd:b < eps"),
null;switch(this.mode){case this.OBLIQ:case this.EQUIT:j=Math.sqrt(2/j);b=this.mode==this.OBLIQ?this.ymf*j*(this.cosb1*g-this.sinb1*h*f):(j=Math.sqrt(2/(1+h*f)))*g*this.ymf;c=this.xmf*j*h*d;break;case this.N_POLE:case this.S_POLE:0<=i?(c=(j=Math.sqrt(i))*d,b=f*(this.mode==this.S_POLE?j:-j)):c=b=0}}a.x=this.a*c+this.x0;a.y=this.a*b+this.y0;return a},inverse:function(a){a.x-=this.x0;a.y-=this.y0;var c=a.x/this.a,b=a.y/this.a,d;if(this.sphere){var e=0,f,g=0;f=Math.sqrt(c*c+b*b);d=0.5*f;if(1<d)return Proj4js.reportError("laea:Inv:DataError"),
null;d=2*Math.asin(d);if(this.mode==this.OBLIQ||this.mode==this.EQUIT)g=Math.sin(d),e=Math.cos(d);switch(this.mode){case this.EQUIT:d=Math.abs(f)<=Proj4js.common.EPSLN?0:Math.asin(b*g/f);c*=g;b=e*f;break;case this.OBLIQ:d=Math.abs(f)<=Proj4js.common.EPSLN?this.phi0:Math.asin(e*this.sinph0+b*g*this.cosph0/f);c*=g*this.cosph0;b=(e-Math.sin(d)*this.sinph0)*f;break;case this.N_POLE:b=-b;d=Proj4js.common.HALF_PI-d;break;case this.S_POLE:d-=Proj4js.common.HALF_PI}c=0==b&&(this.mode==this.EQUIT||this.mode==
this.OBLIQ)?0:Math.atan2(c,b)}else{d=0;switch(this.mode){case this.EQUIT:case this.OBLIQ:c/=this.dd;b*=this.dd;g=Math.sqrt(c*c+b*b);if(g<Proj4js.common.EPSLN)return a.x=0,a.y=this.phi0,a;f=2*Math.asin(0.5*g/this.rq);e=Math.cos(f);c*=f=Math.sin(f);this.mode==this.OBLIQ?(d=e*this.sinb1+b*f*this.cosb1/g,b=g*this.cosb1*e-b*this.sinb1*f):(d=b*f/g,b=g*e);break;case this.N_POLE:b=-b;case this.S_POLE:d=c*c+b*b;if(!d)return a.x=0,a.y=this.phi0,a;d=1-d/this.qp;this.mode==this.S_POLE&&(d=-d)}c=Math.atan2(c,
b);d=this.authlat(Math.asin(d),this.apa)}a.x=Proj4js.common.adjust_lon(this.long0+c);a.y=d;return a},P00:0.3333333333333333,P01:0.17222222222222222,P02:0.10257936507936508,P10:0.06388888888888888,P11:0.0664021164021164,P20:0.016415012942191543,authset:function(a){var c,b=[];b[0]=a*this.P00;c=a*a;b[0]+=c*this.P01;b[1]=c*this.P10;c*=a;b[0]+=c*this.P02;b[1]+=c*this.P11;b[2]=c*this.P20;return b},authlat:function(a,c){var b=a+a;return a+c[0]*Math.sin(b)+c[1]*Math.sin(b+b)+c[2]*Math.sin(b+b+b)}};
Proj4js.Proj.aeqd={init:function(){this.sin_p12=Math.sin(this.lat0);this.cos_p12=Math.cos(this.lat0)},forward:function(a){var c=a.x,b,d=Math.sin(a.y),e=Math.cos(a.y),c=Proj4js.common.adjust_lon(c-this.long0),f=Math.cos(c),g=this.sin_p12*d+this.cos_p12*e*f;if(Math.abs(Math.abs(g)-1)<Proj4js.common.EPSLN){if(b=1,0>g){Proj4js.reportError("aeqd:Fwd:PointError");return}}else b=Math.acos(g),b/=Math.sin(b);a.x=this.x0+this.a*b*e*Math.sin(c);a.y=this.y0+this.a*b*(this.cos_p12*d-this.sin_p12*e*f);return a},
inverse:function(a){a.x-=this.x0;a.y-=this.y0;var c=Math.sqrt(a.x*a.x+a.y*a.y);if(c>2*Proj4js.common.HALF_PI*this.a)Proj4js.reportError("aeqdInvDataError");else{var b=c/this.a,d=Math.sin(b),b=Math.cos(b),e=this.long0,f;if(Math.abs(c)<=Proj4js.common.EPSLN)f=this.lat0;else{f=Proj4js.common.asinz(b*this.sin_p12+a.y*d*this.cos_p12/c);var g=Math.abs(this.lat0)-Proj4js.common.HALF_PI;Math.abs(g)<=Proj4js.common.EPSLN?e=0<=this.lat0?Proj4js.common.adjust_lon(this.long0+Math.atan2(a.x,-a.y)):Proj4js.common.adjust_lon(this.long0-
Math.atan2(-a.x,a.y)):(g=b-this.sin_p12*Math.sin(f),Math.abs(g)<Proj4js.common.EPSLN&&Math.abs(a.x)<Proj4js.common.EPSLN||(Math.atan2(a.x*d*this.cos_p12,g*c),e=Proj4js.common.adjust_lon(this.long0+Math.atan2(a.x*d*this.cos_p12,g*c))))}a.x=e;a.y=f;return a}}};
Proj4js.Proj.moll={init:function(){},forward:function(a){for(var c=a.y,b=Proj4js.common.adjust_lon(a.x-this.long0),d=c,e=Proj4js.common.PI*Math.sin(c),f=0;;f++){var g=-(d+Math.sin(d)-e)/(1+Math.cos(d)),d=d+g;if(Math.abs(g)<Proj4js.common.EPSLN)break;50<=f&&Proj4js.reportError("moll:Fwd:IterationError")}d/=2;Proj4js.common.PI/2-Math.abs(c)<Proj4js.common.EPSLN&&(b=0);c=0.900316316158*this.a*b*Math.cos(d)+this.x0;d=1.4142135623731*this.a*Math.sin(d)+this.y0;a.x=c;a.y=d;return a},inverse:function(a){var c;
a.x-=this.x0;c=a.y/(1.4142135623731*this.a);0.999999999999<Math.abs(c)&&(c=0.999999999999);c=Math.asin(c);var b=Proj4js.common.adjust_lon(this.long0+a.x/(0.900316316158*this.a*Math.cos(c)));b<-Proj4js.common.PI&&(b=-Proj4js.common.PI);b>Proj4js.common.PI&&(b=Proj4js.common.PI);c=(2*c+Math.sin(2*c))/Proj4js.common.PI;1<Math.abs(c)&&(c=1);c=Math.asin(c);a.x=b;a.y=c;return a}};
//--------------------------------------//
module.exports = Proj4js;

},{}],40:[function(_dereq_,module,exports){
//------------------------------------------------------------------//

function RGBAColor (r,g,b,a) {
    if (typeof (a) == "undefined"){
        a = 1.0;
    }
    
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
}

//------------------------------------------------------------------//

RGBAColor.prototype.GetWith  = function( inC , inT ){
    return new RGBAColor(this.r,this.g,this.b,this.a);
}

RGBAColor.prototype.RGBA  = function(  ){
    return [ this.r, this.g, this.b , this.a ];
}

RGBAColor.prototype.RGBAi  = function(  ){
    return [ this.Ri(), this.Gi(), this.Bi() , this.Ai() ];
}

RGBAColor.prototype.Ri  = function(  ){
    return Math.round( Math.min(Math.max( this.r , 0.0  ), 1.0 ) * 255 );
}

RGBAColor.prototype.Gi  = function(  ){
    return Math.round( Math.min(Math.max( this.g , 0.0  ), 1.0 ) * 255 );
}

RGBAColor.prototype.Bi  = function(  ){
    return Math.round( Math.min(Math.max( this.b , 0.0  ), 1.0 ) * 255 );
}

RGBAColor.prototype.Ai  = function(  ){
    return Math.round( Math.min(Math.max( this.a , 0.0  ), 1.0 ) * 255 );
}

RGBAColor.prototype.ToCanvas = function(  ) {
    var r = Math.max ( Math.min ( Math.round ( this.r * 255 ) , 255 ) , 0 );
    var g = Math.max ( Math.min ( Math.round ( this.g * 255 ) , 255 ) , 0 );
    var b = Math.max ( Math.min ( Math.round ( this.b * 255 ) , 255 ) , 0 );
    var a = Math.max ( Math.min (  this.a , 1.0 ) , 0.0 );
    return "rgba("+r+","+g+","+b+","+a+")";
}

//------------------------------------------------------------------//

module.exports = RGBAColor;

},{}],41:[function(_dereq_,module,exports){
//----------------------------//

function Utils(){};

//----------------------------//

//Utils.prototype.blackScrollTrack = function(){
//var rules = document.styleSheets[0].cssRules;
//for(var i=0; i < rules.length; i++) {
//if(rules[i].type != 1)
//console.log(rules[i]);
//}

//document.styleSheets[0].addRule("::-webkit-scrollbar-track", "background: rgba(0,0,0,0);");
//} 

/*
 * zeroPad(5, 2) 	--> "05"
   zeroPad(1234, 2) --> "1234"
 */
Utils.prototype.zeroPad = function(num, places) 
{
   var zero = places - num.toString().length + 1;
   return Array(+(zero > 0 && zero)).join("0") + num;
}

/*
 * now as YYYY-MM-DD
 */
Utils.prototype.dateTime = function()
{
   var now = new Date();
   return now.getFullYear() + "-" 
   + this.zeroPad(now.getMonth()+1, 2) + "-" 
   + this.zeroPad(now.getDate(), 2);
}

//----------------------------------------------------------------------------------------//

Utils.prototype.alert = function (area, type, title, message) {
   $("#" + area).append($("<div class='alert-message alert-" + type + " fade in' data-alert><a class=\"btn btn-rounded btn-icon-only btn-dark closer\" data-dismiss=\"alert\"> <i class=\"icon icon-ex-white-outline\"></i></a><h4 class=\"alert-heading\">"+title+"</h4> " + message + " </div>"));
   //$(".alert-message").delay(2000).fadeOut("slow", function () { $(this).remove(); });
}

//----------------------------------------------------------------------------------------//

/*
 * helpers for html encoding and decoding
 */
Utils.prototype.htmlEncode = function (value){
   return $('<div/>').text(value).html();
}

Utils.prototype.htmlDecode = function(value){
   return $('<div/>').html(value).text();
}

//----------------------------------------------------------------------------------------//

/*
 */
Utils.prototype.replaceAll = function(chain, value, replacement)
{
   return chain.replace(new RegExp(value, 'g'), replacement);
}

//----------------------------------------------------------------------------------------//

Utils.prototype.rgbToHex = function (r, g, b) {
   if (r > 255 || g > 255 || b > 255)
      throw "Invalid color component";
   return ((r << 16) | (g << 8) | b).toString(16);
}

//----------------------------------------------------------------------------------------//

/***
 * bytes = 36550
 * return 36.55 KB
 */
Utils.prototype.formatFileSize = function (bytes) 
{
   if (typeof bytes !== 'number') {
      return '';
   }
   if (bytes >= 1000000000) {
      return (bytes / 1000000000).toFixed(2) + ' GB';
   }
   if (bytes >= 1000000) {
      return (bytes / 1000000).toFixed(2) + ' MB';
   }
   return (bytes / 1000).toFixed(2) + ' KB';
}
//----------------------------------------------------------------------------------------//

/***
 * timestamp = 1355342389711
 * return 12/12/2012
 * 
 * timestamp = undefined => use today.
 * 
 * @Improve #MAP-12
 */
Utils.prototype.formatDate = function(timestamp) 
{
   var now = timestamp == undefined ? new Date() : new Date(timestamp);
   var day = this.zeroPad(now.getDate(), 2);
   var month = this.zeroPad(now.getMonth() + 1, 2); //Months are zero based
   var year = now.getFullYear();

   return day + "/" + month + "/" + year;
}

//----------------------------------------------------------------------------------------//

//return 1->i
Utils.prototype.random1 = function(i){
   return Math.floor(Math.random()*i) + 1;
}

//return 0->i
Utils.prototype.random0 = function(i){
   return Math.floor(Math.random()*(i+1));
}

//----------------------------------------------------------------------------------------//

Utils.prototype.generateGuid = function() 
{
   var result, i, j;
   result = '';
   for(j=0; j<32; j++) {
      if( j == 8 || j == 12|| j == 16|| j == 20)
         result = result + '_';
      i = this.random0(15).toString(16).toUpperCase();
      result = result + i;
   }
   return result;
}

//----------------------------------------------------------------------------------------//

Utils.prototype.generateUID = function() 
{
   var timestamp = new Date().getTime().toString(16);
   var random    = (Math.random() * Math.pow(2, 32)).toString(16);
   
   return timestamp + random;
}

//----------------------------------------------------------------------------------------//

Utils.prototype.popup = function(url, title, width, height) 
{
   var left = (screen.width/2)-(width/2);
   var top = (screen.height/2)-(height/2);
   return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+width+', height='+height+', top='+top+', left='+left);
}

//----------------------------------------------------------------------------------------//

/**
 * custom mustache evaluation : )
 * data is used for the functions-in-customMustache parameters 
 * 
 * http://map.x-ray.fr/wiki/display/IDEES/Custom+Mustaches
 */
Utils.prototype.toHtml = function(template)
{
   while(template.indexOf("{") != -1)
   {
      var customMustache = template.substring(template.indexOf("{"), template.indexOf("}")+1);

      var html = eval(customMustache);
      template = template.replace(customMustache, html);
   }

   return template;
}

//----------------------------------------------------------------------------------------//

Utils.prototype.isObject = function(stuff) 
{
   return Object.prototype.toString.call( stuff ) === '[object Object]' ;
}

/**
 * Ember : edition + binding of objects contained in an array : thanks to ObjectProxy
 */
Utils.prototype.editObjectInArray = function(object, property, value)
{
   var proxy = Ember.ObjectProxy.create({
      content: object
   });

   proxy.set(property, value);
}

//----------------------------------------------------------------------------------------//

Utils.prototype.styleThumbURL = function(styleUID, size) 
{
   return this.thumbURL(styleUID, "style", size)
}

Utils.prototype.colorbarThumbURL = function(colorbarUID) 
{
   return this.thumbURL(colorbarUID, "colorbar")
}

//----------------------------------------------------------------------------------------//

Utils.prototype.thumbURL = function(uid, type, size) 
{
   if(uid == undefined || uid == null)
      return "";
   
   if(size == undefined || size == null)
      size = "";
   else
      size = "_"+size;

   var end = uid.substring(uid.length-4);
   var folders = end.split("");
   
   var url = "http://static.maperial.com/thumbs/" + type;
   folders.forEach(function(folder) {
      url += "/" + folder;
   });

   return url + "/" + uid + size + ".png";
}

//----------------------------------------------------------------------------------------//

Utils.prototype.getSourceThumb = function(layer) {
   
   switch(layer.source.type){
      case Source.MaperialOSM:
         return " src=\""+this.styleThumbURL(layer.params.styles[layer.params.selectedStyle], "l")+"\"";
   
      case Source.Vector:
      case Source.Images:
      case Source.WMS:
         return " src=\"http://static.maperial.localhost/images/icons/layer."+layer.source.params.src+".png\"";
         
      case Source.Raster:
         return " src=\"http://static.maperial.localhost/images/icons/layer.raster.png\""; // TODO : thumb du raster
   }
   

   switch(layer.type){
      case LayersManager.SRTM:
         return " src=\"http://static.maperial.localhost/images/icons/layer.srtm.png\"";
         
      case LayersManager.Shade:
      default:
         return " src=\"http://static.maperial.localhost/images/icons/layer.shade.png\"";
   }
}

//----------------------------------------------------------------------------------------//

//ui-slider-handle ui-state-default ui-corner-all
Utils.prototype.buildSliderStyle = function (id){

   $("#" + id + " a").css({color:"#000"});
   $("#" + id + " a").css({textDecoration:"none"});
   $("#" + id + " a").css({textAlign:"center"});
   $("#" + id + " a").css({width:"20px"});
   $("#" + id + " a").css({height:"20px"});
   $("#" + id + " a").css({borderTopLeftRadius:"30px"});
   $("#" + id + " a").css({borderTopRightRadius:"30px"});
   $("#" + id + " a").css({borderBottomLeftRadius:"30px"});
   $("#" + id + " a").css({borderBottomRightRadius:"30px"});
   $("#" + id + " a").css({outline:"none"});
   $("#" + id + " a").css({cursor:"pointer"});
   $("#" + id + " a").css({cursor:"hand"});

}

//----------------------------------------------------------------------------------------//

Utils.prototype.apply = function (toObject, methodName){
   return (function(param1, param2, param3, param4, param5, param6){toObject[methodName](param1, param2, param3, param4, param5, param6)});
}

Utils.prototype.getPoint = function (event) {
   return {
       x : event.clientX - $(event.target).offset().left,
       y : event.clientY - $(event.target).offset().top
   };
}

Utils.prototype.randomRotate = function (element) {

   var rotation = this.random0(15) - 8
   if(Math.abs(rotation) < 2)
      this.randomRotate(element)
   else{
      $("#"+element).css("-webkit-transform", "rotate("+rotation+"deg)")
      $("#"+element).css("-moz-transform", "rotate("+rotation+"deg)")
   }
      
}

//----------------------------------------------------------------------------------------//

Utils.prototype.prepareOptions = function (options, mainParam) {

   if(options === undefined){
      return null
   }
   
   else if(typeof options == "string"){
      var value = options
      var newOptions = {}
      newOptions[mainParam] = value
      return newOptions
   }
      
   else if(options[mainParam] === undefined){
      console.log("Could not find " + mainParam + ". Check your options.")
      return null
   }
   
   else
      return options
}
   
//----------------------------------------------------------------------------------------//
   
Utils.prototype.cloneJsonObject = function (jsonObject) {
   return $.parseJSON(JSON.stringify(jsonObject));
}

Utils.prototype.odump = function(o){
   console.log(this.cloneJsonObject(o));
}


//------------------------------------------------------------------//

module.exports = new Utils();
},{}]},{},[7])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvbWFuYWdlcnMvY29sb3JiYXItbWFuYWdlci5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL21hbmFnZXJzL2xheWVyLW1hbmFnZXIuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9tYW5hZ2Vycy9zb3VyY2UtbWFuYWdlci5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL21hbmFnZXJzL3N0eWxlLW1hbmFnZXIuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9tYXAtY29udGV4dC5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL21hcC12aWV3LmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvbWFwZXJpYWwuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9tb2RlbHMvZGF0YS9jb2xvcmJhci1kYXRhLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvbW9kZWxzL2RhdGEvZHluYW1pY2FsLWRhdGEuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9tb2RlbHMvZGF0YS9oZWF0bWFwLWRhdGEuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9tb2RlbHMvZGF0YS9pbWFnZS1kYXRhLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvbW9kZWxzL2xheWVyLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvbW9kZWxzL2xheWVycy9keW5hbWljYWwtbGF5ZXIuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9tb2RlbHMvbGF5ZXJzL2hlYXRtYXAtbGF5ZXIuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9tb2RlbHMvbGF5ZXJzL2ltYWdlLWxheWVyLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvbW9kZWxzL3NvdXJjZS5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL21vZGVscy9zdHlsZS5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL21vZGVscy92ZWN0b3JpYWwtc3R5bGUuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9tb3VzZS1saXN0ZW5lci5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL3JlbmRlcmluZy9jb2xvcmJhci1yZW5kZXJlci5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL3JlbmRlcmluZy9keW5hbWljYWwtcmVuZGVyZXIuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9yZW5kZXJpbmcvaGVhdG1hcC1yZW5kZXJlci5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL3JlbmRlcmluZy9sYXllcnBhcnRzL2R5bmFtaWNhbC1sYXllci1wYXJ0LmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvcmVuZGVyaW5nL2xheWVycGFydHMvaW1hZ2UtbGF5ZXItcGFydC5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL3JlbmRlcmluZy9sYXllcnBhcnRzL3Jhc3Rlci1sYXllci1wYXJ0LmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvcmVuZGVyaW5nL2xheWVycGFydHMvc2hhZGUtbGF5ZXItcGFydC5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL3JlbmRlcmluZy9sYXllcnBhcnRzL3ZlY3RvcmlhbC1sYXllci1wYXJ0LmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvcmVuZGVyaW5nL21hcC1yZW5kZXJlci5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL3JlbmRlcmluZy9zeW1ib2xpemVycy9wb2ludC1zeW1ib2xpemVyLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2NvcmUvcmVuZGVyaW5nL3RpbGUtcmVuZGVyZXIuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvY29yZS9yZW5kZXJpbmcvdGlsZS5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL3JlbmRlcmluZy90b29scy9nbC10b29scy5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9jb3JlL3JlbmRlcmluZy90b29scy9yZW5kZXItdGV4dC5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9saWJzL2Nvb3JkaW5hdGUtc3lzdGVtLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2xpYnMvZ2wtbWF0cml4LW1pbi5qcyIsIi9Vc2Vycy9tYWQvUHJvamVjdHMvTWFwZXJpYWwvbWFwZXJpYWwvd2ViL3NvdXJjZXMvanMvbWFwZXJpYWxqcy9saWJzL2dyYWRpZW50LWNvbG9yLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2xpYnMvaGFtbWVyLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy9tYXBlcmlhbGpzL2xpYnMvcG9pbnQuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvbGlicy9wcm9qNGpzLWNvbXByZXNzZWQuanMiLCIvVXNlcnMvbWFkL1Byb2plY3RzL01hcGVyaWFsL21hcGVyaWFsL3dlYi9zb3VyY2VzL2pzL21hcGVyaWFsanMvbGlicy9yZ2JhLWNvbG9yLmpzIiwiL1VzZXJzL21hZC9Qcm9qZWN0cy9NYXBlcmlhbC9tYXBlcmlhbC93ZWIvc291cmNlcy9qcy90b29scy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2grQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcG5FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxudmFyIEdyYWRpYW50Q29sb3IgICAgICAgICAgID0gcmVxdWlyZSgnLi4vLi4vbGlicy9ncmFkaWVudC1jb2xvci5qcycpLFxuICAgIENvbG9yYmFyRGF0YSAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vbW9kZWxzL2RhdGEvY29sb3JiYXItZGF0YS5qcycpLFxuICAgIHV0aWxzICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vLi4vLi4vdG9vbHMvdXRpbHMuanMnKTtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5mdW5jdGlvbiBDb2xvcmJhck1hbmFnZXIoKXtcbiAgIHRoaXMuY29sb3JiYXJzVG9Mb2FkICAgID0gbnVsbDtcbiAgIHRoaXMubmV4dEZ1bmN0aW9uICAgICAgID0gbnVsbDtcblxuICAgd2luZG93Lm1hcGVyaWFsQ29sb3JiYXJzID0gd2luZG93Lm1hcGVyaWFsQ29sb3JiYXJzIHx8IHt9OyAgLy8gY2FjaGUgY29udGFpbmluZyBhbGwgcHJldmlvdXNseSBsb2FkZWQgY29sb3JiYXJzXG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkNvbG9yYmFyTWFuYWdlci5wcm90b3R5cGUuY3JlYXRlQ29sb3JiYXIgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgIGlmKCFvcHRpb25zKXtcbiAgICAgIG9wdGlvbnMgPSB7IFxuICAgICAgICAgICAgYmVnaW5BbHBoYUF0WmVybyA6IHRydWUgXG4gICAgICB9O1xuICAgfVxuXG4gICB2YXIgc3RlcHMgICAgICAgICA9IG9wdGlvbnMuc3RlcHMgfHwgQ29sb3JiYXJNYW5hZ2VyLmRlZmF1bHRTdGVwcyxcbiAgIGNvbG9yYmFyRGF0YSAgPSBuZXcgQ29sb3JiYXJEYXRhKHtcbiAgICAgIGJlZ2luQWxwaGFBdFplcm8gOiBvcHRpb25zLmJlZ2luQWxwaGFBdFplcm9cbiAgIH0pO1xuXG4gICBmb3IodmFyIHN0ZXAgaW4gc3RlcHMpe1xuICAgICAgY29sb3JiYXJEYXRhLlNldChzdGVwLCBuZXcgR3JhZGlhbnRDb2xvcihzdGVwc1tzdGVwXS5yLCBzdGVwc1tzdGVwXS5nLCBzdGVwc1tzdGVwXS5iLCBzdGVwc1tzdGVwXS5hKSk7XG4gICB9XG5cbiAgIHZhciBjb2xvcmJhciA9IHRoaXMuYWRkQ29sb3JiYXIoY29sb3JiYXJEYXRhKTtcbiAgIHJldHVybiBjb2xvcmJhcjtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuQ29sb3JiYXJNYW5hZ2VyLnByb3RvdHlwZS5hZGRDb2xvcmJhciA9IGZ1bmN0aW9uKCBjb2xvcmJhckRhdGEgKSB7XG5cbiAgIHZhciB1aWQgPSB1dGlscy5nZW5lcmF0ZVVJRCgpO1xuXG4gICB3aW5kb3cubWFwZXJpYWxDb2xvcmJhcnNbdWlkXSA9IHtcbiAgICAgICAgIHVpZCAgICAgIDogdWlkLCBcbiAgICAgICAgIG5hbWUgICAgIDogdWlkLCBcbiAgICAgICAgIGRhdGEgICAgIDogY29sb3JiYXJEYXRhLCAgIC8qKiAgMSBjb21tb24gZGF0YSBmb3IgZXZlcnkgbWFwdmlldyAgICAgICoqL1xuICAgICAgICAgdGV4ICAgICAgOiB7fSwgICAgICAgICAgICAgLyoqICAxIHRleC9tYXB2aWV3ICAgICAgICAgICAgICAgICAgICAgICAgKiovXG4gICAgICAgICB2ZXJzaW9uICA6IC0xICAgICAgICAgICAgICAvKiogIGZvcmNlIG5vdCB0byBiZSBzeW5jIHRvIGJ1aWxkIHRleCAgICAqKi9cbiAgIH07XG5cbiAgIHJldHVybiB3aW5kb3cubWFwZXJpYWxDb2xvcmJhcnNbdWlkXTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuQ29sb3JiYXJNYW5hZ2VyLnByb3RvdHlwZS5ub0NvbG9yYmFyID0gZnVuY3Rpb24oKSB7XG4gICByZXR1cm4gJC5pc0VtcHR5T2JqZWN0KHdpbmRvdy5tYXBlcmlhbENvbG9yYmFycyk7ICAgXG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkNvbG9yYmFyTWFuYWdlci5wcm90b3R5cGUuZ2V0Q29sb3JiYXIgPSBmdW5jdGlvbih1aWQpe1xuICAgcmV0dXJuIHdpbmRvdy5tYXBlcmlhbENvbG9yYmFyc1t1aWRdO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5Db2xvcmJhck1hbmFnZXIucHJvdG90eXBlLmZldGNoQ29sb3JiYXJzID0gZnVuY3Rpb24oY29sb3JiYXJVSURzLCBuZXh0KSB7XG5cbiAgIHRoaXMubmV4dEZ1bmN0aW9uID0gbmV4dDtcblxuICAgaWYoY29sb3JiYXJVSURzLmxlbmd0aCA+IDApe1xuICAgICAgdmFyIGNvbG9yYmFyVUlEID0gY29sb3JiYXJVSURzLnNoaWZ0KCk7XG4gICAgICB0aGlzLmNvbG9yYmFyc1RvTG9hZCA9IGNvbG9yYmFyVUlEcztcbiAgICAgIHRoaXMubG9hZENvbG9yYmFyKGNvbG9yYmFyVUlEKTtcbiAgIH1cbiAgIGVsc2V7XG4gICAgICBuZXh0KCk7XG4gICB9XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkNvbG9yYmFyTWFuYWdlci5wcm90b3R5cGUubG9hZENvbG9yYmFyID0gZnVuY3Rpb24oY29sb3JiYXJVSUQpIHtcblxuICAgdmFyIG1lID0gdGhpcztcblxuICAgaWYod2luZG93Lm1hcGVyaWFsQ29sb3JiYXJzW2NvbG9yYmFyVUlEXSl7XG4gICAgICB0aGlzLmxvYWROZXh0Q29sb3JiYXIoKTtcbiAgICAgIHJldHVybjtcbiAgIH1cblxuICAgdmFyIGNvbG9yYmFyVVJMID0gdGhpcy5nZXRVUkwoY29sb3JiYXJVSUQpO1xuICAgY29uc29sZS5sb2coXCIgIGZldGNoaW5nIDogXCIgKyBjb2xvcmJhclVSTCk7XG5cbiAgICQuYWpheCh7ICBcbiAgICAgIHR5cGU6IFwiR0VUXCIsICBcbiAgICAgIHVybDogY29sb3JiYXJVUkwsXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoanNvbikge1xuICAgICAgICAgLypcbiAgICAgICAgIHdpbmRvdy5tYXBlcmlhbENvbG9yYmFyc1tjb2xvcmJhclVJRF0gPSB7XG4gICAgICAgICAgICAgICB1aWQgOiBjb2xvcmJhclVJRCwgXG4gICAgICAgICAgICAgICBuYW1lOiBjb2xvcmJhclVJRCwgXG4gICAgICAgICAgICAgICBjb250ZW50Ompzb24sIFxuICAgICAgICAgICAgICAgZGF0YTogbWUuY29udmVydEpzb25Ub0RhdGEoanNvbilcbiAgICAgICAgIH07XG4gICAgICAgICAqL1xuICAgICAgICAgdmFyIGNiID0gbmV3IENvbG9yQmFyRGF0YSAoICk7XG4gICAgICAgICBjYi5Gcm9tSnNvbiAoanNvbikgXG4gICAgICAgICBtZS5TZXRDb2xvckJhciAoY29sb3JiYXJVSUQsY2IgKSBcbiAgICAgICAgIG1lLmxvYWROZXh0Q29sb3JiYXIoKTtcbiAgICAgIH1cbiAgIH0pO1xuXG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkNvbG9yYmFyTWFuYWdlci5wcm90b3R5cGUubG9hZE5leHRDb2xvcmJhciA9IGZ1bmN0aW9uKCkge1xuICAgdGhpcy5mZXRjaENvbG9yYmFycyh0aGlzLmNvbG9yYmFyc1RvTG9hZCwgdGhpcy5uZXh0RnVuY3Rpb24pO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5Db2xvcmJhck1hbmFnZXIucHJvdG90eXBlLmdldFVSTCA9IGZ1bmN0aW9uKGNvbG9yYmFyVUlEKSB7XG4gICByZXR1cm4gTWFwZXJpYWwuYXBpVVJMICsgXCIvYXBpL2NvbG9yYmFyL1wiICsgY29sb3JiYXJVSUQ7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkNvbG9yYmFyTWFuYWdlci5kZWZhdWx0U3RlcHMgPSB7XG5cbiAgICAgIFwiMC4wXCIgOiB7XG4gICAgICAgICBcInJcIiA6IDAuMCxcbiAgICAgICAgIFwiZ1wiIDogMC4wLFxuICAgICAgICAgXCJiXCIgOiAxLjAsXG4gICAgICAgICBcImFcIiA6IDAuMFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgXCIwLjEwXCIgOiB7XG4gICAgICAgICBcInJcIiA6IDAuMCxcbiAgICAgICAgIFwiZ1wiIDogMC4wLFxuICAgICAgICAgXCJiXCIgOiAxLjAsXG4gICAgICAgICBcImFcIiA6IDEuMFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgXCIwLjE1XCIgOiB7XG4gICAgICAgICBcInJcIiA6IDAuMCxcbiAgICAgICAgIFwiZ1wiIDogMS4wLFxuICAgICAgICAgXCJiXCIgOiAxLjAsXG4gICAgICAgICBcImFcIiA6IDEuMFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgXCIwLjQ1XCIgOiB7XG4gICAgICAgICBcInJcIiA6IDAuMCxcbiAgICAgICAgIFwiZ1wiIDogMS4wLFxuICAgICAgICAgXCJiXCIgOiAwLjAsXG4gICAgICAgICBcImFcIiA6IDEuMFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgXCIwLjc1XCIgOiB7XG4gICAgICAgICBcInJcIiA6IDEuMCxcbiAgICAgICAgIFwiZ1wiIDogMS4wLFxuICAgICAgICAgXCJiXCIgOiAwLjAsXG4gICAgICAgICBcImFcIiA6IDEuMFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgXCIxLjBcIiA6IHtcbiAgICAgICAgIFwiclwiIDogMS4wLFxuICAgICAgICAgXCJnXCIgOiAwLjAsXG4gICAgICAgICBcImJcIiA6IDAuMCxcbiAgICAgICAgIFwiYVwiIDogMS4wXG4gICAgICB9LFxufVxuXG4vKlxuQ29sb3JiYXJNYW5hZ2VyLnByb3RvdHlwZS5jb252ZXJ0SnNvblRvRGF0YSA9IGZ1bmN0aW9uKGNvbG9yYmFySnNvbikge1xuICAgXG4gICB2YXIgZGF0YSA9IFtdOyAgIFxuICAgdmFyIHByZXZpb3VzU3RlcCA9IDA7XG4gICBmb3IgKHZhciBpIGluIGNvbG9yYmFySnNvbikge1xuICAgICAgZm9yICggdmFyIG4gPSBwcmV2aW91c1N0ZXA7IG4gPD0gcGFyc2VJbnQoaSk7IG4rKykge1xuICAgICAgICAgZGF0YS5wdXNoICggY29sb3JiYXJKc29uW2ldLnIgKTtcbiAgICAgICAgIGRhdGEucHVzaCAoIGNvbG9yYmFySnNvbltpXS5nICk7XG4gICAgICAgICBkYXRhLnB1c2ggKCBjb2xvcmJhckpzb25baV0uYiApO1xuICAgICAgICAgZGF0YS5wdXNoICggY29sb3JiYXJKc29uW2ldLmEgKiAyNTUgKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcHJldmlvdXNTdGVwID0gbjtcbiAgIH1cbiAgIFxuICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGRhdGEpO1xufVxuKi9cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yYmFyTWFuYWdlcjtcbiIsIi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxudmFyIExheWVyICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vbW9kZWxzL2xheWVyLmpzJyksXG4gICAgRHluYW1pY2FsTGF5ZXIgICAgICAgICAgPSByZXF1aXJlKCcuLi9tb2RlbHMvbGF5ZXJzL2R5bmFtaWNhbC1sYXllci5qcycpLFxuICAgIEltYWdlTGF5ZXIgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vbW9kZWxzL2xheWVycy9pbWFnZS1sYXllci5qcycpLFxuICAgIEhlYXRtYXBMYXllciAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vbW9kZWxzL2xheWVycy9oZWF0bWFwLWxheWVyLmpzJyk7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gTGF5ZXJNYW5hZ2VyKG1hcFZpZXcpe1xuICAgdGhpcy5tYXBWaWV3ID0gbWFwVmlldztcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuTGF5ZXJNYW5hZ2VyLnByb3RvdHlwZS5hZGRMYXllciA9IGZ1bmN0aW9uKGxheWVyVHlwZSwgcGFyYW1zKSB7XG5cbiAgIGNvbnNvbGUubG9nKFwiICBhZGRpbmcgbGF5ZXIgXCIgKyBsYXllclR5cGUpXG4gICB2YXIgbGF5ZXIgPSBudWxsXG5cbiAgIHN3aXRjaChsYXllclR5cGUpe1xuXG4gICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG4gICAgICBjYXNlIExheWVyLkR5bmFtaWNhbCA6XG4gICAgICAgICBsYXllciA9IG5ldyBEeW5hbWljYWxMYXllcihwYXJhbXMsIHRoaXMuZGVmYXVsdER5bmFtaWNhbENvbXBvc2l0aW9uKCkpO1xuICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG4gICAgICAgICBcbiAgICAgIGNhc2UgTGF5ZXIuSGVhdCA6XG4gICAgICAgICAgbGF5ZXIgPSBuZXcgSGVhdG1hcExheWVyKHBhcmFtcywgdGhpcy5kZWZhdWx0Q29tcG9zaXRpb24oKSk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG4gICAgICBjYXNlIExheWVyLlZlY3RvcmlhbCA6XG4gICAgICAgICBicmVhaztcblxuICAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuICAgICAgY2FzZSBMYXllci5SYXN0ZXIgOlxuICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbiAgICAgIGNhc2UgTGF5ZXIuSW1hZ2VzIDpcbiAgICAgIGNhc2UgTGF5ZXIuV01TOlxuICAgICAgICAgbGF5ZXIgPSBuZXcgSW1hZ2VMYXllcihwYXJhbXMsIHRoaXMuZGVmYXVsdENvbXBvc2l0aW9uKCkpO1xuICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbiAgICAgIGNhc2UgTGF5ZXIuU1JUTSA6XG4gICAgICAgICBicmVhaztcblxuICAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuICAgICAgY2FzZSBMYXllci5TaGFkZSA6XG4gICAgICAgICBicmVhaztcblxuICAgfVxuXG4gICBmb3IgKHZhciBrZXkgaW4gdGhpcy5tYXBWaWV3LnRpbGVzKSB7XG4gICAgICB0aGlzLm1hcFZpZXcudGlsZXNba2V5XS5jcmVhdGVMYXllclBhcnQobGF5ZXIsIHRoaXMubWFwVmlldy5sYXllcnMubGVuZ3RoKTtcbiAgIH0gIFxuXG4gICB0aGlzLm1hcFZpZXcubGF5ZXJzLnB1c2gobGF5ZXIpO1xuXG4gICByZXR1cm4gbGF5ZXI7XG59XG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cbi8vRGVmYXVsdCBzZXR0aW5nc1xuXG5MYXllck1hbmFnZXIucHJvdG90eXBlLmRlZmF1bHRNdWxCbGVuZCA9IGZ1bmN0aW9uKCkge1xuICAgcmV0dXJuIHtcbiAgICAgIHNoYWRlciA6IE1hcGVyaWFsLk11bEJsZW5kLFxuICAgICAgcGFyYW1zIDogTGF5ZXJNYW5hZ2VyLmRlZmF1bHRNdWxCbGVuZFBhcmFtc1xuICAgfTtcbn1cblxuTGF5ZXJNYW5hZ2VyLnByb3RvdHlwZS5kZWZhdWx0Q29tcG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgIHJldHVybiB7XG4gICAgICBzaGFkZXIgOiBNYXBlcmlhbC5BbHBoYUJsZW5kLFxuICAgICAgcGFyYW1zIDogTGF5ZXJNYW5hZ2VyLmRlZmF1bHRBbHBoYUJsZW5kUGFyYW1zXG4gICB9O1xufVxuXG5MYXllck1hbmFnZXIucHJvdG90eXBlLmRlZmF1bHREeW5hbWljYWxDb21wb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHNoYWRlciA6IE1hcGVyaWFsLkFscGhhQmxlbmQsXG4gICAgICAgIHBhcmFtcyA6IHtcbiAgICAgICAgICAgIHVQYXJhbXMgOiAxXG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5MYXllck1hbmFnZXIuZGVmYXVsdE11bEJsZW5kUGFyYW1zID0ge1xuICAgICAgdVBhcmFtcyA6IFsgMC4wLCAwLjAsIDEgXVxufVxuXG5cbkxheWVyTWFuYWdlci5kZWZhdWx0QWxwaGFCbGVuZFBhcmFtcyA9IHtcbiAgICAgIHVQYXJhbXMgOiAwLjVcbn1cblxuTGF5ZXJNYW5hZ2VyLmRlZmF1bHRBbHBoYUNsaXBQYXJhbXMgPSB7XG4gICAgICB1UGFyYW1zIDogMC41XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxubW9kdWxlLmV4cG9ydHMgPSBMYXllck1hbmFnZXI7IiwiXHJcbnZhciB1dGlscyAgICAgICA9IHJlcXVpcmUoJy4uLy4uLy4uL3Rvb2xzL3V0aWxzLmpzJyk7XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5mdW5jdGlvbiBTb3VyY2VNYW5hZ2VyKCl7XHJcblxyXG4gICB0aGlzLmRhdGEgICAgICA9IHt9O1xyXG4gICB0aGlzLnJlcXVlc3RzICA9IHt9O1xyXG4gICB0aGlzLmNvbXBsZXRlICA9IHt9O1xyXG4gICB0aGlzLmVycm9ycyAgICA9IHt9O1xyXG5cclxuICAgdGhpcy5yZXF1ZXN0c0NvdW50ZXIgPSB7fTtcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuU291cmNlTWFuYWdlci5wcm90b3R5cGUucmVsZWFzZU5ldHdvcmsgPSBmdW5jdGlvbiAoKSB7XHJcbiAgIFxyXG4gICBmb3IodmFyIHJlcXVlc3RJZCBpbiB0aGlzLnJlcXVlc3RzKXtcclxuXHJcbiAgICAgIGlmKCF0aGlzLmNvbXBsZXRlW3JlcXVlc3RJZF0gfHwgdGhpcy5lcnJvcnNbcmVxdWVzdElkXSB8fCAhdGhpcy5kYXRhW3JlcXVlc3RJZF0pe1xyXG4gICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXS5hYm9ydCgpO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIGNhdGNoKGUpe31cclxuICAgICAgfVxyXG5cclxuICAgICAgZGVsZXRlIHRoaXMuZGF0YVtyZXF1ZXN0SWRdO1xyXG4gICAgICBkZWxldGUgdGhpcy5lcnJvcnNbcmVxdWVzdElkXTtcclxuICAgICAgZGVsZXRlIHRoaXMuY29tcGxldGVbcmVxdWVzdElkXTtcclxuICAgICAgZGVsZXRlIHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXTtcclxuICAgfVxyXG5cclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblNvdXJjZU1hbmFnZXIucHJvdG90eXBlLnJlcXVlc3RJZCA9IGZ1bmN0aW9uIChzb3VyY2VJZCwgeCwgeSwgeikge1xyXG4gICByZXR1cm4gc291cmNlSWQgKyBcIl9cIiArIHggKyBcIl9cIiArIHkgKyBcIl9cIiArIHo7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5Tb3VyY2VNYW5hZ2VyLnByb3RvdHlwZS5yZWxlYXNlID0gZnVuY3Rpb24gKHNvdXJjZUlkLCB4LCB5LCB6KSB7XHJcblxyXG4gICB2YXIgcmVxdWVzdElkID0gdGhpcy5yZXF1ZXN0SWQoc291cmNlSWQsIHgsIHksIHopO1xyXG4gICB2YXIgbmJSZXF1ZXN0cyA9IHRoaXMucmVxdWVzdHNDb3VudGVyW3JlcXVlc3RJZF0gfHwgMFxyXG5cclxuICAgaWYobmJSZXF1ZXN0cyA+IDEpe1xyXG4gICAgICB0aGlzLnJlcXVlc3RzQ291bnRlcltyZXF1ZXN0SWRdID0gbmJSZXF1ZXN0cyAtIDFcclxuICAgfVxyXG4gICBlbHNle1xyXG4gICAgICBpZighdGhpcy5jb21wbGV0ZVtyZXF1ZXN0SWRdKXtcclxuXHJcbiAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0c1tyZXF1ZXN0SWRdLmFib3J0KCk7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgY2F0Y2goZSl7fVxyXG4gICAgICB9XHJcblxyXG4gICAgICBkZWxldGUgdGhpcy5kYXRhW3JlcXVlc3RJZF07XHJcbiAgICAgIGRlbGV0ZSB0aGlzLmVycm9yc1tyZXF1ZXN0SWRdO1xyXG4gICAgICBkZWxldGUgdGhpcy5jb21wbGV0ZVtyZXF1ZXN0SWRdO1xyXG4gICAgICBkZWxldGUgdGhpcy5yZXF1ZXN0c1tyZXF1ZXN0SWRdO1xyXG4gICB9XHJcblxyXG5cclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblNvdXJjZU1hbmFnZXIucHJvdG90eXBlLkxvYWRWZWN0b3JpYWwgPSBmdW5jdGlvbiAoIHNvdXJjZUlkLCB4LCB5LCB6ICkge1xyXG4gICB2YXIgdXJsID0gXCIvYXBpL3RpbGU/eD1cIit0eCtcIiZ5PVwiK3R5K1wiJno9XCIrejtcclxuICAgdmFyIHJlcXVlc3RJZCA9IHRoaXMucmVxdWVzdElkKHNvdXJjZUlkLCB4LCB5LCB6KTtcclxuICAgdGhpcy5Mb2FkQVBJU291cmNlKHVybCwgcmVxdWVzdElkKVxyXG4gICBcclxufVxyXG5cclxuU291cmNlTWFuYWdlci5wcm90b3R5cGUuTG9hZFNSVE0gPSBmdW5jdGlvbiAoIHNvdXJjZUlkLCB4LCB5LCB6ICkge1xyXG4gICB2YXIgdXJsID0gXCIvYXBpL3NydG0/eD1cIit0eCtcIiZ5PVwiK3R5K1wiJno9XCIrejtcclxuICAgdmFyIHJlcXVlc3RJZCA9IHRoaXMucmVxdWVzdElkKHNvdXJjZUlkLCB4LCB5LCB6KTtcclxuICAgdGhpcy5Mb2FkQVBJU291cmNlKHVybCwgcmVxdWVzdElkKVxyXG4gICBcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblNvdXJjZU1hbmFnZXIucHJvdG90eXBlLkxvYWRBUElTb3VyY2UgPSBmdW5jdGlvbiAoIHVybCwgcmVxdWVzdElkICkge1xyXG4gICB2YXIgbWUgPSB0aGlzO1xyXG4gICBcclxuICAgdGhpcy5yZXF1ZXN0c1tyZXF1ZXN0SWRdID0gJC5hamF4KHtcclxuICAgICAgdHlwZSAgICAgOiBcIkdFVFwiLFxyXG4gICAgICB1cmwgICAgICA6IHVybCxcclxuICAgICAgZGF0YVR5cGUgOiBcImpzb25cIiwgIFxyXG4gICAgICB0aW1lb3V0ICA6IE1hcGVyaWFsLnRpbGVETFRpbWVPdXQsXHJcbiAgICAgIHN1Y2Nlc3MgIDogZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICBpZiAoICEgZGF0YSApIHtcclxuICAgICAgICAgICAgbWUuZXJyb3JzW3JlcXVlc3RJZF0gPSB0cnVlO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBtZS5kYXRhW3JlcXVlc3RJZF0gPSBkYXRhO1xyXG4gICAgICAgICB9XHJcblxyXG4gICAgICAgICBtZS5jb21wbGV0ZVtyZXF1ZXN0SWRdID0gdHJ1ZTtcclxuICAgICAgfSxcclxuICAgICAgZXJyb3IgOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgbWUuZXJyb3JzW3JlcXVlc3RJZF0gID0gdHJ1ZTtcclxuICAgICAgICAgbWUuY29tcGxldGVbcmVxdWVzdElkXSAgICA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgfSk7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5Tb3VyY2VNYW5hZ2VyLnByb3RvdHlwZS5Mb2FkSW1hZ2UgPSBmdW5jdGlvbiAoIHNvdXJjZUlkLCB4LCB5LCB6ICkge1xyXG4gICBcclxuICAgdmFyIG1lICAgICAgICAgPSB0aGlzOyAgIFxyXG4gICB2YXIgdXJsICAgICAgICA9IHRoaXMuZ2V0SW1hZ2VVUkwoc291cmNlSWQsIHgsIHksIHopO1xyXG4gICB2YXIgcmVxdWVzdElkICA9IHRoaXMucmVxdWVzdElkKHNvdXJjZUlkLCB4LCB5LCB6KTtcclxuXHJcbiAgIHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgLy9odHRwOi8vYmxvZy5jaHJvbWl1bS5vcmcvMjAxMS8wNy91c2luZy1jcm9zcy1kb21haW4taW1hZ2VzLWluLXdlYmdsLWFuZC5odG1sXHJcbiAgIHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXS5jcm9zc09yaWdpbiA9ICcnOyAvLyBubyBjcmVkZW50aWFscyBmbGFnLiBTYW1lIGFzIGltZy5jcm9zc09yaWdpbj0nYW5vbnltb3VzJ1xyXG5cclxuICAgdGhpcy5yZXF1ZXN0c1tyZXF1ZXN0SWRdLm9ubG9hZCA9IGZ1bmN0aW9uIChvRXZlbnQpIHsgICAgICBcclxuICAgICAgdmFyIGltZyAgICAgICAgICAgICAgICAgPSBtZS5yZXF1ZXN0c1tyZXF1ZXN0SWRdXHJcbiAgICAgIG1lLmVycm9yc1tyZXF1ZXN0SWRdICAgID0gZmFsc2U7XHJcbiAgICAgIG1lLmNvbXBsZXRlW3JlcXVlc3RJZF0gID0gdHJ1ZTtcclxuICAgICAgbWUuZGF0YVtyZXF1ZXN0SWRdICAgICAgPSBpbWc7XHJcbiAgIH07XHJcblxyXG4gICB0aGlzLnJlcXVlc3RzW3JlcXVlc3RJZF0ub25lcnJvciA9IGZ1bmN0aW9uIChvRXZlbnQpIHtcclxuICAgICAgbWUuZXJyb3JzW3JlcXVlc3RJZF0gICAgPSB0cnVlO1xyXG4gICAgICBtZS5jb21wbGV0ZVtyZXF1ZXN0SWRdICA9IHRydWU7XHJcbiAgIH1cclxuXHJcbiAgIHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXS5hYm9ydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgbWUucmVxdWVzdHNbcmVxdWVzdElkXS5zcmMgPSBcIlwiXHJcbiAgIH1cclxuXHJcbiAgIHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXS5zcmMgPSB1cmw7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5Tb3VyY2VNYW5hZ2VyLnByb3RvdHlwZS5Mb2FkUmFzdGVyID0gZnVuY3Rpb24gKCBzb3VyY2UsIHgsIHksIHogKSB7XHJcblxyXG4gICB2YXIgcmVxdWVzdElkID0gdGhpcy5yZXF1ZXN0SWQoc291cmNlLCB4LCB5LCB6KTtcclxuXHJcbiAgIGlmICggISB0aGlzLmdldFVSTChzb3VyY2UsIHgsIHksIHopICkge1xyXG4gICAgICB0aGlzLmVycm9yc1tyZXF1ZXN0SWRdID0gdHJ1ZTtcclxuICAgICAgdGhpcy5jb21wbGV0ZVtyZXF1ZXN0SWRdID0gdHJ1ZTtcclxuICAgICAgcmV0dXJuIDtcclxuICAgfVxyXG5cclxuICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9ET00vWE1MSHR0cFJlcXVlc3QvU2VuZGluZ19hbmRfUmVjZWl2aW5nX0JpbmFyeV9EYXRhXHJcbiAgIC8vIEpRdWVyeSBjYW4gbm90IHVzZSBYTUxIdHRwUmVxdWVzdCBWMiAoYmluYXJ5IGRhdGEpXHJcbiAgIHZhciBtZSA9IHRoaXM7ICAgXHJcbiAgIHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICB0aGlzLnJlcXVlc3RzW3JlcXVlc3RJZF0ub3BlbiAoXCJHRVRcIiwgdGhpcy5nZXRVUkwoc291cmNlLCB4LCB5LCB6KSwgdHJ1ZSk7XHJcbiAgIHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXS5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XHJcblxyXG4gICB0aGlzLnJlcXVlc3RzW3JlcXVlc3RJZF0ub25sb2FkID0gZnVuY3Rpb24gKG9FdmVudCkgeyAgXHJcbiAgICAgIFxyXG4gICAgICB2YXIgYXJyYXlCdWZmZXIgPSBtZS5yZXF1ZXN0c1tyZXF1ZXN0SWRdLnJlc3BvbnNlOyAgLy8gTm90ZTogbm90IHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXS5yZXNwb25zZVRleHRcclxuICAgICAgaWYgKGFycmF5QnVmZmVyICYmICggbWUucmVxdWVzdHNbcmVxdWVzdElkXS5zdGF0dXMgIT0gMjAwIHx8IGFycmF5QnVmZmVyLmJ5dGVMZW5ndGggPD0gMCApKSB7XHJcbiAgICAgICAgIGFycmF5QnVmZmVyID0gbnVsbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgbWUuZXJyb3JzW3JlcXVlc3RJZF0gPSBhcnJheUJ1ZmZlciA9PSBudWxsO1xyXG4gICAgICBtZS5jb21wbGV0ZVtyZXF1ZXN0SWRdICA9IHRydWU7XHJcbiAgICAgIG1lLmRhdGFbcmVxdWVzdElkXSAgPSBhcnJheUJ1ZmZlcjtcclxuICAgICAgXHJcbiAgICAgICQod2luZG93KS50cmlnZ2VyKE1hcGVyaWFsRXZlbnRzLlNPVVJDRV9SRUFEWSwgW3NvdXJjZSwgbWUuZGF0YVtyZXF1ZXN0SWRdLCB4LCB5LCB6XSlcclxuICAgfTtcclxuXHJcbiAgIHRoaXMucmVxdWVzdHNbcmVxdWVzdElkXS5vbmVycm9yID0gZnVuY3Rpb24gKG9FdmVudCkge1xyXG4gICAgICBtZS5lcnJvcnNbcmVxdWVzdElkXSA9IHRydWU7XHJcbiAgICAgIG1lLmNvbXBsZXRlW3JlcXVlc3RJZF0gID0gdHJ1ZTtcclxuICAgfVxyXG4gICBcclxuICAgZnVuY3Rpb24gYWpheFRpbWVvdXQoKSB7IFxyXG4gICAgICBpZiAoICEgbWUuY29tcGxldGVbcmVxdWVzdElkXSApIHtcclxuICAgICAgICAgdHJ5eyBcclxuICAgICAgICAgICAgbWUucmVxdWVzdHNbcmVxdWVzdElkXS5hYm9ydCgpOyBcclxuICAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLT4gTG9hZFJhc3RlclwiKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICB9IFxyXG4gICAgICB9XHJcbiAgIH1cclxuICAgdmFyIHRtID0gc2V0VGltZW91dChhamF4VGltZW91dCwgTWFwZXJpYWwudGlsZURMVGltZU91dCk7XHJcblxyXG4gICB0aGlzLnJlcXVlc3RzW3JlcXVlc3RJZF0uc2VuZChudWxsKTtcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblNvdXJjZU1hbmFnZXIucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbiAoIHNvdXJjZSwgeCwgeSwgeiApIHtcclxuICAgdmFyIHJlcXVlc3RJZCA9IHRoaXMucmVxdWVzdElkKHNvdXJjZSwgeCwgeSwgeik7XHJcbiAgIHJldHVybiB0aGlzLmRhdGFbcmVxdWVzdElkXTtcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuLy9cclxuLy9Tb3VyY2VNYW5hZ2VyLnByb3RvdHlwZS5nZXRVUkwgPSBmdW5jdGlvbiAoc291cmNlLCB0eCwgdHksIHopIHtcclxuLy9cclxuLy8gICBzd2l0Y2goc291cmNlLnR5cGUpe1xyXG4vL1xyXG4vLyAgICAgIGNhc2UgU291cmNlLk1hcGVyaWFsT1NNOlxyXG4vLyAgICAgICAgIHJldHVybiBNYXBlcmlhbC50aWxlVVJMICsgXCIvYXBpL3RpbGU/eD1cIit0eCtcIiZ5PVwiK3R5K1wiJno9XCIrejtcclxuLy9cclxuLy8gICAgICBjYXNlIFNvdXJjZS5TUlRNOlxyXG4vLyAgICAgICAgIHJldHVybiBNYXBlcmlhbC50aWxlVVJMICsgXCIvYXBpL3NydG0/eD1cIit0eCtcIiZ5PVwiK3R5K1wiJno9XCIrejtcclxuLy8gICAgICAgICBcclxuLy8gICAgICBjYXNlIFNvdXJjZS5SYXN0ZXI6XHJcbi8vICAgICAgICAgcmV0dXJuIE1hcGVyaWFsLnRpbGVVUkwgKyBcIi9hcGkvdGlsZS9cIitzb3VyY2UucGFyYW1zLnJhc3RlclVJRCtcIj94PVwiK3R4K1wiJnk9XCIrdHkrXCImej1cIit6O1xyXG4vL1xyXG4vLyAgICAgIGNhc2UgU291cmNlLkltYWdlczpcclxuLy8gICAgICAgICByZXR1cm4gdGhpcy5nZXRJbWFnZVVSTChzb3VyY2UsIHR4LCB0eSwgeilcclxuLy9cclxuLy8gICAgICBjYXNlIFNvdXJjZS5XTVM6XHJcbi8vICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0V01TVVJMKHNvdXJjZSwgdHgsIHR5LCB6KVxyXG4vLyAgIH1cclxuLy99XHJcblxyXG5cclxuU291cmNlTWFuYWdlci5wcm90b3R5cGUuZ2V0SW1hZ2VVUkwgPSBmdW5jdGlvbiAoc291cmNlSWQsIHR4LCB0eSwgeikge1xyXG5cclxuICAgdmFyIGd0eSA9IChNYXRoLnBvdyAoIDIseiApIC0gMSkgLSB0eTtcclxuICAgdmFyIHNlcnZlciA9IFtcImFcIiwgXCJiXCIsIFwiY1wiLCBcImRcIl07XHJcbiAgIFxyXG4gICBzd2l0Y2ggKHNvdXJjZUlkKSB7XHJcbiAgICAgIGNhc2UgU291cmNlLklNQUdFU19NQVBRVUVTVCA6IC8vIG5lZWQgdG8gY2hlY2sgaHR0cDovL2RldmVsb3Blci5tYXBxdWVzdC5jb20vd2ViL3Byb2R1Y3RzL29wZW4vbWFwXHJcbiAgICAgICAgIHZhciByID0gdXRpbHMucmFuZG9tMSg0KTtcclxuICAgICAgICAgcmV0dXJuIFwiaHR0cDovL290aWxlXCIrcitcIi5tcWNkbi5jb20vdGlsZXMvMS4wLjAvb3NtL1wiK3orXCIvXCIrdHgrXCIvXCIrZ3R5K1wiLnBuZ1wiO1xyXG4gICAgICAgICBicmVhaztcclxuICAgXHJcbiAgICAgICBjYXNlIFNvdXJjZS5JTUFHRVNfTUFQUVVFU1RfU0FURUxMSVRFIDogLy8gbmVlZCB0byBjaGVjayBodHRwOi8vZGV2ZWxvcGVyLm1hcHF1ZXN0LmNvbS93ZWIvcHJvZHVjdHMvb3Blbi9tYXBcclxuICAgICAgICAgIHZhciByID0gdXRpbHMucmFuZG9tMSg0KTtcclxuICAgICAgICAgIHJldHVybiBcImh0dHA6Ly9vdGlsZVwiK3IrXCIubXFjZG4uY29tL3RpbGVzLzEuMC4wL3NhdC9cIit6K1wiL1wiK3R4K1wiL1wiK2d0eStcIi5wbmdcIjtcclxuICAgXHJcblxyXG4gICAgICAgY2FzZSBTb3VyY2UuSU1BR0VTX09DTV9DWUNMRSA6XHJcbiAgICAgICAgICB2YXIgcyA9IHV0aWxzLnJhbmRvbTAoMik7XHJcbiAgICAgICAgICByZXR1cm4gXCJodHRwOi8vXCIrc2VydmVyW3NdK1wiLnRpbGUub3BlbmN5Y2xlbWFwLm9yZy9jeWNsZS9cIit6K1wiL1wiK3R4K1wiL1wiK2d0eStcIi5wbmdcIjtcclxuXHJcbiAgICAgICBjYXNlIFNvdXJjZS5JTUFHRVNfT0NNX1RSQU5TUE9SVCA6XHJcbiAgICAgICAgICB2YXIgcyA9IHV0aWxzLnJhbmRvbTAoMik7XHJcbiAgICAgICAgICByZXR1cm4gXCJodHRwOi8vXCIrc2VydmVyW3NdK1wiLnRpbGUyLm9wZW5jeWNsZW1hcC5vcmcvdHJhbnNwb3J0L1wiK3orXCIvXCIrdHgrXCIvXCIrZ3R5K1wiLnBuZ1wiO1xyXG4gICAgICAgXHJcbiAgICAgICBjYXNlIFNvdXJjZS5JTUFHRVNfT0NNX0xBTkRTQ0FQRSA6XHJcbiAgICAgICAgICB2YXIgcyA9IHV0aWxzLnJhbmRvbTAoMik7XHJcbiAgICAgICAgICByZXR1cm4gXCJodHRwOi8vXCIrc2VydmVyW3NdK1wiLnRpbGUzLm9wZW5jeWNsZW1hcC5vcmcvbGFuZHNjYXBlL1wiK3orXCIvXCIrdHgrXCIvXCIrZ3R5K1wiLnBuZ1wiO1xyXG5cclxuXHJcblxyXG4gICAgICAgY2FzZSBTb3VyY2UuSU1BR0VTX1NUQU1FTl9XQVRFUkNPTE9SIDpcclxuICAgICAgICAgIHZhciBzID0gdXRpbHMucmFuZG9tMCgzKTtcclxuICAgICAgICAgIHJldHVybiBcImh0dHA6Ly9cIitzZXJ2ZXJbc10rXCIudGlsZS5zdGFtZW4uY29tL3dhdGVyY29sb3IvXCIreitcIi9cIit0eCtcIi9cIitndHkrXCIuanBnXCIgICAgXHJcbiAgICAgICBcclxuICAgICAgIGNhc2UgU291cmNlLklNQUdFU19TVEFNRU5fVEVSUkFJTiA6IC8vIFVTIG9ubHlcclxuICAgICAgICAgIHZhciBzID0gdXRpbHMucmFuZG9tMCgzKTtcclxuICAgICAgICAgIHJldHVybiBcImh0dHA6Ly9cIitzZXJ2ZXJbc10rXCIudGlsZS5zdGFtZW4uY29tL3RlcnJhaW4vXCIreitcIi9cIit0eCtcIi9cIitndHkrXCIuanBnXCJcclxuICAgICAgIFxyXG4gICAgICAgY2FzZSBTb3VyY2UuSU1BR0VTX1NUQU1FTl9UT05FUiA6XHJcbiAgICAgICAgICB2YXIgcyA9IHV0aWxzLnJhbmRvbTAoMyk7XHJcbiAgICAgICAgICByZXR1cm4gXCJodHRwOi8vXCIrc2VydmVyW3NdK1wiLnRpbGUuc3RhbWVuLmNvbS90b25lci9cIit6K1wiL1wiK3R4K1wiL1wiK2d0eStcIi5wbmdcIlxyXG4gIFxyXG4gICAgICAgY2FzZSBTb3VyY2UuSU1BR0VTX1NUQU1FTl9UT05FUl9CRyA6XHJcbiAgICAgICAgICB2YXIgcyA9IHV0aWxzLnJhbmRvbTAoMyk7XHJcbiAgICAgICAgICByZXR1cm4gXCJodHRwOi8vXCIrc2VydmVyW3NdK1wiLnRpbGUuc3RhbWVuLmNvbS90b25lci1iYWNrZ3JvdW5kL1wiK3orXCIvXCIrdHgrXCIvXCIrZ3R5K1wiLnBuZ1wiXHJcbiAgIFxyXG4gICAgICAgICBcclxuICAgICAgY2FzZSBTb3VyY2UuSU1BR0VTX09TTTogIC8vIGh0dHA6Ly93aWtpLm9wZW5zdHJlZXRtYXAub3JnL3dpa2kvVGlsZV91c2FnZV9wb2xpY3lcclxuICAgICAgZGVmYXVsdCA6XHJcbiAgICAgICAgIHZhciBzID0gdXRpbHMucmFuZG9tMCgyKTtcclxuICAgICAgICAgcmV0dXJuIFwiaHR0cDovL1wiK3NlcnZlcltzXStcIi50aWxlLm9wZW5zdHJlZXRtYXAub3JnL1wiK3orXCIvXCIrdHgrXCIvXCIrZ3R5K1wiLnBuZ1wiXHJcbiAgICAgICAgIGJyZWFrO1xyXG5cclxuLy8gICAgICAgIC8vIFVzZSBnb29nbGUgQVBJXHJcbi8vICAgICAgIGNhc2UgU291cmNlLklNQUdFU19HT09HTEVfU0FURUxMSVRFIDpcclxuLy8gICAgICAgICAgcmV0dXJuIFwiaHR0cDovL2tobTEuZ29vZ2xlLmNvbS9raC92PTEyMSZ4PVwiK3R4K1wiJnk9XCIrZ3R5K1wiJno9XCIrelxyXG4vLyAgICAgICBjYXNlIFNvdXJjZS5JTUFHRVNfR09PR0xFX1RFUlJBSU4gOlxyXG4vLyAgICAgICAgICByZXR1cm4gXCJodHRwOi8vbXQwLmdvb2dsZWFwaXMuY29tL3Z0P3g9XCIrdHgrXCImeT1cIitndHkrXCImej1cIit6O1xyXG5cclxuICAgICAgICAgLy8gUEIgSlBHID9cclxuLy8gICAgICBjYXNlIFNvdXJjZS5JUlNfU0FURUxMSVRFOiBcclxuLy8gICAgICAgICByZXR1cm4gXCJodHRwOi8vaXJzLmdpcy1sYWIuaW5mby8/bGF5ZXJzPWxhbmRzYXQmcmVxdWVzdD1HZXRUaWxlJno9XCIreitcIiZ4PVwiK3R4K1wiJnk9XCIrZ3R5O1xyXG4vLyAgICAgICAgIC8vaHR0cDovL2lycy5naXMtbGFiLmluZm8vXHJcbiAgICAgIFxyXG4vLyAgICAgICAgIC8vIENoZWNrIG5va2lhXHJcbi8vICAgXHJcbiAgICAgIFxyXG4vLyAgICAgIGh0dHA6Ly93d3cubmVvbmdlby5jb20vd2lraS9kb2t1LnBocD9pZD1tYXBfc2VydmVyc1xyXG4gICB9XHJcblxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuLyoqXHJcbiAqIFNvdXJjZS5XTVNfQlJFVEFHTkVDQU5UT05TIFxyXG4gKiAgICBnZW8xIDogXCJodHRwOi8vZ2VvYnJldGFnbmUuZnIvZ2Vvc2VydmVyL293cz9TRVJWSUNFPVdNUyZMQVlFUlM9ZDIyJTNBQVNTX0xJTl8yMiZGT1JNQVQ9aW1hZ2UlMkZwbmcmJlZFUlNJT049MS4xLjEmUkVRVUVTVD1HZXRNYXAmU1JTPUVQU0clM0E5MDA5MTMmQkJPWD1cIit0b3BMZWZ0LngrXCIsXCIrdG9wTGVmdC55K1wiLFwiK2JvdHRvbVJpZ2h0LngrXCIsXCIrYm90dG9tUmlnaHQueStcIiZXSURUSD1cIitNYXBlcmlhbC50aWxlU2l6ZStcIiZIRUlHSFQ9XCIrTWFwZXJpYWwudGlsZVNpemVcclxuICogXHJcbiAqIFNvdXJjZS5XTVNfRlJBTkNFQ09VUlNERUFVIFxyXG4gKiBTb3VyY2UuV01TX1NPTFNfSUxFRVRWSUxBSU5FIFxyXG4gKiAgICBnZW8yIDogXCJodHRwOi8vZ2Vvd3d3LmFncm9jYW1wdXMtb3Vlc3QuZnIvZ2Vvc2VydmVyL293cz9TRVJWSUNFPVdNUyZMQVlFUlM9ZnJhbmNlJTNBcmhfZnJhbmNlXzEwMDBoYSZJU0JBU0VMQVlFUj1mYWxzZSZUUkFOU1BBUkVOVD10cnVlJkZPUk1BVD1pbWFnZSUyRnBuZyYmVkVSU0lPTj0xLjEuMSZSRVFVRVNUPUdldE1hcCZTVFlMRVM9JkVYQ0VQVElPTlM9YXBwbGljYXRpb24lMkZ2bmQub2djLnNlX2luaW1hZ2UmU1JTPUVQU0clM0E5MDA5MTMmQkJPWD1cIit0b3BMZWZ0LngrXCIsXCIrdG9wTGVmdC55K1wiLFwiK2JvdHRvbVJpZ2h0LngrXCIsXCIrYm90dG9tUmlnaHQueStcIiZXSURUSD1cIitNYXBlcmlhbC50aWxlU2l6ZStcIiZIRUlHSFQ9XCIrTWFwZXJpYWwudGlsZVNpemVcclxuXHJcbiAqIFNvdXJjZS5XTVNfQ09SSU5FX0xBTkRfQ09WRVIgXHJcbiAqICAgIGdlbzMgOiBcImh0dHA6Ly9zZDE4NzgtMi5zaXZpdC5vcmcvZ2Vvc2VydmVyL2d3Yy9zZXJ2aWNlL3dtcz9TRVJWSUNFPVdNUyZMQVlFUlM9dG9wcCUzQUNMQzA2X1dHUyZUUkFOU1BBUkVOVD10cnVlJkZPUk1BVD1pbWFnZSUyRnBuZyZTRVJWSUNFPVdNUyZWRVJTSU9OPTEuMS4xJlJFUVVFU1Q9R2V0TWFwJlNUWUxFUz0mRVhDRVBUSU9OUz1hcHBsaWNhdGlvbiUyRnZuZC5vZ2Muc2VfaW5pbWFnZSZFUFNHJTNBOTAwOTEzJkJCT1g9XCIrdG9wTGVmdC54K1wiLFwiK3RvcExlZnQueStcIixcIitib3R0b21SaWdodC54K1wiLFwiK2JvdHRvbVJpZ2h0LnkrXCImV0lEVEg9XCIrTWFwZXJpYWwudGlsZVNpemUrXCImSEVJR0hUPVwiK01hcGVyaWFsLnRpbGVTaXplXHJcbiAqLyBcclxuU291cmNlTWFuYWdlci5wcm90b3R5cGUuZ2V0V01TVVJMID0gZnVuY3Rpb24gKHNvdXJjZSwgdHgsIHR5LCB6KSB7XHJcbiAgIFxyXG4gICB2YXIgdG9wTGVmdFAgICAgID0gbmV3IFBvaW50KHR4ICogTWFwZXJpYWwudGlsZVNpemUsIHR5Kk1hcGVyaWFsLnRpbGVTaXplKVxyXG4gICB2YXIgdG9wTGVmdE0gICAgID0gcmVjZWl2ZXIuY29udGV4dC5jb29yZFMuUGl4ZWxzVG9NZXRlcnModG9wTGVmdFAueCwgdG9wTGVmdFAueSwgcmVjZWl2ZXIuY29udGV4dC56b29tKVxyXG4gICBcclxuICAgdmFyIGJvdHRvbVJpZ2h0UCA9IG5ldyBQb2ludCh0b3BMZWZ0UC54ICsgTWFwZXJpYWwudGlsZVNpemUsIHRvcExlZnRQLnkgKyBNYXBlcmlhbC50aWxlU2l6ZSlcclxuICAgdmFyIGJvdHRvbVJpZ2h0TSA9IHJlY2VpdmVyLmNvbnRleHQuY29vcmRTLlBpeGVsc1RvTWV0ZXJzKGJvdHRvbVJpZ2h0UC54LCBib3R0b21SaWdodFAueSwgcmVjZWl2ZXIuY29udGV4dC56b29tKVxyXG5cclxuICAgc3dpdGNoKHNvdXJjZS5wYXJhbXMuc3JjKXtcclxuICAgICAgXHJcbiAgICAgIGNhc2UgU291cmNlLldNU19CUkVUQUdORUNBTlRPTlM6XHJcbiAgICAgICAgIC8vaHR0cDovL3d3dy5tYXBtYXR0ZXJzLm9yZy93bXMvNjAyMjQ2XHJcblxyXG4gICAgICAgICB2YXIgdG9wTGVmdCAgICAgICA9IHRvcExlZnRNO1xyXG4gICAgICAgICB2YXIgYm90dG9tUmlnaHQgICA9IGJvdHRvbVJpZ2h0TTtcclxuICAgICAgICAgXHJcbiAgICAgICAgIHJldHVybihcImh0dHA6Ly9hcGkubWFwZXJpYWwuY29tL2dlbzE/U0VSVklDRT1XTVMmTEFZRVJTPWJ6aCUzQUNBTlRPTiZGT1JNQVQ9aW1hZ2UlMkZwbmcmVkVSU0lPTj0xLjEuMSZSRVFVRVNUPUdldE1hcCZTUlM9RVBTRyUzQTkwMDkxMyZCQk9YPVwiK3RvcExlZnQueCtcIixcIit0b3BMZWZ0LnkrXCIsXCIrYm90dG9tUmlnaHQueCtcIixcIitib3R0b21SaWdodC55K1wiJldJRFRIPVwiK01hcGVyaWFsLnRpbGVTaXplK1wiJkhFSUdIVD1cIitNYXBlcmlhbC50aWxlU2l6ZSlcclxuICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIFNvdXJjZS5XTVNfRlJBTkNFQ09VUlNERUFVOlxyXG4gICAgICAgICAvL2h0dHA6Ly93d3cubWFwbWF0dGVycy5vcmcvd21zLzY0NzE0NVxyXG4gICAgICAgICBcclxuICAgICAgICAgdmFyIHRvcExlZnQgICAgICAgPSB0b3BMZWZ0TTtcclxuICAgICAgICAgdmFyIGJvdHRvbVJpZ2h0ICAgPSBib3R0b21SaWdodE07XHJcblxyXG4gICAgICAgICByZXR1cm4oXCJodHRwOi8vYXBpLm1hcGVyaWFsLmNvbS9nZW8yP1NFUlZJQ0U9V01TJkxBWUVSUz1mcmFuY2UlM0FyaF9mcmFuY2VfMTAwMGhhJklTQkFTRUxBWUVSPWZhbHNlJlRSQU5TUEFSRU5UPXRydWUmRk9STUFUPWltYWdlJTJGcG5nJiZWRVJTSU9OPTEuMS4xJlJFUVVFU1Q9R2V0TWFwJlNUWUxFUz0mRVhDRVBUSU9OUz1hcHBsaWNhdGlvbiUyRnZuZC5vZ2Muc2VfaW5pbWFnZSZTUlM9RVBTRyUzQTkwMDkxMyZCQk9YPVwiK3RvcExlZnQueCtcIixcIit0b3BMZWZ0LnkrXCIsXCIrYm90dG9tUmlnaHQueCtcIixcIitib3R0b21SaWdodC55K1wiJldJRFRIPVwiK01hcGVyaWFsLnRpbGVTaXplK1wiJkhFSUdIVD1cIitNYXBlcmlhbC50aWxlU2l6ZSlcclxuICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIFNvdXJjZS5XTVNfU09MU19JTEVFVFZJTEFJTkU6XHJcbiAgICAgICAgIC8vaHR0cDovL3d3dy5tYXBtYXR0ZXJzLm9yZy93bXMvNjQ3MTQ4XHJcbiAgICAgICAgIFxyXG4gICAgICAgICB2YXIgdG9wTGVmdCAgICAgICA9IHRvcExlZnRNO1xyXG4gICAgICAgICB2YXIgYm90dG9tUmlnaHQgICA9IGJvdHRvbVJpZ2h0TTtcclxuICAgICAgICAgXHJcbiAgICAgICAgIHJldHVybihcImh0dHA6Ly9hcGkubWFwZXJpYWwuY29tL2dlbzI/U0VSVklDRT1XTVMmTEFZRVJTPWlnY3MlM0F1Y3MzNSZJU0JBU0VMQVlFUj1mYWxzZSZUUkFOU1BBUkVOVD10cnVlJkZPUk1BVD1pbWFnZSUyRnBuZyYmVkVSU0lPTj0xLjEuMSZSRVFVRVNUPUdldE1hcCZTVFlMRVM9JkVYQ0VQVElPTlM9YXBwbGljYXRpb24lMkZ2bmQub2djLnNlX2luaW1hZ2UmU1JTPUVQU0clM0E5MDA5MTMmQkJPWD1cIit0b3BMZWZ0LngrXCIsXCIrdG9wTGVmdC55K1wiLFwiK2JvdHRvbVJpZ2h0LngrXCIsXCIrYm90dG9tUmlnaHQueStcIiZXSURUSD1cIitNYXBlcmlhbC50aWxlU2l6ZStcIiZIRUlHSFQ9XCIrTWFwZXJpYWwudGlsZVNpemUpXHJcbiAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBTb3VyY2UuV01TX0NPUklORV9MQU5EX0NPVkVSOlxyXG5cclxuICAgICAgICAgdmFyIHRvcExlZnQgICAgICAgPSB0b3BMZWZ0TTtcclxuICAgICAgICAgdmFyIGJvdHRvbVJpZ2h0ICAgPSBib3R0b21SaWdodE07XHJcblxyXG4gICAgICAgICByZXR1cm4oXCJodHRwOi8vYXBpLm1hcGVyaWFsLmNvbS9nZW8zP1NFUlZJQ0U9V01TJkxBWUVSUz10b3BwJTNBQ0xDMDZfV0dTJklTQkFTRUxBWUVSPWZhbHNlJlRSQU5TUEFSRU5UPXRydWUmRk9STUFUPWltYWdlJTJGcG5nJiZWRVJTSU9OPTEuMS4xJlJFUVVFU1Q9R2V0TWFwJlNUWUxFUz0mRVhDRVBUSU9OUz1hcHBsaWNhdGlvbiUyRnZuZC5vZ2Muc2VfaW5pbWFnZSZTUlM9RVBTRyUzQTkwMDkxMyZCQk9YPVwiK3RvcExlZnQueCtcIixcIit0b3BMZWZ0LnkrXCIsXCIrYm90dG9tUmlnaHQueCtcIixcIitib3R0b21SaWdodC55K1wiJldJRFRIPVwiK01hcGVyaWFsLnRpbGVTaXplK1wiJkhFSUdIVD1cIitNYXBlcmlhbC50aWxlU2l6ZSlcclxuICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICBcclxuLy8gICAgICBjYXNlIFNvdXJjZS5XTVM0OlxyXG4gICAgICAgICAvLyBodHRwOi8vd3d3Lm1hcG1hdHRlcnMub3JnL3dtcy82MjQwOTdcclxuICAgICAgICAgLy8gaHR0cDovL3d3dy5tYXBtYXR0ZXJzLm9yZy93bXMvNjAzNTk0XHJcbiAgICAgICAgIC8vIGh0dHA6Ly93d3cubWFwbWF0dGVycy5vcmcvc2VydmVyLzQxMTRcclxuICAgICAgICAgLy8gQnJldGFnbmUgOiBodHRwOi8vd3d3Lm1hcG1hdHRlcnMub3JnL3NlcnZlci8zNTI1ICAgKGxldXJzIHBuZyBuJ29udCBwYXMgZGFscGhhIDooIClcclxuLy8gICAgICAgICBcclxuLy8gICAgICAgICBcclxuLy8gICAgICAgICBjb25zb2xlLmxvZyhcImh0dHA6Ly93cy5jYXJtZW4uZGV2ZWxvcHBlbWVudC1kdXJhYmxlLmdvdXYuZnIvY2dpLWJpbi9tYXBzZXJ2P21hcD0vbW50L2RhdGFfY2FybWVuL1BBQ0EvUHVibGljYXRpb24vZW52aXJvbm5lbWVudC5tYXAmTEFZRVJTPWxheWVyMjI3JklTQkFTRUxBWUVSPWZhbHNlJlRSQU5TUEFSRU5UPXRydWUmRk9STUFUPWltYWdlJTJGcG5nJlNFUlZJQ0U9V01TJlZFUlNJT049MS4xLjEmUkVRVUVTVD1HZXRNYXAmU1RZTEVTPSZFWENFUFRJT05TPWFwcGxpY2F0aW9uJTJGdm5kLm9nYy5zZV9pbmltYWdlJlNSUz1FUFNHJTNBMjE1NCZCQk9YPVwiK3RvcExlZnQueCtcIixcIit0b3BMZWZ0LnkrXCIsXCIrYm90dG9tUmlnaHQueCtcIixcIitib3R0b21SaWdodC55K1wiJldJRFRIPVwiK01hcGVyaWFsLnRpbGVTaXplK1wiJkhFSUdIVD1cIitNYXBlcmlhbC50aWxlU2l6ZSlcclxuLy8gICAgICAgICBicmVhaztcclxuICAgICAgICAgXHJcbiAgICAgICAgIFxyXG4gICAgICAgICBicmVhaztcclxuICAgICAgICAgXHJcbiAgICAgIGRlZmF1bHQgOlxyXG4gICAgICAgICB2YXIgdG9wTGVmdCAgICAgICA9IHRvcExlZnRNO1xyXG4gICAgICAgICB2YXIgYm90dG9tUmlnaHQgICA9IGJvdHRvbVJpZ2h0TTtcclxuICAgICAgXHJcbiAgICAgICAgIHJldHVybihzb3VyY2UucGFyYW1zLnNyYyArIFwiJkJCT1g9XCIrdG9wTGVmdC54K1wiLFwiK3RvcExlZnQueStcIixcIitib3R0b21SaWdodC54K1wiLFwiK2JvdHRvbVJpZ2h0LnkrXCImV0lEVEg9XCIrTWFwZXJpYWwudGlsZVNpemUrXCImSEVJR0hUPVwiK01hcGVyaWFsLnRpbGVTaXplKVxyXG4gICAgICAgICBcclxuICAgfVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvdXJjZU1hbmFnZXI7XHJcbiIsIi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbnZhciBWZWN0b3JpYWxTdHlsZSAgICAgPSByZXF1aXJlKCcuLi9tb2RlbHMvdmVjdG9yaWFsLXN0eWxlLmpzJyksXHJcbiAgICBTdHlsZSAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi9tb2RlbHMvc3R5bGUuanMnKTtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbmZ1bmN0aW9uIFN0eWxlTWFuYWdlcigpe1xyXG4gICB0aGlzLnN0eWxlcyA9IHt9O1xyXG5cclxuICAgd2luZG93Lm1hcGVyaWFsU3R5bGVzICAgPSB3aW5kb3cubWFwZXJpYWxTdHlsZXMgfHwge307ICAvLyBjYWNoZSBjb250YWluaW5nIGFsbCBwcmV2aW91c2x5IGxvYWRlZCBzdHlsZXNcclxuICAgd2luZG93Lm1hcGVyaWFsU3ltYiAgICAgPSB3aW5kb3cubWFwZXJpYWxTeW1iICAgfHwge307ICBcclxuICAgd2luZG93Lm1hcGVyaWFsRm9udCAgICAgPSB3aW5kb3cubWFwZXJpYWxGb250ICAgfHwge307XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblN0eWxlTWFuYWdlci5wcm90b3R5cGUuZ2V0U3R5bGUgPSBmdW5jdGlvbih1aWQpe1xyXG4gICByZXR1cm4gd2luZG93Lm1hcGVyaWFsU3R5bGVzW3VpZF07XHJcbn1cclxuXHJcblN0eWxlTWFuYWdlci5wcm90b3R5cGUuYWRkU3R5bGUgPSBmdW5jdGlvbiAoIHN0eWxlICkge1xyXG4gICB3aW5kb3cubWFwZXJpYWxTdHlsZXNbc3R5bGUudWlkXSA9IHN0eWxlO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5TdHlsZU1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUN1c3RvbVN0eWxlID0gZnVuY3Rpb24gKCBwYXJhbXMgKSB7XHJcblxyXG4gICB2YXIgc3R5bGUgPSBuZXcgVmVjdG9yaWFsU3R5bGUoe1xyXG4gICAgICAgICB0eXBlICAgICAgICAgICAgICA6IFN0eWxlLkN1c3RvbSxcclxuICAgICAgICAgc3ltYm9sICAgICAgICAgICAgOiBwYXJhbXMuc3ltYm9sLFxyXG4gICAgICAgICBob3Jpem9udGFsQWxpZ24gICA6IHBhcmFtcy5ob3Jpem9udGFsQWxpZ24sXHJcbiAgICAgICAgIHZlcnRpY2FsQWxpZ24gICAgIDogcGFyYW1zLnZlcnRpY2FsQWxpZ24sXHJcbiAgICAgIH0pO1xyXG5cclxuICAgdGhpcy5hZGRTdHlsZShzdHlsZSk7XHJcbiAgIHJldHVybiBzdHlsZTtcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuU3R5bGVNYW5hZ2VyLnByb3RvdHlwZS5nZXRTeW1iVVJMID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICByZXR1cm4gTWFwZXJpYWwuc3RhdGljVVJMICsgXCIvXCIgKyBuYW1lO1xyXG59XHJcblxyXG5TdHlsZU1hbmFnZXIucHJvdG90eXBlLmdldEZvbnRVUkwgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgIHJldHVybiBNYXBlcmlhbC5zdGF0aWNVUkwgKyBcIi9mb250L1wiICsgbmFtZS5yZXBsYWNlKFwiIFwiLFwiX1wiKSArIFwiXzQwMC5mb250LmpzXCI7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblN0eWxlTWFuYWdlci5wcm90b3R5cGUuTG9hZEZvbnRMaXN0ID0gZnVuY3Rpb24oZm9udExpc3QsbmV4dCkge1xyXG4gICB2YXIgbG9hZGVkICAgPSAwO1xyXG4gICB2YXIgbmJUb0xvYWQgPSBPYmplY3Qua2V5cyhmb250TGlzdCkubGVuZ3RoO1xyXG4gICBcclxuICAgaWYgKCBuYlRvTG9hZCA9PSAwICkgIHtcclxuICAgICAgbmV4dCgpO1xyXG4gICAgICByZXR1cm47XHJcbiAgIH1cclxuXHJcbiAgIGZvciAoIHZhciBrZXkgaW4gZm9udExpc3QgKSB7XHJcbiAgICAgIGlmICgga2V5IGluIHdpbmRvdy5tYXBlcmlhbEZvbnQgKSB7XHJcbiAgICAgICAgIGxvYWRlZCA9IGxvYWRlZCArIDFcclxuICAgICAgICAgaWYgKCBsb2FkZWQgPT0gbmJUb0xvYWQgKSBuZXh0KCk7IFxyXG4gICAgICAgICBjb250aW51ZVxyXG4gICAgICB9XHJcbiAgICAgIC8vXHJcbiAgICAgIHVybCA9IHRoaXMuZ2V0Rm9udFVSTChrZXkpXHJcbiAgICAgIHZhciByZXEgPSAkLmFqYXgoeyAgXHJcbiAgICAgICAgIHR5cGU6IFwiR0VUXCIsICBcclxuICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgIGRhdGFUeXBlIDogXCJzY3JpcHRcIixcclxuICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKF9kYXRhKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5tYXBlcmlhbEZvbnRba2V5XSA9IHRydWU7XHJcbiAgICAgICAgICAgIGxvYWRlZCA9IGxvYWRlZCArIDFcclxuICAgICAgICAgICAgaWYgKCBsb2FkZWQgPT0gbmJUb0xvYWQgKSBuZXh0KCk7IFxyXG4gICAgICAgICB9LFxyXG4gICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB3aW5kb3cubWFwZXJpYWxGb250W2tleV0gPSBmYWxzZTtcclxuICAgICAgICAgICAgbG9hZGVkID0gbG9hZGVkICsgMVxyXG4gICAgICAgICAgICBpZiAoIGxvYWRlZCA9PSBuYlRvTG9hZCApIG5leHQoKTsgXHJcbiAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgIH1cclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuU3R5bGVNYW5hZ2VyLnByb3RvdHlwZS5Mb2FkU3ltYkxpc3QgPSBmdW5jdGlvbihzeW1iTGlzdCxuZXh0KSB7XHJcbiAgIHZhciBsb2FkZWQgICA9IDA7XHJcbiAgIHZhciBuYlRvTG9hZCA9IE9iamVjdC5rZXlzKHN5bWJMaXN0KS5sZW5ndGg7XHJcbiAgIFxyXG4gICBpZiAoIG5iVG9Mb2FkID09IDAgKSAge1xyXG4gICAgICBuZXh0KCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgfVxyXG4gICBcclxuICAgZm9yICggdmFyIGtleSBpbiBzeW1iTGlzdCApIHtcclxuICAgICAgaWYgKCBrZXkgaW4gd2luZG93Lm1hcGVyaWFsU3ltYiApe1xyXG4gICAgICAgICBsb2FkZWQgPSBsb2FkZWQgKyAxXHJcbiAgICAgICAgIGlmICggbG9hZGVkID09IG5iVG9Mb2FkICkgbmV4dCgpOyBcclxuICAgICAgICAgY29udGludWVcclxuICAgICAgfVxyXG4gICAgICB1cmwgPSB0aGlzLmdldFN5bWJVUkwoa2V5KVxyXG4gICAgICB3aW5kb3cubWFwZXJpYWxTeW1iW2tleV0gPSBuZXcgT2JqZWN0KClcclxuICAgICAgLy93aW5kb3cubWFwZXJpYWxTeW1iW2tleV0uZGF0YSA9IG51bGw7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgX2tleSA9IGtleTtcclxuICAgICAgaWYgKCBrZXkuaW5kZXhPZihcIi5zdmdcIikgPT0gLTEgKSAge1xyXG4gICAgICAgICB3aW5kb3cubWFwZXJpYWxTeW1iW2tleV0udHlwZSA9IFwiaW1nXCI7XHJcbiAgICAgICAgIHZhciByZXEgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgcmVxLl9rZXkgPSBfa2V5O1xyXG4gICAgICAgICAvL2h0dHA6Ly9ibG9nLmNocm9taXVtLm9yZy8yMDExLzA3L3VzaW5nLWNyb3NzLWRvbWFpbi1pbWFnZXMtaW4td2ViZ2wtYW5kLmh0bWxcclxuICAgICAgICAgcmVxLmNyb3NzT3JpZ2luID0gJyc7IC8vIG5vIGNyZWRlbnRpYWxzIGZsYWcuIFNhbWUgYXMgaW1nLmNyb3NzT3JpZ2luPSdhbm9ueW1vdXMnXHJcbiAgICAgICAgIHJlcS5vbmxvYWQgPSBmdW5jdGlvbiAob0V2ZW50KSB7ICAgIFxyXG4gICAgICAgICAgICB3aW5kb3cubWFwZXJpYWxTeW1iW3RoaXMuX2tleV0uZGF0YSA9IHRoaXM7XHJcbiAgICAgICAgICAgIGxvYWRlZCA9IGxvYWRlZCArIDFcclxuICAgICAgICAgICAgaWYgKCBsb2FkZWQgPT0gbmJUb0xvYWQgKSBuZXh0KCk7XHJcbiAgICAgICAgIH07XHJcbiAgICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKG9FdmVudCkge1xyXG4gICAgICAgICAgICBsb2FkZWQgPSBsb2FkZWQgKyAxXHJcbiAgICAgICAgICAgIGlmICggbG9hZGVkID09IG5iVG9Mb2FkICkgbmV4dCgpO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIHJlcS5zcmMgPSB1cmw7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgIHdpbmRvdy5tYXBlcmlhbFN5bWJba2V5XS50eXBlID0gXCJzdmdcIjtcclxuICAgICAgICAgXHJcbiAgICAgICAgIHZhciByZXEgPSAkLmFqYXgoeyAgXHJcbiAgICAgICAgICAgIHR5cGU6IFwiR0VUXCIsICBcclxuICAgICAgICAgICAgX2tleSA6IF9rZXkgLFxyXG4gICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgZGF0YVR5cGUgOiBcInhtbFwiLC8vXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChfZGF0YSkge1xyXG4gICAgICAgICAgICAgICB3aW5kb3cubWFwZXJpYWxTeW1iW3RoaXMuX2tleV0uZGF0YSA9IF9kYXRhXHJcbiAgICAgICAgICAgICAgIGxvYWRlZCA9IGxvYWRlZCArIDFcclxuICAgICAgICAgICAgICAgaWYgKCBsb2FkZWQgPT0gbmJUb0xvYWQgKSBuZXh0KCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgIGxvYWRlZCA9IGxvYWRlZCArIDFcclxuICAgICAgICAgICAgICAgaWYgKCBsb2FkZWQgPT0gbmJUb0xvYWQgKSBuZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgfVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlTWFuYWdlcjtcclxuIiwiLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG52YXIgQ29vcmRpbmF0ZVN5c3RlbSA9IHJlcXVpcmUoJy4uL2xpYnMvY29vcmRpbmF0ZS1zeXN0ZW0uanMnKTtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5mdW5jdGlvbiBNYXBDb250ZXh0IChtYXBWaWV3KSB7XG4gICBcbiAgIHRoaXMubWFwVmlldyAgICAgICAgICAgID0gbWFwVmlld1xuICAgXG4gICB0aGlzLmFzc2V0cyAgICAgICAgICAgICA9IG51bGxcbiAgIHRoaXMuY29vcmRTICAgICAgICAgICAgID0gbmV3IENvb3JkaW5hdGVTeXN0ZW0gKCBNYXBlcmlhbC50aWxlU2l6ZSApO1xuXG4gICB0aGlzLmNlbnRlck0gICAgICAgICAgICA9IHRoaXMuY29vcmRTLkxhdExvblRvTWV0ZXJzKCB0aGlzLnN0YXJ0TGF0aXR1ZGUoKSAsIHRoaXMuc3RhcnRMb25naXR1ZGUoKSApO1xuICAgdGhpcy5tb3VzZU0gICAgICAgICAgICAgPSB0aGlzLmNlbnRlck07ICAgICAvLyBNb3VzZSBjb29yZGluYXRlcyBpbiBtZXRlcnNcbiAgIHRoaXMubW91c2VQICAgICAgICAgICAgID0gbnVsbDsgICAgICAgICAgICAgLy8gTW91c2UgY29vcmRpbmF0ZXMgaW5zaWRlIHRoZSBjYW52YXNcbiAgIHRoaXMuem9vbSAgICAgICAgICAgICAgID0gdGhpcy5zdGFydFpvb20oKTtcblxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuTWFwQ29udGV4dC5wcm90b3R5cGUuc3RhcnRab29tID0gZnVuY3Rpb24oKSB7XG4gICBcbiAgIC8vIE9wdGlvbnNcbiAgIGlmKHRoaXMubWFwVmlldy5vcHRpb25zLmRlZmF1bHRab29tKVxuICAgICAgcmV0dXJuIHRoaXMubWFwVmlldy5vcHRpb25zLmRlZmF1bHRab29tO1xuICAgXG4gICAvLyBEZWZhdWx0XG4gICBlbHNlXG4gICAgICByZXR1cm4gTWFwZXJpYWwuREVGQVVMVF9aT09NO1xuICAgXG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuTWFwQ29udGV4dC5wcm90b3R5cGUuc3RhcnRMYXRpdHVkZSA9IGZ1bmN0aW9uKCkge1xuICAgXG4gICAvLyBCb3VuZGluZ0JveFxuICAgaWYodGhpcy5sYXRNaW4pXG4gICAgICByZXR1cm4gKHRoaXMubGF0TWluICsgdGhpcy5sYXRNYXgpLzI7XG4gICBcbiAgIC8vIE9wdGlvbnNcbiAgIGVsc2UgaWYodGhpcy5tYXBWaWV3Lm9wdGlvbnMubGF0aXR1ZGUpIFxuICAgICAgcmV0dXJuIHRoaXMubWFwVmlldy5vcHRpb25zLmxhdGl0dWRlO1xuICAgXG4gICAvLyBEZWZhdWx0XG4gICBlbHNlICAgICAgICAgXG4gICAgICByZXR1cm4gTWFwZXJpYWwuREVGQVVMVF9MQVRJVFVERTtcbiAgIFxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbk1hcENvbnRleHQucHJvdG90eXBlLnN0YXJ0TG9uZ2l0dWRlID0gZnVuY3Rpb24oKSB7XG4gICBcbiAgIC8vIEJvdW5kaW5nQm94XG4gICBpZih0aGlzLmxvbk1pbikgICAgICAgXG4gICAgICByZXR1cm4gKHRoaXMubG9uTWluICsgdGhpcy5sb25NYXgpLzI7XG4gICBcbiAgIC8vIE9wdGlvbnNcbiAgIGVsc2UgaWYodGhpcy5tYXBWaWV3Lm9wdGlvbnMubG9uZ2l0dWRlKSAgICAgXG4gICAgICByZXR1cm4gdGhpcy5tYXBWaWV3Lm9wdGlvbnMubG9uZ2l0dWRlO1xuICAgXG4gICAvLyBEZWZhdWx0XG4gICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgIHJldHVybiBNYXBlcmlhbC5ERUZBVUxUX0xPTkdJVFVERTtcbiAgIFxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gTWFwQ29udGV4dDsiLCIvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbnZhciBNYXBDb250ZXh0ICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vbWFwLWNvbnRleHQuanMnKSxcbiAgICBNb3VzZUxpc3RlbmVyICAgICAgICAgICA9IHJlcXVpcmUoJy4vbW91c2UtbGlzdGVuZXIuanMnKSxcbiAgICBNYXBSZW5kZXJlciAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL21hcC1yZW5kZXJlci5qcycpLFxuICAgIExheWVyTWFuYWdlciAgICAgICAgICAgID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9sYXllci1tYW5hZ2VyLmpzJyksXG4gICAgTGF5ZXIgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL21vZGVscy9sYXllci5qcycpLFxuICAgIHV0aWxzICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vLi4vdG9vbHMvdXRpbHMuanMnKTtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5mdW5jdGlvbiBNYXBWaWV3KG1hcGVyaWFsLCBvcHRpb25zKXtcblxuICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG4gICBcbiAgIGNvbnNvbGUubG9nKFwiICBwcmVwYXJlIE1hcFZpZXcgOiBcIiArIG9wdGlvbnMuY29udGFpbmVyLmlkKTtcbiAgIFxuICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbiAgIHRoaXMubWFwZXJpYWwgICAgICAgICAgID0gbWFwZXJpYWw7XG4gICB0aGlzLm9wdGlvbnMgICAgICAgICAgICA9IG9wdGlvbnM7XG4gICB0aGlzLmlkICAgICAgICAgICAgICAgICA9IHV0aWxzLmdlbmVyYXRlVUlEKCkgKyBcIl9cIiArIHRoaXMub3B0aW9ucy5jb250YWluZXIuaWQ7XG4gICB0aGlzLnR5cGUgICAgICAgICAgICAgICA9IG9wdGlvbnMudHlwZTtcbiAgIFxuICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbiAgIHRoaXMucHJlcGFyZUNvbnRhaW5lcigpO1xuICAgbmV3IE1vdXNlTGlzdGVuZXIodGhpcyk7XG4gICBcbiAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG4gICB0aGlzLmxheWVycyAgICAgICAgICAgICA9IFtdIC8vIGFycmF5IHRvIHVzZSBwdXNoIGFuZCBzcGxpY2UgOiBpbmRleCBpcyB1c2VmdWwgaGVyZVxuICAgdGhpcy50aWxlcyAgICAgICAgICAgICAgPSB7fSAvLyBoYXNobWFwIDogdGlsZXNba2V5XSA9IHRpbGVcbiAgIHRoaXMuZHluYW1pY2FsUmVuZGVyZXJzID0ge30gLy8gaGFzaG1hcCA6IGR5bmFtaWNhbFJlbmRlcmVyc1tkeW5hbWljYWxEYXRhLmlkXSA9IGR5bmFtaWNhbFJlbmRlcmVyXG4gICBcbiAgIHRoaXMuY29udGV4dCAgICAgICAgICAgID0gbmV3IE1hcENvbnRleHQodGhpcyk7XG4gICBcbiAgIHRoaXMubWFwUmVuZGVyZXIgICAgICAgID0gbmV3IE1hcFJlbmRlcmVyKHRoaXMpO1xuICAgdGhpcy5sYXllck1hbmFnZXIgICAgICAgPSBuZXcgTGF5ZXJNYW5hZ2VyKHRoaXMpO1xuXG4gICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cbiAgIFxuICAgdGhpcy5zaGFkZXJzICAgICAgICAgICAgPSBbTWFwZXJpYWwuQWxwaGFDbGlwLCBNYXBlcmlhbC5BbHBoYUJsZW5kLCBNYXBlcmlhbC5NdWxCbGVuZF07XG5cbn07XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cbi8vIENvbnRhaW5lclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5NYXBWaWV3LnByb3RvdHlwZS5wcmVwYXJlQ29udGFpbmVyID0gZnVuY3Rpb24gKCkgICB7XG4gICBcbiAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICB0aGlzLmNhbnZhcy5jbGFzc05hbWUgPSB0aGlzLnR5cGU7XG4gICB0aGlzLm9wdGlvbnMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTsgXG5cbiAgIHRoaXMud2lkdGggICAgICAgPSB0aGlzLm9wdGlvbnMuY29udGFpbmVyLmNsaWVudFdpZHRoO1xuICAgdGhpcy5oZWlnaHQgICAgICA9IHRoaXMub3B0aW9ucy5jb250YWluZXIuY2xpZW50SGVpZ2h0O1xuICAgXG4gICB0aGlzLnNldENhbnZhc1NpemUoKTtcbn1cblxuTWFwVmlldy5wcm90b3R5cGUuc2V0Q2FudmFzU2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy53aWR0aDsgICBcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmhlaWdodDsgICBcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuLy8gQVBJXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbk1hcFZpZXcucHJvdG90eXBlLmFkZEltYWdlTGF5ZXIgPSBmdW5jdGlvbiAoc291cmNlSWQpICAge1xuICAgdGhpcy5sYXllck1hbmFnZXIuYWRkTGF5ZXIoTGF5ZXIuSW1hZ2VzLCBzb3VyY2VJZClcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5NYXBWaWV3LnByb3RvdHlwZS5hZGRPU01MYXllciA9IGZ1bmN0aW9uIChzdHlsZUlkKSAgIHtcbiAgIFxuICAgaWYoIXN0eWxlSWQpXG4gICAgICBzdHlsZUlkID0gTWFwZXJpYWwuREVGQVVMVF9TVFlMRV9VSURcbiAgICAgIFxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbk1hcFZpZXcucHJvdG90eXBlLmFkZER5bmFtaWNhbExheWVyID0gZnVuY3Rpb24gKGR5bmFtaWNhbERhdGEsIG9wdGlvbnMpICAge1xuICAgXG4gICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIC8vIENoZWNraW5nIG9wdGlvbnNcbiAgIFxuICAgdmFyIG9wdGlvbnMgPSB1dGlscy5wcmVwYXJlT3B0aW9ucyhvcHRpb25zLCBcInN0eWxlXCIpO1xuICAgaWYoIW9wdGlvbnMpe1xuICAgICAgY29uc29sZS5sb2coXCJXcm9uZyBjYWxsIHRvIGFkZER5bmFtaWNhbExheWVyLiBDaGVjayB0aGUgb3B0aW9uc1wiKTtcbiAgIH1cbiAgIFxuICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAvLyBQcm9jZWVkXG5cbiAgIHRoaXMubGF5ZXJNYW5hZ2VyLmFkZExheWVyKExheWVyLkR5bmFtaWNhbCwge1xuICAgICAgbWFwVmlldyAgICAgICAgICAgOiB0aGlzLCBcbiAgICAgIGR5bmFtaWNhbERhdGEgICAgIDogZHluYW1pY2FsRGF0YSwgXG4gICAgICBzdHlsZSAgICAgICAgICAgICA6IG9wdGlvbnMuc3R5bGVcbiAgIH0pO1xuXG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuTWFwVmlldy5wcm90b3R5cGUuYWRkSGVhdG1hcExheWVyID0gZnVuY3Rpb24gKGhlYXRtYXBEYXRhLCBvcHRpb25zKSAgIHtcbiAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBDaGVja2luZyBvcHRpb25zXG4gICAgXG4gICAgdmFyIG9wdGlvbnMgPSB1dGlscy5wcmVwYXJlT3B0aW9ucyhvcHRpb25zLCBcImNvbG9yYmFyXCIpO1xuICAgIGlmKCFvcHRpb25zKXtcbiAgICAgICAgY29uc29sZS5sb2coXCJXcm9uZyBjYWxsIHRvIGFkZEhlYXRtYXBMYXllci4gQ2hlY2sgdGhlIG9wdGlvbnNcIik7XG4gICAgfVxuICAgIFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFByb2NlZWRcbiAgICBcbiAgICB0aGlzLmxheWVyTWFuYWdlci5hZGRMYXllcihMYXllci5IZWF0LCB7XG4gICAgICAgIG1hcFZpZXcgICAgICAgIDogdGhpcywgXG4gICAgICAgIGhlYXRtYXBEYXRhICAgIDogaGVhdG1hcERhdGEsIFxuICAgICAgICBjb2xvcmJhciAgICAgICA6IG9wdGlvbnMuY29sb3JiYXIsXG4gICAgICAgIG9wdGlvbnMgICAgICAgIDogb3B0aW9uc1xuICAgIH0pO1xuICAgIFxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbk1hcFZpZXcucHJvdG90eXBlLmFkZFJhc3RlckxheWVyICAgICAgPSBmdW5jdGlvbiAob3B0aW9ucykgICB7fVxuTWFwVmlldy5wcm90b3R5cGUuYWRkU2hhZGVMYXllciAgICAgICA9IGZ1bmN0aW9uIChvcHRpb25zKSAgIHt9XG5NYXBWaWV3LnByb3RvdHlwZS5hZGRXTVNMYXllciAgICAgICAgID0gZnVuY3Rpb24gKG9wdGlvbnMpICAge31cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcFZpZXc7XG4iLCIvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbnZhciBNYXBWaWV3ICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vbWFwLXZpZXcuanMnKSxcbiAgICBTb3VyY2VNYW5hZ2VyICAgICAgICAgICA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvc291cmNlLW1hbmFnZXIuanMnKSxcbiAgICBTdHlsZU1hbmFnZXIgICAgICAgICAgICA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvc3R5bGUtbWFuYWdlci5qcycpLFxuICAgIENvbG9yYmFyTWFuYWdlciAgICAgICAgID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9jb2xvcmJhci1tYW5hZ2VyLmpzJyksXG4gICAgRHluYW1pY2FsRGF0YSAgICAgICAgICAgPSByZXF1aXJlKCcuL21vZGVscy9kYXRhL2R5bmFtaWNhbC1kYXRhLmpzJyksXG4gICAgSGVhdG1hcERhdGEgICAgICAgICAgICAgPSByZXF1aXJlKCcuL21vZGVscy9kYXRhL2hlYXRtYXAtZGF0YS5qcycpLFxuICAgIFNvdXJjZSAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9tb2RlbHMvc291cmNlLmpzJyksXG4gICAgdXRpbHMgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi8uLi90b29scy91dGlscy5qcycpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbmZ1bmN0aW9uIE1hcGVyaWFsKG9wdGlvbnMpe1xuICAgY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiKTtcbiAgIGNvbnNvbGUubG9nKFwiQ3JlYXRpbmcgYSBNYXBlcmlhbFwiKTtcbiAgIHRoaXMub3B0aW9ucyAgID0gb3B0aW9ucztcbiAgIHRoaXMudmlld3MgICAgID0ge307XG4gICBcbiAgIC8qIGdsb2JhbCBjb250ZW50ICovXG4gICB3aW5kb3cuc291cmNlTWFuYWdlciAgICA9IHdpbmRvdy5zb3VyY2VNYW5hZ2VyICAgICB8fCBuZXcgU291cmNlTWFuYWdlcigpO1xuICAgd2luZG93LnN0eWxlTWFuYWdlciAgICAgPSB3aW5kb3cuc3R5bGVNYW5hZ2VyICAgICAgfHwgbmV3IFN0eWxlTWFuYWdlcigpO1xuICAgd2luZG93LmNvbG9yYmFyTWFuYWdlciAgPSB3aW5kb3cuY29sb3JiYXJNYW5hZ2VyICAgfHwgbmV3IENvbG9yYmFyTWFuYWdlcigpO1xuICAgXG4gICAvKiBnbG9iYWwgZW50aXRpZXMgZm9yIEFQSSovXG4gICB3aW5kb3cuRHluYW1pY2FsRGF0YSA9IER5bmFtaWNhbERhdGE7XG4gICB3aW5kb3cuSGVhdG1hcERhdGEgICA9IEhlYXRtYXBEYXRhO1xuICAgd2luZG93LlNvdXJjZSAgICAgICAgPSBTb3VyY2U7XG59O1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG4vL1ZpZXdzIHR5cGVzXG4vL1RZUEUgPSBjc3MgY2xhc3NcblxuTWFwZXJpYWwuTUFJTiAgICAgICAgICAgICAgICAgICAgPSBcIm1hcGVyaWFsLW1haW5cIjtcbk1hcGVyaWFsLkFOQ0hPUiAgICAgICAgICAgICAgICAgID0gXCJtYXBlcmlhbC1hbmNob3JcIjtcbk1hcGVyaWFsLkxFTlMgICAgICAgICAgICAgICAgICAgID0gXCJtYXBlcmlhbC1sZW5zXCI7ICAgICAgLy8gY2FtZXJhIGNlbnRlcmVkIG9uIHdoYXQgaXMgdW5kZXIgaXRcbk1hcGVyaWFsLk1JTklGSUVSICAgICAgICAgICAgICAgID0gXCJtYXBlcmlhbC1taW5pZmllclwiOyAgIC8vIGNhbWVyYSBjZW50ZXJlZCBvbiB0aGUgcGFyZW50J3MgY2VudGVyXG5NYXBlcmlhbC5NQUdOSUZJRVIgICAgICAgICAgICAgICA9IFwibWFwZXJpYWwtbWFnbmlmaWVyXCI7ICAvLyBjYW1lcmEgY2VudGVyZWQgb24gd2hhdCBpcyB1bmRlciB0aGUgbW91c2VcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuLy9WZWN0b3JpYWwgbGF5ZXJzIHR5cGVzXG5cbk1hcGVyaWFsLk9TTSAgICAgICAgICAgICAgICAgICAgID0gXCJ0aWxlc1wiOyAgIFxuTWFwZXJpYWwuVkVDVE9SSUFMX0RBVEEgICAgICAgICAgPSBcImRhdGFcIjtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5NYXBlcmlhbC5zdGF0aWNVUkwgICAgICAgICAgICAgID0gKHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5pbmRleE9mKFwibG9jYWxob3N0XCIpICE9PSAtMSkgPyAnaHR0cDovL3N0YXRpYy5tYXBlcmlhbC5sb2NhbGhvc3QnIDogJ2h0dHA6Ly9zdGF0aWMubWFwZXJpYWwuY29tJztcblxuTWFwZXJpYWwuYXBpVVJMICAgICAgICAgICAgICAgICA9ICdodHRwOi8vYXBpLm1hcGVyaWFsLmNvbSc7XG5NYXBlcmlhbC50aWxlVVJMICAgICAgICAgICAgICAgID0gJ2h0dHA6Ly9hcGkubWFwZXJpYWwuY29tJztcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5NYXBlcmlhbC5ERUZBVUxUX1pPT00gICAgICAgICAgID0gMTA7XG5NYXBlcmlhbC5ERUZBVUxUX0xBVElUVURFICAgICAgID0gNDguODEzO1xuTWFwZXJpYWwuREVGQVVMVF9MT05HSVRVREUgICAgICA9IDIuMzEzO1xuXG4vL0NsZXJtb250IENpdHlcbi8vTWFwZXJpYWwuREVGQVVMVF9MQVRJVFVERSAgICAgICA9IDQ1Ljc3OTAxNztcbi8vTWFwZXJpYWwuREVGQVVMVF9MT05HSVRVREUgICAgICA9IDMuMTA2MTc7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuTWFwZXJpYWwuYmdkaW1nICAgICAgICAgICAgICAgICA9IFwic3ltYm9scy93YXRlci5wbmdcIjtcblxuTWFwZXJpYWwucmVmcmVzaFJhdGUgICAgICAgICAgICA9IDEwMDAvMzA7ICAgLy8gbXNcbk1hcGVyaWFsLnRpbGVETFRpbWVPdXQgICAgICAgICAgPSA2MDAwMDsgICAgIC8vIG1zXG5NYXBlcmlhbC50aWxlU2l6ZSAgICAgICAgICAgICAgID0gMjU2O1xuXG5NYXBlcmlhbC5hdXRvTW92ZVNwZWVkUmF0ZSAgICAgID0gMC4yO1xuTWFwZXJpYWwuYXV0b01vdmVNaWxsaXMgICAgICAgICA9IDcwMDtcbk1hcGVyaWFsLmF1dG9Nb3ZlRGVjZWxlcmF0aW9uICAgPSAwLjAwNTtcbk1hcGVyaWFsLmF1dG9Nb3ZlQW5hbHlzZVNpemUgICAgPSAxMDtcblxuTWFwZXJpYWwuREVGQVVMVF9TVFlMRV9VSUQgICAgICA9IFwiMV9zdHlsZV8xM2VkNzU0MzhjOGIyZWQ4OTE0XCI7XG5NYXBlcmlhbC5ERUZBVUxUX0NPTE9SQkFSX1VJRCAgID0gXCIxX2NvbG9yYmFyXzEzYzYzMGVjM2E1MDY4OTE5YzNcIjtcblxuTWFwZXJpYWwuQWxwaGFDbGlwICAgICAgICAgICAgICA9IFwiQWxwaGFDbGlwXCI7XG5NYXBlcmlhbC5BbHBoYUJsZW5kICAgICAgICAgICAgID0gXCJBbHBoYUJsZW5kXCI7XG5NYXBlcmlhbC5NdWxCbGVuZCAgICAgICAgICAgICAgID0gXCJNdWxCbGVuZFwiO1xuXG5NYXBlcmlhbC5nbG9iYWxEYXRhQ3B0ICAgICAgICAgID0gMDtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuLy8gQVBJXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbi8qKlxuICogb3B0aW9uczpcbiAqIFxuICogICAgIyBtYW5kYXRvcnkgLS0tLS0tLS0tLVxuICogICAgICAgXG4gKiAgICAgICB2aWV3IDogXCJkaXYuaWRcIiAgKGNhbiBiZSB1c2VkIGFzIG9ubHkgcGFyYW0pXG4gKiAgICAgICBcbiAqICAgICMgb3RoZXJzIC0tLS0tLS0tLS0tLS1cbiAqICAgIFxuICogICAgICAgdHlwZVxuICogICAgICAgICAgTWFwZXJpYWwuTUFJTiAoZGVmYXVsdClcbiAqICAgICAgICAgIE1hcGVyaWFsLkFOQ0hPUlxuICogICAgICAgICAgTWFwZXJpYWwuTEVOU1xuICogICAgICAgICAgTWFwZXJpYWwuTUlOSUZJRVJcbiAqICAgICAgICAgIE1hcGVyaWFsLk1BR05JRklFUlxuICogICAgICAgXG4gKiAgICAgICBkZWZhdWx0Wm9vbVxuICogICAgICAgICAgZGVmYXVsdCBNYXBlcmlhbC5ERUZBVUxUX1pPT01cbiAqICAgICAgIFxuICogICAgICAgbGF0aXR1ZGUgXG4gKiAgICAgICAgICBkZWZhdWx0IE1hcGVyaWFsLkRFRkFVTFRfTEFUSVRVREVcbiAqXG4gKiAgICAgICBsb25naXR1ZGVcbiAqICAgICAgICAgIGRlZmF1bHQgTWFwZXJpYWwuREVGQVVMVF9MT05HSVRVREVcbiAqICAgICAgIFxuICovXG5NYXBlcmlhbC5wcm90b3R5cGUuYWRkVmlldyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgLy8gQ2hlY2tpbmcgb3B0aW9uc1xuICAgXG4gICB2YXIgb3B0aW9ucyA9IHV0aWxzLnByZXBhcmVPcHRpb25zKG9wdGlvbnMsIFwiY29udGFpbmVyXCIpO1xuICAgaWYoIW9wdGlvbnMpe1xuICAgICAgY29uc29sZS5sb2coXCJXcm9uZyBjYWxsIHRvIGNyZWF0ZVZpZXcuIENoZWNrIHRoZSBvcHRpb25zXCIpO1xuICAgfVxuXG4gICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIC8vIENoZWNraW5nIHZpZXcgXG5cbiAgIGNvbnNvbGUubG9nKFwiQWRkaW5nIHZpZXcgaW4gY29udGFpbmVyIFwiICsgb3B0aW9ucy5jb250YWluZXIgICsgXCIuLi5cIik7XG4gICBcbiAgIGlmKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9wdGlvbnMuY29udGFpbmVyKSA9PSBudWxsKXtcbiAgICAgIGNvbnNvbGUubG9nKFwiQ29udGFpbmVyIFwiICsgb3B0aW9ucy5jb250YWluZXIgICsgXCIgY291bGQgbm90IGJlIGZvdW5kXCIpO1xuICAgICAgcmV0dXJuO1xuICAgfVxuICAgXG4gICBvcHRpb25zLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9wdGlvbnMuY29udGFpbmVyKTtcblxuICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAvLyBTZXQgZGVmYXVsdHNcblxuICAgaWYob3B0aW9ucy50eXBlID09PSB1bmRlZmluZWQpe1xuICAgICAgb3B0aW9ucy50eXBlID0gTWFwZXJpYWwuTUFJTjtcbiAgIH1cbiAgIFxuICAgaWYob3B0aW9ucy5sYXRpdHVkZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIG9wdGlvbnMubGF0aXR1ZGUgPSBNYXBlcmlhbC5ERUZBVUxUX0xBVElUVURFO1xuICAgfVxuICAgXG4gICBpZihvcHRpb25zLmxvbmdpdHVkZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIG9wdGlvbnMubG9uZ2l0dWRlID0gTWFwZXJpYWwuREVGQVVMVF9MT05HSVRVREU7XG4gICB9XG5cbiAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgLy8gUHJvY2VlZFxuICAgXG4gICB2YXIgdmlldyA9ICBuZXcgTWFwVmlldyh0aGlzLCBvcHRpb25zKTtcbiAgIHRoaXMudmlld3Nbdmlldy5pZF0gPSB2aWV3O1xuICAgXG4gICByZXR1cm4gdmlldztcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcGVyaWFsO1xuIiwiXG52YXIgdXRpbHMgICAgICAgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi90b29scy91dGlscy5qcycpLFxuICAgIFJHQkFDb2xvciAgID0gcmVxdWlyZSgnLi4vLi4vLi4vbGlicy9yZ2JhLWNvbG9yLmpzJyk7XG4gICAgXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gQ29sb3JiYXJEYXRhIChvcHRpb25zKSB7XG4gICB0aGlzLnVpZCAgICAgICAgICAgICAgICA9IHV0aWxzLmdlbmVyYXRlVUlEKCk7XG4gICB0aGlzLnZlcnNpb24gICAgICAgICAgICA9IDA7XG4gICBcbiAgIHRoaXMuZGF0YSAgICAgICAgICAgICAgID0gb3B0aW9ucy5kYXRhICAgICAgICAgICAgICAgfHwgIHt9O1xuICAgdGhpcy5iZWdpbkFscGhhQXRaZXJvICAgPSBvcHRpb25zLmJlZ2luQWxwaGFBdFplcm8gICB8fCBmYWxzZTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkNvbG9yYmFyRGF0YS5wcm90b3R5cGUuSXNWYWxpZCA9IGZ1bmN0aW9uICggICkge1xuICAgdmFyIHJUbXAgPSBPYmplY3Qua2V5cyh0aGlzLmRhdGEpO1xuICAgcmV0dXJuIHJUbXAubGVuZ3RoID49IDJcbn1cblxuQ29sb3JiYXJEYXRhLnByb3RvdHlwZS5Gcm9tSnNvbiA9IGZ1bmN0aW9uICggaW5Kc29uICkge1xuICAgdGhpcy5kYXRhID0ge30gLy8gcmVzZXQgLi4uXG4gICBmb3IgKHZhciBpIGluIGluSnNvbikge1xuICAgICAgLy8gQ29uc3RhbnQgb3IgR3JhZGlhbnRDb2xvciA/Pz9cbiAgICAgIHRoaXMuU2V0ICggaSAsIG5ldyBHcmFkaWFudENvbG9yIChpbkpzb25baV0uciAsIGluSnNvbltpXS5nICwgaW5Kc29uW2ldLmIgLCBpbkpzb25baV0uYSkgKVxuICAgfVxufVxuXG5Db2xvcmJhckRhdGEucHJvdG90eXBlLlRvSnNvbiA9IGZ1bmN0aW9uICAoICApIHtcbiAgIHZhciByID0ge31cbiAgIGZvciAodmFyIGkgaW4gdGhpcy5kYXRhKXtcbiAgICAgIC8vIENvbnN0YW50IG9yIEdyYWRpYW50Q29sb3IgPz8/XG4gICAgICByW2ldID0ge1wiclwiOnRoaXMuZGF0YVtpXS5yLFwiZ1wiOnRoaXMuZGF0YVtpXS5nLFwiYlwiOnRoaXMuZGF0YVtpXS5iLFwiYVwiOnRoaXMuZGF0YVtpXS5hfVxuICAgfVxuICAgcmV0dXJuIHI7XG59XG5cbkNvbG9yYmFyRGF0YS5wcm90b3R5cGUuU2V0TWluICA9IGZ1bmN0aW9uKCBpblYgLCBpbkMgKXtcbiAgIGlmICh0eXBlb2YgKGluVikgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHJldHVybjtcbiAgIGlmICh0eXBlb2YgKGluQykgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHJldHVybjtcbiAgIC8vdmFyIGsgPSBPYmplY3Qua2V5cyh0aGlzLmRhdGEpXG4gICB0b1JlbW92ZSA9IFtdO1xuICAgZm9yICggdmFyIGkgaW4gdGhpcy5kYXRhICkge1xuICAgICAgaWYgKCBwYXJzZUZsb2F0KGkpIDw9IHBhcnNlRmxvYXQoaW5WKSApIHtcbiAgICAgICAgIHRvUmVtb3ZlLnB1c2goaSk7XG4gICAgICB9XG4gICB9XG4gICBmb3IgKHZhciBpID0gMCA7IGkgPCB0b1JlbW92ZS5sZW5naHQgOyBpKyspIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmRhdGFbdG9SZW1vdmVbaV1dO1xuICAgfVxuICAgXG4gICB0aGlzLmRhdGFbaW5WXSA9IGluQztcblxuICAgdGhpcy52ZXJzaW9uICsrO1xufVxuXG5Db2xvcmJhckRhdGEucHJvdG90eXBlLlNldE1heCAgPSBmdW5jdGlvbiggaW5WICwgaW5DICl7XG5cbiAgIGlmICh0eXBlb2YgKGluVikgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHJldHVybiA7XG5cbiAgIGlmICh0eXBlb2YgKGluQykgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHJldHVybjsgXG5cbiAgIGZvciAoIHZhciBpIGluIHRoaXMuZGF0YSApIHtcbiAgICAgIGlmICggcGFyc2VGbG9hdChpKSA+PSBwYXJzZUZsb2F0KGluVikgKSB7XG4gICAgICAgICB0b1JlbW92ZS5wdXNoKGkpXG4gICAgICB9XG4gICB9XG5cbiAgIGZvciAodmFyIGkgPSAwIDsgaSA8IHRvUmVtb3ZlLmxlbmdodCA7IGkrKykge1xuICAgICAgZGVsZXRlIHRoaXMuZGF0YVt0b1JlbW92ZVtpXV1cbiAgIH1cblxuICAgdGhpcy5kYXRhW2luVl0gPSBpbkM7XG5cbiAgIHRoaXMudmVyc2lvbiArKztcbn1cblxuQ29sb3JiYXJEYXRhLnByb3RvdHlwZS5TZXQgICAgID0gZnVuY3Rpb24oIGluViAsIGluQyApe1xuICAgaWYgKHR5cGVvZiAoaW5WKSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgcmV0dXJuO1xuICAgaWYgKHR5cGVvZiAoaW5DKSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgcmV0dXJuO1xuICAgdGhpcy5kYXRhW2luVl0gPSBpbkM7XG5cbiAgIHRoaXMudmVyc2lvbiArKztcbn1cblxuQ29sb3JiYXJEYXRhLnByb3RvdHlwZS5JbmRleGVzID0gZnVuY3Rpb24oICApe1xuICAgdmFyIHJUbXAgPSBPYmplY3Qua2V5cyh0aGlzLmRhdGEpO1xuICAgdmFyIHIgICAgPSBbXVxuICAgZm9yICh2YXIgaSA9IDAgOyBpIDwgclRtcC5sZW5ndGggOyArK2kpIHtcbiAgICAgIHIucHVzaCAoIHBhcnNlRmxvYXQoIHJUbXBbaV0gKSApIFxuICAgfVxuICAgcmV0dXJuIHI7XG59XG5cbkNvbG9yYmFyRGF0YS5wcm90b3R5cGUuUmVtb3ZlICA9IGZ1bmN0aW9uKCBpblYgKXtcbiAgIGlmICggaW5WIGluIHRoaXMuZGF0YSl7XG4gICAgICBkZWxldGUgdGhpcy5kYXRhW2luVl1cbiAgICAgIHRoaXMudmVyc2lvbiArKztcbiAgIH1cblxufVxuXG5Db2xvcmJhckRhdGEucHJvdG90eXBlLk1vdmUgICAgPSBmdW5jdGlvbiggaW5WT2xkLCBpblZOZXcgKXtcbiAgIGlmICggaW5WIGluIHRoaXMuZGF0YSkge1xuICAgICAgdmFyIGMgPSB0aGlzLmRhdGFbaW5WT2xkXVxuICAgICAgZGVsZXRlIHRoaXMuZGF0YVtpblZPbGRdXG4gICAgICB0aGlzLmRhdGFbaW5WTmV3XSA9IGNcbiAgIH1cbn1cblxuQ29sb3JiYXJEYXRhLnByb3RvdHlwZS5HZXRCeUtleSAgICA9IGZ1bmN0aW9uKCBpblYgKXsgXG4gICBpZiAoIGluViBpbiB0aGlzLmRhdGEgKVxuICAgICAgcmV0dXJuIHRoaXMuZGF0YVtpblZdXG4gICByZXR1cm4gbnVsbFxufVxuXG5Db2xvcmJhckRhdGEucHJvdG90eXBlLkdldEJvdW5kcyAgICAgPSBmdW5jdGlvbiggICl7XG4gICB2YXIgayA9IE9iamVjdC5rZXlzKHRoaXMuZGF0YSk7IFxuICAgXG4gICBpZiAoay5sZW5ndGggPCAyKVxuICAgICAgcmV0dXJuIFswLjAsMC4wXTsgLy9JbnZhbGlkXG5cbiAgIGZvciAodmFyIGkgPSAwIDsgaSA8IGsubGVuZ3RoIDsgKysgaSApe1xuICAgICAga1tpXSA9IHBhcnNlRmxvYXQoa1tpXSk7XG4gICB9XG4gICBrLnNvcnQoKVxuICAgXG4gICB2YXIgbWluID0ga1swXTtcbiAgIHZhciBtYXggPSBrW2subGVuZ3RoLTFdO1xuICAgcmV0dXJuIFttaW4sbWF4XTtcbn1cblxuQ29sb3JiYXJEYXRhLnByb3RvdHlwZS5HZXQgICAgID0gZnVuY3Rpb24oIGluVCApeyAvL1swLjAsMS4wXVxuXG4gICB2YXIgayA9IE9iamVjdC5rZXlzKHRoaXMuZGF0YSk7IFxuXG4gICBpZiAoay5sZW5ndGggPCAyKVxuICAgICAgcmV0dXJuIG51bGw7IC8vSW52YWxpZFxuICAgXG4gICB2YXIgbWluID0gcGFyc2VGbG9hdChrWzBdKTtcbiAgIHZhciBtYXggPSBwYXJzZUZsb2F0KGtbay5sZW5ndGgtMV0pO1xuICAgdmFyIHYgICA9IChtYXggLSBtaW4pICogaW5UICsgbWluO1xuICAgaWYgKHYgPCBtaW4pIHYgPSBtaW47XG4gICBpZiAodiA+IG1heCkgdiA9IG1heDtcbiAgIFxuICAgdmFyIGlzU3RlcCA9IGZhbHNlO1xuICAgZm9yKHZhciBrZXkgaW4gdGhpcy5kYXRhKXtcbiAgICAgIGlmKHBhcnNlRmxvYXQoa2V5KSA9PSB2KXtcbiAgICAgICAgIGlzU3RlcCAgID0gdHJ1ZTtcbiAgICAgICAgIHYgICAgICAgID0ga2V5O1xuICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICB9XG4gICBcbiAgIGlmICggaXNTdGVwICl7XG4gICAgICBpZiAoIHBhcnNlRmxvYXQodikgPT0gbWluICYmIHRoaXMuYmVnaW5BbHBoYUF0WmVybyApe1xuICAgICAgICAgcmV0dXJuIG5ldyBSR0JBQ29sb3IgKCB0aGlzLmRhdGFbdl0uciAsICB0aGlzLmRhdGFbdl0uZyAsIHRoaXMuZGF0YVt2XS5iICwgMCApXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgIHJldHVybiBuZXcgUkdCQUNvbG9yICggdGhpcy5kYXRhW3ZdLnIgLCAgdGhpcy5kYXRhW3ZdLmcgLCB0aGlzLmRhdGFbdl0uYiAsIHRoaXMuZGF0YVt2XS5hIClcbiAgICAgIH1cbiAgIH1cbiAgIGVsc2V7XG4gICAgICB2YXIga2V5VXAsIGtleURvd247XG4gICAgICBcbiAgICAgIGZvciAoIHZhciBpID0gMSA7IGkgPCBrLmxlbmd0aCA7IGkrKyApIHtcbiAgICAgICAgIGlmICggdiA8IGtbaV0gKSB7XG4gICAgICAgICAgICBrZXlVcCAgICA9IGtbaV0gXG4gICAgICAgICAgICBrZXlEb3duICA9IGtbaS0xXSBcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgfVxuICAgICAgfSAgIFxuICAgICAgaWYgKCFrZXlVcCkgXG4gICAgICAgICByZXR1cm4gbnVsbCAvL0Vycm9yXG4gICAgICAgICBcbiAgICAgIHZhciBjMCA9IHRoaXMuZGF0YVtrZXlEb3duXTtcbiAgICAgIHZhciBjMSA9IHRoaXMuZGF0YVtrZXlVcF07XG4gICAgICBcbiAgICAgIHZhciB2MCA9IHBhcnNlRmxvYXQoa2V5RG93bik7XG4gICAgICB2YXIgdjEgPSBwYXJzZUZsb2F0KGtleVVwKTtcbiAgICAgIFxuICAgICAgdmFyIHQgPSAodiAtIHYwKSAvICh2MSAtIHYwKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIGMxLkdldFdpdGgoYzAsdCk7XG4gICB9XG4gICBcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yYmFyRGF0YTsiLCJcbnZhciB1dGlscyAgICAgICA9IHJlcXVpcmUoJy4uLy4uLy4uLy4uL3Rvb2xzL3V0aWxzLmpzJyksXG4gICAgUHJvajRqcyAgICAgPSByZXF1aXJlKCcuLi8uLi8uLi9saWJzL3Byb2o0anMtY29tcHJlc3NlZC5qcycpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5mdW5jdGlvbiBEeW5hbWljYWxEYXRhICAoKSB7XG4gICBcbiAgIHRoaXMucG9pbnRzICAgICAgICAgICAgID0ge307XG4gICB0aGlzLmlkICAgICAgICAgICAgICAgICA9IHV0aWxzLmdlbmVyYXRlVUlEKCk7XG4gICB0aGlzLnZlcnNpb24gICAgICAgICAgICA9IDA7XG4gICBcbiAgIHRoaXMubWlueCAgICAgICAgICAgICAgID0gMTAwMDAwMDAwMDAwO1xuICAgdGhpcy5tYXh4ICAgICAgICAgICAgICAgPSAtMTAwMDAwMDAwMDAwO1xuICAgdGhpcy5taW55ICAgICAgICAgICAgICAgPSAxMDAwMDAwMDAwMDA7XG4gICB0aGlzLm1heHkgICAgICAgICAgICAgICA9IC0xMDAwMDAwMDAwMDA7XG4gICB0aGlzLnNyY1ByaiAgICAgICAgICAgICA9IG5ldyBQcm9qNGpzLlByb2ooJ0VQU0c6NDMyNicgICk7ICAgICAgLy9zb3VyY2UgY29vcmRpbmF0ZXMgd2lsbCBiZSBpbiBMb25naXR1ZGUvTGF0aXR1ZGVcbiAgIHRoaXMuZHN0UHJqICAgICAgICAgICAgID0gbmV3IFByb2o0anMuUHJvaignRVBTRzo5MDA5MTMnKTsgICAgIC8vZGVzdGluYXRpb24gY29vcmRpbmF0ZXMgZ29vZ2xlXG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkR5bmFtaWNhbERhdGEucHJvdG90eXBlLmFkZFBvaW50ID0gZnVuY3Rpb24gKCBsYXRpdHVkZSwgbG9uZ2l0dWRlLCBkYXRhKSB7XG5cbiAgICB2YXIgaWQgICA9IHV0aWxzLmdlbmVyYXRlVUlEKCksXG4gICAgICAgIHAgICAgPSBuZXcgUHJvajRqcy5Qb2ludChsb25naXR1ZGUsIGxhdGl0dWRlKTtcbiAgICBcbiAgIFByb2o0anMudHJhbnNmb3JtKHRoaXMuc3JjUHJqLCB0aGlzLmRzdFByaiwgcCk7XG4gICB0aGlzLm1pbnggPSBNYXRoLm1pbiAodGhpcy5taW54ICwgcC54KTtcbiAgIHRoaXMubWF4eCA9IE1hdGgubWF4ICh0aGlzLm1heHggLCBwLngpO1xuICAgdGhpcy5taW55ID0gTWF0aC5taW4gKHRoaXMubWlueSAsIHAueSk7XG4gICB0aGlzLm1heHkgPSBNYXRoLm1heCAodGhpcy5tYXh5ICwgcC55KTtcblxuICAgdmFyIHBvaW50ID0ge1xuICAgICAgICAgaWQgICAgICAgOiBpZCxcbiAgICAgICAgIGxhdCAgICAgIDogbGF0aXR1ZGUsXG4gICAgICAgICBsb24gICAgICA6IGxvbmdpdHVkZSxcbiAgICAgICAgIHggICAgICAgIDogcC54LFxuICAgICAgICAgeSAgICAgICAgOiBwLnksXG4gICAgICAgICBkYXRhICAgICA6IGRhdGEsXG4gICB9O1xuXG4gICB0aGlzLnBvaW50c1tpZF0gPSBwb2ludDtcbiAgIHRoaXMudmVyc2lvbiArKztcbiAgIFxuICAgcmV0dXJuIHBvaW50O1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5EeW5hbWljYWxEYXRhLnByb3RvdHlwZS5yZW1vdmVQb2ludCA9IGZ1bmN0aW9uIChwb2ludCkge1xuICAgaWYocG9pbnQpe1xuICAgICAgIGRlbGV0ZSB0aGlzLnBvaW50c1twb2ludC5pZF07XG4gICAgICAgdGhpcy52ZXJzaW9uICsrO1xuICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5EeW5hbWljYWxEYXRhLnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wb2ludHMgPSB7fTtcbiAgICB0aGlzLnZlcnNpb24gKys7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxubW9kdWxlLmV4cG9ydHMgPSBEeW5hbWljYWxEYXRhOyIsIlxudmFyIHV0aWxzICAgICAgID0gcmVxdWlyZSgnLi4vLi4vLi4vLi4vdG9vbHMvdXRpbHMuanMnKSxcbiAgICBQcm9qNGpzICAgICA9IHJlcXVpcmUoJy4uLy4uLy4uL2xpYnMvcHJvajRqcy1jb21wcmVzc2VkLmpzJyk7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbmZ1bmN0aW9uIEhlYXRtYXBEYXRhICAoKSB7XG4gICBcbiAgIHRoaXMucG9pbnRzICAgICAgICAgICAgID0ge30sXG4gICB0aGlzLmNvbnRlbnQgICAgICAgICAgICA9IHtcImhcIjpNYXBlcmlhbC50aWxlU2l6ZSAsIFwid1wiOk1hcGVyaWFsLnRpbGVTaXplICwgXCJsXCIgOiBbXSB9XG4gICB0aGlzLmlkICAgICAgICAgICAgICAgICA9IHV0aWxzLmdlbmVyYXRlVUlEKCk7XG4gICB0aGlzLnZlcnNpb24gICAgICAgICAgICA9IDA7XG4gICB0aGlzLm5iUG9pbnRzICAgICAgICAgICA9IDA7XG4gICBcbiAgIHRoaXMubWlueCAgICAgICAgICAgICAgID0gMTAwMDAwMDAwMDAwO1xuICAgdGhpcy5tYXh4ICAgICAgICAgICAgICAgPSAtMTAwMDAwMDAwMDAwO1xuICAgdGhpcy5taW55ICAgICAgICAgICAgICAgPSAxMDAwMDAwMDAwMDA7XG4gICB0aGlzLm1heHkgICAgICAgICAgICAgICA9IC0xMDAwMDAwMDAwMDA7XG4gICB0aGlzLnNyY1ByaiAgICAgICAgICAgICA9IG5ldyBQcm9qNGpzLlByb2ooJ0VQU0c6NDMyNicgICk7ICAgICAgLy9zb3VyY2UgY29vcmRpbmF0ZXMgd2lsbCBiZSBpbiBMb25naXR1ZGUvTGF0aXR1ZGVcbiAgIHRoaXMuZHN0UHJqICAgICAgICAgICAgID0gbmV3IFByb2o0anMuUHJvaignRVBTRzo5MDA5MTMnKTsgICAgIC8vZGVzdGluYXRpb24gY29vcmRpbmF0ZXMgZ29vZ2xlXG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkhlYXRtYXBEYXRhLnByb3RvdHlwZS5hZGRQb2ludCA9IGZ1bmN0aW9uICggbGF0aXR1ZGUsIGxvbmdpdHVkZSwgZGlhbWV0ZXIsIHNjYWxlKSB7XG5cbiAgIHZhciBpZCAgID0gdXRpbHMuZ2VuZXJhdGVVSUQoKSxcbiAgICAgICBwICAgID0gbmV3IFByb2o0anMuUG9pbnQobG9uZ2l0dWRlLCBsYXRpdHVkZSksXG4gICAgICAgYXR0ciA9IHtcbiAgICAgICAgIGRpYW1ldGVyIDogZGlhbWV0ZXIsIFxuICAgICAgICAgc2NhbGUgICAgOiBzY2FsZVxuICAgICAgIH07XG4gICBcbiAgIFByb2o0anMudHJhbnNmb3JtKHRoaXMuc3JjUHJqLCB0aGlzLmRzdFByaiwgcCk7XG4gICB0aGlzLm1pbnggPSBNYXRoLm1pbiAodGhpcy5taW54ICwgcC54KTtcbiAgIHRoaXMubWF4eCA9IE1hdGgubWF4ICh0aGlzLm1heHggLCBwLngpO1xuICAgdGhpcy5taW55ID0gTWF0aC5taW4gKHRoaXMubWlueSAsIHAueSk7XG4gICB0aGlzLm1heHkgPSBNYXRoLm1heCAodGhpcy5tYXh5ICwgcC55KTtcbi8vXG4vLyAgIHZhciBwb2ludCA9IHtcbi8vICAgICAgICAgaWQgICAgICAgOiBpZCxcbi8vICAgICAgICAgbGF0ICAgICAgOiBsYXRpdHVkZSxcbi8vICAgICAgICAgbG9uICAgICAgOiBsb25naXR1ZGUsXG4vLyAgICAgICAgIHggICAgICAgIDogcC54LFxuLy8gICAgICAgICB5ICAgICAgICA6IHAueSxcbi8vICAgICAgICAgZGlhbWV0ZXIgOiBkaWFtZXRlcixcbi8vICAgICAgICAgc2NhbGUgICAgOiBzY2FsZSxcbi8vICAgfTtcblxuICAgdmFyIHBvaW50ID0geydjJzpudWxsLCdnJzpbW1twLngscC55XV1dLCdhJzpbYXR0cl19ICA7XG5cbiAgIHRoaXMuY29udGVudC5sLnB1c2ggKHBvaW50KSA7XG4gICB0aGlzLnBvaW50c1tpZF0gPSBwb2ludDtcbiAgIHRoaXMudmVyc2lvbiArKztcbiAgIHRoaXMubmJQb2ludHMgKys7XG4gICBcbiAgIHJldHVybiBwb2ludDtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuSGVhdG1hcERhdGEucHJvdG90eXBlLnJlbW92ZVBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG4gICAgaWYocG9pbnQpe1xuICAgICAgICBkZWxldGUgdGhpcy5wb2ludHNbcG9pbnQuaWRdO1xuICAgICAgICB0aGlzLnZlcnNpb24gKys7XG4gICAgICAgIHRoaXMubmJQb2ludHMgLS07XG4gICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gSGVhdG1hcERhdGE7XG4iLCIvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gSW1hZ2VEYXRhIChzb3VyY2VJZCwgeCwgeSwgeikge1xuICAgXG4gICB0aGlzLnNvdXJjZUlkICA9IHNvdXJjZUlkO1xuICAgdGhpcy54ICAgICAgICAgPSB4O1xuICAgdGhpcy55ICAgICAgICAgPSB5O1xuICAgdGhpcy56ICAgICAgICAgPSB6O1xuXG4gICB0aGlzLmNvbnRlbnQgICA9IG51bGw7XG5cbiAgIHNvdXJjZU1hbmFnZXIuTG9hZEltYWdlKHNvdXJjZUlkLCB4LCB5LCB6KVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuSW1hZ2VEYXRhLnByb3RvdHlwZS50cnlUb0ZpbGxDb250ZW50ID0gZnVuY3Rpb24oKXtcbiAgIHRoaXMuY29udGVudCA9IHNvdXJjZU1hbmFnZXIuZ2V0RGF0YSh0aGlzLnNvdXJjZUlkLCB0aGlzLngsIHRoaXMueSwgdGhpcy56KTtcbn1cblxuSW1hZ2VEYXRhLnByb3RvdHlwZS5yZWxlYXNlID0gZnVuY3Rpb24oKXtcbiAgIHNvdXJjZU1hbmFnZXIucmVsZWFzZSh0aGlzLnNvdXJjZUlkLCB0aGlzLngsIHRoaXMueSwgdGhpcy56KTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlRGF0YTsiLCIvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gTGF5ZXIoKXt9XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cbi8vTGF5ZXIgVHlwZXNcblxuTGF5ZXIuRHluYW1pY2FsICAgPSBcIkxheWVyLkR5bmFtaWNhbFwiO1xuTGF5ZXIuSGVhdCAgICAgICAgPSBcIkxheWVyLkhlYXRcIjtcbkxheWVyLlZlY3RvcmlhbCAgID0gXCJMYXllci5WZWN0b3JpYWxcIjtcbkxheWVyLlJhc3RlciAgICAgID0gXCJMYXllci5SYXN0ZXJcIjtcbkxheWVyLkltYWdlcyAgICAgID0gXCJMYXllci5JbWFnZXNcIjtcbkxheWVyLldNUyAgICAgICAgID0gXCJMYXllci5XTVNcIjtcbkxheWVyLlNSVE0gICAgICAgID0gXCJMYXllci5TUlRNXCI7XG5MYXllci5TaGFkZSAgICAgICA9IFwiTGF5ZXIuU2hhZGVcIjtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IExheWVyO1xuIiwiXG52YXIgdXRpbHMgICAgICAgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi90b29scy91dGlscy5qcycpLFxuICAgIExheWVyICAgICAgID0gcmVxdWlyZSgnLi4vbGF5ZXIuanMnKTtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbmZ1bmN0aW9uIER5bmFtaWNhbExheWVyIChwYXJhbXMsIGNvbXBvc2l0aW9uKSB7XG4gICB0aGlzLmlkICAgICAgICAgICAgICAgICA9IHV0aWxzLmdlbmVyYXRlVUlEKCk7XG4gICB0aGlzLnR5cGUgICAgICAgICAgICAgICA9IExheWVyLkR5bmFtaWNhbDtcbiAgIHRoaXMubWFwVmlldyAgICAgICAgICAgID0gcGFyYW1zLm1hcFZpZXc7XG4gICB0aGlzLmR5bmFtaWNhbERhdGEgICAgICA9IHBhcmFtcy5keW5hbWljYWxEYXRhO1xuXG4gICB0aGlzLnN0eWxlICAgICAgICAgICAgICA9IHN0eWxlTWFuYWdlci5jcmVhdGVDdXN0b21TdHlsZShwYXJhbXMuc3R5bGUpO1xuICAgdGhpcy5jb21wb3NpdGlvbiAgICAgICAgPSBjb21wb3NpdGlvbjtcblxuICAgdGhpcy5yZW5kZXJlciAgICAgICAgICAgPSB0aGlzLm1hcFZpZXcubWFwUmVuZGVyZXIuYWRkRHluYW1pY2FsUmVuZGVyZXIodGhpcy5keW5hbWljYWxEYXRhLCB0aGlzLnN0eWxlKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gRHluYW1pY2FsTGF5ZXI7IiwiXG52YXIgdXRpbHMgICAgICAgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi90b29scy91dGlscy5qcycpLFxuICAgIExheWVyICAgICAgID0gcmVxdWlyZSgnLi4vbGF5ZXIuanMnKTtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbmZ1bmN0aW9uIEhlYXRtYXBMYXllciAocGFyYW1zLCBjb21wb3NpdGlvbikge1xuICAgdGhpcy5pZCAgICAgICAgICAgICAgICAgPSB1dGlscy5nZW5lcmF0ZVVJRCgpO1xuICAgdGhpcy50eXBlICAgICAgICAgICAgICAgPSBMYXllci5IZWF0O1xuICAgdGhpcy5tYXBWaWV3ICAgICAgICAgICAgPSBwYXJhbXMubWFwVmlldztcbiAgIHRoaXMuaGVhdG1hcERhdGEgICAgICAgID0gcGFyYW1zLmhlYXRtYXBEYXRhO1xuICAgdGhpcy5jb2xvcmJhciAgICAgICAgICAgPSBwYXJhbXMuY29sb3JiYXI7XG4gICB0aGlzLm9wdGlvbnMgICAgICAgICAgICA9IHBhcmFtcy5vcHRpb25zO1xuICAgXG4gICB0aGlzLmNvbXBvc2l0aW9uICAgICAgICA9IGNvbXBvc2l0aW9uO1xuICAgXG4gICB0aGlzLnJlbmRlcmVyICAgICAgICAgICA9IHRoaXMubWFwVmlldy5tYXBSZW5kZXJlci5hZGRIZWF0bWFwUmVuZGVyZXIodGhpcy5oZWF0bWFwRGF0YSwgdGhpcy5jb2xvcmJhciwgdGhpcy5vcHRpb25zKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gSGVhdG1hcExheWVyO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy8iLCJcbnZhciB1dGlscyAgICAgICA9IHJlcXVpcmUoJy4uLy4uLy4uLy4uL3Rvb2xzL3V0aWxzLmpzJyksXG4gICAgTGF5ZXIgICAgICAgPSByZXF1aXJlKCcuLi9sYXllci5qcycpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gSW1hZ2VMYXllciAoc291cmNlSWQsIGNvbXBvc2l0aW9uKSB7XG4gICBcbiAgIHRoaXMuaWQgICAgICAgICAgICAgID0gdXRpbHMuZ2VuZXJhdGVVSUQoKTtcbiAgIHRoaXMudHlwZSAgICAgICAgICAgID0gTGF5ZXIuSW1hZ2VzO1xuICAgdGhpcy5zb3VyY2VJZCAgICAgICAgPSBzb3VyY2VJZDtcbiAgIHRoaXMuY29tcG9zaXRpb24gICAgID0gY29tcG9zaXRpb247XG4gICBcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMYXllcjtcbiIsIlxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbmZ1bmN0aW9uIFNvdXJjZSAoaWQsIHR5cGUsIHBhcmFtcykge1xuICAgdGhpcy5pZCAgICAgPSBpZDtcbiAgIHRoaXMudHlwZSAgID0gdHlwZTtcbiAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cbi8vIE1hcGVyaWFsT1NNIHB1YmxpYyBkZWZhdWx0IHN0eWxlc1xuXG5Tb3VyY2UuTUFQRVJJQUxfQlJPV05JRSAgICAgICAgICAgICA9IFwibWFwZXJpYWwuYnJvd25pZVwiO1xuU291cmNlLk1BUEVSSUFMX0NMQVNTSUMgICAgICAgICAgICAgPSBcIm1hcGVyaWFsLmNsYXNzaWNcIjtcblNvdXJjZS5NQVBFUklBTF9DT09LSUVTICAgICAgICAgICAgID0gXCJtYXBlcmlhbC5jb29raWVzXCI7XG5Tb3VyY2UuTUFQRVJJQUxfWUVMTE9XICAgICAgICAgICAgICA9IFwibWFwZXJpYWwueWVsbG93XCI7XG5Tb3VyY2UuTUFQRVJJQUxfRkxVTyAgICAgICAgICAgICAgICA9IFwibWFwZXJpYWwuZmx1b1wiO1xuU291cmNlLk1BUEVSSUFMX0dSRUVOICAgICAgICAgICAgICAgPSBcIm1hcGVyaWFsLmdyZWVuXCI7XG5Tb3VyY2UuTUFQRVJJQUxfTElHSFQgICAgICAgICAgICAgICA9IFwibWFwZXJpYWwubGlnaHRcIjtcblNvdXJjZS5NQVBFUklBTF9QSU5LICAgICAgICAgICAgICAgID0gXCJtYXBlcmlhbC5waW5rXCI7XG5cblNvdXJjZS5NQVBFUklBTF9CUk9XTklFX0lEICAgICAgICAgID0gXCIxX3N0eWxlXzEzZWQ3NjQ4NWVmYTE2ZmVmZGRcIjtcblNvdXJjZS5NQVBFUklBTF9DTEFTU0lDX0lEICAgICAgICAgID0gXCIxX3N0eWxlXzEzZWQ3NTQzOGM4YjJlZDg5MTRcIjtcblNvdXJjZS5NQVBFUklBTF9DT09LSUVTX0lEICAgICAgICAgID0gXCIxX3N0eWxlXzEzZTc5MjAwZmMxYWRlYTU3MThcIjtcblNvdXJjZS5NQVBFUklBTF9GTFVPX0lEICAgICAgICAgICAgID0gXCIxX3N0eWxlXzEzZWQ3MzZmNGQ0YmRmNThiMGVcIjtcblNvdXJjZS5NQVBFUklBTF9HUkVFTl9JRCAgICAgICAgICAgID0gXCIxX3N0eWxlXzEzZWQ2YWJjODdhZGNiZjM5MzdcIjtcblNvdXJjZS5NQVBFUklBTF9MSUdIVF9JRCAgICAgICAgICAgID0gXCIxX3N0eWxlXzEzZGQwZTc2OTViZmMyOTQxZTdcIjtcblNvdXJjZS5NQVBFUklBTF9QSU5LX0lEICAgICAgICAgICAgID0gXCIxX3N0eWxlXzEzZWQ3ODBlZDcxNzQ0ODFlN2VcIjtcblNvdXJjZS5NQVBFUklBTF9ZRUxMT1dfSUQgICAgICAgICAgID0gXCIxX3N0eWxlXzEzZWEzMzY5ZjdkYmJmNjNiNDJcIjtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG4vLyBJbWFnZXMuc3JjXG5cblNvdXJjZS5JTUFHRVNfTUFQUVVFU1QgICAgICAgICAgICAgID0gXCJpbWFnZXMubWFwcXVlc3RcIjtcblNvdXJjZS5JTUFHRVNfTUFQUVVFU1RfU0FURUxMSVRFICAgID0gXCJpbWFnZXMubWFwcXVlc3Quc2F0ZWxsaXRlXCI7XG5Tb3VyY2UuSU1BR0VTX09TTSAgICAgICAgICAgICAgICAgICA9IFwiaW1hZ2VzLm9zbVwiO1xuXG4vL2h0dHA6Ly93d3cudGh1bmRlcmZvcmVzdC5jb20vIFxuU291cmNlLklNQUdFU19PQ01fQ1lDTEUgICAgICAgICAgICAgPSBcImltYWdlcy5vY20uY3ljbGVcIjtcblNvdXJjZS5JTUFHRVNfT0NNX1RSQU5TUE9SVCAgICAgICAgID0gXCJpbWFnZXMub2NtLnRyYW5zcG9ydFwiO1xuU291cmNlLklNQUdFU19PQ01fTEFORFNDQVBFICAgICAgICAgPSBcImltYWdlcy5vY20ubGFuZHNjYXBlXCI7XG5cbi8vIGh0dHA6Ly9tYXBzLnN0YW1lbi5jb20vXG4vLyBNYXAgdGlsZXMgYnkgPGEgaHJlZj1cImh0dHA6Ly9zdGFtZW4uY29tXCI+U3RhbWVuIERlc2lnbjwvYT4sIHVuZGVyIDxhIGhyZWY9XCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS8zLjBcIj5DQyBCWSAzLjA8L2E+LiBEYXRhIGJ5IDxhIGhyZWY9XCJodHRwOi8vb3BlbnN0cmVldG1hcC5vcmdcIj5PcGVuU3RyZWV0TWFwPC9hPiwgdW5kZXIgPGEgaHJlZj1cImh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzMuMFwiPkNDIEJZIFNBPC9hPi5cblNvdXJjZS5JTUFHRVNfU1RBTUVOX1dBVEVSQ09MT1IgICAgID0gXCJpbWFnZXMuc3RhbWVuLndhdGVyY29sb3JcIjtcblNvdXJjZS5JTUFHRVNfU1RBTUVOX1RFUlJBSU4gICAgICAgID0gXCJpbWFnZXMuc3RhbWVuLnRlcnJhaW5cIjtcblNvdXJjZS5JTUFHRVNfU1RBTUVOX1RPTkVSICAgICAgICAgID0gXCJpbWFnZXMuc3RhbWVuLnRvbmVyXCI7XG5Tb3VyY2UuSU1BR0VTX1NUQU1FTl9UT05FUl9CRyAgICAgICA9IFwiaW1hZ2VzLnN0YW1lbi50b25lci1iYWNrZ3JvdW5kXCI7XG5cbi8vIEFQSSBmb3IgYnVzaW5lc3MgP1xuLy8gJnN0eWxlPSA1LDMgPT0+IHBvc3NpYmlsaXTDqSBwbGVpbiBkZSBtb2RpZnMgIVxuLy9Tb3VyY2UuSU1BR0VTX0dPT0dMRV9TQVRFTExJVEUgICAgICA9IFwiaW1hZ2VzLmdvb2dsZS5zYXRlbGxpdGVcIjtcbi8vU291cmNlLklNQUdFU19HT09HTEVfVEVSUkFJTiAgICAgICAgPSBcImltYWdlcy5nb29nbGUudGVycmFpblwiO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cbi8vIFdNUy5zcmNcblxuU291cmNlLldNU19CUkVUQUdORUNBTlRPTlMgICAgICAgICAgPSBcIndtcy5icmV0YWduZWNhbnRvbnNcIjtcblNvdXJjZS5XTVNfRlJBTkNFQ09VUlNERUFVICAgICAgICAgID0gXCJ3bXMuZnJhbmNlY291cnNkZWF1XCI7XG5Tb3VyY2UuV01TX1NPTFNfSUxFRVRWSUxBSU5FICAgICAgICA9IFwid21zLnNvbHNfaWxlZXR2aWxhaW5lXCI7XG5Tb3VyY2UuV01TX0NPUklORV9MQU5EX0NPVkVSICAgICAgICA9IFwid21zLmNvcmluZV9sYW5kX2NvdmVyXCI7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNvdXJjZTsiLCIvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gU3R5bGUoKXt9XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuU3R5bGUuVmVjdG9yaWFsICAgPSBcIlN0eWxlLlZlY3RvcmlhbFwiO1xuU3R5bGUuQ3VzdG9tICAgICAgPSBcIlN0eWxlLkN1c3RvbVwiO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gU3R5bGU7XG4iLCIvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbnZhciBTdHlsZSAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9zdHlsZS5qcycpLFxuICAgIFBvaW50U3ltYm9saXplciAgICAgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmcvc3ltYm9saXplcnMvcG9pbnQtc3ltYm9saXplci5qcycpLFxuICAgIHV0aWxzICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi8uLi8uLi90b29scy91dGlscy5qcycpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gVmVjdG9yaWFsU3R5bGUgKG9wdGlvbnMpIHsgICBcbiAgIHRoaXMudWlkICAgICAgICAgICAgICAgID0gdXRpbHMuZ2VuZXJhdGVVSUQoKTtcbiAgIFxuICAgdGhpcy50eXBlICAgICAgICAgICAgICAgPSBvcHRpb25zLnR5cGU7XG4gICB0aGlzLnN5bWJvbCAgICAgICAgICAgICA9IG9wdGlvbnMuc3ltYm9sO1xuICAgdGhpcy5ob3Jpem9udGFsQWxpZ24gICAgPSBvcHRpb25zLmhvcml6b250YWxBbGlnbiAgfHwgXCJjZW50ZXJcIjtcbiAgIHRoaXMudmVydGljYWxBbGlnbiAgICAgID0gb3B0aW9ucy52ZXJ0aWNhbEFsaWduICAgIHx8IFwiYm90dG9tXCI7XG5cbiAgIHRoaXMuY29udGVudCAgICAgICAgICAgID0ge307XG4gICB0aGlzLmN1cklkICAgICAgICAgICAgICA9IDA7XG5cbiAgIHZhciBwcyA9IG5ldyBQb2ludFN5bWJvbGl6ZXIodGhpcy5zeW1ib2wpO1xuICAgcHMuQWxpZ25lbWVudCh0aGlzLmhvcml6b250YWxBbGlnbiwgdGhpcy52ZXJ0aWNhbEFsaWduKTtcblxuICAgdGhpcy5zeW1iSWQgPSB0aGlzLkFkZFN5bWJvbGl6ZXIgKCBwcyAsIDE4ICwgMCAgKTtcbiAgIFxuICAgLy8gcmVnaXN0ZXIgXG4gICB3aW5kb3cubWFwZXJpYWxTdHlsZXNbdGhpcy51aWRdID0gdGhpc1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuVmVjdG9yaWFsU3R5bGUucHJvdG90eXBlLkFkZFN5bWJvbGl6ZXIgPSBmdW5jdGlvbiggaW5TeW1iICwgaW5aTWluLCBpblpNYXggLCBpbklkICkge1xuICAgLy8gb25seSBhcHBseSBvbiBjdXN0b20gc3R5bGUgIVxuICAgaWYgKCB0aGlzLnR5cGUgIT0gU3R5bGUuQ3VzdG9tIClcbiAgICAgIHJldHVybiBudWxsO1xuICAgICAgXG4gICBpZiAodHlwZW9mIGluSWQgPT09IFwidW5kZWZpbmVkXCIpIHsgICBcbiAgICAgIHZhciBpZFN0ciAgICAgICAgICAgID0gXCJcIiArIHRoaXMuY3VySWQ7XG4gICAgICBpZFN0ciAgICAgICAgICAgICAgICA9IG5ldyBBcnJheSgzIC0gaWRTdHIubGVuZ3RoICsgMSkuam9pbignMCcpICsgaWRTdHI7XG4gICAgICB0aGlzLmN1cklkICAgICAgICAgICA9IHRoaXMuY3VySWQgKyAxO1xuICAgICAgXG4gICAgICAvL3ZhciB0bXAgICAgICAgICAgICAgID0galF1ZXJ5LmV4dGVuZCh7fSwgaW5TeW1iKTtcbiAgICAgIHRoaXMuY29udGVudFtpZFN0cl0gID0ge1xuICAgICAgICAgdmlzaWJsZSAgOiB0cnVlLFxuICAgICAgICAgbGF5ZXIgICAgOiBcImJhY2tcIixcbiAgICAgICAgIHMgICAgICAgIDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgem1pbiAgOiBpblpNaW4sXG4gICAgICAgICAgICAgICB6bWF4ICA6IGluWk1heCxcbiAgICAgICAgICAgICAgIHMgICAgIDogW2luU3ltYl0sXG4gICAgICAgICAgICB9XG4gICAgICAgICBdXG4gICAgICB9XG4gICAgICByZXR1cm4gaWRTdHI7XG4gICB9XG4gICBlbHNlIHtcbiAgICAgIGlmICggISAoIGluSWQgaW4gdGhpcy5jb250ZW50ICkgKVxuICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB0aGlzLmNvbnRlbnRbaW5JZF0ucy5wdXNoIChcbiAgICAgICAgIHtcbiAgICAgICAgICAgIHptaW4gIDogaW5aTWluLFxuICAgICAgICAgICAgem1heCAgOiBpblpNYXgsXG4gICAgICAgICAgICBzICAgICA6IFtpblN5bWJdLFxuICAgICAgICAgfVxuICAgICAgKVxuICAgfVxufVxuXG5WZWN0b3JpYWxTdHlsZS5wcm90b3R5cGUuQWRkU3ltYnNDb21wb3NlciA9IGZ1bmN0aW9uKCBpblN5bWJDb21wLGluSWQpIHtcbiAgIC8vIG9ubHkgYXBwbHkgb24gY3VzdG9tIHN0eWxlICFcbiAgIGlmICggdGhpcy50eXBlICE9IFN0eWxlLkN1c3RvbSApXG4gICAgICByZXR1cm4gbnVsbDtcblxuICAgaWYgKHR5cGVvZiBpbklkID09PSBcInVuZGVmaW5lZFwiKSB7ICAgXG4gICAgICB2YXIgaWRTdHIgICAgICAgICAgICA9IFwiXCIgKyB0aGlzLmN1cklkO1xuICAgICAgaWRTdHIgICAgICAgICAgICAgICAgPSBuZXcgQXJyYXkoMyAtIGlkU3RyLmxlbmd0aCArIDEpLmpvaW4oJzAnKSArIGlkU3RyO1xuICAgICAgdGhpcy5jdXJJZCAgICAgICAgICAgPSB0aGlzLmN1cklkICsgMTtcbiAgICAgIHRoaXMuY29udGVudFtpZFN0cl0gID0ge1xuICAgICAgICAgdmlzaWJsZSAgOiB0cnVlLFxuICAgICAgICAgbGF5ZXIgICAgOiBcImJhY2tcIixcbiAgICAgICAgIHMgICAgICAgIDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgem1pbiAgOiBpblN5bWJDb21wLnptaW4sXG4gICAgICAgICAgICAgICB6bWF4ICA6IGluU3ltYkNvbXAuem1heCxcbiAgICAgICAgICAgICAgIHMgICAgIDogaW5TeW1iQ29tcC5zeW1icyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgIF1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpZFN0cjtcbiAgIH1cbiAgIGVsc2Uge1xuICAgICAgaWYgKCAhICggaW5JZCBpbiB0aGlzLmNvbnRlbnQgKSApXG4gICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIHRoaXMuY29udGVudFtpbklkXS5zLnB1c2ggKFxuICAgICAgICAge1xuICAgICAgICAgICAgem1pbiAgOiBpblN5bWJDb21wLnptaW4sXG4gICAgICAgICAgICB6bWF4ICA6IGluU3ltYkNvbXAuem1heCxcbiAgICAgICAgICAgIHMgICAgIDogaW5TeW1iQ29tcC5zeW1icyxcbiAgICAgICAgIH1cbiAgICAgIClcbiAgIH1cbn1cblxuVmVjdG9yaWFsU3R5bGUucHJvdG90eXBlLlNldFZpc2libGUgPSBmdW5jdGlvbiggaW5JZCAsIHZpc2libGUpIHtcbiAgIGlmICggISAoIGluSWQgaW4gdGhpcy5jb250ZW50ICkgKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgdGhpcy5jb250ZW50W2luSWRdLnZpc2libGUgPSB2aXNpYmxlO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yaWFsU3R5bGU7XG4iLCIvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbnZhciBIYW1tZXIgICAgICA9IHJlcXVpcmUoJy4uL2xpYnMvaGFtbWVyLmpzJyksXG51dGlscyAgICAgICA9IHJlcXVpcmUoJy4uLy4uL3Rvb2xzL3V0aWxzLmpzJyk7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gTW91c2VMaXN0ZW5lcihtYXBWaWV3KXtcblxuICAgIGNvbnNvbGUubG9nKFwiICBsaXN0ZW5pbmcgbW91c2UuLi5cIik7XG5cbiAgICB0aGlzLm1hcFZpZXcgICAgICAgICAgICA9IG1hcFZpZXc7XG4gICAgdGhpcy5sYXN0V2hlZWxNaWxsaXMgICAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB0aGlzLmluaXRMaXN0ZW5lcnMoKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5Nb3VzZUxpc3RlbmVyLnByb3RvdHlwZS5pbml0TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIG1vdXNlID0gdGhpcztcblxuICAgIHN3aXRjaCh0aGlzLm1hcFZpZXcudHlwZSl7XG5cbiAgICAgICAgY2FzZSBNYXBlcmlhbC5NQUlOOlxuICAgICAgICBjYXNlIE1hcGVyaWFsLkFOQ0hPUjpcblxuICAgICAgICAgICAgdGhpcy5oYW1tZXIgICAgICAgICAgICAgPSBuZXcgSGFtbWVyKHRoaXMubWFwVmlldy5jYW52YXMpO1xuICAgICAgICAgICAgdGhpcy5oYW1tZXIuZHJhZyAgICAgICAgPSB0aGlzLmRyYWcuYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgdGhpcy5oYW1tZXIub24oXCJkcmFnXCIsIHRoaXMuaGFtbWVyLmRyYWcpO1xuXG4gICAgICAgICAgICAvL3RoaXMubWFwVmlldy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZG93biAgICAgICAgLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgLy90aGlzLm1hcFZpZXcuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmRvd24gICAgICAgIC5iaW5kKHRoaXMpKTtcblxuLy8gICAgICAgICAgLm1vdXNlZG93biAgKCAgKVxuLy8gICAgICAgICAgLm1vdXNldXAgICAgKCB0aGlzLnVwICAgICAgICAgIC5iaW5kKHRoaXMpIClcbi8vICAgICAgICAgIC5tb3VzZWxlYXZlICggdGhpcy5sZWF2ZSAgICAgICAuYmluZCh0aGlzKSlcbi8vICAgICAgICAgIC5tb3VzZW1vdmUgICggVXRpbHMuYXBwbHkgKCB0aGlzICwgXCJtb3ZlXCIgKSlcbi8vICAgICAgICAgIC5kYmxjbGljayAgICggVXRpbHMuYXBwbHkgKCB0aGlzICwgXCJkb3VibGVDbGlja1wiICkpXG4vLyAgICAgICAgICAuYmluZCgnbW91c2V3aGVlbCcsIFV0aWxzLmFwcGx5ICggdGhpcyAsIFwid2hlZWxcIikpICAgXG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE1hcGVyaWFsLkxFTlM6XG4gICAgICAgIGNhc2UgTWFwZXJpYWwuTUlOSUZJRVI6XG4gICAgICAgIGNhc2UgTWFwZXJpYWwuTUFHTklGSUVSOlxuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1hcENhbnZhc1xuICAgICAgICAgICAgLmRibGNsaWNrICAgKCBVdGlscy5hcHBseSAoIHRoaXMgLCBcImRvdWJsZUNsaWNrXCIgKSlcbiAgICAgICAgICAgIC5iaW5kKCdtb3VzZXdoZWVsJywgVXRpbHMuYXBwbHkgKCB0aGlzICwgXCJ3aGVlbE9uWm9vbWVyXCIpKSAgIFxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuXG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbk1vdXNlTGlzdGVuZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHRoaXMuaGFtbWVyLm9mZihcImRyYWdcIiwgdGhpcy5oYW1tZXIuZHJhZyk7XG5cbi8vICB0aGlzLmNvbnRleHQubWFwQ2FudmFzLm9mZihcIm1vdXNlZG93blwiKTtcbi8vICB0aGlzLmNvbnRleHQubWFwQ2FudmFzLm9mZihcIm1vdXNldXBcIik7XG4vLyAgdGhpcy5jb250ZXh0Lm1hcENhbnZhcy5vZmYoXCJtb3VzZW1vdmVcIik7XG4vLyAgdGhpcy5jb250ZXh0Lm1hcENhbnZhcy5vZmYoXCJtb3VzZWxlYXZlXCIpO1xuLy8gIHRoaXMuY29udGV4dC5tYXBDYW52YXMudW5iaW5kKCdkYmxjbGljaycpOyAgXG4vLyAgdGhpcy5jb250ZXh0Lm1hcENhbnZhcy51bmJpbmQoJ21vdXNld2hlZWwnKTsgIFxuLy8gIHRoaXMuY29udGV4dC5tYXBDYW52YXMudW5iaW5kKCd3aGVlbE9uWm9vbWVyJyk7ICBcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5Nb3VzZUxpc3RlbmVyLnByb3RvdHlwZS5kb3duID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgIHRoaXMuY29udGV4dC5tYXBDYW52YXMudHJpZ2dlcihNYXBlcmlhbEV2ZW50cy5NT1VTRV9ET1dOKTtcbn1cblxuTW91c2VMaXN0ZW5lci5wcm90b3R5cGUubGVhdmUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBpZih0aGlzLm1vdXNlRG93bilcbiAgICAgICAgdGhpcy51cChldmVudCk7XG59XG5cbk1vdXNlTGlzdGVuZXIucHJvdG90eXBlLnVwID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdGhpcy5jb250ZXh0Lm1hcENhbnZhcy5yZW1vdmVDbGFzcyggJ21vdmFibGUnIClcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlOyBcbiAgICB0aGlzLmNvbnRleHQubWFwQ2FudmFzLnRyaWdnZXIoTWFwZXJpYWxFdmVudHMuTU9VU0VfVVApO1xufVxuXG5Nb3VzZUxpc3RlbmVyLnByb3RvdHlwZS5kcmFnID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbi8vICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5tYXBWaWV3LmNvbnRleHQubW91c2VQID0gdXRpbHMuZ2V0UG9pbnQoZXZlbnQpO1xuICAgIHRoaXMubWFwVmlldy5jb250ZXh0Lm1vdXNlTSA9IHRoaXMuY29udmVydENhbnZhc1BvaW50VG9NZXRlcnMgKCB0aGlzLm1hcFZpZXcuY29udGV4dC5tb3VzZVAgKTtcblxuLy8gIGlmICghdGhpcy5tb3VzZURvd24pe1xuLy8gIHRoaXMuY29udGV4dC5tYXBDYW52YXMudHJpZ2dlcihNYXBlcmlhbEV2ZW50cy5VUERBVEVfTEFUTE9OKTtcblxuLy8gICQod2luZG93KS50cmlnZ2VyKE1hcGVyaWFsRXZlbnRzLk1PVVNFX01PVkUsIFt0aGlzLm1hcFZpZXcubWFwLCB0aGlzLm1hcFZpZXcubmFtZSwgdGhpcy5tYXBWaWV3LnR5cGVdKTtcbi8vICB9XG4vLyAgZWxzZXtcbi8vICB0aGlzLmNvbnRleHQubWFwQ2FudmFzLmFkZENsYXNzKCAnbW92YWJsZScgKVxuLy8gICQod2luZG93KS50cmlnZ2VyKE1hcGVyaWFsRXZlbnRzLkRSQUdHSU5HX01BUCwgW3RoaXMubWFwVmlldy5uYW1lXSk7XG4vLyAgfVxufVxuXG5Nb3VzZUxpc3RlbmVyLnByb3RvdHlwZS5kb3VibGVDbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgaWYoIXRoaXMubWFwVmlldy56b29tYWJsZSlcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgdGhpcy5jb250ZXh0Lnpvb20gPSBNYXRoLm1pbigxOCwgdGhpcy5jb250ZXh0Lnpvb20gKyAxKTtcbiAgICB0aGlzLmNvbnRleHQuY2VudGVyTSA9IHRoaXMuY29udmVydENhbnZhc1BvaW50VG9NZXRlcnModGhpcy5jb250ZXh0Lm1vdXNlUCk7XG5cbiAgICAvLyByZWZyZXNoIG1vdXNlXG4gICAgdGhpcy5jb250ZXh0Lm1vdXNlUCA9IFV0aWxzLmdldFBvaW50KGV2ZW50KTtcbiAgICB0aGlzLmNvbnRleHQubW91c2VNID0gdGhpcy5jb252ZXJ0Q2FudmFzUG9pbnRUb01ldGVycyAoIHRoaXMuY29udGV4dC5tb3VzZVAgKTtcblxuICAgIHRoaXMubWFwVmlldy5yZWZyZXNoQ3VycmVudExhdExvbigpO1xuXG4gICAgJCh3aW5kb3cpLnRyaWdnZXIoTWFwZXJpYWxFdmVudHMuWk9PTV9UT19SRUZSRVNILCBbdGhpcy5tYXBWaWV3Lm1hcCwgdGhpcy5tYXBWaWV3Lm5hbWUsIHRoaXMubWFwVmlldy50eXBlLCB0aGlzLmNvbnRleHQuem9vbV0pO1xuXG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbk1vdXNlTGlzdGVuZXIucHJvdG90eXBlLndoZWVsID0gZnVuY3Rpb24gKGV2ZW50LCBkZWx0YSkge1xuXG4gICAgaWYoIXRoaXMubWFwVmlldy56b29tYWJsZSlcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGlmKHRoaXMuaGFzSnVzdFdoZWVsZWQoKSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIHByZXZpb3VzWm9vbSA9IHRoaXMuY29udGV4dC56b29tXG5cbiAgICBpZiAoZGVsdGEgPiAwKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC56b29tID0gTWF0aC5taW4oMTgsIHRoaXMuY29udGV4dC56b29tICsgMSk7XG4gICAgICAgIHRoaXMuY29udGV4dC5jZW50ZXJNID0gdGhpcy5jb252ZXJ0Q2FudmFzUG9pbnRUb01ldGVycyh0aGlzLmNvbnRleHQubW91c2VQKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZGVsdGEgPCAwKSB7XG5cbiAgICAgICAgdmFyIGNlbnRlclAgPSB0aGlzLmNvbnRleHQuY29vcmRTLk1ldGVyc1RvUGl4ZWxzKHRoaXMuY29udGV4dC5jZW50ZXJNLngsIHRoaXMuY29udGV4dC5jZW50ZXJNLnksIHRoaXMuY29udGV4dC56b29tKTtcbiAgICAgICAgdmFyIG9sZFNoaWZ0UCA9IG5ldyBQb2ludCggdGhpcy5jb250ZXh0Lm1hcENhbnZhcy53aWR0aCgpLzIgLSB0aGlzLmNvbnRleHQubW91c2VQLnggLCB0aGlzLmNvbnRleHQubWFwQ2FudmFzLmhlaWdodCgpLzIgLSB0aGlzLmNvbnRleHQubW91c2VQLnkpO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC56b29tID0gTWF0aC5tYXgoMCwgdGhpcy5jb250ZXh0Lnpvb20gLSAxKTtcblxuICAgICAgICB2YXIgciA9IHRoaXMuY29udGV4dC5jb29yZFMuUmVzb2x1dGlvbiAoIHRoaXMuY29udGV4dC56b29tICk7XG4gICAgICAgIHZhciBuZXdTaGlmdE0gPSBuZXcgUG9pbnQob2xkU2hpZnRQLnggKiByLCBvbGRTaGlmdFAueSAqIHIpO1xuICAgICAgICB0aGlzLmNvbnRleHQuY2VudGVyTSA9IG5ldyBQb2ludCh0aGlzLmNvbnRleHQubW91c2VNLnggKyBuZXdTaGlmdE0ueCwgdGhpcy5jb250ZXh0Lm1vdXNlTS55IC0gbmV3U2hpZnRNLnkpO1xuICAgIH1cblxuICAgIC8vIHJlZnJlc2ggbW91c2VcbiAgICB0aGlzLmNvbnRleHQubW91c2VQID0gVXRpbHMuZ2V0UG9pbnQoZXZlbnQpO1xuICAgIHRoaXMuY29udGV4dC5tb3VzZU0gPSB0aGlzLmNvbnZlcnRDYW52YXNQb2ludFRvTWV0ZXJzICggdGhpcy5jb250ZXh0Lm1vdXNlUCApO1xuXG4gICAgdGhpcy5tYXBWaWV3LnJlZnJlc2hDdXJyZW50TGF0TG9uKCk7XG5cbiAgICAkKHdpbmRvdykudHJpZ2dlcihNYXBlcmlhbEV2ZW50cy5aT09NX1RPX1JFRlJFU0gsIFt0aGlzLm1hcFZpZXcubWFwLCB0aGlzLm1hcFZpZXcubmFtZSwgdGhpcy5tYXBWaWV3LnR5cGUsIHRoaXMuY29udGV4dC56b29tXSk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbk1vdXNlTGlzdGVuZXIucHJvdG90eXBlLndoZWVsT25ab29tZXIgPSBmdW5jdGlvbiAoZXZlbnQsIGRlbHRhKSB7XG5cbiAgICBpZighdGhpcy5tYXBWaWV3Lnpvb21hYmxlKVxuICAgICAgICByZXR1cm5cblxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgaWYodGhpcy5oYXNKdXN0V2hlZWxlZCgpIHx8IGRlbHRhID09IDApXG4gICAgICAgIHJldHVybjtcblxuICAgIHRoaXMuY29udGV4dC56b29tID0gTWF0aC5taW4oMTgsIHRoaXMuY29udGV4dC56b29tICsgMSAqIGRlbHRhL01hdGguYWJzKGRlbHRhKSk7XG4gICAgdmFyIG1haW5ab29tID0gdGhpcy5tYXBWaWV3Lm1hcGVyaWFsLmdldFpvb20odGhpcy5tYXBWaWV3Lm1hcClcblxuICAgIHN3aXRjaCh0aGlzLm1hcFZpZXcudHlwZSl7XG4gICAgICAgIGNhc2UgTWFwZXJpYWwuTEVOUyA6XG4gICAgICAgIGNhc2UgTWFwZXJpYWwuTUFHTklGSUVSIDogXG4gICAgICAgICAgICBpZih0aGlzLmNvbnRleHQuem9vbSA8IG1haW5ab29tKVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC56b29tID0gbWFpblpvb21cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE1hcGVyaWFsLk1JTklGSUVSIDogXG4gICAgICAgICAgICBpZih0aGlzLmNvbnRleHQuem9vbSA+IG1haW5ab29tKVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC56b29tID0gbWFpblpvb21cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICB0aGlzLm1hcFZpZXcuZGVsdGFab29tID0gdGhpcy5jb250ZXh0Lnpvb20gLSBtYWluWm9vbVxuXG4gICAgJCh3aW5kb3cpLnRyaWdnZXIoTWFwZXJpYWxFdmVudHMuWk9PTV9UT19SRUZSRVNILCBbdGhpcy5tYXBWaWV3Lm1hcCwgdGhpcy5tYXBWaWV3Lm5hbWUsIHRoaXMubWFwVmlldy50eXBlLCB0aGlzLmNvbnRleHQuem9vbV0pO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuLy9VdGlsc1xuXG5Nb3VzZUxpc3RlbmVyLnByb3RvdHlwZS5oYXNKdXN0V2hlZWxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaGFzSnVzdFdoZWVsZWQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRoaXMubGFzdFdoZWVsTWlsbGlzIDwgMzAwO1xuICAgIHRoaXMubGFzdFdoZWVsTWlsbGlzID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICByZXR1cm4gaGFzSnVzdFdoZWVsZWQ7XG59XG5cbi8qKlxuICogcGFyYW0gIG1vdXNlUCA6IFBvaW50IHdpdGggY29vcmRpbmF0ZXMgaW4gcGl4ZWxzLCBpbiB0aGUgQ2FudmFzIGNvb3JkaW5hdGVzIHN5c3RlbVxuICogcmV0dXJuIG1vdXNlTSA6IFBvaW50IHdpdGggY29vcmRpbmF0ZXMgaW4gbWV0ZXJzLCBpbiB0aGUgTWV0ZXJzIGNvb3JkaW5hdGVzIHN5c3RlbVxuICovXG5Nb3VzZUxpc3RlbmVyLnByb3RvdHlwZS5jb252ZXJ0Q2FudmFzUG9pbnRUb01ldGVycyA9IGZ1bmN0aW9uIChjYW52YXNQb2ludCkge1xuXG4gICAgdmFyIHcgPSB0aGlzLm1hcFZpZXcuY2FudmFzLndpZHRoLFxuICAgICAgICBoID0gdGhpcy5tYXBWaWV3LmNhbnZhcy5oZWlnaHQsXG5cbiAgICAgICAgY2VudGVyUCA9IHRoaXMubWFwVmlldy5jb250ZXh0LmNvb3JkUy5NZXRlcnNUb1BpeGVscyhcbiAgICAgICAgICAgIHRoaXMubWFwVmlldy5jb250ZXh0LmNlbnRlck0ueCwgXG4gICAgICAgICAgICB0aGlzLm1hcFZpZXcuY29udGV4dC5jZW50ZXJNLnksIFxuICAgICAgICAgICAgdGhpcy5tYXBWaWV3LmNvbnRleHQuem9vbVxuICAgICAgICApLFxuICAgICAgICBcbiAgICAgICAgc2hpZnRYID0gdy8yIC0gY2FudmFzUG9pbnQueCxcbiAgICAgICAgc2hpZnRZID0gaC8yIC0gY2FudmFzUG9pbnQueSxcbiAgICAgICAgXG4gICAgICAgIG1ldGVycyA9IHRoaXMubWFwVmlldy5jb250ZXh0LmNvb3JkUy5QaXhlbHNUb01ldGVycyhcbiAgICAgICAgICAgIGNlbnRlclAueCAtIHNoaWZ0WCwgXG4gICAgICAgICAgICBjZW50ZXJQLnkgKyBzaGlmdFksIFxuICAgICAgICAgICAgdGhpcy5tYXBWaWV3LmNvbnRleHQuem9vbVxuICAgICAgICApO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKG1ldGVycyk7XG4gICAgcmV0dXJuIG1ldGVycztcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vdXNlTGlzdGVuZXI7XG5cbiIsIi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gQ29sb3JiYXJSZW5kZXJlciAoIG1hcFZpZXcgKSB7XG4gICB0aGlzLm1hcFZpZXcgID0gbWFwVmlldztcbiAgIHRoaXMuZ2wgICAgICAgPSBtYXBWaWV3LmNvbnRleHQuYXNzZXRzLmN0eDtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5Db2xvcmJhclJlbmRlcmVyLnByb3RvdHlwZS5yZWZyZXNoQWxsQ29sb3JCYXJzID0gZnVuY3Rpb24gKCkge1xuXG4gICB2YXIgY29sb3JiYXJzID0gbWFwZXJpYWxDb2xvcmJhcnM7XG5cbiAgIHRoaXMuZ2wuZmx1c2goKTtcbiAgIHRoaXMuZ2wuZmluaXNoKCk7XG5cbiAgIGZvciAoIHZhciBjb2xvcmJhclVJRCBpbiBjb2xvcmJhcnMgKSB7XG4gICAgICB2YXIgY29sb3JiYXIgPSBjb2xvcmJhcnNbY29sb3JiYXJVSURdO1xuICAgICAgaWYoY29sb3JiYXIudmVyc2lvbiAhPSBjb2xvcmJhci5kYXRhLnZlcnNpb24pe1xuICAgICAgICAgdGhpcy5yZW5kZXJDb2xvcmJhcihjb2xvcmJhcik7XG4gICAgICAgICBjb2xvcmJhci52ZXJzaW9uID0gY29sb3JiYXIuZGF0YS52ZXJzaW9uO1xuICAgICAgfVxuICAgfVxuXG4gICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5Db2xvcmJhclJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXJDb2xvcmJhciA9IGZ1bmN0aW9uIChjb2xvcmJhcikge1xuXG4gICBpZiAoIGNvbG9yYmFyID09IG51bGwgIHx8ICEgY29sb3JiYXIuZGF0YS5Jc1ZhbGlkICgpICkge1xuICAgICAgY29uc29sZS5sb2cgKCBcIkludmFsaWQgY29sb3JiYXIgZGF0YSA6IFwiICsgY29sb3JiYXJVSUQgKTtcbiAgIH1cblxuICAgaWYoIWNvbG9yYmFyLnRleClcbiAgICAgIGNvbG9yYmFyLnRleCA9IHt9O1xuXG4gICAvLyBSYXN0ZXIgaXQgIVxuICAgdmFyIGRhdGEgPSBbXTtcbiAgIGZvciAodmFyIGkgPSAwLjAgOyBpIDwgMS4wIDsgaSs9IDEuMC8yNTYpIHtcbiAgICAgIHZhciBjID0gY29sb3JiYXIuZGF0YS5HZXQgKCBpICkgO1xuICAgICAgZGF0YS5wdXNoICggYy5SaSgpICk7XG4gICAgICBkYXRhLnB1c2ggKCBjLkdpKCkgKTtcbiAgICAgIGRhdGEucHVzaCAoIGMuQmkoKSApO1xuICAgICAgZGF0YS5wdXNoICggYy5BaSgpICk7XG4gICB9XG5cbiAgIGRhdGEgPSBuZXcgVWludDhBcnJheShkYXRhKTtcbiAgIFxuICAgaWYgKCBjb2xvcmJhci50ZXhbdGhpcy5tYXBWaWV3LmlkXSApIHtcbiAgICAgIHRoaXMuZGVsZXRlVGV4dHVyZSAoIGNvbG9yYmFyLnRleFt0aGlzLm1hcFZpZXcuaWRdICk7XG4gICB9XG5cbiAgIHRyeSB7XG4gICAgICBjb2xvcmJhci50ZXhbdGhpcy5tYXBWaWV3LmlkXSA9IHRoaXMuZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgdGhpcy5nbC5iaW5kVGV4dHVyZSAgKHRoaXMuZ2wuVEVYVFVSRV8yRCwgY29sb3JiYXIudGV4W3RoaXMubWFwVmlldy5pZF0gKTtcbiAgICAgIHRoaXMuZ2wucGl4ZWxTdG9yZWkgICh0aGlzLmdsLlVOUEFDS19GTElQX1lfV0VCR0wgICwgZmFsc2UgICAgKTtcbiAgICAgIHRoaXMuZ2wudGV4SW1hZ2UyRCAgICh0aGlzLmdsLlRFWFRVUkVfMkQsIDAgLCB0aGlzLmdsLlJHQkEsIDI1NiAsIDEgLCAwLCB0aGlzLmdsLlJHQkEsIHRoaXMuZ2wuVU5TSUdORURfQllURSwgZGF0YSApO1xuICAgICAgdGhpcy5nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy5nbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMuZ2wuTkVBUkVTVCk7XG4gICAgICB0aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5nbC5ORUFSRVNUKTtcbiAgICAgIHRoaXMuZ2wudGV4UGFyYW1ldGVyaSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuZ2wuVEVYVFVSRV9XUkFQX1MsdGhpcy5nbC5DTEFNUF9UT19FREdFKTtcbiAgICAgIHRoaXMuZ2wudGV4UGFyYW1ldGVyaSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuZ2wuVEVYVFVSRV9XUkFQX1QsdGhpcy5nbC5DTEFNUF9UT19FREdFKTtcbiAgICAgIHRoaXMuZ2wuYmluZFRleHR1cmUgICh0aGlzLmdsLlRFWFRVUkVfMkQsIG51bGwgKTtcbiAgIH0gY2F0Y2ggKGUpIHsgXG4gICAgICB0aGlzLmRlbGV0ZVRleHR1cmUgKCBjb2xvcmJhci50ZXhbdGhpcy5tYXBWaWV3LmlkXSApO1xuICAgICAgY29uc29sZS5sb2cgKCBcIkVycm9yIGluIGNvbG9yYmFyIGJ1aWxkaW5nIDogXCIgKyBjb2xvcmJhclVJRCApO1xuICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkNvbG9yYmFyUmVuZGVyZXIucHJvdG90eXBlLmRlbGV0ZVRleHR1cmUgPSBmdW5jdGlvbiAodGV4KSB7XG4gICB0aGlzLmdsLmRlbGV0ZVRleHR1cmUgKCB0ZXggKTtcbiAgIGRlbGV0ZSB0ZXg7XG4gICB0ZXggPSBudWxsO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3JiYXJSZW5kZXJlcjtcbiIsIlxudmFyIHV0aWxzICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vLi4vLi4vdG9vbHMvdXRpbHMuanMnKSxcbiAgICBFeHRlbmRDYW52YXNDb250ZXh0ICAgICA9IHJlcXVpcmUoJy4vdG9vbHMvcmVuZGVyLXRleHQuanMnKSxcbiAgICBUaWxlUmVuZGVyZXIgICAgICAgICAgICA9IHJlcXVpcmUoJy4vdGlsZS1yZW5kZXJlci5qcycpO1xuICAgIFxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5mdW5jdGlvbiBEeW5hbWljYWxSZW5kZXJlciAoIGdsLCBkeW5hbWljYWxEYXRhLCBzdHlsZSApIHtcbiAgIC8vIFRoZXkgZG9uJ3QgcmVhbHkgbmVlZCBtYXBWaWV3IC4uLiBBbmQgaXQncyB0aGUgc2FtZSBmb3IgYWxsIGdsIFhYIGxheWVycyBubyA/XG4gICAvLyB1cGdyYWRlIDogT25lIEdMIGNhbnZhcyBmb3IgZXZlcnkgR0wgcmVuZGVyZXJzIDogdmlld3MgKyAgRHluYW1pY2FsUmVuZGVyZXJzXG5cbiAgIHRoaXMuaWQgICAgICAgICAgICAgID0gdXRpbHMuZ2VuZXJhdGVVSUQoKTtcbiAgIHRoaXMuZHluYW1pY2FsRGF0YSAgID0gZHluYW1pY2FsRGF0YTtcbiAgIHRoaXMuc3R5bGUgICAgICAgICAgID0gc3R5bGU7XG4gICBcbiAgIHRoaXMuZ2wgICAgICAgICAgICAgID0gZ2w7XG4gICB0aGlzLmNudiAgICAgICAgICAgICA9IG51bGw7XG4gICB0aGlzLmN0eCAgICAgICAgICAgICA9IG51bGw7XG4gICB0aGlzLmxheWVyQ291bnQgICAgICA9IDA7XG4gICB0aGlzLnogICAgICAgICAgICAgICA9IG51bGw7XG4gICB0aGlzLnR4ICAgICAgICAgICAgICA9IG51bGw7XG4gICB0aGlzLnR5ICAgICAgICAgICAgICA9IG51bGw7IFxuICAgdGhpcy5uYnR4ICAgICAgICAgICAgPSBudWxsO1xuICAgdGhpcy5uYnR5ICAgICAgICAgICAgPSBudWxsO1xuICAgXG4gICB0aGlzLncgICAgICAgICAgICAgICA9IDA7XG4gICB0aGlzLmggICAgICAgICAgICAgICA9IDA7XG4gICBcbiAgIHRoaXMudmVyc2lvbiAgICAgICAgID0gMDtcbiAgIHRoaXMudGV4ICAgICAgICAgICAgID0gW107XG4gICBcbiAgIHRoaXMuaW5pdGlhbFJlc29sdXRpb24gICA9IDIgKiBNYXRoLlBJICogNjM3ODEzNyAvIE1hcGVyaWFsLnRpbGVTaXplO1xuICAgdGhpcy5vcmlnaW5TaGlmdCAgICAgICAgID0gMiAqIE1hdGguUEkgKiA2Mzc4MTM3IC8gMi4wIDtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5EeW5hbWljYWxSZW5kZXJlci5wcm90b3R5cGUuaXNTeW5jID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKHRoaXMudmVyc2lvbiA9PSB0aGlzLmR5bmFtaWNhbERhdGEudmVyc2lvbil7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgIGlmKHRoaXMuY252KVxuICAgICAgICAgIHRoaXMuUmVzZXQoKTtcbiAgICAgICBcbiAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkR5bmFtaWNhbFJlbmRlcmVyLnByb3RvdHlwZS5SZWZyZXNoID0gZnVuY3Rpb24gKCB6ICwgdGlsZVgsIHRpbGVZLCBuYlRYICwgbmJUWSApIHtcblxuICAgdmFyIGNhbWVyYU1vdmVkID0gdGhpcy56ICE9IHogfHwgdGhpcy50eCA9PSBudWxsIHx8IHRpbGVYIDwgdGhpcy50eCB8fCB0aWxlWSA8IHRoaXMudHkgfHwgdGlsZVggKyBuYlRYID4gdGhpcy50eCArIHRoaXMubmJ0eCB8fCB0aWxlWSArIG5iVFkgPiB0aGlzLnR5ICsgdGhpcy5uYnR5LFxuICAgICAgIGRhdGFDaGFuZ2VkID0gdGhpcy52ZXJzaW9uICE9IHRoaXMuZHluYW1pY2FsRGF0YS52ZXJzaW9uO1xuXG4gICBpZiAoY2FtZXJhTW92ZWQgfHwgZGF0YUNoYW5nZWQpIHtcblxuICAgICAgdGhpcy5SZXNldCgpO1xuICAgICAgLy9UT0RPIHRyYWNrIGNldHRlIHZlcnNpb24sIGV0IGNoZWNrIHNpIGxlIHNsaWRlciBsJ3VwZGF0ZSBwbHVzIHZpdGUgcXVlIGxlIHJlbmRlcmluZyA6IHN3YXAgZGUgMiBldGF0cyA6IHVwdG9kYXRlL3lldHVwZGF0aW5nICBcbiAgICAgIHRoaXMudmVyc2lvbiA9IHRoaXMuZHluYW1pY2FsRGF0YS52ZXJzaW9uO1xuXG4gICAgICB2YXIgbmJUWDIgPSAxO1xuICAgICAgd2hpbGUgKCBuYlRYMiA8IG5iVFggKSBuYlRYMiA9IG5iVFgyICogMjtcbiAgICAgIHZhciBuYlRZMiA9IDE7XG4gICAgICB3aGlsZSAoIG5iVFkyIDwgbmJUWSApIG5iVFkyID0gbmJUWTIgKiAyO1xuICAgICAgXG4gICAgICB2YXIgc2l6ZVggICA9IG5iVFgyICogTWFwZXJpYWwudGlsZVNpemU7XG4gICAgICB2YXIgc2l6ZVkgICA9IG5iVFkyICogTWFwZXJpYWwudGlsZVNpemU7XG5cbiAgICAgIHRoaXMudyA9IHNpemVYO1xuICAgICAgdGhpcy5oID0gc2l6ZVk7XG5cbiAgICAgIHRoaXMuQWxsb2NDYW52YXMgKHNpemVYLHNpemVZKSA7XG4gICAgICBcbiAgICAgIHZhciBkeCA9IG5iVFgyIC0gKG5iVFgpO1xuICAgICAgdmFyIGR5ID0gbmJUWTIgLSAobmJUWSk7XG4gICAgICBcbiAgICAgIHZhciB0eCA9IHRpbGVYIC0gTWF0aC5mbG9vciAoIGR4IC8gMi4wICk7XG4gICAgICB2YXIgdHkgPSB0aWxlWSAtIE1hdGguZmxvb3IgKCBkeSAvIDIuMCApO1xuICAgICAgXG4gICAgICB0aGlzLnR4ICAgICA9IHR4O1xuICAgICAgdGhpcy50eSAgICAgPSB0eTtcbiAgICAgIHRoaXMubmJ0eCAgID0gbmJUWDJcbiAgICAgIHRoaXMubmJ0eSAgID0gbmJUWTI7XG4gICAgICB0aGlzLnogICAgICA9IHo7XG4gICAgICBcbiAgICAgIHZhciB0bXBQICAgID0gTWF0aC5wb3cgKCAyICwgdGhpcy56KTtcbiAgICAgIHZhciByZXMgICAgID0gdGhpcy5pbml0aWFsUmVzb2x1dGlvbiAvIHRtcFA7XG4gICAgICB2YXIgbWFwU2l6ZSA9IE1hcGVyaWFsLnRpbGVTaXplICogdG1wUDtcbiAgICAgIHRoaXMuc2NhbGVYID0gKDEgLyByZXMpO1xuICAgICAgdGhpcy5zY2FsZVkgPSAtICgxIC8gcmVzKTtcbiAgICAgIHRoaXMudHJYICAgID0gKHRoaXMub3JpZ2luU2hpZnQgLyByZXMpIC0gdGhpcy50eCAqIE1hcGVyaWFsLnRpbGVTaXplO1xuICAgICAgdGhpcy50clkgICAgPSB0aGlzLmggLSAoKHRoaXMub3JpZ2luU2hpZnQgLyByZXMpIC0gdGhpcy50eSAqIE1hcGVyaWFsLnRpbGVTaXplKTtcbiAgIH1cbn1cblxuRHluYW1pY2FsUmVuZGVyZXIucHJvdG90eXBlLkFsbG9jQ2FudmFzID0gZnVuY3Rpb24gKCBzaXplWCwgc2l6ZVkpIHtcbiAgIHRoaXMuY252ICAgICAgICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgIHRoaXMuY252LmhlaWdodCAgICAgID0gc2l6ZVkgO1xuICAgdGhpcy5jbnYud2lkdGggICAgICAgPSBzaXplWCA7XG4gICB0aGlzLmN0eCAgICAgICAgICAgICA9IHRoaXMuY252LmdldENvbnRleHQoXCIyZFwiKTtcbiAgIEV4dGVuZENhbnZhc0NvbnRleHQgICggdGhpcy5jdHggKTtcbiAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbj1cInNvdXJjZS1vdmVyXCI7XG5cbiAgIC8vIENsZWFyIC4uLlxuICAgdGhpcy5jdHguYmVnaW5QYXRoICAgKCAgKTtcbiAgIHRoaXMuY3R4LnJlY3QgICAgICAgICggMCwwLHRoaXMuY252LndpZHRoLHRoaXMuY252LmhlaWdodCApO1xuICAgdGhpcy5jdHguY2xvc2VQYXRoICAgKCAgKTtcbiAgIHRoaXMuY3R4LmZpbGxTdHlsZSAgICA9ICdyZ2JhKDI1NSwyNTUsMjU1LDAuMCknO1xuICAgdGhpcy5jdHguZmlsbCAgICAgICAgKCAgKTtcbiAgIFxuICAgdGhpcy5jdHguc2V0VGV4Vmlld0JveCgtMSwtMSxzaXplWCsxLHNpemVZKzEpXG59XG5cbkR5bmFtaWNhbFJlbmRlcmVyLnByb3RvdHlwZS5SZXNldCA9IGZ1bmN0aW9uICggICkge1xuICAgdmFyIGdsICAgICAgICAgICAgPSB0aGlzLmdsO1xuICAgdGhpcy5sYXllckNvdW50ICAgPSAwXG4gICBpZiAodGhpcy5jbnYpIHtcbiAgICAgIGRlbGV0ZSAgICAgIHRoaXMuY252O1xuICAgICAgdGhpcy5jbnYgICAgPSBudWxsO1xuICAgfVxuICAgaWYgKHRoaXMudGV4Lmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAgOyBpIDwgdGhpcy50ZXgubGVuZ3RoIDsgKytpKSB7XG4gICAgICAgICBnbC5kZWxldGVUZXh0dXJlICggdGhpcy50ZXhbaV0gKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudGV4ID0gW107XG4gICB9XG59XG5cbkR5bmFtaWNhbFJlbmRlcmVyLnByb3RvdHlwZS5SZWxlYXNlID0gZnVuY3Rpb24gKCAgKSB7XG4gICB0aGlzLlJlc2V0KCk7XG59XG5cbkR5bmFtaWNhbFJlbmRlcmVyLnByb3RvdHlwZS5Jc1VwVG9EYXRlID0gZnVuY3Rpb24gKCApIHtcbiAgIHJldHVybiB0aGlzLmxheWVyQ291bnQgPT0gbnVsbDtcbn1cblxuRHluYW1pY2FsUmVuZGVyZXIucHJvdG90eXBlLlVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcblxuICAgaWYgKHRoaXMuY252ID09IG51bGwgfHwgdGhpcy5sYXllckNvdW50ID09IG51bGwgfHwgdGhpcy5zdHlsZSA9PSBudWxsKVxuICAgICAgcmV0dXJuIDA7XG5cbiAgIHZhciBnbCAgICAgICAgID0gdGhpcy5nbDtcblxuICAgdGhpcy5jdHguX3N4ID0gdGhpcy5zY2FsZVg7XG4gICB0aGlzLmN0eC5fc3kgPSB0aGlzLnNjYWxlWTtcbiAgIHRoaXMuY3R4Ll90eCA9IHRoaXMudHJYO1xuICAgdGhpcy5jdHguX3R5ID0gdGhpcy50clk7XG5cbiAgIHZhciByZW5kZXJlclN0YXR1cyAgID0gVGlsZVJlbmRlcmVyLlJlbmRlckR5bmFtaWNhbExheWVyICh0aGlzLmN0eCAsIHRoaXMuZHluYW1pY2FsRGF0YSAsIHRoaXMueiAsIHRoaXMuc3R5bGUgLCB0aGlzLmxheWVyQ291bnQgKSA7XG4gICB0aGlzLmxheWVyQ291bnQgICAgICA9IHJlbmRlcmVyU3RhdHVzWzBdO1xuXG4gICB2YXIgZGlmZlQgPSAwO1xuICAgaWYgKHRoaXMuSXNVcFRvRGF0ZSgpKSB7IC8vIFJlbmRlciBpcyBmaW5pc2hlZCwgYnVpbGQgR0wgVGV4dHVyZVxuICAgICAgdmFyIGRhdGUgICAgPSAobmV3IERhdGUpXG4gICAgICB2YXIgc3RhcnRUICA9IGRhdGUuZ2V0VGltZSgpXG4gICAgICB0aGlzLl9CdWlsZFRleHR1cmUoKTtcbiAgICAgIGRpZmZUICAgPSBkYXRlLmdldFRpbWUoKSAtIHN0YXJ0VDtcbiAgIH1cbiAgIFxuICAgcmV0dXJuIHJlbmRlcmVyU3RhdHVzWzFdICsgZGlmZlRcbn1cblxuRHluYW1pY2FsUmVuZGVyZXIucHJvdG90eXBlLkdldFRleCA9IGZ1bmN0aW9uICggdHggLCB0eSkge1xuICAgdmFyIGkgPSB0eCAtIHRoaXMudHg7XG4gICB2YXIgaiA9IHR5IC0gdGhpcy50eTtcbiAgIGlmICggaSA+PSB0aGlzLm5idHggfHwgaiA+PSB0aGlzLm5idHkgfHwgdGhpcy5sYXllckNvdW50ICE9IG51bGwgfHwgaSA8IDAgfHwgaiA8IDApIHtcbiAgICAgIGNvbnNvbGUubG9nICggXCJpbnZhbGlkIGN1c3RvbSB0aWxlXCIpXG4gICAgICByZXR1cm4gbnVsbFxuICAgfVxuICAgaiA9IHRoaXMubmJ0eSAtIGogLSAxXG4gICByZXR1cm4gdGhpcy50ZXggWyBpICsgaiAqIHRoaXMubmJ0eCBdXG59XG5cbkR5bmFtaWNhbFJlbmRlcmVyLnByb3RvdHlwZS5fQnVpbGRUZXh0dXJlID0gZnVuY3Rpb24gKCkge1xuXG4gICB2YXIgZ2wgICAgICAgICAgICA9IHRoaXMuZ2wsXG4gICAgICAgdGlsZUNhbnZhcyAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgXG4gICB0aWxlQ2FudmFzLndpZHRoICA9IE1hcGVyaWFsLnRpbGVTaXplO1xuICAgdGlsZUNhbnZhcy5oZWlnaHQgPSBNYXBlcmlhbC50aWxlU2l6ZTtcbiAgIHZhciB0aWxlQ2FudmFzQ3R4ID0gdGlsZUNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgXG4gICB0aWxlQ2FudmFzQ3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbj1cImNvcHlcIjtcbiAgIFxuICAgZm9yICh2YXIgaiA9IDAgOyBqIDwgdGhpcy5uYnR5IDsgaiA9IGogKyAxICkge1xuICAgICAgZm9yICh2YXIgaSA9IDAgOyBpIDwgdGhpcy5uYnR4IDsgaSA9IGkgKyAxICkge1xuICAgICAgXG4gICAgICAgICB2YXIgdHggICA9IHRoaXMudHggKyBpXG4gICAgICAgICB2YXIgdHkgICA9IHRoaXMudHkgKyBqXG4gICAgICAgICB2YXIgdGV4ICA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICAgIFxuICAgICAgICAgdGlsZUNhbnZhc0N0eC5kcmF3SW1hZ2UodGhpcy5jbnYsIGkqTWFwZXJpYWwudGlsZVNpemUsIGoqTWFwZXJpYWwudGlsZVNpemUgLCBNYXBlcmlhbC50aWxlU2l6ZSAsIE1hcGVyaWFsLnRpbGVTaXplICwgMCAsIDAgLCBNYXBlcmlhbC50aWxlU2l6ZSAsIE1hcGVyaWFsLnRpbGVTaXplKTtcbiAgICAgIFxuICAgICAgICAgZ2wuYmluZFRleHR1cmUgIChnbC5URVhUVVJFXzJEICAgICAgICAgICAsIHRleCAgICAgICAgICAgKTtcbiAgICAgICAgIGdsLnBpeGVsU3RvcmVpICAoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCAgLCBmYWxzZSAgICAgICAgICk7XG4gICAgICAgICBnbC50ZXhJbWFnZTJEICAgKGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgMCAgICAgICAgICAgICAgICAgICAgICAsIGdsLlJHQkEgICAgLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCB0aWxlQ2FudmFzKTtcbiAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCBnbC5URVhUVVJFX01BR19GSUxURVIgICwgZ2wuTkVBUkVTVCApO1xuICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJEICAgICAgICAgICAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiAgLCBnbC5ORUFSRVNUICk7XG4gICAgICAgICB0aGlzLnRleC5wdXNoICggdGV4ICk7XG4gICAgICB9XG4gICB9XG4gICBcbiAgIGdsLmJpbmRUZXh0dXJlICAoZ2wuVEVYVFVSRV8yRCAsIG51bGwgKTtcbiAgIGRlbGV0ZSB0aWxlQ2FudmFzQ3R4O1xuICAgZGVsZXRlIHRpbGVDYW52YXM7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxubW9kdWxlLmV4cG9ydHMgPSBEeW5hbWljYWxSZW5kZXJlcjtcbiIsIlxudmFyIHV0aWxzICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vLi4vLi4vdG9vbHMvdXRpbHMuanMnKSxcbiAgICBHTFRvb2xzICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL3Rvb2xzL2dsLXRvb2xzLmpzXCIpLFxuICAgIENvb3JkaW5hdGVTeXN0ZW0gICAgICAgID0gcmVxdWlyZSgnLi4vLi4vbGlicy9jb29yZGluYXRlLXN5c3RlbS5qcycpO1xuICAgIFxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5mdW5jdGlvbiBIZWF0bWFwUmVuZGVyZXIgKCBtYXBWaWV3LCBoZWF0bWFwRGF0YSwgY29sb3JiYXIsIG9wdGlvbnMgKSB7XG4gICAvLyBUaGV5IGRvbid0IHJlYWx5IG5lZWQgbWFwVmlldyAuLi4gQW5kIGl0J3MgdGhlIHNhbWUgZm9yIGFsbCBnbCBYWCBsYXllcnMgbm8gP1xuXG4gICB0aGlzLmlkICAgICAgICAgICAgICA9IHV0aWxzLmdlbmVyYXRlVUlEKCk7XG4gICB0aGlzLm1hcFZpZXcgICAgICAgICA9IG1hcFZpZXc7XG4gICB0aGlzLmhlYXRtYXBEYXRhICAgICA9IGhlYXRtYXBEYXRhO1xuICAgdGhpcy5jb2xvcmJhciAgICAgICAgPSBjb2xvcmJhcjtcbiAgIHRoaXMub3B0aW9ucyAgICAgICAgID0gb3B0aW9ucztcbiAgIFxuICAgdGhpcy5nbCAgICAgICAgICAgICAgPSBtYXBWaWV3LmNvbnRleHQuYXNzZXRzLmN0eDtcbiAgIHRoaXMuYXNzZXRzICAgICAgICAgID0gbWFwVmlldy5jb250ZXh0LmFzc2V0cztcbiAgIHRoaXMubGF5ZXJDb3VudCAgICAgID0gMDtcbiAgIHRoaXMueiAgICAgICAgICAgICAgID0gbnVsbDtcbiAgIHRoaXMudHggICAgICAgICAgICAgID0gdGhpcy50eSA9IHRoaXMubmJ0eCA9IHRoaXMubmJ0eSA9IG51bGw7XG4gICB0aGlzLncgICAgICAgICAgICAgICA9IHRoaXMuaCA9IDA7XG4gICB0aGlzLmZybUIgICAgICAgICAgICA9IG51bGw7XG4gICB0aGlzLnRleEIgICAgICAgICAgICA9IG51bGw7XG4gICB0aGlzLmNzICAgICAgICAgICAgICA9IG5ldyBDb29yZGluYXRlU3lzdGVtIChNYXBlcmlhbC50aWxlU2l6ZSlcblxuICAgdGhpcy52ZXJzaW9uICAgICAgICAgPSAwO1xuICAgdGhpcy50ZXggICAgICAgICAgICAgPSBbXTtcblxuICAgdGhpcy5pbml0aWFsUmVzb2x1dGlvbiAgID0gMiAqIE1hdGguUEkgKiA2Mzc4MTM3IC8gTWFwZXJpYWwudGlsZVNpemU7XG4gICB0aGlzLm9yaWdpblNoaWZ0ICAgICAgICAgPSAyICogTWF0aC5QSSAqIDYzNzgxMzcgLyAyLjAgO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkhlYXRtYXBSZW5kZXJlci5wcm90b3R5cGUuaXNTeW5jID0gZnVuY3Rpb24gKCkge1xuICBpZih0aGlzLnZlcnNpb24gPT0gdGhpcy5oZWF0bWFwRGF0YS52ZXJzaW9uKXtcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGVsc2V7XG4gICAgIGlmKHRoaXMudGV4Qil7XG4gICAgICAgIGNvbnNvbGUubG9nKFwibm90IHN5bmMgOiByZXNldFwiKTtcbiAgICAgICAgdGhpcy5SZXNldCgpO1xuICAgICB9XG4gICAgIFxuICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5IZWF0bWFwUmVuZGVyZXIucHJvdG90eXBlLlJlZnJlc2ggPSBmdW5jdGlvbiAoIHogLCB0aWxlWCwgdGlsZVksIG5iVFggLCBuYlRZICkge1xuICAgXG4gICB2YXIgY2FtZXJhTW92ZWQgPSB0aGlzLnogIT0geiB8fCB0aGlzLnR4ID09IG51bGwgfHwgdGlsZVggPCB0aGlzLnR4IHx8IHRpbGVZIDwgdGhpcy50eSB8fCB0aWxlWCArIG5iVFggPiB0aGlzLnR4ICsgdGhpcy5uYnR4IHx8IHRpbGVZICsgbmJUWSA+IHRoaXMudHkgKyB0aGlzLm5idHksXG4gICAgICAgZGF0YUNoYW5nZWQgPSB0aGlzLnZlcnNpb24gIT0gdGhpcy5oZWF0bWFwRGF0YS52ZXJzaW9uO1xuXG4gICBpZiAoY2FtZXJhTW92ZWQgfHwgZGF0YUNoYW5nZWQpIHtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coXCJyZWZlc2ggOiByZXNldFwiKTtcbiAgICAgIHRoaXMuUmVzZXQoKTtcbiAgICAgIHRoaXMudmVyc2lvbiA9IHRoaXMuaGVhdG1hcERhdGEudmVyc2lvbjtcbiAgICAgIFxuICAgICAgdmFyIG5iVFgyID0gMTtcbiAgICAgIHdoaWxlICggbmJUWDIgPCBuYlRYICkgbmJUWDIgPSBuYlRYMiAqIDI7XG4gICAgICB2YXIgbmJUWTIgPSAxO1xuICAgICAgd2hpbGUgKCBuYlRZMiA8IG5iVFkgKSBuYlRZMiA9IG5iVFkyICogMjtcbiAgICAgIFxuICAgICAgdmFyIHNpemVYICAgPSBuYlRYMiAqIDI1NjtcbiAgICAgIHZhciBzaXplWSAgID0gbmJUWTIgKiAyNTY7XG4gICAgICBcbiAgICAgIHRoaXMudyA9IHNpemVYO1xuICAgICAgdGhpcy5oID0gc2l6ZVk7XG4gICBcbiAgICAgIGNvbnNvbGUubG9nKFwiQWxsb2NCdWZmZXJcIik7XG4gICAgICB0aGlzLkFsbG9jQnVmZmVyIChzaXplWCxzaXplWSkgO1xuICAgICAgXG4gICAgICB2YXIgZHggPSBuYlRYMiAtIChuYlRYKTtcbiAgICAgIHZhciBkeSA9IG5iVFkyIC0gKG5iVFkpO1xuICAgICAgXG4gICAgICB2YXIgdHggPSB0aWxlWCAtIE1hdGguZmxvb3IgKCBkeCAvIDIuMCApO1xuICAgICAgdmFyIHR5ID0gdGlsZVkgLSBNYXRoLmZsb29yICggZHkgLyAyLjAgKTtcbiAgICAgIFxuICAgICAgdGhpcy50eCAgICAgPSB0eDtcbiAgICAgIHRoaXMudHkgICAgID0gdHk7XG4gICAgICB0aGlzLm5idHggICA9IG5iVFgyXG4gICAgICB0aGlzLm5idHkgICA9IG5iVFkyO1xuICAgICAgdGhpcy56ICAgICAgPSB6O1xuICAgICAgXG4gICAgICB2YXIgdG1wUCAgICA9IE1hdGgucG93ICggMiAsIHRoaXMueik7XG4gICAgICB2YXIgcmVzICAgICA9IHRoaXMuaW5pdGlhbFJlc29sdXRpb24gLyB0bXBQO1xuICAgICAgdmFyIG1hcFNpemUgPSAyNTYgKiB0bXBQO1xuICAgICAgdGhpcy5zY2FsZVggPSAoMSAvIHJlcyk7XG4gICAgICB0aGlzLnNjYWxlWSA9IC0gKDEgLyByZXMpO1xuICAgICAgdGhpcy50clggICAgPSAodGhpcy5vcmlnaW5TaGlmdCAvIHJlcykgLSB0aGlzLnR4ICogMjU2O1xuICAgICAgdGhpcy50clkgICAgPSB0aGlzLmggLSAoKHRoaXMub3JpZ2luU2hpZnQgLyByZXMpIC0gdGhpcy50eSAqIDI1Nik7XG4gICB9XG59XG5cbkhlYXRtYXBSZW5kZXJlci5wcm90b3R5cGUuQWxsb2NCdWZmZXIgPSBmdW5jdGlvbiAoIHNpemVYICwgc2l6ZVkgKSB7XG4gICB2YXIgZ2x0b29scyAgICAgICA9IG5ldyBHTFRvb2xzKCk7XG4gICB2YXIgZmJ0eCAgICAgICAgICA9IGdsdG9vbHMuQ3JlYXRlRnJhbWVCdWZmZXJUZXgodGhpcy5nbCxzaXplWCxzaXplWSk7XG4gICB0aGlzLmZybUIgICAgICAgICA9IGZidHhbMF07XG4gICB0aGlzLnRleEIgICAgICAgICA9IGZidHhbMV07XG59XG5cbkhlYXRtYXBSZW5kZXJlci5wcm90b3R5cGUuUmVzZXQgPSBmdW5jdGlvbiAoICApIHtcbiAgIHZhciBnbCAgICAgICAgICAgID0gdGhpcy5nbDtcbiAgIHRoaXMubGF5ZXJDb3VudCAgID0gMFxuICAgaWYgKCB0aGlzLnRleEIgKSB7XG4gICAgICBnbC5kZWxldGVUZXh0dXJlICggdGhpcy50ZXhCICk7XG4gICAgICBkZWxldGUgICAgICB0aGlzLnRleEI7XG4gICAgICB0aGlzLnRleEIgICAgPSBudWxsO1xuICAgfVxuICAgaWYgKCB0aGlzLmZybUIgKSB7XG4gICAgICBnbC5kZWxldGVGcmFtZWJ1ZmZlciAoIHRoaXMuZnJtQiApO1xuICAgICAgZGVsZXRlICAgICAgdGhpcy5mcm1CO1xuICAgICAgdGhpcy5mcm1CICAgID0gbnVsbDtcbiAgIH1cbiAgIGlmICh0aGlzLnRleC5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwIDsgaSA8IHRoaXMudGV4Lmxlbmd0aCA7ICsraSkge1xuICAgICAgICAgZ2wuZGVsZXRlVGV4dHVyZSAoIHRoaXMudGV4W2ldICk7XG4gICAgICB9XG4gICAgICB0aGlzLnRleCA9IFtdO1xuICAgfVxufVxuXG5IZWF0bWFwUmVuZGVyZXIucHJvdG90eXBlLlJlbGVhc2UgPSBmdW5jdGlvbiAoICApIHtcbiAgIHRoaXMuUmVzZXQoKVxufVxuXG5IZWF0bWFwUmVuZGVyZXIucHJvdG90eXBlLklzVXBUb0RhdGUgPSBmdW5jdGlvbiAoICkge1xuICAgcmV0dXJuIHRoaXMubGF5ZXJDb3VudCA9PSBudWxsO1xufVxuXG5IZWF0bWFwUmVuZGVyZXIucHJvdG90eXBlLlVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgIGlmICh0aGlzLmZybUIgPT0gbnVsbCB8fCB0aGlzLmxheWVyQ291bnQgPT0gbnVsbClcbiAgICAgIHJldHVybiAwO1xuICAgY29uc29sZS5sb2coXCJoZWF0IFVwZGF0ZVwiKTtcbiAgICAgIFxuICAgdmFyIGdsICAgICAgID0gdGhpcy5nbDtcbi8vICAgdGhpcy5zY2FsZVg7XG4vLyAgIHRoaXMuc2NhbGVZO1xuLy8gICB0aGlzLnRyWDtcbi8vICAgdGhpcy50clk7XG4gICBcbiAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAgICAgICAgICggZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZnJtQiApO1xuICAgdGhpcy5nbC5jbGVhckNvbG9yICAgICAgICAgKCAwLjAsIDAuMCwgMC4wLCAwLjAgICk7XG4gICB0aGlzLmdsLmRpc2FibGUgICAgICAgICAgICAoIHRoaXMuZ2wuREVQVEhfVEVTVCAgKTtcbiAgIGdsLnZpZXdwb3J0ICAgICAgICAgICAgICAgICggMCwgMCwgdGhpcy5mcm1CLndpZHRoLCB0aGlzLmZybUIuaGVpZ2h0KTtcbiAgIGdsLmNsZWFyICAgICAgICAgICAgICAgICAgICggZ2wuQ09MT1JfQlVGRkVSX0JJVCApO1xuICAgICAgXG4gICB2YXIgbXZNYXRyaXggICAgICAgICAgICAgICA9IG1hdDQuY3JlYXRlKCk7XG4gICB2YXIgcE1hdHJpeCAgICAgICAgICAgICAgICA9IG1hdDQuY3JlYXRlKCk7XG4gICBtYXQ0LmlkZW50aXR5ICAgICAgICAgICAgICAoIG12TWF0cml4ICk7XG4gICBtYXQ0LmlkZW50aXR5ICAgICAgICAgICAgICAoIHBNYXRyaXggKTtcbiAgIG1hdDQub3J0aG8gICAgICAgICAgICAgICAgICggMCwgdGhpcy5mcm1CLndpZHRoICwgMCwgdGhpcy5mcm1CLmhlaWdodCwgMCwgMSwgcE1hdHJpeCApOyAvLyBZIHN3YXAgIVxuXG4gICB2YXIgcHJvZyA9IG51bGw7XG4gICBpZiAoIHR5cGVvZiB0aGlzLm9wdGlvbnMuZmlsbCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5vcHRpb25zLmZpbGwgPT0gXCJsaW5lYXJcIiApIHtcbiAgICAgIHByb2cgICAgICAgICAgICAgICAgICAgPSB0aGlzLmFzc2V0cy5wcm9nWyBcIkhlYXRMaW5lYXJcIiBdXG4gICB9XG4gICBlbHNlIHsgLy8gZGVmYXVsdCBnYXVzc2lhbiAgIFxuICAgICAgcHJvZyAgICAgICAgICAgICAgICAgICA9IHRoaXMuYXNzZXRzLnByb2dbIFwiSGVhdEdhdXNzaWFuXCIgXVxuICAgfVxuICAgXG4gICBnbC51c2VQcm9ncmFtICAgICAgICAgICAgICAocHJvZyk7XG5cbiAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYgICAgICAgIChwcm9nLnBhcmFtcy5wTWF0cml4VW5pZm9ybS5uYW1lICwgZmFsc2UsIHBNYXRyaXgpO1xuICAgZ2wuYmluZEJ1ZmZlciAgICAgICAgICAgICAgKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5hc3NldHMuY2lyY2xlVmVydGV4UG9zaXRpb25CdWZmZXIpO1xuICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkgKHByb2cuYXR0ci52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSk7XG4gICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyICAgICAocHJvZy5hdHRyLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlLCB0aGlzLmFzc2V0cy5jaXJjbGVWZXJ0ZXhQb3NpdGlvbkJ1ZmZlci5pdGVtU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgZ2wuYmluZEJ1ZmZlciAgICAgICAgICAgICAgKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5hc3NldHMuY2lyY2xlVmVydGV4VGV4dHVyZUJ1ZmZlcik7XG4gICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSAocHJvZy5hdHRyLnRleHR1cmVDb29yZEF0dHJpYnV0ZSk7XG4gICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyICAgICAocHJvZy5hdHRyLnRleHR1cmVDb29yZEF0dHJpYnV0ZSwgdGhpcy5hc3NldHMuY2lyY2xlVmVydGV4VGV4dHVyZUJ1ZmZlci5pdGVtU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgdmFyIGRhdGUgICAgPSBuZXcgRGF0ZSgpO1xuICAgdmFyIHN0YXJ0VCAgPSBkYXRlLmdldFRpbWUoKTtcbiAgIHZhciBkaWZmVCAgID0gMC4wXG4gICBcbiAgIHRoaXMuZ2wuZW5hYmxlKHRoaXMuZ2wuQkxFTkQpO1xuICAgdGhpcy5nbC5ibGVuZEZ1bmModGhpcy5nbC5PTkUsIHRoaXMuZ2wuT05FKTtcbiAgIFxuICAgdmFyIGRlZmF1bHRTY2FsZSAgICAgPSB0eXBlb2YgdGhpcy5vcHRpb25zLnNjYWxlICE9PSAndW5kZWZpbmVkJyAgICAgICAgICAgICA/IHRoaXMub3B0aW9ucy5zY2FsZSAgICAgICAgOiAxLjA7XG4gICB2YXIgZGVmYXVsdERpYW1ldGVyICA9IHR5cGVvZiB0aGlzLm9wdGlvbnMuZGlhbWV0ZXIgIT09ICd1bmRlZmluZWQnICAgICAgICAgID8gdGhpcy5vcHRpb25zLmRpYW1ldGVyICAgICA6IDEwMDtcbiAgIHZhciB1bml0ICAgICAgICAgICAgID0gdHlwZW9mIHRoaXMub3B0aW9ucy5kaWFtZXRlclVuaXQgIT09ICd1bmRlZmluZWQnICAgICAgPyB0aGlzLm9wdGlvbnMuZGlhbWV0ZXJVbml0IDogXCJwaXhlbFwiO1xuICAgdmFyIHJlcyAgICAgICAgICAgICAgPSB0aGlzLmNzLlJlc29sdXRpb24gKCB0aGlzLnogKVxuICAgXG4gICBpZiAgKCB0eXBlb2YgdGhpcy5vcHRpb25zLmRpYW1ldGVyVW5pdCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICBpZiAoIHRoaXMub3B0aW9ucy5kaWFtZXRlclVuaXQgPT0gXCJtZXRlclwiICkge1xuICAgICAgICAgdW5pdCAgICAgICAgICAgICA9IDEgLy8gbWV0ZXJcbiAgICAgICAgIC8vIE5lZWQgdG8gYmUgY29tcHV0ZSB3aXRoIGFsbCBwb2ludCAhXG4gICAgICB9XG4gICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLmRpYW1ldGVyVW5pdCA9PSBcIm1ldGVyZXFcIiApIHtcbiAgICAgICAgIHVuaXQgICAgICAgICAgICAgPSAyIC8vIG1ldGVyZXFcbiAgICAgICAgIGRlZmF1bHREaWFtZXRlciA9IGRlZmF1bHREaWFtZXRlciAvIHJlc1xuICAgICAgfVxuICAgfVxuICAgXG4gICBmb3IgKHZhciBpID0gdGhpcy5sYXllckNvdW50IDsgaSA8IHRoaXMuaGVhdG1hcERhdGEuY29udGVudFtcImxcIl0ubGVuZ3RoIDsgKytpICkge1xuICAgICAgdmFyIGxheWVyICAgPSB0aGlzLmhlYXRtYXBEYXRhLmNvbnRlbnRbXCJsXCJdW2ldO1xuICAgICAgdmFyIGxsICAgICAgPSBsYXllcltcImdcIl07IC8vIGxpc3RlIGRlIGxpc3RlcyBkZSBsaWduZXNcbiAgICAgIHZhciBhbCAgICAgID0gbnVsbDsgLy8gYXR0cmlidXRsaXN0XG4gICAgICBpZiAoXCJhXCIgaW4gbGF5ZXIpIGFsID0gbGF5ZXJbXCJhXCJdO1xuICAgICAgaWYgKGxsID09IG51bGwpICAgY29udGludWU7XG4gICAgICBcbiAgICAgIGZvciAoIHZhciBsID0gMCA7IGwgPCBsbC5sZW5ndGggOyArK2wgKSB7XG4gICAgICAgICB2YXIgICBsaW5lcyA9IGxsW2xdOyAvLyBsaXN0ZSBkZSBsaWduZXNcbiAgICAgICAgIHZhciAgIGF0dHIgID0gbnVsbDsgLy8gYXR0cmlidXRcbiAgICAgICAgIGlmIChhbCkgYXR0ciA9IGFsW2xdIC8vIGF0dHJpYnV0bGlzdFxuXG4gICAgICAgICB2YXIgc2NhbGUgICAgICA9IGRlZmF1bHRTY2FsZVxuICAgICAgICAgdmFyIGRpYW1ldGVyICAgPSBkZWZhdWx0RGlhbWV0ZXJcblxuICAgICAgICAgaWYgKCBhdHRyICYmIHR5cGVvZiAoYXR0cikgPT0gdHlwZW9mICh7fSkgKSB7XG4gICAgICAgICAgICBzY2FsZSAgICAgPSB0eXBlb2YgYXR0ci5zY2FsZSAhPT0gJ3VuZGVmaW5lZCcgPyBhdHRyLnNjYWxlIDogc2NhbGU7XG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBhdHRyLmRpYW1ldGVyICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgICAgICAgIGRpYW1ldGVyID0gYXR0ci5kaWFtZXRlcjtcbiAgICAgICAgICAgICAgIGlmICggdW5pdCA9PSAyICkge1xuICAgICAgICAgICAgICAgICAgZGVmYXVsdERpYW1ldGVyID0gZGVmYXVsdERpYW1ldGVyIC8gcmVzXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICB9XG4gICAgICAgICBcbiAgICAgICAgIGZvciAoIHZhciBsaSA9IDAgOyBsaSA8IGxpbmVzLmxlbmd0aCA7ICsrbGkgKSB7XG4gICAgICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2xpXTtcbiAgICAgICAgICAgIGlmIChsaW5lLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICAgICB2YXIgbG9jYWxTY2FsZSA9IGRlZmF1bHRTY2FsZVxuICAgICAgICAgICAgICAgdmFyIGxvY2FsRGlhbSAgPSBkZWZhdWx0RGlhbWV0ZXIgXG4gICAgICAgICAgICAgICBpZiAodW5pdCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgdG1wMSA9IHRoaXMuY3MuTWV0ZXJzVG9QaXhlbHNBY2N1cmF0ZShsaW5lWzBdICAgLGxpbmVbMV0sdGhpcy56IClcbiAgICAgICAgICAgICAgICAgIHZhciB0bXAyID0gdGhpcy5jcy5NZXRlcnNUb1BpeGVsc0FjY3VyYXRlKGxpbmVbMF0gKyBkaWFtZXRlciAsbGluZVsxXSx0aGlzLnogKVxuICAgICAgICAgICAgICAgICAgZGlhbWV0ZXIgPSB0bXAyLnggLSB0bXAxLnhcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgbWF0NC5pZGVudGl0eSAgICAgICAgICAgICAgKCBtdk1hdHJpeCApO1xuICAgICAgICAgICAgICAgdmFyIHRtcHggPSBsaW5lWzBdICogdGhpcy5zY2FsZVggKyB0aGlzLnRyWDtcbiAgICAgICAgICAgICAgIHZhciB0bXB5ID0gbGluZVsxXSAqIHRoaXMuc2NhbGVZICsgdGhpcy50clk7XG4gICAgICAgICAgICAgICBtYXQ0LnRyYW5zbGF0ZSAgICAgICAgICggbXZNYXRyaXgsIFsgdG1weCAsIHRtcHkgLCAwXSApO1xuICAgICAgICAgICAgICAgbWF0NC5zY2FsZSAgICAgICAgICAgICAoIG12TWF0cml4LCBbIGRpYW1ldGVyICwgZGlhbWV0ZXIgLCAxLjBdICk7ICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2ICAgICggcHJvZy5wYXJhbXMubXZNYXRyaXhVbmlmb3JtLm5hbWUsIGZhbHNlLCBtdk1hdHJpeCApO1xuICAgICAgICAgICAgICAgZ2wudW5pZm9ybTFmICAgICAgICAgICAoIHByb2cucGFyYW1zLnVQYXJhbXMubmFtZSAsIHNjYWxlICk7IFxuICAgICAgICAgICAgICAgZ2wuZHJhd0FycmF5cyAgICAgICAgICAoIGdsLlRSSUFOR0xFX0ZBTiwgMCwgdGhpcy5hc3NldHMuY2lyY2xlVmVydGV4UG9zaXRpb25CdWZmZXIubnVtSXRlbXMgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRpZmZUICAgPSBkYXRlLmdldFRpbWUoKSAtIHN0YXJ0VDtcbiAgICAgIGlmICggZGlmZlQgPiAxMCApXG4gICAgICAgICBicmVhaztcbiAgIH1cbiAgIFxuICAgdGhpcy5nbC5kaXNhYmxlKHRoaXMuZ2wuQkxFTkQpO1xuICAgdGhpcy5sYXllckNvdW50ID0gaSArIDFcbiAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAoIGdsLkZSQU1FQlVGRkVSLCBudWxsICk7XG4gICBcbiAgIGlmICggdGhpcy5sYXllckNvdW50ID49IHRoaXMuaGVhdG1hcERhdGEuY29udGVudFtcImxcIl0ubGVuZ3RoICkge1xuICAgICAgdGhpcy5fQnVpbGRUZXh0dXJlKCk7XG4gICAgICBnbC5kZWxldGVGcmFtZWJ1ZmZlciAgICAgICAoIHRoaXMuZnJtQiApO1xuICAgICAgZGVsZXRlIHRoaXMuZnJtQjtcbiAgICAgIHRoaXMuZnJtQiA9IG51bGw7XG4gICAgICB0aGlzLmxheWVyQ291bnQgPSBudWxsO1xuICAgfVxuICAgcmV0dXJuIGRpZmZUXG59XG5cbkhlYXRtYXBSZW5kZXJlci5wcm90b3R5cGUuR2V0VGV4ID0gZnVuY3Rpb24gKCB0eCAsIHR5ICkge1xuICAgdmFyIGkgPSB0eCAtIHRoaXMudHg7XG4gICB2YXIgaiA9IHR5IC0gdGhpcy50eTtcbiAgIGlmICggaSA+PSB0aGlzLm5idHggfHwgaiA+PSB0aGlzLm5idHkgfHwgdGhpcy5sYXllckNvdW50ICE9IG51bGwgfHwgaSA8IDAgfHwgaiA8IDApIHtcbiAgICAgIGNvbnNvbGUubG9nICggXCJpbnZhbGlkIGN1c3RvbSB0aWxlXCIpXG4gICAgICByZXR1cm4gbnVsbFxuICAgfVxuICAgaiA9IHRoaXMubmJ0eSAtIGogLSAxXG4gICByZXR1cm4gdGhpcy50ZXggWyBpICsgaiAqIHRoaXMubmJ0eCBdXG4gICAvL3JldHVybiB0aGlzLnRleEI7XG59XG5cbkhlYXRtYXBSZW5kZXJlci5wcm90b3R5cGUuX0J1aWxkVGV4dHVyZSA9IGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKFwiaGVhdCBfQnVpbGRUZXh0dXJlXCIpO1xuICAgXG4gICB2YXIgZ2x0b29scyAgICAgICAgICAgICAgICA9IG5ldyBHTFRvb2xzICgpXG4gICB2YXIgZ2wgICAgICAgICAgICAgICAgICAgICA9IHRoaXMuZ2w7XG5cbiAgIHZhciBtdk1hdHJpeCAgICAgICAgICAgICAgID0gbWF0NC5jcmVhdGUoKTtcbiAgIHZhciBwTWF0cml4ICAgICAgICAgICAgICAgID0gbWF0NC5jcmVhdGUoKTtcbiAgIG1hdDQuaWRlbnRpdHkgICAgICAgICAgICAgICggcE1hdHJpeCApO1xuICAgbWF0NC5vcnRobyAgICAgICAgICAgICAgICAgKCAwLCAyNTYgLCAwLCAyNTYsIDAsIDEsIHBNYXRyaXggKTsgLy8gWSBzd2FwICFcblxuICAgdmFyIHByb2cgICAgICAgICAgICAgICAgICAgPSB0aGlzLmFzc2V0cy5wcm9nWyBcIkNsdXRcIiBdXG4gICBnbC51c2VQcm9ncmFtICAgICAgICAgICAgICAocHJvZyk7XG5cbiAgIHZhciBjb2xvckJib3VuZHMgICAgICAgICAgID0gdGhpcy5jb2xvcmJhci5kYXRhLkdldEJvdW5kcyAoKVxuXG4gICBnbC51bmlmb3JtNGZ2ICAgICAgICAgICAgICAocHJvZy5wYXJhbXMudVBhcmFtcy5uYW1lICxbMC4wLDEuMCxjb2xvckJib3VuZHNbMF0sY29sb3JCYm91bmRzWzFdXSApOyBcbiAgIFxuICAgZ2wudW5pZm9ybU1hdHJpeDRmdiAgICAgICAgKHByb2cucGFyYW1zLnBNYXRyaXhVbmlmb3JtLm5hbWUgLCBmYWxzZSwgcE1hdHJpeCk7XG4gICAgICAgICBcbiAgIGdsLmJpbmRCdWZmZXIgICAgICAgICAgICAgIChnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFBvc2l0aW9uQnVmZmVyKTtcbiAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5IChwcm9nLmF0dHIudmVydGV4UG9zaXRpb25BdHRyaWJ1dGUpO1xuICAgZ2wudmVydGV4QXR0cmliUG9pbnRlciAgICAgKHByb2cuYXR0ci52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4UG9zaXRpb25CdWZmZXIuaXRlbVNpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgIGdsLmJpbmRCdWZmZXIgICAgICAgICAgICAgIChnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFRleHR1cmVCdWZmZXIpO1xuICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkgKHByb2cuYXR0ci50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUpO1xuICAgZ2wudmVydGV4QXR0cmliUG9pbnRlciAgICAgKHByb2cuYXR0ci50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFRleHR1cmVCdWZmZXIuaXRlbVNpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cblxuICAgICAgICAgXG4gICBmb3IgKHZhciBqID0gMCA7IGogPCB0aGlzLm5idHkgOyBqID0gaiArIDEgKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCA7IGkgPCB0aGlzLm5idHggOyBpID0gaSArIDEgKSB7XG4gICAgICAgICB2YXIgZmJ0eCAgICAgICAgID0gZ2x0b29scy5DcmVhdGVGcmFtZUJ1ZmZlclRleChnbCwyNTYsMjU2KTtcbiAgICAgICAgIHZhciBmcm1CICAgICAgICAgPSBmYnR4WzBdO1xuICAgICAgICAgdmFyIHRleCAgICAgICAgICA9IGZidHhbMV07XG4gICAgICBcbiAgICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAgICAgICAgICggZ2wuRlJBTUVCVUZGRVIsIGZybUIgKTtcbiAgICAgICAgIGdsLmRpc2FibGUgICAgICAgICAgICAgICAgICggZ2wuREVQVEhfVEVTVCAgKTtcbiAgICAgICAgIGdsLnZpZXdwb3J0ICAgICAgICAgICAgICAgICggMCwgMCwgMjU2LCAyNTYgKTtcblxuICAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSAgICAgICAgICAgKGdsLlRFWFRVUkUwKTtcbi8vICAgICAgICAgZ2wuYmluZFRleHR1cmUgICAgICAgICAgICAgKGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4Qik7XG4gICAgICAgICBnbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAoZ2wuVEVYVFVSRV8yRCwgdGV4KTtcbiAgICAgICAgIGdsLnVuaWZvcm0xaSAgICAgICAgICAgICAgIChwcm9nLnBhcmFtcy51U2FtcGxlclRleDEubmFtZSwgMCk7XG4gICAgICAgICBcbiAgICAgICAgIGdsLmFjdGl2ZVRleHR1cmUgICAgICAgICAgIChnbC5URVhUVVJFMSk7XG4gICAgICAgICBnbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAoZ2wuVEVYVFVSRV8yRCwgdGhpcy5jb2xvcmJhci50ZXhbdGhpcy5tYXBWaWV3LmlkXSApO1xuICAgICAgICAgZ2wudW5pZm9ybTFpICAgICAgICAgICAgICAgKHByb2cucGFyYW1zLnVTYW1wbGVyVGV4Mi5uYW1lLCAxKTsgICAgICBcbiAgICAgICAgICAgICAgIFxuICAgICAgICAgbWF0NC5pZGVudGl0eSAgICAgICAgICAgICAgKCBtdk1hdHJpeCApO1xuICAgICAgICAgbWF0NC50cmFuc2xhdGUgICAgICAgICAgICAgKCBtdk1hdHJpeCwgWy0gaSoyNTYsIC0gaioyNTYgLCAwLjBdICk7XG4gICAgICAgICBtYXQ0LnNjYWxlICAgICAgICAgICAgICAgICAoIG12TWF0cml4LCBbdGhpcy5uYnR4ICwgdGhpcy5uYnR5ICwgMS4wXSApO1xuICAgICAgICAgXG4gICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2ICAgICAgICAoIHByb2cucGFyYW1zLm12TWF0cml4VW5pZm9ybS5uYW1lLCBmYWxzZSwgbXZNYXRyaXggKTtcbiAgICAgICAgIGdsLmRyYXdBcnJheXMgICAgICAgICAgICAgIChnbC5UUklBTkdMRV9TVFJJUCwgMCwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4UG9zaXRpb25CdWZmZXIubnVtSXRlbXMpO1xuXG4gICAgICAgICB0aGlzLnRleC5wdXNoICggdGV4ICk7XG4gICAgICAgICBnbC5kZWxldGVGcmFtZWJ1ZmZlciAoIGZybUIgKTtcbiAgICAgIH1cbiAgIH1cbiAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAgICAgICAgICggZ2wuRlJBTUVCVUZGRVIsIG51bGwgKTtcbiAgIGdsLmFjdGl2ZVRleHR1cmUgICAgICAgICAgIChnbC5URVhUVVJFMCk7XG4gICBnbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAoZ2wuVEVYVFVSRV8yRCwgbnVsbCApO1xuICAgZ2wuYWN0aXZlVGV4dHVyZSAgICAgICAgICAgKGdsLlRFWFRVUkUxKTtcbiAgIGdsLmJpbmRUZXh0dXJlICAgICAgICAgICAgIChnbC5URVhUVVJFXzJELCBudWxsICk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxubW9kdWxlLmV4cG9ydHMgPSBIZWF0bWFwUmVuZGVyZXI7XG4iLCJcbmZ1bmN0aW9uIER5bmFtaWNhbExheWVyUGFydCAoIGxheWVyLCB0aWxlICkge1xuICAgXG4gICB0aGlzLmxheWVyICAgICA9IGxheWVyO1xuICAgdGhpcy50aWxlICAgICAgPSB0aWxlO1xuICAgdGhpcy54ICAgICAgICAgPSB0aWxlLng7XG4gICB0aGlzLnkgICAgICAgICA9IHRpbGUueTtcbiAgIHRoaXMueiAgICAgICAgID0gdGlsZS56O1xuXG4gICB0aGlzLnZlcnNpb24gICA9IG51bGw7XG4gICB0aGlzLnRleCAgICAgICA9IG51bGw7XG4gICBcbiAgIHRoaXMucmVuZGVyZXIgID0gbGF5ZXIucmVuZGVyZXI7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5EeW5hbWljYWxMYXllclBhcnQucHJvdG90eXBlLklzVXBUb0RhdGUgPSBmdW5jdGlvbiAoICkge1xuICAgdmFyIGlzVXBUb2RhdGUgPSB0aGlzLnJlbmRlcmVyLmlzU3luYygpICYmIHRoaXMudGV4ICE9IG51bGw7XG4gICBcbiAgIGlmKCFpc1VwVG9kYXRlKVxuICAgICAgIHRoaXMuUmVzZXQoKTtcbiAgIFxuICAgcmV0dXJuIGlzVXBUb2RhdGU7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5EeW5hbWljYWxMYXllclBhcnQucHJvdG90eXBlLkRhdGFSZWFkeSA9IGZ1bmN0aW9uKCl7XG5cbiAgIGlmKHRoaXMucmVuZGVyZXIuSXNVcFRvRGF0ZSgpKXtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgfVxuICAgZWxzZXtcbiAgICAgIHRoaXMucmVuZGVyZXIuVXBkYXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICB9XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5EeW5hbWljYWxMYXllclBhcnQucHJvdG90eXBlLkdldFR5cGUgPSBmdW5jdGlvbiAoICkge1xuICAgcmV0dXJuIHRoaXMubGF5ZXIudHlwZTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbkR5bmFtaWNhbExheWVyUGFydC5wcm90b3R5cGUucHJlcGFyZSA9IGZ1bmN0aW9uICgpIHtcblxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuRHluYW1pY2FsTGF5ZXJQYXJ0LnByb3RvdHlwZS5SZXNldCA9IGZ1bmN0aW9uICggICkge1xuICAgdGhpcy50ZXggPSBudWxsO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuRHluYW1pY2FsTGF5ZXJQYXJ0LnByb3RvdHlwZS5SZWxlYXNlID0gZnVuY3Rpb24gKCAgKSB7XG4gICB0aGlzLnRleCA9IG51bGw7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5EeW5hbWljYWxMYXllclBhcnQucHJvdG90eXBlLlVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy50ZXggPT0gbnVsbCApIHsgICBcbiAgICAgICAgdGhpcy50ZXggPSB0aGlzLnJlbmRlcmVyLkdldFRleCh0aGlzLngsdGhpcy55KVxuICAgIH1cbiAgICByZXR1cm4gMDtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IER5bmFtaWNhbExheWVyUGFydDsiLCJcclxudmFyIEltYWdlRGF0YSAgICAgICA9IHJlcXVpcmUoXCIuLi8uLi9tb2RlbHMvZGF0YS9pbWFnZS1kYXRhLmpzXCIpO1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5mdW5jdGlvbiBJbWFnZUxheWVyUGFydCAobGF5ZXIsIHRpbGUsIGdsLCBpblpvb20pIHtcclxuICAgdGhpcy50aWxlICAgICAgPSB0aWxlO1xyXG4gICB0aGlzLmdsICAgICAgICA9IGdsO1xyXG4gICB0aGlzLmxheWVyICAgICA9IGxheWVyO1xyXG5cclxuICAgdGhpcy50ZXggICAgICAgPSBudWxsO1xyXG4gICB0aGlzLncgICAgICAgICA9IDA7XHJcbiAgIHRoaXMuaCAgICAgICAgID0gMDtcclxuICAgdGhpcy56ICAgICAgICAgPSBpblpvb207XHJcblxyXG4gICB0aGlzLmRhdGEgICAgICA9IG5ldyBJbWFnZURhdGEobGF5ZXIuc291cmNlSWQsIHRpbGUueCwgdGlsZS55LCB0aWxlLnopO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbkltYWdlTGF5ZXJQYXJ0LnByb3RvdHlwZS5EYXRhUmVhZHkgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgaWYodGhpcy5kYXRhLmNvbnRlbnQpe1xyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICB9XHJcbiAgIGVsc2V7XHJcbiAgICAgIHRoaXMuZGF0YS50cnlUb0ZpbGxDb250ZW50KClcclxuXHJcbiAgICAgIGlmKHRoaXMuZGF0YS5jb250ZW50KXtcclxuICAgICAgICAgdGhpcy5wcmVwYXJlKClcclxuICAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgfVxyXG4gICB9XHJcblxyXG4gICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuSW1hZ2VMYXllclBhcnQucHJvdG90eXBlLkdldFR5cGUgPSBmdW5jdGlvbiAoICkge1xyXG4gICByZXR1cm4gdGhpcy5sYXllci50eXBlO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbkltYWdlTGF5ZXJQYXJ0LnByb3RvdHlwZS5wcmVwYXJlID0gZnVuY3Rpb24gKCkge1xyXG4gICB0aGlzLncgPSB0aGlzLmRhdGEuY29udGVudC53aWR0aDsgICAgICBcclxuICAgdGhpcy5oID0gdGhpcy5kYXRhLmNvbnRlbnQuaGVpZ2h0OyBcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5JbWFnZUxheWVyUGFydC5wcm90b3R5cGUuUmVzZXQgPSBmdW5jdGlvbiAoICApIHtcclxuICAgaWYgKHRoaXMudGV4KSB7XHJcbiAgICAgIHRoaXMuZ2wuZGVsZXRlVGV4dHVyZSAoIHRoaXMudGV4ICk7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLnRleDtcclxuICAgICAgdGhpcy50ZXggPSBudWxsO1xyXG4gICB9XHJcbn1cclxuXHJcbkltYWdlTGF5ZXJQYXJ0LnByb3RvdHlwZS5SZWxlYXNlID0gZnVuY3Rpb24gKCAgKSB7XHJcbiAgIHRoaXMuUmVzZXQoKVxyXG5cclxuICAgaWYgKHRoaXMuZGF0YS5jb250ZW50KSB7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLmRhdGEuY29udGVudDtcclxuICAgICAgdGhpcy5kYXRhLmNvbnRlbnQgPSBudWxsO1xyXG4gICB9XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuSW1hZ2VMYXllclBhcnQucHJvdG90eXBlLklzVXBUb0RhdGUgPSBmdW5jdGlvbiAoICkge1xyXG4gICByZXR1cm4gdGhpcy50ZXggIT0gbnVsbDtcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5JbWFnZUxheWVyUGFydC5wcm90b3R5cGUuVXBkYXRlID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgaWYgKHRoaXMudGV4KVxyXG4gICAgICByZXR1cm4gMDtcclxuXHJcbiAgIHZhciBkYXRlICAgID0gKG5ldyBEYXRlKVxyXG4gICB2YXIgc3RhcnRUICA9IGRhdGUuZ2V0VGltZSgpXHJcblxyXG4gICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgaWYgKHRoaXMuZGF0YS5jb250ZW50ICE9IG51bGwgJiYgdGhpcy5kYXRhLmNvbnRlbnQud2lkdGggPiAwKSB7XHJcblxyXG4gICAgICB0aGlzLnRleCAgICAgICAgICAgICA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgZ2wuYmluZFRleHR1cmUgICAgICAgKCBnbC5URVhUVVJFXzJEICAgICAgICAgICAsIHRoaXMudGV4ICAgICApO1xyXG4gICAgICBnbC5waXhlbFN0b3JlaSAgICAgICAoIGdsLlVOUEFDS19GTElQX1lfV0VCR0wgICwgZmFsc2UgICAgICAgICk7XHJcbiAgICAgIGdsLnRleEltYWdlMkQgICAgICAgICggZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgdGhpcy5kYXRhLmNvbnRlbnQpO1xyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpICAgICAoIGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSICAsIGdsLk5FQVJFU1QgKTtcclxuICAgICAgZ2wudGV4UGFyYW1ldGVyaSAgICAgKCBnbC5URVhUVVJFXzJEICAgICAgICAgICAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiAgLCBnbC5ORUFSRVNUICk7XHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlICAgICAgICggZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCBudWxsICAgICAgICAgKTtcclxuICAgfVxyXG4gICBlbHNlIHsgLy8gY3JlYXRlIGZha2VcclxuXHJcbiAgICAgIHRoaXMudGV4ICAgICAgICAgICAgID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICBnbC5iaW5kVGV4dHVyZSAgICAgICAoIGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgdGhpcy50ZXggICAgICk7XHJcbiAgICAgIGdsLnBpeGVsU3RvcmVpICAgICAgICggZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCAgLCBmYWxzZSAgICAgICAgKTtcclxuICAgICAgdmFyIGJ5dGVBcnJheSAgICAgICAgPSBuZXcgVWludDhBcnJheSAgICAgICAgKCBbMSwxLDEsMCAsIDEsMSwxLDAgLCAxLDEsMSwwICwgMSwxLDEsMF0gKTtcclxuICAgICAgZ2wudGV4SW1hZ2UyRCAgICAgICAgKCBnbC5URVhUVVJFXzJEICAgICAgICAgICAsIDAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIGdsLlJHQkEsIDIgLCAyLCAwLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBieXRlQXJyYXkpXHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkgICAgICggZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCBnbC5URVhUVVJFX01BR19GSUxURVIgICwgZ2wuTkVBUkVTVCApO1xyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpICAgICAoIGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSICAsIGdsLk5FQVJFU1QgKTtcclxuICAgICAgZ2wuYmluZFRleHR1cmUgICAgICAgKCBnbC5URVhUVVJFXzJEICAgICAgICAgICAsIG51bGwgICAgICAgICApO1xyXG4gICAgICB0aGlzLncgPSAyO1xyXG4gICAgICB0aGlzLmggPSAyO1xyXG4gICB9XHJcblxyXG4gICB2YXIgZGlmZlQgICA9IGRhdGUuZ2V0VGltZSgpIC0gc3RhcnRUOyAgIFxyXG4gICByZXR1cm4gZGlmZlRcclxuICAgXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMYXllclBhcnQ7XHJcbiIsIlxyXG5mdW5jdGlvbiBSYXN0ZXJMYXllclBhcnQgKCBtYXBWaWV3ICwgaW5ab29tKSB7XHJcbiAgIHRoaXMubWFwVmlldyA9IG1hcFZpZXc7XHJcbiAgIHRoaXMuYXNzZXRzID0gbWFwVmlldy5jb250ZXh0LmFzc2V0cztcclxuICAgdGhpcy5nbCAgICAgPSB0aGlzLmFzc2V0cy5jdHg7XHJcbiAgIFxyXG4gICB0aGlzLnRleCAgICA9IG51bGw7XHJcbiAgIHRoaXMuZGF0YSAgID0gbnVsbDtcclxuICAgdGhpcy53ICAgICAgPSAwO1xyXG4gICB0aGlzLmggICAgICA9IDA7XHJcbiAgIHRoaXMueiAgICAgID0gaW5ab29tO1xyXG59XHJcblxyXG5SYXN0ZXJMYXllclBhcnQucHJvdG90eXBlLkdldFR5cGUgPSBmdW5jdGlvbiAoICkge1xyXG4gICByZXR1cm4gTGF5ZXJNYW5hZ2VyLlJhc3RlcjtcclxufVxyXG5cclxuUmFzdGVyTGF5ZXJQYXJ0LnByb3RvdHlwZS5SZXNldCA9IGZ1bmN0aW9uICggICkge1xyXG4gICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICBpZiAodGhpcy50ZXgpIHtcclxuICAgICAgZ2wuZGVsZXRlVGV4dHVyZSAoIHRoaXMudGV4ICk7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLnRleDtcclxuICAgICAgdGhpcy50ZXggPSBudWxsO1xyXG4gICB9XHJcbn1cclxuXHJcblJhc3RlckxheWVyUGFydC5wcm90b3R5cGUuUmVsZWFzZSA9IGZ1bmN0aW9uICggICkge1xyXG4gICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICBpZiAodGhpcy50ZXgpIHtcclxuICAgICAgZ2wuZGVsZXRlVGV4dHVyZSAoIHRoaXMudGV4ICk7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLnRleDtcclxuICAgICAgdGhpcy50ZXggPSBudWxsO1xyXG4gICB9XHJcbiAgIGlmICh0aGlzLmRhdGEpIHtcclxuICAgICAgZGVsZXRlIHRoaXMuZGF0YTtcclxuICAgICAgdGhpcy5kYXRhID0gbnVsbDtcclxuICAgfVxyXG59XHJcblxyXG5SYXN0ZXJMYXllclBhcnQucHJvdG90eXBlLklzVXBUb0RhdGUgPSBmdW5jdGlvbiAoICkge1xyXG4gICByZXR1cm4gdGhpcy50ZXggIT0gbnVsbDtcclxufVxyXG5cclxuUmFzdGVyTGF5ZXJQYXJ0LnByb3RvdHlwZS5VcGRhdGUgPSBmdW5jdGlvbiAoIHBhcmFtcyApIHtcclxuICAgaWYgKHRoaXMudGV4KVxyXG4gICAgICByZXR1cm4gMDtcclxuXHJcbiAgIHZhciBkYXRlICAgID0gKG5ldyBEYXRlKVxyXG4gICB2YXIgc3RhcnRUICA9IGRhdGUuZ2V0VGltZSgpXHJcbiAgICAgIFxyXG4gICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICB2YXIgY29sb3JiYXJVSUQgPSBwYXJhbXMuY29sb3JiYXJzW3BhcmFtcy5zZWxlY3RlZENvbG9yYmFyXTtcclxuICAgdmFyIGNvbG9yYmFyID0gdGhpcy5tYXBWaWV3LmNvbG9yYmFyc01hbmFnZXIuZ2V0Q29sb3JiYXIoY29sb3JiYXJVSUQpLnRleDtcclxuICAgXHJcbiAgIGlmICggIWNvbG9yYmFyICkgeyBcclxuICAgICAgY29uc29sZS5sb2coXCJJbnZhbGlkIGNvbG9yIGJhciA6IHNldHRpbmcgZGVmYXVsdFwiKSA7XHJcbiAgIH1cclxuXHJcbiAgIGlmICggdGhpcy5kYXRhICYmIGNvbG9yYmFyKSB7XHJcbiAgIFxyXG4gICAgICB2YXIgZ2x0b29scyAgICAgICAgICAgICAgICA9IG5ldyBHTFRvb2xzICgpXHJcbiAgICAgIHZhciBmYnR4ICAgICAgICAgICAgICAgICAgID0gZ2x0b29scy5DcmVhdGVGcmFtZUJ1ZmZlclRleChnbCx0aGlzLncsdGhpcy5oKVxyXG4gICAgICB2YXIgdG1wVGV4ICAgICAgICAgICAgICAgICA9IGdsLmNyZWF0ZVRleHR1cmUgKCAgICAgICk7XHJcbiAgICAgIHRoaXMudGV4ICAgICAgICAgICAgICAgICAgID0gZmJ0eFsxXTtcclxuICAgICAgZ2wuYmluZFRleHR1cmUgICAgICAgICAgICAgKGdsLlRFWFRVUkVfMkQsIHRtcFRleCk7ICAgICAgXHJcbiAgICAgIGdsLnBpeGVsU3RvcmVpICAgICAgICAgICAgIChnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMICAsIGZhbHNlICk7XHJcbiAgICAgIGdsLnRleEltYWdlMkQgICAgICAgICAgICAgIChnbC5URVhUVVJFXzJELCAwLCBnbC5MVU1JTkFOQ0UsIHRoaXMudyAsIHRoaXMuaCwgMCwgZ2wuTFVNSU5BTkNFLCBnbC5VTlNJR05FRF9CWVRFLCB0aGlzLmRhdGEpXHJcbiAgICAgIC8vdGhpcy5fZ2xTZXREYXRhICAgICAgICAgICAgKCAgKTtcclxuICAgICAgZ2wudGV4UGFyYW1ldGVyaSAgICAgICAgICAgKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkgICAgICAgICAgIChnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpICAgICAgICAgICAoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MgICAgLCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgZ2wudGV4UGFyYW1ldGVyaSAgICAgICAgICAgKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9UICAgICwgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcblxyXG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIgICAgICAgICAoIGdsLkZSQU1FQlVGRkVSLCBmYnR4WzBdICk7XHJcbiAgICAgIHRoaXMuZ2wuY2xlYXJDb2xvciAgICAgICAgICggMS4wLCAxLjAsIDEuMCwgMS4wICApO1xyXG4gICAgICB0aGlzLmdsLmRpc2FibGUgICAgICAgICAgICAoIHRoaXMuZ2wuREVQVEhfVEVTVCAgKTtcclxuICAgICAgZ2wudmlld3BvcnQgICAgICAgICAgICAgICAgKCAwLCAwLCBmYnR4WzBdLndpZHRoLCBmYnR4WzBdLmhlaWdodCk7XHJcbiAgICAgIGdsLmNsZWFyICAgICAgICAgICAgICAgICAgICggZ2wuQ09MT1JfQlVGRkVSX0JJVCApO1xyXG5cclxuICAgICAgbXZNYXRyaXggICAgICAgICAgICAgICAgICAgPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgICBwTWF0cml4ICAgICAgICAgICAgICAgICAgICA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgICAgIG1hdDQuaWRlbnRpdHkgICAgICAgICAgICAgICggbXZNYXRyaXggKTtcclxuICAgICAgbWF0NC5zY2FsZSAgICAgICAgICAgICAgICAgKCBtdk1hdHJpeCwgW3RoaXMudyAgLyBNYXBlcmlhbC50aWxlU2l6ZSAsIHRoaXMuaCAvIE1hcGVyaWFsLnRpbGVTaXplLCAxLjBdICk7XHJcbiAgICAgIG1hdDQuaWRlbnRpdHkgICAgICAgICAgICAgICggcE1hdHJpeCApO1xyXG4gICAgICBtYXQ0Lm9ydGhvICAgICAgICAgICAgICAgICAoIDAsIGZidHhbMF0ud2lkdGggLCAwLCBmYnR4WzBdLmhlaWdodCwgMCwgMSwgcE1hdHJpeCApOyAvLyBZIHN3YXAgIVxyXG4gICAgICBcclxuICAgICAgdmFyIHByb2cgICAgICAgICAgICAgICAgICAgPSB0aGlzLmFzc2V0cy5wcm9nWyBcIkNsdXRcIiBdXHJcbiAgICAgIFxyXG4gICAgICBnbC51c2VQcm9ncmFtICAgICAgICAgICAgICAocHJvZyk7XHJcbiAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYgICAgICAgIChwcm9nLnBhcmFtcy5wTWF0cml4VW5pZm9ybS5uYW1lICwgZmFsc2UsIHBNYXRyaXgpO1xyXG4gICAgICBnbC51bmlmb3JtTWF0cml4NGZ2ICAgICAgICAocHJvZy5wYXJhbXMubXZNYXRyaXhVbmlmb3JtLm5hbWUsIGZhbHNlLCBtdk1hdHJpeCk7XHJcbiAgICAgIGdsLmJpbmRCdWZmZXIgICAgICAgICAgICAgIChnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFBvc2l0aW9uQnVmZmVyKTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkgKHByb2cuYXR0ci52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSk7XHJcbiAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIgICAgIChwcm9nLmF0dHIudmVydGV4UG9zaXRpb25BdHRyaWJ1dGUsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFBvc2l0aW9uQnVmZmVyLml0ZW1TaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgZ2wuYmluZEJ1ZmZlciAgICAgICAgICAgICAgKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4VGV4dHVyZUJ1ZmZlcik7XHJcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5IChwcm9nLmF0dHIudGV4dHVyZUNvb3JkQXR0cmlidXRlKTtcclxuICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlciAgICAgKHByb2cuYXR0ci50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFRleHR1cmVCdWZmZXIuaXRlbVNpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcbiAgIFxyXG4gICAgICBnbC5hY3RpdmVUZXh0dXJlICAgICAgICAgICAoZ2wuVEVYVFVSRTApO1xyXG4gICAgICBnbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAoZ2wuVEVYVFVSRV8yRCwgdG1wVGV4KTtcclxuICAgICAgZ2wudW5pZm9ybTFpICAgICAgICAgICAgICAgKHByb2cucGFyYW1zLnVTYW1wbGVyVGV4MS5uYW1lLCAwKTtcclxuICAgICAgXHJcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUgICAgICAgICAgIChnbC5URVhUVVJFMSk7XHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlICAgICAgICAgICAgIChnbC5URVhUVVJFXzJELCBjb2xvcmJhciApO1xyXG4gICAgICBnbC51bmlmb3JtMWkgICAgICAgICAgICAgICAocHJvZy5wYXJhbXMudVNhbXBsZXJUZXgyLm5hbWUsIDEpO1xyXG4gICAgICAgICBcclxuICAgICAgZ2wudW5pZm9ybTRmdiAgICAgICAgICAgICAgKHByb2cucGFyYW1zLnVQYXJhbXMubmFtZSAsWzAuMCwyLjAsMC4wLDEuMF0gKTsgXHJcbiAgICAgICAgIFxyXG4gICAgICBnbC5kcmF3QXJyYXlzICAgICAgICAgICAgICAoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFBvc2l0aW9uQnVmZmVyLm51bUl0ZW1zKTtcclxuXHJcbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAgICAgICAgICggZ2wuRlJBTUVCVUZGRVIsIG51bGwgKTtcclxuICAgICAgZ2wuYWN0aXZlVGV4dHVyZSAgICAgICAgICAgKGdsLlRFWFRVUkUwKTtcclxuICAgICAgZ2wuYmluZFRleHR1cmUgICAgICAgICAgICAgKGdsLlRFWFRVUkVfMkQsIG51bGwgKTtcclxuICAgICAgZ2wuYWN0aXZlVGV4dHVyZSAgICAgICAgICAgKGdsLlRFWFRVUkUxKTtcclxuICAgICAgZ2wuYmluZFRleHR1cmUgICAgICAgICAgICAgKGdsLlRFWFRVUkVfMkQsIG51bGwgKTtcclxuXHJcbiAgICAgIGdsLmRlbGV0ZVRleHR1cmUgICAgICAgICAgICh0bXBUZXgpO1xyXG4gICAgICBnbC5kZWxldGVGcmFtZWJ1ZmZlciAgICAgICAoZmJ0eFswXSk7XHJcbiAgIH1cclxuICAgZWxzZSB7IC8vIGNyZWF0ZSBmYWtlXHJcbiAgICAgIHRoaXMudGV4ICAgICAgICAgICAgID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICBnbC5iaW5kVGV4dHVyZSAgICAgICAoIGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgdGhpcy50ZXggICAgICk7XHJcbiAgICAgIGdsLnBpeGVsU3RvcmVpICAgICAgICggZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCAgLCBmYWxzZSAgICAgICAgKTtcclxuICAgICAgdmFyIGJ5dGVBcnJheSAgICAgICAgPSBuZXcgVWludDhBcnJheSAgICAgICAgKCBbMSwxLDEsMCAsIDEsMSwxLDAgLCAxLDEsMSwwICwgMSwxLDEsMF0gKTtcclxuICAgICAgZ2wudGV4SW1hZ2UyRCAgICAgICAgKCBnbC5URVhUVVJFXzJEICAgICAgICAgICAsIDAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIGdsLlJHQkEsIDIgLCAyLCAwLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBieXRlQXJyYXkpXHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkgICAgICggZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCBnbC5URVhUVVJFX01BR19GSUxURVIgICwgZ2wuTkVBUkVTVCApO1xyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpICAgICAoIGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSICAsIGdsLk5FQVJFU1QgKTtcclxuICAgICAgZ2wuYmluZFRleHR1cmUgICAgICAgKCBnbC5URVhUVVJFXzJEICAgICAgICAgICAsIG51bGwgICAgICAgICApO1xyXG4gICAgICB0aGlzLncgPSAyO1xyXG4gICAgICB0aGlzLmggPSAyO1xyXG4gICB9XHJcbiAgIHZhciBkaWZmVCAgID0gZGF0ZS5nZXRUaW1lKCkgLSBzdGFydFQ7ICAgXHJcbiAgIHJldHVybiBkaWZmVFxyXG59XHJcblxyXG5mdW5jdGlvbiBSYXN0ZXJMYXllcjggKCBtYXBlcmlhbCAsIGluWm9vbSkge1xyXG4gICB0aGlzLl9fcHJvdG9fXy5fX3Byb3RvX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuUmFzdGVyTGF5ZXI4LnByb3RvdHlwZS5fX3Byb3RvX18gPSBSYXN0ZXJMYXllclBhcnQucHJvdG90eXBlOyAvLyBOb3QgaWUgY29tcGF0aWJsZSA/Pz9cclxuXHJcblJhc3RlckxheWVyOC5wcm90b3R5cGUuSW5pdCA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuICAgaWYgKHRoaXMudGV4KVxyXG4gICAgICByZXR1cm47XHJcbiAgIGlmIChkYXRhKSB7XHJcbiAgICAgIHZhciBieXRlQXJyYXkgICAgICAgICAgICAgID0gbmV3IFVpbnQ4QXJyYXkgICAgICAgICggZGF0YSApO1xyXG4gICAgICB2YXIgbnggICAgICAgICAgICAgICAgICAgICA9IGJ5dGVBcnJheVswXSArIDFcclxuICAgICAgYnl0ZUFycmF5ICAgICAgICAgICAgICAgICAgPSBuZXcgVWludDhBcnJheSAgICAgICAgKCBkYXRhLnNsaWNlKDEpICk7XHJcbiAgICAgIHZhciBueSAgICAgICAgICAgICAgICAgICAgID0gYnl0ZUFycmF5Lmxlbmd0aCAvIG54O1xyXG4gICAgICBcclxuICAgICAgdGhpcy53ICAgICAgICAgICAgICAgICAgICAgPSBueDsgICAgICBcclxuICAgICAgdGhpcy5oICAgICAgICAgICAgICAgICAgICAgPSBueTsgXHJcbiAgICAgIHRoaXMuZGF0YSAgICAgICAgICAgICAgICAgID0gYnl0ZUFycmF5O1xyXG4gICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJhc3RlckxheWVyMTYgKCBtYXBlcmlhbCAsIGluWm9vbSkge1xyXG4gICB0aGlzLl9fcHJvdG9fXy5fX3Byb3RvX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuUmFzdGVyTGF5ZXIxNi5wcm90b3R5cGUuX19wcm90b19fID0gUmFzdGVyTGF5ZXJQYXJ0LnByb3RvdHlwZTsgLy8gTm90IGllIGNvbXBhdGlibGUgPz8/XHJcblxyXG5SYXN0ZXJMYXllcjE2LnByb3RvdHlwZS5Jbml0ID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG4gICBpZiAodGhpcy50ZXgpXHJcbiAgICAgIHJldHVybjtcclxuICAgaWYgKGRhdGEpIHtcclxuICAgICAgdGhpcy5kYXRhID0gbmV3IFVpbnQ4QXJyYXkgIChkYXRhLnNsaWNlICgyNTYqMjU2KjIpKVxyXG4gICAgICB0aGlzLncgICAgICAgICAgICAgICAgICAgICA9IDI1NjsgICAgICBcclxuICAgICAgdGhpcy5oICAgICAgICAgICAgICAgICAgICAgPSAyNTY7IFxyXG5cclxuICAgICAgLypkID0gZGF0YVsnYyddXHJcbiAgICAgIHZhciBuZXdWICAgICAgICAgICAgICAgICAgID0gW11cclxuICAgICAgZm9yICh2YXIgeSA9IDAgOyB5IDwgMjU2IDsgeSsrICkge1xyXG4gICAgICAgICBmb3IgKHZhciB4ID0gMCA7IHggPCAyNTYgOyB4KysgKSB7XHJcbiAgICAgICAgICAgIG5ld1YucHVzaCggTWF0aC5jZWlsKCBkW3kgKiAyNTYgKyB4IF0gKiAyNTUgLyA5MzIyLjApIClcclxuICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHZhciBieXRlQXJyYXkgICAgICAgICAgICAgID0gbmV3IFVpbnQ4QXJyYXkgICAgICAgICggbmV3ViApO1xyXG4gICAgICB0aGlzLncgICAgICAgICAgICAgICAgICAgICA9IDI1NjsgICAgICBcclxuICAgICAgdGhpcy5oICAgICAgICAgICAgICAgICAgICAgPSAyNTY7IFxyXG4gICAgICB0aGlzLmRhdGEgICAgICAgICAgICAgICAgICA9IGJ5dGVBcnJheTtcclxuICAgICAgKi9cclxuICAgfVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBSYXN0ZXJMYXllcjggICAgOiBSYXN0ZXJMYXllcjgsXHJcbiAgICAgICAgUmFzdGVyTGF5ZXIxNiAgIDogUmFzdGVyTGF5ZXIxNlxyXG59O1xyXG4iLCJcclxuZnVuY3Rpb24gU2hhZGVMYXllclBhcnQgKCBtYXBWaWV3ICwgaW5ab29tKSB7XHJcbiAgIHRoaXMubWFwVmlldyA9IG1hcFZpZXc7XHJcbiAgIHRoaXMuYXNzZXRzID0gbWFwVmlldy5jb250ZXh0LmFzc2V0cztcclxuICAgdGhpcy5nbCAgICAgPSB0aGlzLmFzc2V0cy5jdHg7XHJcbiAgIFxyXG4gICB0aGlzLnRleCAgICA9IG51bGw7XHJcbiAgIHRoaXMuZGF0YSAgID0gbnVsbDtcclxuICAgdGhpcy53ICAgICAgPSAwO1xyXG4gICB0aGlzLmggICAgICA9IDA7XHJcbiAgIHRoaXMueiAgICAgID0gaW5ab29tO1xyXG59XHJcblxyXG5TaGFkZUxheWVyUGFydC5wcm90b3R5cGUuR2V0VHlwZSA9IGZ1bmN0aW9uICggKSB7XHJcbiAgIHJldHVybiBMYXllck1hbmFnZXIuU2hhZGU7XHJcbn1cclxuXHJcblNoYWRlTGF5ZXJQYXJ0LnByb3RvdHlwZS5Jbml0ID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG4gICBpZiAodGhpcy50ZXgpXHJcbiAgICAgIHJldHVybjtcclxuICAgXHJcbiAgIGNvbnNvbGUubG9nKFwiaW5pdCBzaGFkZVwiKVxyXG4gICBcclxuICAgaWYgKGRhdGEpIHtcclxuICAgICAgdmFyIG5ld1YgICAgICAgICAgICAgICAgICAgPSBbXVxyXG4gICAgICAvKlxyXG4gICAgICBmb3IgKHZhciB5ID0gMjU1IDsgeSA+PSAwIDsgeS0tICkge1xyXG4gICAgICAgICBmb3IgKHZhciB4ID0gMCA7IHggPCAyNTYgOyB4KysgKSB7XHJcbiAgICAgICAgICAgIG5ld1YucHVzaChkYXRhW3kgKyB4ICogMjU2XSAmIDI1NSlcclxuICAgICAgICAgICAgbmV3Vi5wdXNoKChkYXRhW3kgKyB4ICogMjU2XSA+PiA4KSAmIDI1NSlcclxuICAgICAgICAgICAgbmV3Vi5wdXNoKDApXHJcbiAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB2YXIgYnl0ZUFycmF5ICAgICAgICAgICAgICA9IG5ldyBVaW50OEFycmF5ICAgICAgICAoIG5ld1YgKTtcclxuICAgICAgKi9cclxuICAgICAgLypcclxuICAgICAgZm9yICh2YXIgeSA9IDAgOyB5IDw9IDI1NiA7IHkrKyApIHtcclxuICAgICAgICAgZm9yICh2YXIgeCA9IDAgOyB4IDwgMjU2IDsgeCsrICkge1xyXG4gICAgICAgICAgICBuZXdWLnB1c2goZGF0YSBbeSAqIDI1NiArIHggXSAmIDI1NSlcclxuICAgICAgICAgICAgbmV3Vi5wdXNoKChkYXRhW3kgKiAyNTYgKyB4IF0gPj4gOCkgJiAyNTUpXHJcbiAgICAgICAgICAgIG5ld1YucHVzaCgwKVxyXG4gICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgdmFyIGJ5dGVBcnJheSAgICAgICAgICAgICAgPSBuZXcgVWludDhBcnJheSAgICAgICAgKCBuZXdWICk7XHJcbiAgICAgICovXHJcbiAgICAgIC8qXHJcbiAgICAgIHZhciBieXRlQXJyYXkgICAgICAgICAgICAgID0gbmV3IFVpbnQ4QXJyYXkgICAgICAgICggZGF0YVsncyddICk7XHJcbiAgICAgIHRoaXMudyAgICAgICAgICAgICAgICAgICAgID0gMjU2OyAgICAgIFxyXG4gICAgICB0aGlzLmggICAgICAgICAgICAgICAgICAgICA9IDI1NjsgXHJcbiAgICAgIHRoaXMuZGF0YSAgICAgICAgICAgICAgICAgID0gYnl0ZUFycmF5O1xyXG4gICAgICAqL1xyXG4gICAgICB2YXIgYnl0ZUFycmF5ICAgICAgICAgICAgICA9IG5ldyBVaW50OEFycmF5ICAgICAgICAoIGRhdGEgKTtcclxuICAgICAgdmFyIG5sID0gW11cclxuICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IDI1NioyNTYqMiA7IGkgPSBpKzIgKSB7XHJcblxyXG4gICAgICAgICB2YXIgYSA9ICggYnl0ZUFycmF5W2ldIC8gMjU1LjAgKSAqIDIuMCAtIDEuMDtcclxuICAgICAgICAgdmFyIGIgPSAoIGJ5dGVBcnJheVtpKzFdIC8gMjU1LjAgKSAqIDIuMCAtIDEuMDtcclxuICAgICAgICAgdmFyIHRtcCA9IC0gKGEqYSkgLSAoYipiKSArIDEuMFxyXG4gICAgICAgICB2YXIgYyA9IE1hdGguc3FydCggdG1wICk7XHJcblxyXG4gICAgICAgICB2YXIgdHQgPSAoYSphKSArIChiKmIpICsgKGMqYyk7XHJcbiAgICAgICAgIFxyXG4gICAgICAgICBubC5wdXNoKCAgTWF0aC5jZWlsKCAoKGEgKyAxLjApLzIuMCkgKiAyNTUpKTtcclxuICAgICAgICAgbmwucHVzaCggIE1hdGguY2VpbCggKChiICsgMS4wKS8yLjApICogMjU1KSk7XHJcbiAgICAgICAgIG5sLnB1c2goICBNYXRoLmNlaWwoICgoYyArIDEuMCkvMi4wKSAqIDI1NSkpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuZGF0YSA9IG5ldyBVaW50OEFycmF5ICAobmwpXHJcbiAgICAgIHRoaXMudyAgICAgICAgICAgICAgICAgICAgID0gMjU2OyAgICAgIFxyXG4gICAgICB0aGlzLmggICAgICAgICAgICAgICAgICAgICA9IDI1NjsgXHJcbiAgIH1cclxufVxyXG5cclxuU2hhZGVMYXllclBhcnQucHJvdG90eXBlLlJlc2V0ID0gZnVuY3Rpb24gKCAgKSB7XHJcbiAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgIGlmICh0aGlzLnRleCkge1xyXG4gICAgICBnbC5kZWxldGVUZXh0dXJlICggdGhpcy50ZXggKTtcclxuICAgICAgZGVsZXRlIHRoaXMudGV4O1xyXG4gICAgICB0aGlzLnRleCA9IG51bGw7XHJcbiAgIH1cclxufVxyXG5cclxuU2hhZGVMYXllclBhcnQucHJvdG90eXBlLlJlbGVhc2UgPSBmdW5jdGlvbiAoICApIHtcclxuICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgaWYgKHRoaXMudGV4KSB7XHJcbiAgICAgIGdsLmRlbGV0ZVRleHR1cmUgKCB0aGlzLnRleCApO1xyXG4gICAgICBkZWxldGUgdGhpcy50ZXg7XHJcbiAgICAgIHRoaXMudGV4ID0gbnVsbDtcclxuICAgfVxyXG4gICBpZiAodGhpcy5kYXRhKSB7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLmRhdGE7XHJcbiAgICAgIHRoaXMuZGF0YSA9IG51bGw7XHJcbiAgIH1cclxufVxyXG5cclxuU2hhZGVMYXllclBhcnQucHJvdG90eXBlLklzVXBUb0RhdGUgPSBmdW5jdGlvbiAoICkge1xyXG4gICByZXR1cm4gdGhpcy50ZXggIT0gbnVsbDtcclxufVxyXG5cclxuU2hhZGVMYXllclBhcnQucHJvdG90eXBlLlVwZGF0ZSA9IGZ1bmN0aW9uICggcGFyYW1zICkge1xyXG4gICBpZiAodGhpcy50ZXgpXHJcbiAgICAgIHJldHVybiAwO1xyXG5cclxuICAgdmFyIGRhdGUgICAgPSAobmV3IERhdGUpXHJcbiAgIHZhciBzdGFydFQgID0gZGF0ZS5nZXRUaW1lKClcclxuICAgXHJcbiAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICBpZiAoIHRoaXMuZGF0YSApIHtcclxuICAgICAgdmFyIGdsdG9vbHMgICAgICAgICAgICAgICAgPSBuZXcgR0xUb29scyAoKVxyXG4gICAgICB2YXIgZmJ0eCAgICAgICAgICAgICAgICAgICA9IGdsdG9vbHMuQ3JlYXRlRnJhbWVCdWZmZXJUZXgoZ2wsdGhpcy53LHRoaXMuaClcclxuICAgICAgdmFyIHRtcFRleCAgICAgICAgICAgICAgICAgPSBnbC5jcmVhdGVUZXh0dXJlICggICAgICApO1xyXG4gICAgICB0aGlzLnRleCAgICAgICAgICAgICAgICAgICA9IGZidHhbMV07XHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlICAgICAgICAgICAgIChnbC5URVhUVVJFXzJELCB0bXBUZXgpOyAgICAgIFxyXG4gICAgICBnbC5waXhlbFN0b3JlaSAgICAgICAgICAgICAoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCAgLCBmYWxzZSApO1xyXG4gICAgICBnbC50ZXhJbWFnZTJEICAgICAgICAgICAgICAoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCLCB0aGlzLncgLCB0aGlzLmgsIDAsIGdsLlJHQiwgZ2wuVU5TSUdORURfQllURSwgdGhpcy5kYXRhKVxyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpICAgICAgICAgICAoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgICAgZ2wudGV4UGFyYW1ldGVyaSAgICAgICAgICAgKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkgICAgICAgICAgIChnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUyAgICAsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpICAgICAgICAgICAoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QgICAgLCBnbC5DTEFNUF9UT19FREdFKTtcclxuXHJcbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAgICAgICAgICggZ2wuRlJBTUVCVUZGRVIsIGZidHhbMF0gKTtcclxuICAgICAgdGhpcy5nbC5jbGVhckNvbG9yICAgICAgICAgKCAxLjAsIDEuMCwxLjAsIDEuMCAgKTtcclxuICAgICAgdGhpcy5nbC5kaXNhYmxlICAgICAgICAgICAgKCB0aGlzLmdsLkRFUFRIX1RFU1QgICk7XHJcbiAgICAgIGdsLnZpZXdwb3J0ICAgICAgICAgICAgICAgICggMCwgMCwgZmJ0eFswXS53aWR0aCwgZmJ0eFswXS5oZWlnaHQpO1xyXG4gICAgICBnbC5jbGVhciAgICAgICAgICAgICAgICAgICAoIGdsLkNPTE9SX0JVRkZFUl9CSVQgKTtcclxuXHJcbiAgICAgIHZhciBtdk1hdHJpeCAgICAgICAgICAgICAgID0gbWF0NC5jcmVhdGUoKTtcclxuICAgICAgdmFyIHBNYXRyaXggICAgICAgICAgICAgICAgPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgICBtYXQ0LmlkZW50aXR5ICAgICAgICAgICAgICAoIG12TWF0cml4ICk7XHJcbiAgICAgIG1hdDQuc2NhbGUgICAgICAgICAgICAgICAgICggbXZNYXRyaXgsIFt0aGlzLncgIC8gTWFwZXJpYWwudGlsZVNpemUgLCB0aGlzLmggLyBNYXBlcmlhbC50aWxlU2l6ZSwgMS4wXSApO1xyXG4gICAgICBtYXQ0LmlkZW50aXR5ICAgICAgICAgICAgICAoIHBNYXRyaXggKTtcclxuICAgICAgbWF0NC5vcnRobyAgICAgICAgICAgICAgICAgKCAwLCBmYnR4WzBdLndpZHRoICwgMCwgZmJ0eFswXS5oZWlnaHQsIDAsIDEsIHBNYXRyaXggKTsgLy8gWSBzd2FwICFcclxuXHJcbiAgICAgIHZhciBwcm9nICAgICAgICAgICAgICAgICAgID0gdGhpcy5hc3NldHMucHJvZ1sgXCJTaGFkZVwiIF1cclxuICAgICAgXHJcbiAgICAgIGdsLnVzZVByb2dyYW0gICAgICAgICAgICAgIChwcm9nKTtcclxuICAgICAgZ2wudW5pZm9ybU1hdHJpeDRmdiAgICAgICAgKHByb2cucGFyYW1zLnBNYXRyaXhVbmlmb3JtLm5hbWUgLCBmYWxzZSwgcE1hdHJpeCk7XHJcbiAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYgICAgICAgIChwcm9nLnBhcmFtcy5tdk1hdHJpeFVuaWZvcm0ubmFtZSwgZmFsc2UsIG12TWF0cml4KTtcclxuICAgICAgZ2wuYmluZEJ1ZmZlciAgICAgICAgICAgICAgKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4UG9zaXRpb25CdWZmZXIpO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSAocHJvZy5hdHRyLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlKTtcclxuICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlciAgICAgKHByb2cuYXR0ci52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4UG9zaXRpb25CdWZmZXIuaXRlbVNpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICBnbC5iaW5kQnVmZmVyICAgICAgICAgICAgICAoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmFzc2V0cy5zcXVhcmVWZXJ0ZXhUZXh0dXJlQnVmZmVyKTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkgKHByb2cuYXR0ci50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUpO1xyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyICAgICAocHJvZy5hdHRyLnRleHR1cmVDb29yZEF0dHJpYnV0ZSwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4VGV4dHVyZUJ1ZmZlci5pdGVtU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuICAgXHJcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUgICAgICAgICAgIChnbC5URVhUVVJFMCk7XHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlICAgICAgICAgICAgIChnbC5URVhUVVJFXzJELCB0bXBUZXgpO1xyXG4gICAgICBnbC51bmlmb3JtMWkgICAgICAgICAgICAgICAocHJvZy5wYXJhbXMudVNhbXBsZXJUZXgxLm5hbWUsIDApO1xyXG5cclxuICAgICAgZ2wudW5pZm9ybTNmdiAgICAgICAgICAgICAgKHByb2cucGFyYW1zLnVMaWdodC5uYW1lICAgLCBbLXBhcmFtcy51TGlnaHRbMF0sLXBhcmFtcy51TGlnaHRbMV0sLXBhcmFtcy51TGlnaHRbMl1dKTtcclxuICAgICAgZ2wudW5pZm9ybTFmICAgICAgICAgICAgICAgKHByb2cucGFyYW1zLnVTY2FsZS5uYW1lICAgLCBwYXJhbXMuc2NhbGUpO1xyXG4gICAgICAvL2dsLnVuaWZvcm0zZnYgICAgICAgICAgICAgIChwcm9nLnBhcmFtcy51TGlnaHQubmFtZSAgICwgWzAuMCwwLjAsLTUwLjBdICk7IFxyXG4gICAgICAvL2dsLnVuaWZvcm0xZiAgICAgICAgICAgICAgIChwcm9nLnBhcmFtcy51U2NhbGUubmFtZSAgICwgMSk7IFxyXG4gICAgICB2YXIgciAgICAgICAgICAgICAgICAgICAgICA9IHRoaXMubWFwVmlldy5jb250ZXh0LmNvb3JkUy5SZXNvbHV0aW9uICggdGhpcy56ICk7XHJcbiAgICAgIGdsLnVuaWZvcm0xZiAgICAgICAgICAgICAgIChwcm9nLnBhcmFtcy51UGl4UmVzLm5hbWUgICwgciApOyBcclxuICAgICAgICAgXHJcbiAgICAgIGdsLmRyYXdBcnJheXMgICAgICAgICAgICAgIChnbC5UUklBTkdMRV9TVFJJUCwgMCwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4UG9zaXRpb25CdWZmZXIubnVtSXRlbXMpO1xyXG5cclxuICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyICAgICAgICAgKCBnbC5GUkFNRUJVRkZFUiwgbnVsbCApO1xyXG4gICAgICBnbC5hY3RpdmVUZXh0dXJlICAgICAgICAgICAoZ2wuVEVYVFVSRTApO1xyXG4gICAgICBnbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAoZ2wuVEVYVFVSRV8yRCwgbnVsbCApO1xyXG4gICAgICBcclxuICAgICAgZ2wuZGVsZXRlVGV4dHVyZSAgICAgICAgICAgKHRtcFRleCk7XHJcbiAgICAgIGdsLmRlbGV0ZUZyYW1lYnVmZmVyICAgICAgIChmYnR4WzBdKTtcclxuICAgfVxyXG4gICBlbHNlIHsgLy8gY3JlYXRlIGZha2VcclxuICAgICAgdGhpcy50ZXggICAgICAgICAgICAgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlICAgICAgICggZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCB0aGlzLnRleCAgICAgKTtcclxuICAgICAgZ2wucGl4ZWxTdG9yZWkgICAgICAgKCBnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMICAsIGZhbHNlICAgICAgICApO1xyXG4gICAgICB2YXIgYnl0ZUFycmF5ICAgICAgICA9IG5ldyBVaW50OEFycmF5ICAgICAgICAoIFsxLDEsMSwwICwgMSwxLDEsMCAsIDEsMSwxLDAgLCAxLDEsMSwwXSApO1xyXG4gICAgICBnbC50ZXhJbWFnZTJEICAgICAgICAoIGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgMCAgICAgICAgICAgICAgICAgICAgICAgICAgICwgZ2wuUkdCQSwgMiAsIDIsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGJ5dGVBcnJheSlcclxuICAgICAgZ2wudGV4UGFyYW1ldGVyaSAgICAgKCBnbC5URVhUVVJFXzJEICAgICAgICAgICAsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiAgLCBnbC5ORUFSRVNUICk7XHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkgICAgICggZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCBnbC5URVhUVVJFX01JTl9GSUxURVIgICwgZ2wuTkVBUkVTVCApO1xyXG4gICAgICBnbC5iaW5kVGV4dHVyZSAgICAgICAoIGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgbnVsbCAgICAgICAgICk7XHJcbiAgICAgIHRoaXMudyA9IDI7XHJcbiAgICAgIHRoaXMuaCA9IDI7XHJcbiAgIH1cclxuICAgXHJcbiAgIHZhciBkaWZmVCAgID0gZGF0ZS5nZXRUaW1lKCkgLSBzdGFydFQ7ICAgXHJcbiAgIHJldHVybiBkaWZmVFxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNoYWRlTGF5ZXJQYXJ0O1xyXG4iLCIvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuXG5WZWN0b3JpYWxMYXllclBhcnQuQkFDSyAgID0gXCJiYWNrXCI7XG5WZWN0b3JpYWxMYXllclBhcnQuRlJPTlQgID0gXCJmcm9udFwiO1xuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuXG5mdW5jdGlvbiBWZWN0b3JpYWxMYXllclBhcnQgKCBtYXBWaWV3LCBpblpvb20gKSB7XG4gICB0aGlzLm1hcFZpZXcgPSBtYXBWaWV3O1xuICAgXG4gICB0aGlzLmdsICAgICA9IG1hcFZpZXcuY29udGV4dC5hc3NldHMuY3R4O1xuXG4gICB0aGlzLmNudiAgICA9IG51bGw7XG4gICB0aGlzLnRleCAgICA9IG51bGw7XG4gICB0aGlzLmN0eCAgICA9IG51bGw7XG4gICB0aGlzLmRhdGEgICA9IG51bGw7XG4gICB0aGlzLnogICAgICA9IGluWm9vbTtcbiAgIFxuICAgdGhpcy5sYXllckNvdW50ID0gMDtcbn1cblxuVmVjdG9yaWFsTGF5ZXJQYXJ0LnByb3RvdHlwZS5BbGxvY0NhbnZhcyA9IGZ1bmN0aW9uICggKSB7XG4gICB0aGlzLmNudiAgICAgICAgICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICB0aGlzLmNudi5oZWlnaHQgICAgICA9IE1hcGVyaWFsLnRpbGVTaXplIDtcbiAgIHRoaXMuY252LndpZHRoICAgICAgID0gTWFwZXJpYWwudGlsZVNpemUgO1xuICAgdGhpcy5jdHggICAgICAgICAgICAgPSB0aGlzLmNudi5nZXRDb250ZXh0KFwiMmRcIik7XG4gICBFeHRlbmRDYW52YXNDb250ZXh0ICAoIHRoaXMuY3R4ICk7XG4gICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb249XCJzb3VyY2Utb3ZlclwiO1xuXG4gICAvLyBDbGVhciAuLi5cbiAgIFxuICAgaWYgKE1hcGVyaWFsLmJnZGltZyBpbiB3aW5kb3cubWFwZXJpYWxTeW1iKSB7XG4gICAgICB2YXIgc3ltYiA9IHdpbmRvdy5tYXBlcmlhbFN5bWJbTWFwZXJpYWwuYmdkaW1nXTtcbiAgICAgIHRoaXMuY3R4LmRyYXdJbWFnZSggc3ltYi5kYXRhLCAwICwgMCApO1xuICAgfWVsc2Uge1xuICAgICAgdGhpcy5jdHguYmVnaW5QYXRoICAgKCAgKTtcbiAgICAgIHRoaXMuY3R4LnJlY3QgICAgICAgICggMCwwLHRoaXMuY252LndpZHRoLHRoaXMuY252LmhlaWdodCApO1xuICAgICAgdGhpcy5jdHguY2xvc2VQYXRoICAgKCAgKTtcbiAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSAgICA9ICdyZ2JhKDI1NSwyNTUsMjU1LDAuMCknO1xuICAgICAgdGhpcy5jdHguZmlsbCAgICAgICAgKCAgKTtcbiAgIH1cbn1cblxuVmVjdG9yaWFsTGF5ZXJQYXJ0LnByb3RvdHlwZS5HZXRUeXBlID0gZnVuY3Rpb24gKCApIHtcbiAgIHJldHVybiBMYXllck1hbmFnZXIuVmVjdG9yO1xufVxuXG5WZWN0b3JpYWxMYXllclBhcnQucHJvdG90eXBlLkluaXQgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XG4gICBpZiAodGhpcy50ZXgpXG4gICAgICByZXR1cm47XG4gICAgICBcbiAgIHRoaXMuZGF0YSAgID0gZGF0YTtcbiAgIHZhciBnbCAgICAgID0gdGhpcy5nbDtcbiAgIFxuICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMuQWxsb2NDYW52YXMoKTtcbiAgIH1cbn1cblxuVmVjdG9yaWFsTGF5ZXJQYXJ0LnByb3RvdHlwZS5SZXNldCA9IGZ1bmN0aW9uICggICkge1xuICAgdmFyIGdsICAgICAgICAgICAgPSB0aGlzLmdsO1xuICAgdGhpcy5sYXllckNvdW50ICAgPSAwXG4gICBpZiAodGhpcy5jbnYpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmNudjtcbiAgICAgIHRoaXMuY252ICAgICAgICAgID0gbnVsbDtcbiAgICAgIHRoaXMuQWxsb2NDYW52YXMgKCApO1xuICAgfVxuICAgaWYgKHRoaXMudGV4KSB7XG4gICAgICBnbC5kZWxldGVUZXh0dXJlICggdGhpcy50ZXggKTtcbiAgICAgIGRlbGV0ZSB0aGlzLnRleDtcbiAgICAgIHRoaXMudGV4ID0gbnVsbDtcbiAgIH1cbn1cblxuVmVjdG9yaWFsTGF5ZXJQYXJ0LnByb3RvdHlwZS5SZWxlYXNlID0gZnVuY3Rpb24gKCAgKSB7XG4gICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgaWYgKHRoaXMudGV4KSB7XG4gICAgICBnbC5kZWxldGVUZXh0dXJlICggdGhpcy50ZXggKTtcbiAgICAgIGRlbGV0ZSB0aGlzLnRleDtcbiAgICAgIHRoaXMudGV4ID0gbnVsbDtcbiAgIH1cbiAgIGlmICh0aGlzLmNudikge1xuICAgICAgZGVsZXRlIHRoaXMuY252O1xuICAgICAgdGhpcy5jbnYgPSBudWxsO1xuICAgfVxufVxuXG5WZWN0b3JpYWxMYXllclBhcnQucHJvdG90eXBlLklzVXBUb0RhdGUgPSBmdW5jdGlvbiAoICkge1xuICAgcmV0dXJuIHRoaXMubGF5ZXJDb3VudCA9PSBudWxsO1xufVxuXG5WZWN0b3JpYWxMYXllclBhcnQucHJvdG90eXBlLlVwZGF0ZSA9IGZ1bmN0aW9uICggcGFyYW1zLCBsYXllclBvc2l0aW9uICkge1xuICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgIGlmICh0aGlzLnRleCA9PSBudWxsICkge1xuICAgICAgaWYgKHRoaXMuZGF0YSkge1xuICAgICAgICAgdGhpcy50ZXggICAgICAgICAgICAgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgICB9XG4gICAgICBlbHNlIHsgLy8gY3JlYXRlIGZha2UgIVxuICAgICAgICAgdGhpcy50ZXggICAgICAgICAgICAgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgICAgICB0aGlzLmxheWVyQ291bnQgICAgICA9IG51bGw7XG4gICAgICAgICBnbC5iaW5kVGV4dHVyZSAgICAgICAoIGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgdGhpcy50ZXggICAgICk7XG4gICAgICAgICBnbC5waXhlbFN0b3JlaSAgICAgICAoIGdsLlVOUEFDS19GTElQX1lfV0VCR0wgICwgZmFsc2UgICAgICAgICk7XG4gICAgICAgICB2YXIgYnl0ZUFycmF5ICAgICAgICA9IG5ldyBVaW50OEFycmF5ICAgICAgICAoIFsxLDEsMSwwICwgMSwxLDEsMCAsIDEsMSwxLDAgLCAxLDEsMSwwXSApO1xuICAgICAgICAgZ2wudGV4SW1hZ2UyRCAgICAgICAgKCBnbC5URVhUVVJFXzJEICAgICAgICAgICAsIDAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIGdsLlJHQkEsIDIgLCAyLCAwLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBieXRlQXJyYXkpXG4gICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpICAgICAoIGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSICAsIGdsLk5FQVJFU1QgKTtcbiAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkgICAgICggZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCBnbC5URVhUVVJFX01JTl9GSUxURVIgICwgZ2wuTkVBUkVTVCApO1xuICAgICAgICAgZ2wuYmluZFRleHR1cmUgICAgICAgKCBnbC5URVhUVVJFXzJEICAgICAgICAgICAsIG51bGwgICAgICAgICApO1xuICAgICAgICAgcmV0dXJuIDI7XG4gICAgICB9XG4gICB9XG5cbiAgIHZhciBvc21WaXNpYmlsaXRpZXMgPSB0aGlzLm1hcFZpZXcuY29udGV4dC5vc21WaXNpYmlsaXRpZXM7XG4gICB2YXIgc3R5bGVVSUQgICA9IHBhcmFtcy5zdHlsZXNbcGFyYW1zLnNlbGVjdGVkU3R5bGVdO1xuICAgdmFyIHN0eWxlICAgICAgPSB0aGlzLm1hcFZpZXcuc3R5bGVzTWFuYWdlci5nZXRTdHlsZShzdHlsZVVJRCkuY29udGVudDtcblxuICAgaWYgKCAhIHN0eWxlICkge1xuICAgICAgY29uc29sZS5sb2cgKCBcIkludmFsaWQgc3R5bGVcIik7XG4gICAgICB0aGlzLmxheWVyQ291bnQgPSBudWxsO1xuICAgICAgdGhpcy5fQnVpbGRUZXh0dXJlKCk7XG4gICAgICByZXR1cm4gMjtcbiAgIH1cbiAgIHZhciByZW5kZXJlclN0YXR1cyAgID0gVGlsZVJlbmRlcmVyLlJlbmRlckxheWVycyAob3NtVmlzaWJpbGl0aWVzLCBsYXllclBvc2l0aW9uLCAgdGhpcy5jdHggLCB0aGlzLmRhdGEgLCB0aGlzLnogLCBzdHlsZSAsIHRoaXMubGF5ZXJDb3VudCApIDtcblxuICAgdGhpcy5sYXllckNvdW50ICAgICAgPSByZW5kZXJlclN0YXR1c1swXTtcbiAgIFxuICAgdmFyIGRpZmZUID0gMDtcbiAgIGlmICh0aGlzLklzVXBUb0RhdGUoKSkgeyAvLyBSZW5kZXIgaXMgZmluaXNoZWQsIGJ1aWxkIEdMIFRleHR1cmVcbiAgICAgIHZhciBkYXRlICAgID0gKG5ldyBEYXRlKVxuICAgICAgdmFyIHN0YXJ0VCAgPSBkYXRlLmdldFRpbWUoKVxuICAgICAgdGhpcy5fQnVpbGRUZXh0dXJlKCk7XG4gICAgICBkaWZmVCAgID0gZGF0ZS5nZXRUaW1lKCkgLSBzdGFydFQ7XG4gICB9XG4gICBcbiAgIHJldHVybiByZW5kZXJlclN0YXR1c1sxXSArIGRpZmZUXG59XG5cblZlY3RvcmlhbExheWVyUGFydC5wcm90b3R5cGUuX0J1aWxkVGV4dHVyZSA9IGZ1bmN0aW9uICggICkge1xuICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgIGdsLmJpbmRUZXh0dXJlICAoZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCB0aGlzLnRleCAgICAgKTtcbiAgIGdsLnBpeGVsU3RvcmVpICAoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCAgLCBmYWxzZSAgICAgICAgKTtcbiAgIGdsLnRleEltYWdlMkQgICAoZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCAwICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBnbC5SR0JBICAgICwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgdGhpcy5jbnYpO1xuICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJEICAgICAgICAgICAsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiAgLCBnbC5ORUFSRVNUICk7XG4gICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQgICAgICAgICAgICwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSICAsIGdsLk5FQVJFU1QgKTtcbiAgIGdsLmJpbmRUZXh0dXJlICAoZ2wuVEVYVFVSRV8yRCAgICAgICAgICAgLCBudWxsICAgICAgICAgKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcmlhbExheWVyUGFydDtcbiIsIlxyXG52YXIgR0xUb29scyAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi90b29scy9nbC10b29scy5qc1wiKSxcclxuUG9pbnQgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi8uLi9saWJzL3BvaW50LmpzJyksXHJcblRpbGUgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi90aWxlLmpzJyksXHJcbkNvbG9yYmFyUmVuZGVyZXIgICAgICAgID0gcmVxdWlyZSgnLi9jb2xvcmJhci1yZW5kZXJlci5qcycpLFxyXG5EeW5hbWljYWxSZW5kZXJlciAgICAgICA9IHJlcXVpcmUoJy4vZHluYW1pY2FsLXJlbmRlcmVyLmpzJyksXHJcbkhlYXRtYXBSZW5kZXJlciAgICAgICAgID0gcmVxdWlyZSgnLi9oZWF0bWFwLXJlbmRlcmVyLmpzJyksXHJcbnV0aWxzICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vLi4vLi4vdG9vbHMvdXRpbHMuanMnKSxcclxubWF0NCAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi8uLi9saWJzL2dsLW1hdHJpeC1taW4uanMnKS5tYXQ0O1xyXG5cclxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cclxuXHJcbmZ1bmN0aW9uIE1hcFJlbmRlcmVyKG1hcFZpZXcpIHtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIiAgc3RhcnRpbmcgTWFwUmVuZGVyZXIgZm9yIHZpZXcgXCIgKyBtYXBWaWV3LmlkICsgXCIuLi5cIik7XHJcblxyXG4gICAgdGhpcy5tYXBWaWV3ICAgICAgICAgICAgICAgPSBtYXBWaWV3O1xyXG5cclxuICAgIC8qKiBpbml0IEdMICoqL1xyXG4gICAgdGhpcy5zdGFydCgpO1xyXG5cclxuICAgIHRoaXMuYXNzZXRzICAgICAgICAgICAgICAgID0gbWFwVmlldy5jb250ZXh0LmFzc2V0cztcclxuICAgIHRoaXMuZ2wgICAgICAgICAgICAgICAgICAgID0gbWFwVmlldy5jb250ZXh0LmFzc2V0cy5jdHhcclxuXHJcbiAgICB0aGlzLmR5bmFtaWNhbFJlbmRlcmVycyAgICA9IHt9O1xyXG4gICAgdGhpcy5jb2xvcmJhclJlbmRlcmVyICAgICAgPSBuZXcgQ29sb3JiYXJSZW5kZXJlcih0aGlzLm1hcFZpZXcpO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuTWFwUmVuZGVyZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHRoaXMuZ2wgICAgICAgICAgICAgICAgPSBudWxsO1xyXG4gICAgdGhpcy5kcmF3U2NlbmVJbnRlcnZhbCA9IG51bGw7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICAvLyBUcnkgdG8gZ3JhYiB0aGUgc3RhbmRhcmQgY29udGV4dC4gSWYgaXQgZmFpbHMsIGZhbGxiYWNrIHRvIGV4cGVyaW1lbnRhbC5cclxuICAgICAgICB0aGlzLmdsID0gdGhpcy5tYXBWaWV3LmNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgfHwgdGhpcy5tYXBWaWV3LmNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpO1xyXG4gICAgICAgIHRoaXMuZml0VG9TaXplKCk7XHJcbiAgICB9IGNhdGNoIChlKSB7fVxyXG5cclxuICAgIGlmICghdGhpcy5nbCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiICAgICBDb3VsZCBub3QgaW5pdGlhbGlzZSBXZWJHTFwiKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmdsdG9vbHMgPSBuZXcgR0xUb29scyAoKVxyXG4gICAgdGhpcy5Jbml0R0woKVxyXG5cclxuICAgIHRoaXMuZHJhd1NjZW5lSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCggdXRpbHMuYXBwbHkgKCB0aGlzLCBcIkRyYXdTY2VuZVwiICkgLCBNYXBlcmlhbC5yZWZyZXNoUmF0ZSk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufSBcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5NYXBSZW5kZXJlci5wcm90b3R5cGUuZml0VG9TaXplID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIGlmKHRoaXMuZ2wpe1xyXG4gICAgICAgIHRoaXMuZ2wudmlld3BvcnRXaWR0aCAgPSB0aGlzLm1hcFZpZXcuY2FudmFzLndpZHRoKCk7XHJcbiAgICAgICAgdGhpcy5nbC52aWV3cG9ydEhlaWdodCA9IHRoaXMubWFwVmlldy5jYW52YXMuaGVpZ2h0KCk7XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS0tLS0tPiBjb3VsZG4ndCBmaXRUb1NpemVcIikgICAgICBcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbk1hcFJlbmRlcmVyLnByb3RvdHlwZS5Jbml0R0wgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdGhpcy5nbEFzc2V0ICAgICAgICAgPSBuZXcgT2JqZWN0KCk7XHJcbiAgICB0aGlzLmdsQXNzZXQuY3R4ICAgICA9IHRoaXMuZ2w7XHJcbiAgICB0aGlzLm1hcFZpZXcuY29udGV4dC5hc3NldHMgID0gdGhpcy5nbEFzc2V0O1xyXG5cclxuICAgIEdsb2JhbEluaXRHTCggdGhpcy5nbEFzc2V0ICwgdGhpcy5nbCAsIHRoaXMuZ2x0b29scyk7XHJcblxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuTWFwUmVuZGVyZXIucHJvdG90eXBlLmFkZER5bmFtaWNhbFJlbmRlcmVyID0gZnVuY3Rpb24oZHluYW1pY2FsRGF0YSwgc3R5bGUpe1xyXG4gICAgdmFyIHJlbmRlcmVyID0gbmV3IER5bmFtaWNhbFJlbmRlcmVyKHRoaXMuZ2wsIGR5bmFtaWNhbERhdGEsIHN0eWxlKTtcclxuICAgIHRoaXMuZHluYW1pY2FsUmVuZGVyZXJzW3JlbmRlcmVyLmlkXSA9IHJlbmRlcmVyO1xyXG4gICAgcmV0dXJuIHJlbmRlcmVyO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5NYXBSZW5kZXJlci5wcm90b3R5cGUuYWRkSGVhdG1hcFJlbmRlcmVyID0gZnVuY3Rpb24oaGVhdG1hcERhdGEsIGNvbG9yYmFyLCBvcHRpb25zKXtcclxuICAgIHZhciByZW5kZXJlciA9IG5ldyBIZWF0bWFwUmVuZGVyZXIodGhpcy5tYXBWaWV3LCBoZWF0bWFwRGF0YSwgY29sb3JiYXIsIG9wdGlvbnMpO1xyXG4gICAgdGhpcy5keW5hbWljYWxSZW5kZXJlcnNbcmVuZGVyZXIuaWRdID0gcmVuZGVyZXI7XHJcbiAgICByZXR1cm4gcmVuZGVyZXI7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5NYXBSZW5kZXJlci5wcm90b3R5cGUuRHJhd1NjZW5lID0gZnVuY3Rpb24gKCApIHtcclxuXHJcbiAgICB2YXIgdyA9IHRoaXMubWFwVmlldy5jYW52YXMuY2xpZW50V2lkdGgsXHJcbiAgICAgICAgaCA9IHRoaXMubWFwVmlldy5jYW52YXMuY2xpZW50SGVpZ2h0LFxyXG5cclxuICAgICAgICB3MiA9IE1hdGguZmxvb3IgKCB3IC8gMiApLFxyXG4gICAgICAgIGgyID0gTWF0aC5mbG9vciAoIGggLyAyICksXHJcblxyXG4gICAgICAgIHIgICAgICAgPSB0aGlzLm1hcFZpZXcuY29udGV4dC5jb29yZFMuUmVzb2x1dGlvbiAoIHRoaXMubWFwVmlldy5jb250ZXh0Lnpvb20gKSxcclxuICAgICAgICBvcmlnaW5NID0gbmV3IFBvaW50KCB0aGlzLm1hcFZpZXcuY29udGV4dC5jZW50ZXJNLnggLSB3MiAqIHIgLCB0aGlzLm1hcFZpZXcuY29udGV4dC5jZW50ZXJNLnkgKyBoMiAqIHIgKSxcclxuICAgICAgICB0aWxlQyAgID0gdGhpcy5tYXBWaWV3LmNvbnRleHQuY29vcmRTLk1ldGVyc1RvVGlsZSAoIG9yaWdpbk0ueCwgb3JpZ2luTS55ICwgdGhpcy5tYXBWaWV3LmNvbnRleHQuem9vbSApLFxyXG5cclxuICAgICAgICBvcmlnaW5QID0gdGhpcy5tYXBWaWV3LmNvbnRleHQuY29vcmRTLk1ldGVyc1RvUGl4ZWxzICggb3JpZ2luTS54LCBvcmlnaW5NLnksIHRoaXMubWFwVmlldy5jb250ZXh0Lnpvb20gKSxcclxuICAgICAgICBzaGlmdCAgID0gbmV3IFBvaW50ICggTWF0aC5mbG9vciAoIHRpbGVDLnggKiBNYXBlcmlhbC50aWxlU2l6ZSAtIG9yaWdpblAueCApICwgTWF0aC5mbG9vciAoIC0gKCAodGlsZUMueSsxKSAqIE1hcGVyaWFsLnRpbGVTaXplIC0gb3JpZ2luUC55ICkgKSApLFxyXG5cclxuICAgICAgICBuYlRpbGVYID0gTWF0aC5mbG9vciAoIHcgIC8gTWFwZXJpYWwudGlsZVNpemUgKyAxICksXHJcbiAgICAgICAgbmJUaWxlWSA9IE1hdGguZmxvb3IgKCBoICAvIE1hcGVyaWFsLnRpbGVTaXplICsgMSApIDsgXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4gICAgLy8gVE9ETyA6IHV0aWxpc2VyIGxlIHByaW5jaXBlIGRlIHZlcnNpb24gZGVzIGNvbG9yYmFycyBpY2kgYXVzc2lcclxuLy8gIHRoaXMucmVuZGVyQWxsQ29sb3JCYXJzKCk7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4gICAgdGhpcy5jb2xvcmJhclJlbmRlcmVyLnJlZnJlc2hBbGxDb2xvckJhcnMoKTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbiAgICBpZiAoIHRoaXMuVXBkYXRlVGlsZXMgKCB0aWxlQy54ICwgdGlsZUMueCArIG5iVGlsZVggLCB0aWxlQy55IC0gbmJUaWxlWSAsIHRpbGVDLnkgLCB0aGlzLmZvcmNlVGlsZVJlZHJhdyApIHx8IHRoaXMuZm9yY2VHbG9iYWxSZWRyYXcpIHtcclxuXHJcbiAgICAgICAgdmFyIG12TWF0cml4ICAgICAgPSBtYXQ0LmNyZWF0ZSgpLFxyXG4gICAgICAgICAgICBwTWF0cml4ICAgICAgID0gbWF0NC5jcmVhdGUoKTtcclxuICAgICAgICBcclxuICAgICAgICBtYXQ0LmlkZW50aXR5ICAgICggcE1hdHJpeCApO1xyXG4gICAgICAgIG1hdDQub3J0aG8gICAgICAgKCAwLCB3ICwgaCwgMCAsIDAsIDEsIHBNYXRyaXggKTsgLy8gWSBzd2FwICFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmdsLnZpZXdwb3J0ICggMCwgMCwgdyAsIGgpO1xyXG4gICAgICAgIHRoaXMuZ2wuY2xlYXIgICAgKCB0aGlzLmdsLkNPTE9SX0JVRkZFUl9CSVQgfCB0aGlzLmdsLkRFUFRIX0JVRkZFUl9CSVQgKTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIHd4ID0gc2hpZnQueCwgdHggPSB0aWxlQy54IDsgd3ggPCB3IDsgd3ggPSB3eCArIE1hcGVyaWFsLnRpbGVTaXplICwgdHggPSB0eCArIDEpIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIHd5ID0gc2hpZnQueSwgdHkgPSB0aWxlQy55IDsgd3kgPCBoIDsgd3kgPSB3eSsgTWFwZXJpYWwudGlsZVNpemUgLCB0eSA9IHR5IC0gMSkge1xyXG4gICAgICAgICAgICAgICAgbWF0NC5pZGVudGl0eSAobXZNYXRyaXgpO1xyXG4gICAgICAgICAgICAgICAgbWF0NC50cmFuc2xhdGUobXZNYXRyaXgsIFt3eCwgd3kgLCAwXSk7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5ICA9IHR4ICsgXCIsXCIgKyB0eSArIFwiLFwiICsgdGhpcy5tYXBWaWV3LmNvbnRleHQuem9vbTtcclxuICAgICAgICAgICAgICAgIHZhciB0aWxlID0gdGhpcy5tYXBWaWV3LnRpbGVzW2tleV1cclxuICAgICAgICAgICAgICAgIHRpbGUuUmVuZGVyICggcE1hdHJpeCwgbXZNYXRyaXggKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbiAgICBmb3IoIHZhciByZW5kZXJlcklkIGluIHRoaXMuZHluYW1pY2FsUmVuZGVyZXJzKSB7XHJcbiAgICAgICAgdmFyIHJlbmRlcmVyID0gdGhpcy5keW5hbWljYWxSZW5kZXJlcnNbcmVuZGVyZXJJZF07XHJcbiAgICAgICAgcmVuZGVyZXIuUmVmcmVzaCAoIHRoaXMubWFwVmlldy5jb250ZXh0Lnpvb20gLCB0aWxlQy54ICwgdGlsZUMueSAtIG5iVGlsZVkgLCBuYlRpbGVYICsgMSAsIG5iVGlsZVkgKyAxICkgO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuICAgIHRoaXMuZm9yY2VHbG9iYWxSZWRyYXcgID0gdHJ1ZTtcclxuICAgIHRoaXMuZm9yY2VUaWxlUmVkcmF3ICAgID0gZmFsc2U7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5NYXBSZW5kZXJlci5wcm90b3R5cGUuVXBkYXRlVGlsZXMgPSBmdW5jdGlvbiAoIHR4QiAsIHR4RSAsIHR5QiAsIHR5RSwgZm9yY2VUaWxlUmVkcmF3ICkge1xyXG5cclxuICAgIHZhciBrZXlMaXN0ID0gW107XHJcbiAgICB2YXIgem9vbSA9IHRoaXMubWFwVmlldy5jb250ZXh0Lnpvb207XHJcblxyXG4gICAgZm9yICggdHggPSB0eEIgOyB0eCA8PSB0eEUgOyB0eCsrKSB7XHJcbiAgICAgICAgZm9yICggdHkgPSB0eUIgOyB0eSA8PSB0eUUgOyB0eSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXkgPSB0eCArIFwiLFwiICsgdHkgKyBcIixcIiArIHpvb207XHJcbiAgICAgICAgICAgIGtleUxpc3QucHVzaChrZXkpXHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMubWFwVmlldy50aWxlc1trZXldID09IG51bGwgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcFZpZXcudGlsZXNba2V5XSA9IHRoaXMuY3JlYXRlVGlsZSh0eCwgdHksIHpvb20pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHVubG9hZCB1bm5lY2Vzc2FyeSBsb2FkZWQgdGlsZVxyXG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMubWFwVmlldy50aWxlcykge1xyXG4gICAgICAgIHZhciBpc0luS2V5TGlzdCA9IGZhbHNlXHJcbiAgICAgICAgZm9yICh2YXIga2kgPSAwIDsga2kgPCBrZXlMaXN0Lmxlbmd0aCA7IGtpKyspIHtcclxuICAgICAgICAgICAgaWYgKGtleUxpc3Rba2ldID09PSBrZXkpIGlzSW5LZXlMaXN0ID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICEgaXNJbktleUxpc3QgKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFwVmlldy50aWxlc1trZXldLlJlbGVhc2UoKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMubWFwVmlldy50aWxlc1trZXldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGZvcmNlVGlsZVJlZHJhdyApIHtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5tYXBWaWV3LnRpbGVzKSB7XHJcbiAgICAgICAgICAgIHZhciB0aWxlID0gdGhpcy5tYXBWaWV3LnRpbGVzW2tleV0uUmVzZXQgKCApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgdGlsZU1vZGlmaWVkICA9IGZhbHNlO1xyXG4gICAgdmFyIHRpbWVSZW1haW5pbmcgPSBNYXBlcmlhbC5yZWZyZXNoUmF0ZSAtIDU7XHJcblxyXG4gICAgZm9yICh2YXIga2kgPSAwIDsga2kgPCBrZXlMaXN0Lmxlbmd0aCA7IGtpKyspIHsgICAgICBcclxuICAgICAgICB2YXIgdGlsZSA9IHRoaXMubWFwVmlldy50aWxlc1trZXlMaXN0W2tpXV07XHJcbiAgICAgICAgaWYgKHRpbGUgJiYgIXRpbGUuSXNVcFRvRGF0ZSAoKSApICB7XHJcbiAgICAgICAgICAgIHRpbGVNb2RpZmllZCA9IHRydWVcclxuICAgICAgICAgICAgdGltZVJlbWFpbmluZyA9IHRpbGUuVXBkYXRlKCB0aW1lUmVtYWluaW5nIClcclxuICAgICAgICAgICAgaWYgKCB0aW1lUmVtYWluaW5nIDw9IDAgKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aWxlTW9kaWZpZWRcclxufVxyXG5cclxuXHJcbk1hcFJlbmRlcmVyLnByb3RvdHlwZS5jcmVhdGVUaWxlID0gZnVuY3Rpb24gKCB4LHkseiApIHtcclxuICAgIHJldHVybiBuZXcgVGlsZSAodGhpcy5tYXBWaWV3LCB4LHkseik7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuLy9QUklWQVRFXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5mdW5jdGlvbiBHbG9iYWxJbml0R0woIGdsQXNzZXQgLCBnbCAsIGdsVG9vbHMpIHtcclxuXHJcbiAgICBnbEFzc2V0LnNoYWRlckRhdGEgICAgICAgICAgICAgICAgPSBudWxsO1xyXG4gICAgZ2xBc3NldC5zaGFkZXJFcnJvciAgICAgICAgICAgICAgID0gZmFsc2U7XHJcbiAgICB2YXIgbWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBnbEFzc2V0O1xyXG5cclxuICAgIGdsQXNzZXQuU2hhZGVyUmVxICA9ICQuYWpheCh7XHJcbiAgICAgICAgdHlwZSAgICAgOiBcIkdFVFwiLFxyXG4gICAgICAgIHVybCAgICAgIDogTWFwZXJpYWwuc3RhdGljVVJMICsgXCIvc2hhZGVycy9hbGwuanNvblwiLFxyXG4gICAgICAgIGRhdGFUeXBlIDogXCJqc29uXCIsXHJcbiAgICAgICAgYXN5bmMgICAgOiBmYWxzZSxcclxuICAgICAgICBzdWNjZXNzICA6IGZ1bmN0aW9uKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgIG1lLnNoYWRlckRhdGEgPSBkYXRhO1xyXG4gICAgICAgICAgICBmb3IgKGsgaW4gbWUuc2hhZGVyRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgbWUuc2hhZGVyRGF0YVtrXS5jb2RlID0gbWUuc2hhZGVyRGF0YVtrXS5jb2RlLnJlcGxhY2UgKC8tLS0vZyxcIlxcblwiKSBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgbWUuc2hhZGVyRXJyb3IgPSB0cnVlXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nICggTWFwZXJpYWwuc3RhdGljVVJMICsgXCIvc2hhZGVycy9hbGwuanNvblwiICsgXCIgOiBsb2FkaW5nIGZhaWxlZCA6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHZhciB2ZXJ0aWNlcyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IFsgMC4wICAsIDAuMCAgLCAwLjAsICAgICAyNTYuMCwgMC4wICAsIDAuMCwgICAgICAwLjAgICwgMjU2LjAsIDAuMCwgICAgICAyNTYuMCwgMjU2LjAsIDAuMCBdO1xyXG4gICAgZ2xBc3NldC5zcXVhcmVWZXJ0ZXhQb3NpdGlvbkJ1ZmZlciAgICAgICAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBnbC5iaW5kQnVmZmVyICAgKCBnbC5BUlJBWV9CVUZGRVIsIGdsQXNzZXQuc3F1YXJlVmVydGV4UG9zaXRpb25CdWZmZXIgKTtcclxuICAgIGdsLmJ1ZmZlckRhdGEgICAoIGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlcyksIGdsLlNUQVRJQ19EUkFXICk7XHJcbiAgICBnbEFzc2V0LnNxdWFyZVZlcnRleFBvc2l0aW9uQnVmZmVyLml0ZW1TaXplICAgPSAzO1xyXG4gICAgZ2xBc3NldC5zcXVhcmVWZXJ0ZXhQb3NpdGlvbkJ1ZmZlci5udW1JdGVtcyAgID0gNDtcclxuXHJcbiAgICB2YXIgdGV4dHVyZUNvb3JkcyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBbIDAuMCwgMC4wLCAgICAgMS4wLCAwLjAsICAgICAgMC4wLCAxLjAsICAgICAgMS4wLCAxLjAgXTsgLy8gWSBzd2FwXHJcbiAgICBnbEFzc2V0LnNxdWFyZVZlcnRleFRleHR1cmVCdWZmZXIgICAgICAgICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIGdsLmJpbmRCdWZmZXIgICAoIGdsLkFSUkFZX0JVRkZFUiwgZ2xBc3NldC5zcXVhcmVWZXJ0ZXhUZXh0dXJlQnVmZmVyICk7XHJcbiAgICBnbC5idWZmZXJEYXRhICAgKCBnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZUNvb3JkcyksIGdsLlNUQVRJQ19EUkFXICk7XHJcbiAgICBnbEFzc2V0LnNxdWFyZVZlcnRleFRleHR1cmVCdWZmZXIuaXRlbVNpemUgICAgPSAyO1xyXG4gICAgZ2xBc3NldC5zcXVhcmVWZXJ0ZXhUZXh0dXJlQnVmZmVyLm51bUl0ZW1zICAgID0gNDtcclxuXHJcbiAgICB2YXIgbmIgPSAxO1xyXG4gICAgdmVydGljZXMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gWyAwLjAsIDAuMCwgMC4wIF07IC8vIGNlbnRlclxyXG4gICAgdGV4dHVyZUNvb3JkcyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gWyAwLjAsIDAuMCBdOyBcclxuICAgIGZvciAodmFyIGkgPSAwIDsgaSA8PSAzNjAgOyBpICs9IDUgKSB7XHJcbiAgICAgICAgdmFyIGEgPSBpICogKDIuMCAqIE1hdGguUEkgLyAzNjAuMCk7XHJcbiAgICAgICAgdmVydGljZXMucHVzaCAoIE1hdGguc2luKGEpICogMC41IClcclxuICAgICAgICB2ZXJ0aWNlcy5wdXNoICggTWF0aC5jb3MoYSkgKiAwLjUgKVxyXG4gICAgICAgIHZlcnRpY2VzLnB1c2ggKCAwLjAgKVxyXG4gICAgICAgIHRleHR1cmVDb29yZHMucHVzaCAoMS4wKVxyXG4gICAgICAgIHRleHR1cmVDb29yZHMucHVzaCAoMS4wKVxyXG4gICAgICAgIG5iICs9IDE7XHJcbiAgICB9XHJcblxyXG4gICAgLy9HTF9UUklBTkdMRV9GQU5cclxuICAgIGdsQXNzZXQuY2lyY2xlVmVydGV4UG9zaXRpb25CdWZmZXIgICAgICAgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgZ2wuYmluZEJ1ZmZlciAgICggZ2wuQVJSQVlfQlVGRkVSLCBnbEFzc2V0LmNpcmNsZVZlcnRleFBvc2l0aW9uQnVmZmVyICk7XHJcbiAgICBnbC5idWZmZXJEYXRhICAgKCBnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodmVydGljZXMpLCBnbC5TVEFUSUNfRFJBVyApO1xyXG4gICAgZ2xBc3NldC5jaXJjbGVWZXJ0ZXhQb3NpdGlvbkJ1ZmZlci5pdGVtU2l6ZSAgID0gMztcclxuICAgIGdsQXNzZXQuY2lyY2xlVmVydGV4UG9zaXRpb25CdWZmZXIubnVtSXRlbXMgICA9IG5iO1xyXG5cclxuICAgIGdsQXNzZXQuY2lyY2xlVmVydGV4VGV4dHVyZUJ1ZmZlciAgICAgICAgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgZ2wuYmluZEJ1ZmZlciAgICggZ2wuQVJSQVlfQlVGRkVSLCBnbEFzc2V0LmNpcmNsZVZlcnRleFRleHR1cmVCdWZmZXIgKTtcclxuICAgIGdsLmJ1ZmZlckRhdGEgICAoIGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlQ29vcmRzKSwgZ2wuU1RBVElDX0RSQVcgKTtcclxuICAgIGdsQXNzZXQuY2lyY2xlVmVydGV4VGV4dHVyZUJ1ZmZlci5pdGVtU2l6ZSAgICA9IDI7XHJcbiAgICBnbEFzc2V0LmNpcmNsZVZlcnRleFRleHR1cmVCdWZmZXIubnVtSXRlbXMgICAgPSBuYjtcclxuXHJcbiAgICBnbC5jbGVhckNvbG9yICAgKCAxLjAsIDEuMCwgMS4wLCAxLjAgICk7XHJcbiAgICBnbC5kaXNhYmxlICAgICAgKCBnbC5ERVBUSF9URVNUICApO1xyXG5cclxuICAgIGdsQXNzZXQucHJvZyA9IHt9XHJcbiAgICBnbEFzc2V0LnByb2dbXCJIZWF0R2F1c3NpYW5cIl0gICAgICAgICA9IGdsVG9vbHMuTWFrZVByb2dyYW0gICAoIFwidmVydGV4VGV4XCIgLCBcImZyYWdtZW50SGVhdEdhdXNzaWFuXCIgLCBnbEFzc2V0KTsgXHJcbiAgICBnbEFzc2V0LnByb2dbXCJIZWF0TGluZWFyXCJdICAgICAgICAgICA9IGdsVG9vbHMuTWFrZVByb2dyYW0gICAoIFwidmVydGV4VGV4XCIgLCBcImZyYWdtZW50SGVhdExpbmVhclwiICAgLCBnbEFzc2V0KTsgXHJcbiAgICBnbEFzc2V0LnByb2dbXCJUZXhcIl0gICAgICAgICAgICAgICAgICA9IGdsVG9vbHMuTWFrZVByb2dyYW0gICAoIFwidmVydGV4VGV4XCIgLCBcImZyYWdtZW50VGV4XCIgICAgICAgICAgLCBnbEFzc2V0KTsgXHJcbiAgICBnbEFzc2V0LnByb2dbXCJDbHV0XCJdICAgICAgICAgICAgICAgICA9IGdsVG9vbHMuTWFrZVByb2dyYW0gICAoIFwidmVydGV4VGV4XCIgLCBcImZyYWdtZW50Q2x1dFwiICAgICAgICAgLCBnbEFzc2V0KTtcclxuICAgIGdsQXNzZXQucHJvZ1tcIlNoYWRlXCJdICAgICAgICAgICAgICAgID0gZ2xUb29scy5NYWtlUHJvZ3JhbSAgICggXCJ2ZXJ0ZXhUZXhcIiAsIFwiZnJhZ21lbnRTaGFkZVwiICAgICAgICAsIGdsQXNzZXQpO1xyXG4gICAgZ2xBc3NldC5wcm9nW01hcGVyaWFsLk11bEJsZW5kXSAgICAgID0gZ2xUb29scy5NYWtlUHJvZ3JhbSAgICggXCJ2ZXJ0ZXhUZXhcIiAsIFwiZnJhZ21lbnRNdWxCbGVuZFwiICAgICAsIGdsQXNzZXQpO1xyXG4gICAgZ2xBc3NldC5wcm9nW01hcGVyaWFsLkFscGhhQ2xpcF0gICAgID0gZ2xUb29scy5NYWtlUHJvZ3JhbSAgICggXCJ2ZXJ0ZXhUZXhcIiAsIFwiZnJhZ21lbnRBbHBoYUNsaXBcIiAgICAsIGdsQXNzZXQpO1xyXG4gICAgZ2xBc3NldC5wcm9nW01hcGVyaWFsLkFscGhhQmxlbmRdICAgID0gZ2xUb29scy5NYWtlUHJvZ3JhbSAgICggXCJ2ZXJ0ZXhUZXhcIiAsIFwiZnJhZ21lbnRBbHBoYUJsZW5kXCIgICAsIGdsQXNzZXQpO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hcFJlbmRlcmVyO1xyXG4iLCJcclxuXHJcbmZ1bmN0aW9uIFBvaW50U3ltYm9saXplciAoc3ltYk5hbWUsb3BhY2l0eSkge1xyXG4gICB0aGlzLnJ0ICAgICAgICA9IFwiUG9pbnRTeW1ib2xpemVyXCI7XHJcbiAgIHRoaXMuZmlsZSAgICAgID0gc3ltYk5hbWU7XHJcbiAgIHRoaXMub3BhY2l0eSAgID0gdHlwZW9mIG9wYWNpdHkgIT09ICd1bmRlZmluZWQnID8gb3BhY2l0eSA6IDEuMDtcclxuICAgdGhpcy5Mb2FkIChbc3ltYk5hbWVdKVxyXG59XHJcblxyXG5Qb2ludFN5bWJvbGl6ZXIucHJvdG90eXBlLkxvYWQgPSBmdW5jdGlvbiAgKHN5bWJsaXN0KSB7XHJcbiAgIHZhciBzeW1icyA9IHt9XHJcbiAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBzeW1ibGlzdC5sZW5ndGggOyBpKyspIHtcclxuICAgICAgc3ltYnNbc3ltYmxpc3RbaV1dID0gMVxyXG4gICB9XHJcbiAgIHN0eWxlTWFuYWdlci5Mb2FkU3ltYkxpc3QgKHN5bWJzLGZ1bmN0aW9uKCl7fSlcclxufVxyXG5cclxuUG9pbnRTeW1ib2xpemVyLnByb3RvdHlwZS5UcmFuc2xhdGUgPSBmdW5jdGlvbiAgKCB0clgsIHRyWSApIHtcclxuICAgdGhpcy50clggPSB0clhcclxuICAgdGhpcy50clkgPSB0cllcclxufVxyXG5cclxuUG9pbnRTeW1ib2xpemVyLnByb3RvdHlwZS5BbGlnbmVtZW50ID0gZnVuY3Rpb24gICggeEFsaWduLCB5QWxpZ24gKSB7IC8vIHRvcCwgYm90dG9tLCBsZWZ0LHJpZ2h0ICwgY2VudGVyIChkZWZhdWx0KVxyXG4gICB0aGlzLmNlbnRlclggPSB4QWxpZ25cclxuICAgdGhpcy5jZW50ZXJZID0geUFsaWduXHJcbn1cclxuXHJcblBvaW50U3ltYm9saXplci5wcm90b3R5cGUuU2V0Q3VzdG9tRnVuY3Rpb24gPSBmdW5jdGlvbiAgKGZjdEN1c3RvbSwgZmN0SW5pdCkge1xyXG4gICBpZiAodHlwZW9mIGZjdEN1c3RvbSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRoaXMuY3VzdG9tID0gZmN0Q3VzdG9tXHJcbiAgIH1cclxuICAgaWYgKHR5cGVvZiBmY3RJbml0ID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhpcy5faW5pdCA9IGZjdEluaXQ7XHJcbiAgICAgIHRoaXMuX2luaXQoKTtcclxuICAgfVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50U3ltYm9saXplcjsiLCJcclxudmFyIFRpbGVSZW5kZXJlciA9IHt9O1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuLypcclxuICogc3ViTGF5ZXJJZCArIHpvb20gPSBydWxlSWQgPSB1bmlxdWVcclxuICovXHJcblxyXG5UaWxlUmVuZGVyZXIubGF5ZXJEdW1teUNvbG9ycyA9IFtdO1xyXG5UaWxlUmVuZGVyZXIuQXBwbHlTdHlsZSA9IGZ1bmN0aW9uICggY3R4ICwgbGluZSAsIGF0dHIsIHN1YkxheWVySWQgLCB6b29tICwgc3R5bGUgKSB7XHJcblxyXG4gICB0cnkge1xyXG4gICAgICB2YXIgc3ViTGF5ZXIgPSBzdHlsZSBbIHN1YkxheWVySWQgXSAvLyBvbiBhIDEgc2V1bCBzeW1ib2xpemVyIHBhciBsYXllclxyXG4gICAgICBcclxuICAgICAgaWYgKCAhc3ViTGF5ZXIudmlzaWJsZSApIHJldHVybjtcclxuXHJcbiAgICAgIGZvciAodmFyIF9zID0gMCA7IF9zIDwgc3ViTGF5ZXIucy5sZW5ndGggOyBfcysrICkge1xyXG4gICAgICAgICB2YXIgY3VyU3R5bGUgPSBzdWJMYXllci5zW19zXTtcclxuICAgICAgICAgaWYgKCB6b29tID49IGN1clN0eWxlLnptYXggJiYgem9vbSA8PSBjdXJTdHlsZS56bWluKSB7ICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGZvciAodmFyIF9zcyA9IDAgOyBfc3MgPCBjdXJTdHlsZS5zLmxlbmd0aCA7IF9zcysrKXsgXHJcbiAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBjdXJTdHlsZS5zW19zc107XHJcbiAgICAgICAgICAgICAgIGlmICggXCJjdXN0b21cIiBpbiBwYXJhbXMgJiYgdHlwZW9mIChwYXJhbXMuY3VzdG9tKSA9PSAnZnVuY3Rpb24nICkge1xyXG4gICAgICAgICAgICAgICAgICBwYXJhbXMuY3VzdG9tIChhdHRyKVxyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgIGlmICggVGlsZVJlbmRlcmVyW3BhcmFtcy5ydF0gKSBcclxuICAgICAgICAgICAgICAgICAgVGlsZVJlbmRlcmVyWyBwYXJhbXMucnQgXSAoIGN0eCAsIGxpbmUsIGF0dHIsIHBhcmFtcyApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgIH1cclxuICAgY2F0Y2ggKGUpIHtcclxuLy8gICAgY29uc29sZS5sb2cgKCBcIkFwcGx5U3R5bGUgRmFpbGVkIDogXCIgKyBlICk7XHJcbiAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqICBkYXRhID0ganNvbiBxdWkgY29udGllbnQgdG91dGVzIGxlcyBkb25uZWVzIGRlIGxhIG1hcC5cclxuICogIGRhdGFbXCJsXCJdID0gPGxheWVycz4gPSB0b3V0ZXMgbGVzIGRvbm5lZXMgbGllZWVzIGF1IExheWVyc1xyXG4gKiAgXHRcdFx0Y29udGllbnQgdW5lIGxpc3RlIGRlIDxsYXllckdyb3VwPlxyXG4gKiAgPGxheWVyR3JvdXA+IGNvbnRpZW50IHVuZSBsaXN0ZSBkZSA8bGF5ZXI+IChsbCkgZXQgdW5lIGxpc3RlIGRlIHNvdXJjZXMgKGxpZWUpXHJcbiAqICA8bGF5ZXI+IGNvbnRpZW50IHVuZSBsaXN0ZSBkZSA8cnVsZT4gXHJcbiAqICA8cnVsZT4gY29udGllbnQgdW5lIGxpc3RlIGRlIDxzdHlsZT4gXHJcbiAqICBcclxuICogVW4gbGF5ZXIgZXN0IHVuZSBsaXN0ZSBkZSBnIGdyb3VwXHJcbiAqL1xyXG5UaWxlUmVuZGVyZXIubWF4UmVuZGVyVGltZSA9IDBcclxuVGlsZVJlbmRlcmVyLlJlbmRlckxheWVycyA9IGZ1bmN0aW9uIChvc21WaXNpYmlsaXRpZXMsIGxheWVyUG9zaXRpb24gLCBjdHggLCBkYXRhICwgem9vbSAsIHN0eWxlICwgY3Vyc29yICApIHtcclxuXHJcbiAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4gICBpZighZGF0YSlcclxuICAgICAgcmV0dXJuIGN1cnNvcjtcclxuICAgXHJcbiAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4gICB2YXIgYmVnaW5BdDtcclxuICAgdmFyIGxpbWl0VGltZSA9IGZhbHNlO1xyXG5cclxuICAgaWYodHlwZW9mKGN1cnNvcik9PT0ndW5kZWZpbmVkJyB8fCBjdXJzb3IgPT0gbnVsbCkge1xyXG4gICAgICBiZWdpbkF0ID0gMDtcclxuICAgfVxyXG4gICBlbHNlIHtcclxuICAgICAgYmVnaW5BdCA9IGN1cnNvcjtcclxuICAgICAgbGltaXRUaW1lID0gdHJ1ZTtcclxuICAgfVxyXG5cclxuICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbiAgIHZhciBkYXRlICAgID0gbmV3IERhdGUoKTtcclxuICAgdmFyIHN0YXJ0VCAgPSBkYXRlLmdldFRpbWUoKTtcclxuXHJcbiAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4gICBmb3IgKHZhciBpID0gYmVnaW5BdCA7IGkgPCBkYXRhW1wibFwiXS5sZW5ndGggOyArK2kgKSB7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgbGF5ZXIgPSBkYXRhW1wibFwiXVtpXTsgLy8gbGF5ZXJHcm91cFxyXG4gICAgICB2YXIgc3ViTGF5ZXJJZCA9IGxheWVyW1wiY1wiXTsgLy8gY2xhc3MgLSBpbCBkZXZyYWl0IHkgYXZvaXIgdW5lIGNsYXNzIHBhciBMYXllciwgcGFzIHBhciBMYXllckdyb3VwID9cclxuICAgICAgXHJcbiAgICAgIGlmKCBvc21WaXNpYmlsaXRpZXMgIT0gbnVsbCAmJiAgbGF5ZXJQb3NpdGlvbiAhPSBudWxsICYmICBvc21WaXNpYmlsaXRpZXNbc3ViTGF5ZXJJZF0gIT0gbGF5ZXJQb3NpdGlvbiApXHJcbiAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICBcclxuICAgICAgdmFyIGxsID0gbGF5ZXJbXCJnXCJdOyAvLyBsaXN0ZSBkZSBsaXN0ZXMgZGUgbGlnbmVzXHJcbiAgICAgIHZhciBhbCA9IG51bGw7IC8vIGF0dHJpYnV0bGlzdFxyXG4gICAgICBpZiAoXCJhXCIgaW4gbGF5ZXIpIGFsID0gbGF5ZXJbXCJhXCJdO1xyXG4gICAgICBpZiAobGwgPT0gbnVsbCkgXHJcbiAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgZm9yICggdmFyIGwgPSAwIDsgbCA8IGxsLmxlbmd0aCA7ICsrbCApIHtcclxuICAgICAgICAgdmFyIGxpbmVzID0gbGxbbF07IC8vIGxpc3RlIGRlIGxpZ25lc1xyXG4gICAgICAgICB2YXIgYXR0ciAgPSBudWxsOyAvLyBhdHRyaWJ1dFxyXG4gICAgICAgICBpZiAoYWwpIGF0dHIgPSBhbFtsXSAvLyBhdHRyaWJ1dGxpc3RcclxuICAgICAgICAgZm9yICggdmFyIGxpID0gMCA7IGxpIDwgbGluZXMubGVuZ3RoIDsgKytsaSApIFxyXG4gICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBsaW5lID0gbGluZXNbbGldO1xyXG4gICAgICAgICAgICBUaWxlUmVuZGVyZXIuQXBwbHlTdHlsZSAoIGN0eCAsIGxpbmUgLCBhdHRyICwgc3ViTGF5ZXJJZCAsIHpvb20sIHN0eWxlICk7XHJcbiAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAobGltaXRUaW1lKSB7XHJcbiAgICAgICAgIHZhciBkaWZmVCAgID0gKG5ldyBEYXRlKS5nZXRUaW1lKCkgLSBzdGFydFQ7XHJcbiAgICAgICAgIFRpbGVSZW5kZXJlci5tYXhSZW5kZXJUaW1lID0gTWF0aC5tYXgoVGlsZVJlbmRlcmVyLm1heFJlbmRlclRpbWUsIGRpZmZUKTtcclxuICAgICAgICAgaWYgKCBkaWZmVCA+IDEwIClcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICB9XHJcbiAgIH1cclxuICAgXHJcbiAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcbiAgIFxyXG4gICB2YXIgZGlmZlQgICA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpIC0gc3RhcnRUO1xyXG4gICBpZiAoIGkgPCBkYXRhW1wibFwiXS5sZW5ndGggKVxyXG4gICAgICByZXR1cm4gWyBpKzEgLCBkaWZmVCBdO1xyXG4gICBlbHNlIFxyXG4gICAgICByZXR1cm4gWyBudWxsICwgZGlmZlQgXSA7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbi8qKlxyXG4gKiBcclxuICovXHJcblRpbGVSZW5kZXJlci5SZW5kZXJEeW5hbWljYWxMYXllciA9IGZ1bmN0aW9uIChjdHggLCBkYXRhICwgem9vbSAsIHN0eWxlICwgY3Vyc29yKSB7XHJcbiAgICBcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcbiAgICBcclxuICAgIGlmKCFkYXRhKVxyXG4gICAgICAgIHJldHVybiBjdXJzb3I7XHJcbiAgICBcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcbiAgICBcclxuICAgIHZhciBiZWdpbkF0O1xyXG4gICAgdmFyIGxpbWl0VGltZSA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICBpZih0eXBlb2YoY3Vyc29yKT09PSd1bmRlZmluZWQnIHx8IGN1cnNvciA9PSBudWxsKSB7XHJcbiAgICAgICAgYmVnaW5BdCA9IDA7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBiZWdpbkF0ID0gY3Vyc29yO1xyXG4gICAgICAgIGxpbWl0VGltZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcbiAgICBcclxuICAgIHZhciBkYXRlICAgID0gbmV3IERhdGUoKTtcclxuICAgIHZhciBzdGFydFQgID0gZGF0ZS5nZXRUaW1lKCk7XHJcbiAgICBcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcbiAgICAvLyByZW5kZXJpbmcgcG9pbnRzIG9ubHlcclxuICAgIC8vIHRvZG8gOiByZW5kZXIgbGluZXNcclxuICAgIFxyXG4gICAgdmFyIGkgPSBiZWdpbkF0O1xyXG4gICAgZm9yICh2YXIgaWQgaW4gZGF0YS5wb2ludHMgKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHBvaW50ID0gZGF0YS5wb2ludHNbaWRdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIFRpbGVSZW5kZXJlci5BcHBseVN0eWxlICggY3R4LCBbcG9pbnQueCwgcG9pbnQueV0sIHBvaW50LmRhdGEsIHN0eWxlLnN5bWJJZCwgem9vbSwgc3R5bGUuY29udGVudCApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChsaW1pdFRpbWUpIHtcclxuICAgICAgICAgICAgdmFyIGRpZmZUICAgPSAobmV3IERhdGUpLmdldFRpbWUoKSAtIHN0YXJ0VDtcclxuICAgICAgICAgICAgVGlsZVJlbmRlcmVyLm1heFJlbmRlclRpbWUgPSBNYXRoLm1heChUaWxlUmVuZGVyZXIubWF4UmVuZGVyVGltZSwgZGlmZlQpO1xyXG4gICAgICAgICAgICBpZiAoIGRpZmZUID4gMTAgKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGkrKztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuICAgIFxyXG4gICAgdmFyIGRpZmZUICAgPSAobmV3IERhdGUpLmdldFRpbWUoKSAtIHN0YXJ0VDtcclxuICAgIGlmICggaSA8IE9iamVjdC5rZXlzKGRhdGEucG9pbnRzKS5sZW5ndGggKVxyXG4gICAgICAgIHJldHVybiBbIGkrMSAsIGRpZmZUIF07XHJcbiAgICBlbHNlIFxyXG4gICAgICAgIHJldHVybiBbIG51bGwgLCBkaWZmVCBdIDtcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuVGlsZVJlbmRlcmVyLkZpbmRTdWJMYXllcklkID0gZnVuY3Rpb24gKCBwb2ludCwgY3R4ICwgZGF0YSAsIHpvb20sIHN0eWxlQ29udGVudCwgbGF5ZXJQb3NpdGlvbiwgb3NtVmlzaWJpbGl0aWVzICkge1xyXG5cclxuICAgY3R4LnNjYWxlKDEsMSk7XHJcbiAgIHZhciBpO1xyXG4gICBmb3IgKGkgPSBkYXRhW1wibFwiXS5sZW5ndGggLSAxIDsgaSA+PSAwICA7IGktLSApIHtcclxuICAgICAgXHJcbiAgICAgIC8vIHJlbmRlciB0aGUgc3ltYm9saXplcnNcclxuICAgICAgdmFyIGxheWVyID0gZGF0YVtcImxcIl1baV07IC8vIGxheWVyR3JvdXBcclxuICAgICAgdmFyIHN1YkxheWVySWQgPSBsYXllcltcImNcIl07IC8vIGNsYXNzIC0gaWwgZGV2cmFpdCB5IGF2b2lyIHVuZSBjbGFzcyBwYXIgTGF5ZXIsIHBhcyBwYXIgTGF5ZXJHcm91cCA/XHJcbiAgICAgIFxyXG4gICAgICBpZihvc21WaXNpYmlsaXRpZXNbc3ViTGF5ZXJJZF0gIT0gbGF5ZXJQb3NpdGlvbilcclxuICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICB2YXIgc3ViTGF5ZXIgPSBzdHlsZUNvbnRlbnQgWyBzdWJMYXllcklkIF07XHJcbiAgICAgIFxyXG4gICAgICBpZiAoICFzdWJMYXllci52aXNpYmxlICkgXHJcbiAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICBcclxuICAgICAgLy8gY2xlYXJcclxuICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiI2ZmZlwiO1xyXG4gICAgICBjdHguZmlsbFJlY3QocG9pbnQueCwgcG9pbnQueSwgMSwgMSk7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgbGwgPSBsYXllcltcImdcIl07IC8vIGxpc3RlIGRlIGxpc3RlcyBkZSBsaWduZXNcclxuICAgICAgdmFyIGFsID0gbnVsbDsgLy8gYXR0cmlidXRsaXN0XHJcbiAgICAgIGlmIChcImFcIiBpbiBsYXllcikgYWwgPSBsYXllcltcImFcIl1cclxuICAgICAgaWYgKGxsID09IG51bGwpIFxyXG4gICAgICAgICBjb250aW51ZVxyXG4gICAgICAgICBcclxuICAgICAgZm9yICggdmFyIGwgPSAwIDsgbCA8IGxsLmxlbmd0aCA7ICsrbCApIHtcclxuICAgICAgICAgdmFyIGxpbmVzID0gbGxbbF0gLy8gbGlzdGUgZGUgbGlnbmVzXHJcbiAgICAgICAgIHZhciBhdHRyICA9IG51bGwgLy8gYXR0cmlidXRcclxuICAgICAgICAgaWYgKGFsKSBhdHRyID0gYWxbbF0gLy8gYXR0cmlidXRsaXN0XHJcbiAgICAgICAgIGZvciAoIHZhciBsaSA9IDAgOyBsaSA8IGxpbmVzLmxlbmd0aCA7ICsrbGkgKSBcclxuICAgICAgICAge1xyXG4gICAgICAgICAgICBUaWxlUmVuZGVyZXIuQXBwbHlMb29rdXBTdHlsZSAoIGN0eCAsIGxpbmVzW2xpXSAsIGF0dHIgLCBzdWJMYXllciAsIHpvb20pO1xyXG4gICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIG5vdyBnZXQgdGhlIHBpeGVsIGFuZCBpdHMgY29sb3IgdG8ga25vdyBpZiB0aGlzIGxheWVyIGlzIHVuZGVyIHRoZSBjbGlja1xyXG4gICAgICAvLyBOT1RFIDogZ2V0SW1hZ2VEYXRhIDogY29vcmQgZm9yIHRoZSBjYW52YXMsIG5vdCB0aGUgY3R4ID0+IG5vIHRyYW5zbGF0aW9uXHJcbiAgICAgIHZhciBwaXhlbCA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgMSwgMSkuZGF0YTtcclxuICAgICAgXHJcbiAgICAgIC8vIHJldHJpZXZlIHRoZSBjb2xvclxyXG4gICAgICB2YXIgY29sb3IgPSAoXCIwMDAwMDBcIiArIFV0aWxzLnJnYlRvSGV4KHBpeGVsWzBdLCBwaXhlbFsxXSwgcGl4ZWxbMl0pKS5zbGljZSgtNik7XHJcbiAgICAgIFxyXG4gICAgICBpZihjb2xvciAhPSBcImZmZmZmZlwiKVxyXG4gICAgICAgICByZXR1cm4gc3ViTGF5ZXJJZDtcclxuICAgfVxyXG4gICBcclxuICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5UaWxlUmVuZGVyZXIuQXBwbHlMb29rdXBTdHlsZSA9IGZ1bmN0aW9uICggY3R4ICwgbGluZSAsIGF0dHIsIHN1YkxheWVyICwgem9vbSAgKSB7XHJcbiAgIHRyeSB7XHJcbiAgICAgIGZvciAodmFyIF9zID0gMCA7IF9zIDwgc3ViTGF5ZXIucy5sZW5ndGggOyBfcysrICkge1xyXG4gICAgICAgICB2YXIgY3VyU3R5bGUgPSBzdWJMYXllci5zW19zXTtcclxuXHJcbiAgICAgICAgIGlmICggem9vbSA+PSBjdXJTdHlsZS56bWF4ICYmIHpvb20gPD0gY3VyU3R5bGUuem1pbiApIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgX3NzID0gMCA7IF9zcyA8IGN1clN0eWxlLnMubGVuZ3RoIDsgX3NzKyspeyBcclxuICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IGN1clN0eWxlLnNbX3NzXTtcclxuXHJcbiAgICAgICAgICAgICAgIGlmICggVGlsZVJlbmRlcmVyW3BhcmFtcy5ydF0gKSBcclxuICAgICAgICAgICAgICAgeyBcclxuICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IGpRdWVyeS5leHRlbmQodHJ1ZSwge30sIHBhcmFtcyk7XHJcbiAgICAgICAgICAgICAgICAgIHBhcmFtc1tcImFscGhhXCJdID0gXCIxXCI7XHJcbiAgICAgICAgICAgICAgICAgIHBhcmFtc1tcImZpbGxcIl0gPSBcIiMwMDAwMDBcIjtcclxuICAgICAgICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlXCJdID0gXCIjMDAwMDAwXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICBUaWxlUmVuZGVyZXJbIHBhcmFtcy5ydCBdICggY3R4ICwgbGluZSwgYXR0ciwgcGFyYW1zIClcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICB9XHJcbiAgIGNhdGNoIChlKSB7XHJcbi8vICAgIGNvbnNvbGUubG9nICggXCJBcHBseVN0eWxlIEZhaWxlZCA6IFwiICsgZSApO1xyXG4gICB9XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4vLyB2MiBAZGVwcmVjYXRlZCA/IFxyXG5UaWxlUmVuZGVyZXIuRHJhd0ltYWdlcyA9IGZ1bmN0aW9uICh0aWxlLCBjdHgsIHd4LCB3eSApIHtcclxuICAgXHJcbiAgIGlmICggdGlsZSAmJiB0aWxlLklzTG9hZGVkKCkgJiYgdGlsZS5Jc1VwVG9EYXRlKCkpIHtcclxuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICBjdHgucmVjdCh3eCwgd3kgLCBNYXBlcmlhbC50aWxlU2l6ZSwgTWFwZXJpYWwudGlsZVNpemUpO1xyXG4gICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnI0ZGRkZGRic7XHJcbiAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICBcclxuICAgICAgdGlsZS5SZW5kZXJWZWN0b3JpYWxMYXllcnMoY3R4LCB3eCwgd3kpO1xyXG4gICB9XHJcbiAgIGVsc2Uge1xyXG4gICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgIGN0eC5yZWN0KHd4LCB3eSAsIE1hcGVyaWFsLnRpbGVTaXplLCBNYXBlcmlhbC50aWxlU2l6ZSk7XHJcbiAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgY3R4LmZpbGxTdHlsZSA9ICcjRUVFRUVFJztcclxuICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgIH1cclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuLy9TeW1ib2xpemVyIHJlbmRlcmluZ1xyXG5cclxuVGlsZVJlbmRlcmVyLkxpbmVTeW1ib2xpemVyID0gZnVuY3Rpb24oIGN0eCAsIGxpbmUgLCBhdHRyICwgcGFyYW1zICkge1xyXG4gICBjdHguc2F2ZSgpXHJcbiAgIGlmICAoIFwiZGFzaGFycmF5XCIgaW4gcGFyYW1zICkge1xyXG4gICAgICB2YXIgZGFTdHIgPSBwYXJhbXMgIFtcImRhc2hhcnJheVwiXS5zcGxpdChcIixcIik7XHJcbiAgICAgIHZhciBkYSA9ICQubWFwKCBkYVN0ciAsIGZ1bmN0aW9uKG4peyByZXR1cm4gcGFyc2VJbnQobik7IH0pO1xyXG4gICAgICBSZW5kZXJMaW5lREEoY3R4LGxpbmUsZGEpO1xyXG4gICB9XHJcbiAgIGVsc2Uge1xyXG4gICAgICBSZW5kZXJMaW5lKGN0eCxsaW5lKTsgICBcclxuICAgfVxyXG4gICBpZiAoIFwiYWxwaGFcIiBpbiBwYXJhbXMgKSB7XHJcbiAgICAgIGN0eC5nbG9iYWxBbHBoYT1wYXJhbXNbXCJhbHBoYVwiXVxyXG4gICB9XHJcbiAgIGlmICggXCJ3aWR0aFwiIGluIHBhcmFtcyApIHtcclxuICAgICAgY3R4LmxpbmVXaWR0aCA9IHBhcmFtc1tcIndpZHRoXCJdIDtcclxuICAgfVxyXG4gICBpZiAoIFwibGluZWpvaW5cIiBpbiBwYXJhbXMgKSBcclxuICAgICAgY3R4LmxpbmVKb2luPSBwYXJhbXNbXCJsaW5lam9pblwiXSA7XHJcbiAgIGlmICggXCJsaW5lY2FwXCIgaW4gcGFyYW1zIClcclxuICAgICAgY3R4LmxpbmVDYXAgPSBwYXJhbXMgW1wibGluZWNhcFwiXTtcclxuICAgaWYgKCBcInN0cm9rZVwiIGluIHBhcmFtcyApIHtcclxuICAgICAgY3R4LnN0cm9rZVN0eWxlPSBwYXJhbXNbXCJzdHJva2VcIl1cclxuICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICB9XHJcbiAgIGN0eC5yZXN0b3JlKClcclxufVxyXG5cclxuVGlsZVJlbmRlcmVyLlBvbHlnb25TeW1ib2xpemVyID0gZnVuY3Rpb24gKCBjdHggLCBsaW5lICwgYXR0ciAsIHBhcmFtcyApIHtcclxuICAgY3R4LnNhdmUoKVxyXG4gICBSZW5kZXJMaW5lKGN0eCxsaW5lKTsgICBcclxuICAgaWYgKCBcImFscGhhXCIgaW4gcGFyYW1zICkgXHJcbiAgICAgIGN0eC5nbG9iYWxBbHBoYT1wYXJhbXNbXCJhbHBoYVwiXVxyXG4gICBpZiAoIFwiZmlsbFwiIGluIHBhcmFtcyApIHtcclxuICAgICAgY3R4LmZpbGxTdHlsZT0gcGFyYW1zW1wiZmlsbFwiXVxyXG4gICAgICBjdHguZmlsbCgpO1xyXG4gICB9XHJcbiAgIGN0eC5yZXN0b3JlKClcclxufVxyXG5cclxuVGlsZVJlbmRlcmVyLkxpbmVQYXR0ZXJuU3ltYm9saXplciA9IGZ1bmN0aW9uICggY3R4ICwgbGluZSAsIGF0dHIgLCBwYXJhbXMgKSB7XHJcbiAgIC8vIGN0eC5zYXZlKClcclxuICAgY29uc29sZS5sb2cgKFwiTm90IHlldCBpbXBsZW1lbnRlZCA6IExpbmVQYXR0ZXJuU3ltYm9saXplclwiKVxyXG4gICAvLyBjdHgucmVzdG9yZSgpXHJcbn1cclxuXHJcblRpbGVSZW5kZXJlci5Qb2x5Z29uUGF0dGVyblN5bWJvbGl6ZXIgPSBmdW5jdGlvbiAoIGN0eCAsIGxpbmUgLCBhdHRyICwgcGFyYW1zICkge1xyXG4gICBpZiAoIFwiZmlsZVwiIGluIHBhcmFtcyApIHtcclxuICAgICAgdmFyIHN5bWIgPSB3aW5kb3cubWFwZXJpYWxTeW1iW3BhcmFtcy5maWxlXTtcclxuICAgXHJcbiAgICAgIGN0eC5zYXZlKClcclxuICAgICAgUmVuZGVyTGluZShjdHgsbGluZSk7XHJcbiAgICAgIGN0eC5jbGlwKClcclxuICAgICAgaWYgKCBcImFscGhhXCIgaW4gcGFyYW1zICkgXHJcbiAgICAgICAgIGN0eC5nbG9iYWxBbHBoYT1wYXJhbXNbXCJhbHBoYVwiXVxyXG4gICAgICBjdHguZHJhd0ltYWdlKCBzeW1iLmRhdGEsIDAgLCAwICk7XHJcbiAgICAgIGN0eC5yZXN0b3JlKClcclxuICAgfVxyXG4gICAvLyBjdHguc2F2ZSgpXHJcbiAgIC8vY29uc29sZS5sb2cgKFwiTm90IHlldCBpbXBsZW1lbnRlZCA6IFBvbHlnb25QYXR0ZXJuU3ltYm9saXplclwiKVxyXG4gICAvL2NvbnNvbGUubG9nICggbGluZSApXHJcbiAgIC8vY29uc29sZS5sb2cgKCBwYXJhbXMgKVxyXG4gICAvLyBjdHgucmVzdG9yZSgpXHJcbn1cclxuXHJcblRpbGVSZW5kZXJlci5Qb2ludFN5bWJvbGl6ZXIgPSBmdW5jdGlvbiAoIGN0eCAsIGxpbmUgLCBhdHRyICwgcGFyYW1zICkge1xyXG4gICBpZiAoIHBhcmFtcy5maWxlIGluIHdpbmRvdy5tYXBlcmlhbFN5bWIgKSB7XHJcbiAgICAgIHZhciBzeCA9IDEuMDtcclxuICAgICAgdmFyIHN5ID0gMS4wO1xyXG4gICAgICBpZiAoJ19zeCcgaW4gY3R4ICkge1xyXG4gICAgICAgICBzeCA9IGN0eC5fc3g7XHJcbiAgICAgICAgIHN5ID0gY3R4Ll9zeTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgdmFyIHRyWCA9IDA7XHJcbiAgICAgIHZhciB0clkgPSAwO1xyXG4gICAgICBpZiAoICd0clgnIGluIHBhcmFtcyApXHJcbiAgICAgICAgIHRyWCA9IHBhcmFtcy50clg7XHJcbiAgICAgIGlmICggJ3RyWScgaW4gcGFyYW1zIClcclxuICAgICAgICAgdHJZID0gcGFyYW1zLnRyWTtcclxuXHJcbiAgICAgIHZhciBzeW1iID0gd2luZG93Lm1hcGVyaWFsU3ltYltwYXJhbXMuZmlsZV07XHJcbiAgICAgIGlmIChzeW1iLnR5cGUgPT0gXCJzdmdcIikge1xyXG4gICAgICAgICB2YXIgdyAgICA9IDAuMFxyXG4gICAgICAgICB2YXIgaCAgICA9IDAuMFxyXG4gICAgICAgICB2YXIgbm9kZSA9IHN5bWIuZGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN2Z1wiKVswXVxyXG4gICAgICAgICBpZiAobm9kZSkge1xyXG4gICAgICAgICAgICB3ID0gcGFyc2VJbnQobm9kZS5nZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiKSk7XHJcbiAgICAgICAgICAgIGggPSBwYXJzZUludChub2RlLmdldEF0dHJpYnV0ZShcImhlaWdodFwiKSk7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgXHJcbiAgICAgICAgIHZhciBzaGlmdFggPSAtICh3IC8gMi4wKTsgLy8gZGVmYXVsdCBjZW50ZXJlZFxyXG4gICAgICAgICB2YXIgc2hpZnRZID0gLSAoaCAvIDIuMCk7IC8vIGRlZmF1bHQgY2VudGVyZWRcclxuICAgICAgICAgaWYgKCdjZW50ZXJYJyBpbiBwYXJhbXMpIHtcclxuICAgICAgICAgICAgaWYgKHBhcmFtcy5jZW50ZXJYID09IFwibGVmdFwiKVxyXG4gICAgICAgICAgICAgICBzaGlmdFggPSAwO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChwYXJhbXMuY2VudGVyWCA9PSBcInJpZ2h0XCIpXHJcbiAgICAgICAgICAgICAgIHNoaWZ0WCA9IC13XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgaWYgKCdjZW50ZXJZJyBpbiBwYXJhbXMpIHtcclxuICAgICAgICAgICAgaWYgKHBhcmFtcy5jZW50ZXJZID09IFwidG9wXCIpXHJcbiAgICAgICAgICAgICAgIHNoaWZ0WSA9IDA7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHBhcmFtcy5jZW50ZXJZID09IFwiYm90dG9tXCIpXHJcbiAgICAgICAgICAgICAgIHNoaWZ0WSA9IC1oXHJcbiAgICAgICAgIH1cclxuICAgICAgICAgXHJcbiAgICAgICAgIGN0eC5zYXZlKClcclxuICAgICAgICAgaWYgKCdfdHgnIGluIGN0eCApIHtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSAoY3R4Ll90eCxjdHguX3R5KVxyXG4gICAgICAgICB9XHJcbiAgICAgICAgIGlmICggXCJvcGFjaXR5XCIgaW4gcGFyYW1zICkge1xyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQWxwaGE9cGFyYW1zW1wib3BhY2l0eVwiXVxyXG4gICAgICAgICB9XHJcbiAgICAgICAgIGN0eC5kcmF3U3ZnKCBzeW1iLmRhdGEsIChsaW5lWzBdKnN4KSArIHNoaWZ0WCArIHRyWCwgKGxpbmVbMV0qc3kpICsgc2hpZnRZICsgdHJZKTtcclxuICAgICAgICAgY3R4LnJlc3RvcmUoKVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgeyAvL1wiaW1nXCJcclxuICAgICAgICAgdmFyIHNoaWZ0WCA9IC0oc3ltYi5kYXRhLndpZHRoIC8gMi4wKTsgLy8gZGVmYXVsdCBjZW50ZXJlZFxyXG4gICAgICAgICB2YXIgc2hpZnRZID0gLShzeW1iLmRhdGEuaGVpZ2h0IC8gMi4wKTsgLy8gZGVmYXVsdCBjZW50ZXJlZFxyXG4gICAgICAgICBpZiAoJ2NlbnRlclgnIGluIHBhcmFtcykge1xyXG4gICAgICAgICAgICBpZiAocGFyYW1zLmNlbnRlclggPT0gXCJsZWZ0XCIpXHJcbiAgICAgICAgICAgICAgIHNoaWZ0WCA9IDA7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHBhcmFtcy5jZW50ZXJYID09IFwicmlnaHRcIilcclxuICAgICAgICAgICAgICAgc2hpZnRYID0gLXN5bWIuZGF0YS53aWR0aFxyXG4gICAgICAgICB9XHJcbiAgICAgICAgIGlmICgnY2VudGVyWScgaW4gcGFyYW1zKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMuY2VudGVyWSA9PSBcInRvcFwiKVxyXG4gICAgICAgICAgICAgICBzaGlmdFkgPSAwO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChwYXJhbXMuY2VudGVyWSA9PSBcImJvdHRvbVwiKVxyXG4gICAgICAgICAgICAgICBzaGlmdFkgPSAtc3ltYi5kYXRhLmhlaWdodFxyXG4gICAgICAgICB9XHJcbiAgICAgICAgIFxyXG4gICAgICAgICBjdHguc2F2ZSgpXHJcbiAgICAgICAgIGlmICgnX3R4JyBpbiBjdHggKSB7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUgKGN0eC5fdHgsY3R4Ll90eSlcclxuICAgICAgICAgfVxyXG4gICAgICAgICBpZiAoIFwib3BhY2l0eVwiIGluIHBhcmFtcyApIHtcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbEFscGhhPXBhcmFtc1tcIm9wYWNpdHlcIl1cclxuICAgICAgICAgfVxyXG4gICAgICAgICBjdHguZHJhd0ltYWdlKCBzeW1iLmRhdGEsIChsaW5lWzBdKnN4KSArIHNoaWZ0WCArIHRyWCwgKGxpbmVbMV0qc3kpICsgc2hpZnRZICsgdHJZKTtcclxuICAgICAgICAgY3R4LnJlc3RvcmUoKVxyXG4gICAgICB9XHJcbiAgIH1cclxufVxyXG5cclxuVGlsZVJlbmRlcmVyLlRleHRTeW1ib2xpemVyID0gZnVuY3Rpb24gKCBjdHggLCBsaW5lICwgYXR0ciAsIHBhcmFtcyApIHtcclxuICAgaWYgKCEgYXR0cilcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICBcclxuICAgdmFyIGZvbnRuYW1lID0gKFwiZmFjZS1uYW1lXCIgaW4gcGFyYW1zICYmIHBhcmFtc1tcImZhY2UtbmFtZVwiXSkgPyBwYXJhbXNbXCJmYWNlLW5hbWVcIl0gOiBcIkRlamFWdSBTYW5zXCI7XHJcbiAgIHZhciBzaXplICAgICA9IFwic2l6ZVwiIGluIHBhcmFtcyA/IHBhcmFtcy5zaXplK1wicHhcIiA6IFwiOHB4XCI7ICAgXHJcbiAgIHZhciBmb250ICAgICA9IHNpemUgKyBcIiBcIiArIGZvbnRuYW1lO1xyXG4gICBcclxuICAgY3R4LnNhdmUoKTtcclxuICAgY3R4LlNldEZvbnQoZm9udCk7XHJcbiAgIGlmICggXCJvcGFjaXR5XCIgaW4gcGFyYW1zICkge1xyXG4gICAgICBjdHguZ2xvYmFsQWxwaGE9cGFyYW1zW1wib3BhY2l0eVwiXVxyXG4gICB9XHJcbiAgIHZhciBmaWxsaXQgID0gZmFsc2VcclxuICAgdmFyIHN0b2tlaXQgPSBmYWxzZVxyXG4gICB2YXIgY3V0U2l6ZSA9IDA7XHJcbiAgIHZhciBjZW50ZXIgID0gZmFsc2U7XHJcblxyXG4gICB2YXIgdHJhbnNsYXRlID0gWyAnX3R4JyBpbiBjdHggPyBjdHguX3R4IDogMC4wICwgJ190eScgaW4gY3R4ID8gY3R4Ll90eSA6IDAuMCBdO1xyXG4gICBpZiAoXCJkeFwiIGluIHBhcmFtcykgdHJhbnNsYXRlWzBdICs9IHBhcnNlSW50KCBwYXJhbXNbXCJkeFwiXSApXHJcbiAgIGlmIChcImR5XCIgaW4gcGFyYW1zKSB0cmFuc2xhdGVbMV0gKz0gcGFyc2VJbnQoIHBhcmFtc1tcImR5XCJdIClcclxuICAgaWYgKFwic2hpZWxkLWR4XCIgaW4gcGFyYW1zKSB0cmFuc2xhdGVbMF0gKz0gcGFyc2VJbnQoIHBhcmFtc1tcInNoaWVsZC1keFwiXSApXHJcbiAgIGlmIChcInNoaWVsZC1keVwiIGluIHBhcmFtcykgdHJhbnNsYXRlWzFdICs9IHBhcnNlSW50KCBwYXJhbXNbXCJzaGllbGQtZHlcIl0gKVxyXG4gICBcclxuICAgaWYgKCBcImhhbG8tZmlsbFwiIGluIHBhcmFtcyAmJiAgXCJoYWxvLXJhZGl1c1wiIGluIHBhcmFtcyApIHtcclxuICAgICAgY3R4LmxpbmVXaWR0aCAgPSBwYXJzZUludCAoIHBhcmFtc1tcImhhbG8tcmFkaXVzXCJdICkgKiAyIDtcclxuICAgICAgY3R4LnN0cm9rZVN0eWxlPSBwYXJhbXNbXCJoYWxvLWZpbGxcIl07XHJcbiAgICAgIHN0b2tlaXQgPSB0cnVlXHJcbiAgIH1cclxuICAgaWYgKCBcIndyYXAtd2lkdGhcIiBpbiBwYXJhbXMgKSB7XHJcbiAgICAgIGN1dFNpemUgPSBwYXJzZUludChwYXJhbXNbXCJ3cmFwLXdpZHRoXCJdKTtcclxuICAgfVxyXG4gICBpZiAobGluZS5sZW5ndGggPiAyKSB7XHJcbiAgICAgIGNlbnRlciA9IHRydWU7XHJcbiAgIH1cclxuICAgaWYgKCBcInBsYWNlbWVudFwiIGluIHBhcmFtcyAmJiBwYXJhbXNbXCJwbGFjZW1lbnRcIl0gPT0gXCJwb2ludFwiICkge1xyXG4gICAgICBjZW50ZXIgPSB0cnVlO1xyXG4gICB9XHJcbiAgIGlmICggXCJmaWxsXCIgaW4gcGFyYW1zICkge1xyXG4gICAgICBjdHguZmlsbFN0eWxlPSBwYXJhbXNbXCJmaWxsXCJdO1xyXG4gICAgICBmaWxsaXQgPSB0cnVlXHJcbiAgIH1cclxuICAgdmFyIHR4dCA9IGF0dHJcclxuICAgaWYgKFwidGV4dC10cmFuc2Zvcm1cIiBpbiBwYXJhbXMpIHtcclxuICAgICAgaWYgKHBhcmFtc1tcInRleHQtdHJhbnNmb3JtXCJdID09IFwidXBwZXJjYXNlXCIpIHtcclxuICAgICAgICAgdHh0ID0gdHh0LnRvVXBwZXJDYXNlKClcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChwYXJhbXNbXCJ0ZXh0LXRyYW5zZm9ybVwiXSA9PSBcImxvd2VyY2FzZVwiKSB7XHJcbiAgICAgICAgIHR4dCA9IHR4dC50b0xvd2VyQ2FzZSgpKClcclxuICAgICAgfVxyXG4gICB9XHJcblxyXG4gICB2YXIgY29sRGV0ZWN0aW9uID0gW3RydWUsdHJ1ZV1cclxuICAgaWYgKCdjb2xsaXNpb25UaGlzJyBpbiBwYXJhbXMpXHJcbiAgICAgIGNvbERldGVjdGlvblswXSA9IHBhcmFtc1snY29sbGlzaW9uVGhpcyddXHJcbiAgIGlmICgnY29sbGlzaW9uT3RoZXInIGluIHBhcmFtcylcclxuICAgICAgY29sRGV0ZWN0aW9uWzFdID0gcGFyYW1zWydjb2xsaXNpb25PdGhlciddXHJcbiAgICAgIFxyXG4gICBpc1JlbmRlcmVyID0gZmFsc2VcclxuICAgaWYgKHN0b2tlaXQgJiYgZmlsbGl0KSB7XHJcbiAgICAgIGlzUmVuZGVyZXIgPSBjdHguc3Ryb2tlQW5kRmlsbFRleHQgKHR4dCxsaW5lLGN1dFNpemUsY2VudGVyLHRyYW5zbGF0ZSxjb2xEZXRlY3Rpb24pXHJcbiAgIH1cclxuICAgZWxzZSBpZiAoc3Rva2VpdCkge1xyXG4gICAgICBpc1JlbmRlcmVyID0gY3R4LnN0cm9rZVRleHQgKHR4dCxsaW5lLGN1dFNpemUsY2VudGVyLHRyYW5zbGF0ZSxjb2xEZXRlY3Rpb24pXHJcbiAgIH1cclxuICAgZWxzZSBpZiAoZmlsbGl0KSB7XHJcbiAgICAgIGlzUmVuZGVyZXIgPSBjdHguZmlsbFRleHQgKHR4dCxsaW5lLGN1dFNpemUsY2VudGVyLHRyYW5zbGF0ZSxjb2xEZXRlY3Rpb24pXHJcbiAgIH1cclxuICAgY3R4LnJlc3RvcmUoKTtcclxuICAgcmV0dXJuIGlzUmVuZGVyZXI7XHJcbn1cclxuXHJcblRpbGVSZW5kZXJlci5SYXN0ZXJTeW1ib2xpemVyID0gZnVuY3Rpb24oIGN0eCAsIGxpbmUgLCBhdHRyICwgcGFyYW1zICkge1xyXG4gICAvLyBjdHguc2F2ZSgpXHJcbiAgIC8vY29uc29sZS5sb2cgKFwiTm90IHlldCBpbXBsZW1lbnRlZCA6IFJhc3RlclN5bWJvbGl6ZXJcIilcclxuICAgLy8gY3R4LnJlc3RvcmUoKVxyXG59XHJcblxyXG5UaWxlUmVuZGVyZXIuU2hpZWxkU3ltYm9saXplciA9IGZ1bmN0aW9uICggY3R4ICwgbGluZSAsIGF0dHIgLCBwYXJhbXMgKSB7XHJcbiAgIHJlbmRlcmVyVCA9IHRoaXMuVGV4dFN5bWJvbGl6ZXIgKGN0eCAsIGxpbmUgLCBhdHRyICsgJycsIHBhcmFtcylcclxuICAgaWYgKHJlbmRlcmVyVCkge1xyXG4gICAgICB2YXIgdHgsdHk7XHJcbiAgICAgIGlmIChcInNoaWVsZC1keFwiIGluIHBhcmFtcykgdHggPSBwYXJzZUludCggcGFyYW1zW1wic2hpZWxkLWR4XCJdIClcclxuICAgICAgaWYgKFwic2hpZWxkLWR5XCIgaW4gcGFyYW1zKSB0eSA9IHBhcnNlSW50KCBwYXJhbXNbXCJzaGllbGQtZHlcIl0gKVxyXG4gICAgICBjdHguc2F2ZSgpXHJcbiAgICAgIGN0eC50cmFuc2xhdGUgKHR4LHR5KVxyXG4gICAgICB0aGlzLlBvaW50U3ltYm9saXplcihjdHggLCBsaW5lICwgYXR0ciAsIHBhcmFtcylcclxuICAgICAgY3R4LnJlc3RvcmUgKCApXHJcbiAgIH1cclxufVxyXG5cclxuVGlsZVJlbmRlcmVyLkJ1aWxkaW5nU3ltYm9saXplciA9IGZ1bmN0aW9uICggY3R4ICwgbGluZSAsIGF0dHIgLCBwYXJhbXMgKSB7XHJcbiAgIC8vIGN0eC5zYXZlKClcclxuICAgLy9jb25zb2xlLmxvZyAoXCJOb3QgeWV0IGltcGxlbWVudGVkIDogQnVpbGRpbmdTeW1ib2xpemVyXCIpXHJcbiAgIC8vIGN0eC5yZXN0b3JlKClcclxufVxyXG5cclxuVGlsZVJlbmRlcmVyLk1hcmtlcnNTeW1ib2xpemVyID0gZnVuY3Rpb24gKCBjdHggLCBsaW5lICwgYXR0ciAsIHBhcmFtcyApIHtcclxuICAgdmFyIHBsYWNlbWVudCA9IFwicG9pbnRcIlxyXG4gICBpZiAoIFwicGxhY2VtZW50XCIgaW4gcGFyYW1zICkgcGxhY2VtZW50ID0gcGFyYW1zW1wicGxhY2VtZW50XCJdXHJcbiAgIFxyXG4gICB2YXIgZ2VvbTtcclxuICAgaWYgKHBsYWNlbWVudCA9PSBcInBvaW50XCIgKSB7IGdlb20gPSBcImVsbGlwc2VcIiB9XHJcbiAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgIHsgZ2VvbSA9IFwiYXJyb3dcIiAgIH1cclxuICAgXHJcbiAgIGlmICggXCJtYXJrZXItdHlwZVwiIGluIHBhcmFtcyApIGdlb20gPSBwYXJhbXNbXCJtYXJrZXItdHlwZVwiXVxyXG4gICBcclxuICAgdmFyIGZpbGUgPSBudWxsXHJcbiAgIGlmICggXCJmaWxlXCIgaW4gcGFyYW1zICkgZmlsZSA9IHBhcmFtc1tcImZpbGVcIl1cclxuICAgXHJcbiAgIGlmICggZ2VvbSA9PSBcImVsbGlwc2VcIiAmJiBwbGFjZW1lbnQgPT0gXCJwb2ludFwiICYmICFmaWxlKSB7XHJcbiAgICAgIHZhciBzeCA9IDEuMDtcclxuICAgICAgdmFyIHN5ID0gMS4wO1xyXG4gICAgICBpZiAoJ19zeCcgaW4gY3R4ICkge1xyXG4gICAgICAgICBzeCA9IGN0eC5fc3g7XHJcbiAgICAgICAgIHN5ID0gY3R4Ll9zeTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY3R4LnNhdmUoKVxyXG5cclxuICAgICAgaWYgKCdfdHgnIGluIGN0eCApIHtcclxuICAgICAgICAgY3R4LnRyYW5zbGF0ZSAoY3R4Ll90eCxjdHguX3R5KVxyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICB2YXIgdyA9IDEwLjBcclxuICAgICAgdmFyIGggPSAxMC4wXHJcbiAgICAgIGlmICggXCJ3aWR0aFwiIGluIHBhcmFtcyApICAgeyAgdz1wYXJzZUZsb2F0KHBhcmFtc1tcIndpZHRoXCJdKSAgfVxyXG4gICAgICBpZiAoIFwiaGVpZ2h0XCIgaW4gcGFyYW1zICkgIHsgIGg9cGFyc2VGbG9hdChwYXJhbXNbXCJoZWlnaHRcIl0pIH1cclxuICAgICAgXHJcbiAgICAgIHc9aCAvLyBJIGRvbid0IGtub3cgd2h5IG91ciBzdHlsZSBpcyBicm9rZW4gPT4gZHJhdyBhbGxpcHNlIGFuZCBub3QgY2lyY2xlIC4uLlxyXG4gICAgICBjdHguc2NhbGUoMSxoL3cpXHJcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgY3R4LmFyYyggbGluZVswXSAqIHN4LCBsaW5lWzFdICogc3kgLCB3ICwwICwgTWF0aC5QSSoyICwgZmFsc2UgKTtcclxuICAgICAgXHJcbiAgICAgIGlmICggXCJzdHJva2Utb3BhY2l0eVwiIGluIHBhcmFtcyApeyAgY3R4Lmdsb2JhbEFscGhhPXBhcmFtc1tcInN0cm9rZS1vcGFjaXR5XCJdfVxyXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ICBjdHguZ2xvYmFsQWxwaGE9MSB9XHJcbiAgICAgIGlmICggXCJzdHJva2Utd2lkdGhcIiBpbiBwYXJhbXMgKSAgeyAgY3R4LmxpbmVXaWR0aCA9IHBhcmFtc1tcInN0cm9rZS13aWR0aFwiXSA7fVxyXG4gICAgICBcclxuICAgICAgaWYgKCBcInN0cm9rZVwiIGluIHBhcmFtcyApIHtcclxuICAgICAgICAgY3R4LnN0cm9rZVN0eWxlPSBwYXJhbXNbXCJzdHJva2VcIl1cclxuICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIFwib3BhY2l0eVwiIGluIHBhcmFtcyApIHsgIGN0eC5nbG9iYWxBbHBoYT1wYXJhbXNbXCJvcGFjaXR5XCJdICAgfVxyXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICB7ICBjdHguZ2xvYmFsQWxwaGE9MSAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgIGlmICggXCJmaWxsXCIgaW4gcGFyYW1zICkge1xyXG4gICAgICAgICBjdHguZmlsbFN0eWxlPSBwYXJhbXNbXCJmaWxsXCJdXHJcbiAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGN0eC5yZXN0b3JlKClcclxuICAgfVxyXG4gICBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2cgKFwiTm90IHlldCBpbXBsZW1lbnRlZCA6IE1hcmtlcnNTeW1ib2xpemVyIChub3QgZWxsaXBzZSAvIHBsYWNlbWVudCBwb2ludClcIilcclxuICAgfVxyXG59XHJcblxyXG5UaWxlUmVuZGVyZXIuR2x5cGhTeW1ib2xpemVyID0gZnVuY3Rpb24gKCBjdHggLCBsaW5lICwgYXR0ciAsIHBhcmFtcyApIHtcclxuICAgLy8gY3R4LnNhdmUoKVxyXG4gICBjb25zb2xlLmxvZyAoXCJOb3QgeWV0IGltcGxlbWVudGVkIDogR2x5cGhTeW1ib2xpemVyXCIpXHJcbiAgIC8vIGN0eC5yZXN0b3JlKClcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUaWxlUmVuZGVyZXI7XHJcbiIsIlxyXG52YXIgR0xUb29scyAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi90b29scy9nbC10b29scy5qc1wiKSxcclxuICAgIExheWVyICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZGVscy9sYXllci5qc1wiKSxcclxuICAgIER5bmFtaWNhbExheWVyUGFydCAgICAgID0gcmVxdWlyZSgnLi9sYXllcnBhcnRzL2R5bmFtaWNhbC1sYXllci1wYXJ0LmpzJyksXHJcbiAgICBJbWFnZUxheWVyUGFydCAgICAgICAgICA9IHJlcXVpcmUoJy4vbGF5ZXJwYXJ0cy9pbWFnZS1sYXllci1wYXJ0LmpzJyksXHJcbiAgICBSYXN0ZXJMYXllcjggICAgICAgICAgICA9IHJlcXVpcmUoJy4vbGF5ZXJwYXJ0cy9yYXN0ZXItbGF5ZXItcGFydC5qcycpLlJhc3RlckxheWVyOCxcclxuICAgIFJhc3RlckxheWVyMTYgICAgICAgICAgID0gcmVxdWlyZSgnLi9sYXllcnBhcnRzL3Jhc3Rlci1sYXllci1wYXJ0LmpzJykuUmFzdGVyTGF5ZXIxNixcclxuICAgIFNoYWRlTGF5ZXJQYXJ0ICAgICAgICAgID0gcmVxdWlyZSgnLi9sYXllcnBhcnRzL3NoYWRlLWxheWVyLXBhcnQuanMnKSxcclxuICAgIFZlY3RvcmlhbExheWVyUGFydCAgICAgID0gcmVxdWlyZSgnLi9sYXllcnBhcnRzL3ZlY3RvcmlhbC1sYXllci1wYXJ0LmpzJyk7XHJcbiAgICBcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbmZ1bmN0aW9uIFRpbGUgKG1hcFZpZXcsIHgsIHksIHopIHtcclxuXHJcbiAgIHRoaXMubWFwVmlldyAgICAgID0gbWFwVmlldztcclxuICAgdGhpcy5nbCAgICAgICAgICAgPSBtYXBWaWV3LmNvbnRleHQuYXNzZXRzLmN0eFxyXG4gICB0aGlzLmFzc2V0cyAgICAgICA9IG1hcFZpZXcuY29udGV4dC5hc3NldHNcclxuXHJcbiAgIHRoaXMueCAgICAgICAgICAgID0geDtcclxuICAgdGhpcy55ICAgICAgICAgICAgPSB5O1xyXG4gICB0aGlzLnogICAgICAgICAgICA9IHo7XHJcblxyXG4gICB0aGlzLmxheWVyUGFydHMgICA9IFtdO1xyXG5cclxuICAgLy8gcHJlcGFyaW5nIGRvdWJsZSBidWZmZXJpbmcgdG8gcmVuZGVyIGFzIHRleHR1cmUgIVxyXG4gICB0aGlzLmZyYW1lQnVmZmVyTCA9IFtdO1xyXG4gICB0aGlzLnRleEwgICAgICAgICA9IFtdO1xyXG4gICB0aGlzLm5iRXJyb3JzICAgICA9IDA7XHJcblxyXG4gICB0aGlzLlJlZnJlc2goKTtcclxuICAgdGhpcy5idWlsZExheWVyUGFydHMoKTtcclxuICAgdGhpcy5wcmVwYXJlQnVmZmVyaW5nKCk7XHJcbn1cclxuXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuLy9TVEFUVVMgTUFOQUdFTUVOVFxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblRpbGUucHJvdG90eXBlLlJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgIHRoaXMudGV4ID0gbnVsbDtcclxufVxyXG5cclxuVGlsZS5wcm90b3R5cGUuSXNVcFRvRGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciB0ZXh0dXJlUmVhZHkgICAgICAgICAgICA9IHRoaXMudGV4dHVyZVJlYWR5KCksXHJcbiAgICAgICAgYWxsTGF5ZXJQYXJ0c0FyZVJlYWR5ICAgPSB0cnVlO1xyXG4gICAgXHJcbiAgICBmb3IodmFyIGkgPSAwOyBpPCB0aGlzLmxheWVyUGFydHMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgIGlmICghIHRoaXMubGF5ZXJQYXJ0c1tpXS5Jc1VwVG9EYXRlICgpKXtcclxuICAgICAgICAgICAgYWxsTGF5ZXJQYXJ0c0FyZVJlYWR5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICByZXR1cm4gdGV4dHVyZVJlYWR5ICYmIGFsbExheWVyUGFydHNBcmVSZWFkeTtcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5UaWxlLnByb3RvdHlwZS50ZXh0dXJlUmVhZHkgPSBmdW5jdGlvbiAoICkge1xyXG4gICByZXR1cm4gdGhpcy50ZXggIT0gbnVsbCB8fCB0aGlzLmxheWVyUGFydHMubGVuZ3RoID09IDA7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5UaWxlLnByb3RvdHlwZS5SZWxlYXNlID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICBzb3VyY2VNYW5hZ2VyLnJlbGVhc2UodGhpcy54LCB0aGlzLnksIHRoaXMueiwgdGhpcy5tYXBWaWV3LmlkKTtcclxuXHJcbiAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmNvbmZpZy5sYXllcnMubGVuZ3RoOyBpKyspe1xyXG4gICAgICB0cnl7XHJcbiAgICAgICAgIHRoaXMubGF5ZXJQYXJ0c1tpXS5SZWxlYXNlKCk7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goZSl7XHJcbiAgICAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS0tLS0tLS0tPiB0aWxlLlJlbGVhc2VcIilcclxuICAgICAgICAgY29uc29sZS5sb2coZSwgdGhpcy5sYXllclBhcnRzW2ldKVxyXG4gICAgICB9IFxyXG4gICB9XHJcblxyXG4gICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgMiA7IGkgPSBpICsgMSApIHtcclxuICAgICAgZ2wuZGVsZXRlRnJhbWVidWZmZXIgKCB0aGlzLmZyYW1lQnVmZmVyTFtpXSApO1xyXG4gICAgICBnbC5kZWxldGVUZXh0dXJlICAgICAoIHRoaXMudGV4TFtpXSApO1xyXG4gICB9XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5UaWxlLnByb3RvdHlwZS5SZWxlYXNlTGF5ZXIgPSBmdW5jdGlvbiAoaWQpIHtcclxuXHJcbiAgIGlmKHRoaXMubGF5ZXJQYXJ0c1tpZF0pe1xyXG4gICAgICB0aGlzLmxheWVyUGFydHNbaWRdLlJlbGVhc2UoKTtcclxuICAgICAgdGhpcy5sYXllclBhcnRzW2lkXS5SZXNldCgpO1xyXG4gICB9XHJcblxyXG4gICB0aGlzLlJlZnJlc2goKTtcclxufVxyXG5cclxuVGlsZS5wcm90b3R5cGUuUmVzZXRMYXllciA9IGZ1bmN0aW9uIChpZCkge1xyXG5cclxuICAgaWYodGhpcy5sYXllclBhcnRzW2lkXSlcclxuICAgICAgdGhpcy5sYXllclBhcnRzW2lkXS5SZXNldCgpO1xyXG5cclxuICAgdGhpcy5SZWZyZXNoKCk7XHJcbn1cclxuXHJcblRpbGUucHJvdG90eXBlLlJlc2V0ID0gZnVuY3Rpb24gKG9ubHlGdXNlKSB7XHJcblxyXG4gICBvbmx5RnVzZSA9ICh0eXBlb2Yob25seUZ1c2UpPT09J3VuZGVmaW5lZCcpP2ZhbHNlOm9ubHlGdXNlO1xyXG5cclxuICAgaWYgKCFvbmx5RnVzZSkge1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJQYXJ0cy5sZW5ndGg7IGkrKykgeyAgICAgIFxyXG4gICAgICAgICB0aGlzLmxheWVyUGFydHNbaV0uUmVzZXQoKTtcclxuICAgICAgfVxyXG4gICB9XHJcblxyXG4gICB0aGlzLlJlZnJlc2goKTtcclxufVxyXG5cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG4vL0xBWUVSIFBBUlRTIE1BTkFHRU1FTlRcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5UaWxlLnByb3RvdHlwZS5idWlsZExheWVyUGFydHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgIGZvcih2YXIgaSA9IDA7IGk8IHRoaXMubWFwVmlldy5sYXllcnMubGVuZ3RoOyBpKyspe1xyXG4gICAgICB0aGlzLmNyZWF0ZUxheWVyUGFydCh0aGlzLm1hcFZpZXcubGF5ZXJzW2ldLCBpKVxyXG4gICB9XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5UaWxlLnByb3RvdHlwZS5jcmVhdGVMYXllclBhcnQgPSBmdW5jdGlvbiAobGF5ZXIsIGluZGV4KSB7XHJcblxyXG4gICBzd2l0Y2gobGF5ZXIudHlwZSl7XHJcblxyXG4gICAgICBjYXNlIExheWVyLkltYWdlczpcclxuICAgICAgICAgdGhpcy5sYXllclBhcnRzLnNwbGljZShpbmRleCwgMCwgbmV3IEltYWdlTGF5ZXJQYXJ0ICAgICAoIGxheWVyLCB0aGlzLCB0aGlzLm1hcFZpZXcuY29udGV4dC5hc3NldHMuY3R4ICwgdGhpcy56KSk7XHJcbiAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICBcclxuICAgICAgY2FzZSBMYXllci5EeW5hbWljYWw6XHJcbiAgICAgIGNhc2UgTGF5ZXIuSGVhdDpcclxuICAgICAgICAgdGhpcy5sYXllclBhcnRzLnNwbGljZShpbmRleCwgMCwgbmV3IER5bmFtaWNhbExheWVyUGFydCAgKCBsYXllciwgdGhpcyApKTtcclxuICAgICAgICAgYnJlYWs7XHJcbiAgICAgIFxyXG4gICAgICBjYXNlIExheWVyLlZlY3RvcjpcclxuICAgICAgICAgdGhpcy5sYXllclBhcnRzLnNwbGljZShpbmRleCwgMCwgbmV3IFZlY3RvcmlhbExheWVyUGFydCAoIGxheWVyLCB0aGlzLm1hcFZpZXcgLCB0aGlzLnopKTtcclxuICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIExheWVyLlJhc3RlcjpcclxuICAgICAgICAgdGhpcy5sYXllclBhcnRzLnNwbGljZShpbmRleCwgMCwgbmV3IFJhc3RlckxheWVyOCAgICAoIGxheWVyLCB0aGlzLm1hcFZpZXcgLCB0aGlzLnopKTtcclxuICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIExheWVyLlNSVE06XHJcbiAgICAgICAgIHRoaXMubGF5ZXJQYXJ0cy5zcGxpY2UoaW5kZXgsIDAsIG5ldyBSYXN0ZXJMYXllcjE2ICAgICggbGF5ZXIsIHRoaXMubWFwVmlldyAsIHRoaXMueikpO1xyXG4gICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgTGF5ZXIuU2hhZGU6XHJcbiAgICAgICAgIHRoaXMubGF5ZXJQYXJ0cy5zcGxpY2UoaW5kZXgsIDAsIG5ldyBTaGFkZUxheWVyUGFydCAgICAoIGxheWVyLCB0aGlzLm1hcFZpZXcgLCB0aGlzLnopKTtcclxuICAgICAgICAgYnJlYWs7XHJcbiAgIH1cclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblRpbGUucHJvdG90eXBlLmFkZExheWVyID0gZnVuY3Rpb24gKGxheWVyQ29uZmlnKSB7XHJcbiAgIHRoaXMuY3JlYXRlTGF5ZXJGcm9tQ29uZmlnKGxheWVyQ29uZmlnLCB0aGlzLmNvbmZpZy5sYXllcnMubGVuZ3RoIC0gMSlcclxuICAgc291cmNlTWFuYWdlci5sb2FkU291cmNlcyh0aGlzLngsIHRoaXMueSwgdGhpcy56LCB0aGlzLm1hcFZpZXcuaWQpXHJcbiAgIHRoaXMuUmVmcmVzaCgpXHJcbn1cclxuXHJcblRpbGUucHJvdG90eXBlLmNoYW5nZUxheWVyID0gZnVuY3Rpb24gKGxheWVyQ29uZmlnLCBpbmRleCkge1xyXG4gICB0aGlzLnJlbW92ZUxheWVyKGluZGV4KVxyXG4gICB0aGlzLmNyZWF0ZUxheWVyRnJvbUNvbmZpZyhsYXllckNvbmZpZywgaW5kZXgpXHJcbiAgIHNvdXJjZU1hbmFnZXIubG9hZFNvdXJjZXModGhpcy54LCB0aGlzLnksIHRoaXMueiwgdGhpcy5tYXBWaWV3LmlkKVxyXG4gICB0aGlzLlJlZnJlc2goKVxyXG59XHJcblxyXG5UaWxlLnByb3RvdHlwZS5yZW1vdmVMYXllciA9IGZ1bmN0aW9uIChwb3NpdGlvbikge1xyXG4gICBpZih0aGlzLmxheWVyUGFydHMubGVuZ3RoID4gMCl7XHJcbiAgICAgIHRoaXMubGF5ZXJQYXJ0c1twb3NpdGlvbl0uUmVsZWFzZSgpXHJcbiAgICAgIHRoaXMubGF5ZXJQYXJ0cy5zcGxpY2UocG9zaXRpb24sIDEpXHJcbiAgICAgIHRoaXMuUmVmcmVzaCgpXHJcbiAgIH1cclxuICAgLy8gIGVsc2UgOiBhbGwgbGF5ZXJzIGFyZSByZWxlYXNlZCBiZWNhdXNlIG5vIGxheWVyIHJlbWFpbnNcclxufVxyXG5cclxuLyoqXHJcbiAqIEV4YWN0bHkgdGhlIHNhbWUgYXMgTGF5ZXIuZXhjaGFuZ2VMYXllcnNcclxuICogZXhjaGFuZ2VkSWRzIGNvbnRhaW5zIGEgbWFwcGluZyBiZXR3ZWVuIG9sZCBsYXllckluZGV4ZXMgYW5kIHRoZSBuZXcgb25lLCBhZnRlciBhIGxheWVyIHJlcG9zaXRpb25cclxuICogZXhhbXBsZSwgd2l0aCAzIGxheWVycywgYWZ0ZXIgbW92aW5nIGxheWVyMCAodWkgYm90dG9tKSB0byB0aGUgdG9wIChiZWNvbWVzIGxheWVyIDIpIDogXHJcbiAqIGV4Y2hhbmdlZElkcyA9IHtcclxuICAgezA6IDF9LFxyXG4gICB7MTogMn0sXHJcbiAgIHsyOiAwfVxyXG4gfSBcclxuICovXHJcblRpbGUucHJvdG90eXBlLmV4Y2hhbmdlTGF5ZXJzID0gZnVuY3Rpb24oZXhjaGFuZ2VkSWRzKSB7XHJcblxyXG4gICB2YXIgbmV3TGF5ZXJzID0gW107XHJcbiAgIGZvcihpZCBpbiBleGNoYW5nZWRJZHMpe1xyXG4gICAgICBuZXdMYXllcnMucHVzaCh0aGlzLmxheWVyUGFydHNbZXhjaGFuZ2VkSWRzW2lkXV0pO1xyXG4gICB9XHJcblxyXG4gICB0aGlzLmxheWVyUGFydHMgPSBuZXdMYXllcnM7XHJcbiAgIHRoaXMuUmVmcmVzaCgpO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuLy9UT0RPIHYyIDogQSBtZXR0cmUgZGFucyBjaGFxdWUgbGF5ZXJwYXJ0LnByZXBhcmUgKGxheWVyUGFydHNbaV0uSW5pdCAtPiBsYXllclBhcnRzW2ldLnByZXBhcmUpXHJcblxyXG4vL1RpbGUucHJvdG90eXBlLnNvdXJjZVJlYWR5ID0gZnVuY3Rpb24gKCBzb3VyY2UsIGRhdGEgLCBsaSkgeyAvKiBsaSBpcyBmb3IgY3VzdG9tUmVuZGVyZXIgPT4gSEVBVC9WZWN0b3IgY2FuIHVzZSB0aGUgc2FtZSBzb3VyY2UgKHNhbWUgc291cmNlIGdpZCkhISEqL1xyXG5cclxuLy9pZighZGF0YSl7XHJcbi8vY29uc29sZS5sb2coXCItLS0tLS0tPiB0aWxlLnNvdXJjZVJlYWR5IDogREFUQSBOVUxMICFcIilcclxuLy90aGlzLlJlbGVhc2UoKTtcclxuLy90aGlzLlJlc2V0KCk7XHJcbi8vcmV0dXJuXHJcbi8vfVxyXG4vL2lmICAoICh0eXBlb2YobGkpID09PSd1bmRlZmluZWQnKSB8fCBsaSA8IDAgfHwgbGkgPj0gdGhpcy5jb25maWcubGF5ZXJzLmxlbmd0aCkge1xyXG4vL2Zvcih2YXIgaSA9IDA7IGk8IHRoaXMuY29uZmlnLmxheWVycy5sZW5ndGg7IGkrKyl7XHJcblxyXG4vL2lmKHRoaXMuY29uZmlnLmxheWVyc1tpXS5zb3VyY2UuaWQgIT0gc291cmNlLmlkIClcclxuLy9jb250aW51ZTtcclxuXHJcbi8vdHJ5e1xyXG4vL3RoaXMubGF5ZXJQYXJ0c1tpXS5Jbml0KCBkYXRhIClcclxuLy99XHJcbi8vY2F0Y2goZSl7XHJcbi8vY29uc29sZS5sb2coXCItLS0tLS0tPiBFUlJPUlwiKVxyXG4vL31cclxuLy99ICAgXHJcbi8vfVxyXG4vL2Vsc2Uge1xyXG4vL2lmICggdGhpcy5jb25maWcubGF5ZXJzW2xpXS5zb3VyY2UuaWQgPT0gc291cmNlLmlkIClcclxuLy90aGlzLmxheWVyUGFydHNbbGldLkluaXQoIGRhdGEgKVxyXG4vL31cclxuLy99XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuLy92MiBAZGVwcmVjYXRlZCA/IFxyXG5UaWxlLnByb3RvdHlwZS5SZW5kZXJWZWN0b3JpYWxMYXllcnMgPSBmdW5jdGlvbiAoIGNvbnRleHQsIHd4LCB3eSApIHtcclxuICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVyUGFydHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKHRoaXMubGF5ZXJQYXJ0c1tpXS5HZXRUeXBlKCkgPT0gTGF5ZXIuVmVjdG9yICYmIHRoaXMubGF5ZXJQYXJ0c1tpXS5Jc1VwVG9EYXRlKCkgJiYgdGhpcy5sYXllclBhcnRzW2ldLmNudikge1xyXG4gICAgICAgICBjb250ZXh0LmRyYXdJbWFnZSh0aGlzLmxheWVyUGFydHNbaV0uY252LCB3eCwgd3kpO1xyXG4gICAgICB9XHJcbiAgIH1cclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcbi8vUkVOREVSSU5HXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuVGlsZS5wcm90b3R5cGUucHJlcGFyZUJ1ZmZlcmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgdmFyIGdsdG9vbHMgPSBuZXcgR0xUb29scyAoKVxyXG4gICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgMiA7IGkgPSBpICsgMSApIHtcclxuICAgICAgdmFyIGZidHggPSBnbHRvb2xzLkNyZWF0ZUZyYW1lQnVmZmVyVGV4KHRoaXMuZ2wsIE1hcGVyaWFsLnRpbGVTaXplLCBNYXBlcmlhbC50aWxlU2l6ZSk7XHJcbiAgICAgIHRoaXMuZnJhbWVCdWZmZXJMLnB1c2ggICAgICAgICggZmJ0eFswXSApO1xyXG4gICAgICB0aGlzLnRleEwucHVzaCAgICAgICAgICAgICAgICAoIGZidHhbMV0gKTtcclxuICAgfVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuVGlsZS5wcm90b3R5cGUuVXBkYXRlID0gZnVuY3Rpb24gKCBtYXhUaW1lICkge1xyXG5cclxuICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4gICB2YXIgZGF0ZSAgICAgICAgICAgICAgICAgPSAobmV3IERhdGUpXHJcbiAgIHZhciBzdGFydFQgICAgICAgICAgICAgICA9IGRhdGUuZ2V0VGltZSgpXHJcbiAgIHZhciBkaWZmVCAgICAgICAgICAgICAgICA9IDBcclxuICAgdmFyIG5vTGF5ZXJQYXJ0VXBkYXRlICAgID0gdHJ1ZTtcclxuXHJcbiAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG4gICAvLyBsYXllclBhcnRzIHVwZGF0ZVxyXG5cclxuICAgZm9yKHZhciBpID0gMDsgaTwgdGhpcy5sYXllclBhcnRzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgaWYgKCEgdGhpcy5sYXllclBhcnRzW2ldLklzVXBUb0RhdGUoKSApe1xyXG4gICAgICAgICBpZih0aGlzLmxheWVyUGFydHNbaV0uRGF0YVJlYWR5KCkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJQYXJ0c1tpXS5VcGRhdGUoIHRoaXMubGF5ZXJQYXJ0c1tpXS5wYXJhbXMsIGkgKTtcclxuICAgICAgICAgICAgbm9MYXllclBhcnRVcGRhdGUgPSBmYWxzZVxyXG5cclxuICAgICAgICAgICAgZGlmZlQgICA9IGRhdGUuZ2V0VGltZSgpIC0gc3RhcnRUO1xyXG4gICAgICAgICAgICBpZiAoIG1heFRpbWUgLSBkaWZmVCA8PSAwIClcclxuICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICB9XHJcblxyXG4gICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuICAgLy8gdGlsZS50ZXggdXBkYXRlXHJcblxyXG4gICBpZiAobm9MYXllclBhcnRVcGRhdGUgJiYgdGhpcy50ZXh0dXJlUmVhZHkoKSl7XHJcbiAgICAgIHJldHVybiBtYXhUaW1lIC0gMSA7XHJcbiAgIH1cclxuICAgZWxzZXtcclxuICAgICAgaWYgKCAhbm9MYXllclBhcnRVcGRhdGUgJiYgKG1heFRpbWUgLSBkaWZmVCA+IDApICkge1xyXG4gICAgICAgICBjb25zb2xlLmxvZyhcInRpbGUgcmVmcmVzaCArIGNvbXBvc2VcIik7XHJcbiAgICAgICAgIHRoaXMuUmVmcmVzaCgpO1xyXG4gICAgICAgICB0aGlzLkNvbXBvc2UoKTtcclxuICAgICAgICAgZGlmZlQgICA9IGRhdGUuZ2V0VGltZSgpIC0gc3RhcnRUO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbWF4VGltZSAtIGRpZmZUOyBcclxuICAgfVxyXG5cclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblRpbGUucHJvdG90eXBlLkNvbXBvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgIFxyXG4gICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG4gICBcclxuICAgdmFyIGxheWVyUGFydHNUb0NvbXBvc2UgPSBbXVxyXG4gICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllclBhcnRzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgaWYodGhpcy5sYXllclBhcnRzW2ldLklzVXBUb0RhdGUoKSlcclxuICAgICAgICAgbGF5ZXJQYXJ0c1RvQ29tcG9zZS5wdXNoKHRoaXMubGF5ZXJQYXJ0c1tpXSk7XHJcbiAgIH1cclxuXHJcbiAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4gICB2YXIgYmFja1RleCA9IGxheWVyUGFydHNUb0NvbXBvc2VbMF0udGV4XHJcbiAgIHZhciBkZXN0RmIgID0gdGhpcy5mcmFtZUJ1ZmZlckxbIDAgXVxyXG4gICB2YXIgdG1wSSAgICA9IDA7XHJcblxyXG4gICBpZiAoIGxheWVyUGFydHNUb0NvbXBvc2UubGVuZ3RoID4gMSApIHtcclxuXHJcbiAgICAgIGZvciggdmFyIGkgPSAxIDsgaSA8IGxheWVyUGFydHNUb0NvbXBvc2UubGVuZ3RoIDsgaSsrICkge1xyXG4gICAgICAgICB2YXIgZnJvbnRUZXggICA9IGxheWVyUGFydHNUb0NvbXBvc2VbaV0udGV4O1xyXG4gICAgICAgICBpZiAoZnJvbnRUZXgpIHtcclxuICAgICAgICAgICAgdmFyIGNvbXBvc2l0aW9uID0gbGF5ZXJQYXJ0c1RvQ29tcG9zZVtpXS5sYXllci5jb21wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHByb2cgICAgICAgID0gdGhpcy5hc3NldHMucHJvZ1sgY29tcG9zaXRpb24uc2hhZGVyIF0sXHJcbiAgICAgICAgICAgICAgICBwYXJhbXMgICAgICA9IGNvbXBvc2l0aW9uLnBhcmFtcztcclxuXHJcbiAgICAgICAgICAgIHRoaXMuRnVzZSAgICAgICggYmFja1RleCxmcm9udFRleCxkZXN0RmIsIHByb2cgLCBwYXJhbXMpO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLkNvcHkgKGJhY2tUZXgsIGRlc3RGYik7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgYmFja1RleCAgICAgICAgPSB0aGlzLnRleExbdG1wSV07XHJcbiAgICAgICAgIHRoaXMudGV4ICAgICAgID0gYmFja1RleDtcclxuXHJcbiAgICAgICAgIHRtcEkgICAgICAgICAgID0gKCB0bXBJICsgMSApICUgMjtcclxuICAgICAgICAgZGVzdEZiICAgICAgICAgPSB0aGlzLmZyYW1lQnVmZmVyTFsgdG1wSSBdO1xyXG4gICAgICB9XHJcbiAgIH1cclxuICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuQ29weSAoYmFja1RleCwgZGVzdEZiKTtcclxuICAgICAgdGhpcy50ZXggPSB0aGlzLnRleExbMF07XHJcbiAgIH1cclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblRpbGUucHJvdG90eXBlLkNvcHkgPSBmdW5jdGlvbiAoIGJhY2tUZXggLCBkZXN0RkIgKSB7XHJcblxyXG4gICB2YXIgZ2wgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHRoaXMuZ2w7XHJcblxyXG4gICBnbC5iaW5kRnJhbWVidWZmZXIgICAgICAgICAgICAgICAoIGdsLkZSQU1FQlVGRkVSLCBkZXN0RkIgKTtcclxuXHJcbiAgIHRoaXMuZ2wuY2xlYXJDb2xvciAgICAgICAgICAgICAgICggMS4wLCAxLjAsIDEuMCwgMS4wICApO1xyXG4gICB0aGlzLmdsLmRpc2FibGUgICAgICAgICAgICAgICAgICAoIHRoaXMuZ2wuREVQVEhfVEVTVCAgKTtcclxuICAgZ2wudmlld3BvcnQgICAgICAgICAgICAgICAgICAgICAgKCAwLCAwLCBkZXN0RkIud2lkdGgsIGRlc3RGQi5oZWlnaHQpO1xyXG4gICBnbC5jbGVhciAgICAgICAgICAgICAgICAgICAgICAgICAoIGdsLkNPTE9SX0JVRkZFUl9CSVQgKTtcclxuXHJcbiAgIHZhciBtdk1hdHJpeCAgICAgICAgICAgICAgICAgICAgID0gbWF0NC5jcmVhdGUoKTtcclxuICAgdmFyIHBNYXRyaXggICAgICAgICAgICAgICAgICAgICAgPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICBtYXQ0LmlkZW50aXR5ICAgICAgICAgICAgICAgICAgICAoIHBNYXRyaXggKTtcclxuICAgbWF0NC5pZGVudGl0eSAgICAgICAgICAgICAgICAgICAgKCBtdk1hdHJpeCApO1xyXG4gICBtYXQ0Lm9ydGhvICAgICAgICAgICAgICAgICAgICAgICAoIDAsIGRlc3RGQi53aWR0aCAsIDAsIGRlc3RGQi5oZWlnaHQsIDAsIDEsIHBNYXRyaXggKTsgLy8gWSBzd2FwICFcclxuXHJcbiAgIHZhciBwcm9nID0gdGhpcy5hc3NldHMucHJvZ1tcIlRleFwiXTtcclxuXHJcbiAgIHRoaXMuZ2wudXNlUHJvZ3JhbSAgICAgICAgICAgICAgIChwcm9nKTtcclxuICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2ICAgICAgICAgKHByb2cucGFyYW1zLnBNYXRyaXhVbmlmb3JtLm5hbWUsIGZhbHNlLCBwTWF0cml4KTtcclxuICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2ICAgICAgICAgKHByb2cucGFyYW1zLm12TWF0cml4VW5pZm9ybS5uYW1lLCBmYWxzZSwgbXZNYXRyaXgpO1xyXG4gICB0aGlzLmdsLmJpbmRCdWZmZXIgICAgICAgICAgICAgICAodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFBvc2l0aW9uQnVmZmVyKTtcclxuICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSAgKHByb2cuYXR0ci52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSk7XHJcbiAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlciAgICAgIChwcm9nLmF0dHIudmVydGV4UG9zaXRpb25BdHRyaWJ1dGUsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFBvc2l0aW9uQnVmZmVyLml0ZW1TaXplLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblxyXG4gICB0aGlzLmdsLmJpbmRCdWZmZXIgICAgICAgICAgICAgICAodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFRleHR1cmVCdWZmZXIpO1xyXG4gICB0aGlzLmdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5ICAocHJvZy5hdHRyLnRleHR1cmVDb29yZEF0dHJpYnV0ZSk7XHJcbiAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlciAgICAgIChwcm9nLmF0dHIudGV4dHVyZUNvb3JkQXR0cmlidXRlLCB0aGlzLmFzc2V0cy5zcXVhcmVWZXJ0ZXhUZXh0dXJlQnVmZmVyLml0ZW1TaXplLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblxyXG4gICB0aGlzLmdsLmFjdGl2ZVRleHR1cmUgICAgICAgICAgICAodGhpcy5nbC5URVhUVVJFMCk7XHJcbiAgIHRoaXMuZ2wuYmluZFRleHR1cmUgICAgICAgICAgICAgICh0aGlzLmdsLlRFWFRVUkVfMkQsIGJhY2tUZXggKTtcclxuICAgdGhpcy5nbC51bmlmb3JtMWkgICAgICAgICAgICAgICAgKHByb2cucGFyYW1zLnVTYW1wbGVyVGV4MS5uYW1lLCAwKTtcclxuICAgdGhpcy5nbC5kcmF3QXJyYXlzICAgICAgICAgICAgICAgKHRoaXMuZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFBvc2l0aW9uQnVmZmVyLm51bUl0ZW1zKTtcclxuXHJcbiAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAgICAgICAgICAgICAgICggZ2wuRlJBTUVCVUZGRVIsIG51bGwgKTtcclxuICAgdGhpcy5nbC5hY3RpdmVUZXh0dXJlICAgICAgICAgICAgKHRoaXMuZ2wuVEVYVFVSRTApO1xyXG4gICB0aGlzLmdsLmJpbmRUZXh0dXJlICAgICAgICAgICAgICAodGhpcy5nbC5URVhUVVJFXzJELCBudWxsICk7XHJcbn1cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblRpbGUucHJvdG90eXBlLkZ1c2UgPSBmdW5jdGlvbiAoIGJhY2tUZXgsZnJvbnRUZXgsZGVzdEZCLCBwcm9nLCBwYXJhbXMgKSB7XHJcblxyXG4gICB2YXIgZ2wgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHRoaXMuZ2w7XHJcbiAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAgICAgICAgICAgICAgICggZ2wuRlJBTUVCVUZGRVIsIGRlc3RGQiApO1xyXG5cclxuICAgdGhpcy5nbC5jbGVhckNvbG9yICAgICAgICAgICAgICAgKCAxLjAsIDEuMCwgMS4wLCAxLjAgICk7XHJcbiAgIHRoaXMuZ2wuZGlzYWJsZSAgICAgICAgICAgICAgICAgICggdGhpcy5nbC5ERVBUSF9URVNUICApO1xyXG4gICBnbC52aWV3cG9ydCAgICAgICAgICAgICAgICAgICAgICAoIDAsIDAsIGRlc3RGQi53aWR0aCwgZGVzdEZCLmhlaWdodCk7XHJcbiAgIGdsLmNsZWFyICAgICAgICAgICAgICAgICAgICAgICAgICggZ2wuQ09MT1JfQlVGRkVSX0JJVCApO1xyXG5cclxuICAgdmFyIG12TWF0cml4ICAgICAgICAgICAgICAgICAgICAgPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICB2YXIgcE1hdHJpeCAgICAgICAgICAgICAgICAgICAgICA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgIG1hdDQuaWRlbnRpdHkgICAgICAgICAgICAgICAgICAgICggcE1hdHJpeCApO1xyXG4gICBtYXQ0LmlkZW50aXR5ICAgICAgICAgICAgICAgICAgICAoIG12TWF0cml4ICk7XHJcbiAgIG1hdDQub3J0aG8gICAgICAgICAgICAgICAgICAgICAgICggMCwgZGVzdEZCLndpZHRoICwgMCwgZGVzdEZCLmhlaWdodCwgMCwgMSwgcE1hdHJpeCApOyAvLyBZIHN3YXAgIVxyXG5cclxuXHJcbiAgIHRoaXMuZ2wudXNlUHJvZ3JhbSAgICAgICAgICAgICAgIChwcm9nKTtcclxuICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2ICAgICAgICAgKHByb2cucGFyYW1zLnBNYXRyaXhVbmlmb3JtLm5hbWUgLCBmYWxzZSwgcE1hdHJpeCk7XHJcbiAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdiAgICAgICAgIChwcm9nLnBhcmFtcy5tdk1hdHJpeFVuaWZvcm0ubmFtZSwgZmFsc2UsIG12TWF0cml4KTtcclxuICAgdGhpcy5nbC5iaW5kQnVmZmVyICAgICAgICAgICAgICAgKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmFzc2V0cy5zcXVhcmVWZXJ0ZXhQb3NpdGlvbkJ1ZmZlcik7XHJcbiAgIHRoaXMuZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkgIChwcm9nLmF0dHIudmVydGV4UG9zaXRpb25BdHRyaWJ1dGUpO1xyXG4gICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIgICAgICAocHJvZy5hdHRyLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlLCB0aGlzLmFzc2V0cy5zcXVhcmVWZXJ0ZXhQb3NpdGlvbkJ1ZmZlci5pdGVtU2l6ZSwgdGhpcy5nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG5cclxuICAgdGhpcy5nbC5iaW5kQnVmZmVyICAgICAgICAgICAgICAgKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmFzc2V0cy5zcXVhcmVWZXJ0ZXhUZXh0dXJlQnVmZmVyKTtcclxuICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSAgKHByb2cuYXR0ci50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUpO1xyXG4gICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIgICAgICAocHJvZy5hdHRyLnRleHR1cmVDb29yZEF0dHJpYnV0ZSwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4VGV4dHVyZUJ1ZmZlci5pdGVtU2l6ZSwgdGhpcy5nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG5cclxuXHJcbiAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSAgICAgICAgICAgICh0aGlzLmdsLlRFWFRVUkUwKTtcclxuICAgdGhpcy5nbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAgKHRoaXMuZ2wuVEVYVFVSRV8yRCwgYmFja1RleCApO1xyXG4gICB0aGlzLmdsLnVuaWZvcm0xaSAgICAgICAgICAgICAgICAocHJvZy5wYXJhbXMudVNhbXBsZXJUZXgxLm5hbWUsIDApO1xyXG5cclxuICAgdGhpcy5nbC5hY3RpdmVUZXh0dXJlICAgICAgICAgICAgKHRoaXMuZ2wuVEVYVFVSRTEpO1xyXG4gICB0aGlzLmdsLmJpbmRUZXh0dXJlICAgICAgICAgICAgICAodGhpcy5nbC5URVhUVVJFXzJELCBmcm9udFRleCApO1xyXG4gICB0aGlzLmdsLnVuaWZvcm0xaSAgICAgICAgICAgICAgICAocHJvZy5wYXJhbXMudVNhbXBsZXJUZXgyLm5hbWUsIDEpO1xyXG5cclxuICAgZm9yICh2YXIgcCBpbiBwYXJhbXMpIHtcclxuICAgICAgLy8gV1JPTkcgISEhISEgYWx3YXlzICB1bmlmb3JtM2Z2ID8/P1xyXG4gICAgICAvL3RoaXMuZ2wudW5pZm9ybTNmdiAgICAgICAgICAgICAocHJvZy5wYXJhbXNbcF0gLCBwYXJhbXNbcF0gKTsgXHJcbiAgICAgIHRoaXMuZ2xbcHJvZy5wYXJhbXNbcF0uZmN0XSAocHJvZy5wYXJhbXNbcF0ubmFtZSwgcGFyYW1zW3BdICk7IFxyXG4gICB9XHJcblxyXG4gICB0aGlzLmdsLmRyYXdBcnJheXMgICAgICAgICAgICAgICAodGhpcy5nbC5UUklBTkdMRV9TVFJJUCwgMCwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4UG9zaXRpb25CdWZmZXIubnVtSXRlbXMpO1xyXG5cclxuICAgdGhpcy5nbC5iaW5kRnJhbWVidWZmZXIgICAgICAgICAgKHRoaXMuZ2wuRlJBTUVCVUZGRVIsIG51bGwgKTtcclxuICAgdGhpcy5nbC5hY3RpdmVUZXh0dXJlICAgICAgICAgICAgKHRoaXMuZ2wuVEVYVFVSRTApO1xyXG4gICB0aGlzLmdsLmJpbmRUZXh0dXJlICAgICAgICAgICAgICAodGhpcy5nbC5URVhUVVJFXzJELCBudWxsICk7XHJcbiAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSAgICAgICAgICAgICh0aGlzLmdsLlRFWFRVUkUxKTtcclxuICAgdGhpcy5nbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAgKHRoaXMuZ2wuVEVYVFVSRV8yRCwgbnVsbCApO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuVGlsZS5wcm90b3R5cGUuUmVuZGVyID0gZnVuY3Rpb24gKHBNYXRyaXgsIG12TWF0cml4KSB7XHJcbiAgIFxyXG4gICBpZiAoIHRoaXMudGV4dHVyZVJlYWR5KCkgKSB7XHJcbiAgICAgIHZhciBwcm9nICAgICAgICAgICAgICAgICAgICAgICAgID0gdGhpcy5hc3NldHMucHJvZ1tcIlRleFwiXTtcclxuICAgICAgdGhpcy5nbC51c2VQcm9ncmFtICAgICAgICAgICAgICAgKHByb2cpO1xyXG4gICAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYgICAgICAgICAocHJvZy5wYXJhbXMucE1hdHJpeFVuaWZvcm0ubmFtZSwgZmFsc2UsIHBNYXRyaXgpO1xyXG4gICAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYgICAgICAgICAocHJvZy5wYXJhbXMubXZNYXRyaXhVbmlmb3JtLm5hbWUsIGZhbHNlLCBtdk1hdHJpeCk7XHJcbiAgICAgIHRoaXMuZ2wuYmluZEJ1ZmZlciAgICAgICAgICAgICAgICh0aGlzLmdsLkFSUkFZX0JVRkZFUiwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4UG9zaXRpb25CdWZmZXIpO1xyXG4gICAgICB0aGlzLmdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5ICAocHJvZy5hdHRyLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlKTtcclxuICAgICAgdGhpcy5nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyICAgICAgKHByb2cuYXR0ci52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4UG9zaXRpb25CdWZmZXIuaXRlbVNpemUsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuXHJcbiAgICAgIHRoaXMuZ2wuYmluZEJ1ZmZlciAgICAgICAgICAgICAgICh0aGlzLmdsLkFSUkFZX0JVRkZFUiwgdGhpcy5hc3NldHMuc3F1YXJlVmVydGV4VGV4dHVyZUJ1ZmZlcik7XHJcbiAgICAgIHRoaXMuZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkgIChwcm9nLmF0dHIudGV4dHVyZUNvb3JkQXR0cmlidXRlKTtcclxuICAgICAgdGhpcy5nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyICAgICAgKHByb2cuYXR0ci50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFRleHR1cmVCdWZmZXIuaXRlbVNpemUsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuXHJcbiAgICAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSAgICAgICAgICAgICh0aGlzLmdsLlRFWFRVUkUwKTtcclxuICAgICAgdGhpcy5nbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAgKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXggKTtcclxuXHJcbiAgICAgIHZhciBlcnIgPSB0aGlzLmdsLmdldEVycm9yKCk7XHJcbiAgICAgIGlmICggZXJyICE9IDAgKVxyXG4gICAgICAgICBjb25zb2xlLmxvZyAoIGVyciApO1xyXG5cclxuICAgICAgdGhpcy5nbC51bmlmb3JtMWkgICAgICAgICAgICAgICAgKHByb2cucGFyYW1zLnVTYW1wbGVyVGV4MS5uYW1lLCAwKTtcclxuICAgICAgdGhpcy5nbC5kcmF3QXJyYXlzICAgICAgICAgICAgICAgKHRoaXMuZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIHRoaXMuYXNzZXRzLnNxdWFyZVZlcnRleFBvc2l0aW9uQnVmZmVyLm51bUl0ZW1zKTtcclxuXHJcbiAgICAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSAgICAgICAgICAgICh0aGlzLmdsLlRFWFRVUkUwKTtcclxuICAgICAgdGhpcy5nbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAgKHRoaXMuZ2wuVEVYVFVSRV8yRCwgbnVsbCApO1xyXG5cclxuICAgICAgdmFyIGVyciA9IHRoaXMuZ2wuZ2V0RXJyb3IoKTtcclxuICAgICAgaWYgKCBlcnIgIT0gMCApXHJcbiAgICAgICAgIGNvbnNvbGUubG9nICggZXJyICk7XHJcbiAgIH1cclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUaWxlO1xyXG5cclxuIiwiXHJcbmZ1bmN0aW9uIEdMVG9vbHMgKCkge31cclxuXHJcbkdMVG9vbHMucHJvdG90eXBlLlJlbmRlckxheWVyID0gZnVuY3Rpb24gICggY3R4ICwgIGxheWVyICkge1xyXG4gICAgaWQgPSBsYXllcltcImlcIl1cclxuICAgIGNsID0gbGF5ZXJbXCJjXCJdXHJcbiAgICBsbCA9IGxheWVyW1wiZ1wiXVxyXG4gICAgaWYgKGxsID09IG51bGwpIHJldHVybiBcclxuICAgIGZvciAoIGwgPSAwIDsgbCA8IGxsLmxlbmd0aCA7ICsrbCApIHtcclxuICAgICAgICBsaW5lcyA9IGxsW2xdXHJcbiAgICAgICAgZm9yICggbGkgPSAwIDsgbGkgPCBsaW5lcy5sZW5ndGggOyArK2xpICkge1xyXG4gICAgICAgICAgICBsaW5lID0gbGluZXNbbGldXHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbyhsaW5lWzBdLGxpbmVbMV0pO1xyXG4gICAgICAgICAgICBmb3IgKHAgPSAyIDsgcCA8IGxpbmUubGVuZ3RoIC0gMSA7IHAgPSBwICsgMikge1xyXG4gICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhsaW5lW3BdLGxpbmVbcCsxXSk7ICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCBsaW5lW2xpbmUubGVuZ3RoLTFdID09IFwiY1wiKVxyXG4gICAgICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpXHJcbiAgICAgICAgICAgICAgICB0aGlzW2NsXShjdHgpOyBcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbkdMVG9vbHMucHJvdG90eXBlLkxvYWRDYW52YXNBc1RleHR1cmUgPSBmdW5jdGlvbiAgKCBnbCAsIGluVXJsICwgaW5DYWxsYmFjayApIHtcclxuICAgIHZhciB0ZXggICAgID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgdGV4LmlzTG9hZCAgPSBmYWxzZTsgXHJcbiAgICB0ZXguZXJyb3IgICA9IGZhbHNlO1xyXG4gICAgdGV4LnJlcSAgICAgPSAkLmFqYXgoe1xyXG4gICAgICAgIHR5cGUgICAgIDogXCJHRVRcIixcclxuICAgICAgICB1cmwgICAgICA6IGluVXJsLFxyXG4gICAgICAgIGRhdGFUeXBlIDogXCJqc29uXCIsICBcclxuICAgICAgICBzdWNjZXNzICA6IGZ1bmN0aW9uKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgIHRleC5zdmdSZW5kZXJlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcbiAgICAgICAgICAgIHRleC5zdmdSZW5kZXJlci5oZWlnaHQgPSAyNTY7XHJcbiAgICAgICAgICAgIHRleC5zdmdSZW5kZXJlci53aWR0aCAgPSAyNTY7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCBpID0gMCA7IGkgPCBkYXRhW1wibFwiXS5sZW5ndGggOyArK2kgKSB7XHJcbiAgICAgICAgICAgICAgICBSZW5kZXJMYXllciAgKCAgdGV4LnN2Z1JlbmRlcmVyLmdldENvbnRleHQoXCIyZFwiKSAsIGRhdGFbXCJsXCJdW2ldIClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9jYW52Zyh0ZXguc3ZnUmVuZGVyZXIsIGRhdGEpO1xyXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0cnVlKTtcclxuICAgICAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCB0ZXguc3ZnUmVuZGVyZXIpO1xyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICAgICAgICAgIHRleC5pc0xvYWQgICAgPSB0cnVlO1xyXG4gICAgICAgICAgICB0ZXguRXJyb3IgICAgID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGluQ2FsbGJhY2soKSA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICB0ZXguaXNMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGV4LmVycm9yICA9IHRydWU7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nICggaW5VcmwgKyBcIiA6IGxvYWRpbmcgZmFpbGVkIDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgICAgICAgIGluQ2FsbGJhY2sgKHt9LHt9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTsgICAgXHJcbiAgICByZXR1cm4gdGV4XHJcbn1cclxuXHJcbkdMVG9vbHMucHJvdG90eXBlLkxvYWRTdmdBc1RleHR1cmUgPSBmdW5jdGlvbiAgKCBnbCAsIGluVXJsICwgaW5DYWxsYmFjayApIHtcclxuICAgIC8qdmFyIHRleCAgICAgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgIHRleC5pc0xvYWQgID0gZmFsc2U7IFxyXG4gICAgICB0ZXguZXJyb3IgICA9IGZhbHNlO1xyXG4gICAgICB0ZXgucmVxICAgICA9ICQuYWpheCh7XHJcbiAgICAgICAgIHR5cGUgICAgIDogXCJHRVRcIixcclxuICAgICAgICAgdXJsICAgICAgOiBpblVybCxcclxuICAgICAgICAgZGF0YVR5cGUgOiBcInRleHRcIiwgIFxyXG4gICAgICAgICBzdWNjZXNzICA6IGZ1bmN0aW9uKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgIHRleC5zdmdSZW5kZXJlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcbiAgICAgICAgICAgIGNhbnZnKHRleC5zdmdSZW5kZXJlciwgZGF0YVxyXG4gICAgICAgICAgICAgICAvLyx7XHJcbiAgICAgICAgICAgICAgIC8vICAgaWdub3JlTW91c2UgICAgICAgOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAvLyAgIGlnbm9yZUFuaW1hdGlvbiAgIDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgLy8gICBpZ25vcmVEaW1lbnNpb25zICA6IHRydWUsXHJcbiAgICAgICAgICAgICAgIC8vICAgcmVuZGVyQ2FsbGJhY2sgICAgOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgLy8gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgICAgICAgICAvLyAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAvLyAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgdGV4LnN2Z1JlbmRlcmVyKTtcclxuICAgICAgICAgICAgICAgLy8gICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgICAgICAgICAgIC8vICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgICAgICAgICAvLyAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAvLyAgICAgIHRleC5pc0xvYWQgICAgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAvLyAgICAgIHRleC5FcnJvciAgICAgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgLy8gICAgICBpbkNhbGxiYWNrKCkgO1xyXG4gICAgICAgICAgICAgICAvLyAgIH1cclxuICAgICAgICAgICAgICAgLy8vXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleCk7XHJcbiAgICAgICAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIHRleC5zdmdSZW5kZXJlcik7XHJcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgICAgICAgICAgdGV4LmlzTG9hZCAgICA9IHRydWU7XHJcbiAgICAgICAgICAgIHRleC5FcnJvciAgICAgPSBmYWxzZTtcclxuICAgICAgICAgICAgaW5DYWxsYmFjaygpIDtcclxuICAgICAgICAgfSxcclxuICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgc2hhZGVyLmlzTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHNoYWRlci5lcnJvciAgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyAoIGluVXJsICsgXCIgOiBsb2FkaW5nIGZhaWxlZCA6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgICAgICBpbkNhbGxiYWNrICh7fSx7fSk7XHJcbiAgICAgICAgIH1cclxuICAgICAgfSk7ICAgICovXHJcbiAgICB2YXIgdGV4ICAgICA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIHRleC5pc0xvYWQgID0gZmFsc2U7IFxyXG4gICAgdGV4LmVycm9yICAgPSBmYWxzZTtcclxuICAgIHZhciBpbWcgICAgID0gbmV3IEltYWdlO1xyXG4gICAgdGV4LnJlcSAgICAgPSAkLmFqYXgoe1xyXG4gICAgICAgIHR5cGUgICAgIDogXCJHRVRcIixcclxuICAgICAgICB1cmwgICAgICA6IGluVXJsLFxyXG4gICAgICAgIGRhdGFUeXBlIDogXCJ0ZXh0XCIsICBcclxuICAgICAgICBzdWNjZXNzICA6IGZ1bmN0aW9uKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgdGV4LnN2Z1JlbmRlcmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuICAgICAgICAgICAgICAgIHZhciBjdHggPSB0ZXguc3ZnUmVuZGVyZXIuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLDAsMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4KTtcclxuICAgICAgICAgICAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCB0ZXguc3ZnUmVuZGVyZXIpO1xyXG4gICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICB0ZXguaXNMb2FkICAgID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRleC5FcnJvciAgICAgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGluQ2FsbGJhY2soKSA7ICBcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLnNyYyAgICA9IFwiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxcIitidG9hKGRhdGEpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgc2hhZGVyLmlzTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHNoYWRlci5lcnJvciAgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyAoIGluVXJsICsgXCIgOiBsb2FkaW5nIGZhaWxlZCA6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgICAgICBpbkNhbGxiYWNrICh7fSx7fSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGV4XHJcbn1cclxuXHJcbkdMVG9vbHMucHJvdG90eXBlLkNyZWF0ZUZyYW1lQnVmZmVyVGV4ID0gZnVuY3Rpb24gICggZ2wgLCBzaXplWCwgc2l6ZVkgLCBsaW5lYXIgLyosIHVzZUZsb2F0Ki8pIHtcclxuICAgIGxpbmVhciA9IHR5cGVvZiBsaW5lYXIgIT09ICd1bmRlZmluZWQnID8gbGluZWFyIDogZmFsc2U7XHJcbiAgICAvL3VzZUZsb2F0ID0gdHlwZW9mIHVzZUZsb2F0ICE9PSAndW5kZWZpbmVkJyA/IHVzZUZsb2F0IDogZmFsc2U7XHJcblxyXG4gICAgdmFyIGZiICAgICAgICAgICAgICAgICAgICAgICAgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgdmFyIHRleCAgICAgICAgICAgICAgICAgICAgICAgPSBnbC5jcmVhdGVUZXh0dXJlKCk7IFxyXG5cclxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAgICAgICAgICAgICggZ2wuRlJBTUVCVUZGRVIsIGZiKTtcclxuICAgIGZiLndpZHRoICAgICAgICAgICAgICAgICAgICAgID0gc2l6ZVg7XHJcbiAgICBmYi5oZWlnaHQgICAgICAgICAgICAgICAgICAgICA9IHNpemVZO1xyXG5cclxuICAgIGdsLmJpbmRUZXh0dXJlICAgICAgICAgICAgICAgICggZ2wuVEVYVFVSRV8yRCwgdGV4ICk7XHJcbiAgICBpZiAobGluZWFyKSB7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaSAgICAgICAgICAgICAgKCBnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUiApO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkgICAgICAgICAgICAgICggZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIgKTtcclxuICAgIH1lbHNlIHtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpICAgICAgICAgICAgICAoIGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCApO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkgICAgICAgICAgICAgICggZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUICk7XHJcbiAgICB9XHJcbiAgICAvL2lmICghIHVzZUZsb2F0ICkge1xyXG4gICAgZ2wudGV4SW1hZ2UyRCAgICAgICAgICAgICAgICAgKCBnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBmYi53aWR0aCwgZmIuaGVpZ2h0LCAwLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBudWxsICk7XHJcbiAgICAvKn1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgIGdsLnRleEltYWdlMkQgICAgICAgICAgICAgICAgICggZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZmIud2lkdGgsIGZiLmhlaWdodCwgMCwgZ2wuUkdCQSwgZ2wuRkxPQVQsIG51bGwgKTtcclxuICAgICAgfSovXHJcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRCAgICAgICAoIGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGV4LCAwICk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZSAgICAgICAgICAgICAgICAoIGdsLlRFWFRVUkVfMkQsIG51bGwgKTtcclxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlciAgICAgICAgICAgICggZ2wuRlJBTUVCVUZGRVIsIG51bGwgKTtcclxuXHJcbiAgICByZXR1cm4gW2ZiLHRleF07XHJcbn1cclxuXHJcbkdMVG9vbHMucHJvdG90eXBlLkJ1aWxkU2hhZGVyID0gZnVuY3Rpb24gICggZ2wgLCBpblNoYWRlciApIHtcclxuICAgIHZhciBzaGFkZXIgICAgICAgID0gbmV3IE9iamVjdCAoICk7XHJcbiAgICBzaGFkZXIuZXJyb3IgICAgICA9IGZhbHNlO1xyXG4gICAgc2hhZGVyLm9iaiAgICAgICAgPSBudWxsO1xyXG4gICAgc2hhZGVyLmF0dHJpYnV0ZXMgPSBpblNoYWRlci5hdHRyaWJ1dGVzO1xyXG4gICAgc2hhZGVyLnBhcmFtZXRlcnMgPSBpblNoYWRlci5wYXJhbWV0ZXJzO1xyXG5cclxuICAgIGlmIChpblNoYWRlci50eXBlID09IFwieC1zaGFkZXIveC1mcmFnbWVudFwiKSB7XHJcbiAgICAgICAgc2hhZGVyLm9iaiA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xyXG4gICAgfSBlbHNlIGlmIChpblNoYWRlci50eXBlID09IFwieC1zaGFkZXIveC12ZXJ0ZXhcIikge1xyXG4gICAgICAgIHNoYWRlci5vYmogPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNoYWRlci5lcnJvciAgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBnbC5zaGFkZXJTb3VyY2UgICAoIHNoYWRlci5vYmosIGluU2hhZGVyLmNvZGUgKTtcclxuICAgIGdsLmNvbXBpbGVTaGFkZXIgICggc2hhZGVyLm9iaiApO1xyXG4gICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLm9iaiwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XHJcbiAgICAgICAgc2hhZGVyLmVycm9yICA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2cgKCBcIkJ1aWxkIFwiICsgaW5TaGFkZXIubmFtZSArIFwiIDogRmFpbGVkICEgXCIgKTtcclxuICAgICAgICBjb25zb2xlLmxvZyAoZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIub2JqKSk7ICAgICAgICAgICAgXHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2hhZGVyO1xyXG59XHJcblxyXG5HTFRvb2xzLnByb3RvdHlwZS5NYWtlUHJvZ3JhbSA9IGZ1bmN0aW9uICggaW5WZXJ0ZXhOYW1lICwgaW5GcmFnbWVudE5hbWUgLCBpbkFzc2V0cyApIHtcclxuICAgIGlmICghIGluQXNzZXRzLnNoYWRlckRhdGEgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2cgKCBcImludmFsaWQgc2hhZGVyIGRhdGFcIiApO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgaWYgKCAhICggaW5WZXJ0ZXhOYW1lIGluIGluQXNzZXRzLnNoYWRlckRhdGEgKSApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyAoIGluVmVydGV4TmFtZSArIFwiIG5vdCBpbiBzaGFkZXIgZGF0YVwiICk7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAoICEgKCBpbkZyYWdtZW50TmFtZSBpbiBpbkFzc2V0cy5zaGFkZXJEYXRhICkgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2cgKCBpbkZyYWdtZW50TmFtZSArIFwiIG5vdCBpbiBzaGFkZXIgZGF0YVwiICk7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICB2YXIgdmVydCAgICAgICAgICAgICA9IGluQXNzZXRzLnNoYWRlckRhdGFbaW5WZXJ0ZXhOYW1lXTtcclxuICAgIHZlcnQubmFtZSAgICAgICAgICAgID0gaW5WZXJ0ZXhOYW1lXHJcbiAgICB2YXIgZnJhZyAgICAgICAgICAgICA9IGluQXNzZXRzLnNoYWRlckRhdGFbaW5GcmFnbWVudE5hbWVdO1xyXG4gICAgZnJhZy5uYW1lICAgICAgICAgICAgPSBpbkZyYWdtZW50TmFtZVxyXG5cclxuICAgIHZhciBnbCAgICAgICAgICAgICAgID0gaW5Bc3NldHMuY3R4O1xyXG4gICAgdmFyIHZlcnRPYmogICAgICAgICAgPSB0aGlzLkJ1aWxkU2hhZGVyKGdsLHZlcnQpO1xyXG4gICAgdmFyIGZyYWdPYmogICAgICAgICAgPSB0aGlzLkJ1aWxkU2hhZGVyKGdsLGZyYWcpO1xyXG5cclxuICAgIGlmICggdmVydE9iai5lcnJvciB8fCBmcmFnT2JqLmVycm9yICkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgdmFyIHNoYWRlclByb2dyYW0gICAgPSBnbC5jcmVhdGVQcm9ncmFtKCk7XHJcbiAgICBzaGFkZXJQcm9ncmFtLmVycm9yICA9IGZhbHNlO1xyXG4gICAgc2hhZGVyUHJvZ3JhbS5hdHRyICAgPSB7fTtcclxuICAgIHNoYWRlclByb2dyYW0ucGFyYW1zID0ge307XHJcbiAgICB2YXIgYXR0cmlidXRlcyAgICAgICA9IHt9O1xyXG4gICAgdmFyIHBhcmFtZXRlcnMgICAgICAgPSB7fTtcclxuXHJcbiAgICBqUXVlcnkuZXh0ZW5kKCBhdHRyaWJ1dGVzLCB2ZXJ0T2JqLmF0dHJpYnV0ZXMgKTtcclxuICAgIGpRdWVyeS5leHRlbmQoIHBhcmFtZXRlcnMsIHZlcnRPYmoucGFyYW1ldGVycyApO1xyXG4gICAgalF1ZXJ5LmV4dGVuZCggYXR0cmlidXRlcywgZnJhZ09iai5hdHRyaWJ1dGVzICk7XHJcbiAgICBqUXVlcnkuZXh0ZW5kKCBwYXJhbWV0ZXJzLCBmcmFnT2JqLnBhcmFtZXRlcnMgKTtcclxuXHJcbiAgICBnbC5hdHRhY2hTaGFkZXIoIHNoYWRlclByb2dyYW0gLCB2ZXJ0T2JqLm9iaiApO1xyXG4gICAgZ2wuYXR0YWNoU2hhZGVyKCBzaGFkZXJQcm9ncmFtICwgZnJhZ09iai5vYmopO1xyXG4gICAgZ2wubGlua1Byb2dyYW0gKCBzaGFkZXJQcm9ncmFtICk7XHJcbiAgICBpZiAoISBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHNoYWRlclByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nICggXCJDb3VsZCBub3QgbGluayBwcm9ncmFtbSB3aXRoIFwiICtpblZlcnRleE5hbWUgKyBcIiBhbmQgXCIgKyBpbkZyYWdtZW50TmFtZSk7XHJcbiAgICAgICAgc2hhZGVyUHJvZ3JhbS5lcnJvciAgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBnbC51c2VQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xyXG4gICAgZm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcclxuICAgICAgICBzaGFkZXJQcm9ncmFtLmF0dHJba2V5XSAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKCBzaGFkZXJQcm9ncmFtLCBhdHRyaWJ1dGVzW2tleV0gKTsgXHJcbiAgICB9XHJcbiAgICBmb3IgKHZhciBrZXkgaW4gcGFyYW1ldGVycykge1xyXG4gICAgICAgIHNoYWRlclByb2dyYW0ucGFyYW1zW2tleV0gPSB7fVxyXG4gICAgICAgIHNoYWRlclByb2dyYW0ucGFyYW1zW2tleV1bXCJuYW1lXCJdID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIHBhcmFtZXRlcnNba2V5XVswXSk7XHJcbiAgICAgICAgc2hhZGVyUHJvZ3JhbS5wYXJhbXNba2V5XVtcImZjdFwiXSAgPSBwYXJhbWV0ZXJzW2tleV1bMV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2hhZGVyUHJvZ3JhbTtcclxufVxyXG5cclxuR0xUb29scy5wcm90b3R5cGUuTG9hZFRleHR1cmUgPSBmdW5jdGlvbiAgKGdsICwgdXJsICwgY2FsbGJhY2spIHtcclxuICAgIC8qXHJcbiAgICAgIHZhciB0ZXggICAgID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICB0ZXguaXNMb2FkICA9IGZhbHNlOyBcclxuICAgICAgdGV4LmltYWdlICAgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgdGV4LmltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4KTtcclxuICAgICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XHJcbiAgICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgdGV4LmltYWdlKTtcclxuICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgICB0ZXguaXNMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgZGVsZXRlIHRleC5pbWFnZTtcclxuICAgICAgICAgY2FsbGJhY2soKSA7IFxyXG4gICAgICB9XHJcblxyXG4gICAgICB0ZXguaW1hZ2Uuc3JjID0gdXJsO1xyXG4gICAgICByZXR1cm4gdGV4O1xyXG4gICAgICovXHJcbiAgICB2YXIgdGV4ICAgICA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIHRleC5pc0xvYWQgID0gZmFsc2U7IFxyXG4gICAgdGV4LmVycm9yICAgPSBmYWxzZTtcclxuICAgIHZhciAgIGltZyAgID0gbmV3IEltYWdlKCk7XHJcbiAgICBpbWcub25sb2FkICA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xyXG4gICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1nKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgIHRleC5pc0xvYWQgPSB0cnVlO1xyXG4gICAgICAgIGRlbGV0ZSBpbWc7XHJcbiAgICAgICAgY2FsbGJhY2soKSA7IFxyXG4gICAgfTtcclxuICAgIGltZy5vbmVycm9yID0gIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0ZXguaXNMb2FkID0gdHJ1ZTtcclxuICAgICAgICB0ZXguZXJyb3IgID0gdHJ1ZTtcclxuICAgICAgICBkZWxldGUgaW1nO1xyXG4gICAgfTtcclxuICAgIGltZy5vbmFib3J0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRleC5pc0xvYWQgPSB0cnVlO1xyXG4gICAgICAgIHRleC5lcnJvciAgPSB0cnVlO1xyXG4gICAgICAgIGRlbGV0ZSBpbWc7XHJcbiAgICB9O1xyXG5cclxuICAgIGltZy5zcmMgPSB1cmw7XHJcbiAgICByZXR1cm4gdGV4O1xyXG59XHJcblxyXG5cclxuR0xUb29scy5wcm90b3R5cGUuTG9hZENzdlRleHR1cmUgPSBmdW5jdGlvbiAoZ2wgLCB1cmwgLCBjYWxsYmFjaykge1xyXG4gICAgLypcclxuICAgICAgdmFyIHRleCAgICAgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgIHRleC5pc0xvYWQgID0gZmFsc2U7IFxyXG4gICAgICB0ZXguaW1hZ2UgICA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICB0ZXguaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0cnVlKTtcclxuICAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCB0ZXguaW1hZ2UpO1xyXG4gICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICAgICAgIHRleC5pc0xvYWQgPSB0cnVlO1xyXG4gICAgICAgICBkZWxldGUgdGV4LmltYWdlO1xyXG4gICAgICAgICBjYWxsYmFjaygpIDsgXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRleC5pbWFnZS5zcmMgPSB1cmw7XHJcbiAgICAgIHJldHVybiB0ZXg7XHJcbiAgICAgKi9cclxuXHJcbiAgICB2YXIgc3ZnUmVuZGVyZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xyXG4gICAgY2FudmcodGhpcy5zdmdSZW5kZXJlciwgJ3Rlc3QvYXV2LnN2ZycpO1xyXG4gICAgdmFyIHRleCAgICAgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICB0ZXguaXNMb2FkICA9IGZhbHNlOyBcclxuICAgIHRleC5lcnJvciAgID0gZmFsc2U7XHJcbiAgICB2YXIgICBpbWcgICA9IG5ldyBJbWFnZSgpO1xyXG4gICAgaW1nLm9ubG9hZCAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4KTtcclxuICAgICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0cnVlKTtcclxuICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltZyk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgICAgICB0ZXguaXNMb2FkID0gdHJ1ZTtcclxuICAgICAgICBkZWxldGUgaW1nO1xyXG4gICAgICAgIGNhbGxiYWNrKCkgOyBcclxuICAgIH07XHJcbiAgICBpbWcub25lcnJvciA9ICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGV4LmlzTG9hZCA9IHRydWU7XHJcbiAgICAgICAgdGV4LmVycm9yICA9IHRydWU7XHJcbiAgICAgICAgZGVsZXRlIGltZztcclxuICAgIH07XHJcbiAgICBpbWcub25hYm9ydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0ZXguaXNMb2FkID0gdHJ1ZTtcclxuICAgICAgICB0ZXguZXJyb3IgID0gdHJ1ZTtcclxuICAgICAgICBkZWxldGUgaW1nO1xyXG4gICAgfTtcclxuXHJcbiAgICBpbWcuc3JjID0gdXJsO1xyXG4gICAgcmV0dXJuIHRleDtcclxufVxyXG5cclxuXHJcbkdMVG9vbHMucHJvdG90eXBlLkxvYWREYXRhID0gZnVuY3Rpb24gKGdsLCBpblVybCApIHtcclxuICAgIHZhciB0ZXggICAgID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgdGV4LmlzTG9hZCAgPSBmYWxzZTtcclxuICAgIHRleC5lcnJvciAgID0gZmFsc2U7XHJcblxyXG4gICAgdGV4LnJlcSA9ICQuYWpheCh7XHJcbiAgICAgICAgdHlwZSAgICAgOiBcIkdFVFwiLFxyXG4gICAgICAgIHVybCAgICAgIDogaW5VcmwsXHJcbiAgICAgICAgZGF0YVR5cGUgOiBcImpzb25cIiwgIFxyXG4gICAgICAgIHN1Y2Nlc3MgIDogZnVuY3Rpb24oZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcclxuICAgICAgICAgICAgdGV4LmlzTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRleC5lcnJvciAgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleCk7XHJcbiAgICAgICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2xbZGF0YS5pbnB1dF90eXBlXSwgZGF0YS53aWR0aCAsIGRhdGEuaGVpZ2h0LCAwLCBnbFtkYXRhLm91dHB1dF90eXBlXSwgZ2wuVU5TSUdORURfQllURSwgbmV3IFVpbnQ4QXJyYXkoZGF0YS5kYXRhKSk7XHJcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgdGV4LmlzTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRleC5lcnJvciAgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyAoIGluVXJsICsgXCIgOiBsb2FkaW5nIGZhaWxlZCA6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHRleC5zcmMgPSBpblVybDtcclxuICAgIHJldHVybiB0ZXg7ICAgXHJcbn1cclxuXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdMVG9vbHM7XHJcbiIsIlxyXG52YXIgRm9udEZhbWlseSA9IGZ1bmN0aW9uICgpIHtcclxuICAgdmFyIHN0eWxlcyA9IHt9LCBtYXBwaW5nID0ge1xyXG4gICAgICBvYmxpcXVlOiAnaXRhbGljJyxcclxuICAgICAgaXRhbGljOiAnb2JsaXF1ZSdcclxuICAgfTtcclxuICAgdGhpcy5hZGQgPSBmdW5jdGlvbihmb250KSB7XHJcbiAgICAgIChzdHlsZXNbZm9udC5zdHlsZV0gfHwgKHN0eWxlc1tmb250LnN0eWxlXSA9IHt9KSlbZm9udC53ZWlnaHRdID0gZm9udDtcclxuICAgfTtcclxuICAgdGhpcy5nZXQgPSBmdW5jdGlvbihzdHlsZSwgd2VpZ2h0KSB7XHJcbiAgICAgIGlmKHR5cGVvZihzdHlsZSk9PT0ndW5kZWZpbmVkJykgIHN0eWxlICA9ICdub3JtYWwnO1xyXG4gICAgICBpZih0eXBlb2Yod2VpZ2h0KT09PSd1bmRlZmluZWQnKSB3ZWlnaHQgPSAnbm9ybWFsJztcclxuICAgICAgdmFyIHdlaWdodHMgPSBzdHlsZXNbc3R5bGVdIHx8IHN0eWxlc1ttYXBwaW5nW3N0eWxlXV1cclxuICAgICAgICAgfHwgc3R5bGVzLm5vcm1hbCB8fCBzdHlsZXMuaXRhbGljIHx8IHN0eWxlcy5vYmxpcXVlO1xyXG4gICAgICBpZiAoIXdlaWdodHMpIHJldHVybiBudWxsO1xyXG4gICAgICAvLyB3ZSBkb24ndCBoYXZlIHRvIHdvcnJ5IGFib3V0IFwiYm9sZGVyXCIgYW5kIFwibGlnaHRlclwiXHJcbiAgICAgIC8vIGJlY2F1c2UgSUUncyBjdXJyZW50U3R5bGUgcmV0dXJucyBhIG51bWVyaWMgdmFsdWUgZm9yIGl0LFxyXG4gICAgICAvLyBhbmQgb3RoZXIgYnJvd3NlcnMgdXNlIHRoZSBjb21wdXRlZCB2YWx1ZSBhbnl3YXlcclxuICAgICAgd2VpZ2h0ID0ge1xyXG4gICAgICAgICBub3JtYWw6IDQwMCxcclxuICAgICAgICAgYm9sZDogNzAwXHJcbiAgICAgIH1bd2VpZ2h0XSB8fCBwYXJzZUludCh3ZWlnaHQsIDEwKTtcclxuICAgICAgaWYgKHdlaWdodHNbd2VpZ2h0XSkgcmV0dXJuIHdlaWdodHNbd2VpZ2h0XTtcclxuICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvZm9udHMuaHRtbCNwcm9wZGVmLWZvbnQtd2VpZ2h0XHJcbiAgICAgIC8vIEdlY2tvIHVzZXMgeDk5L3gwMSBmb3IgbGlnaHRlci9ib2xkZXJcclxuICAgICAgdmFyIHVwID0ge1xyXG4gICAgICAgICAxOiAxLFxyXG4gICAgICAgICA5OTogMFxyXG4gICAgICB9W3dlaWdodCAlIDEwMF0sIGFsdHMgPSBbXSwgbWluLCBtYXg7XHJcbiAgICAgIGlmICh1cCA9PT0gdW5kZWZpbmVkKSB1cCA9IHdlaWdodCA+IDQwMDtcclxuICAgICAgaWYgKHdlaWdodCA9PSA1MDApIHdlaWdodCA9IDQwMDtcclxuICAgICAgZm9yICh2YXIgYWx0IGluIHdlaWdodHMpIHtcclxuICAgICAgICAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh3ZWlnaHRzLCBhbHQpKSBjb250aW51ZTtcclxuICAgICAgICAgYWx0ID0gcGFyc2VJbnQoYWx0LCAxMCk7XHJcbiAgICAgICAgIGlmICghbWluIHx8IGFsdCA8IG1pbikgbWluID0gYWx0O1xyXG4gICAgICAgICBpZiAoIW1heCB8fCBhbHQgPiBtYXgpIG1heCA9IGFsdDtcclxuICAgICAgICAgYWx0cy5wdXNoKGFsdCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHdlaWdodCA8IG1pbikgd2VpZ2h0ID0gbWluO1xyXG4gICAgICBpZiAod2VpZ2h0ID4gbWF4KSB3ZWlnaHQgPSBtYXg7XHJcbiAgICAgIGFsdHMuc29ydChmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgIHJldHVybiAodXBcclxuICAgICAgICAgICAgPyAoYSA+PSB3ZWlnaHQgJiYgYiA+PSB3ZWlnaHQpID8gYSA8IGIgOiBhID4gYlxyXG4gICAgICAgICAgICA6IChhIDw9IHdlaWdodCAmJiBiIDw9IHdlaWdodCkgPyBhID4gYiA6IGEgPCBiKSA/IC0xIDogMTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiB3ZWlnaHRzW2FsdHNbMF1dO1xyXG4gICB9O1xyXG59XHJcblxyXG52YXIgZ2xvYmFsRm9udHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgIHZhciBfX2dmID0ge307XHJcbiAgIF9fZ2YuZCAgID0ge307XHJcbiAgIF9fZ2YuQWRkID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG4gICAgICBpZiAoIWRhdGEpIHJldHVybiBhcGk7XHJcblx0XHR2YXIgZm9udCA9IG5ldyBGb250KGRhdGEpXHJcbiAgICAgIHZhciBmYW1pbHkgPSBmb250LmZhbWlseTtcclxuXHRcdGlmICghX19nZi5kW2ZhbWlseV0pIF9fZ2YuZFtmYW1pbHldID0gbmV3IEZvbnRGYW1pbHkoKTtcclxuXHRcdF9fZ2YuZFtmYW1pbHldLmFkZChmb250KTtcclxuXHRcdHJldHVybiBfX2dmO1xyXG4gICB9XHJcbiAgIFxyXG4gICBfX2dmLkdldCA9IGZ1bmN0aW9uICggbmFtZSwgc3R5bGUsIHdlaWdodCApIHtcclxuICAgICAgaWYgKCAhIF9fZ2YuZFtuYW1lXSApIFxyXG4gICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgICByZXR1cm4gX19nZi5kW25hbWVdLmdldCAoIHN0eWxlLCB3ZWlnaHQpXHJcbiAgIH1cclxuICAgXHJcbiAgIHJldHVybiBfX2dmO1xyXG59KCk7XHJcblxyXG5mdW5jdGlvbiBGcm9tUG9pbnQgKCBwICkge1xyXG4gICBpZiAocC5sZW5ndGggIT0gMikge1xyXG4gICAgICBjb25zb2xlLmxvZyAoXCJJbnZhbGlkIFBvaW50XCIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgIH1cclxuICAgdGhpcy5wICAgICA9IHA7XHJcbiAgIHRoaXMuYWNjICAgPSAwO1xyXG59XHJcblxyXG5Gcm9tUG9pbnQucHJvdG90eXBlLlJlc2V0ID0gZnVuY3Rpb24gKCAgKSB7XHJcbiAgIHRoaXMuYWNjICAgPSAwO1xyXG59XHJcblxyXG5Gcm9tUG9pbnQucHJvdG90eXBlLklzVmFsaWQgPSBmdW5jdGlvbiAoICApIHtcclxuICAgcmV0dXJuICEgKHRoaXMucCA9PT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuRnJvbVBvaW50LnByb3RvdHlwZS5BZHZhbmNlID0gZnVuY3Rpb24gKCBjcyApIHtcclxuICAgdmFyIG9hY2MgPSB0aGlzLmFjY1xyXG4gICB0aGlzLmFjYyA9IHRoaXMuYWNjICsgY3M7ICAgICAgICAvLyBuZXh0XHJcbiAgIHJldHVybiBbIHRoaXMucFswXSArIG9hY2MgLCB0aGlzLnBbMV0gLCAwLjBdXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEZvbGxvd0xpbmUgKGwpIHtcclxuICAgaWYgKGwubGVuZ3RoIDwgNCkge1xyXG4gICAgICBjb25zb2xlLmxvZyAoXCJJbnZhbGlkIGxpbmVcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgfVxyXG4gICB0aGlzLmwgICAgID0gbDtcclxuICAgdGhpcy5hY2MgICA9IDA7XHJcbiAgIHRoaXMucGkgICAgPSAwO1xyXG59XHJcblxyXG5Gb2xsb3dMaW5lLnByb3RvdHlwZS5SZXNldCA9IGZ1bmN0aW9uICggICkge1xyXG4gICB0aGlzLmFjYyAgID0gMDtcclxuICAgdGhpcy5waSAgICA9IDA7XHJcbn1cclxuXHJcbkZvbGxvd0xpbmUucHJvdG90eXBlLklzVmFsaWQgPSBmdW5jdGlvbiAoICApIHtcclxuICAgcmV0dXJuICEgKHRoaXMubCA9PT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuRm9sbG93TGluZS5wcm90b3R5cGUuQWR2YW5jZSA9IGZ1bmN0aW9uICggY3MgKSB7XHJcbiAgIGlmICggdGhpcy5waSArIDMgPj0gdGhpcy5sLmxlbmd0aCApXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICBcclxuICAgdmFyIHAgICAgICAgPSBbIHRoaXMubFt0aGlzLnBpXSAgICAgLCB0aGlzLmxbdGhpcy5waSArIDFdIF07XHJcbiAgIHZhciBwbmV4dCAgID0gWyB0aGlzLmxbdGhpcy5waSArIDJdICwgdGhpcy5sW3RoaXMucGkgKyAzXSBdO1xyXG4gICB2YXIgdiAgICAgICA9IFsgcG5leHRbMF0gLSBwWzBdICAgICAsIHBuZXh0WzFdIC0gcFsxXSBdXHJcbiAgIHZhciBuICAgICAgID0gTWF0aC5zcXJ0ICggdlswXSAqIHZbMF0gKyB2WzFdICogdlsxXSApIFxyXG4gICB2YXIgdm4gICAgICA9IFsgdlswXSAvIG4gLCB2WzFdIC8gbiBdXHJcbiAgIHZhciBWb24gICAgID0gWyB2blsxXSAgICAsIC12blswXSAgIF1cclxuICAgdmFyIG5hY2MgICAgPSB0aGlzLmFjYyArIGNzOyAgICAgICAgLy8gbmV4dFxyXG4gICB2YXIgbWFjYyAgICA9IHRoaXMuYWNjICsgY3MgLyAyLjAgOyAvLyBtaWRkbGVcclxuICAgdmFyIHAwICAgICAgPSBbIHBbMF0gKyB2blswXSAqIHRoaXMuYWNjICwgcFsxXSArIHZuWzFdICogdGhpcy5hY2NdXHJcbiAgIHZhciBwbSAgICAgID0gWyBwWzBdICsgdm5bMF0gKiBtYWNjICAgICAsIHBbMV0gKyB2blsxXSAqIG1hY2NdXHJcbiAgIHZhciBzaGlmdCAgID0gWzAsMF1cclxuICAgXHJcbiAgIGludFBvaW50cyAgID0gW11cclxuICAgaWYgKCBuYWNjID4gbiApIHtcclxuICAgICAgd2hpbGUgKG5hY2MgPiBuKSB7XHJcbiAgICAgICAgIHRoaXMucGkgID0gdGhpcy5waSArIDJcclxuICAgICAgICAgaWYgKCB0aGlzLnBpICsgMyA8IHRoaXMubC5sZW5ndGggKSB7XHJcbiAgICAgICAgICAgIG5hY2MgICAgICAgID0gbmFjYyAtIG47XHJcbiAgICAgICAgICAgIHAgICAgICAgICAgID0gWyB0aGlzLmxbdGhpcy5waV0gICAgICwgdGhpcy5sW3RoaXMucGkgKyAxXSBdO1xyXG4gICAgICAgICAgICBwbmV4dCAgICAgICA9IFsgdGhpcy5sW3RoaXMucGkgKyAyXSAsIHRoaXMubFt0aGlzLnBpICsgM10gXTtcclxuICAgICAgICAgICAgdiAgICAgICAgICAgPSBbIHBuZXh0WzBdIC0gcFswXSAgICAgLCBwbmV4dFsxXSAtIHBbMV0gXVxyXG4gICAgICAgICAgICBuICAgICAgICAgICA9IE1hdGguc3FydCAoIHZbMF0gKiB2WzBdICsgdlsxXSAqIHZbMV0gKSBcclxuICAgICAgICAgICAgaW50UG9pbnRzLnB1c2ggKCBwWzBdIClcclxuICAgICAgICAgICAgaW50UG9pbnRzLnB1c2ggKCBwWzFdIClcclxuICAgICAgICAgfVxyXG4gICAgICAgICBlbHNlIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIHZuICAgICAgICAgID0gWyB2WzBdIC8gbiAsIHZbMV0gLyBuIF1cclxuICAgICAgdmFyIHAxICAgICAgPSBbIHBbMF0gKyB2blswXSAqIG5hY2MgICwgcFsxXSArIHZuWzFdICogbmFjY11cclxuICAgICAgdmFyIHZ0bXAgICAgPSBbIHAxWzBdIC0gcDBbMF0gLCBwMVsxXSAtIHAwWzFdIF1cclxuICAgICAgdmFyIG50bXAgICAgPSBNYXRoLnNxcnQgKCB2dG1wWzBdICogdnRtcFswXSArIHZ0bXBbMV0gKiB2dG1wWzFdIClcclxuICAgICAgdmFyIHZudG1wICAgPSBbIHZ0bXBbMF0gLyBudG1wICwgdnRtcFsxXSAvIG50bXAgXVxyXG4gICAgICBWb24gICAgICAgICA9IFsgdm50bXBbMV0gICAgLCAtdm50bXBbMF0gXVxyXG4gICAgICAvKiBUZXN0IHNoaWZ0IHdpdGggZGlzdGFuY2UgYmV0d2VlbiBSZWFsIG1pZGRsZSBwb2ludCAocG0yKSAsIGFuZCBiYXNlIG1pZGRsZSBwb2ludCAocG0pXHJcbiAgICAgIHZhciBwbTIgICAgICAgID0gWyBwMFswXSArIHZ0bXBbMF0vMi4wICwgcDBbMV0gKyB2dG1wWzFdLzIuMCBdXHJcbiAgICAgIHZhciB2dG1wMiAgICAgID0gWyBwbVswXSAtIHBtMlswXSAsIHBtWzFdIC0gcG0yWzFdIF1cclxuICAgICAgdmFyIG50bXAyICAgICAgPSBNYXRoLnNxcnQgKCB2dG1wMlswXSAqIHZ0bXAyWzBdICsgdnRtcDJbMV0gKiB2dG1wMlsxXSApXHJcbiAgICAgIHZhciB2bnRtcDIgICAgID0gWyB2dG1wMlswXSAvIG50bXAyICwgdnRtcDJbMV0gLyBudG1wMiBdXHJcbiAgICAgIHZhciBzdG1wICAgICAgID0gKCB2bnRtcDJbMF0gKiBWb25bMF0gKyB2bnRtcDJbMV0gKiBWb25bMV0gKSAqIG50bXAyO1xyXG4gICAgICBzaGlmdCAgICAgICAgICA9IFsgVm9uWzBdICogc3RtcCAsIFZvblsxXSAqIHN0bXAgXTtcclxuICAgICAgKi9cclxuICAgICAgdmFyIHBtMiAgICAgICAgPSBbIHAwWzBdICsgdnRtcFswXS8yLjAgLCBwMFsxXSArIHZ0bXBbMV0vMi4wIF1cclxuICAgICAgdmFyIHNhY2MgICAgICAgPSAwXHJcbiAgICAgIGZvciAoIHZhciBqID0gMCA7IGogPCBpbnRQb2ludHMubGVuZ3RoIDsgais9Mikge1xyXG4gICAgICAgICB2YXIgdnRtcDIgICAgICA9IFsgaW50UG9pbnRzW2pdIC0gcG0yWzBdICwgaW50UG9pbnRzW2orMV0gLSBwbTJbMV0gXVxyXG4gICAgICAgICB2YXIgbnRtcDIgICAgICA9IE1hdGguc3FydCAoIHZ0bXAyWzBdICogdnRtcDJbMF0gKyB2dG1wMlsxXSAqIHZ0bXAyWzFdIClcclxuICAgICAgICAgdmFyIHZudG1wMiAgICAgPSBbIHZ0bXAyWzBdIC8gbnRtcDIgLCB2dG1wMlsxXSAvIG50bXAyIF1cclxuICAgICAgICAgc2FjYyAgICAgICAgICAgKz0gKCB2bnRtcDJbMF0gKiBWb25bMF0gKyB2bnRtcDJbMV0gKiBWb25bMV0gKSAqIG50bXAyO1xyXG4gICAgICB9XHJcbiAgICAgIHNhY2MgICAgICAgICAgICAgIC89IChpbnRQb2ludHMubGVuZ3RoIC8gMi4wKSArIDIuMDtcclxuICAgICAgc2hpZnQgICAgICAgICAgICAgPSBbIFZvblswXSAqIHNhY2MgLCBWb25bMV0gKiBzYWNjIF07XHJcbiAgIH1cclxuICAgXHJcbiAgIHRoaXMuYWNjID0gbmFjY1xyXG4gICB2YXIgYSAgICA9IE1hdGguYWNvcygtVm9uWzFdKTtcclxuICAgaWYgKCBWb25bMF0gPCAwICkgYSA9IC1hIFxyXG4gICAvL2lmICggVm9uWzFdID4gMCApIHsgYSA9IGEgKyBNYXRoLlBJIH1cclxuICAgXHJcbiAgIHJldHVybiBbcDBbMF0rc2hpZnRbMF0scDBbMV0rc2hpZnRbMV0sYV1cclxufVxyXG5cclxuZnVuY3Rpb24gVGV4dE9uTGluZSAoIGN0eCwgbCwgdHh0ICwgZmlsbCkge1xyXG4gICB2YXIgZmwgPSBuZXcgRm9sbG93TGluZSAobClcclxuICAgaWYgKCAhIGZsLklzVmFsaWQoKSlcclxuICAgICAgcmV0dXJuXHJcbiAgICAgIFxyXG4gICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgIFxyXG4gICBmb3IgKGkgaW4gdHh0KSB7XHJcbiAgICAgIHZhciBjICA9IHR4dFtpXTtcclxuICAgICAgdmFyIGNzID0gY3R4Lm1lYXN1cmVUZXh0KGMpLndpZHRoXHJcbiAgICAgIHZhciB0ciA9IGZsLkFkdmFuY2UgKCBjcyApXHJcbiAgICAgIGlmICghdHIpIHJldHVyblxyXG4gICAgICBjdHguc2F2ZSggKVxyXG4gICAgICBjdHgudHJhbnNsYXRlICggdHJbMF0gLCB0clsxXSApO1xyXG4gICAgICBjdHgucm90YXRlKHRyWzJdKTtcclxuICAgICAgaWYgKGZpbGwpXHJcbiAgICAgICAgIGN0eC5maWxsVGV4dChjLDAsMCk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICAgY3R4LnN0cm9rZVRleHQoYywwLDApO1xyXG4gICAgICBjdHgucmVzdG9yZSgpXHJcbiAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wZXJ0eSkge1xyXG4gICByZXR1cm4gb2JqLmhhc093blByb3BlcnR5KHByb3BlcnR5KTtcclxufVxyXG5cclxudmFyIEZvbnRTaXplID0gZnVuY3Rpb24odmFsdWUsIGJhc2UpIHtcclxuICAgdGhpcy52YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xyXG4gICB0aGlzLnVuaXQgPSBTdHJpbmcodmFsdWUpLm1hdGNoKC9bYS16JV0qJC8pWzBdIHx8ICdweCc7XHJcblxyXG4gICB0aGlzLmNvbnZlcnQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gdmFsdWUgLyBiYXNlICogdGhpcy52YWx1ZTtcclxuICAgfTtcclxuXHJcbiAgIHRoaXMuY29udmVydEZyb20gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gdmFsdWUgLyB0aGlzLnZhbHVlICogYmFzZTtcclxuICAgfTtcclxuXHJcbiAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMudmFsdWUgKyB0aGlzLnVuaXQ7XHJcbiAgIH07XHJcbn1cclxuXHJcbnZhciBGb250ID0gZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgdmFyIGZhY2UgPSB0aGlzLmZhY2UgPSBkYXRhLmZhY2UsIGxpZ2F0dXJlQ2FjaGUgPSBbXSwgd29yZFNlcGFyYXRvcnMgPSB7XHJcbiAgICAgICdcXHUwMDIwJzogMSxcclxuICAgICAgJ1xcdTAwYTAnOiAxLFxyXG4gICAgICAnXFx1MzAwMCc6IDFcclxuICAgfTtcclxuICAgdGhpcy5nbHlwaHMgPSAoZnVuY3Rpb24oZ2x5cGhzKSB7XHJcbiAgICAgIHZhciBrZXksIGZhbGxiYWNrcyA9IHtcclxuICAgICAgICAgJ1xcdTIwMTEnOiAnXFx1MDAyZCcsXHJcbiAgICAgICAgICdcXHUwMGFkJzogJ1xcdTIwMTEnXHJcbiAgICAgIH07XHJcbiAgICAgIGZvciAoa2V5IGluIGZhbGxiYWNrcykge1xyXG4gICAgICAgICBpZiAoIWhhc093blByb3BlcnR5KGZhbGxiYWNrcywga2V5KSkgY29udGludWU7XHJcbiAgICAgICAgIGlmICghZ2x5cGhzW2tleV0pIGdseXBoc1trZXldID0gZ2x5cGhzW2ZhbGxiYWNrc1trZXldXTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZ2x5cGhzO1xyXG4gICB9KShkYXRhLmdseXBocyk7XHJcblxyXG4gICB0aGlzLncgPSBkYXRhLnc7XHJcbiAgIHRoaXMuYmFzZVNpemUgPSBwYXJzZUludChmYWNlWyd1bml0cy1wZXItZW0nXSwgMTApO1xyXG5cclxuICAgdGhpcy5mYW1pbHkgPSBmYWNlWydmb250LWZhbWlseSddLnRvTG93ZXJDYXNlKCk7XHJcbiAgIHRoaXMud2VpZ2h0ID0gZmFjZVsnZm9udC13ZWlnaHQnXTtcclxuICAgdGhpcy5zdHlsZSA9IGZhY2VbJ2ZvbnQtc3R5bGUnXSB8fCAnbm9ybWFsJztcclxuXHJcbiAgIHRoaXMudmlld0JveCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBwYXJ0cyA9IGZhY2UuYmJveC5zcGxpdCgvXFxzKy8pO1xyXG4gICAgICB2YXIgYm94ID0ge1xyXG4gICAgICAgICBtaW5YOiBwYXJzZUludChwYXJ0c1swXSwgMTApLFxyXG4gICAgICAgICBtaW5ZOiBwYXJzZUludChwYXJ0c1sxXSwgMTApLFxyXG4gICAgICAgICBtYXhYOiBwYXJzZUludChwYXJ0c1syXSwgMTApLFxyXG4gICAgICAgICBtYXhZOiBwYXJzZUludChwYXJ0c1szXSwgMTApXHJcbiAgICAgIH07XHJcbiAgICAgIGJveC53aWR0aCA9IGJveC5tYXhYIC0gYm94Lm1pblg7XHJcbiAgICAgIGJveC5oZWlnaHQgPSBib3gubWF4WSAtIGJveC5taW5ZO1xyXG4gICAgICBib3gudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgcmV0dXJuIFsgdGhpcy5taW5YLCB0aGlzLm1pblksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0IF0uam9pbignICcpO1xyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4gYm94O1xyXG4gICB9KSgpO1xyXG5cclxuICAgdGhpcy5hc2NlbnQgPSAtcGFyc2VJbnQoZmFjZS5hc2NlbnQsIDEwKTtcclxuICAgdGhpcy5kZXNjZW50ID0gLXBhcnNlSW50KGZhY2UuZGVzY2VudCwgMTApO1xyXG5cclxuICAgdGhpcy5oZWlnaHQgPSAtdGhpcy5hc2NlbnQgKyB0aGlzLmRlc2NlbnQ7XHJcblxyXG4gICB0aGlzLnNwYWNpbmcgPSBmdW5jdGlvbihjaGFycywgbGV0dGVyU3BhY2luZywgd29yZFNwYWNpbmcpIHtcclxuICAgICAgdmFyIGdseXBocyA9IHRoaXMuZ2x5cGhzLCBnbHlwaCxcclxuICAgICAgICAga2VybmluZywgayxcclxuICAgICAgICAganVtcHMgPSBbXSxcclxuICAgICAgICAgd2lkdGggPSAwLCB3LFxyXG4gICAgICAgICBpID0gLTEsIGogPSAtMSwgY2hyO1xyXG4gICAgICB3aGlsZSAoY2hyID0gY2hhcnNbKytpXSkge1xyXG4gICAgICAgICBnbHlwaCA9IGdseXBoc1tjaHJdIHx8IHRoaXMubWlzc2luZ0dseXBoO1xyXG4gICAgICAgICBpZiAoIWdseXBoKSBjb250aW51ZTtcclxuICAgICAgICAgaWYgKGtlcm5pbmcpIHtcclxuICAgICAgICAgICAgd2lkdGggLT0gayA9IGtlcm5pbmdbY2hyXSB8fCAwO1xyXG4gICAgICAgICAgICBqdW1wc1tqXSAtPSBrO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIHcgPSBnbHlwaC53O1xyXG4gICAgICAgICBpZiAoaXNOYU4odykpIHcgPSArdGhpcy53OyAvLyBtYXkgaGF2ZSBiZWVuIGEgU3RyaW5nIGluIG9sZCBmb250c1xyXG4gICAgICAgICBpZiAodyA+IDApIHtcclxuICAgICAgICAgICAgdyArPSBsZXR0ZXJTcGFjaW5nO1xyXG4gICAgICAgICAgICBpZiAod29yZFNlcGFyYXRvcnNbY2hyXSkgdyArPSB3b3JkU3BhY2luZztcclxuICAgICAgICAgfVxyXG4gICAgICAgICB3aWR0aCArPSBqdW1wc1srK2pdID0gfn53OyAvLyBnZXQgcmlkIG9mIGRlY2ltYWxzXHJcbiAgICAgICAgIGtlcm5pbmcgPSBnbHlwaC5rO1xyXG4gICAgICB9XHJcbiAgICAgIGp1bXBzLnRvdGFsID0gd2lkdGg7XHJcbiAgICAgIHJldHVybiBqdW1wcztcclxuICAgfTtcclxuXHJcbiAgIHRoaXMuYXBwbHlMaWdhdHVyZXMgPSBmdW5jdGlvbih0ZXh0LCBsaWdhdHVyZXMpIHtcclxuICAgICAgLy8gZmluZCBjYWNoZWQgbGlnYXR1cmUgY29uZmlndXJhdGlvbiBmb3IgdGhpcyBmb250XHJcbiAgICAgIGZvciAodmFyIGk9MCwgbGlnYXR1cmVDb25maWc7IGk8bGlnYXR1cmVDYWNoZS5sZW5ndGggJiYgIWxpZ2F0dXJlQ29uZmlnOyBpKyspXHJcbiAgICAgICAgIGlmIChsaWdhdHVyZUNhY2hlW2ldLmxpZ2F0dXJlcyA9PT0gbGlnYXR1cmVzKVxyXG4gICAgICAgICAgICBsaWdhdHVyZUNvbmZpZyA9IGxpZ2F0dXJlQ2FjaGVbaV07XHJcblxyXG4gICAgICAvLyBpZiB0aGVyZSBpcyBub25lLCBpdCBuZWVkcyB0byBiZSBjcmVhdGVkIGFuZCBjYWNoZWRcclxuICAgICAgaWYgKCFsaWdhdHVyZUNvbmZpZykge1xyXG4gICAgICAgICAvLyBpZGVudGlmeSBsZXR0ZXIgZ3JvdXBzIHRvIHByZXBhcmUgcmVndWxhciBleHByZXNzaW9uIHRoYXQgbWF0Y2hlcyB0aGVzZVxyXG4gICAgICAgICB2YXIgbGV0dGVyR3JvdXBzID0gW107XHJcbiAgICAgICAgIGZvciAodmFyIGxldHRlckdyb3VwIGluIGxpZ2F0dXJlcykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5nbHlwaHNbbGlnYXR1cmVzW2xldHRlckdyb3VwXV0pIHtcclxuICAgICAgICAgICAgICAgbGV0dGVyR3JvdXBzLnB1c2gobGV0dGVyR3JvdXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgIH1cclxuXHJcbiAgICAgICAgIC8vIHNvcnQgYnkgbG9uZ2VyIGdyb3VwcyBmaXJzdCwgdGhlbiBhbHBoYWJldGljYWxseSAodG8gYWlkIGNhY2hpbmcgYnkgdGhpcyBrZXkpXHJcbiAgICAgICAgIHZhciByZWdleHBUZXh0ID0gbGV0dGVyR3JvdXBzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgICAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aCB8fCBhID4gYjtcclxuICAgICAgICAgfSkuam9pbignfCcpO1xyXG5cclxuICAgICAgICAgbGlnYXR1cmVDYWNoZS5wdXNoKGxpZ2F0dXJlQ29uZmlnID0ge1xyXG4gICAgICAgICAgICBsaWdhdHVyZXM6IGxpZ2F0dXJlcyxcclxuICAgICAgICAgICAgLy8gY3JlYXRlIHJlZ3VsYXIgZXhwcmVzc2lvbiBmb3IgbWF0Y2hpbmcgZGVzaXJlZCBsaWdhdHVyZXMgdGhhdCBhcmUgcHJlc2VudCBpbiB0aGUgZm9udFxyXG4gICAgICAgICAgICByZWdleHA6IHJlZ2V4cFRleHQubGVuZ3RoID4gMCBcclxuICAgICAgICAgICAgICAgPyByZWdleHBDYWNoZVtyZWdleHBUZXh0XSB8fCAocmVnZXhwQ2FjaGVbcmVnZXhwVGV4dF0gPSBuZXcgUmVnRXhwKHJlZ2V4cFRleHQsICdnJykpXHJcbiAgICAgICAgICAgICAgIDogbnVsbFxyXG4gICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmV0dXJuIGFwcGxpZWQgbGlnYXR1cmVzIG9yIG9yaWdpbmFsIHRleHQgaWYgbm9uZSBleGlzdCBmb3IgZ2l2ZW4gY29uZmlndXJhdGlvblxyXG4gICAgICByZXR1cm4gbGlnYXR1cmVDb25maWcucmVnZXhwXHJcbiAgICAgICAgID8gdGV4dC5yZXBsYWNlKGxpZ2F0dXJlQ29uZmlnLnJlZ2V4cCwgZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxpZ2F0dXJlc1ttYXRjaF0gfHwgbWF0Y2g7XHJcbiAgICAgICAgIH0pXHJcbiAgICAgICAgIDogdGV4dDtcclxuICAgfTtcclxufVxyXG4vKlxyXG5mdW5jdGlvbiBSZW5kZXJUZXh0Q3Vmb24gKHRleHQsZm9udCwgc2l6ZSwgY3R4ICxsICxmaWxsKSB7XHJcblx0ZnVuY3Rpb24gZ2VuZXJhdGVGcm9tVk1MKHBhdGgsIGNvbnRleHQpIHtcclxuXHRcdHZhciBhdFggPSAwLCBhdFkgPSAwO1xyXG5cdFx0dmFyIGNvZGUgPSBbXSwgcmUgPSAvKFttcnZ4ZV0pKFteYS16XSopL2csIG1hdGNoO1xyXG5cdFx0Z2VuZXJhdGU6IGZvciAodmFyIGkgPSAwOyBtYXRjaCA9IHJlLmV4ZWMocGF0aCk7ICsraSkge1xyXG5cdFx0XHR2YXIgYyA9IG1hdGNoWzJdLnNwbGl0KCcsJyk7XHJcblx0XHRcdHN3aXRjaCAobWF0Y2hbMV0pIHtcclxuXHRcdFx0XHRjYXNlICd2JzpcclxuXHRcdFx0XHRcdGNvZGVbaV0gPSB7IG06ICdiZXppZXJDdXJ2ZVRvJywgYTogWyBhdFggKyB+fmNbMF0sIGF0WSArIH5+Y1sxXSwgYXRYICsgfn5jWzJdLCBhdFkgKyB+fmNbM10sIGF0WCArPSB+fmNbNF0sIGF0WSArPSB+fmNbNV0gXSB9O1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAncic6XHJcblx0XHRcdFx0XHRjb2RlW2ldID0geyBtOiAnbGluZVRvJywgYTogWyBhdFggKz0gfn5jWzBdLCBhdFkgKz0gfn5jWzFdIF0gfTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgJ20nOlxyXG5cdFx0XHRcdFx0Y29kZVtpXSA9IHsgbTogJ21vdmVUbycsIGE6IFsgYXRYID0gfn5jWzBdLCBhdFkgPSB+fmNbMV0gXSB9O1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAneCc6XHJcblx0XHRcdFx0XHRjb2RlW2ldID0geyBtOiAnY2xvc2VQYXRoJyB9O1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAnZSc6XHJcblx0XHRcdFx0XHRicmVhayBnZW5lcmF0ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjb250ZXh0W2NvZGVbaV0ubV0uYXBwbHkoY29udGV4dCwgY29kZVtpXS5hKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBjb2RlO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW50ZXJwcmV0KGNvZGUsIGNvbnRleHQpIHtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsID0gY29kZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcclxuXHRcdFx0dmFyIGxpbmUgPSBjb2RlW2ldO1xyXG5cdFx0XHRjb250ZXh0W2xpbmUubV0uYXBwbHkoY29udGV4dCwgbGluZS5hKTtcclxuXHRcdH1cclxuXHR9XHJcbiAgIFxyXG4gICBpZiAoIGwubGVuZ3RoID09IDIgKSB7IHZhciBmbCA9IG5ldyBGcm9tUG9pbnQgKGwpIH1cclxuICAgZWxzZSB7dmFyIGZsID0gbmV3IEZvbGxvd0xpbmUgKGwpfVxyXG4gICBcclxuICAgaWYgKCAhIGZsLklzVmFsaWQoKSlcclxuICAgICAgcmV0dXJuXHJcbiAgICAgIFxyXG4gICAvLyBTaGlmdCA9PT4gUmVuZGVyIGF0IG1pZGRsZSBsaW5lIGFuZCBub3QgYXQgYmFzZWxpbmUgIVxyXG4gICB2YXIgc2hpZnQgICAgICA9IHBhcnNlSW50KGZvbnQuZmFjZVtcIngtaGVpZ2h0XCJdKSAvMTAwICogc2l6ZS52YWx1ZSBcclxuICAgdmFyIHZpZXdCb3ggICAgPSBmb250LnZpZXdCb3g7XHJcbiAgIHZhciBleHBhbmRUb3AgID0gMCwgZXhwYW5kUmlnaHQgPSAwLCBleHBhbmRCb3R0b20gPSAwLCBleHBhbmRMZWZ0ID0gMDtcclxuXHJcbiAgIC8vdmFyIGNoYXJzID0gQ3Vmb24uQ1NTLnRleHRUcmFuc2Zvcm0ob3B0aW9ucy5saWdhdHVyZXMgPyBmb250LmFwcGx5TGlnYXR1cmVzKHRleHQsIG9wdGlvbnMubGlnYXR1cmVzKSA6IHRleHQsIHN0eWxlKS5zcGxpdCgnJyk7IC8vIGxpZ2F0dXJlID8/IFVwcGVyQ2FzZSA/PyBsb3dlckNhc2UgPz8gQ2FwaXRhbGl6ZSA/PyBJbnRlcmVzdGluZyAhICAgICAgXHJcbiAgIHZhciBjaGFycyA9IHRleHQuc3BsaXQoJycpXHJcbiAgIHZhciBqdW1wcyA9IGZvbnQuc3BhY2luZyhjaGFycyxcclxuICAgICAgfn5zaXplLmNvbnZlcnRGcm9tKDApLCAvLyBsZXR0ZXIgc3BhY2luZ1xyXG4gICAgICB+fnNpemUuY29udmVydEZyb20oMCkgIC8vIHdvcmQgc3BhY2luZ1xyXG4gICApO1xyXG4gICBcclxuICAgaWYgKCFqdW1wcy5sZW5ndGgpIHJldHVybiBudWxsOyAvLyB0aGVyZSdzIG5vdGhpbmcgdG8gcmVuZGVyXHJcblxyXG4gICB2YXIgd2lkdGggICAgPSBqdW1wcy50b3RhbDtcclxuICAgZXhwYW5kUmlnaHQgKz0gdmlld0JveC53aWR0aCAtIGp1bXBzW2p1bXBzLmxlbmd0aCAtIDFdO1xyXG4gICBleHBhbmRMZWZ0ICArPSB2aWV3Qm94Lm1pblg7XHJcblxyXG4gICB2YXIgaGVpZ2h0ID0gc2l6ZS5jb252ZXJ0KHZpZXdCb3guaGVpZ2h0KTtcclxuICAgdmFyIHJvdW5kZWRIZWlnaHQgPSBNYXRoLmNlaWwoaGVpZ2h0KTtcclxuICAgdmFyIHJvdW5kaW5nRmFjdG9yID0gcm91bmRlZEhlaWdodCAvIGhlaWdodDtcclxuICAgdmFyIHN0cmV0Y2hlZFdpZHRoID0gd2lkdGggKiByb3VuZGluZ0ZhY3RvcjtcclxuXHJcbiAgIC8vIG1pblkgaGFzIG5vIHBhcnQgaW4gY2FudmFzLmhlaWdodFxyXG4gICBleHBhbmRUb3AgKz0gdmlld0JveC5taW5ZO1xyXG5cclxuICAgdmFyIGcgPSBjdHhcclxuICAgdmFyIHNjYWxlID0gaGVpZ2h0IC8gdmlld0JveC5oZWlnaHQ7XHJcbiAgIC8vIHZhciBwaXhlbFJhdGlvID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMTtcclxuICAgLy8gaWYgKHBpeGVsUmF0aW8gIT0gMSkge1xyXG4gICAgICAvLyBjYW52YXMud2lkdGggPSBjYW52YXNXaWR0aCAqIHBpeGVsUmF0aW87XHJcbiAgICAgIC8vIGNhbnZhcy5oZWlnaHQgPSBjYW52YXNIZWlnaHQgKiBwaXhlbFJhdGlvO1xyXG4gICAgICAvLyBnLnNjYWxlKHBpeGVsUmF0aW8sIHBpeGVsUmF0aW8pO1xyXG4gICAvLyB9XHJcblxyXG4gICBcclxuICAgLy8gcHJvcGVyIGhvcml6b250YWwgc2NhbGluZyBpcyBwZXJmb3JtZWQgbGF0ZXJcclxuICAgLy9nLnRyYW5zbGF0ZSAoIDAsc2hpZnQpO1xyXG4gICAvL2cuc2NhbGUoc2NhbGUsIHNjYWxlICogcm91bmRpbmdGYWN0b3IpO1xyXG4gICAvL2cuc2NhbGUoc2NhbGUsIHNjYWxlICk7XHJcbiAgIC8vZy50cmFuc2xhdGUoLWV4cGFuZExlZnQsIC1leHBhbmRUb3ApO1xyXG4gICAvL2cuc2F2ZSgpO1xyXG5cclxuICAgLy9mdW5jdGlvbiByZW5kZXJUZXh0KCkge1xyXG4gICAgICAvL3ZhciBnbHlwaHMgPSBmb250LmdseXBocywgZ2x5cGgsIGkgPSAtMSwgaiA9IC0xLCBjaHI7XHJcbiAgICAgIC8vLy9nLnNjYWxlKHJvdW5kaW5nRmFjdG9yLCAxKTtcclxuICAgICAgLy93aGlsZSAoY2hyID0gY2hhcnNbKytpXSkge1xyXG4gICAgICAgICAvL2cuc2F2ZSgpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5ld1xyXG4gICAgICAgICAvL3ZhciB0ciA9IGZsLkFkdmFuY2UgKCBqdW1wc1soaisxKV0gKiBzY2FsZSApICAgICAgICAgICAgICAgIC8vIG5ld1xyXG4gICAgICAgICAvLy8vZy50cmFuc2xhdGUgKCB0clswXSAvc2NhbGUsIHRyWzFdIC9zY2FsZSk7ICAgICAgICAgICAgLy8gbmV3XHJcbiAgICAgICAgIC8vLy9nLnJvdGF0ZSh0clsyXSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXdcclxuICAgICAgXHJcbiAgICAgICAgIC8vdmFyIGdseXBoID0gZ2x5cGhzW2NoYXJzW2ldXSB8fCBmb250Lm1pc3NpbmdHbHlwaDtcclxuICAgICAgICAgLy9pZiAoIWdseXBoKSB7Y29udGludWU7Zy5yZXNvcmUoKTt9XHJcbiAgICAgICAgIC8vaWYgKGdseXBoLmQpIHtcclxuICAgICAgICAgICAgLy9nLmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAvLy8vIHRoZSBmb2xsb3dpbmcgbW92ZVRvIGlzIGZvciBPcGVyYSA5LjIuIGlmIHdlIGRvbid0XHJcbiAgICAgICAgICAgIC8vLy8gZG8gdGhpcywgaXQgd29uJ3QgZm9yZ2V0IHRoZSBwcmV2aW91cyBwYXRoIHdoaWNoXHJcbiAgICAgICAgICAgIC8vLy8gcmVzdWx0cyBpbiBnYXJibGVkIHRleHQuXHJcbiAgICAgICAgICAgIC8vZy5tb3ZlVG8oMCwgMCk7XHJcbiAgICAgICAgICAgIC8vaWYgKGdseXBoLmNvZGUpIGludGVycHJldChnbHlwaC5jb2RlLCBnKTtcclxuICAgICAgICAgICAgLy9lbHNlIGdseXBoLmNvZGUgPSBnZW5lcmF0ZUZyb21WTUwoJ20nICsgZ2x5cGguZCwgZyk7XHJcbiAgICAgICAgICAgIC8vZy5maWxsKCk7XHJcbiAgICAgICAgIC8vfVxyXG4gICAgICAgICAvL2cucmVzdG9yZSgpOyAvLyBuZXdcclxuICAgICAgICAgLy9nLnRyYW5zbGF0ZShqdW1wc1srK2pdLCAwKTtcclxuICAgICAgLy99XHJcbiAgIC8vfVxyXG4gICAvL2cuZmlsbFN0eWxlPVwicmdiYSgwLDAsMCwxLjApXCI7XHJcbiAgIC8vcmVuZGVyVGV4dCgpO1xyXG4gICAvL2cucmVzdG9yZSgpO1xyXG5cclxuICAgLy8gcHJvcGVyIGhvcml6b250YWwgc2NhbGluZyBpcyBwZXJmb3JtZWQgbGF0ZXJcclxuICAgXHJcbiAgIC8vZy5zY2FsZShzY2FsZSwgc2NhbGUgKiByb3VuZGluZ0ZhY3Rvcik7XHJcbiAgIFxyXG4gICAvL2cudHJhbnNsYXRlKC1leHBhbmRMZWZ0LCAtZXhwYW5kVG9wKTtcclxuICAgZy5zYXZlKCk7XHJcbiAgIGlmICghZmlsbCkge1xyXG4gICAgICBjdHgubGluZVdpZHRoICAgID0gY3R4LmxpbmVXaWR0aCAvIHNjYWxlO1xyXG4gICB9XHJcbiAgIGZ1bmN0aW9uIHJlbmRlclRleHQoKSB7XHJcbiAgICAgIHZhciBnbHlwaHMgPSBmb250LmdseXBocywgZ2x5cGgsIGkgPSAtMSwgaiA9IC0xLCBjaHI7XHJcbiAgICAgIC8vZy5zY2FsZShyb3VuZGluZ0ZhY3RvciwgMSk7XHJcbiAgICAgIHZhciBhY2NKID0gMDtcclxuICAgICAgd2hpbGUgKGNociA9IGNoYXJzWysraV0pIHtcclxuICAgICAgICAgdmFyIHRyID0gZmwuQWR2YW5jZSAoIGp1bXBzWyhqKzEpXSAqIHNjYWxlICkgICAgICAgICAgICAgICAgLy8gbmV3XHJcbiAgICAgICAgIGlmICggIXRyKSByZXR1cm47XHJcbiAgICAgICAgIGcuc2F2ZSgpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5ld1xyXG4gICAgICAgICBnLnRyYW5zbGF0ZSAoIHRyWzBdICwgdHJbMV0gKTsgICAgICAgICAgICAvLyBuZXdcclxuICAgICAgICAgZy5yb3RhdGUodHJbMl0pOyAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV3XHJcbiAgICAgICAgIGcudHJhbnNsYXRlICggMCxzaGlmdCk7XHJcbiAgICAgICAgIGcuc2NhbGUoc2NhbGUsIHNjYWxlICk7XHJcbiAgICAgICAgIC8vZy50cmFuc2xhdGUoYWNjSiwgMCk7XHJcbiAgICAgICAgIHZhciBnbHlwaCA9IGdseXBoc1tjaGFyc1tpXV0gfHwgZm9udC5taXNzaW5nR2x5cGg7XHJcbiAgICAgICAgIGlmICghZ2x5cGgpIHtnLnJlc3RvcmUoKTtjb250aW51ZTt9XHJcbiAgICAgICAgIGlmIChnbHlwaC5kKSB7XHJcbiAgICAgICAgICAgIGcuYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgbW92ZVRvIGlzIGZvciBPcGVyYSA5LjIuIGlmIHdlIGRvbid0XHJcbiAgICAgICAgICAgIC8vIGRvIHRoaXMsIGl0IHdvbid0IGZvcmdldCB0aGUgcHJldmlvdXMgcGF0aCB3aGljaFxyXG4gICAgICAgICAgICAvLyByZXN1bHRzIGluIGdhcmJsZWQgdGV4dC5cclxuICAgICAgICAgICAgZy5tb3ZlVG8oMCwgMCk7XHJcbiAgICAgICAgICAgIGlmIChnbHlwaC5jb2RlKSBpbnRlcnByZXQoZ2x5cGguY29kZSwgZyk7XHJcbiAgICAgICAgICAgIGVsc2UgZ2x5cGguY29kZSA9IGdlbmVyYXRlRnJvbVZNTCgnbScgKyBnbHlwaC5kLCBnKTtcclxuICAgICAgICAgICAgaWYgKCBmaWxsICkge1xyXG4gICAgICAgICAgICAgICBnLmZpbGwoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHsgXHJcbiAgICAgICAgICAgICAgIGcuc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfVxyXG4gICAgICAgICBhY2NKICs9IGp1bXBzWysral07XHJcbiAgICAgICAgIGcucmVzdG9yZSgpOyAvLyBuZXdcclxuICAgICAgfVxyXG4gICB9XHJcbiAgIHJlbmRlclRleHQoKTtcclxuICAgZy5yZXN0b3JlKCk7XHJcbn07Ki9cclxuXHJcbi8qXHJcbmZ1bmN0aW9uIEluaXRSZW5kZXJUZXh0UG9pbnQodGV4dCAsIGZvbnQsIHNpemUsIGwpICB7XHJcbiAgIHZhciBzaGlmdCAgICAgID0gcGFyc2VJbnQoZm9udC5mYWNlW1wieC1oZWlnaHRcIl0pIC8xMDAgKiBzaXplLnZhbHVlIFxyXG4gICB2YXIgdmlld0JveCAgICA9IGZvbnQudmlld0JveDtcclxuXHJcbiAgIHZhciBjaGFycyA9IHRleHQuc3BsaXQoJycpXHJcbiAgIHZhciBqdW1wcyA9IGZvbnQuc3BhY2luZyhjaGFycywgfn5zaXplLmNvbnZlcnRGcm9tKDApLCB+fnNpemUuY29udmVydEZyb20oMCkgKTtcclxuICAgXHJcbiAgIGlmICghanVtcHMubGVuZ3RoKSByZXR1cm4gbnVsbDsgLy8gdGhlcmUncyBub3RoaW5nIHRvIHJlbmRlclxyXG4gICBcclxuICAgdmFyIHdpZHRoICAgICAgICAgID0ganVtcHMudG90YWw7XHJcbiAgIHZhciBoZWlnaHQgICAgICAgICA9IHNpemUuY29udmVydCh2aWV3Qm94LmhlaWdodCk7XHJcbiAgIHZhciByb3VuZGVkSGVpZ2h0ICA9IE1hdGguY2VpbChoZWlnaHQpO1xyXG4gICB2YXIgcm91bmRpbmdGYWN0b3IgPSByb3VuZGVkSGVpZ2h0IC8gaGVpZ2h0O1xyXG4gICB2YXIgc3RyZXRjaGVkV2lkdGggPSB3aWR0aCAqIHJvdW5kaW5nRmFjdG9yO1xyXG4gICB2YXIgc2NhbGUgICAgICAgICAgPSBoZWlnaHQgLyB2aWV3Qm94LmhlaWdodDtcclxuXHJcbiAgIHZhciB0eHRDdHggICA9IG5ldyBPYmplY3QgICgpIDtcclxuICAgdHh0Q3R4LnNjYWxlID0gc2NhbGU7XHJcbiAgIHR4dEN0eC5jaGFycyA9IGNoYXJzO1xyXG4gICB0eHRDdHguc2hpZnQgPSBzaGlmdDtcclxuICAgdHh0Q3R4Lmp1bXBzID0ganVtcHM7XHJcbiAgIHR4dEN0eC5oICAgICA9IGhlaWdodDtcclxuICAgdHh0Q3R4LncgICAgID0gc2l6ZS5jb252ZXJ0KHN0cmV0Y2hlZFdpZHRoKTtcclxuICAgXHJcbiAgIHR4dEN0eC5iYm94ICAgPSBuZXcgT2JqZWN0KClcclxuICAgdHh0Q3R4LmJib3gueCA9IGxbMF0gLSA4XHJcbiAgIHR4dEN0eC5iYm94LnkgPSBsWzFdIC0gdHh0Q3R4LmggLSA4XHJcbiAgIHR4dEN0eC5iYm94LncgPSB0eHRDdHgudyArIDE2XHJcbiAgIHR4dEN0eC5iYm94LmggPSB0eHRDdHguaCArIDE2XHJcbiAgIHR4dEN0eC5iYm94LnQgPSB0ZXh0XHJcbiAgIFxyXG4gICB0eHRDdHguZmwgPSBuZXcgRnJvbVBvaW50IChsKSBcclxuICAgXHJcbiAgIGlmICggISB0eHRDdHguZmwuSXNWYWxpZCgpKVxyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgXHJcbiAgIHJldHVybiB0eHRDdHhcclxufVxyXG4qL1xyXG5cclxuZnVuY3Rpb24gSW5pdFJlbmRlclRleHQyKCB0ZXh0ICwgZm9udCwgc2l6ZSwgbCAsIGN1dFNpemUsIGNlbnRlciAsIHRyYW5zbGF0ZSAsIHNjYWxlX18pIHtcclxuXHJcbiAgIHZhciBzaGlmdCAgICAgID0gcGFyc2VJbnQoZm9udC5mYWNlW1wieC1oZWlnaHRcIl0pIC8xMDAgKiBzaXplLnZhbHVlIFxyXG4gICB2YXIgdmlld0JveCAgICA9IGZvbnQudmlld0JveDtcclxuXHJcbiAgIHZhciBoZWlnaHQgICAgICAgICA9IHNpemUuY29udmVydCh2aWV3Qm94LmhlaWdodCk7XHJcbiAgIHZhciByb3VuZGVkSGVpZ2h0ICA9IE1hdGguY2VpbChoZWlnaHQpO1xyXG4gICB2YXIgcm91bmRpbmdGYWN0b3IgPSByb3VuZGVkSGVpZ2h0IC8gaGVpZ2h0O1xyXG4gICB2YXIgc2NhbGUgPSBoZWlnaHQgLyB2aWV3Qm94LmhlaWdodDtcclxuXHJcbiAgIHZhciBkZXNjZW50ICAgICAgID0gc2l6ZS5jb252ZXJ0KGZvbnQuZGVzY2VudCk7XHJcbiAgIHZhciBhc2NlbnQgICAgICAgID0gc2l6ZS5jb252ZXJ0KGZvbnQuYXNjZW50KTtcclxuICAgdmFyIHJlYWxIICAgICAgICAgPSBkZXNjZW50IC0gYXNjZW50OyAvLyA9PSBzaXplIC4uLi5cclxuICAgXHJcbiAgIHZhciBweCA9IDBcclxuICAgdmFyIHB5ID0gMFxyXG4gICBpZiAobC5sZW5ndGggPiAyKSB7XHJcblxyXG4gICAgICB2YXIgbWlueCA9IGxbMF1cclxuICAgICAgdmFyIG1heHggPSBsWzBdXHJcbiAgICAgIHZhciBtaW55ID0gbFsxXVxyXG4gICAgICB2YXIgbWF4eSA9IGxbMV1cclxuICAgICAgZm9yICggdmFyIGkgPSAyIDsgaSA8IGwubGVuZ3RoLTEgOyBpID0gaSArIDIgKSB7XHJcbiAgICAgICAgIG1pbnggPSAobFtpXSA8IG1pbngpPyBsW2ldIDogbWlueDtcclxuICAgICAgICAgbWF4eCA9IChsW2ldID4gbWF4eCk/IGxbaV0gOiBtYXh4O1xyXG4gICAgICAgICBtaW55ID0gKGxbaSsxXSA8IG1pbnkpPyBsW2krMV0gOiBtaW55O1xyXG4gICAgICAgICBtYXh5ID0gKGxbaSsxXSA+IG1heHkpPyBsW2krMV0gOiBtYXh5O1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBib3h3ID0gbWF4eC1taW54O1xyXG4gICAgICB2YXIgYm94aCA9IG1heHktbWlueTtcclxuICAgICAgcHggICA9IG1pbnggKyBib3h3LzIuMFxyXG4gICAgICBweSAgID0gbWlueSArIGJveGgvMi4wXHJcbiAgIH1cclxuICAgZWxzZSB7XHJcbiAgICAgIHB4ICAgPSBsWzBdXHJcbiAgICAgIHB5ICAgPSBsWzFdXHJcbiAgIH1cclxuICAgcHggICA9IHB4ICogc2NhbGVfX1swXSArIHRyYW5zbGF0ZVswXVxyXG4gICBweSAgID0gcHkgKiBzY2FsZV9fWzFdICsgdHJhbnNsYXRlWzFdXHJcbiAgICAgIFxyXG4gICB2YXIgbWF4VyAgICAgICA9IGN1dFNpemU7IC8vIHB4XHJcbiAgIHZhciBtYXhDaGFyICAgID0gTWF0aC5mbG9vciAoIChtYXhXIC8gc2l6ZS52YWx1ZSkgKiA2ICk7ICAgXHJcbiAgIHZhciB0ZXh0QXJyYXkgID0gW11cclxuICAgdmFyIGNoYXJzQXJyYXkgPSBbXVxyXG4gICB2YXIganVtcHNBcnJheSA9IFtdXHJcbiAgIHZhciB0eHRUbXAgICAgID0gdGV4dDtcclxuICAgaWYgKCBtYXhXID4gMCApIHtcclxuICAgICAgd2hpbGUgKCB0eHRUbXAubGVuZ3RoID4gbWF4Q2hhciApIHtcclxuICAgICAgICAgdmFyIHNwSWR4ID0gdHh0VG1wLmluZGV4T2YgKCcgJyxtYXhDaGFyKVxyXG4gICAgICAgICBpZiAoc3BJZHggPCAwKVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgdmFyIHN0ciA9IHR4dFRtcC5zdWJzdHJpbmcoIDAgLCBzcElkeCk7XHJcbiAgICAgICAgIHR4dFRtcCAgPSB0eHRUbXAuc3Vic3RyaW5nKCBzcElkeCArIDEgKVxyXG4gICAgICAgICB2YXIgY2hhcnMgPSBzdHIuc3BsaXQoJycpXHJcbiAgICAgICAgIHZhciBqdW1wcyA9IGZvbnQuc3BhY2luZyhjaGFycyxcclxuICAgICAgICAgICAgfn5zaXplLmNvbnZlcnRGcm9tKDApLCAvLyBsZXR0ZXIgc3BhY2luZ1xyXG4gICAgICAgICAgICB+fnNpemUuY29udmVydEZyb20oMCkgIC8vIHdvcmQgc3BhY2luZ1xyXG4gICAgICAgICApXHJcbiAgICAgICAgIGlmICghanVtcHMubGVuZ3RoKSBjb250aW51ZTsgXHJcbiAgICAgICAgIFxyXG4gICAgICAgICBjaGFyc0FycmF5LnB1c2ggKCBjaGFycyApXHJcbiAgICAgICAgIGp1bXBzQXJyYXkucHVzaCAoIGp1bXBzIClcclxuICAgICAgICAgdGV4dEFycmF5LnB1c2ggICggc3RyIClcclxuICAgICAgfVxyXG4gICB9XHJcbiAgIGlmICggdHh0VG1wLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgIHZhciBjaGFycyA9IHR4dFRtcC5zcGxpdCgnJylcclxuICAgICAgdmFyIGp1bXBzID0gZm9udC5zcGFjaW5nKGNoYXJzLFxyXG4gICAgICAgICB+fnNpemUuY29udmVydEZyb20oMCksIC8vIGxldHRlciBzcGFjaW5nXHJcbiAgICAgICAgIH5+c2l6ZS5jb252ZXJ0RnJvbSgwKSAgLy8gd29yZCBzcGFjaW5nXHJcbiAgICAgIClcclxuICAgICAgaWYgKCBqdW1wcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgIGNoYXJzQXJyYXkucHVzaCAoIGNoYXJzIClcclxuICAgICAgICAganVtcHNBcnJheS5wdXNoICgganVtcHMgKVxyXG4gICAgICAgICB0ZXh0QXJyYXkucHVzaCh0eHRUbXApIFxyXG4gICAgICB9XHJcbiAgIH0gICAgICBcclxuICAgXHJcbiAgIHZhciB0eHRDdHggICAgID0gbmV3IE9iamVjdCAgKCkgO1xyXG4gICB0eHRDdHguc2NhbGUgICA9IHNjYWxlO1xyXG4gICB0eHRDdHguY2hhcnMgICA9IGNoYXJzQXJyYXk7XHJcbiAgIHR4dEN0eC5zaGlmdCAgID0gc2hpZnQ7XHJcbiAgIHR4dEN0eC5qdW1wcyAgID0ganVtcHNBcnJheTtcclxuICAgdHh0Q3R4LmZsICAgICAgPSBbXVxyXG4gICB2YXIgYmJveCAgICAgICA9IG5ldyBPYmplY3QoKVxyXG4gICBiYm94LnggICAgICAgICA9IDEwMDAwMDAwMDBcclxuICAgYmJveC55ICAgICAgICAgPSAxMDAwMDAwMDAwXHJcbiAgIGJib3gueDIgICAgICAgID0gLTEwMDAwMDAwMDBcclxuICAgYmJveC55MiAgICAgICAgPSAtMTAwMDAwMDAwMFxyXG4gICBcclxuICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IGp1bXBzQXJyYXkubGVuZ3RoIDsgaT1pKzEgKSB7XHJcbiAgICAgIHZhciBzdHJldGNoZWRXaWR0aCA9IGp1bXBzQXJyYXlbaV0udG90YWwgKiByb3VuZGluZ0ZhY3RvcjtcclxuICAgICAgdmFyIHcgICAgICAgICAgICAgID0gc2l6ZS5jb252ZXJ0KHN0cmV0Y2hlZFdpZHRoKTtcclxuICAgICAgdmFyIHkgICAgICAgICAgICAgID0gcHkgLSAgKCBqdW1wc0FycmF5Lmxlbmd0aCAtIDEgLSBpICkgKiAoIGhlaWdodCApXHJcbiAgICAgIHZhciB4ICAgICAgICAgICAgICA9IHB4XHJcbiAgICAgIGlmIChjZW50ZXIpIHtcclxuICAgICAgICAgeCA9IHggLSB3IC8gMi4wO1xyXG4gICAgICB9XHJcbiAgICAgIHR4dEN0eC5mbC5wdXNoICggbmV3IEZyb21Qb2ludCAoW3gseV0pICk7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgYmJ4ICA9IHggLSAzXHJcbiAgICAgIHZhciBiYnkgID0geSArIGFzY2VudCAtIDNcclxuICAgICAgdmFyIGJieDIgPSBiYnggKyB3ICsgNlxyXG4gICAgICB2YXIgYmJ5MiA9IGJieSArIHJlYWxIICsgNlxyXG4gICAgICBcclxuICAgICAgYmJveC54ICA9IGJieCA8IGJib3gueCA/IGJieCA6IGJib3gueDtcclxuICAgICAgYmJveC55ICA9IGJieSA8IGJib3gueSA/IGJieSA6IGJib3gueTtcclxuICAgICAgYmJveC54MiA9IGJieDIgPiBiYm94LngyID8gYmJ4MiA6IGJib3gueDI7XHJcbiAgICAgIGJib3gueTIgID0gYmJ5MiA+IGJib3gueTIgPyBiYnkyIDogYmJveC55MjtcclxuICAgfVxyXG5cclxuICAgaWYgKCFqdW1wc0FycmF5Lmxlbmd0aCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICB0eHRDdHguYmJveCA9IG5ldyBPYmplY3QoKSBcclxuICAgdHh0Q3R4LmJib3gueCA9IGJib3gueFxyXG4gICB0eHRDdHguYmJveC55ID0gYmJveC55XHJcbiAgIHR4dEN0eC5iYm94LncgPSBiYm94LngyIC0gYmJveC54XHJcbiAgIHR4dEN0eC5iYm94LmggPSBiYm94LnkyIC0gYmJveC55XHJcbiAgIHR4dEN0eC5iYm94LnQgPSB0ZXh0XHJcbiAgIFxyXG4gICByZXR1cm4gdHh0Q3R4O1xyXG59XHJcbi8qXHJcbmZ1bmN0aW9uIEluaXRSZW5kZXJUZXh0KCB0ZXh0ICwgZm9udCwgc2l6ZSwgbCApIHtcclxuXHJcblxyXG4gICB2YXIgc2hpZnQgICAgICA9IHBhcnNlSW50KGZvbnQuZmFjZVtcIngtaGVpZ2h0XCJdKSAvMTAwICogc2l6ZS52YWx1ZSBcclxuICAgdmFyIHZpZXdCb3ggICAgPSBmb250LnZpZXdCb3g7XHJcblxyXG4gICB2YXIgY2hhcnMgPSB0ZXh0LnNwbGl0KCcnKVxyXG4gICB2YXIganVtcHMgPSBmb250LnNwYWNpbmcoY2hhcnMsXHJcbiAgICAgIH5+c2l6ZS5jb252ZXJ0RnJvbSgwKSwgLy8gbGV0dGVyIHNwYWNpbmdcclxuICAgICAgfn5zaXplLmNvbnZlcnRGcm9tKDApICAvLyB3b3JkIHNwYWNpbmdcclxuICAgKTtcclxuICAgXHJcbiAgIGlmICghanVtcHMubGVuZ3RoKSByZXR1cm4gbnVsbDsgLy8gdGhlcmUncyBub3RoaW5nIHRvIHJlbmRlclxyXG5cclxuICAgdmFyIHdpZHRoICAgID0ganVtcHMudG90YWw7XHJcblxyXG4gICB2YXIgaGVpZ2h0ID0gc2l6ZS5jb252ZXJ0KHZpZXdCb3guaGVpZ2h0KTtcclxuICAgdmFyIHJvdW5kZWRIZWlnaHQgPSBNYXRoLmNlaWwoaGVpZ2h0KTtcclxuICAgdmFyIHJvdW5kaW5nRmFjdG9yID0gcm91bmRlZEhlaWdodCAvIGhlaWdodDtcclxuICAgdmFyIHN0cmV0Y2hlZFdpZHRoID0gd2lkdGggKiByb3VuZGluZ0ZhY3RvcjtcclxuXHJcbiAgIHZhciBzY2FsZSA9IGhlaWdodCAvIHZpZXdCb3guaGVpZ2h0O1xyXG5cclxuICAgdmFyIHR4dEN0eCA9IG5ldyBPYmplY3QgICgpIDtcclxuICAgdHh0Q3R4LnNjYWxlID0gc2NhbGU7XHJcbiAgIHR4dEN0eC5jaGFycyA9IGNoYXJzO1xyXG4gICB0eHRDdHguc2hpZnQgPSBzaGlmdDtcclxuICAgdHh0Q3R4Lmp1bXBzID0ganVtcHM7XHJcbiAgIFxyXG4gICB0eHRDdHguaCAgICAgPSBoZWlnaHQ7XHJcbiAgIHR4dEN0eC53ICAgICA9IHNpemUuY29udmVydChzdHJldGNoZWRXaWR0aCk7XHJcbiAgIFxyXG4gICB0eHRDdHguYmJveCA9IG5ldyBPYmplY3QoKVxyXG4gICBpZiAoIGwubGVuZ3RoID09IDIgKSB7XHJcbiAgICAgIHR4dEN0eC5iYm94LnggPSBsWzBdIC0gOFxyXG4gICAgICB0eHRDdHguYmJveC55ID0gbFsxXSAtIHR4dEN0eC5oIC0gOFxyXG4gICAgICB0eHRDdHguYmJveC53ID0gdHh0Q3R4LncgKyAxNlxyXG4gICAgICB0eHRDdHguYmJveC5oID0gdHh0Q3R4LmggKyAxNlxyXG4gICAgICB0eHRDdHguYmJveC50ID0gdGV4dFxyXG4gICB9XHJcbiAgIGVsc2Uge1xyXG4gICAgICAvLyB0b2RvXHJcbiAgIH1cclxuXHJcbiAgIFxyXG4gICBpZiAoIGwubGVuZ3RoID09IDIgKSAgICAgICAgICAgeyB0eHRDdHguZmwgPSBuZXcgRnJvbVBvaW50IChsKSAgfVxyXG4gICBlbHNlIGlmIChsW2wubGVuZ3RoLTFdID09IFwiY1wiKSB7IFxyXG4gICBcclxuICAgICAgdmFyIG1pbnggPSA5OTk5OVxyXG4gICAgICB2YXIgbWF4eCA9IC05OTk5OVxyXG4gICAgICB2YXIgbWlueSA9IDk5OTk5XHJcbiAgICAgIHZhciBtYXh5ID0gLTk5OTk5XHJcbiAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBsLmxlbmd0aC0xIDsgaSA9IGkgKyAyICkge1xyXG4gICAgICAgICBtaW54ID0gKGxbaV0gPCBtaW54KT8gbFtpXSA6IG1pbng7XHJcbiAgICAgICAgIG1heHggPSAobFtpXSA+IG1heHgpPyBsW2ldIDogbWF4eDtcclxuICAgICAgICAgbWlueSA9IChsW2krMV0gPCBtaW55KT8gbFtpKzFdIDogbWlueTtcclxuICAgICAgICAgbWF4eSA9IChsW2krMV0gPiBtYXh5KT8gbFtpKzFdIDogbWF4eTtcclxuICAgICAgfVxyXG4gICAgICB2YXIgYm94dyA9IG1heHgtbWlueDtcclxuICAgICAgdmFyIGJveGggPSBtYXh5LW1pbnk7XHJcbiAgICAgIHZhciBjeCA9IG1pbnggKyBib3h3LzIuMCAtIHR4dEN0eC53IC8gMi4wXHJcbiAgICAgIHZhciBjeSA9IG1pbnkgKyBib3hoLzIuMFxyXG4gICAgICBcclxuICAgICAgdHh0Q3R4LmZsID0gbmV3IEZyb21Qb2ludCAoW2N4LGN5XSlcclxuICAgfVxyXG4gICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0eHRDdHguZmwgPSBuZXcgRm9sbG93TGluZSAobCkgfVxyXG4gICBcclxuICAgaWYgKCAhIHR4dEN0eC5mbC5Jc1ZhbGlkKCkpXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICBcclxuICAgcmV0dXJuIHR4dEN0eFxyXG59XHJcbiovXHJcbi8vZnVuY3Rpb24gUmVuZGVyVGV4dEN1Zm9uICh0ZXh0LGZvbnQsIHNpemUsIGN0eCAsbCAsZmlsbCkge1xyXG5mdW5jdGlvbiBSZW5kZXJUZXh0Q3Vmb24gKHR4dEN0eCwgZm9udCwgY3R4ICxmaWxsKSB7XHJcblx0ZnVuY3Rpb24gZ2VuZXJhdGVGcm9tVk1MKHBhdGgsIGNvbnRleHQpIHtcclxuXHRcdHZhciBhdFggPSAwLCBhdFkgPSAwO1xyXG5cdFx0dmFyIGNvZGUgPSBbXSwgcmUgPSAvKFttcnZ4ZV0pKFteYS16XSopL2csIG1hdGNoO1xyXG5cdFx0Z2VuZXJhdGU6IGZvciAodmFyIGkgPSAwOyBtYXRjaCA9IHJlLmV4ZWMocGF0aCk7ICsraSkge1xyXG5cdFx0XHR2YXIgYyA9IG1hdGNoWzJdLnNwbGl0KCcsJyk7XHJcblx0XHRcdHN3aXRjaCAobWF0Y2hbMV0pIHtcclxuXHRcdFx0XHRjYXNlICd2JzpcclxuXHRcdFx0XHRcdGNvZGVbaV0gPSB7IG06ICdiZXppZXJDdXJ2ZVRvJywgYTogWyBhdFggKyB+fmNbMF0sIGF0WSArIH5+Y1sxXSwgYXRYICsgfn5jWzJdLCBhdFkgKyB+fmNbM10sIGF0WCArPSB+fmNbNF0sIGF0WSArPSB+fmNbNV0gXSB9O1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAncic6XHJcblx0XHRcdFx0XHRjb2RlW2ldID0geyBtOiAnbGluZVRvJywgYTogWyBhdFggKz0gfn5jWzBdLCBhdFkgKz0gfn5jWzFdIF0gfTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgJ20nOlxyXG5cdFx0XHRcdFx0Y29kZVtpXSA9IHsgbTogJ21vdmVUbycsIGE6IFsgYXRYID0gfn5jWzBdLCBhdFkgPSB+fmNbMV0gXSB9O1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAneCc6XHJcblx0XHRcdFx0XHRjb2RlW2ldID0geyBtOiAnY2xvc2VQYXRoJyB9O1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAnZSc6XHJcblx0XHRcdFx0XHRicmVhayBnZW5lcmF0ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjb250ZXh0W2NvZGVbaV0ubV0uYXBwbHkoY29udGV4dCwgY29kZVtpXS5hKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBjb2RlO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW50ZXJwcmV0KGNvZGUsIGNvbnRleHQpIHtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsID0gY29kZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcclxuXHRcdFx0dmFyIGxpbmUgPSBjb2RlW2ldO1xyXG5cdFx0XHRjb250ZXh0W2xpbmUubV0uYXBwbHkoY29udGV4dCwgbGluZS5hKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG4gICBcclxuICAgY3R4LnNhdmUoKTtcclxuICAgaWYgKCFmaWxsKSB7XHJcbiAgICAgIGN0eC5saW5lV2lkdGggICAgPSBjdHgubGluZVdpZHRoIC8gdHh0Q3R4LnNjYWxlO1xyXG4gICB9XHJcbiAgIGZvciAoIHZhciBpZHggPSAwIDsgaWR4IDwgdHh0Q3R4Lmp1bXBzLmxlbmd0aCAgOyArK2lkeCkgeyBcclxuICAgICAgdmFyIGdseXBocyA9IGZvbnQuZ2x5cGhzLCBnbHlwaCwgaSA9IC0xLCBqID0gLTEsIGNocjtcclxuICAgICAgdmFyIGFjY0ogPSAwO1xyXG4gICAgICB3aGlsZSAoY2hyID0gdHh0Q3R4LmNoYXJzW2lkeF1bKytpXSkge1xyXG4gICAgICAgICB2YXIgdHIgPSB0eHRDdHguZmxbaWR4XS5BZHZhbmNlICggdHh0Q3R4Lmp1bXBzW2lkeF1bKGorMSldICogdHh0Q3R4LnNjYWxlICkgICAgICAgICAgICAgICAgLy8gbmV3XHJcbiAgICAgICAgIGlmICggIXRyKSByZXR1cm47XHJcbiAgICAgICAgIGN0eC5zYXZlKCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV3XHJcbiAgICAgICAgIGN0eC50cmFuc2xhdGUgKCB0clswXSAsIHRyWzFdICk7ICAgICAgICAgICAgLy8gbmV3XHJcbiAgICAgICAgIGN0eC5yb3RhdGUodHJbMl0pOyAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV3XHJcbiAgICAgICAgIGN0eC50cmFuc2xhdGUgKCAwLHR4dEN0eC5zaGlmdCk7XHJcbiAgICAgICAgIGN0eC5zY2FsZSh0eHRDdHguc2NhbGUsIHR4dEN0eC5zY2FsZSApO1xyXG4gICAgICAgICB2YXIgZ2x5cGggPSBnbHlwaHNbdHh0Q3R4LmNoYXJzW2lkeF1baV1dIHx8IGZvbnQubWlzc2luZ0dseXBoO1xyXG4gICAgICAgICBpZiAoIWdseXBoKSB7Y3R4LnJlc3RvcmUoKTtjb250aW51ZTt9XHJcbiAgICAgICAgIGlmIChnbHlwaC5kKSB7XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBtb3ZlVG8gaXMgZm9yIE9wZXJhIDkuMi4gaWYgd2UgZG9uJ3RcclxuICAgICAgICAgICAgLy8gZG8gdGhpcywgaXQgd29uJ3QgZm9yZ2V0IHRoZSBwcmV2aW91cyBwYXRoIHdoaWNoXHJcbiAgICAgICAgICAgIC8vIHJlc3VsdHMgaW4gZ2FyYmxlZCB0ZXh0LlxyXG4gICAgICAgICAgICBjdHgubW92ZVRvKDAsIDApO1xyXG4gICAgICAgICAgICBpZiAoZ2x5cGguY29kZSkgaW50ZXJwcmV0KGdseXBoLmNvZGUsIGN0eCk7XHJcbiAgICAgICAgICAgIGVsc2UgZ2x5cGguY29kZSA9IGdlbmVyYXRlRnJvbVZNTCgnbScgKyBnbHlwaC5kLCBjdHgpO1xyXG4gICAgICAgICAgICBpZiAoIGZpbGwgKSB7XHJcbiAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7IFxyXG4gICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfVxyXG4gICAgICAgICBhY2NKICs9IHR4dEN0eC5qdW1wc1tpZHhdWysral07XHJcbiAgICAgICAgIGN0eC5yZXN0b3JlKCk7IC8vIG5ld1xyXG4gICAgICB9XHJcbiAgIH1cclxuICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIEJveGVzSW50ZXJzZWN0KGEsIGIpIHtcclxuXHJcbiAgIHJldHVybiAhICgoYi54ID49IGEueCArIGEudykgICAvLyB0cm9wIMOgIGRyb2l0ZVxyXG4gICAgICAgICAgICB8fCAoYi54ICsgYi53IDw9IGEueCkgLy8gdHJvcCDDoCBnYXVjaGVcclxuICAgICAgICAgICAgfHwgKGIueSA+PSBhLnkgKyBhLmgpIC8vIHRyb3AgZW4gYmFzXHJcbiAgICAgICAgICAgIHx8IChiLnkgKyBiLmggPD0gYS55KSkvLyB0cm9wIGVuIGhhdXRcclxuICAgIFxyXG4gICAvKlxyXG4gICByZXR1cm4gKE1hdGguYWJzKChhLnggKyBhLncvMi4wKSAtIChiLnggKyBiLncvMi4wKSkgKiAyIDw9IChhLncgKyBiLncpKSAmJlxyXG4gICAgICAgICAoTWF0aC5hYnMoKGEueSArIGEuaC8yLjApIC0gKGIueSArIGIuaC8yLjApKSAqIDIgPD0gKGEuaCArIGIuaCkpO1xyXG4gICAqL1xyXG59XHJcblxyXG5mdW5jdGlvbiBFeHRlbmRDYW52YXNDb250ZXh0ICggY3R4ICkge1xyXG4gICBjdHgudmlld0JCb3ggPSBuZXcgT2JqZWN0ICgpO1xyXG4gICBjdHgudmlld0JCb3gueCA9IC0xO1xyXG4gICBjdHgudmlld0JCb3gueSA9IC0xO1xyXG4gICBjdHgudmlld0JCb3gudyA9IDI1ODtcclxuICAgY3R4LnZpZXdCQm94LmggPSAyNTg7XHJcblxyXG4gICBjdHguX3RleHRCQm94ICA9IFsgXSA7XHJcbiAgIFxyXG4gICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY3R4KS5zZXRUZXhWaWV3Qm94ID0gZnVuY3Rpb24gKCB4LHksdyxoKSB7XHJcbiAgICAgIHRoaXMudmlld0JCb3gueCA9IHg7XHJcbiAgICAgIHRoaXMudmlld0JCb3gueSA9IHk7XHJcbiAgICAgIHRoaXMudmlld0JCb3gudyA9IHc7XHJcbiAgICAgIHRoaXMudmlld0JCb3guaCA9IGg7XHJcbiAgIH1cclxuICAgLypcclxuICAgT2JqZWN0LmdldFByb3RvdHlwZU9mKGN0eCkuZmlsbFRleHRPbkxpbmUgPSBmdW5jdGlvbiAoIHR4dCAsIGwgKSB7XHJcbiAgICAgIGN0eC5zYXZlKClcclxuICAgICAgY3R4LnRleHRCYXNlbGluZT1cIm1pZGRsZVwiO1xyXG4gICAgICBUZXh0T25MaW5lICggdGhpcywgbCwgdHh0LCB0cnVlICk7XHJcbiAgICAgIGN0eC5yZXN0b3JlKClcclxuICAgfVxyXG4gICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY3R4KS5zdHJva2VUZXh0T25MaW5lID0gZnVuY3Rpb24gKCB0eHQgLCBsICkge1xyXG4gICAgICBjdHguc2F2ZSgpXHJcbiAgICAgIGN0eC50ZXh0QmFzZWxpbmU9XCJtaWRkbGVcIjtcclxuICAgICAgVGV4dE9uTGluZSAoIHRoaXMsIGwsIHR4dCwgZmFsc2UgKTtcclxuICAgICAgY3R4LnJlc3RvcmUoKVxyXG4gICB9XHJcbiAgICovXHJcbiAgIE9iamVjdC5nZXRQcm90b3R5cGVPZihjdHgpLmZpbGxUZXh0ID0gZnVuY3Rpb24gKCB0eHQgLCBsICwgY3V0U2l6ZSwgY2VudGVyLCB0cmFuc2xhdGUsY29sbGlzaW9uRGV0ZWN0aW9uKSB7XHJcbiAgICAgIHZhciBmbmFtZSA9IHRoaXMuZm9udFBhcmFtc1tcImZhbWlseVwiXS5yZXBsYWNlICggLyheW1wiJyBcXHRdKXwoW1wiJyBcXHRdJCkvZywgXCJcIiApLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgIHZhciBfZm9udCA9IGdsb2JhbEZvbnRzLkdldChmbmFtZSx0aGlzLmZvbnRQYXJhbXNbXCJzdHlsZVwiXSx0aGlzLmZvbnRQYXJhbXNbXCJ3ZWlnaHRcIl0pO1xyXG4gICAgICBpZiAoIV9mb250KSB7XHJcbiAgICAgICAgIGNvbnNvbGUuZXJyb3IgKFwiZmlsbFRleHRPbkxpbmUyIDogZm9udCBlcnJvciAyXCIpO1xyXG4gICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHNjYWxlID0gWzEuMCwxLjBdO1xyXG4gICAgICBpZiAoJ19zeCcgaW4gY3R4ICkge1xyXG4gICAgICAgICBzY2FsZVswXSA9IGN0eC5fc3g7XHJcbiAgICAgICAgIHNjYWxlWzFdID0gY3R4Ll9zeTtcclxuICAgICAgfVxyXG4gICAgICB2YXIgX3NpemUgPSBuZXcgRm9udFNpemUgKCB0aGlzLmZvbnRQYXJhbXNbXCJzaXplXCJdICwgX2ZvbnQuYmFzZVNpemUgKTtcclxuICAgICAgdmFyIHR4dEN0eCA9IEluaXRSZW5kZXJUZXh0MiAodHh0ICwgX2ZvbnQsIF9zaXplLCAgbCAsIGN1dFNpemUsIGNlbnRlciwgdHJhbnNsYXRlLHNjYWxlKTtcclxuICAgICAgaWYgKCF0eHRDdHgpXHJcbiAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgc2tpcEl0ID0gZmFsc2VcclxuICAgICAgaWYgKGNvbGxpc2lvbkRldGVjdGlvblswXSkge1xyXG4gICAgICAgICBmb3IgKCBiIGluIHRoaXMuX3RleHRCQm94ICkge1xyXG4gICAgICAgICAgICBpZiAoIEJveGVzSW50ZXJzZWN0ICggdGhpcy5fdGV4dEJCb3hbYl0gLCB0eHRDdHguYmJveCApICkge1xyXG4gICAgICAgICAgICAgICBza2lwSXQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmICghc2tpcEl0KSB7XHJcbiAgICAgICAgIGlmIChjb2xsaXNpb25EZXRlY3Rpb25bMV0pXHJcbiAgICAgICAgICAgIHRoaXMuX3RleHRCQm94LnB1c2godHh0Q3R4LmJib3gpXHJcbiAgICAgICAgIGlmICggIEJveGVzSW50ZXJzZWN0ICggdGhpcy52aWV3QkJveCAsIHR4dEN0eC5iYm94ICkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZSgpXHJcbiAgICAgICAgICAgIFJlbmRlclRleHRDdWZvbiAoIHR4dEN0eCAsIF9mb250ICx0aGlzICwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVzdG9yZSgpXHJcbiAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gIXNraXBJdDtcclxuICAgfVxyXG4gICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY3R4KS5zdHJva2VUZXh0ID0gZnVuY3Rpb24gKCB0eHQgLCBsICwgY3V0U2l6ZSwgY2VudGVyLCB0cmFuc2xhdGUsY29sbGlzaW9uRGV0ZWN0aW9uKSB7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgZm5hbWUgPSB0aGlzLmZvbnRQYXJhbXNbXCJmYW1pbHlcIl0ucmVwbGFjZSAoIC8oXltcIicgXFx0XSl8KFtcIicgXFx0XSQpL2csIFwiXCIgKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICB2YXIgX2ZvbnQgPSBnbG9iYWxGb250cy5HZXQoZm5hbWUsdGhpcy5mb250UGFyYW1zW1wic3R5bGVcIl0sdGhpcy5mb250UGFyYW1zW1wid2VpZ2h0XCJdKTtcclxuICAgICAgaWYgKCFfZm9udCkge1xyXG4gICAgICAgICBjb25zb2xlLmVycm9yIChcImZpbGxUZXh0T25MaW5lMiA6IGZvbnQgZXJyb3IgMlwiKTtcclxuICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBzY2FsZSA9IFsxLjAsMS4wXTtcclxuICAgICAgaWYgKCdfc3gnIGluIGN0eCApIHtcclxuICAgICAgICAgc2NhbGVbMF0gPSBjdHguX3N4O1xyXG4gICAgICAgICBzY2FsZVsxXSA9IGN0eC5fc3k7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIF9zaXplID0gbmV3IEZvbnRTaXplICggdGhpcy5mb250UGFyYW1zW1wic2l6ZVwiXSAsIF9mb250LmJhc2VTaXplICk7XHJcbiAgICAgIHZhciB0eHRDdHggPSBJbml0UmVuZGVyVGV4dDIgKHR4dCAsIF9mb250LCBfc2l6ZSwgbCAsIGN1dFNpemUsIGNlbnRlciwgdHJhbnNsYXRlLHNjYWxlKTtcclxuICAgICAgaWYgKCF0eHRDdHgpXHJcbiAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgc2tpcEl0ID0gZmFsc2VcclxuICAgICAgaWYgKGNvbGxpc2lvbkRldGVjdGlvblswXSkge1xyXG4gICAgICAgICBmb3IgKCBiIGluIHRoaXMuX3RleHRCQm94ICkge1xyXG4gICAgICAgICAgICBpZiAoIEJveGVzSW50ZXJzZWN0ICggdGhpcy5fdGV4dEJCb3hbYl0gLCB0eHRDdHguYmJveCApICkge1xyXG4gICAgICAgICAgICAgICBza2lwSXQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmICghc2tpcEl0KSB7XHJcbiAgICAgICAgIGlmIChjb2xsaXNpb25EZXRlY3Rpb25bMV0pIFxyXG4gICAgICAgICAgICB0aGlzLl90ZXh0QkJveC5wdXNoKHR4dEN0eC5iYm94KVxyXG4gICAgICAgICBpZiAoICBCb3hlc0ludGVyc2VjdCAoIHRoaXMudmlld0JCb3ggLCB0eHRDdHguYmJveCApICkge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmUoKVxyXG4gICAgICAgICAgICBSZW5kZXJUZXh0Q3Vmb24gKCB0eHRDdHggLCBfZm9udCAsIHRoaXMgICwgZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc3RvcmUoKVxyXG4gICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuICFza2lwSXQ7XHJcbiAgIH1cclxuICAgXHJcbiAgIE9iamVjdC5nZXRQcm90b3R5cGVPZihjdHgpLnN0cm9rZUFuZEZpbGxUZXh0ID0gZnVuY3Rpb24gKCB0eHQgLCBsICwgY3V0U2l6ZSwgY2VudGVyLCB0cmFuc2xhdGUgLCBjb2xsaXNpb25EZXRlY3Rpb24pIHtcclxuICAgICAgdmFyIGZuYW1lID0gdGhpcy5mb250UGFyYW1zW1wiZmFtaWx5XCJdLnJlcGxhY2UgKCAvKF5bXCInIFxcdF0pfChbXCInIFxcdF0kKS9nLCBcIlwiICkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgdmFyIF9mb250ID0gZ2xvYmFsRm9udHMuR2V0KGZuYW1lLHRoaXMuZm9udFBhcmFtc1tcInN0eWxlXCJdLHRoaXMuZm9udFBhcmFtc1tcIndlaWdodFwiXSk7XHJcbiAgICAgIGlmICghX2ZvbnQpIHtcclxuICAgICAgICAgY29uc29sZS5lcnJvciAoXCJmaWxsVGV4dE9uTGluZTIgOiBmb250IGVycm9yIDJcIik7XHJcbiAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICB2YXIgc2NhbGUgPSBbMS4wLDEuMF07XHJcbiAgICAgIGlmICgnX3N4JyBpbiB0aGlzICkge1xyXG4gICAgICAgICBzY2FsZVswXSA9IHRoaXMuX3N4O1xyXG4gICAgICAgICBzY2FsZVsxXSA9IHRoaXMuX3N5O1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBfc2l6ZSA9IG5ldyBGb250U2l6ZSAoIHRoaXMuZm9udFBhcmFtc1tcInNpemVcIl0gLCBfZm9udC5iYXNlU2l6ZSApO1xyXG4gICAgICB2YXIgdHh0Q3R4ID0gSW5pdFJlbmRlclRleHQyICh0eHQgLCBfZm9udCwgX3NpemUsIGwgLCBjdXRTaXplLCBjZW50ZXIsIHRyYW5zbGF0ZSxzY2FsZSk7XHJcbiAgICAgIGlmICghdHh0Q3R4KVxyXG4gICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIHZhciBza2lwSXQgPSBmYWxzZVxyXG4gICAgICBpZiAoY29sbGlzaW9uRGV0ZWN0aW9uWzBdKSB7XHJcbiAgICAgICAgIGZvciAoIHZhciBiID0gMDsgYiA8IHRoaXMuX3RleHRCQm94Lmxlbmd0aDsgYisrICkge1xyXG4gICAgICAgICAgICBpZiAoIEJveGVzSW50ZXJzZWN0ICggdGhpcy5fdGV4dEJCb3hbYl0gLCB0eHRDdHguYmJveCApICkge1xyXG4gICAgICAgICAgICAgICBza2lwSXQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmICghc2tpcEl0KSB7XHJcbiAgICAgICAgIGlmIChjb2xsaXNpb25EZXRlY3Rpb25bMV0pXHJcbiAgICAgICAgICAgIHRoaXMuX3RleHRCQm94LnB1c2godHh0Q3R4LmJib3gpXHJcbiAgICAgICAgIFxyXG4gICAgICAgICBpZiAoICBCb3hlc0ludGVyc2VjdCAoIHRoaXMudmlld0JCb3ggLCB0eHRDdHguYmJveCApICkge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmUoKVxyXG4gICAgICAgICAgICAvKnRoaXMuZmlsbFN0eWxlPVwicmdiYSgyNTUsMCwwLDEpXCI7XHJcbiAgICAgICAgICAgIHRoaXMucmVjdCh0eHRDdHguYmJveC54LHR4dEN0eC5iYm94LnksdHh0Q3R4LmJib3gudyx0eHRDdHguYmJveC5oKTtcclxuICAgICAgICAgICAgdGhpcy5maWxsICgpKi9cclxuICAgICAgICAgICAgUmVuZGVyVGV4dEN1Zm9uICggdHh0Q3R4ICwgX2ZvbnQgLCB0aGlzICAsIGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy5yZXN0b3JlKClcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IHR4dEN0eC5mbC5sZW5ndGggOyBpPWkrMSApXHJcbiAgICAgICAgICAgICAgIHR4dEN0eC5mbFtpXS5SZXNldCgpXHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZSgpXHJcbiAgICAgICAgICAgIFJlbmRlclRleHRDdWZvbiAoIHR4dEN0eCAsIF9mb250ICwgdGhpcyAgLCB0cnVlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMucmVzdG9yZSgpXHJcbiAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gIXNraXBJdDtcclxuICAgICAgLyplbHNlIHtcclxuICAgICAgICAgdGhpcy5zYXZlKClcclxuICAgICAgICAgdGhpcy5maWxsU3R5bGU9XCJyZ2JhKDAsMjU1LDAsMSlcIjtcclxuICAgICAgICAgdGhpcy5maWxsUmVjdCh0eHRDdHguYmJveC54LHR4dEN0eC5iYm94LnksdHh0Q3R4LmJib3gudyx0eHRDdHguYmJveC5oKTtcclxuICAgICAgICAgdGhpcy5yZXN0b3JlKClcclxuICAgICAgfSovXHJcbiAgIH1cclxuICAgXHJcbiAgIFxyXG4gICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY3R4KS5TZXRGb250ID0gZnVuY3Rpb24gKCBjc3Nmb250ICkge1xyXG4gICAgICB0aGlzLmZvbnQgICA9IGNzc2ZvbnQ7XHJcbiAgICAgIHZhciAkdGVzdCAgID0gJCgnPHNwYW4gLz4nKS5hcHBlbmRUbygnYm9keScpO1xyXG4gICAgICAkdGVzdC5jc3MoJ2ZvbnQnLCBjc3Nmb250KTtcclxuICAgICAgLy9jb25zb2xlLmxvZygkdGVzdC5jc3MoJ2ZvbnRXZWlnaHQnKSk7Y29uc29sZS5sb2coJHRlc3QuY3NzKCdmb250U3R5bGUnKSk7Y29uc29sZS5sb2coJHRlc3QuY3NzKCdmb250VmFyaWFudCcpKTtjb25zb2xlLmxvZygkdGVzdC5jc3MoJ2ZvbnRTaXplJykpO2NvbnNvbGUubG9nKCR0ZXN0LmNzcygnbGluZUhlaWdodCcpKTtjb25zb2xlLmxvZygkdGVzdC5jc3MoJ2ZvbnRGYW1pbHknKSk7XHJcbiAgICAgIHZhciBmYW1pbHkgPSAkdGVzdC5jc3MoJ2ZvbnRGYW1pbHknKTtcclxuICAgICAgdmFyIHNpemUgICA9IHBhcnNlSW50ICggJHRlc3QuY3NzKCdmb250U2l6ZScpICk7XHJcbiAgICAgIHZhciB3ZWlnaHQgPSAkdGVzdC5jc3MoJ2ZvbnRXZWlnaHQnKTtcclxuICAgICAgdmFyIHN0eWxlICA9ICR0ZXN0LmNzcygnZm9udFN0eWxlJyk7ICAgICAgXHJcbiAgICAgIHRoaXMuZm9udFBhcmFtcyA9IHsgXCJmYW1pbHlcIjpmYW1pbHksIFwic2l6ZVwiOnNpemUsIFwid2VpZ2h0XCI6d2VpZ2h0LCBcInN0eWxlXCI6c3R5bGUgfTtcclxuICAgICAgJHRlc3QucmVtb3ZlKCk7XHJcbiAgIH1cclxuICAgXHJcbn1cclxuXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEV4dGVuZENhbnZhc0NvbnRleHQ7XHJcbiIsIlxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9wb2ludC5qcycpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbmZ1bmN0aW9uIENvb3JkaW5hdGVTeXN0ZW0gKCBpblRpbGVTaXplICkge1xuICAgIHRoaXMudGlsZVNpemUgICAgICAgICAgID0gaW5UaWxlU2l6ZTtcbiAgICB0aGlzLmluaXRpYWxSZXNvbHV0aW9uICA9IDIgKiBNYXRoLlBJICogNjM3ODEzNyAvIGluVGlsZVNpemU7ICAgLy8jIDE1NjU0My4wMzM5MjgwNDA2MiBmb3IgdGlsZVNpemUgMjU2IHBpeGVsc1xuICAgIHRoaXMub3JpZ2luU2hpZnQgICAgICAgID0gMiAqIE1hdGguUEkqIDYzNzgxMzcgLyAyLjAgO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbi8vXCJDb252ZXJ0cyBnaXZlbiBsYXQvbG9uIGluIFdHUzg0IERhdHVtIHRvIFhZIGluIFNwaGVyaWNhbCBNZXJjYXRvciBFUFNHOjkwMDkxM1wiXG5Db29yZGluYXRlU3lzdGVtLnByb3RvdHlwZS5MYXRMb25Ub01ldGVycyA9IGZ1bmN0aW9uICggbGF0LCBsb24gKSB7XG4gICAgbXggPSBsb24gKiB0aGlzLm9yaWdpblNoaWZ0IC8gMTgwLjAgO1xuICAgIG15ID0gTWF0aC5sb2coIE1hdGgudGFuKCg5MCArIGxhdCkgKiBNYXRoLlBJIC8gMzYwLjAgKSkgLyAoTWF0aC5QSSAvIDE4MC4wKSA7XG4gICAgbXkgPSBteSAqIHRoaXMub3JpZ2luU2hpZnQgLyAxODAuMCA7XG4gICAgcmV0dXJuIG5ldyBQb2ludChteCxteSk7XG59XG5cbi8vXCJDb252ZXJ0cyBYWSBwb2ludCBmcm9tIFNwaGVyaWNhbCBNZXJjYXRvciBFUFNHOjkwMDkxMyB0byBsYXQvbG9uIGluIFdHUzg0IERhdHVtXCJcbkNvb3JkaW5hdGVTeXN0ZW0ucHJvdG90eXBlLk1ldGVyc1RvTGF0TG9uID0gZnVuY3Rpb24gKCBteCwgbXkgKSB7XG4gICAgbG9uID0gKG14IC8gdGhpcy5vcmlnaW5TaGlmdCkgKiAxODAuMCA7XG4gICAgbGF0ID0gKG15IC8gdGhpcy5vcmlnaW5TaGlmdCkgKiAxODAuMCA7XG4gICAgbGF0ID0gMTgwIC8gTWF0aC5QSSAqICgyICogTWF0aC5hdGFuKCBNYXRoLmV4cCggbGF0ICogTWF0aC5QSSAvIDE4MC4wKSkgLSBNYXRoLlBJIC8gMi4wKSA7XG4gICAgcmV0dXJuIG5ldyBQb2ludCAobG9uLCBsYXQpIDtcbn1cblxuLy9cIkNvbnZlcnRzIHBpeGVsIGNvb3JkaW5hdGVzIGluIGdpdmVuIHpvb20gbGV2ZWwgb2YgcHlyYW1pZCB0byBFUFNHOjkwMDkxM1wiXG5Db29yZGluYXRlU3lzdGVtLnByb3RvdHlwZS5QaXhlbHNUb01ldGVycyA9IGZ1bmN0aW9uICggcHgsIHB5LCB6b29tKSB7XG4gICAgcmVzID0gdGhpcy5SZXNvbHV0aW9uKCB6b29tICk7XG4gICAgbXggID0gcHggKiByZXMgLSB0aGlzLm9yaWdpblNoaWZ0O1xuICAgIG15ICA9IHB5ICogcmVzIC0gdGhpcy5vcmlnaW5TaGlmdDtcbiAgICByZXR1cm4gbmV3IFBvaW50ICggbXgsIG15ICk7XG59XG5cbi8vXCJDb252ZXJ0cyBFUFNHOjkwMDkxMyB0byBweXJhbWlkIHBpeGVsIGNvb3JkaW5hdGVzIGluIGdpdmVuIHpvb20gbGV2ZWxcIiAgXG5Db29yZGluYXRlU3lzdGVtLnByb3RvdHlwZS5NZXRlcnNUb1BpeGVscyA9IGZ1bmN0aW9uICggbXgsIG15LCB6b29tKSB7XG4gICAgcmVzID0gdGhpcy5SZXNvbHV0aW9uKCB6b29tICk7XG4gICAgcHggPSAobXggKyB0aGlzLm9yaWdpblNoaWZ0KSAvIHJlcztcbiAgICBweSA9IChteSArIHRoaXMub3JpZ2luU2hpZnQpIC8gcmVzO1xuICAgIHJldHVybiBuZXcgUG9pbnQgKCBweCwgcHkgKTtcbn1cblxuQ29vcmRpbmF0ZVN5c3RlbS5wcm90b3R5cGUuTWV0ZXJzVG9QaXhlbHNBY2N1cmF0ZSA9IGZ1bmN0aW9uICggbXgsIG15LCB6b29tICkge1xuXG4gICAgdmFyIGxhdCA9IHRoaXMuTWV0ZXJzVG9MYXRMb24obXgsIG15KS55O1xuICAgIHJlcyA9IHRoaXMuUmVzb2x1dGlvbkJ5TGF0KCB6b29tLCBsYXQgKTtcblxuICAgIHB4ID0gKG14ICsgdGhpcy5vcmlnaW5TaGlmdCkgLyByZXM7XG4gICAgcHkgPSAobXkgKyB0aGlzLm9yaWdpblNoaWZ0KSAvIHJlcztcbiAgICByZXR1cm4gbmV3IFBvaW50ICggcHgsIHB5ICk7XG59XG5cbi8vXCJSZXR1cm5zIGEgdGlsZSBjb3ZlcmluZyByZWdpb24gaW4gZ2l2ZW4gcGl4ZWwgY29vcmRpbmF0ZXNcIlxuQ29vcmRpbmF0ZVN5c3RlbS5wcm90b3R5cGUuUGl4ZWxzVG9UaWxlID0gZnVuY3Rpb24gKCBweCwgcHkpIHtcbiAgICB0eCA9IE1hdGguZmxvb3IoIE1hdGguY2VpbCggcHggLyB0aGlzLnRpbGVTaXplICkgLSAxICk7XG4gICAgdHkgPSBNYXRoLmZsb29yKCBNYXRoLmNlaWwoIHB5IC8gdGhpcy50aWxlU2l6ZSApIC0gMSApO1xuICAgIHJldHVybiBuZXcgUG9pbnQgKCB0eCwgdHkgKTtcbn1cblxuLy9cIk1vdmUgdGhlIG9yaWdpbiBvZiBwaXhlbCBjb29yZGluYXRlcyB0byB0b3AtbGVmdCBjb3JuZXJcIlxuQ29vcmRpbmF0ZVN5c3RlbS5wcm90b3R5cGUuUGl4ZWxzVG9SYXN0ZXIgPSBmdW5jdGlvbiAoIHB4LCBweSwgem9vbSkge1xuICAgIG1hcFNpemUgPSB0aGlzLnRpbGVTaXplICogTWF0aC5wb3cgKCAyICwgem9vbSApO1xuICAgIHJldHVybiBuZXcgUG9pbnQgKCBweCwgbWFwU2l6ZSAtIHB5ICk7XG59XG5cbi8vXCJSZXR1cm5zIHRpbGUgZm9yIGdpdmVuIG1lcmNhdG9yIGNvb3JkaW5hdGVzXCJcbkNvb3JkaW5hdGVTeXN0ZW0ucHJvdG90eXBlLk1ldGVyc1RvVGlsZSA9IGZ1bmN0aW9uICggbXgsIG15LCB6b29tKSB7XG4gICAgcCA9IHRoaXMuTWV0ZXJzVG9QaXhlbHMoIG14LCBteSwgem9vbSk7XG4gICAgcmV0dXJuIHRoaXMuUGl4ZWxzVG9UaWxlKCBwLngsIHAueSApIDtcbn1cbi8qXG4vL1wiUmV0dXJucyBib3VuZHMgb2YgdGhlIGdpdmVuIHRpbGUgaW4gRVBTRzo5MDA5MTMgY29vcmRpbmF0ZXNcIlxuQ29vcmRpbmF0ZVN5c3RlbS5wcm90b3R5cGUuVGlsZUJvdW5kcyA9IGZ1bmN0aW9uICggdHgsIHR5LCB6b29tKSB7XG4gIG1pbiA9IHRoaXMuUGl4ZWxzVG9NZXRlcnMoIHR4KnRoaXMudGlsZVNpemUsIHR5KnRoaXMudGlsZVNpemUsIHpvb20gKVxuICBtYXggPSB0aGlzLlBpeGVsc1RvTWV0ZXJzKCAodHgrMSkqdGhpcy50aWxlU2l6ZSwgKHR5KzEpKnRoaXMudGlsZVNpemUsIHpvb20gKVxuICByZXR1cm4gKCBtaW54LCBtaW55LCBtYXh4LCBtYXh5IClcbn1cblxuQ29vcmRpbmF0ZVN5c3RlbS5wcm90b3R5cGUuVGlsZUxhdExvbkJvdW5kcyA9IGZ1bmN0aW9uICggdHgsIHR5LCB6b29tICk6XG4gIFwiUmV0dXJucyBib3VuZHMgb2YgdGhlIGdpdmVuIHRpbGUgaW4gbGF0dXR1ZGUvbG9uZ2l0dWRlIHVzaW5nIFdHUzg0IGRhdHVtXCJcblxuICBib3VuZHMgPSB0aGlzLlRpbGVCb3VuZHMoIHR4LCB0eSwgem9vbSlcbiAgbWluTGF0LCBtaW5Mb24gPSB0aGlzLk1ldGVyc1RvTGF0TG9uKGJvdW5kc1swXSwgYm91bmRzWzFdKVxuICBtYXhMYXQsIG1heExvbiA9IHRoaXMuTWV0ZXJzVG9MYXRMb24oYm91bmRzWzJdLCBib3VuZHNbM10pXG5cbiAgcmV0dXJuICggbWluTGF0LCBtaW5Mb24sIG1heExhdCwgbWF4TG9uIClcbiAqL1xuLy9cIlJlc29sdXRpb24gKG1ldGVycy9waXhlbCkgZm9yIGdpdmVuIHpvb20gbGV2ZWwgKG1lYXN1cmVkIGF0IEVxdWF0b3IpXCIgIFxuXG5Db29yZGluYXRlU3lzdGVtLnByb3RvdHlwZS5SZXNvbHV0aW9uID0gZnVuY3Rpb24gKCB6b29tICkge1xuICAgIHJldHVybiB0aGlzLmluaXRpYWxSZXNvbHV0aW9uIC8gTWF0aC5wb3cgKCAyICwgem9vbSk7XG59XG5cbkNvb3JkaW5hdGVTeXN0ZW0ucHJvdG90eXBlLlJlc29sdXRpb25CeUxhdCA9IGZ1bmN0aW9uICggem9vbSwgbGF0ICkge1xuICAgIHZhciBSID0gNjM3OCAqIE1hdGguY29zKChsYXQvMTgwKSpNYXRoLlBJKTtcbiAgICByZXR1cm4gKDIgKiBNYXRoLlBJICogUioxMDAwIC8gdGhpcy50aWxlU2l6ZSkgLyBNYXRoLnBvdyAoIDIgLCB6b29tKTtcbn1cblxuLyogIFxuQ29vcmRpbmF0ZVN5c3RlbS5wcm90b3R5cGUuWm9vbUZvclBpeGVsU2l6ZSA9IGZ1bmN0aW9uICggcGl4ZWxTaXplICk6XG4gIFwiTWF4aW1hbCBzY2FsZWRvd24gem9vbSBvZiB0aGUgcHlyYW1pZCBjbG9zZXN0IHRvIHRoZSBwaXhlbFNpemUuXCJcblxuICBmb3IgaSBpbiByYW5nZSgzMCk6XG4gICAgICBpZiBwaXhlbFNpemUgPiB0aGlzLlJlc29sdXRpb24oaSk6XG4gICAgICAgICAgcmV0dXJuIGktMSBpZiBpIT0wIGVsc2UgMCAjIFdlIGRvbid0IHdhbnQgdG8gc2NhbGUgdXBcbiAqL1xuXG4vL1wiQ29udmVydHMgVE1TIHRpbGUgY29vcmRpbmF0ZXMgdG8gR29vZ2xlIFRpbGUgY29vcmRpbmF0ZXNcIlxuQ29vcmRpbmF0ZVN5c3RlbS5wcm90b3R5cGUuR29vZ2xlVGlsZSA9IGZ1bmN0aW9uICggdHgsIHR5LCB6b29tKSB7XG4gICAgLy9jb29yZGluYXRlIG9yaWdpbiBpcyBtb3ZlZCBmcm9tIGJvdHRvbS1sZWZ0IHRvIHRvcC1sZWZ0IGNvcm5lciBvZiB0aGUgZXh0ZW50XG4gICAgcmV0dXJuIG5ldyBQb2ludCAoIHR4LCAoTWF0aC5wb3cgKCAyLHpvb20gKSAtIDEpIC0gdHkgKTtcblxufVxuXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxubW9kdWxlLmV4cG9ydHMgPSBDb29yZGluYXRlU3lzdGVtO1xuXG4vKlxuQ29vcmRpbmF0ZVN5c3RlbS5wcm90b3R5cGUuUXVhZFRyZWUgPSBmdW5jdGlvbiAoIHR4LCB0eSwgem9vbSApOlxuICBcIkNvbnZlcnRzIFRNUyB0aWxlIGNvb3JkaW5hdGVzIHRvIE1pY3Jvc29mdCBRdWFkVHJlZVwiXG5cbiAgcXVhZEtleSA9IFwiXCJcbiAgdHkgPSAoMioqem9vbSAtIDEpIC0gdHlcbiAgZm9yIGkgaW4gcmFuZ2Uoem9vbSwgMCwgLTEpOlxuICAgICAgZGlnaXQgPSAwXG4gICAgICBtYXNrID0gMSA8PCAoaS0xKVxuICAgICAgaWYgKHR4ICYgbWFzaykgIT0gMDpcbiAgICAgICAgICBkaWdpdCArPSAxXG4gICAgICBpZiAodHkgJiBtYXNrKSAhPSAwOlxuICAgICAgICAgIGRpZ2l0ICs9IDJcbiAgICAgIHF1YWRLZXkgKz0gc3RyKGRpZ2l0KVxuXG4gIHJldHVybiBxdWFkS2V5XG4gKi8iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyBnbC1tYXRyaXggMS4zLjcgLSBodHRwczovL2dpdGh1Yi5jb20vdG9qaS9nbC1tYXRyaXgvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxyXG4oZnVuY3Rpb24odyxEKXtcIm9iamVjdFwiPT09dHlwZW9mIGV4cG9ydHM/bW9kdWxlLmV4cG9ydHM9RChnbG9iYWwpOlwiZnVuY3Rpb25cIj09PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQ/ZGVmaW5lKFtdLGZ1bmN0aW9uKCl7cmV0dXJuIEQodyl9KTpEKHcpfSkodGhpcyxmdW5jdGlvbih3KXtmdW5jdGlvbiBEKGEpe3JldHVybiBvPWF9ZnVuY3Rpb24gRygpe3JldHVybiBvPVwidW5kZWZpbmVkXCIhPT10eXBlb2YgRmxvYXQzMkFycmF5P0Zsb2F0MzJBcnJheTpBcnJheX12YXIgRT17fTsoZnVuY3Rpb24oKXtpZihcInVuZGVmaW5lZFwiIT10eXBlb2YgRmxvYXQzMkFycmF5KXt2YXIgYT1uZXcgRmxvYXQzMkFycmF5KDEpLGI9bmV3IEludDMyQXJyYXkoYS5idWZmZXIpO0UuaW52c3FydD1mdW5jdGlvbihjKXthWzBdPWM7YlswXT0xNTk3NDYzMDA3LShiWzBdPj4xKTt2YXIgZD1hWzBdO3JldHVybiBkKigxLjUtMC41KmMqZCpkKX19ZWxzZSBFLmludnNxcnQ9ZnVuY3Rpb24oYSl7cmV0dXJuIDEvXHJcbk1hdGguc3FydChhKX19KSgpO3ZhciBvPW51bGw7RygpO3ZhciByPXtjcmVhdGU6ZnVuY3Rpb24oYSl7dmFyIGI9bmV3IG8oMyk7YT8oYlswXT1hWzBdLGJbMV09YVsxXSxiWzJdPWFbMl0pOmJbMF09YlsxXT1iWzJdPTA7cmV0dXJuIGJ9LGNyZWF0ZUZyb206ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPW5ldyBvKDMpO2RbMF09YTtkWzFdPWI7ZFsyXT1jO3JldHVybiBkfSxzZXQ6ZnVuY3Rpb24oYSxiKXtiWzBdPWFbMF07YlsxXT1hWzFdO2JbMl09YVsyXTtyZXR1cm4gYn0sZXF1YWw6ZnVuY3Rpb24oYSxiKXtyZXR1cm4gYT09PWJ8fDEuMEUtNj5NYXRoLmFicyhhWzBdLWJbMF0pJiYxLjBFLTY+TWF0aC5hYnMoYVsxXS1iWzFdKSYmMS4wRS02Pk1hdGguYWJzKGFbMl0tYlsyXSl9LGFkZDpmdW5jdGlvbihhLGIsYyl7aWYoIWN8fGE9PT1jKXJldHVybiBhWzBdKz1iWzBdLGFbMV0rPWJbMV0sYVsyXSs9YlsyXSxhO2NbMF09YVswXStiWzBdO2NbMV09YVsxXStiWzFdO2NbMl09YVsyXStiWzJdO1xyXG5yZXR1cm4gY30sc3VidHJhY3Q6ZnVuY3Rpb24oYSxiLGMpe2lmKCFjfHxhPT09YylyZXR1cm4gYVswXS09YlswXSxhWzFdLT1iWzFdLGFbMl0tPWJbMl0sYTtjWzBdPWFbMF0tYlswXTtjWzFdPWFbMV0tYlsxXTtjWzJdPWFbMl0tYlsyXTtyZXR1cm4gY30sbXVsdGlwbHk6ZnVuY3Rpb24oYSxiLGMpe2lmKCFjfHxhPT09YylyZXR1cm4gYVswXSo9YlswXSxhWzFdKj1iWzFdLGFbMl0qPWJbMl0sYTtjWzBdPWFbMF0qYlswXTtjWzFdPWFbMV0qYlsxXTtjWzJdPWFbMl0qYlsyXTtyZXR1cm4gY30sbmVnYXRlOmZ1bmN0aW9uKGEsYil7Ynx8KGI9YSk7YlswXT0tYVswXTtiWzFdPS1hWzFdO2JbMl09LWFbMl07cmV0dXJuIGJ9LHNjYWxlOmZ1bmN0aW9uKGEsYixjKXtpZighY3x8YT09PWMpcmV0dXJuIGFbMF0qPWIsYVsxXSo9YixhWzJdKj1iLGE7Y1swXT1hWzBdKmI7Y1sxXT1hWzFdKmI7Y1syXT1hWzJdKmI7cmV0dXJuIGN9LG5vcm1hbGl6ZTpmdW5jdGlvbihhLGIpe2J8fChiPWEpO3ZhciBjPVxyXG5hWzBdLGQ9YVsxXSxlPWFbMl0sZz1NYXRoLnNxcnQoYypjK2QqZCtlKmUpO2lmKCFnKXJldHVybiBiWzBdPTAsYlsxXT0wLGJbMl09MCxiO2lmKDE9PT1nKXJldHVybiBiWzBdPWMsYlsxXT1kLGJbMl09ZSxiO2c9MS9nO2JbMF09YypnO2JbMV09ZCpnO2JbMl09ZSpnO3JldHVybiBifSxjcm9zczpmdW5jdGlvbihhLGIsYyl7Y3x8KGM9YSk7dmFyIGQ9YVswXSxlPWFbMV0sYT1hWzJdLGc9YlswXSxmPWJbMV0sYj1iWzJdO2NbMF09ZSpiLWEqZjtjWzFdPWEqZy1kKmI7Y1syXT1kKmYtZSpnO3JldHVybiBjfSxsZW5ndGg6ZnVuY3Rpb24oYSl7dmFyIGI9YVswXSxjPWFbMV0sYT1hWzJdO3JldHVybiBNYXRoLnNxcnQoYipiK2MqYythKmEpfSxzcXVhcmVkTGVuZ3RoOmZ1bmN0aW9uKGEpe3ZhciBiPWFbMF0sYz1hWzFdLGE9YVsyXTtyZXR1cm4gYipiK2MqYythKmF9LGRvdDpmdW5jdGlvbihhLGIpe3JldHVybiBhWzBdKmJbMF0rYVsxXSpiWzFdK2FbMl0qYlsyXX0sZGlyZWN0aW9uOmZ1bmN0aW9uKGEsXHJcbmIsYyl7Y3x8KGM9YSk7dmFyIGQ9YVswXS1iWzBdLGU9YVsxXS1iWzFdLGE9YVsyXS1iWzJdLGI9TWF0aC5zcXJ0KGQqZCtlKmUrYSphKTtpZighYilyZXR1cm4gY1swXT0wLGNbMV09MCxjWzJdPTAsYztiPTEvYjtjWzBdPWQqYjtjWzFdPWUqYjtjWzJdPWEqYjtyZXR1cm4gY30sbGVycDpmdW5jdGlvbihhLGIsYyxkKXtkfHwoZD1hKTtkWzBdPWFbMF0rYyooYlswXS1hWzBdKTtkWzFdPWFbMV0rYyooYlsxXS1hWzFdKTtkWzJdPWFbMl0rYyooYlsyXS1hWzJdKTtyZXR1cm4gZH0sZGlzdDpmdW5jdGlvbihhLGIpe3ZhciBjPWJbMF0tYVswXSxkPWJbMV0tYVsxXSxlPWJbMl0tYVsyXTtyZXR1cm4gTWF0aC5zcXJ0KGMqYytkKmQrZSplKX19LEg9bnVsbCx5PW5ldyBvKDQpO3IudW5wcm9qZWN0PWZ1bmN0aW9uKGEsYixjLGQsZSl7ZXx8KGU9YSk7SHx8KEg9eC5jcmVhdGUoKSk7dmFyIGc9SDt5WzBdPTIqKGFbMF0tZFswXSkvZFsyXS0xO3lbMV09MiooYVsxXS1kWzFdKS9kWzNdLTE7eVsyXT1cclxuMiphWzJdLTE7eVszXT0xO3gubXVsdGlwbHkoYyxiLGcpO2lmKCF4LmludmVyc2UoZykpcmV0dXJuIG51bGw7eC5tdWx0aXBseVZlYzQoZyx5KTtpZigwPT09eVszXSlyZXR1cm4gbnVsbDtlWzBdPXlbMF0veVszXTtlWzFdPXlbMV0veVszXTtlWzJdPXlbMl0veVszXTtyZXR1cm4gZX07dmFyIEw9ci5jcmVhdGVGcm9tKDEsMCwwKSxNPXIuY3JlYXRlRnJvbSgwLDEsMCksTj1yLmNyZWF0ZUZyb20oMCwwLDEpLHo9ci5jcmVhdGUoKTtyLnJvdGF0aW9uVG89ZnVuY3Rpb24oYSxiLGMpe2N8fChjPWsuY3JlYXRlKCkpO3ZhciBkPXIuZG90KGEsYik7aWYoMTw9ZClrLnNldChPLGMpO2Vsc2UgaWYoLTAuOTk5OTk5PmQpci5jcm9zcyhMLGEseiksMS4wRS02PnIubGVuZ3RoKHopJiZyLmNyb3NzKE0sYSx6KSwxLjBFLTY+ci5sZW5ndGgoeikmJnIuY3Jvc3MoTixhLHopLHIubm9ybWFsaXplKHopLGsuZnJvbUFuZ2xlQXhpcyhNYXRoLlBJLHosYyk7ZWxzZXt2YXIgZD1NYXRoLnNxcnQoMiooMStcclxuZCkpLGU9MS9kO3IuY3Jvc3MoYSxiLHopO2NbMF09elswXSplO2NbMV09elsxXSplO2NbMl09elsyXSplO2NbM109MC41KmQ7ay5ub3JtYWxpemUoYyl9MTxjWzNdP2NbM109MTotMT5jWzNdJiYoY1szXT0tMSk7cmV0dXJuIGN9O3Iuc3RyPWZ1bmN0aW9uKGEpe3JldHVyblwiW1wiK2FbMF0rXCIsIFwiK2FbMV0rXCIsIFwiK2FbMl0rXCJdXCJ9O3ZhciBBPXtjcmVhdGU6ZnVuY3Rpb24oYSl7dmFyIGI9bmV3IG8oOSk7YT8oYlswXT1hWzBdLGJbMV09YVsxXSxiWzJdPWFbMl0sYlszXT1hWzNdLGJbNF09YVs0XSxiWzVdPWFbNV0sYls2XT1hWzZdLGJbN109YVs3XSxiWzhdPWFbOF0pOmJbMF09YlsxXT1iWzJdPWJbM109Yls0XT1iWzVdPWJbNl09Yls3XT1iWzhdPTA7cmV0dXJuIGJ9LGNyZWF0ZUZyb206ZnVuY3Rpb24oYSxiLGMsZCxlLGcsZixoLGope3ZhciBpPW5ldyBvKDkpO2lbMF09YTtpWzFdPWI7aVsyXT1jO2lbM109ZDtpWzRdPWU7aVs1XT1nO2lbNl09ZjtpWzddPWg7aVs4XT1qO3JldHVybiBpfSxcclxuZGV0ZXJtaW5hbnQ6ZnVuY3Rpb24oYSl7dmFyIGI9YVszXSxjPWFbNF0sZD1hWzVdLGU9YVs2XSxnPWFbN10sZj1hWzhdO3JldHVybiBhWzBdKihmKmMtZCpnKSthWzFdKigtZipiK2QqZSkrYVsyXSooZypiLWMqZSl9LGludmVyc2U6ZnVuY3Rpb24oYSxiKXt2YXIgYz1hWzBdLGQ9YVsxXSxlPWFbMl0sZz1hWzNdLGY9YVs0XSxoPWFbNV0saj1hWzZdLGk9YVs3XSxtPWFbOF0sbD1tKmYtaCppLEM9LW0qZytoKmoscT1pKmctZipqLG49YypsK2QqQytlKnE7aWYoIW4pcmV0dXJuIG51bGw7bj0xL247Ynx8KGI9QS5jcmVhdGUoKSk7YlswXT1sKm47YlsxXT0oLW0qZCtlKmkpKm47YlsyXT0oaCpkLWUqZikqbjtiWzNdPUMqbjtiWzRdPShtKmMtZSpqKSpuO2JbNV09KC1oKmMrZSpnKSpuO2JbNl09cSpuO2JbN109KC1pKmMrZCpqKSpuO2JbOF09KGYqYy1kKmcpKm47cmV0dXJuIGJ9LG11bHRpcGx5OmZ1bmN0aW9uKGEsYixjKXtjfHwoYz1hKTt2YXIgZD1hWzBdLGU9YVsxXSxnPWFbMl0sXHJcbmY9YVszXSxoPWFbNF0saj1hWzVdLGk9YVs2XSxtPWFbN10sYT1hWzhdLGw9YlswXSxDPWJbMV0scT1iWzJdLG49YlszXSxrPWJbNF0scD1iWzVdLG89Yls2XSxzPWJbN10sYj1iWzhdO2NbMF09bCpkK0MqZitxKmk7Y1sxXT1sKmUrQypoK3EqbTtjWzJdPWwqZytDKmorcSphO2NbM109bipkK2sqZitwKmk7Y1s0XT1uKmUraypoK3AqbTtjWzVdPW4qZytrKmorcCphO2NbNl09bypkK3MqZitiKmk7Y1s3XT1vKmUrcypoK2IqbTtjWzhdPW8qZytzKmorYiphO3JldHVybiBjfSxtdWx0aXBseVZlYzI6ZnVuY3Rpb24oYSxiLGMpe2N8fChjPWIpO3ZhciBkPWJbMF0sYj1iWzFdO2NbMF09ZCphWzBdK2IqYVszXSthWzZdO2NbMV09ZCphWzFdK2IqYVs0XSthWzddO3JldHVybiBjfSxtdWx0aXBseVZlYzM6ZnVuY3Rpb24oYSxiLGMpe2N8fChjPWIpO3ZhciBkPWJbMF0sZT1iWzFdLGI9YlsyXTtjWzBdPWQqYVswXStlKmFbM10rYiphWzZdO2NbMV09ZCphWzFdK2UqYVs0XStiKmFbN107Y1syXT1cclxuZCphWzJdK2UqYVs1XStiKmFbOF07cmV0dXJuIGN9LHNldDpmdW5jdGlvbihhLGIpe2JbMF09YVswXTtiWzFdPWFbMV07YlsyXT1hWzJdO2JbM109YVszXTtiWzRdPWFbNF07Yls1XT1hWzVdO2JbNl09YVs2XTtiWzddPWFbN107Yls4XT1hWzhdO3JldHVybiBifSxlcXVhbDpmdW5jdGlvbihhLGIpe3JldHVybiBhPT09Ynx8MS4wRS02Pk1hdGguYWJzKGFbMF0tYlswXSkmJjEuMEUtNj5NYXRoLmFicyhhWzFdLWJbMV0pJiYxLjBFLTY+TWF0aC5hYnMoYVsyXS1iWzJdKSYmMS4wRS02Pk1hdGguYWJzKGFbM10tYlszXSkmJjEuMEUtNj5NYXRoLmFicyhhWzRdLWJbNF0pJiYxLjBFLTY+TWF0aC5hYnMoYVs1XS1iWzVdKSYmMS4wRS02Pk1hdGguYWJzKGFbNl0tYls2XSkmJjEuMEUtNj5NYXRoLmFicyhhWzddLWJbN10pJiYxLjBFLTY+TWF0aC5hYnMoYVs4XS1iWzhdKX0saWRlbnRpdHk6ZnVuY3Rpb24oYSl7YXx8KGE9QS5jcmVhdGUoKSk7YVswXT0xO2FbMV09MDthWzJdPTA7YVszXT0wO1xyXG5hWzRdPTE7YVs1XT0wO2FbNl09MDthWzddPTA7YVs4XT0xO3JldHVybiBhfSx0cmFuc3Bvc2U6ZnVuY3Rpb24oYSxiKXtpZighYnx8YT09PWIpe3ZhciBjPWFbMV0sZD1hWzJdLGU9YVs1XTthWzFdPWFbM107YVsyXT1hWzZdO2FbM109YzthWzVdPWFbN107YVs2XT1kO2FbN109ZTtyZXR1cm4gYX1iWzBdPWFbMF07YlsxXT1hWzNdO2JbMl09YVs2XTtiWzNdPWFbMV07Yls0XT1hWzRdO2JbNV09YVs3XTtiWzZdPWFbMl07Yls3XT1hWzVdO2JbOF09YVs4XTtyZXR1cm4gYn0sdG9NYXQ0OmZ1bmN0aW9uKGEsYil7Ynx8KGI9eC5jcmVhdGUoKSk7YlsxNV09MTtiWzE0XT0wO2JbMTNdPTA7YlsxMl09MDtiWzExXT0wO2JbMTBdPWFbOF07Yls5XT1hWzddO2JbOF09YVs2XTtiWzddPTA7Yls2XT1hWzVdO2JbNV09YVs0XTtiWzRdPWFbM107YlszXT0wO2JbMl09YVsyXTtiWzFdPWFbMV07YlswXT1hWzBdO3JldHVybiBifSxzdHI6ZnVuY3Rpb24oYSl7cmV0dXJuXCJbXCIrYVswXStcIiwgXCIrYVsxXStcclxuXCIsIFwiK2FbMl0rXCIsIFwiK2FbM10rXCIsIFwiK2FbNF0rXCIsIFwiK2FbNV0rXCIsIFwiK2FbNl0rXCIsIFwiK2FbN10rXCIsIFwiK2FbOF0rXCJdXCJ9fSx4PXtjcmVhdGU6ZnVuY3Rpb24oYSl7dmFyIGI9bmV3IG8oMTYpO2EmJihiWzBdPWFbMF0sYlsxXT1hWzFdLGJbMl09YVsyXSxiWzNdPWFbM10sYls0XT1hWzRdLGJbNV09YVs1XSxiWzZdPWFbNl0sYls3XT1hWzddLGJbOF09YVs4XSxiWzldPWFbOV0sYlsxMF09YVsxMF0sYlsxMV09YVsxMV0sYlsxMl09YVsxMl0sYlsxM109YVsxM10sYlsxNF09YVsxNF0sYlsxNV09YVsxNV0pO3JldHVybiBifSxjcmVhdGVGcm9tOmZ1bmN0aW9uKGEsYixjLGQsZSxnLGYsaCxqLGksbSxsLEMscSxuLGspe3ZhciBwPW5ldyBvKDE2KTtwWzBdPWE7cFsxXT1iO3BbMl09YztwWzNdPWQ7cFs0XT1lO3BbNV09ZztwWzZdPWY7cFs3XT1oO3BbOF09ajtwWzldPWk7cFsxMF09bTtwWzExXT1sO3BbMTJdPUM7cFsxM109cTtwWzE0XT1uO3BbMTVdPWs7cmV0dXJuIHB9LHNldDpmdW5jdGlvbihhLFxyXG5iKXtiWzBdPWFbMF07YlsxXT1hWzFdO2JbMl09YVsyXTtiWzNdPWFbM107Yls0XT1hWzRdO2JbNV09YVs1XTtiWzZdPWFbNl07Yls3XT1hWzddO2JbOF09YVs4XTtiWzldPWFbOV07YlsxMF09YVsxMF07YlsxMV09YVsxMV07YlsxMl09YVsxMl07YlsxM109YVsxM107YlsxNF09YVsxNF07YlsxNV09YVsxNV07cmV0dXJuIGJ9LGVxdWFsOmZ1bmN0aW9uKGEsYil7cmV0dXJuIGE9PT1ifHwxLjBFLTY+TWF0aC5hYnMoYVswXS1iWzBdKSYmMS4wRS02Pk1hdGguYWJzKGFbMV0tYlsxXSkmJjEuMEUtNj5NYXRoLmFicyhhWzJdLWJbMl0pJiYxLjBFLTY+TWF0aC5hYnMoYVszXS1iWzNdKSYmMS4wRS02Pk1hdGguYWJzKGFbNF0tYls0XSkmJjEuMEUtNj5NYXRoLmFicyhhWzVdLWJbNV0pJiYxLjBFLTY+TWF0aC5hYnMoYVs2XS1iWzZdKSYmMS4wRS02Pk1hdGguYWJzKGFbN10tYls3XSkmJjEuMEUtNj5NYXRoLmFicyhhWzhdLWJbOF0pJiYxLjBFLTY+TWF0aC5hYnMoYVs5XS1iWzldKSYmMS4wRS02PlxyXG5NYXRoLmFicyhhWzEwXS1iWzEwXSkmJjEuMEUtNj5NYXRoLmFicyhhWzExXS1iWzExXSkmJjEuMEUtNj5NYXRoLmFicyhhWzEyXS1iWzEyXSkmJjEuMEUtNj5NYXRoLmFicyhhWzEzXS1iWzEzXSkmJjEuMEUtNj5NYXRoLmFicyhhWzE0XS1iWzE0XSkmJjEuMEUtNj5NYXRoLmFicyhhWzE1XS1iWzE1XSl9LGlkZW50aXR5OmZ1bmN0aW9uKGEpe2F8fChhPXguY3JlYXRlKCkpO2FbMF09MTthWzFdPTA7YVsyXT0wO2FbM109MDthWzRdPTA7YVs1XT0xO2FbNl09MDthWzddPTA7YVs4XT0wO2FbOV09MDthWzEwXT0xO2FbMTFdPTA7YVsxMl09MDthWzEzXT0wO2FbMTRdPTA7YVsxNV09MTtyZXR1cm4gYX0sdHJhbnNwb3NlOmZ1bmN0aW9uKGEsYil7aWYoIWJ8fGE9PT1iKXt2YXIgYz1hWzFdLGQ9YVsyXSxlPWFbM10sZz1hWzZdLGY9YVs3XSxoPWFbMTFdO2FbMV09YVs0XTthWzJdPWFbOF07YVszXT1hWzEyXTthWzRdPWM7YVs2XT1hWzldO2FbN109YVsxM107YVs4XT1kO2FbOV09ZzthWzExXT1cclxuYVsxNF07YVsxMl09ZTthWzEzXT1mO2FbMTRdPWg7cmV0dXJuIGF9YlswXT1hWzBdO2JbMV09YVs0XTtiWzJdPWFbOF07YlszXT1hWzEyXTtiWzRdPWFbMV07Yls1XT1hWzVdO2JbNl09YVs5XTtiWzddPWFbMTNdO2JbOF09YVsyXTtiWzldPWFbNl07YlsxMF09YVsxMF07YlsxMV09YVsxNF07YlsxMl09YVszXTtiWzEzXT1hWzddO2JbMTRdPWFbMTFdO2JbMTVdPWFbMTVdO3JldHVybiBifSxkZXRlcm1pbmFudDpmdW5jdGlvbihhKXt2YXIgYj1hWzBdLGM9YVsxXSxkPWFbMl0sZT1hWzNdLGc9YVs0XSxmPWFbNV0saD1hWzZdLGo9YVs3XSxpPWFbOF0sbT1hWzldLGw9YVsxMF0sQz1hWzExXSxxPWFbMTJdLG49YVsxM10saz1hWzE0XSxhPWFbMTVdO3JldHVybiBxKm0qaCplLWkqbipoKmUtcSpmKmwqZStnKm4qbCplK2kqZiprKmUtZyptKmsqZS1xKm0qZCpqK2kqbipkKmorcSpjKmwqai1iKm4qbCpqLWkqYyprKmorYiptKmsqaitxKmYqZCpDLWcqbipkKkMtcSpjKmgqQytiKm4qaCpDK1xyXG5nKmMqaypDLWIqZiprKkMtaSpmKmQqYStnKm0qZCphK2kqYypoKmEtYiptKmgqYS1nKmMqbCphK2IqZipsKmF9LGludmVyc2U6ZnVuY3Rpb24oYSxiKXtifHwoYj1hKTt2YXIgYz1hWzBdLGQ9YVsxXSxlPWFbMl0sZz1hWzNdLGY9YVs0XSxoPWFbNV0saj1hWzZdLGk9YVs3XSxtPWFbOF0sbD1hWzldLGs9YVsxMF0scT1hWzExXSxuPWFbMTJdLG89YVsxM10scD1hWzE0XSxyPWFbMTVdLHM9YypoLWQqZix2PWMqai1lKmYsdD1jKmktZypmLHU9ZCpqLWUqaCx3PWQqaS1nKmgseD1lKmktZypqLHk9bSpvLWwqbix6PW0qcC1rKm4sRj1tKnItcSpuLEE9bCpwLWsqbyxEPWwqci1xKm8sRT1rKnItcSpwLEI9cypFLXYqRCt0KkErdSpGLXcqeit4Knk7aWYoIUIpcmV0dXJuIG51bGw7Qj0xL0I7YlswXT0oaCpFLWoqRCtpKkEpKkI7YlsxXT0oLWQqRStlKkQtZypBKSpCO2JbMl09KG8qeC1wKncrcip1KSpCO2JbM109KC1sKngrayp3LXEqdSkqQjtiWzRdPSgtZipFK2oqRi1pKnopKkI7Yls1XT1cclxuKGMqRS1lKkYrZyp6KSpCO2JbNl09KC1uKngrcCp0LXIqdikqQjtiWzddPShtKngtayp0K3EqdikqQjtiWzhdPShmKkQtaCpGK2kqeSkqQjtiWzldPSgtYypEK2QqRi1nKnkpKkI7YlsxMF09KG4qdy1vKnQrcipzKSpCO2JbMTFdPSgtbSp3K2wqdC1xKnMpKkI7YlsxMl09KC1mKkEraCp6LWoqeSkqQjtiWzEzXT0oYypBLWQqeitlKnkpKkI7YlsxNF09KC1uKnUrbyp2LXAqcykqQjtiWzE1XT0obSp1LWwqditrKnMpKkI7cmV0dXJuIGJ9LHRvUm90YXRpb25NYXQ6ZnVuY3Rpb24oYSxiKXtifHwoYj14LmNyZWF0ZSgpKTtiWzBdPWFbMF07YlsxXT1hWzFdO2JbMl09YVsyXTtiWzNdPWFbM107Yls0XT1hWzRdO2JbNV09YVs1XTtiWzZdPWFbNl07Yls3XT1hWzddO2JbOF09YVs4XTtiWzldPWFbOV07YlsxMF09YVsxMF07YlsxMV09YVsxMV07YlsxMl09MDtiWzEzXT0wO2JbMTRdPTA7YlsxNV09MTtyZXR1cm4gYn0sdG9NYXQzOmZ1bmN0aW9uKGEsYil7Ynx8KGI9QS5jcmVhdGUoKSk7YlswXT1cclxuYVswXTtiWzFdPWFbMV07YlsyXT1hWzJdO2JbM109YVs0XTtiWzRdPWFbNV07Yls1XT1hWzZdO2JbNl09YVs4XTtiWzddPWFbOV07Yls4XT1hWzEwXTtyZXR1cm4gYn0sdG9JbnZlcnNlTWF0MzpmdW5jdGlvbihhLGIpe3ZhciBjPWFbMF0sZD1hWzFdLGU9YVsyXSxnPWFbNF0sZj1hWzVdLGg9YVs2XSxqPWFbOF0saT1hWzldLG09YVsxMF0sbD1tKmYtaCppLGs9LW0qZytoKmoscT1pKmctZipqLG49YypsK2QqaytlKnE7aWYoIW4pcmV0dXJuIG51bGw7bj0xL247Ynx8KGI9QS5jcmVhdGUoKSk7YlswXT1sKm47YlsxXT0oLW0qZCtlKmkpKm47YlsyXT0oaCpkLWUqZikqbjtiWzNdPWsqbjtiWzRdPShtKmMtZSpqKSpuO2JbNV09KC1oKmMrZSpnKSpuO2JbNl09cSpuO2JbN109KC1pKmMrZCpqKSpuO2JbOF09KGYqYy1kKmcpKm47cmV0dXJuIGJ9LG11bHRpcGx5OmZ1bmN0aW9uKGEsYixjKXtjfHwoYz1hKTt2YXIgZD1hWzBdLGU9YVsxXSxnPWFbMl0sZj1hWzNdLGg9YVs0XSxqPWFbNV0sXHJcbmk9YVs2XSxtPWFbN10sbD1hWzhdLGs9YVs5XSxxPWFbMTBdLG49YVsxMV0sbz1hWzEyXSxwPWFbMTNdLHI9YVsxNF0sYT1hWzE1XSxzPWJbMF0sdj1iWzFdLHQ9YlsyXSx1PWJbM107Y1swXT1zKmQrdipoK3QqbCt1Km87Y1sxXT1zKmUrdipqK3Qqayt1KnA7Y1syXT1zKmcrdippK3QqcSt1KnI7Y1szXT1zKmYrdiptK3Qqbit1KmE7cz1iWzRdO3Y9Yls1XTt0PWJbNl07dT1iWzddO2NbNF09cypkK3YqaCt0KmwrdSpvO2NbNV09cyplK3Yqait0KmsrdSpwO2NbNl09cypnK3YqaSt0KnErdSpyO2NbN109cypmK3YqbSt0Km4rdSphO3M9Yls4XTt2PWJbOV07dD1iWzEwXTt1PWJbMTFdO2NbOF09cypkK3YqaCt0KmwrdSpvO2NbOV09cyplK3Yqait0KmsrdSpwO2NbMTBdPXMqZyt2KmkrdCpxK3UqcjtjWzExXT1zKmYrdiptK3Qqbit1KmE7cz1iWzEyXTt2PWJbMTNdO3Q9YlsxNF07dT1iWzE1XTtjWzEyXT1zKmQrdipoK3QqbCt1Km87Y1sxM109cyplK3Yqait0KmsrdSpwO2NbMTRdPXMqZytcclxudippK3QqcSt1KnI7Y1sxNV09cypmK3YqbSt0Km4rdSphO3JldHVybiBjfSxtdWx0aXBseVZlYzM6ZnVuY3Rpb24oYSxiLGMpe2N8fChjPWIpO3ZhciBkPWJbMF0sZT1iWzFdLGI9YlsyXTtjWzBdPWFbMF0qZCthWzRdKmUrYVs4XSpiK2FbMTJdO2NbMV09YVsxXSpkK2FbNV0qZSthWzldKmIrYVsxM107Y1syXT1hWzJdKmQrYVs2XSplK2FbMTBdKmIrYVsxNF07cmV0dXJuIGN9LG11bHRpcGx5VmVjNDpmdW5jdGlvbihhLGIsYyl7Y3x8KGM9Yik7dmFyIGQ9YlswXSxlPWJbMV0sZz1iWzJdLGI9YlszXTtjWzBdPWFbMF0qZCthWzRdKmUrYVs4XSpnK2FbMTJdKmI7Y1sxXT1hWzFdKmQrYVs1XSplK2FbOV0qZythWzEzXSpiO2NbMl09YVsyXSpkK2FbNl0qZSthWzEwXSpnK2FbMTRdKmI7Y1szXT1hWzNdKmQrYVs3XSplK2FbMTFdKmcrYVsxNV0qYjtyZXR1cm4gY30sdHJhbnNsYXRlOmZ1bmN0aW9uKGEsYixjKXt2YXIgZD1iWzBdLGU9YlsxXSxiPWJbMl0sZyxmLGgsaixpLG0sbCxrLHEsXHJcbm4sbyxwO2lmKCFjfHxhPT09YylyZXR1cm4gYVsxMl09YVswXSpkK2FbNF0qZSthWzhdKmIrYVsxMl0sYVsxM109YVsxXSpkK2FbNV0qZSthWzldKmIrYVsxM10sYVsxNF09YVsyXSpkK2FbNl0qZSthWzEwXSpiK2FbMTRdLGFbMTVdPWFbM10qZCthWzddKmUrYVsxMV0qYithWzE1XSxhO2c9YVswXTtmPWFbMV07aD1hWzJdO2o9YVszXTtpPWFbNF07bT1hWzVdO2w9YVs2XTtrPWFbN107cT1hWzhdO249YVs5XTtvPWFbMTBdO3A9YVsxMV07Y1swXT1nO2NbMV09ZjtjWzJdPWg7Y1szXT1qO2NbNF09aTtjWzVdPW07Y1s2XT1sO2NbN109aztjWzhdPXE7Y1s5XT1uO2NbMTBdPW87Y1sxMV09cDtjWzEyXT1nKmQraSplK3EqYithWzEyXTtjWzEzXT1mKmQrbSplK24qYithWzEzXTtjWzE0XT1oKmQrbCplK28qYithWzE0XTtjWzE1XT1qKmQrayplK3AqYithWzE1XTtyZXR1cm4gY30sc2NhbGU6ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPWJbMF0sZT1iWzFdLGI9YlsyXTtpZighY3x8YT09PWMpcmV0dXJuIGFbMF0qPVxyXG5kLGFbMV0qPWQsYVsyXSo9ZCxhWzNdKj1kLGFbNF0qPWUsYVs1XSo9ZSxhWzZdKj1lLGFbN10qPWUsYVs4XSo9YixhWzldKj1iLGFbMTBdKj1iLGFbMTFdKj1iLGE7Y1swXT1hWzBdKmQ7Y1sxXT1hWzFdKmQ7Y1syXT1hWzJdKmQ7Y1szXT1hWzNdKmQ7Y1s0XT1hWzRdKmU7Y1s1XT1hWzVdKmU7Y1s2XT1hWzZdKmU7Y1s3XT1hWzddKmU7Y1s4XT1hWzhdKmI7Y1s5XT1hWzldKmI7Y1sxMF09YVsxMF0qYjtjWzExXT1hWzExXSpiO2NbMTJdPWFbMTJdO2NbMTNdPWFbMTNdO2NbMTRdPWFbMTRdO2NbMTVdPWFbMTVdO3JldHVybiBjfSxyb3RhdGU6ZnVuY3Rpb24oYSxiLGMsZCl7dmFyIGU9Y1swXSxnPWNbMV0sYz1jWzJdLGY9TWF0aC5zcXJ0KGUqZStnKmcrYypjKSxoLGosaSxtLGwsayxxLG4sbyxwLHIscyx2LHQsdSx3LHgseSx6LEE7aWYoIWYpcmV0dXJuIG51bGw7MSE9PWYmJihmPTEvZixlKj1mLGcqPWYsYyo9Zik7aD1NYXRoLnNpbihiKTtqPU1hdGguY29zKGIpO2k9MS1qO2I9YVswXTtcclxuZj1hWzFdO209YVsyXTtsPWFbM107az1hWzRdO3E9YVs1XTtuPWFbNl07bz1hWzddO3A9YVs4XTtyPWFbOV07cz1hWzEwXTt2PWFbMTFdO3Q9ZSplKmkrajt1PWcqZSppK2MqaDt3PWMqZSppLWcqaDt4PWUqZyppLWMqaDt5PWcqZyppK2o7ej1jKmcqaStlKmg7QT1lKmMqaStnKmg7ZT1nKmMqaS1lKmg7Zz1jKmMqaStqO2Q/YSE9PWQmJihkWzEyXT1hWzEyXSxkWzEzXT1hWzEzXSxkWzE0XT1hWzE0XSxkWzE1XT1hWzE1XSk6ZD1hO2RbMF09Yip0K2sqdStwKnc7ZFsxXT1mKnQrcSp1K3IqdztkWzJdPW0qdCtuKnUrcyp3O2RbM109bCp0K28qdSt2Knc7ZFs0XT1iKngrayp5K3AqejtkWzVdPWYqeCtxKnkrcip6O2RbNl09bSp4K24qeStzKno7ZFs3XT1sKngrbyp5K3YqejtkWzhdPWIqQStrKmUrcCpnO2RbOV09ZipBK3EqZStyKmc7ZFsxMF09bSpBK24qZStzKmc7ZFsxMV09bCpBK28qZSt2Kmc7cmV0dXJuIGR9LHJvdGF0ZVg6ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPU1hdGguc2luKGIpLFxyXG5iPU1hdGguY29zKGIpLGU9YVs0XSxnPWFbNV0sZj1hWzZdLGg9YVs3XSxqPWFbOF0saT1hWzldLG09YVsxMF0sbD1hWzExXTtjP2EhPT1jJiYoY1swXT1hWzBdLGNbMV09YVsxXSxjWzJdPWFbMl0sY1szXT1hWzNdLGNbMTJdPWFbMTJdLGNbMTNdPWFbMTNdLGNbMTRdPWFbMTRdLGNbMTVdPWFbMTVdKTpjPWE7Y1s0XT1lKmIraipkO2NbNV09ZypiK2kqZDtjWzZdPWYqYittKmQ7Y1s3XT1oKmIrbCpkO2NbOF09ZSotZCtqKmI7Y1s5XT1nKi1kK2kqYjtjWzEwXT1mKi1kK20qYjtjWzExXT1oKi1kK2wqYjtyZXR1cm4gY30scm90YXRlWTpmdW5jdGlvbihhLGIsYyl7dmFyIGQ9TWF0aC5zaW4oYiksYj1NYXRoLmNvcyhiKSxlPWFbMF0sZz1hWzFdLGY9YVsyXSxoPWFbM10saj1hWzhdLGk9YVs5XSxtPWFbMTBdLGw9YVsxMV07Yz9hIT09YyYmKGNbNF09YVs0XSxjWzVdPWFbNV0sY1s2XT1hWzZdLGNbN109YVs3XSxjWzEyXT1hWzEyXSxjWzEzXT1hWzEzXSxjWzE0XT1hWzE0XSxjWzE1XT1cclxuYVsxNV0pOmM9YTtjWzBdPWUqYitqKi1kO2NbMV09ZypiK2kqLWQ7Y1syXT1mKmIrbSotZDtjWzNdPWgqYitsKi1kO2NbOF09ZSpkK2oqYjtjWzldPWcqZCtpKmI7Y1sxMF09ZipkK20qYjtjWzExXT1oKmQrbCpiO3JldHVybiBjfSxyb3RhdGVaOmZ1bmN0aW9uKGEsYixjKXt2YXIgZD1NYXRoLnNpbihiKSxiPU1hdGguY29zKGIpLGU9YVswXSxnPWFbMV0sZj1hWzJdLGg9YVszXSxqPWFbNF0saT1hWzVdLG09YVs2XSxsPWFbN107Yz9hIT09YyYmKGNbOF09YVs4XSxjWzldPWFbOV0sY1sxMF09YVsxMF0sY1sxMV09YVsxMV0sY1sxMl09YVsxMl0sY1sxM109YVsxM10sY1sxNF09YVsxNF0sY1sxNV09YVsxNV0pOmM9YTtjWzBdPWUqYitqKmQ7Y1sxXT1nKmIraSpkO2NbMl09ZipiK20qZDtjWzNdPWgqYitsKmQ7Y1s0XT1lKi1kK2oqYjtjWzVdPWcqLWQraSpiO2NbNl09ZiotZCttKmI7Y1s3XT1oKi1kK2wqYjtyZXR1cm4gY30sZnJ1c3R1bTpmdW5jdGlvbihhLGIsYyxkLGUsZyxmKXtmfHxcclxuKGY9eC5jcmVhdGUoKSk7dmFyIGg9Yi1hLGo9ZC1jLGk9Zy1lO2ZbMF09MiplL2g7ZlsxXT0wO2ZbMl09MDtmWzNdPTA7Zls0XT0wO2ZbNV09MiplL2o7Zls2XT0wO2ZbN109MDtmWzhdPShiK2EpL2g7Zls5XT0oZCtjKS9qO2ZbMTBdPS0oZytlKS9pO2ZbMTFdPS0xO2ZbMTJdPTA7ZlsxM109MDtmWzE0XT0tKDIqZyplKS9pO2ZbMTVdPTA7cmV0dXJuIGZ9LHBlcnNwZWN0aXZlOmZ1bmN0aW9uKGEsYixjLGQsZSl7YT1jKk1hdGgudGFuKGEqTWF0aC5QSS8zNjApO2IqPWE7cmV0dXJuIHguZnJ1c3R1bSgtYixiLC1hLGEsYyxkLGUpfSxvcnRobzpmdW5jdGlvbihhLGIsYyxkLGUsZyxmKXtmfHwoZj14LmNyZWF0ZSgpKTt2YXIgaD1iLWEsaj1kLWMsaT1nLWU7ZlswXT0yL2g7ZlsxXT0wO2ZbMl09MDtmWzNdPTA7Zls0XT0wO2ZbNV09Mi9qO2ZbNl09MDtmWzddPTA7Zls4XT0wO2ZbOV09MDtmWzEwXT0tMi9pO2ZbMTFdPTA7ZlsxMl09LShhK2IpL2g7ZlsxM109LShkK2MpL2o7ZlsxNF09XHJcbi0oZytlKS9pO2ZbMTVdPTE7cmV0dXJuIGZ9LGxvb2tBdDpmdW5jdGlvbihhLGIsYyxkKXtkfHwoZD14LmNyZWF0ZSgpKTt2YXIgZSxnLGYsaCxqLGksbSxsLGs9YVswXSxvPWFbMV0sYT1hWzJdO2Y9Y1swXTtoPWNbMV07Zz1jWzJdO209YlswXTtjPWJbMV07ZT1iWzJdO2lmKGs9PT1tJiZvPT09YyYmYT09PWUpcmV0dXJuIHguaWRlbnRpdHkoZCk7Yj1rLW07Yz1vLWM7bT1hLWU7bD0xL01hdGguc3FydChiKmIrYypjK20qbSk7Yio9bDtjKj1sO20qPWw7ZT1oKm0tZypjO2c9ZypiLWYqbTtmPWYqYy1oKmI7KGw9TWF0aC5zcXJ0KGUqZStnKmcrZipmKSk/KGw9MS9sLGUqPWwsZyo9bCxmKj1sKTpmPWc9ZT0wO2g9YypmLW0qZztqPW0qZS1iKmY7aT1iKmctYyplOyhsPU1hdGguc3FydChoKmgraipqK2kqaSkpPyhsPTEvbCxoKj1sLGoqPWwsaSo9bCk6aT1qPWg9MDtkWzBdPWU7ZFsxXT1oO2RbMl09YjtkWzNdPTA7ZFs0XT1nO2RbNV09ajtkWzZdPWM7ZFs3XT0wO2RbOF09ZjtkWzldPVxyXG5pO2RbMTBdPW07ZFsxMV09MDtkWzEyXT0tKGUqaytnKm8rZiphKTtkWzEzXT0tKGgqaytqKm8raSphKTtkWzE0XT0tKGIqaytjKm8rbSphKTtkWzE1XT0xO3JldHVybiBkfSxmcm9tUm90YXRpb25UcmFuc2xhdGlvbjpmdW5jdGlvbihhLGIsYyl7Y3x8KGM9eC5jcmVhdGUoKSk7dmFyIGQ9YVswXSxlPWFbMV0sZz1hWzJdLGY9YVszXSxoPWQrZCxqPWUrZSxpPWcrZyxhPWQqaCxtPWQqaixkPWQqaSxrPWUqaixlPWUqaSxnPWcqaSxoPWYqaCxqPWYqaixmPWYqaTtjWzBdPTEtKGsrZyk7Y1sxXT1tK2Y7Y1syXT1kLWo7Y1szXT0wO2NbNF09bS1mO2NbNV09MS0oYStnKTtjWzZdPWUraDtjWzddPTA7Y1s4XT1kK2o7Y1s5XT1lLWg7Y1sxMF09MS0oYStrKTtjWzExXT0wO2NbMTJdPWJbMF07Y1sxM109YlsxXTtjWzE0XT1iWzJdO2NbMTVdPTE7cmV0dXJuIGN9LHN0cjpmdW5jdGlvbihhKXtyZXR1cm5cIltcIithWzBdK1wiLCBcIithWzFdK1wiLCBcIithWzJdK1wiLCBcIithWzNdK1wiLCBcIithWzRdK1wiLCBcIitcclxuYVs1XStcIiwgXCIrYVs2XStcIiwgXCIrYVs3XStcIiwgXCIrYVs4XStcIiwgXCIrYVs5XStcIiwgXCIrYVsxMF0rXCIsIFwiK2FbMTFdK1wiLCBcIithWzEyXStcIiwgXCIrYVsxM10rXCIsIFwiK2FbMTRdK1wiLCBcIithWzE1XStcIl1cIn19LGs9e2NyZWF0ZTpmdW5jdGlvbihhKXt2YXIgYj1uZXcgbyg0KTthPyhiWzBdPWFbMF0sYlsxXT1hWzFdLGJbMl09YVsyXSxiWzNdPWFbM10pOmJbMF09YlsxXT1iWzJdPWJbM109MDtyZXR1cm4gYn0sY3JlYXRlRnJvbTpmdW5jdGlvbihhLGIsYyxkKXt2YXIgZT1uZXcgbyg0KTtlWzBdPWE7ZVsxXT1iO2VbMl09YztlWzNdPWQ7cmV0dXJuIGV9LHNldDpmdW5jdGlvbihhLGIpe2JbMF09YVswXTtiWzFdPWFbMV07YlsyXT1hWzJdO2JbM109YVszXTtyZXR1cm4gYn0sZXF1YWw6ZnVuY3Rpb24oYSxiKXtyZXR1cm4gYT09PWJ8fDEuMEUtNj5NYXRoLmFicyhhWzBdLWJbMF0pJiYxLjBFLTY+TWF0aC5hYnMoYVsxXS1iWzFdKSYmMS4wRS02Pk1hdGguYWJzKGFbMl0tYlsyXSkmJjEuMEUtNj5cclxuTWF0aC5hYnMoYVszXS1iWzNdKX0saWRlbnRpdHk6ZnVuY3Rpb24oYSl7YXx8KGE9ay5jcmVhdGUoKSk7YVswXT0wO2FbMV09MDthWzJdPTA7YVszXT0xO3JldHVybiBhfX0sTz1rLmlkZW50aXR5KCk7ay5jYWxjdWxhdGVXPWZ1bmN0aW9uKGEsYil7dmFyIGM9YVswXSxkPWFbMV0sZT1hWzJdO2lmKCFifHxhPT09YilyZXR1cm4gYVszXT0tTWF0aC5zcXJ0KE1hdGguYWJzKDEtYypjLWQqZC1lKmUpKSxhO2JbMF09YztiWzFdPWQ7YlsyXT1lO2JbM109LU1hdGguc3FydChNYXRoLmFicygxLWMqYy1kKmQtZSplKSk7cmV0dXJuIGJ9O2suZG90PWZ1bmN0aW9uKGEsYil7cmV0dXJuIGFbMF0qYlswXSthWzFdKmJbMV0rYVsyXSpiWzJdK2FbM10qYlszXX07ay5pbnZlcnNlPWZ1bmN0aW9uKGEsYil7dmFyIGM9YVswXSxkPWFbMV0sZT1hWzJdLGc9YVszXSxjPShjPWMqYytkKmQrZSplK2cqZyk/MS9jOjA7aWYoIWJ8fGE9PT1iKXJldHVybiBhWzBdKj0tYyxhWzFdKj0tYyxhWzJdKj0tYyxhWzNdKj1cclxuYyxhO2JbMF09LWFbMF0qYztiWzFdPS1hWzFdKmM7YlsyXT0tYVsyXSpjO2JbM109YVszXSpjO3JldHVybiBifTtrLmNvbmp1Z2F0ZT1mdW5jdGlvbihhLGIpe2lmKCFifHxhPT09YilyZXR1cm4gYVswXSo9LTEsYVsxXSo9LTEsYVsyXSo9LTEsYTtiWzBdPS1hWzBdO2JbMV09LWFbMV07YlsyXT0tYVsyXTtiWzNdPWFbM107cmV0dXJuIGJ9O2subGVuZ3RoPWZ1bmN0aW9uKGEpe3ZhciBiPWFbMF0sYz1hWzFdLGQ9YVsyXSxhPWFbM107cmV0dXJuIE1hdGguc3FydChiKmIrYypjK2QqZCthKmEpfTtrLm5vcm1hbGl6ZT1mdW5jdGlvbihhLGIpe2J8fChiPWEpO3ZhciBjPWFbMF0sZD1hWzFdLGU9YVsyXSxnPWFbM10sZj1NYXRoLnNxcnQoYypjK2QqZCtlKmUrZypnKTtpZigwPT09ZilyZXR1cm4gYlswXT0wLGJbMV09MCxiWzJdPTAsYlszXT0wLGI7Zj0xL2Y7YlswXT1jKmY7YlsxXT1kKmY7YlsyXT1lKmY7YlszXT1nKmY7cmV0dXJuIGJ9O2suYWRkPWZ1bmN0aW9uKGEsYixjKXtpZighY3x8XHJcbmE9PT1jKXJldHVybiBhWzBdKz1iWzBdLGFbMV0rPWJbMV0sYVsyXSs9YlsyXSxhWzNdKz1iWzNdLGE7Y1swXT1hWzBdK2JbMF07Y1sxXT1hWzFdK2JbMV07Y1syXT1hWzJdK2JbMl07Y1szXT1hWzNdK2JbM107cmV0dXJuIGN9O2subXVsdGlwbHk9ZnVuY3Rpb24oYSxiLGMpe2N8fChjPWEpO3ZhciBkPWFbMF0sZT1hWzFdLGc9YVsyXSxhPWFbM10sZj1iWzBdLGg9YlsxXSxqPWJbMl0sYj1iWzNdO2NbMF09ZCpiK2EqZitlKmotZypoO2NbMV09ZSpiK2EqaCtnKmYtZCpqO2NbMl09ZypiK2EqaitkKmgtZSpmO2NbM109YSpiLWQqZi1lKmgtZypqO3JldHVybiBjfTtrLm11bHRpcGx5VmVjMz1mdW5jdGlvbihhLGIsYyl7Y3x8KGM9Yik7dmFyIGQ9YlswXSxlPWJbMV0sZz1iWzJdLGI9YVswXSxmPWFbMV0saD1hWzJdLGE9YVszXSxqPWEqZCtmKmctaCplLGk9YSplK2gqZC1iKmcsaz1hKmcrYiplLWYqZCxkPS1iKmQtZiplLWgqZztjWzBdPWoqYStkKi1iK2kqLWgtayotZjtjWzFdPWkqYStcclxuZCotZitrKi1iLWoqLWg7Y1syXT1rKmErZCotaCtqKi1mLWkqLWI7cmV0dXJuIGN9O2suc2NhbGU9ZnVuY3Rpb24oYSxiLGMpe2lmKCFjfHxhPT09YylyZXR1cm4gYVswXSo9YixhWzFdKj1iLGFbMl0qPWIsYVszXSo9YixhO2NbMF09YVswXSpiO2NbMV09YVsxXSpiO2NbMl09YVsyXSpiO2NbM109YVszXSpiO3JldHVybiBjfTtrLnRvTWF0Mz1mdW5jdGlvbihhLGIpe2J8fChiPUEuY3JlYXRlKCkpO3ZhciBjPWFbMF0sZD1hWzFdLGU9YVsyXSxnPWFbM10sZj1jK2MsaD1kK2Qsaj1lK2UsaT1jKmYsaz1jKmgsYz1jKmosbD1kKmgsZD1kKmosZT1lKmosZj1nKmYsaD1nKmgsZz1nKmo7YlswXT0xLShsK2UpO2JbMV09aytnO2JbMl09Yy1oO2JbM109ay1nO2JbNF09MS0oaStlKTtiWzVdPWQrZjtiWzZdPWMraDtiWzddPWQtZjtiWzhdPTEtKGkrbCk7cmV0dXJuIGJ9O2sudG9NYXQ0PWZ1bmN0aW9uKGEsYil7Ynx8KGI9eC5jcmVhdGUoKSk7dmFyIGM9YVswXSxkPWFbMV0sZT1hWzJdLGc9XHJcbmFbM10sZj1jK2MsaD1kK2Qsaj1lK2UsaT1jKmYsaz1jKmgsYz1jKmosbD1kKmgsZD1kKmosZT1lKmosZj1nKmYsaD1nKmgsZz1nKmo7YlswXT0xLShsK2UpO2JbMV09aytnO2JbMl09Yy1oO2JbM109MDtiWzRdPWstZztiWzVdPTEtKGkrZSk7Yls2XT1kK2Y7Yls3XT0wO2JbOF09YytoO2JbOV09ZC1mO2JbMTBdPTEtKGkrbCk7YlsxMV09MDtiWzEyXT0wO2JbMTNdPTA7YlsxNF09MDtiWzE1XT0xO3JldHVybiBifTtrLnNsZXJwPWZ1bmN0aW9uKGEsYixjLGQpe2R8fChkPWEpO3ZhciBlPWFbMF0qYlswXSthWzFdKmJbMV0rYVsyXSpiWzJdK2FbM10qYlszXSxnLGY7aWYoMTw9TWF0aC5hYnMoZSkpcmV0dXJuIGQhPT1hJiYoZFswXT1hWzBdLGRbMV09YVsxXSxkWzJdPWFbMl0sZFszXT1hWzNdKSxkO2c9TWF0aC5hY29zKGUpO2Y9TWF0aC5zcXJ0KDEtZSplKTtpZigwLjAwMT5NYXRoLmFicyhmKSlyZXR1cm4gZFswXT0wLjUqYVswXSswLjUqYlswXSxkWzFdPTAuNSphWzFdKzAuNSpiWzFdLFxyXG5kWzJdPTAuNSphWzJdKzAuNSpiWzJdLGRbM109MC41KmFbM10rMC41KmJbM10sZDtlPU1hdGguc2luKCgxLWMpKmcpL2Y7Yz1NYXRoLnNpbihjKmcpL2Y7ZFswXT1hWzBdKmUrYlswXSpjO2RbMV09YVsxXSplK2JbMV0qYztkWzJdPWFbMl0qZStiWzJdKmM7ZFszXT1hWzNdKmUrYlszXSpjO3JldHVybiBkfTtrLmZyb21Sb3RhdGlvbk1hdHJpeD1mdW5jdGlvbihhLGIpe2J8fChiPWsuY3JlYXRlKCkpO3ZhciBjPWFbMF0rYVs0XSthWzhdLGQ7aWYoMDxjKWQ9TWF0aC5zcXJ0KGMrMSksYlszXT0wLjUqZCxkPTAuNS9kLGJbMF09KGFbN10tYVs1XSkqZCxiWzFdPShhWzJdLWFbNl0pKmQsYlsyXT0oYVszXS1hWzFdKSpkO2Vsc2V7ZD1rLmZyb21Sb3RhdGlvbk1hdHJpeC5zX2lOZXh0PWsuZnJvbVJvdGF0aW9uTWF0cml4LnNfaU5leHR8fFsxLDIsMF07Yz0wO2FbNF0+YVswXSYmKGM9MSk7YVs4XT5hWzMqYytjXSYmKGM9Mik7dmFyIGU9ZFtjXSxnPWRbZV07ZD1NYXRoLnNxcnQoYVszKmMrXHJcbmNdLWFbMyplK2VdLWFbMypnK2ddKzEpO2JbY109MC41KmQ7ZD0wLjUvZDtiWzNdPShhWzMqZytlXS1hWzMqZStnXSkqZDtiW2VdPShhWzMqZStjXSthWzMqYytlXSkqZDtiW2ddPShhWzMqZytjXSthWzMqYytnXSkqZH1yZXR1cm4gYn07QS50b1F1YXQ0PWsuZnJvbVJvdGF0aW9uTWF0cml4OyhmdW5jdGlvbigpe3ZhciBhPUEuY3JlYXRlKCk7ay5mcm9tQXhlcz1mdW5jdGlvbihiLGMsZCxlKXthWzBdPWNbMF07YVszXT1jWzFdO2FbNl09Y1syXTthWzFdPWRbMF07YVs0XT1kWzFdO2FbN109ZFsyXTthWzJdPWJbMF07YVs1XT1iWzFdO2FbOF09YlsyXTtyZXR1cm4gay5mcm9tUm90YXRpb25NYXRyaXgoYSxlKX19KSgpO2suaWRlbnRpdHk9ZnVuY3Rpb24oYSl7YXx8KGE9ay5jcmVhdGUoKSk7YVswXT0wO2FbMV09MDthWzJdPTA7YVszXT0xO3JldHVybiBhfTtrLmZyb21BbmdsZUF4aXM9ZnVuY3Rpb24oYSxiLGMpe2N8fChjPWsuY3JlYXRlKCkpO3ZhciBhPTAuNSphLGQ9TWF0aC5zaW4oYSk7XHJcbmNbM109TWF0aC5jb3MoYSk7Y1swXT1kKmJbMF07Y1sxXT1kKmJbMV07Y1syXT1kKmJbMl07cmV0dXJuIGN9O2sudG9BbmdsZUF4aXM9ZnVuY3Rpb24oYSxiKXtifHwoYj1hKTt2YXIgYz1hWzBdKmFbMF0rYVsxXSphWzFdK2FbMl0qYVsyXTswPGM/KGJbM109MipNYXRoLmFjb3MoYVszXSksYz1FLmludnNxcnQoYyksYlswXT1hWzBdKmMsYlsxXT1hWzFdKmMsYlsyXT1hWzJdKmMpOihiWzNdPTAsYlswXT0xLGJbMV09MCxiWzJdPTApO3JldHVybiBifTtrLnN0cj1mdW5jdGlvbihhKXtyZXR1cm5cIltcIithWzBdK1wiLCBcIithWzFdK1wiLCBcIithWzJdK1wiLCBcIithWzNdK1wiXVwifTt2YXIgSj17Y3JlYXRlOmZ1bmN0aW9uKGEpe3ZhciBiPW5ldyBvKDIpO2E/KGJbMF09YVswXSxiWzFdPWFbMV0pOihiWzBdPTAsYlsxXT0wKTtyZXR1cm4gYn0sY3JlYXRlRnJvbTpmdW5jdGlvbihhLGIpe3ZhciBjPW5ldyBvKDIpO2NbMF09YTtjWzFdPWI7cmV0dXJuIGN9LGFkZDpmdW5jdGlvbihhLGIsYyl7Y3x8XHJcbihjPWIpO2NbMF09YVswXStiWzBdO2NbMV09YVsxXStiWzFdO3JldHVybiBjfSxzdWJ0cmFjdDpmdW5jdGlvbihhLGIsYyl7Y3x8KGM9Yik7Y1swXT1hWzBdLWJbMF07Y1sxXT1hWzFdLWJbMV07cmV0dXJuIGN9LG11bHRpcGx5OmZ1bmN0aW9uKGEsYixjKXtjfHwoYz1iKTtjWzBdPWFbMF0qYlswXTtjWzFdPWFbMV0qYlsxXTtyZXR1cm4gY30sZGl2aWRlOmZ1bmN0aW9uKGEsYixjKXtjfHwoYz1iKTtjWzBdPWFbMF0vYlswXTtjWzFdPWFbMV0vYlsxXTtyZXR1cm4gY30sc2NhbGU6ZnVuY3Rpb24oYSxiLGMpe2N8fChjPWEpO2NbMF09YVswXSpiO2NbMV09YVsxXSpiO3JldHVybiBjfSxkaXN0OmZ1bmN0aW9uKGEsYil7dmFyIGM9YlswXS1hWzBdLGQ9YlsxXS1hWzFdO3JldHVybiBNYXRoLnNxcnQoYypjK2QqZCl9LHNldDpmdW5jdGlvbihhLGIpe2JbMF09YVswXTtiWzFdPWFbMV07cmV0dXJuIGJ9LGVxdWFsOmZ1bmN0aW9uKGEsYil7cmV0dXJuIGE9PT1ifHwxLjBFLTY+TWF0aC5hYnMoYVswXS1cclxuYlswXSkmJjEuMEUtNj5NYXRoLmFicyhhWzFdLWJbMV0pfSxuZWdhdGU6ZnVuY3Rpb24oYSxiKXtifHwoYj1hKTtiWzBdPS1hWzBdO2JbMV09LWFbMV07cmV0dXJuIGJ9LG5vcm1hbGl6ZTpmdW5jdGlvbihhLGIpe2J8fChiPWEpO3ZhciBjPWFbMF0qYVswXSthWzFdKmFbMV07MDxjPyhjPU1hdGguc3FydChjKSxiWzBdPWFbMF0vYyxiWzFdPWFbMV0vYyk6YlswXT1iWzFdPTA7cmV0dXJuIGJ9LGNyb3NzOmZ1bmN0aW9uKGEsYixjKXthPWFbMF0qYlsxXS1hWzFdKmJbMF07aWYoIWMpcmV0dXJuIGE7Y1swXT1jWzFdPTA7Y1syXT1hO3JldHVybiBjfSxsZW5ndGg6ZnVuY3Rpb24oYSl7dmFyIGI9YVswXSxhPWFbMV07cmV0dXJuIE1hdGguc3FydChiKmIrYSphKX0sc3F1YXJlZExlbmd0aDpmdW5jdGlvbihhKXt2YXIgYj1hWzBdLGE9YVsxXTtyZXR1cm4gYipiK2EqYX0sZG90OmZ1bmN0aW9uKGEsYil7cmV0dXJuIGFbMF0qYlswXSthWzFdKmJbMV19LGRpcmVjdGlvbjpmdW5jdGlvbihhLFxyXG5iLGMpe2N8fChjPWEpO3ZhciBkPWFbMF0tYlswXSxhPWFbMV0tYlsxXSxiPWQqZCthKmE7aWYoIWIpcmV0dXJuIGNbMF09MCxjWzFdPTAsY1syXT0wLGM7Yj0xL01hdGguc3FydChiKTtjWzBdPWQqYjtjWzFdPWEqYjtyZXR1cm4gY30sbGVycDpmdW5jdGlvbihhLGIsYyxkKXtkfHwoZD1hKTtkWzBdPWFbMF0rYyooYlswXS1hWzBdKTtkWzFdPWFbMV0rYyooYlsxXS1hWzFdKTtyZXR1cm4gZH0sc3RyOmZ1bmN0aW9uKGEpe3JldHVyblwiW1wiK2FbMF0rXCIsIFwiK2FbMV0rXCJdXCJ9fSxJPXtjcmVhdGU6ZnVuY3Rpb24oYSl7dmFyIGI9bmV3IG8oNCk7YT8oYlswXT1hWzBdLGJbMV09YVsxXSxiWzJdPWFbMl0sYlszXT1hWzNdKTpiWzBdPWJbMV09YlsyXT1iWzNdPTA7cmV0dXJuIGJ9LGNyZWF0ZUZyb206ZnVuY3Rpb24oYSxiLGMsZCl7dmFyIGU9bmV3IG8oNCk7ZVswXT1hO2VbMV09YjtlWzJdPWM7ZVszXT1kO3JldHVybiBlfSxzZXQ6ZnVuY3Rpb24oYSxiKXtiWzBdPWFbMF07YlsxXT1hWzFdO1xyXG5iWzJdPWFbMl07YlszXT1hWzNdO3JldHVybiBifSxlcXVhbDpmdW5jdGlvbihhLGIpe3JldHVybiBhPT09Ynx8MS4wRS02Pk1hdGguYWJzKGFbMF0tYlswXSkmJjEuMEUtNj5NYXRoLmFicyhhWzFdLWJbMV0pJiYxLjBFLTY+TWF0aC5hYnMoYVsyXS1iWzJdKSYmMS4wRS02Pk1hdGguYWJzKGFbM10tYlszXSl9LGlkZW50aXR5OmZ1bmN0aW9uKGEpe2F8fChhPUkuY3JlYXRlKCkpO2FbMF09MTthWzFdPTA7YVsyXT0wO2FbM109MTtyZXR1cm4gYX0sdHJhbnNwb3NlOmZ1bmN0aW9uKGEsYil7aWYoIWJ8fGE9PT1iKXt2YXIgYz1hWzFdO2FbMV09YVsyXTthWzJdPWM7cmV0dXJuIGF9YlswXT1hWzBdO2JbMV09YVsyXTtiWzJdPWFbMV07YlszXT1hWzNdO3JldHVybiBifSxkZXRlcm1pbmFudDpmdW5jdGlvbihhKXtyZXR1cm4gYVswXSphWzNdLWFbMl0qYVsxXX0saW52ZXJzZTpmdW5jdGlvbihhLGIpe2J8fChiPWEpO3ZhciBjPWFbMF0sZD1hWzFdLGU9YVsyXSxnPWFbM10sZj1jKmctZSpcclxuZDtpZighZilyZXR1cm4gbnVsbDtmPTEvZjtiWzBdPWcqZjtiWzFdPS1kKmY7YlsyXT0tZSpmO2JbM109YypmO3JldHVybiBifSxtdWx0aXBseTpmdW5jdGlvbihhLGIsYyl7Y3x8KGM9YSk7dmFyIGQ9YVswXSxlPWFbMV0sZz1hWzJdLGE9YVszXTtjWzBdPWQqYlswXStlKmJbMl07Y1sxXT1kKmJbMV0rZSpiWzNdO2NbMl09ZypiWzBdK2EqYlsyXTtjWzNdPWcqYlsxXSthKmJbM107cmV0dXJuIGN9LHJvdGF0ZTpmdW5jdGlvbihhLGIsYyl7Y3x8KGM9YSk7dmFyIGQ9YVswXSxlPWFbMV0sZz1hWzJdLGE9YVszXSxmPU1hdGguc2luKGIpLGI9TWF0aC5jb3MoYik7Y1swXT1kKmIrZSpmO2NbMV09ZCotZitlKmI7Y1syXT1nKmIrYSpmO2NbM109ZyotZithKmI7cmV0dXJuIGN9LG11bHRpcGx5VmVjMjpmdW5jdGlvbihhLGIsYyl7Y3x8KGM9Yik7dmFyIGQ9YlswXSxiPWJbMV07Y1swXT1kKmFbMF0rYiphWzFdO2NbMV09ZCphWzJdK2IqYVszXTtyZXR1cm4gY30sc2NhbGU6ZnVuY3Rpb24oYSxcclxuYixjKXtjfHwoYz1hKTt2YXIgZD1hWzFdLGU9YVsyXSxnPWFbM10sZj1iWzBdLGI9YlsxXTtjWzBdPWFbMF0qZjtjWzFdPWQqYjtjWzJdPWUqZjtjWzNdPWcqYjtyZXR1cm4gY30sc3RyOmZ1bmN0aW9uKGEpe3JldHVyblwiW1wiK2FbMF0rXCIsIFwiK2FbMV0rXCIsIFwiK2FbMl0rXCIsIFwiK2FbM10rXCJdXCJ9fSxLPXtjcmVhdGU6ZnVuY3Rpb24oYSl7dmFyIGI9bmV3IG8oNCk7YT8oYlswXT1hWzBdLGJbMV09YVsxXSxiWzJdPWFbMl0sYlszXT1hWzNdKTooYlswXT0wLGJbMV09MCxiWzJdPTAsYlszXT0wKTtyZXR1cm4gYn0sY3JlYXRlRnJvbTpmdW5jdGlvbihhLGIsYyxkKXt2YXIgZT1uZXcgbyg0KTtlWzBdPWE7ZVsxXT1iO2VbMl09YztlWzNdPWQ7cmV0dXJuIGV9LGFkZDpmdW5jdGlvbihhLGIsYyl7Y3x8KGM9Yik7Y1swXT1hWzBdK2JbMF07Y1sxXT1hWzFdK2JbMV07Y1syXT1hWzJdK2JbMl07Y1szXT1hWzNdK2JbM107cmV0dXJuIGN9LHN1YnRyYWN0OmZ1bmN0aW9uKGEsYixjKXtjfHwoYz1cclxuYik7Y1swXT1hWzBdLWJbMF07Y1sxXT1hWzFdLWJbMV07Y1syXT1hWzJdLWJbMl07Y1szXT1hWzNdLWJbM107cmV0dXJuIGN9LG11bHRpcGx5OmZ1bmN0aW9uKGEsYixjKXtjfHwoYz1iKTtjWzBdPWFbMF0qYlswXTtjWzFdPWFbMV0qYlsxXTtjWzJdPWFbMl0qYlsyXTtjWzNdPWFbM10qYlszXTtyZXR1cm4gY30sZGl2aWRlOmZ1bmN0aW9uKGEsYixjKXtjfHwoYz1iKTtjWzBdPWFbMF0vYlswXTtjWzFdPWFbMV0vYlsxXTtjWzJdPWFbMl0vYlsyXTtjWzNdPWFbM10vYlszXTtyZXR1cm4gY30sc2NhbGU6ZnVuY3Rpb24oYSxiLGMpe2N8fChjPWEpO2NbMF09YVswXSpiO2NbMV09YVsxXSpiO2NbMl09YVsyXSpiO2NbM109YVszXSpiO3JldHVybiBjfSxzZXQ6ZnVuY3Rpb24oYSxiKXtiWzBdPWFbMF07YlsxXT1hWzFdO2JbMl09YVsyXTtiWzNdPWFbM107cmV0dXJuIGJ9LGVxdWFsOmZ1bmN0aW9uKGEsYil7cmV0dXJuIGE9PT1ifHwxLjBFLTY+TWF0aC5hYnMoYVswXS1iWzBdKSYmMS4wRS02PlxyXG5NYXRoLmFicyhhWzFdLWJbMV0pJiYxLjBFLTY+TWF0aC5hYnMoYVsyXS1iWzJdKSYmMS4wRS02Pk1hdGguYWJzKGFbM10tYlszXSl9LG5lZ2F0ZTpmdW5jdGlvbihhLGIpe2J8fChiPWEpO2JbMF09LWFbMF07YlsxXT0tYVsxXTtiWzJdPS1hWzJdO2JbM109LWFbM107cmV0dXJuIGJ9LGxlbmd0aDpmdW5jdGlvbihhKXt2YXIgYj1hWzBdLGM9YVsxXSxkPWFbMl0sYT1hWzNdO3JldHVybiBNYXRoLnNxcnQoYipiK2MqYytkKmQrYSphKX0sc3F1YXJlZExlbmd0aDpmdW5jdGlvbihhKXt2YXIgYj1hWzBdLGM9YVsxXSxkPWFbMl0sYT1hWzNdO3JldHVybiBiKmIrYypjK2QqZCthKmF9LGxlcnA6ZnVuY3Rpb24oYSxiLGMsZCl7ZHx8KGQ9YSk7ZFswXT1hWzBdK2MqKGJbMF0tYVswXSk7ZFsxXT1hWzFdK2MqKGJbMV0tYVsxXSk7ZFsyXT1hWzJdK2MqKGJbMl0tYVsyXSk7ZFszXT1hWzNdK2MqKGJbM10tYVszXSk7cmV0dXJuIGR9LHN0cjpmdW5jdGlvbihhKXtyZXR1cm5cIltcIithWzBdK1wiLCBcIitcclxuYVsxXStcIiwgXCIrYVsyXStcIiwgXCIrYVszXStcIl1cIn19O3cmJih3LmdsTWF0cml4QXJyYXlUeXBlPW8sdy5NYXRyaXhBcnJheT1vLHcuc2V0TWF0cml4QXJyYXlUeXBlPUQsdy5kZXRlcm1pbmVNYXRyaXhBcnJheVR5cGU9Ryx3LmdsTWF0aD1FLHcudmVjMj1KLHcudmVjMz1yLHcudmVjND1LLHcubWF0Mj1JLHcubWF0Mz1BLHcubWF0ND14LHcucXVhdDQ9ayk7cmV0dXJue2dsTWF0cml4QXJyYXlUeXBlOm8sTWF0cml4QXJyYXk6byxzZXRNYXRyaXhBcnJheVR5cGU6RCxkZXRlcm1pbmVNYXRyaXhBcnJheVR5cGU6RyxnbE1hdGg6RSx2ZWMyOkosdmVjMzpyLHZlYzQ6SyxtYXQyOkksbWF0MzpBLG1hdDQ6eCxxdWF0NDprfX0pO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG52YXIgUkdCQUNvbG9yID0gcmVxdWlyZSgnLi9yZ2JhLWNvbG9yLmpzJyk7XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5mdW5jdGlvbiBHcmFkaWFudENvbG9yKCByLGcsYixhICkge1xyXG4gICAgaWYgKHR5cGVvZiAoYSkgPT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICBhID0gMS4wO1xyXG4gICAgdGhpcy5yID0gcjtcclxuICAgIHRoaXMuZyA9IGc7XHJcbiAgICB0aGlzLmIgPSBiO1xyXG4gICAgdGhpcy5hID0gYTtcclxufVxyXG5cclxuR3JhZGlhbnRDb2xvci5wcm90b3R5cGUuR2V0V2l0aCAgPSBmdW5jdGlvbiggaW5DICwgaW5UICl7XHJcbiAgICB2YXIgciA9ICgodGhpcy5yIC0gaW5DLnIpICogaW5UKSArIGluQy5yO1xyXG4gICAgdmFyIGcgPSAoKHRoaXMuZyAtIGluQy5nKSAqIGluVCkgKyBpbkMuZztcclxuICAgIHZhciBiID0gKCh0aGlzLmIgLSBpbkMuYikgKiBpblQpICsgaW5DLmI7XHJcbiAgICB2YXIgYSA9ICgodGhpcy5hIC0gaW5DLmEpICogaW5UKSArIGluQy5hO1xyXG4gICAgcmV0dXJuIG5ldyBSR0JBQ29sb3IocixnLGIsYSk7XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR3JhZGlhbnRDb2xvcjtcclxuIiwiLyohIEhhbW1lci5KUyAtIHYxLjEuMiAtIDIwMTQtMDQtMjVcbiAqIGh0dHA6Ly9laWdodG1lZGlhLmdpdGh1Yi5pby9oYW1tZXIuanNcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgSm9yaWsgVGFuZ2VsZGVyIDxqLnRhbmdlbGRlckBnbWFpbC5jb20+O1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlICovXG5cbihmdW5jdGlvbih3aW5kb3csIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG1haW5cbiAqIEBtb2R1bGUgaGFtbWVyXG4gKlxuICogQGNsYXNzIEhhbW1lclxuICogQHN0YXRpY1xuICovXG5cbi8qKlxuICogSGFtbWVyLCB1c2UgdGhpcyB0byBjcmVhdGUgaW5zdGFuY2VzXG4gKiBgYGBgXG4gKiB2YXIgaGFtbWVydGltZSA9IG5ldyBIYW1tZXIobXlFbGVtZW50KTtcbiAqIGBgYGBcbiAqXG4gKiBAbWV0aG9kIEhhbW1lclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XVxuICogQHJldHVybiB7SGFtbWVyLkluc3RhbmNlfVxuICovXG52YXIgSGFtbWVyID0gZnVuY3Rpb24gSGFtbWVyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IEhhbW1lci5JbnN0YW5jZShlbGVtZW50LCBvcHRpb25zIHx8IHt9KTtcbn07XG5cbi8qKlxuICogdmVyc2lvbiwgYXMgZGVmaW5lZCBpbiBwYWNrYWdlLmpzb25cbiAqIHRoZSB2YWx1ZSB3aWxsIGJlIHNldCBhdCBlYWNoIGJ1aWxkXG4gKiBAcHJvcGVydHkgVkVSU0lPTlxuICogQGZpbmFsXG4gKiBAdHlwZSB7U3RyaW5nfVxuICovXG5IYW1tZXIuVkVSU0lPTiA9ICcxLjEuMic7XG5cbi8qKlxuICogZGVmYXVsdCBzZXR0aW5ncy5cbiAqIG1vcmUgc2V0dGluZ3MgYXJlIGRlZmluZWQgcGVyIGdlc3R1cmUgYXQgYC9nZXN0dXJlc2AuIEVhY2ggZ2VzdHVyZSBjYW4gYmUgZGlzYWJsZWQvZW5hYmxlZFxuICogYnkgc2V0dGluZyBpdCdzIG5hbWUgKGxpa2UgYHN3aXBlYCkgdG8gZmFsc2UuXG4gKiBZb3UgY2FuIHNldCB0aGUgZGVmYXVsdHMgZm9yIGFsbCBpbnN0YW5jZXMgYnkgY2hhbmdpbmcgdGhpcyBvYmplY3QgYmVmb3JlIGNyZWF0aW5nIGFuIGluc3RhbmNlLlxuICogQGV4YW1wbGVcbiAqIGBgYGBcbiAqICBIYW1tZXIuZGVmYXVsdHMuZHJhZyA9IGZhbHNlO1xuICogIEhhbW1lci5kZWZhdWx0cy5iZWhhdmlvci50b3VjaEFjdGlvbiA9ICdwYW4teSc7XG4gKiAgZGVsZXRlIEhhbW1lci5kZWZhdWx0cy5iZWhhdmlvci51c2VyU2VsZWN0O1xuICogYGBgYFxuICogQHByb3BlcnR5IGRlZmF1bHRzXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5IYW1tZXIuZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogdGhpcyBzZXR0aW5nIG9iamVjdCBhZGRzIHN0eWxlcyBhbmQgYXR0cmlidXRlcyB0byB0aGUgZWxlbWVudCB0byBwcmV2ZW50IHRoZSBicm93c2VyIGZyb20gZG9pbmdcbiAgICAgKiBpdHMgbmF0aXZlIGJlaGF2aW9yLiBUaGUgY3NzIHByb3BlcnRpZXMgYXJlIGF1dG8gcHJlZml4ZWQgZm9yIHRoZSBicm93c2VycyB3aGVuIG5lZWRlZC5cbiAgICAgKiBAcHJvcGVydHkgZGVmYXVsdHMuYmVoYXZpb3JcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIGJlaGF2aW9yOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNhYmxlcyB0ZXh0IHNlbGVjdGlvbiB0byBpbXByb3ZlIHRoZSBkcmFnZ2luZyBnZXN0dXJlLiBXaGVuIHRoZSB2YWx1ZSBpcyBgbm9uZWAgaXQgYWxzbyBzZXRzXG4gICAgICAgICAqIGBvbnNlbGVjdHN0YXJ0PWZhbHNlYCBmb3IgSUUgb24gdGhlIGVsZW1lbnQuIE1haW5seSBmb3IgZGVza3RvcCBicm93c2Vycy5cbiAgICAgICAgICogQHByb3BlcnR5IGRlZmF1bHRzLmJlaGF2aW9yLnVzZXJTZWxlY3RcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNwZWNpZmllcyB3aGV0aGVyIGFuZCBob3cgYSBnaXZlbiByZWdpb24gY2FuIGJlIG1hbmlwdWxhdGVkIGJ5IHRoZSB1c2VyIChmb3IgaW5zdGFuY2UsIGJ5IHBhbm5pbmcgb3Igem9vbWluZykuXG4gICAgICAgICAqIFVzZWQgYnkgSUUxMD4uIEJ5IGRlZmF1bHQgdGhpcyBtYWtlcyB0aGUgZWxlbWVudCBibG9ja2luZyBhbnkgdG91Y2ggZXZlbnQuXG4gICAgICAgICAqIEBwcm9wZXJ0eSBkZWZhdWx0cy5iZWhhdmlvci50b3VjaEFjdGlvblxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdDogJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB0b3VjaEFjdGlvbjogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNhYmxlcyB0aGUgZGVmYXVsdCBjYWxsb3V0IHNob3duIHdoZW4geW91IHRvdWNoIGFuZCBob2xkIGEgdG91Y2ggdGFyZ2V0LlxuICAgICAgICAgKiBPbiBpT1MsIHdoZW4geW91IHRvdWNoIGFuZCBob2xkIGEgdG91Y2ggdGFyZ2V0IHN1Y2ggYXMgYSBsaW5rLCBTYWZhcmkgZGlzcGxheXNcbiAgICAgICAgICogYSBjYWxsb3V0IGNvbnRhaW5pbmcgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGxpbmsuIFRoaXMgcHJvcGVydHkgYWxsb3dzIHlvdSB0byBkaXNhYmxlIHRoYXQgY2FsbG91dC5cbiAgICAgICAgICogQHByb3BlcnR5IGRlZmF1bHRzLmJlaGF2aW9yLnRvdWNoQ2FsbG91dFxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoQ2FsbG91dDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgd2hldGhlciB6b29taW5nIGlzIGVuYWJsZWQuIFVzZWQgYnkgSUUxMD5cbiAgICAgICAgICogQHByb3BlcnR5IGRlZmF1bHRzLmJlaGF2aW9yLmNvbnRlbnRab29taW5nXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgY29udGVudFpvb21pbmc6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3BlY2lmaWVzIHRoYXQgYW4gZW50aXJlIGVsZW1lbnQgc2hvdWxkIGJlIGRyYWdnYWJsZSBpbnN0ZWFkIG9mIGl0cyBjb250ZW50cy5cbiAgICAgICAgICogTWFpbmx5IGZvciBkZXNrdG9wIGJyb3dzZXJzLlxuICAgICAgICAgKiBAcHJvcGVydHkgZGVmYXVsdHMuYmVoYXZpb3IudXNlckRyYWdcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyRHJhZzogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPdmVycmlkZXMgdGhlIGhpZ2hsaWdodCBjb2xvciBzaG93biB3aGVuIHRoZSB1c2VyIHRhcHMgYSBsaW5rIG9yIGEgSmF2YVNjcmlwdFxuICAgICAgICAgKiBjbGlja2FibGUgZWxlbWVudCBpbiBTYWZhcmkgb24gaVBob25lLiBUaGlzIHByb3BlcnR5IG9iZXlzIHRoZSBhbHBoYSB2YWx1ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJZiB5b3UgZG9uJ3Qgc3BlY2lmeSBhbiBhbHBoYSB2YWx1ZSwgU2FmYXJpIG9uIGlQaG9uZSBhcHBsaWVzIGEgZGVmYXVsdCBhbHBoYSB2YWx1ZVxuICAgICAgICAgKiB0byB0aGUgY29sb3IuIFRvIGRpc2FibGUgdGFwIGhpZ2hsaWdodGluZywgc2V0IHRoZSBhbHBoYSB2YWx1ZSB0byAwIChpbnZpc2libGUpLlxuICAgICAgICAgKiBJZiB5b3Ugc2V0IHRoZSBhbHBoYSB2YWx1ZSB0byAxLjAgKG9wYXF1ZSksIHRoZSBlbGVtZW50IGlzIG5vdCB2aXNpYmxlIHdoZW4gdGFwcGVkLlxuICAgICAgICAgKiBAcHJvcGVydHkgZGVmYXVsdHMuYmVoYXZpb3IudGFwSGlnaGxpZ2h0Q29sb3JcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ3JnYmEoMCwwLDAsMCknXG4gICAgICAgICAqL1xuICAgICAgICB0YXBIaWdobGlnaHRDb2xvcjogJ3JnYmEoMCwwLDAsMCknXG4gICAgfVxufTtcblxuLyoqXG4gKiBoYW1tZXIgZG9jdW1lbnQgd2hlcmUgdGhlIGJhc2UgZXZlbnRzIGFyZSBhZGRlZCBhdFxuICogQHByb3BlcnR5IERPQ1VNRU5UXG4gKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gKiBAZGVmYXVsdCB3aW5kb3cuZG9jdW1lbnRcbiAqL1xuSGFtbWVyLkRPQ1VNRU5UID0gZG9jdW1lbnQ7XG5cbi8qKlxuICogZGV0ZWN0IHN1cHBvcnQgZm9yIHBvaW50ZXIgZXZlbnRzXG4gKiBAcHJvcGVydHkgSEFTX1BPSU5URVJFVkVOVFNcbiAqIEB0eXBlIHtCb29sZWFufVxuICovXG5IYW1tZXIuSEFTX1BPSU5URVJFVkVOVFMgPSBuYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQgfHwgbmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQ7XG5cbi8qKlxuICogZGV0ZWN0IHN1cHBvcnQgZm9yIHRvdWNoIGV2ZW50c1xuICogQHByb3BlcnR5IEhBU19UT1VDSEVWRU5UU1xuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cbkhhbW1lci5IQVNfVE9VQ0hFVkVOVFMgPSAoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KTtcblxuLyoqXG4gKiBkZXRlY3QgbW9iaWxlIGJyb3dzZXJzXG4gKiBAcHJvcGVydHkgSVNfTU9CSUxFXG4gKiBAdHlwZSB7Qm9vbGVhbn1cbiAqL1xuSGFtbWVyLklTX01PQklMRSA9IC9tb2JpbGV8dGFibGV0fGlwKGFkfGhvbmV8b2QpfGFuZHJvaWR8c2lsay9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cbi8qKlxuICogZGV0ZWN0IGlmIHdlIHdhbnQgdG8gc3VwcG9ydCBtb3VzZWV2ZW50cyBhdCBhbGxcbiAqIEBwcm9wZXJ0eSBOT19NT1VTRUVWRU5UU1xuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cbkhhbW1lci5OT19NT1VTRUVWRU5UUyA9IChIYW1tZXIuSEFTX1RPVUNIRVZFTlRTICYmIEhhbW1lci5JU19NT0JJTEUpIHx8IEhhbW1lci5IQVNfUE9JTlRFUkVWRU5UUztcblxuLyoqXG4gKiBpbnRlcnZhbCBpbiB3aGljaCBIYW1tZXIgcmVjYWxjdWxhdGVzIGN1cnJlbnQgdmVsb2NpdHkvZGlyZWN0aW9uL2FuZ2xlIGluIG1zXG4gKiBAcHJvcGVydHkgQ0FMQ1VMQVRFX0lOVEVSVkFMXG4gKiBAdHlwZSB7TnVtYmVyfVxuICogQGRlZmF1bHQgMjVcbiAqL1xuSGFtbWVyLkNBTENVTEFURV9JTlRFUlZBTCA9IDI1O1xuXG4vKipcbiAqIGV2ZW50dHlwZXMgcGVyIHRvdWNoZXZlbnQgKHN0YXJ0LCBtb3ZlLCBlbmQpIGFyZSBmaWxsZWQgYnkgYEV2ZW50LmRldGVybWluZUV2ZW50VHlwZXNgIG9uIGBzZXR1cGBcbiAqIHRoZSBvYmplY3QgY29udGFpbnMgdGhlIERPTSBldmVudCBuYW1lcyBwZXIgdHlwZSAoYEVWRU5UX1NUQVJUYCwgYEVWRU5UX01PVkVgLCBgRVZFTlRfRU5EYClcbiAqIEBwcm9wZXJ0eSBFVkVOVF9UWVBFU1xuICogQHByaXZhdGVcbiAqIEB3cml0ZU9uY2VcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBFVkVOVF9UWVBFUyA9IHt9O1xuXG4vKipcbiAqIGRpcmVjdGlvbiBzdHJpbmdzLCBmb3Igc2FmZSBjb21wYXJpc29uc1xuICogQHByb3BlcnR5IERJUkVDVElPTl9ET1dOfExFRlR8VVB8UklHSFRcbiAqIEBmaW5hbFxuICogQHR5cGUge1N0cmluZ31cbiAqIEBkZWZhdWx0ICdkb3duJyAnbGVmdCcgJ3VwJyAncmlnaHQnXG4gKi9cbnZhciBESVJFQ1RJT05fRE9XTiA9IEhhbW1lci5ESVJFQ1RJT05fRE9XTiA9ICdkb3duJztcbnZhciBESVJFQ1RJT05fTEVGVCA9IEhhbW1lci5ESVJFQ1RJT05fTEVGVCA9ICdsZWZ0JztcbnZhciBESVJFQ1RJT05fVVAgPSBIYW1tZXIuRElSRUNUSU9OX1VQID0gJ3VwJztcbnZhciBESVJFQ1RJT05fUklHSFQgPSBIYW1tZXIuRElSRUNUSU9OX1JJR0hUID0gJ3JpZ2h0JztcblxuLyoqXG4gKiBwb2ludGVydHlwZSBzdHJpbmdzLCBmb3Igc2FmZSBjb21wYXJpc29uc1xuICogQHByb3BlcnR5IFBPSU5URVJfTU9VU0V8VE9VQ0h8UEVOXG4gKiBAZmluYWxcbiAqIEB0eXBlIHtTdHJpbmd9XG4gKiBAZGVmYXVsdCAnbW91c2UnICd0b3VjaCcgJ3BlbidcbiAqL1xudmFyIFBPSU5URVJfTU9VU0UgPSBIYW1tZXIuUE9JTlRFUl9NT1VTRSA9ICdtb3VzZSc7XG52YXIgUE9JTlRFUl9UT1VDSCA9IEhhbW1lci5QT0lOVEVSX1RPVUNIID0gJ3RvdWNoJztcbnZhciBQT0lOVEVSX1BFTiA9IEhhbW1lci5QT0lOVEVSX1BFTiA9ICdwZW4nO1xuXG4vKipcbiAqIGV2ZW50dHlwZXNcbiAqIEBwcm9wZXJ0eSBFVkVOVF9TVEFSVHxNT1ZFfEVORHxSRUxFQVNFfFRPVUNIXG4gKiBAZmluYWxcbiAqIEB0eXBlIHtTdHJpbmd9XG4gKiBAZGVmYXVsdCAnc3RhcnQnICdjaGFuZ2UnICdtb3ZlJyAnZW5kJyAncmVsZWFzZScgJ3RvdWNoJ1xuICovXG52YXIgRVZFTlRfU1RBUlQgPSBIYW1tZXIuRVZFTlRfU1RBUlQgPSAnc3RhcnQnO1xudmFyIEVWRU5UX01PVkUgPSBIYW1tZXIuRVZFTlRfTU9WRSA9ICdtb3ZlJztcbnZhciBFVkVOVF9FTkQgPSBIYW1tZXIuRVZFTlRfRU5EID0gJ2VuZCc7XG52YXIgRVZFTlRfUkVMRUFTRSA9IEhhbW1lci5FVkVOVF9SRUxFQVNFID0gJ3JlbGVhc2UnO1xudmFyIEVWRU5UX1RPVUNIID0gSGFtbWVyLkVWRU5UX1RPVUNIID0gJ3RvdWNoJztcblxuLyoqXG4gKiBpZiB0aGUgd2luZG93IGV2ZW50cyBhcmUgc2V0Li4uXG4gKiBAcHJvcGVydHkgUkVBRFlcbiAqIEB3cml0ZU9uY2VcbiAqIEB0eXBlIHtCb29sZWFufVxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuSGFtbWVyLlJFQURZID0gZmFsc2U7XG5cbi8qKlxuICogcGx1Z2lucyBuYW1lc3BhY2VcbiAqIEBwcm9wZXJ0eSBwbHVnaW5zXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5IYW1tZXIucGx1Z2lucyA9IEhhbW1lci5wbHVnaW5zIHx8IHt9O1xuXG4vKipcbiAqIGdlc3R1cmVzIG5hbWVzcGFjZVxuICogc2VlIGAvZ2VzdHVyZXNgIGZvciB0aGUgZGVmaW5pdGlvbnNcbiAqIEBwcm9wZXJ0eSBnZXN0dXJlc1xuICogQHR5cGUge09iamVjdH1cbiAqL1xuSGFtbWVyLmdlc3R1cmVzID0gSGFtbWVyLmdlc3R1cmVzIHx8IHt9O1xuXG4vKipcbiAqIHNldHVwIGV2ZW50cyB0byBkZXRlY3QgZ2VzdHVyZXMgb24gdGhlIGRvY3VtZW50XG4gKiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIGNyZWF0aW5nIGFuIG5ldyBpbnN0YW5jZVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgaWYoSGFtbWVyLlJFQURZKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBmaW5kIHdoYXQgZXZlbnR0eXBlcyB3ZSBhZGQgbGlzdGVuZXJzIHRvXG4gICAgRXZlbnQuZGV0ZXJtaW5lRXZlbnRUeXBlcygpO1xuXG4gICAgLy8gUmVnaXN0ZXIgYWxsIGdlc3R1cmVzIGluc2lkZSBIYW1tZXIuZ2VzdHVyZXNcbiAgICBVdGlscy5lYWNoKEhhbW1lci5nZXN0dXJlcywgZnVuY3Rpb24oZ2VzdHVyZSkge1xuICAgICAgICBEZXRlY3Rpb24ucmVnaXN0ZXIoZ2VzdHVyZSk7XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgdG91Y2ggZXZlbnRzIG9uIHRoZSBkb2N1bWVudFxuICAgIEV2ZW50Lm9uVG91Y2goSGFtbWVyLkRPQ1VNRU5ULCBFVkVOVF9NT1ZFLCBEZXRlY3Rpb24uZGV0ZWN0KTtcbiAgICBFdmVudC5vblRvdWNoKEhhbW1lci5ET0NVTUVOVCwgRVZFTlRfRU5ELCBEZXRlY3Rpb24uZGV0ZWN0KTtcblxuICAgIC8vIEhhbW1lciBpcyByZWFkeS4uLiFcbiAgICBIYW1tZXIuUkVBRFkgPSB0cnVlO1xufVxuXG4vKipcbiAqIEBtb2R1bGUgaGFtbWVyXG4gKlxuICogQGNsYXNzIFV0aWxzXG4gKiBAc3RhdGljXG4gKi9cbnZhciBVdGlscyA9IEhhbW1lci51dGlscyA9IHtcbiAgICAvKipcbiAgICAgKiBleHRlbmQgbWV0aG9kLCBjb3VsZCBhbHNvIGJlIHVzZWQgZm9yIGNsb25pbmcgd2hlbiBgZGVzdGAgaXMgYW4gZW1wdHkgb2JqZWN0LlxuICAgICAqIGNoYW5nZXMgdGhlIGRlc3Qgb2JqZWN0XG4gICAgICogQG1ldGhvZCBleHRlbmRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcmNcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IFttZXJnZT1mYWxzZV0gIGRvIGEgbWVyZ2VcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IGRlc3RcbiAgICAgKi9cbiAgICBleHRlbmQ6IGZ1bmN0aW9uIGV4dGVuZChkZXN0LCBzcmMsIG1lcmdlKSB7XG4gICAgICAgIGZvcih2YXIga2V5IGluIHNyYykge1xuICAgICAgICAgICAgaWYoIXNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpIHx8IChkZXN0W2tleV0gIT09IHVuZGVmaW5lZCAmJiBtZXJnZSkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlc3Rba2V5XSA9IHNyY1trZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzaW1wbGUgYWRkRXZlbnRMaXN0ZW5lciB3cmFwcGVyXG4gICAgICogQG1ldGhvZCBvblxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gb24oZWxlbWVudCwgdHlwZSwgaGFuZGxlcikge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzaW1wbGUgcmVtb3ZlRXZlbnRMaXN0ZW5lciB3cmFwcGVyXG4gICAgICogQG1ldGhvZCBvZmZcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbiBvZmYoZWxlbWVudCwgdHlwZSwgaGFuZGxlcikge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBmb3JFYWNoIG92ZXIgYXJyYXlzIGFuZCBvYmplY3RzXG4gICAgICogQG1ldGhvZCBlYWNoXG4gICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IG9ialxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdG9yXG4gICAgICogQHBhcmFtIHthbnl9IGl0ZXJhdG9yLml0ZW1cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaXRlcmF0b3IuaW5kZXhcbiAgICAgKiBAcGFyYW0ge09iamVjdHxBcnJheX0gaXRlcmF0b3Iub2JqIHRoZSBzb3VyY2Ugb2JqZWN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgdmFsdWUgdG8gdXNlIGFzIGB0aGlzYCBpbiB0aGUgaXRlcmF0b3JcbiAgICAgKi9cbiAgICBlYWNoOiBmdW5jdGlvbiBlYWNoKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGksIGxlbjtcblxuICAgICAgICAvLyBuYXRpdmUgZm9yRWFjaCBvbiBhcnJheXNcbiAgICAgICAgaWYoJ2ZvckVhY2gnIGluIG9iaikge1xuICAgICAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgICAvLyBhcnJheXNcbiAgICAgICAgfSBlbHNlIGlmKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBvYmoubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZihpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgLy8gb2JqZWN0c1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yKGkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYob2JqLmhhc093blByb3BlcnR5KGkpICYmXG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGZpbmQgaWYgYSBzdHJpbmcgY29udGFpbnMgdGhlIHN0cmluZyB1c2luZyBpbmRleE9mXG4gICAgICogQG1ldGhvZCBpblN0clxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcmNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGZvdW5kXG4gICAgICovXG4gICAgaW5TdHI6IGZ1bmN0aW9uIGluU3RyKHNyYywgZmluZCkge1xuICAgICAgICByZXR1cm4gc3JjLmluZGV4T2YoZmluZCkgPiAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZmluZCBpZiBhIGFycmF5IGNvbnRhaW5zIHRoZSBvYmplY3QgdXNpbmcgaW5kZXhPZiBvciBhIHNpbXBsZSBwb2x5ZmlsbFxuICAgICAqIEBtZXRob2QgaW5BcnJheVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcmNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW58TnVtYmVyfSBmYWxzZSB3aGVuIG5vdCBmb3VuZCwgb3IgdGhlIGluZGV4XG4gICAgICovXG4gICAgaW5BcnJheTogZnVuY3Rpb24gaW5BcnJheShzcmMsIGZpbmQpIHtcbiAgICAgICAgaWYoc3JjLmluZGV4T2YpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHNyYy5pbmRleE9mKGZpbmQpO1xuICAgICAgICAgICAgcmV0dXJuIChpbmRleCA9PT0gLTEpID8gZmFsc2UgOiBpbmRleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHNyYy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmKHNyY1tpXSA9PT0gZmluZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY29udmVydCBhbiBhcnJheS1saWtlIG9iamVjdCAoYGFyZ3VtZW50c2AsIGB0b3VjaGxpc3RgKSB0byBhbiBhcnJheVxuICAgICAqIEBtZXRob2QgdG9BcnJheVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKi9cbiAgICB0b0FycmF5OiBmdW5jdGlvbiB0b0FycmF5KG9iaikge1xuICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqLCAwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZmluZCBpZiBhIG5vZGUgaXMgaW4gdGhlIGdpdmVuIHBhcmVudFxuICAgICAqIEBtZXRob2QgaGFzUGFyZW50XG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHBhcmVudFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGZvdW5kXG4gICAgICovXG4gICAgaGFzUGFyZW50OiBmdW5jdGlvbiBoYXNQYXJlbnQobm9kZSwgcGFyZW50KSB7XG4gICAgICAgIHdoaWxlKG5vZGUpIHtcbiAgICAgICAgICAgIGlmKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZ2V0IHRoZSBjZW50ZXIgb2YgYWxsIHRoZSB0b3VjaGVzXG4gICAgICogQG1ldGhvZCBnZXRDZW50ZXJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSB0b3VjaGVzXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBjZW50ZXIgY29udGFpbnMgYHBhZ2VYYCwgYHBhZ2VZYCwgYGNsaWVudFhgIGFuZCBgY2xpZW50WWAgcHJvcGVydGllc1xuICAgICAqL1xuICAgIGdldENlbnRlcjogZnVuY3Rpb24gZ2V0Q2VudGVyKHRvdWNoZXMpIHtcbiAgICAgICAgdmFyIHBhZ2VYID0gW10sXG4gICAgICAgICAgICBwYWdlWSA9IFtdLFxuICAgICAgICAgICAgY2xpZW50WCA9IFtdLFxuICAgICAgICAgICAgY2xpZW50WSA9IFtdLFxuICAgICAgICAgICAgbWluID0gTWF0aC5taW4sXG4gICAgICAgICAgICBtYXggPSBNYXRoLm1heDtcblxuICAgICAgICAvLyBubyBuZWVkIHRvIGxvb3Agd2hlbiBvbmx5IG9uZSB0b3VjaFxuICAgICAgICBpZih0b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYWdlWDogdG91Y2hlc1swXS5wYWdlWCxcbiAgICAgICAgICAgICAgICBwYWdlWTogdG91Y2hlc1swXS5wYWdlWSxcbiAgICAgICAgICAgICAgICBjbGllbnRYOiB0b3VjaGVzWzBdLmNsaWVudFgsXG4gICAgICAgICAgICAgICAgY2xpZW50WTogdG91Y2hlc1swXS5jbGllbnRZXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgVXRpbHMuZWFjaCh0b3VjaGVzLCBmdW5jdGlvbih0b3VjaCkge1xuICAgICAgICAgICAgcGFnZVgucHVzaCh0b3VjaC5wYWdlWCk7XG4gICAgICAgICAgICBwYWdlWS5wdXNoKHRvdWNoLnBhZ2VZKTtcbiAgICAgICAgICAgIGNsaWVudFgucHVzaCh0b3VjaC5jbGllbnRYKTtcbiAgICAgICAgICAgIGNsaWVudFkucHVzaCh0b3VjaC5jbGllbnRZKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhZ2VYOiAobWluLmFwcGx5KE1hdGgsIHBhZ2VYKSArIG1heC5hcHBseShNYXRoLCBwYWdlWCkpIC8gMixcbiAgICAgICAgICAgIHBhZ2VZOiAobWluLmFwcGx5KE1hdGgsIHBhZ2VZKSArIG1heC5hcHBseShNYXRoLCBwYWdlWSkpIC8gMixcbiAgICAgICAgICAgIGNsaWVudFg6IChtaW4uYXBwbHkoTWF0aCwgY2xpZW50WCkgKyBtYXguYXBwbHkoTWF0aCwgY2xpZW50WCkpIC8gMixcbiAgICAgICAgICAgIGNsaWVudFk6IChtaW4uYXBwbHkoTWF0aCwgY2xpZW50WSkgKyBtYXguYXBwbHkoTWF0aCwgY2xpZW50WSkpIC8gMlxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxjdWxhdGUgdGhlIHZlbG9jaXR5IGJldHdlZW4gdHdvIHBvaW50cy4gdW5pdCBpcyBpbiBweCBwZXIgbXMuXG4gICAgICogQG1ldGhvZCBnZXRWZWxvY2l0eVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVRpbWVcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGFYXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhWVxuICAgICAqIEByZXR1cm4ge09iamVjdH0gdmVsb2NpdHkgYHhgIGFuZCBgeWBcbiAgICAgKi9cbiAgICBnZXRWZWxvY2l0eTogZnVuY3Rpb24gZ2V0VmVsb2NpdHkoZGVsdGFUaW1lLCBkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogTWF0aC5hYnMoZGVsdGFYIC8gZGVsdGFUaW1lKSB8fCAwLFxuICAgICAgICAgICAgeTogTWF0aC5hYnMoZGVsdGFZIC8gZGVsdGFUaW1lKSB8fCAwXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGN1bGF0ZSB0aGUgYW5nbGUgYmV0d2VlbiB0d28gY29vcmRpbmF0ZXNcbiAgICAgKiBAbWV0aG9kIGdldEFuZ2xlXG4gICAgICogQHBhcmFtIHtUb3VjaH0gdG91Y2gxXG4gICAgICogQHBhcmFtIHtUb3VjaH0gdG91Y2gyXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBhbmdsZVxuICAgICAqL1xuICAgIGdldEFuZ2xlOiBmdW5jdGlvbiBnZXRBbmdsZSh0b3VjaDEsIHRvdWNoMikge1xuICAgICAgICB2YXIgeCA9IHRvdWNoMi5jbGllbnRYIC0gdG91Y2gxLmNsaWVudFgsXG4gICAgICAgICAgICB5ID0gdG91Y2gyLmNsaWVudFkgLSB0b3VjaDEuY2xpZW50WTtcblxuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih5LCB4KSAqIDE4MCAvIE1hdGguUEk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRvIGEgc21hbGwgY29tcGFyaXNpb24gdG8gZ2V0IHRoZSBkaXJlY3Rpb24gYmV0d2VlbiB0d28gdG91Y2hlcy5cbiAgICAgKiBAbWV0aG9kIGdldERpcmVjdGlvblxuICAgICAqIEBwYXJhbSB7VG91Y2h9IHRvdWNoMVxuICAgICAqIEBwYXJhbSB7VG91Y2h9IHRvdWNoMlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gZGlyZWN0aW9uIG1hdGNoZXMgYERJUkVDVElPTl9MRUZUfFJJR0hUfFVQfERPV05gXG4gICAgICovXG4gICAgZ2V0RGlyZWN0aW9uOiBmdW5jdGlvbiBnZXREaXJlY3Rpb24odG91Y2gxLCB0b3VjaDIpIHtcbiAgICAgICAgdmFyIHggPSBNYXRoLmFicyh0b3VjaDEuY2xpZW50WCAtIHRvdWNoMi5jbGllbnRYKSxcbiAgICAgICAgICAgIHkgPSBNYXRoLmFicyh0b3VjaDEuY2xpZW50WSAtIHRvdWNoMi5jbGllbnRZKTtcblxuICAgICAgICBpZih4ID49IHkpIHtcbiAgICAgICAgICAgIHJldHVybiB0b3VjaDEuY2xpZW50WCAtIHRvdWNoMi5jbGllbnRYID4gMCA/IERJUkVDVElPTl9MRUZUIDogRElSRUNUSU9OX1JJR0hUO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b3VjaDEuY2xpZW50WSAtIHRvdWNoMi5jbGllbnRZID4gMCA/IERJUkVDVElPTl9VUCA6IERJUkVDVElPTl9ET1dOO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxjdWxhdGUgdGhlIGRpc3RhbmNlIGJldHdlZW4gdHdvIHRvdWNoZXNcbiAgICAgKiBAbWV0aG9kIGdldERpc3RhbmNlXG4gICAgICogQHBhcmFtIHtUb3VjaH10b3VjaDFcbiAgICAgKiBAcGFyYW0ge1RvdWNofSB0b3VjaDJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IGRpc3RhbmNlXG4gICAgICovXG4gICAgZ2V0RGlzdGFuY2U6IGZ1bmN0aW9uIGdldERpc3RhbmNlKHRvdWNoMSwgdG91Y2gyKSB7XG4gICAgICAgIHZhciB4ID0gdG91Y2gyLmNsaWVudFggLSB0b3VjaDEuY2xpZW50WCxcbiAgICAgICAgICAgIHkgPSB0b3VjaDIuY2xpZW50WSAtIHRvdWNoMS5jbGllbnRZO1xuXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoKHggKiB4KSArICh5ICogeSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxjdWxhdGUgdGhlIHNjYWxlIGZhY3RvciBiZXR3ZWVuIHR3byB0b3VjaExpc3RzXG4gICAgICogbm8gc2NhbGUgaXMgMSwgYW5kIGdvZXMgZG93biB0byAwIHdoZW4gcGluY2hlZCB0b2dldGhlciwgYW5kIGJpZ2dlciB3aGVuIHBpbmNoZWQgb3V0XG4gICAgICogQG1ldGhvZCBnZXRTY2FsZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHN0YXJ0IGFycmF5IG9mIHRvdWNoZXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBlbmQgYXJyYXkgb2YgdG91Y2hlc1xuICAgICAqIEByZXR1cm4ge051bWJlcn0gc2NhbGVcbiAgICAgKi9cbiAgICBnZXRTY2FsZTogZnVuY3Rpb24gZ2V0U2NhbGUoc3RhcnQsIGVuZCkge1xuICAgICAgICAvLyBuZWVkIHR3byBmaW5nZXJzLi4uXG4gICAgICAgIGlmKHN0YXJ0Lmxlbmd0aCA+PSAyICYmIGVuZC5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGlzdGFuY2UoZW5kWzBdLCBlbmRbMV0pIC8gdGhpcy5nZXREaXN0YW5jZShzdGFydFswXSwgc3RhcnRbMV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAxO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxjdWxhdGUgdGhlIHJvdGF0aW9uIGRlZ3JlZXMgYmV0d2VlbiB0d28gdG91Y2hMaXN0c1xuICAgICAqIEBtZXRob2QgZ2V0Um90YXRpb25cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBzdGFydCBhcnJheSBvZiB0b3VjaGVzXG4gICAgICogQHBhcmFtIHtBcnJheX0gZW5kIGFycmF5IG9mIHRvdWNoZXNcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IHJvdGF0aW9uXG4gICAgICovXG4gICAgZ2V0Um90YXRpb246IGZ1bmN0aW9uIGdldFJvdGF0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgLy8gbmVlZCB0d28gZmluZ2Vyc1xuICAgICAgICBpZihzdGFydC5sZW5ndGggPj0gMiAmJiBlbmQubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEFuZ2xlKGVuZFsxXSwgZW5kWzBdKSAtIHRoaXMuZ2V0QW5nbGUoc3RhcnRbMV0sIHN0YXJ0WzBdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZmluZCBvdXQgaWYgdGhlIGRpcmVjdGlvbiBpcyB2ZXJ0aWNhbCAgICpcbiAgICAgKiBAbWV0aG9kIGlzVmVydGljYWxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGlyZWN0aW9uIG1hdGNoZXMgYERJUkVDVElPTl9VUHxET1dOYFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGlzX3ZlcnRpY2FsXG4gICAgICovXG4gICAgaXNWZXJ0aWNhbDogZnVuY3Rpb24gaXNWZXJ0aWNhbChkaXJlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fVVAgfHwgZGlyZWN0aW9uID09IERJUkVDVElPTl9ET1dOO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzZXQgY3NzIHByb3BlcnRpZXMgd2l0aCB0aGVpciBwcmVmaXhlc1xuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW3RvZ2dsZT10cnVlXVxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgc2V0UHJlZml4ZWRDc3M6IGZ1bmN0aW9uIHNldFByZWZpeGVkQ3NzKGVsZW1lbnQsIHByb3AsIHZhbHVlLCB0b2dnbGUpIHtcbiAgICAgICAgdmFyIHByZWZpeGVzID0gWycnLCAnV2Via2l0JywgJ01veicsICdPJywgJ21zJ107XG4gICAgICAgIHByb3AgPSBVdGlscy50b0NhbWVsQ2FzZShwcm9wKTtcblxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwID0gcHJvcDtcbiAgICAgICAgICAgIC8vIHByZWZpeGVzXG4gICAgICAgICAgICBpZihwcmVmaXhlc1tpXSkge1xuICAgICAgICAgICAgICAgIHAgPSBwcmVmaXhlc1tpXSArIHAuc2xpY2UoMCwgMSkudG9VcHBlckNhc2UoKSArIHAuc2xpY2UoMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRlc3QgdGhlIHN0eWxlXG4gICAgICAgICAgICBpZihwIGluIGVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlW3BdID0gKHRvZ2dsZSA9PSBudWxsIHx8IHRvZ2dsZSkgJiYgdmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdG9nZ2xlIGJyb3dzZXIgZGVmYXVsdCBiZWhhdmlvciBieSBzZXR0aW5nIGNzcyBwcm9wZXJ0aWVzLlxuICAgICAqIGB1c2VyU2VsZWN0PSdub25lJ2AgYWxzbyBzZXRzIGBlbGVtZW50Lm9uc2VsZWN0c3RhcnRgIHRvIGZhbHNlXG4gICAgICogYHVzZXJEcmFnPSdub25lJ2AgYWxzbyBzZXRzIGBlbGVtZW50Lm9uZHJhZ3N0YXJ0YCB0byBmYWxzZVxuICAgICAqXG4gICAgICogQG1ldGhvZCB0b2dnbGVCZWhhdmlvclxuICAgICAqIEBwYXJhbSB7SHRtbEVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHNcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IFt0b2dnbGU9dHJ1ZV1cbiAgICAgKi9cbiAgICB0b2dnbGVCZWhhdmlvcjogZnVuY3Rpb24gdG9nZ2xlQmVoYXZpb3IoZWxlbWVudCwgcHJvcHMsIHRvZ2dsZSkge1xuICAgICAgICBpZighcHJvcHMgfHwgIWVsZW1lbnQgfHwgIWVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldCB0aGUgY3NzIHByb3BlcnRpZXNcbiAgICAgICAgVXRpbHMuZWFjaChwcm9wcywgZnVuY3Rpb24odmFsdWUsIHByb3ApIHtcbiAgICAgICAgICAgIFV0aWxzLnNldFByZWZpeGVkQ3NzKGVsZW1lbnQsIHByb3AsIHZhbHVlLCB0b2dnbGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZmFsc2VGbiA9IHRvZ2dsZSAmJiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBhbHNvIHRoZSBkaXNhYmxlIG9uc2VsZWN0c3RhcnRcbiAgICAgICAgaWYocHJvcHMudXNlclNlbGVjdCA9PSAnbm9uZScpIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25zZWxlY3RzdGFydCA9IGZhbHNlRm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gYW5kIGRpc2FibGUgb25kcmFnc3RhcnRcbiAgICAgICAgaWYocHJvcHMudXNlckRyYWcgPT0gJ25vbmUnKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uZHJhZ3N0YXJ0ID0gZmFsc2VGbjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjb252ZXJ0IGEgc3RyaW5nIHdpdGggdW5kZXJzY29yZXMgdG8gY2FtZWxDYXNlXG4gICAgICogc28gcHJldmVudF9kZWZhdWx0IGJlY29tZXMgcHJldmVudERlZmF1bHRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBjYW1lbENhc2VTdHJcbiAgICAgKi9cbiAgICB0b0NhbWVsQ2FzZTogZnVuY3Rpb24gdG9DYW1lbENhc2Uoc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvW18tXShbYS16XSkvZywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcmV0dXJuIHNbMV0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuXG4vKipcbiAqIEBtb2R1bGUgaGFtbWVyXG4gKi9cbi8qKlxuICogQGNsYXNzIEV2ZW50XG4gKiBAc3RhdGljXG4gKi9cbnZhciBFdmVudCA9IEhhbW1lci5ldmVudCA9IHtcbiAgICAvKipcbiAgICAgKiB3aGVuIHRvdWNoIGV2ZW50cyBoYXZlIGJlZW4gZmlyZWQsIHRoaXMgaXMgdHJ1ZVxuICAgICAqIHRoaXMgaXMgdXNlZCB0byBzdG9wIG1vdXNlIGV2ZW50c1xuICAgICAqIEBwcm9wZXJ0eSBwcmV2ZW50X21vdXNlZXZlbnRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBwcmV2ZW50TW91c2VFdmVudHM6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogaWYgRVZFTlRfU1RBUlQgaGFzIGJlZW4gZmlyZWRcbiAgICAgKiBAcHJvcGVydHkgc3RhcnRlZFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgc3RhcnRlZDogZmFsc2UsXG5cbiAgICAvKipcbiAgICAgKiB3aGVuIHRoZSBtb3VzZSBpcyBob2xkIGRvd24sIHRoaXMgaXMgdHJ1ZVxuICAgICAqIEBwcm9wZXJ0eSBzaG91bGRfZGV0ZWN0XG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBzaG91bGREZXRlY3Q6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogc2ltcGxlIGV2ZW50IGJpbmRlciB3aXRoIGEgaG9vayBhbmQgc3VwcG9ydCBmb3IgbXVsdGlwbGUgdHlwZXNcbiAgICAgKiBAbWV0aG9kIG9uXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtob29rXVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBob29rLnR5cGVcbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gb24oZWxlbWVudCwgdHlwZSwgaGFuZGxlciwgaG9vaykge1xuICAgICAgICB2YXIgdHlwZXMgPSB0eXBlLnNwbGl0KCcgJyk7XG4gICAgICAgIFV0aWxzLmVhY2godHlwZXMsIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICAgIFV0aWxzLm9uKGVsZW1lbnQsIHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgaG9vayAmJiBob29rKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogc2ltcGxlIGV2ZW50IHVuYmluZGVyIHdpdGggYSBob29rIGFuZCBzdXBwb3J0IGZvciBtdWx0aXBsZSB0eXBlc1xuICAgICAqIEBtZXRob2Qgb2ZmXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtob29rXVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBob29rLnR5cGVcbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uIG9mZihlbGVtZW50LCB0eXBlLCBoYW5kbGVyLCBob29rKSB7XG4gICAgICAgIHZhciB0eXBlcyA9IHR5cGUuc3BsaXQoJyAnKTtcbiAgICAgICAgVXRpbHMuZWFjaCh0eXBlcywgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICAgICAgVXRpbHMub2ZmKGVsZW1lbnQsIHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgaG9vayAmJiBob29rKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdGhlIGNvcmUgdG91Y2ggZXZlbnQgaGFuZGxlci5cbiAgICAgKiB0aGlzIGZpbmRzIG91dCBpZiB3ZSBzaG91bGQgdG8gZGV0ZWN0IGdlc3R1cmVzXG4gICAgICogQG1ldGhvZCBvblRvdWNoXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFR5cGUgbWF0Y2hlcyBgRVZFTlRfU1RBUlR8TU9WRXxFTkRgXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqIEByZXR1cm4gb25Ub3VjaEhhbmRsZXIge0Z1bmN0aW9ufSB0aGUgY29yZSBldmVudCBoYW5kbGVyXG4gICAgICovXG4gICAgb25Ub3VjaDogZnVuY3Rpb24gb25Ub3VjaChlbGVtZW50LCBldmVudFR5cGUsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHZhciBvblRvdWNoSGFuZGxlciA9IGZ1bmN0aW9uIG9uVG91Y2hIYW5kbGVyKGV2KSB7XG4gICAgICAgICAgICB2YXIgc3JjVHlwZSA9IGV2LnR5cGUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgICAgICBpc1BvaW50ZXIgPSBIYW1tZXIuSEFTX1BPSU5URVJFVkVOVFMsXG4gICAgICAgICAgICAgICAgaXNNb3VzZSA9IFV0aWxzLmluU3RyKHNyY1R5cGUsICdtb3VzZScpLFxuICAgICAgICAgICAgICAgIHRyaWdnZXJUeXBlO1xuXG4gICAgICAgICAgICAvLyBpZiB3ZSBhcmUgaW4gYSBtb3VzZWV2ZW50LCBidXQgdGhlcmUgaGFzIGJlZW4gYSB0b3VjaGV2ZW50IHRyaWdnZXJlZCBpbiB0aGlzIHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gZG8gbm90aGluZy4gc2ltcGx5IGJyZWFrIG91dCBvZiB0aGUgZXZlbnQuXG4gICAgICAgICAgICBpZihpc01vdXNlICYmIHNlbGYucHJldmVudE1vdXNlRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBtb3VzZWJ1dHRvbiBtdXN0IGJlIGRvd25cbiAgICAgICAgICAgIH0gZWxzZSBpZihpc01vdXNlICYmIGV2ZW50VHlwZSA9PSBFVkVOVF9TVEFSVCAmJiBldi5idXR0b24gPT09IDApIHtcbiAgICAgICAgICAgICAgICBzZWxmLnByZXZlbnRNb3VzZUV2ZW50cyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHNlbGYuc2hvdWxkRGV0ZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihpc1BvaW50ZXIgJiYgZXZlbnRUeXBlID09IEVWRU5UX1NUQVJUKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zaG91bGREZXRlY3QgPSAoZXYuYnV0dG9ucyA9PT0gMSk7XG4gICAgICAgICAgICAvLyBqdXN0IGEgdmFsaWQgc3RhcnQgZXZlbnQsIGJ1dCBubyBtb3VzZVxuICAgICAgICAgICAgfSBlbHNlIGlmKCFpc01vdXNlICYmIGV2ZW50VHlwZSA9PSBFVkVOVF9TVEFSVCkge1xuICAgICAgICAgICAgICAgIHNlbGYucHJldmVudE1vdXNlRXZlbnRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLnNob3VsZERldGVjdCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgcG9pbnRlciBldmVudCBiZWZvcmUgZW50ZXJpbmcgdGhlIGRldGVjdGlvblxuICAgICAgICAgICAgaWYoaXNQb2ludGVyICYmIGV2ZW50VHlwZSAhPSBFVkVOVF9FTkQpIHtcbiAgICAgICAgICAgICAgICBQb2ludGVyRXZlbnQudXBkYXRlUG9pbnRlcihldmVudFR5cGUsIGV2KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gd2UgYXJlIGluIGEgdG91Y2gvZG93biBzdGF0ZSwgc28gYWxsb3dlZCBkZXRlY3Rpb24gb2YgZ2VzdHVyZXNcbiAgICAgICAgICAgIGlmKHNlbGYuc2hvdWxkRGV0ZWN0KSB7XG4gICAgICAgICAgICAgICAgdHJpZ2dlclR5cGUgPSBzZWxmLmRvRGV0ZWN0LmNhbGwoc2VsZiwgZXYsIGV2ZW50VHlwZSwgZWxlbWVudCwgaGFuZGxlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIC4uLmFuZCB3ZSBhcmUgZG9uZSB3aXRoIHRoZSBkZXRlY3Rpb25cbiAgICAgICAgICAgIC8vIHNvIHJlc2V0IGV2ZXJ5dGhpbmcgdG8gc3RhcnQgZWFjaCBkZXRlY3Rpb24gdG90YWxseSBmcmVzaFxuICAgICAgICAgICAgaWYodHJpZ2dlclR5cGUgPT0gRVZFTlRfRU5EKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5wcmV2ZW50TW91c2VFdmVudHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzZWxmLnNob3VsZERldGVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIFBvaW50ZXJFdmVudC5yZXNldCgpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBwb2ludGVyZXZlbnQgb2JqZWN0IGFmdGVyIHRoZSBkZXRlY3Rpb25cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoaXNQb2ludGVyICYmIGV2ZW50VHlwZSA9PSBFVkVOVF9FTkQpIHtcbiAgICAgICAgICAgICAgICBQb2ludGVyRXZlbnQudXBkYXRlUG9pbnRlcihldmVudFR5cGUsIGV2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9uKGVsZW1lbnQsIEVWRU5UX1RZUEVTW2V2ZW50VHlwZV0sIG9uVG91Y2hIYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIG9uVG91Y2hIYW5kbGVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB0aGUgY29yZSBkZXRlY3Rpb24gbWV0aG9kXG4gICAgICogdGhpcyBmaW5kcyBvdXQgd2hhdCBoYW1tZXItdG91Y2gtZXZlbnRzIHRvIHRyaWdnZXJcbiAgICAgKiBAbWV0aG9kIGRvRGV0ZWN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZSBtYXRjaGVzIGBFVkVOVF9TVEFSVHxNT1ZFfEVORGBcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gdHJpZ2dlclR5cGUgbWF0Y2hlcyBgRVZFTlRfU1RBUlR8TU9WRXxFTkRgXG4gICAgICovXG4gICAgZG9EZXRlY3Q6IGZ1bmN0aW9uIGRvRGV0ZWN0KGV2LCBldmVudFR5cGUsIGVsZW1lbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIHRvdWNoTGlzdCA9IHRoaXMuZ2V0VG91Y2hMaXN0KGV2LCBldmVudFR5cGUpO1xuICAgICAgICB2YXIgdG91Y2hMaXN0TGVuZ3RoID0gdG91Y2hMaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIHRyaWdnZXJUeXBlID0gZXZlbnRUeXBlO1xuICAgICAgICB2YXIgdHJpZ2dlckNoYW5nZSA9IHRvdWNoTGlzdC50cmlnZ2VyOyAvLyB1c2VkIGJ5IGZha2VNdWx0aXRvdWNoIHBsdWdpblxuICAgICAgICB2YXIgY2hhbmdlZExlbmd0aCA9IHRvdWNoTGlzdExlbmd0aDtcblxuICAgICAgICAvLyBhdCBlYWNoIHRvdWNoc3RhcnQtbGlrZSBldmVudCB3ZSB3YW50IGFsc28gd2FudCB0byB0cmlnZ2VyIGEgVE9VQ0ggZXZlbnQuLi5cbiAgICAgICAgaWYoZXZlbnRUeXBlID09IEVWRU5UX1NUQVJUKSB7XG4gICAgICAgICAgICB0cmlnZ2VyQ2hhbmdlID0gRVZFTlRfVE9VQ0g7XG4gICAgICAgIC8vIC4uLnRoZSBzYW1lIGZvciBhIHRvdWNoZW5kLWxpa2UgZXZlbnRcbiAgICAgICAgfSBlbHNlIGlmKGV2ZW50VHlwZSA9PSBFVkVOVF9FTkQpIHtcbiAgICAgICAgICAgIHRyaWdnZXJDaGFuZ2UgPSBFVkVOVF9SRUxFQVNFO1xuXG4gICAgICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIGhvdyBtYW55IHRvdWNoZXMgaGF2ZSBiZWVuIHJlbW92ZWRcbiAgICAgICAgICAgIGNoYW5nZWRMZW5ndGggPSB0b3VjaExpc3QubGVuZ3RoIC0gKChldi5jaGFuZ2VkVG91Y2hlcykgPyBldi5jaGFuZ2VkVG91Y2hlcy5sZW5ndGggOiAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFmdGVyIHRoZXJlIGFyZSBzdGlsbCB0b3VjaGVzIG9uIHRoZSBzY3JlZW4sXG4gICAgICAgIC8vIHdlIGp1c3Qgd2FudCB0byB0cmlnZ2VyIGEgTU9WRSBldmVudC4gc28gY2hhbmdlIHRoZSBTVEFSVCBvciBFTkQgdG8gYSBNT1ZFXG4gICAgICAgIC8vIGJ1dCBvbmx5IGFmdGVyIGRldGVjdGlvbiBoYXMgYmVlbiBzdGFydGVkLCB0aGUgZmlyc3QgdGltZSB3ZSBhY3R1YWx5IHdhbnQgYSBTVEFSVFxuICAgICAgICBpZihjaGFuZ2VkTGVuZ3RoID4gMCAmJiB0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHRyaWdnZXJUeXBlID0gRVZFTlRfTU9WRTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRldGVjdGlvbiBoYXMgYmVlbiBzdGFydGVkLCB3ZSBrZWVwIHRyYWNrIG9mIHRoaXMsIHNlZSBhYm92ZVxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIGdlbmVyYXRlIHNvbWUgZXZlbnQgZGF0YSwgc29tZSBiYXNpYyBpbmZvcm1hdGlvblxuICAgICAgICB2YXIgZXZEYXRhID0gdGhpcy5jb2xsZWN0RXZlbnREYXRhKGVsZW1lbnQsIHRyaWdnZXJUeXBlLCB0b3VjaExpc3QsIGV2KTtcblxuICAgICAgICAvLyB0cmlnZ2VyIHRoZSB0cmlnZ2VyVHlwZSBldmVudCBiZWZvcmUgdGhlIGNoYW5nZSAoVE9VQ0gsIFJFTEVBU0UpIGV2ZW50c1xuICAgICAgICAvLyBidXQgdGhlIEVORCBldmVudCBzaG91bGQgYmUgYXQgbGFzdFxuICAgICAgICBpZihldmVudFR5cGUgIT0gRVZFTlRfRU5EKSB7XG4gICAgICAgICAgICBoYW5kbGVyLmNhbGwoRGV0ZWN0aW9uLCBldkRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJpZ2dlciBhIGNoYW5nZSAoVE9VQ0gsIFJFTEVBU0UpIGV2ZW50LCB0aGlzIG1lYW5zIHRoZSBsZW5ndGggb2YgdGhlIHRvdWNoZXMgY2hhbmdlZFxuICAgICAgICBpZih0cmlnZ2VyQ2hhbmdlKSB7XG4gICAgICAgICAgICBldkRhdGEuY2hhbmdlZExlbmd0aCA9IGNoYW5nZWRMZW5ndGg7XG4gICAgICAgICAgICBldkRhdGEuZXZlbnRUeXBlID0gdHJpZ2dlckNoYW5nZTtcblxuICAgICAgICAgICAgaGFuZGxlci5jYWxsKERldGVjdGlvbiwgZXZEYXRhKTtcblxuICAgICAgICAgICAgZXZEYXRhLmV2ZW50VHlwZSA9IHRyaWdnZXJUeXBlO1xuICAgICAgICAgICAgZGVsZXRlIGV2RGF0YS5jaGFuZ2VkTGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJpZ2dlciB0aGUgRU5EIGV2ZW50XG4gICAgICAgIGlmKHRyaWdnZXJUeXBlID09IEVWRU5UX0VORCkge1xuICAgICAgICAgICAgaGFuZGxlci5jYWxsKERldGVjdGlvbiwgZXZEYXRhKTtcblxuICAgICAgICAgICAgLy8gLi4uYW5kIHdlIGFyZSBkb25lIHdpdGggdGhlIGRldGVjdGlvblxuICAgICAgICAgICAgLy8gc28gcmVzZXQgZXZlcnl0aGluZyB0byBzdGFydCBlYWNoIGRldGVjdGlvbiB0b3RhbGx5IGZyZXNoXG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cmlnZ2VyVHlwZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogd2UgaGF2ZSBkaWZmZXJlbnQgZXZlbnRzIGZvciBlYWNoIGRldmljZS9icm93c2VyXG4gICAgICogZGV0ZXJtaW5lIHdoYXQgd2UgbmVlZCBhbmQgc2V0IHRoZW0gaW4gdGhlIEVWRU5UX1RZUEVTIGNvbnN0YW50XG4gICAgICogdGhlIGBvblRvdWNoYCBtZXRob2QgaXMgYmluZCB0byB0aGVzZSBwcm9wZXJ0aWVzLlxuICAgICAqIEBtZXRob2QgZGV0ZXJtaW5lRXZlbnRUeXBlc1xuICAgICAqIEByZXR1cm4ge09iamVjdH0gZXZlbnRzXG4gICAgICovXG4gICAgZGV0ZXJtaW5lRXZlbnRUeXBlczogZnVuY3Rpb24gZGV0ZXJtaW5lRXZlbnRUeXBlcygpIHtcbiAgICAgICAgdmFyIHR5cGVzO1xuICAgICAgICBpZihIYW1tZXIuSEFTX1BPSU5URVJFVkVOVFMpIHtcbiAgICAgICAgICAgIGlmKHdpbmRvdy5Qb2ludGVyRXZlbnQpIHtcbiAgICAgICAgICAgICAgICB0eXBlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3BvaW50ZXJkb3duJyxcbiAgICAgICAgICAgICAgICAgICAgJ3BvaW50ZXJtb3ZlJyxcbiAgICAgICAgICAgICAgICAgICAgJ3BvaW50ZXJ1cCBwb2ludGVyY2FuY2VsIGxvc3Rwb2ludGVyY2FwdHVyZSdcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ01TUG9pbnRlckRvd24nLFxuICAgICAgICAgICAgICAgICAgICAnTVNQb2ludGVyTW92ZScsXG4gICAgICAgICAgICAgICAgICAgICdNU1BvaW50ZXJVcCBNU1BvaW50ZXJDYW5jZWwgTVNMb3N0UG9pbnRlckNhcHR1cmUnXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmKEhhbW1lci5OT19NT1VTRUVWRU5UUykge1xuICAgICAgICAgICAgdHlwZXMgPSBbXG4gICAgICAgICAgICAgICAgJ3RvdWNoc3RhcnQnLFxuICAgICAgICAgICAgICAgICd0b3VjaG1vdmUnLFxuICAgICAgICAgICAgICAgICd0b3VjaGVuZCB0b3VjaGNhbmNlbCdcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0eXBlcyA9IFtcbiAgICAgICAgICAgICAgICAndG91Y2hzdGFydCBtb3VzZWRvd24nLFxuICAgICAgICAgICAgICAgICd0b3VjaG1vdmUgbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgICAgICAndG91Y2hlbmQgdG91Y2hjYW5jZWwgbW91c2V1cCdcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cblxuICAgICAgICBFVkVOVF9UWVBFU1tFVkVOVF9TVEFSVF0gPSB0eXBlc1swXTtcbiAgICAgICAgRVZFTlRfVFlQRVNbRVZFTlRfTU9WRV0gPSB0eXBlc1sxXTtcbiAgICAgICAgRVZFTlRfVFlQRVNbRVZFTlRfRU5EXSA9IHR5cGVzWzJdO1xuICAgICAgICByZXR1cm4gRVZFTlRfVFlQRVM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNyZWF0ZSB0b3VjaExpc3QgZGVwZW5kaW5nIG9uIHRoZSBldmVudFxuICAgICAqIEBtZXRob2QgZ2V0VG91Y2hMaXN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZVxuICAgICAqIEByZXR1cm4ge0FycmF5fSB0b3VjaGVzXG4gICAgICovXG4gICAgZ2V0VG91Y2hMaXN0OiBmdW5jdGlvbiBnZXRUb3VjaExpc3QoZXYsIGV2ZW50VHlwZSkge1xuICAgICAgICAvLyBnZXQgdGhlIGZha2UgcG9pbnRlckV2ZW50IHRvdWNobGlzdFxuICAgICAgICBpZihIYW1tZXIuSEFTX1BPSU5URVJFVkVOVFMpIHtcbiAgICAgICAgICAgIHJldHVybiBQb2ludGVyRXZlbnQuZ2V0VG91Y2hMaXN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBnZXQgdGhlIHRvdWNobGlzdFxuICAgICAgICBpZihldi50b3VjaGVzKSB7XG4gICAgICAgICAgICBpZihldmVudFR5cGUgPT0gRVZFTlRfTU9WRSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBldi50b3VjaGVzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaWRlbnRpZmllcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBjb25jYXQgPSBbXS5jb25jYXQoVXRpbHMudG9BcnJheShldi50b3VjaGVzKSwgVXRpbHMudG9BcnJheShldi5jaGFuZ2VkVG91Y2hlcykpO1xuICAgICAgICAgICAgdmFyIHRvdWNoTGlzdCA9IFtdO1xuXG4gICAgICAgICAgICBVdGlscy5lYWNoKGNvbmNhdCwgZnVuY3Rpb24odG91Y2gpIHtcbiAgICAgICAgICAgICAgICBpZihVdGlscy5pbkFycmF5KGlkZW50aWZpZXJzLCB0b3VjaC5pZGVudGlmaWVyKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdG91Y2hMaXN0LnB1c2godG91Y2gpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZGVudGlmaWVycy5wdXNoKHRvdWNoLmlkZW50aWZpZXIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0b3VjaExpc3Q7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtYWtlIGZha2UgdG91Y2hMaXN0IGZyb20gbW91c2UgcG9zaXRpb25cbiAgICAgICAgZXYuaWRlbnRpZmllciA9IDE7XG4gICAgICAgIHJldHVybiBbZXZdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjb2xsZWN0IGJhc2ljIGV2ZW50IGRhdGFcbiAgICAgKiBAbWV0aG9kIGNvbGxlY3RFdmVudERhdGFcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZSBtYXRjaGVzIGBFVkVOVF9TVEFSVHxNT1ZFfEVORGBcbiAgICAgKiBAcGFyYW0ge0FycmF5fSB0b3VjaGVzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHJldHVybiB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGNvbGxlY3RFdmVudERhdGE6IGZ1bmN0aW9uIGNvbGxlY3RFdmVudERhdGEoZWxlbWVudCwgZXZlbnRUeXBlLCB0b3VjaGVzLCBldikge1xuICAgICAgICAvLyBmaW5kIG91dCBwb2ludGVyVHlwZVxuICAgICAgICB2YXIgcG9pbnRlclR5cGUgPSBQT0lOVEVSX1RPVUNIO1xuICAgICAgICBpZihVdGlscy5pblN0cihldi50eXBlLCAnbW91c2UnKSB8fCBQb2ludGVyRXZlbnQubWF0Y2hUeXBlKFBPSU5URVJfTU9VU0UsIGV2KSkge1xuICAgICAgICAgICAgcG9pbnRlclR5cGUgPSBQT0lOVEVSX01PVVNFO1xuICAgICAgICB9IGVsc2UgaWYoUG9pbnRlckV2ZW50Lm1hdGNoVHlwZShQT0lOVEVSX1BFTiwgZXYpKSB7XG4gICAgICAgICAgICBwb2ludGVyVHlwZSA9IFBPSU5URVJfUEVOO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNlbnRlcjogVXRpbHMuZ2V0Q2VudGVyKHRvdWNoZXMpLFxuICAgICAgICAgICAgdGltZVN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgdGFyZ2V0OiBldi50YXJnZXQsXG4gICAgICAgICAgICB0b3VjaGVzOiB0b3VjaGVzLFxuICAgICAgICAgICAgZXZlbnRUeXBlOiBldmVudFR5cGUsXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogcG9pbnRlclR5cGUsXG4gICAgICAgICAgICBzcmNFdmVudDogZXYsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogcHJldmVudCB0aGUgYnJvd3NlciBkZWZhdWx0IGFjdGlvbnNcbiAgICAgICAgICAgICAqIG1vc3RseSB1c2VkIHRvIGRpc2FibGUgc2Nyb2xsaW5nIG9mIHRoZSBicm93c2VyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3JjRXZlbnQgPSB0aGlzLnNyY0V2ZW50O1xuICAgICAgICAgICAgICAgIHNyY0V2ZW50LnByZXZlbnRNYW5pcHVsYXRpb24gJiYgc3JjRXZlbnQucHJldmVudE1hbmlwdWxhdGlvbigpO1xuICAgICAgICAgICAgICAgIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0ICYmIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHN0b3AgYnViYmxpbmcgdGhlIGV2ZW50IHVwIHRvIGl0cyBwYXJlbnRzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHN0b3BQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zcmNFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogaW1tZWRpYXRlbHkgc3RvcCBnZXN0dXJlIGRldGVjdGlvblxuICAgICAgICAgICAgICogbWlnaHQgYmUgdXNlZnVsIGFmdGVyIGEgc3dpcGUgd2FzIGRldGVjdGVkXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzdG9wRGV0ZWN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRGV0ZWN0aW9uLnN0b3BEZXRlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG5cbi8qKlxuICogQG1vZHVsZSBoYW1tZXJcbiAqXG4gKiBAY2xhc3MgUG9pbnRlckV2ZW50XG4gKiBAc3RhdGljXG4gKi9cbnZhciBQb2ludGVyRXZlbnQgPSBIYW1tZXIuUG9pbnRlckV2ZW50ID0ge1xuICAgIC8qKlxuICAgICAqIGhvbGRzIGFsbCBwb2ludGVycywgYnkgYGlkZW50aWZpZXJgXG4gICAgICogQHByb3BlcnR5IHBvaW50ZXJzXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBwb2ludGVyczoge30sXG5cbiAgICAvKipcbiAgICAgKiBnZXQgdGhlIHBvaW50ZXJzIGFzIGFuIGFycmF5XG4gICAgICogQG1ldGhvZCBnZXRUb3VjaExpc3RcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gdG91Y2hsaXN0XG4gICAgICovXG4gICAgZ2V0VG91Y2hMaXN0OiBmdW5jdGlvbiBnZXRUb3VjaExpc3QoKSB7XG4gICAgICAgIHZhciB0b3VjaGxpc3QgPSBbXTtcbiAgICAgICAgLy8gd2UgY2FuIHVzZSBmb3JFYWNoIHNpbmNlIHBvaW50ZXJFdmVudHMgb25seSBpcyBpbiBJRTEwXG4gICAgICAgIFV0aWxzLmVhY2godGhpcy5wb2ludGVycywgZnVuY3Rpb24ocG9pbnRlcikge1xuICAgICAgICAgICAgdG91Y2hsaXN0LnB1c2gocG9pbnRlcik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdG91Y2hsaXN0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1cGRhdGUgdGhlIHBvc2l0aW9uIG9mIGEgcG9pbnRlclxuICAgICAqIEBtZXRob2QgdXBkYXRlUG9pbnRlclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFR5cGUgbWF0Y2hlcyBgRVZFTlRfU1RBUlR8TU9WRXxFTkRgXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBvaW50ZXJFdmVudFxuICAgICAqL1xuICAgIHVwZGF0ZVBvaW50ZXI6IGZ1bmN0aW9uIHVwZGF0ZVBvaW50ZXIoZXZlbnRUeXBlLCBwb2ludGVyRXZlbnQpIHtcbiAgICAgICAgaWYoZXZlbnRUeXBlID09IEVWRU5UX0VORCB8fCAoZXZlbnRUeXBlICE9IEVWRU5UX0VORCAmJiBwb2ludGVyRXZlbnQuYnV0dG9ucyAhPT0gMSkpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnBvaW50ZXJzW3BvaW50ZXJFdmVudC5wb2ludGVySWRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmlkZW50aWZpZXIgPSBwb2ludGVyRXZlbnQucG9pbnRlcklkO1xuICAgICAgICAgICAgdGhpcy5wb2ludGVyc1twb2ludGVyRXZlbnQucG9pbnRlcklkXSA9IHBvaW50ZXJFdmVudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjaGVjayBpZiBldiBtYXRjaGVzIHBvaW50ZXJ0eXBlXG4gICAgICogQG1ldGhvZCBtYXRjaFR5cGVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcG9pbnRlclR5cGUgbWF0Y2hlcyBgUE9JTlRFUl9NT1VTRXxUT1VDSHxQRU5gXG4gICAgICogQHBhcmFtIHtQb2ludGVyRXZlbnR9IGV2XG4gICAgICovXG4gICAgbWF0Y2hUeXBlOiBmdW5jdGlvbiBtYXRjaFR5cGUocG9pbnRlclR5cGUsIGV2KSB7XG4gICAgICAgIGlmKCFldi5wb2ludGVyVHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHB0ID0gZXYucG9pbnRlclR5cGUsXG4gICAgICAgICAgICB0eXBlcyA9IHt9O1xuXG4gICAgICAgIHR5cGVzW1BPSU5URVJfTU9VU0VdID0gKHB0ID09PSAoZXYuTVNQT0lOVEVSX1RZUEVfTU9VU0UgfHwgUE9JTlRFUl9NT1VTRSkpO1xuICAgICAgICB0eXBlc1tQT0lOVEVSX1RPVUNIXSA9IChwdCA9PT0gKGV2Lk1TUE9JTlRFUl9UWVBFX1RPVUNIIHx8IFBPSU5URVJfVE9VQ0gpKTtcbiAgICAgICAgdHlwZXNbUE9JTlRFUl9QRU5dID0gKHB0ID09PSAoZXYuTVNQT0lOVEVSX1RZUEVfUEVOIHx8IFBPSU5URVJfUEVOKSk7XG4gICAgICAgIHJldHVybiB0eXBlc1twb2ludGVyVHlwZV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlc2V0IHRoZSBzdG9yZWQgcG9pbnRlcnNcbiAgICAgKiBAbWV0aG9kIHJlc2V0XG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0TGlzdCgpIHtcbiAgICAgICAgdGhpcy5wb2ludGVycyA9IHt9O1xuICAgIH1cbn07XG5cblxuLyoqXG4gKiBAbW9kdWxlIGhhbW1lclxuICpcbiAqIEBjbGFzcyBEZXRlY3Rpb25cbiAqIEBzdGF0aWNcbiAqL1xudmFyIERldGVjdGlvbiA9IEhhbW1lci5kZXRlY3Rpb24gPSB7XG4gICAgLy8gY29udGFpbnMgYWxsIHJlZ2lzdHJlZCBIYW1tZXIuZ2VzdHVyZXMgaW4gdGhlIGNvcnJlY3Qgb3JkZXJcbiAgICBnZXN0dXJlczogW10sXG5cbiAgICAvLyBkYXRhIG9mIHRoZSBjdXJyZW50IEhhbW1lci5nZXN0dXJlIGRldGVjdGlvbiBzZXNzaW9uXG4gICAgY3VycmVudDogbnVsbCxcblxuICAgIC8vIHRoZSBwcmV2aW91cyBIYW1tZXIuZ2VzdHVyZSBzZXNzaW9uIGRhdGFcbiAgICAvLyBpcyBhIGZ1bGwgY2xvbmUgb2YgdGhlIHByZXZpb3VzIGdlc3R1cmUuY3VycmVudCBvYmplY3RcbiAgICBwcmV2aW91czogbnVsbCxcblxuICAgIC8vIHdoZW4gdGhpcyBiZWNvbWVzIHRydWUsIG5vIGdlc3R1cmVzIGFyZSBmaXJlZFxuICAgIHN0b3BwZWQ6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogc3RhcnQgSGFtbWVyLmdlc3R1cmUgZGV0ZWN0aW9uXG4gICAgICogQG1ldGhvZCBzdGFydERldGVjdFxuICAgICAqIEBwYXJhbSB7SGFtbWVyLkluc3RhbmNlfSBpbnN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50RGF0YVxuICAgICAqL1xuICAgIHN0YXJ0RGV0ZWN0OiBmdW5jdGlvbiBzdGFydERldGVjdChpbnN0LCBldmVudERhdGEpIHtcbiAgICAgICAgLy8gYWxyZWFkeSBidXN5IHdpdGggYSBIYW1tZXIuZ2VzdHVyZSBkZXRlY3Rpb24gb24gYW4gZWxlbWVudFxuICAgICAgICBpZih0aGlzLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RvcHBlZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGhvbGRzIGN1cnJlbnQgc2Vzc2lvblxuICAgICAgICB0aGlzLmN1cnJlbnQgPSB7XG4gICAgICAgICAgICBpbnN0OiBpbnN0LCAvLyByZWZlcmVuY2UgdG8gSGFtbWVySW5zdGFuY2Ugd2UncmUgd29ya2luZyBmb3JcbiAgICAgICAgICAgIHN0YXJ0RXZlbnQ6IFV0aWxzLmV4dGVuZCh7fSwgZXZlbnREYXRhKSwgLy8gc3RhcnQgZXZlbnREYXRhIGZvciBkaXN0YW5jZXMsIHRpbWluZyBldGNcbiAgICAgICAgICAgIGxhc3RFdmVudDogZmFsc2UsIC8vIGxhc3QgZXZlbnREYXRhXG4gICAgICAgICAgICBsYXN0Q2FsY0V2ZW50OiBmYWxzZSwgLy8gbGFzdCBldmVudERhdGEgZm9yIGNhbGN1bGF0aW9ucy5cbiAgICAgICAgICAgIGZ1dHVyZUNhbGNFdmVudDogZmFsc2UsIC8vIGxhc3QgZXZlbnREYXRhIGZvciBjYWxjdWxhdGlvbnMuXG4gICAgICAgICAgICBsYXN0Q2FsY0RhdGE6IHt9LCAvLyBsYXN0IGxhc3RDYWxjRGF0YVxuICAgICAgICAgICAgbmFtZTogJycgLy8gY3VycmVudCBnZXN0dXJlIHdlJ3JlIGluL2RldGVjdGVkLCBjYW4gYmUgJ3RhcCcsICdob2xkJyBldGNcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRldGVjdChldmVudERhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW1tZXIuZ2VzdHVyZSBkZXRlY3Rpb25cbiAgICAgKiBAbWV0aG9kIGRldGVjdFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudERhdGFcbiAgICAgKiBAcmV0dXJuIHthbnl9XG4gICAgICovXG4gICAgZGV0ZWN0OiBmdW5jdGlvbiBkZXRlY3QoZXZlbnREYXRhKSB7XG4gICAgICAgIGlmKCF0aGlzLmN1cnJlbnQgfHwgdGhpcy5zdG9wcGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBleHRlbmQgZXZlbnQgZGF0YSB3aXRoIGNhbGN1bGF0aW9ucyBhYm91dCBzY2FsZSwgZGlzdGFuY2UgZXRjXG4gICAgICAgIGV2ZW50RGF0YSA9IHRoaXMuZXh0ZW5kRXZlbnREYXRhKGV2ZW50RGF0YSk7XG5cbiAgICAgICAgLy8gaGFtbWVyIGluc3RhbmNlIGFuZCBpbnN0YW5jZSBvcHRpb25zXG4gICAgICAgIHZhciBpbnN0ID0gdGhpcy5jdXJyZW50Lmluc3QsXG4gICAgICAgICAgICBpbnN0T3B0aW9ucyA9IGluc3Qub3B0aW9ucztcblxuICAgICAgICAvLyBjYWxsIEhhbW1lci5nZXN0dXJlIGhhbmRsZXJzXG4gICAgICAgIFV0aWxzLmVhY2godGhpcy5nZXN0dXJlcywgZnVuY3Rpb24gdHJpZ2dlckdlc3R1cmUoZ2VzdHVyZSkge1xuICAgICAgICAgICAgLy8gb25seSB3aGVuIHRoZSBpbnN0YW5jZSBvcHRpb25zIGhhdmUgZW5hYmxlZCB0aGlzIGdlc3R1cmVcbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3BwZWQgJiYgaW5zdC5lbmFibGVkICYmIGluc3RPcHRpb25zW2dlc3R1cmUubmFtZV0pIHtcbiAgICAgICAgICAgICAgICAvLyBpZiBhIGhhbmRsZXIgcmV0dXJucyBmYWxzZSwgd2Ugc3RvcCB3aXRoIHRoZSBkZXRlY3Rpb25cbiAgICAgICAgICAgICAgICBpZihnZXN0dXJlLmhhbmRsZXIuY2FsbChnZXN0dXJlLCBldmVudERhdGEsIGluc3QpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3BEZXRlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gc3RvcmUgYXMgcHJldmlvdXMgZXZlbnQgZXZlbnRcbiAgICAgICAgaWYodGhpcy5jdXJyZW50KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQubGFzdEV2ZW50ID0gZXZlbnREYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZXZlbnREYXRhLmV2ZW50VHlwZSA9PSBFVkVOVF9FTkQpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcERldGVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV2ZW50RGF0YTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY2xlYXIgdGhlIEhhbW1lci5nZXN0dXJlIHZhcnNcbiAgICAgKiB0aGlzIGlzIGNhbGxlZCBvbiBlbmREZXRlY3QsIGJ1dCBjYW4gYWxzbyBiZSB1c2VkIHdoZW4gYSBmaW5hbCBIYW1tZXIuZ2VzdHVyZSBoYXMgYmVlbiBkZXRlY3RlZFxuICAgICAqIHRvIHN0b3Agb3RoZXIgSGFtbWVyLmdlc3R1cmVzIGZyb20gYmVpbmcgZmlyZWRcbiAgICAgKiBAbWV0aG9kIHN0b3BEZXRlY3RcbiAgICAgKi9cbiAgICBzdG9wRGV0ZWN0OiBmdW5jdGlvbiBzdG9wRGV0ZWN0KCkge1xuICAgICAgICAvLyBjbG9uZSBjdXJyZW50IGRhdGEgdG8gdGhlIHN0b3JlIGFzIHRoZSBwcmV2aW91cyBnZXN0dXJlXG4gICAgICAgIC8vIHVzZWQgZm9yIHRoZSBkb3VibGUgdGFwIGdlc3R1cmUsIHNpbmNlIHRoaXMgaXMgYW4gb3RoZXIgZ2VzdHVyZSBkZXRlY3Qgc2Vzc2lvblxuICAgICAgICB0aGlzLnByZXZpb3VzID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLmN1cnJlbnQpO1xuXG4gICAgICAgIC8vIHJlc2V0IHRoZSBjdXJyZW50XG4gICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuc3RvcHBlZCA9IHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGN1bGF0ZSB2ZWxvY2l0eSwgYW5nbGUgYW5kIGRpcmVjdGlvblxuICAgICAqIEBtZXRob2QgZ2V0VmVsb2NpdHlEYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNlbnRlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVRpbWVcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGFYXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhWVxuICAgICAqL1xuICAgIGdldENhbGN1bGF0ZWREYXRhOiBmdW5jdGlvbiBnZXRDYWxjdWxhdGVkRGF0YShldiwgY2VudGVyLCBkZWx0YVRpbWUsIGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIHZhciBjdXIgPSB0aGlzLmN1cnJlbnQsXG4gICAgICAgICAgICByZWNhbGMgPSBmYWxzZSxcbiAgICAgICAgICAgIGNhbGNFdiA9IGN1ci5sYXN0Q2FsY0V2ZW50LFxuICAgICAgICAgICAgY2FsY0RhdGEgPSBjdXIubGFzdENhbGNEYXRhO1xuXG4gICAgICAgIGlmKGNhbGNFdiAmJiBldi50aW1lU3RhbXAgLSBjYWxjRXYudGltZVN0YW1wID4gSGFtbWVyLkNBTENVTEFURV9JTlRFUlZBTCkge1xuICAgICAgICAgICAgY2VudGVyID0gY2FsY0V2LmNlbnRlcjtcbiAgICAgICAgICAgIGRlbHRhVGltZSA9IGV2LnRpbWVTdGFtcCAtIGNhbGNFdi50aW1lU3RhbXA7XG4gICAgICAgICAgICBkZWx0YVggPSBldi5jZW50ZXIuY2xpZW50WCAtIGNhbGNFdi5jZW50ZXIuY2xpZW50WDtcbiAgICAgICAgICAgIGRlbHRhWSA9IGV2LmNlbnRlci5jbGllbnRZIC0gY2FsY0V2LmNlbnRlci5jbGllbnRZO1xuICAgICAgICAgICAgcmVjYWxjID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGV2LmV2ZW50VHlwZSA9PSBFVkVOVF9UT1VDSCB8fCBldi5ldmVudFR5cGUgPT0gRVZFTlRfUkVMRUFTRSkge1xuICAgICAgICAgICAgY3VyLmZ1dHVyZUNhbGNFdmVudCA9IGV2O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIWN1ci5sYXN0Q2FsY0V2ZW50IHx8IHJlY2FsYykge1xuICAgICAgICAgICAgY2FsY0RhdGEudmVsb2NpdHkgPSBVdGlscy5nZXRWZWxvY2l0eShkZWx0YVRpbWUsIGRlbHRhWCwgZGVsdGFZKTtcbiAgICAgICAgICAgIGNhbGNEYXRhLmFuZ2xlID0gVXRpbHMuZ2V0QW5nbGUoY2VudGVyLCBldi5jZW50ZXIpO1xuICAgICAgICAgICAgY2FsY0RhdGEuZGlyZWN0aW9uID0gVXRpbHMuZ2V0RGlyZWN0aW9uKGNlbnRlciwgZXYuY2VudGVyKTtcblxuICAgICAgICAgICAgY3VyLmxhc3RDYWxjRXZlbnQgPSBjdXIuZnV0dXJlQ2FsY0V2ZW50IHx8IGV2O1xuICAgICAgICAgICAgY3VyLmZ1dHVyZUNhbGNFdmVudCA9IGV2O1xuICAgICAgICB9XG5cbiAgICAgICAgZXYudmVsb2NpdHlYID0gY2FsY0RhdGEudmVsb2NpdHkueDtcbiAgICAgICAgZXYudmVsb2NpdHlZID0gY2FsY0RhdGEudmVsb2NpdHkueTtcbiAgICAgICAgZXYuaW50ZXJpbUFuZ2xlID0gY2FsY0RhdGEuYW5nbGU7XG4gICAgICAgIGV2LmludGVyaW1EaXJlY3Rpb24gPSBjYWxjRGF0YS5kaXJlY3Rpb247XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGV4dGVuZCBldmVudERhdGEgZm9yIEhhbW1lci5nZXN0dXJlc1xuICAgICAqIEBtZXRob2QgZXh0ZW5kRXZlbnREYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHJldHVybiB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGV4dGVuZEV2ZW50RGF0YTogZnVuY3Rpb24gZXh0ZW5kRXZlbnREYXRhKGV2KSB7XG4gICAgICAgIHZhciBjdXIgPSB0aGlzLmN1cnJlbnQsXG4gICAgICAgICAgICBzdGFydEV2ID0gY3VyLnN0YXJ0RXZlbnQsXG4gICAgICAgICAgICBsYXN0RXYgPSBjdXIubGFzdEV2ZW50IHx8IHN0YXJ0RXY7XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBzdGFydCB0b3VjaGxpc3QgdG8gY2FsY3VsYXRlIHRoZSBzY2FsZS9yb3RhdGlvblxuICAgICAgICBpZihldi5ldmVudFR5cGUgPT0gRVZFTlRfVE9VQ0ggfHwgZXYuZXZlbnRUeXBlID09IEVWRU5UX1JFTEVBU0UpIHtcbiAgICAgICAgICAgIHN0YXJ0RXYudG91Y2hlcyA9IFtdO1xuICAgICAgICAgICAgVXRpbHMuZWFjaChldi50b3VjaGVzLCBmdW5jdGlvbih0b3VjaCkge1xuICAgICAgICAgICAgICAgIHN0YXJ0RXYudG91Y2hlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50WDogdG91Y2guY2xpZW50WCxcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50WTogdG91Y2guY2xpZW50WVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGVsdGFUaW1lID0gZXYudGltZVN0YW1wIC0gc3RhcnRFdi50aW1lU3RhbXAsXG4gICAgICAgICAgICBkZWx0YVggPSBldi5jZW50ZXIuY2xpZW50WCAtIHN0YXJ0RXYuY2VudGVyLmNsaWVudFgsXG4gICAgICAgICAgICBkZWx0YVkgPSBldi5jZW50ZXIuY2xpZW50WSAtIHN0YXJ0RXYuY2VudGVyLmNsaWVudFk7XG5cbiAgICAgICAgdGhpcy5nZXRDYWxjdWxhdGVkRGF0YShldiwgbGFzdEV2LmNlbnRlciwgZGVsdGFUaW1lLCBkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgVXRpbHMuZXh0ZW5kKGV2LCB7XG4gICAgICAgICAgICBzdGFydEV2ZW50OiBzdGFydEV2LFxuXG4gICAgICAgICAgICBkZWx0YVRpbWU6IGRlbHRhVGltZSxcbiAgICAgICAgICAgIGRlbHRhWDogZGVsdGFYLFxuICAgICAgICAgICAgZGVsdGFZOiBkZWx0YVksXG5cbiAgICAgICAgICAgIGRpc3RhbmNlOiBVdGlscy5nZXREaXN0YW5jZShzdGFydEV2LmNlbnRlciwgZXYuY2VudGVyKSxcbiAgICAgICAgICAgIGFuZ2xlOiBVdGlscy5nZXRBbmdsZShzdGFydEV2LmNlbnRlciwgZXYuY2VudGVyKSxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogVXRpbHMuZ2V0RGlyZWN0aW9uKHN0YXJ0RXYuY2VudGVyLCBldi5jZW50ZXIpLFxuICAgICAgICAgICAgc2NhbGU6IFV0aWxzLmdldFNjYWxlKHN0YXJ0RXYudG91Y2hlcywgZXYudG91Y2hlcyksXG4gICAgICAgICAgICByb3RhdGlvbjogVXRpbHMuZ2V0Um90YXRpb24oc3RhcnRFdi50b3VjaGVzLCBldi50b3VjaGVzKVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZXY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlZ2lzdGVyIG5ldyBnZXN0dXJlXG4gICAgICogQG1ldGhvZCByZWdpc3RlclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBnZXN0dXJlIG9iamVjdCwgc2VlIGBnZXN0dXJlcy9gIGZvciBkb2N1bWVudGF0aW9uXG4gICAgICogQHJldHVybiB7QXJyYXl9IGdlc3R1cmVzXG4gICAgICovXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uIHJlZ2lzdGVyKGdlc3R1cmUpIHtcbiAgICAgICAgLy8gYWRkIGFuIGVuYWJsZSBnZXN0dXJlIG9wdGlvbnMgaWYgdGhlcmUgaXMgbm8gZ2l2ZW5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSBnZXN0dXJlLmRlZmF1bHRzIHx8IHt9O1xuICAgICAgICBpZihvcHRpb25zW2dlc3R1cmUubmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb3B0aW9uc1tnZXN0dXJlLm5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGV4dGVuZCBIYW1tZXIgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIEhhbW1lci5nZXN0dXJlIG9wdGlvbnNcbiAgICAgICAgVXRpbHMuZXh0ZW5kKEhhbW1lci5kZWZhdWx0cywgb3B0aW9ucywgdHJ1ZSk7XG5cbiAgICAgICAgLy8gc2V0IGl0cyBpbmRleFxuICAgICAgICBnZXN0dXJlLmluZGV4ID0gZ2VzdHVyZS5pbmRleCB8fCAxMDAwO1xuXG4gICAgICAgIC8vIGFkZCBIYW1tZXIuZ2VzdHVyZSB0byB0aGUgbGlzdFxuICAgICAgICB0aGlzLmdlc3R1cmVzLnB1c2goZ2VzdHVyZSk7XG5cbiAgICAgICAgLy8gc29ydCB0aGUgbGlzdCBieSBpbmRleFxuICAgICAgICB0aGlzLmdlc3R1cmVzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgaWYoYS5pbmRleCA8IGIuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihhLmluZGV4ID4gYi5pbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdlc3R1cmVzO1xuICAgIH1cbn07XG5cblxuLyoqXG4gKiBAbW9kdWxlIGhhbW1lclxuICovXG5cbi8qKlxuICogY3JlYXRlIG5ldyBoYW1tZXIgaW5zdGFuY2VcbiAqIGFsbCBtZXRob2RzIHNob3VsZCByZXR1cm4gdGhlIGluc3RhbmNlIGl0c2VsZiwgc28gaXQgaXMgY2hhaW5hYmxlLlxuICpcbiAqIEBjbGFzcyBJbnN0YW5jZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIG9wdGlvbnMgYXJlIG1lcmdlZCB3aXRoIGBIYW1tZXIuZGVmYXVsdHNgXG4gKiBAcmV0dXJuIHtIYW1tZXIuSW5zdGFuY2V9XG4gKi9cbkhhbW1lci5JbnN0YW5jZSA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBzZXR1cCBIYW1tZXJKUyB3aW5kb3cgZXZlbnRzIGFuZCByZWdpc3RlciBhbGwgZ2VzdHVyZXNcbiAgICAvLyB0aGlzIGFsc28gc2V0cyB1cCB0aGUgZGVmYXVsdCBvcHRpb25zXG4gICAgc2V0dXAoKTtcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBlbGVtZW50XG4gICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgZW5hYmxlZFxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgLyoqXG4gICAgICogb3B0aW9ucywgbWVyZ2VkIHdpdGggdGhlIGRlZmF1bHRzXG4gICAgICogb3B0aW9ucyB3aXRoIGFuIF8gYXJlIGNvbnZlcnRlZCB0byBjYW1lbENhc2VcbiAgICAgKiBAcHJvcGVydHkgb3B0aW9uc1xuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgVXRpbHMuZWFjaChvcHRpb25zLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICBkZWxldGUgb3B0aW9uc1tuYW1lXTtcbiAgICAgICAgb3B0aW9uc1tVdGlscy50b0NhbWVsQ2FzZShuYW1lKV0gPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMub3B0aW9ucyA9IFV0aWxzLmV4dGVuZChVdGlscy5leHRlbmQoe30sIEhhbW1lci5kZWZhdWx0cyksIG9wdGlvbnMgfHwge30pO1xuXG4gICAgLy8gYWRkIHNvbWUgY3NzIHRvIHRoZSBlbGVtZW50IHRvIHByZXZlbnQgdGhlIGJyb3dzZXIgZnJvbSBkb2luZyBpdHMgbmF0aXZlIGJlaGF2b2lyXG4gICAgaWYodGhpcy5vcHRpb25zLmJlaGF2aW9yKSB7XG4gICAgICAgIFV0aWxzLnRvZ2dsZUJlaGF2aW9yKHRoaXMuZWxlbWVudCwgdGhpcy5vcHRpb25zLmJlaGF2aW9yLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBldmVudCBzdGFydCBoYW5kbGVyIG9uIHRoZSBlbGVtZW50IHRvIHN0YXJ0IHRoZSBkZXRlY3Rpb25cbiAgICAgKiBAcHJvcGVydHkgZXZlbnRTdGFydEhhbmRsZXJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHRoaXMuZXZlbnRTdGFydEhhbmRsZXIgPSBFdmVudC5vblRvdWNoKGVsZW1lbnQsIEVWRU5UX1NUQVJULCBmdW5jdGlvbihldikge1xuICAgICAgICBpZihzZWxmLmVuYWJsZWQgJiYgZXYuZXZlbnRUeXBlID09IEVWRU5UX1NUQVJUKSB7XG4gICAgICAgICAgICBEZXRlY3Rpb24uc3RhcnREZXRlY3Qoc2VsZiwgZXYpO1xuICAgICAgICB9IGVsc2UgaWYoZXYuZXZlbnRUeXBlID09IEVWRU5UX1RPVUNIKSB7XG4gICAgICAgICAgICBEZXRlY3Rpb24uZGV0ZWN0KGV2KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICoga2VlcCBhIGxpc3Qgb2YgdXNlciBldmVudCBoYW5kbGVycyB3aGljaCBuZWVkcyB0byBiZSByZW1vdmVkIHdoZW4gY2FsbGluZyAnZGlzcG9zZSdcbiAgICAgKiBAcHJvcGVydHkgZXZlbnRIYW5kbGVyc1xuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSBbXTtcbn07XG5cbkhhbW1lci5JbnN0YW5jZS5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogYmluZCBldmVudHMgdG8gdGhlIGluc3RhbmNlXG4gICAgICogQG1ldGhvZCBvblxuICAgICAqIEBjaGFpbmFibGVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZ2VzdHVyZXMgbXVsdGlwbGUgZ2VzdHVyZXMgYnkgc3BsaXR0aW5nIHdpdGggYSBzcGFjZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaGFuZGxlci5ldiBldmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gb25FdmVudChnZXN0dXJlcywgaGFuZGxlcikge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIEV2ZW50Lm9uKHNlbGYuZWxlbWVudCwgZ2VzdHVyZXMsIGhhbmRsZXIsIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICAgIHNlbGYuZXZlbnRIYW5kbGVycy5wdXNoKHsgZ2VzdHVyZTogdHlwZSwgaGFuZGxlcjogaGFuZGxlciB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1bmJpbmQgZXZlbnRzIHRvIHRoZSBpbnN0YW5jZVxuICAgICAqIEBtZXRob2Qgb2ZmXG4gICAgICogQGNoYWluYWJsZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBnZXN0dXJlc1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uIG9mZkV2ZW50KGdlc3R1cmVzLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBFdmVudC5vZmYoc2VsZi5lbGVtZW50LCBnZXN0dXJlcywgaGFuZGxlciwgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gVXRpbHMuaW5BcnJheSh7IGdlc3R1cmU6IHR5cGUsIGhhbmRsZXI6IGhhbmRsZXIgfSk7XG4gICAgICAgICAgICBpZihpbmRleCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV2ZW50SGFuZGxlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB0cmlnZ2VyIGdlc3R1cmUgZXZlbnRcbiAgICAgKiBAbWV0aG9kIHRyaWdnZXJcbiAgICAgKiBAY2hhaW5hYmxlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGdlc3R1cmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2V2ZW50RGF0YV1cbiAgICAgKi9cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbiB0cmlnZ2VyRXZlbnQoZ2VzdHVyZSwgZXZlbnREYXRhKSB7XG4gICAgICAgIC8vIG9wdGlvbmFsXG4gICAgICAgIGlmKCFldmVudERhdGEpIHtcbiAgICAgICAgICAgIGV2ZW50RGF0YSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY3JlYXRlIERPTSBldmVudFxuICAgICAgICB2YXIgZXZlbnQgPSBIYW1tZXIuRE9DVU1FTlQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgICAgIGV2ZW50LmluaXRFdmVudChnZXN0dXJlLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgZXZlbnQuZ2VzdHVyZSA9IGV2ZW50RGF0YTtcblxuICAgICAgICAvLyB0cmlnZ2VyIG9uIHRoZSB0YXJnZXQgaWYgaXQgaXMgaW4gdGhlIGluc3RhbmNlIGVsZW1lbnQsXG4gICAgICAgIC8vIHRoaXMgaXMgZm9yIGV2ZW50IGRlbGVnYXRpb24gdHJpY2tzXG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuICAgICAgICBpZihVdGlscy5oYXNQYXJlbnQoZXZlbnREYXRhLnRhcmdldCwgZWxlbWVudCkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBldmVudERhdGEudGFyZ2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGVuYWJsZSBvZiBkaXNhYmxlIGhhbW1lci5qcyBkZXRlY3Rpb25cbiAgICAgKiBAbWV0aG9kIGVuYWJsZVxuICAgICAqIEBjaGFpbmFibGVcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IHN0YXRlXG4gICAgICovXG4gICAgZW5hYmxlOiBmdW5jdGlvbiBlbmFibGUoc3RhdGUpIHtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gc3RhdGU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkaXNwb3NlIHRoaXMgaGFtbWVyIGluc3RhbmNlXG4gICAgICogQG1ldGhvZCBkaXNwb3NlXG4gICAgICogQHJldHVybiB7TnVsbH1cbiAgICAgKi9cbiAgICBkaXNwb3NlOiBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICB2YXIgaSwgZWg7XG5cbiAgICAgICAgLy8gdW5kbyBhbGwgY2hhbmdlcyBtYWRlIGJ5IHN0b3BfYnJvd3Nlcl9iZWhhdmlvclxuICAgICAgICBVdGlscy50b2dnbGVCZWhhdmlvcih0aGlzLmVsZW1lbnQsIHRoaXMub3B0aW9ucy5iZWhhdmlvciwgZmFsc2UpO1xuXG4gICAgICAgIC8vIHVuYmluZCBhbGwgY3VzdG9tIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIGZvcihpID0gLTE7IChlaCA9IHRoaXMuZXZlbnRIYW5kbGVyc1srK2ldKTspIHtcbiAgICAgICAgICAgIFV0aWxzLm9mZih0aGlzLmVsZW1lbnQsIGVoLmdlc3R1cmUsIGVoLmhhbmRsZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzID0gW107XG5cbiAgICAgICAgLy8gdW5iaW5kIHRoZSBzdGFydCBldmVudCBsaXN0ZW5lclxuICAgICAgICBFdmVudC5vZmYodGhpcy5lbGVtZW50LCBFVkVOVF9UWVBFU1tFVkVOVF9TVEFSVF0sIHRoaXMuZXZlbnRTdGFydEhhbmRsZXIpO1xuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cblxuLyoqXG4gKiBAbW9kdWxlIGdlc3R1cmVzXG4gKi9cbi8qKlxuICogTW92ZSB3aXRoIHggZmluZ2VycyAoZGVmYXVsdCAxKSBhcm91bmQgb24gdGhlIHBhZ2UuXG4gKiBQcmV2ZW50aW5nIHRoZSBkZWZhdWx0IGJyb3dzZXIgYmVoYXZpb3IgaXMgYSBnb29kIHdheSB0byBpbXByb3ZlIGZlZWwgYW5kIHdvcmtpbmcuXG4gKiBgYGBgXG4gKiAgaGFtbWVydGltZS5vbihcImRyYWdcIiwgZnVuY3Rpb24oZXYpIHtcbiAqICAgIGNvbnNvbGUubG9nKGV2KTtcbiAqICAgIGV2Lmdlc3R1cmUucHJldmVudERlZmF1bHQoKTtcbiAqICB9KTtcbiAqIGBgYGBcbiAqXG4gKiBAY2xhc3MgRHJhZ1xuICogQHN0YXRpY1xuICovXG4vKipcbiAqIEBldmVudCBkcmFnXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ3N0YXJ0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ2VuZFxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbi8qKlxuICogQGV2ZW50IGRyYXBsZWZ0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ3JpZ2h0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ3VwXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ2Rvd25cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG5cbi8qKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqL1xuKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdHJpZ2dlcmVkID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiBkcmFnR2VzdHVyZShldiwgaW5zdCkge1xuICAgICAgICB2YXIgY3VyID0gRGV0ZWN0aW9uLmN1cnJlbnQ7XG5cbiAgICAgICAgLy8gbWF4IHRvdWNoZXNcbiAgICAgICAgaWYoaW5zdC5vcHRpb25zLmRyYWdNYXhUb3VjaGVzID4gMCAmJlxuICAgICAgICAgICAgZXYudG91Y2hlcy5sZW5ndGggPiBpbnN0Lm9wdGlvbnMuZHJhZ01heFRvdWNoZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaChldi5ldmVudFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgRVZFTlRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgdHJpZ2dlcmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgRVZFTlRfTU9WRTpcbiAgICAgICAgICAgICAgICAvLyB3aGVuIHRoZSBkaXN0YW5jZSB3ZSBtb3ZlZCBpcyB0b28gc21hbGwgd2Ugc2tpcCB0aGlzIGdlc3R1cmVcbiAgICAgICAgICAgICAgICAvLyBvciB3ZSBjYW4gYmUgYWxyZWFkeSBpbiBkcmFnZ2luZ1xuICAgICAgICAgICAgICAgIGlmKGV2LmRpc3RhbmNlIDwgaW5zdC5vcHRpb25zLmRyYWdNaW5EaXN0YW5jZSAmJlxuICAgICAgICAgICAgICAgICAgICBjdXIubmFtZSAhPSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRDZW50ZXIgPSBjdXIuc3RhcnRFdmVudC5jZW50ZXI7XG5cbiAgICAgICAgICAgICAgICAvLyB3ZSBhcmUgZHJhZ2dpbmchXG4gICAgICAgICAgICAgICAgaWYoY3VyLm5hbWUgIT0gbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjdXIubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGlmKGluc3Qub3B0aW9ucy5kcmFnRGlzdGFuY2VDb3JyZWN0aW9uICYmIGV2LmRpc3RhbmNlID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiBhIGRyYWcgaXMgdHJpZ2dlcmVkLCBzZXQgdGhlIGV2ZW50IGNlbnRlciB0byBkcmFnTWluRGlzdGFuY2UgcGl4ZWxzIGZyb20gdGhlIG9yaWdpbmFsIGV2ZW50IGNlbnRlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdpdGhvdXQgdGhpcyBjb3JyZWN0aW9uLCB0aGUgZHJhZ2dlZCBkaXN0YW5jZSB3b3VsZCBqdW1wc3RhcnQgYXQgZHJhZ01pbkRpc3RhbmNlIHBpeGVscyBpbnN0ZWFkIG9mIGF0IDAuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJdCBtaWdodCBiZSB1c2VmdWwgdG8gc2F2ZSB0aGUgb3JpZ2luYWwgc3RhcnQgcG9pbnQgc29tZXdoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmFjdG9yID0gTWF0aC5hYnMoaW5zdC5vcHRpb25zLmRyYWdNaW5EaXN0YW5jZSAvIGV2LmRpc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q2VudGVyLnBhZ2VYICs9IGV2LmRlbHRhWCAqIGZhY3RvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q2VudGVyLnBhZ2VZICs9IGV2LmRlbHRhWSAqIGZhY3RvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q2VudGVyLmNsaWVudFggKz0gZXYuZGVsdGFYICogZmFjdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRDZW50ZXIuY2xpZW50WSArPSBldi5kZWx0YVkgKiBmYWN0b3I7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlY2FsY3VsYXRlIGV2ZW50IGRhdGEgdXNpbmcgbmV3IHN0YXJ0IHBvaW50XG4gICAgICAgICAgICAgICAgICAgICAgICBldiA9IERldGVjdGlvbi5leHRlbmRFdmVudERhdGEoZXYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gbG9jayBkcmFnIHRvIGF4aXM/XG4gICAgICAgICAgICAgICAgaWYoY3VyLmxhc3RFdmVudC5kcmFnTG9ja1RvQXhpcyB8fFxuICAgICAgICAgICAgICAgICAgICAoIGluc3Qub3B0aW9ucy5kcmFnTG9ja1RvQXhpcyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdC5vcHRpb25zLmRyYWdMb2NrTWluRGlzdGFuY2UgPD0gZXYuZGlzdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXYuZHJhZ0xvY2tUb0F4aXMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGtlZXAgZGlyZWN0aW9uIG9uIHRoZSBheGlzIHRoYXQgdGhlIGRyYWcgZ2VzdHVyZSBzdGFydGVkIG9uXG4gICAgICAgICAgICAgICAgdmFyIGxhc3REaXJlY3Rpb24gPSBjdXIubGFzdEV2ZW50LmRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICBpZihldi5kcmFnTG9ja1RvQXhpcyAmJiBsYXN0RGlyZWN0aW9uICE9PSBldi5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoVXRpbHMuaXNWZXJ0aWNhbChsYXN0RGlyZWN0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXYuZGlyZWN0aW9uID0gKGV2LmRlbHRhWSA8IDApID8gRElSRUNUSU9OX1VQIDogRElSRUNUSU9OX0RPV047XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldi5kaXJlY3Rpb24gPSAoZXYuZGVsdGFYIDwgMCkgPyBESVJFQ1RJT05fTEVGVCA6IERJUkVDVElPTl9SSUdIVDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGZpcnN0IHRpbWUsIHRyaWdnZXIgZHJhZ3N0YXJ0IGV2ZW50XG4gICAgICAgICAgICAgICAgaWYoIXRyaWdnZXJlZCkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIobmFtZSArICdzdGFydCcsIGV2KTtcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB0cmlnZ2VyIGV2ZW50c1xuICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcihuYW1lLCBldik7XG4gICAgICAgICAgICAgICAgaW5zdC50cmlnZ2VyKG5hbWUgKyBldi5kaXJlY3Rpb24sIGV2KTtcblxuICAgICAgICAgICAgICAgIHZhciBpc1ZlcnRpY2FsID0gVXRpbHMuaXNWZXJ0aWNhbChldi5kaXJlY3Rpb24pO1xuXG4gICAgICAgICAgICAgICAgLy8gYmxvY2sgdGhlIGJyb3dzZXIgZXZlbnRzXG4gICAgICAgICAgICAgICAgaWYoKGluc3Qub3B0aW9ucy5kcmFnQmxvY2tWZXJ0aWNhbCAmJiBpc1ZlcnRpY2FsKSB8fFxuICAgICAgICAgICAgICAgICAgICAoaW5zdC5vcHRpb25zLmRyYWdCbG9ja0hvcml6b250YWwgJiYgIWlzVmVydGljYWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIEVWRU5UX1JFTEVBU0U6XG4gICAgICAgICAgICAgICAgaWYodHJpZ2dlcmVkICYmIGV2LmNoYW5nZWRMZW5ndGggPD0gaW5zdC5vcHRpb25zLmRyYWdNYXhUb3VjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcihuYW1lICsgJ2VuZCcsIGV2KTtcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIEVWRU5UX0VORDpcbiAgICAgICAgICAgICAgICB0cmlnZ2VyZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEhhbW1lci5nZXN0dXJlcy5EcmFnID0ge1xuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBpbmRleDogNTAsXG4gICAgICAgIGhhbmRsZXI6IGRyYWdHZXN0dXJlLFxuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBtaW5pbWFsIG1vdmVtZW50IHRoYXQgaGF2ZSB0byBiZSBtYWRlIGJlZm9yZSB0aGUgZHJhZyBldmVudCBnZXRzIHRyaWdnZXJlZFxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdNaW5EaXN0YW5jZVxuICAgICAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IDEwXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRyYWdNaW5EaXN0YW5jZTogMTAsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0IGRyYWdEaXN0YW5jZUNvcnJlY3Rpb24gdG8gdHJ1ZSB0byBtYWtlIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgZHJhZ1xuICAgICAgICAgICAgICogYmUgY2FsY3VsYXRlZCBmcm9tIHdoZXJlIHRoZSBkcmFnIHdhcyB0cmlnZ2VyZWQsIG5vdCBmcm9tIHdoZXJlIHRoZSB0b3VjaCBzdGFydGVkLlxuICAgICAgICAgICAgICogVXNlZnVsIHRvIGF2b2lkIGEgamVyay1zdGFydGluZyBkcmFnLCB3aGljaCBjYW4gbWFrZSBmaW5lLWFkanVzdG1lbnRzXG4gICAgICAgICAgICAgKiB0aHJvdWdoIGRyYWdnaW5nIGRpZmZpY3VsdCwgYW5kIGJlIHZpc3VhbGx5IHVuYXBwZWFsaW5nLlxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdEaXN0YW5jZUNvcnJlY3Rpb25cbiAgICAgICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgICAgICogQGRlZmF1bHQgdHJ1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkcmFnRGlzdGFuY2VDb3JyZWN0aW9uOiB0cnVlLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHNldCAwIGZvciB1bmxpbWl0ZWQsIGJ1dCB0aGlzIGNhbiBjb25mbGljdCB3aXRoIHRyYW5zZm9ybVxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdNYXhUb3VjaGVzXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkcmFnTWF4VG91Y2hlczogMSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBwcmV2ZW50IGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvciB3aGVuIGRyYWdnaW5nIG9jY3Vyc1xuICAgICAgICAgICAgICogYmUgY2FyZWZ1bCB3aXRoIGl0LCBpdCBtYWtlcyB0aGUgZWxlbWVudCBhIGJsb2NraW5nIGVsZW1lbnRcbiAgICAgICAgICAgICAqIHdoZW4geW91IGFyZSB1c2luZyB0aGUgZHJhZyBnZXN0dXJlLCBpdCBpcyBhIGdvb2QgcHJhY3RpY2UgdG8gc2V0IHRoaXMgdHJ1ZVxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdCbG9ja0hvcml6b250YWxcbiAgICAgICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZHJhZ0Jsb2NrSG9yaXpvbnRhbDogZmFsc2UsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogc2FtZSBhcyBgZHJhZ0Jsb2NrSG9yaXpvbnRhbGAsIGJ1dCBmb3IgdmVydGljYWwgbW92ZW1lbnRcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBkcmFnQmxvY2tWZXJ0aWNhbFxuICAgICAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkcmFnQmxvY2tWZXJ0aWNhbDogZmFsc2UsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogZHJhZ0xvY2tUb0F4aXMga2VlcHMgdGhlIGRyYWcgZ2VzdHVyZSBvbiB0aGUgYXhpcyB0aGF0IGl0IHN0YXJ0ZWQgb24sXG4gICAgICAgICAgICAgKiBJdCBkaXNhbGxvd3MgdmVydGljYWwgZGlyZWN0aW9ucyBpZiB0aGUgaW5pdGlhbCBkaXJlY3Rpb24gd2FzIGhvcml6b250YWwsIGFuZCB2aWNlIHZlcnNhLlxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdMb2NrVG9BeGlzXG4gICAgICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRyYWdMb2NrVG9BeGlzOiBmYWxzZSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBkcmFnIGxvY2sgb25seSBraWNrcyBpbiB3aGVuIGRpc3RhbmNlID4gZHJhZ0xvY2tNaW5EaXN0YW5jZVxuICAgICAgICAgICAgICogVGhpcyB3YXksIGxvY2tpbmcgb2NjdXJzIG9ubHkgd2hlbiB0aGUgZGlzdGFuY2UgaGFzIGJlY29tZSBsYXJnZSBlbm91Z2ggdG8gcmVsaWFibHkgZGV0ZXJtaW5lIHRoZSBkaXJlY3Rpb25cbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBkcmFnTG9ja01pbkRpc3RhbmNlXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMjVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZHJhZ0xvY2tNaW5EaXN0YW5jZTogMjVcbiAgICAgICAgfVxuICAgIH07XG59KSgnZHJhZycpO1xuXG4vKipcbiAqIEBtb2R1bGUgZ2VzdHVyZXNcbiAqL1xuLyoqXG4gKiB0cmlnZ2VyIGEgc2ltcGxlIGdlc3R1cmUgZXZlbnQsIHNvIHlvdSBjYW4gZG8gYW55dGhpbmcgaW4geW91ciBoYW5kbGVyLlxuICogb25seSB1c2FibGUgaWYgeW91IGtub3cgd2hhdCB5b3VyIGRvaW5nLi4uXG4gKlxuICogQGNsYXNzIEdlc3R1cmVcbiAqIEBzdGF0aWNcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZ2VzdHVyZVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbkhhbW1lci5nZXN0dXJlcy5HZXN0dXJlID0ge1xuICAgIG5hbWU6ICdnZXN0dXJlJyxcbiAgICBpbmRleDogMTMzNyxcbiAgICBoYW5kbGVyOiBmdW5jdGlvbiByZWxlYXNlR2VzdHVyZShldiwgaW5zdCkge1xuICAgICAgICBpbnN0LnRyaWdnZXIodGhpcy5uYW1lLCBldik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBAbW9kdWxlIGdlc3R1cmVzXG4gKi9cbi8qKlxuICogVG91Y2ggc3RheXMgYXQgdGhlIHNhbWUgcGxhY2UgZm9yIHggdGltZVxuICpcbiAqIEBjbGFzcyBIb2xkXG4gKiBAc3RhdGljXG4gKi9cbi8qKlxuICogQGV2ZW50IGhvbGRcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG5cbi8qKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqL1xuKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdGltZXI7XG5cbiAgICBmdW5jdGlvbiBob2xkR2VzdHVyZShldiwgaW5zdCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGluc3Qub3B0aW9ucyxcbiAgICAgICAgICAgIGN1cnJlbnQgPSBEZXRlY3Rpb24uY3VycmVudDtcblxuICAgICAgICBzd2l0Y2goZXYuZXZlbnRUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIEVWRU5UX1NUQVJUOlxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG5cbiAgICAgICAgICAgICAgICAvLyBzZXQgdGhlIGdlc3R1cmUgc28gd2UgY2FuIGNoZWNrIGluIHRoZSB0aW1lb3V0IGlmIGl0IHN0aWxsIGlzXG4gICAgICAgICAgICAgICAgY3VycmVudC5uYW1lID0gbmFtZTtcblxuICAgICAgICAgICAgICAgIC8vIHNldCB0aW1lciBhbmQgaWYgYWZ0ZXIgdGhlIHRpbWVvdXQgaXQgc3RpbGwgaXMgaG9sZCxcbiAgICAgICAgICAgICAgICAvLyB3ZSB0cmlnZ2VyIHRoZSBob2xkIGV2ZW50XG4gICAgICAgICAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZihjdXJyZW50ICYmIGN1cnJlbnQubmFtZSA9PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIobmFtZSwgZXYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucy5ob2xkVGltZW91dCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgRVZFTlRfTU9WRTpcbiAgICAgICAgICAgICAgICBpZihldi5kaXN0YW5jZSA+IG9wdGlvbnMuaG9sZFRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBFVkVOVF9SRUxFQVNFOlxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBIYW1tZXIuZ2VzdHVyZXMuSG9sZCA9IHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgaW5kZXg6IDEwLFxuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgaG9sZFRpbWVvdXRcbiAgICAgICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCA1MDBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaG9sZFRpbWVvdXQ6IDUwMCxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBtb3ZlbWVudCBhbGxvd2VkIHdoaWxlIGhvbGRpbmdcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBob2xkVGhyZXNob2xkXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBob2xkVGhyZXNob2xkOiAyXG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZXI6IGhvbGRHZXN0dXJlXG4gICAgfTtcbn0pKCdob2xkJyk7XG5cbi8qKlxuICogQG1vZHVsZSBnZXN0dXJlc1xuICovXG4vKipcbiAqIHdoZW4gYSB0b3VjaCBpcyBiZWluZyByZWxlYXNlZCBmcm9tIHRoZSBwYWdlXG4gKlxuICogQGNsYXNzIFJlbGVhc2VcbiAqIEBzdGF0aWNcbiAqL1xuLyoqXG4gKiBAZXZlbnQgcmVsZWFzZVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbkhhbW1lci5nZXN0dXJlcy5SZWxlYXNlID0ge1xuICAgIG5hbWU6ICdyZWxlYXNlJyxcbiAgICBpbmRleDogSW5maW5pdHksXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gcmVsZWFzZUdlc3R1cmUoZXYsIGluc3QpIHtcbiAgICAgICAgaWYoZXYuZXZlbnRUeXBlID09IEVWRU5UX1JFTEVBU0UpIHtcbiAgICAgICAgICAgIGluc3QudHJpZ2dlcih0aGlzLm5hbWUsIGV2KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogQG1vZHVsZSBnZXN0dXJlc1xuICovXG4vKipcbiAqIHRyaWdnZXJzIHN3aXBlIGV2ZW50cyB3aGVuIHRoZSBlbmQgdmVsb2NpdHkgaXMgYWJvdmUgdGhlIHRocmVzaG9sZFxuICogZm9yIGJlc3QgdXNhZ2UsIHNldCBgcHJldmVudERlZmF1bHRgIChvbiB0aGUgZHJhZyBnZXN0dXJlKSB0byBgdHJ1ZWBcbiAqIGBgYGBcbiAqICBoYW1tZXJ0aW1lLm9uKFwiZHJhZ2xlZnQgc3dpcGVsZWZ0XCIsIGZ1bmN0aW9uKGV2KSB7XG4gKiAgICBjb25zb2xlLmxvZyhldik7XG4gKiAgICBldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0KCk7XG4gKiAgfSk7XG4gKiBgYGBgXG4gKlxuICogQGNsYXNzIFN3aXBlXG4gKiBAc3RhdGljXG4gKi9cbi8qKlxuICogQGV2ZW50IHN3aXBlXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgc3dpcGVsZWZ0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgc3dpcGVyaWdodFxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbi8qKlxuICogQGV2ZW50IHN3aXBldXBcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG4vKipcbiAqIEBldmVudCBzd2lwZWRvd25cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG5IYW1tZXIuZ2VzdHVyZXMuU3dpcGUgPSB7XG4gICAgbmFtZTogJ3N3aXBlJyxcbiAgICBpbmRleDogNDAsXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSBzd2lwZU1pblRvdWNoZXNcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgKi9cbiAgICAgICAgc3dpcGVNaW5Ub3VjaGVzOiAxLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkgc3dpcGVNYXhUb3VjaGVzXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqIEBkZWZhdWx0IDFcbiAgICAgICAgICovXG4gICAgICAgIHN3aXBlTWF4VG91Y2hlczogMSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogaG9yaXpvbnRhbCBzd2lwZSB2ZWxvY2l0eVxuICAgICAgICAgKiBAcHJvcGVydHkgc3dpcGVWZWxvY2l0eVhcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMC42XG4gICAgICAgICAqL1xuICAgICAgICBzd2lwZVZlbG9jaXR5WDogMC42LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB2ZXJ0aWNhbCBzd2lwZSB2ZWxvY2l0eVxuICAgICAgICAgKiBAcHJvcGVydHkgc3dpcGVWZWxvY2l0eVlcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMC42XG4gICAgICAgICAqL1xuICAgICAgICBzd2lwZVZlbG9jaXR5WTogMC42XG4gICAgfSxcblxuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIHN3aXBlR2VzdHVyZShldiwgaW5zdCkge1xuICAgICAgICBpZihldi5ldmVudFR5cGUgPT0gRVZFTlRfUkVMRUFTRSkge1xuICAgICAgICAgICAgdmFyIHRvdWNoZXMgPSBldi50b3VjaGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gaW5zdC5vcHRpb25zO1xuXG4gICAgICAgICAgICAvLyBtYXggdG91Y2hlc1xuICAgICAgICAgICAgaWYodG91Y2hlcyA8IG9wdGlvbnMuc3dpcGVNaW5Ub3VjaGVzIHx8XG4gICAgICAgICAgICAgICAgdG91Y2hlcyA+IG9wdGlvbnMuc3dpcGVNYXhUb3VjaGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBkaXN0YW5jZSB3ZSBtb3ZlZCBpcyB0b28gc21hbGwgd2Ugc2tpcCB0aGlzIGdlc3R1cmVcbiAgICAgICAgICAgIC8vIG9yIHdlIGNhbiBiZSBhbHJlYWR5IGluIGRyYWdnaW5nXG4gICAgICAgICAgICBpZihldi52ZWxvY2l0eVggPiBvcHRpb25zLnN3aXBlVmVsb2NpdHlYIHx8XG4gICAgICAgICAgICAgICAgZXYudmVsb2NpdHlZID4gb3B0aW9ucy5zd2lwZVZlbG9jaXR5WSkge1xuICAgICAgICAgICAgICAgIC8vIHRyaWdnZXIgc3dpcGUgZXZlbnRzXG4gICAgICAgICAgICAgICAgaW5zdC50cmlnZ2VyKHRoaXMubmFtZSwgZXYpO1xuICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcih0aGlzLm5hbWUgKyBldi5kaXJlY3Rpb24sIGV2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogQG1vZHVsZSBnZXN0dXJlc1xuICovXG4vKipcbiAqIFNpbmdsZSB0YXAgYW5kIGEgZG91YmxlIHRhcCBvbiBhIHBsYWNlXG4gKlxuICogQGNsYXNzIFRhcFxuICogQHN0YXRpY1xuICovXG4vKipcbiAqIEBldmVudCB0YXBcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG4vKipcbiAqIEBldmVudCBkb3VibGV0YXBcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG5cbi8qKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqL1xuKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgaGFzTW92ZWQgPSBmYWxzZTtcblxuICAgIGZ1bmN0aW9uIHRhcEdlc3R1cmUoZXYsIGluc3QpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBpbnN0Lm9wdGlvbnMsXG4gICAgICAgICAgICBjdXJyZW50ID0gRGV0ZWN0aW9uLmN1cnJlbnQsXG4gICAgICAgICAgICBwcmV2ID0gRGV0ZWN0aW9uLnByZXZpb3VzLFxuICAgICAgICAgICAgc2luY2VQcmV2LFxuICAgICAgICAgICAgZGlkRG91YmxlVGFwO1xuXG4gICAgICAgIHN3aXRjaChldi5ldmVudFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgRVZFTlRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgaGFzTW92ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBFVkVOVF9NT1ZFOlxuICAgICAgICAgICAgICAgIGhhc01vdmVkID0gaGFzTW92ZWQgfHwgKGV2LmRpc3RhbmNlID4gb3B0aW9ucy50YXBNYXhEaXN0YW5jZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgRVZFTlRfRU5EOlxuICAgICAgICAgICAgICAgIGlmKGV2LnNyY0V2ZW50LnR5cGUgIT0gJ3RvdWNoY2FuY2VsJyAmJiBldi5kZWx0YVRpbWUgPCBvcHRpb25zLnRhcE1heFRpbWUgJiYgIWhhc01vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHByZXZpb3VzIGdlc3R1cmUsIGZvciB0aGUgZG91YmxlIHRhcCBzaW5jZSB0aGVzZSBhcmUgdHdvIGRpZmZlcmVudCBnZXN0dXJlIGRldGVjdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgc2luY2VQcmV2ID0gcHJldiAmJiBwcmV2Lmxhc3RFdmVudCAmJiBldi50aW1lU3RhbXAgLSBwcmV2Lmxhc3RFdmVudC50aW1lU3RhbXA7XG4gICAgICAgICAgICAgICAgICAgIGRpZERvdWJsZVRhcCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGRvdWJsZSB0YXBcbiAgICAgICAgICAgICAgICAgICAgaWYocHJldiAmJiBwcmV2Lm5hbWUgPT0gbmFtZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKHNpbmNlUHJldiAmJiBzaW5jZVByZXYgPCBvcHRpb25zLmRvdWJsZVRhcEludGVydmFsKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgZXYuZGlzdGFuY2UgPCBvcHRpb25zLmRvdWJsZVRhcERpc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIoJ2RvdWJsZXRhcCcsIGV2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZERvdWJsZVRhcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBkbyBhIHNpbmdsZSB0YXBcbiAgICAgICAgICAgICAgICAgICAgaWYoIWRpZERvdWJsZVRhcCB8fCBvcHRpb25zLnRhcEFsd2F5cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudC5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcihjdXJyZW50Lm5hbWUsIGV2KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIEhhbW1lci5nZXN0dXJlcy5UYXAgPSB7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGluZGV4OiAxMDAsXG4gICAgICAgIGhhbmRsZXI6IHRhcEdlc3R1cmUsXG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIG1heCB0aW1lIG9mIGEgdGFwLCB0aGlzIGlzIGZvciB0aGUgc2xvdyB0YXBwZXJzXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgdGFwTWF4VGltZVxuICAgICAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IDI1MFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0YXBNYXhUaW1lOiAyNTAsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogbWF4IGRpc3RhbmNlIG9mIG1vdmVtZW50IG9mIGEgdGFwLCB0aGlzIGlzIGZvciB0aGUgc2xvdyB0YXBwZXJzXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgdGFwTWF4RGlzdGFuY2VcbiAgICAgICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCAxMFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0YXBNYXhEaXN0YW5jZTogMTAsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogYWx3YXlzIHRyaWdnZXIgdGhlIGB0YXBgIGV2ZW50LCBldmVuIHdoaWxlIGRvdWJsZS10YXBwaW5nXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgdGFwQWx3YXlzXG4gICAgICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IHRydWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGFwQWx3YXlzOiB0cnVlLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIG1heCBkaXN0YW5jZSBiZXR3ZWVuIHR3byB0YXBzXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgZG91YmxlVGFwRGlzdGFuY2VcbiAgICAgICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCAyMFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkb3VibGVUYXBEaXN0YW5jZTogMjAsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogbWF4IHRpbWUgYmV0d2VlbiB0d28gdGFwc1xuICAgICAgICAgICAgICogQHByb3BlcnR5IGRvdWJsZVRhcEludGVydmFsXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMzAwXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRvdWJsZVRhcEludGVydmFsOiAzMDBcbiAgICAgICAgfVxuICAgIH07XG59KSgndGFwJyk7XG5cbi8qKlxuICogQG1vZHVsZSBnZXN0dXJlc1xuICovXG4vKipcbiAqIHdoZW4gYSB0b3VjaCBpcyBiZWluZyB0b3VjaGVkIGF0IHRoZSBwYWdlXG4gKlxuICogQGNsYXNzIFRvdWNoXG4gKiBAc3RhdGljXG4gKi9cbi8qKlxuICogQGV2ZW50IHRvdWNoXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuSGFtbWVyLmdlc3R1cmVzLlRvdWNoID0ge1xuICAgIG5hbWU6ICd0b3VjaCcsXG4gICAgaW5kZXg6IC1JbmZpbml0eSxcbiAgICBkZWZhdWx0czoge1xuICAgICAgICAvKipcbiAgICAgICAgICogY2FsbCBwcmV2ZW50RGVmYXVsdCBhdCB0b3VjaHN0YXJ0LCBhbmQgbWFrZXMgdGhlIGVsZW1lbnQgYmxvY2tpbmcgYnkgZGlzYWJsaW5nIHRoZSBzY3JvbGxpbmcgb2YgdGhlIHBhZ2UsXG4gICAgICAgICAqIGJ1dCBpdCBpbXByb3ZlcyBnZXN0dXJlcyBsaWtlIHRyYW5zZm9ybWluZyBhbmQgZHJhZ2dpbmcuXG4gICAgICAgICAqIGJlIGNhcmVmdWwgd2l0aCB1c2luZyB0aGlzLCBpdCBjYW4gYmUgdmVyeSBhbm5veWluZyBmb3IgdXNlcnMgdG8gYmUgc3R1Y2sgb24gdGhlIHBhZ2VcbiAgICAgICAgICogQHByb3BlcnR5IHByZXZlbnREZWZhdWx0XG4gICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAgKi9cbiAgICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBkaXNhYmxlIG1vdXNlIGV2ZW50cywgc28gb25seSB0b3VjaCAob3IgcGVuISkgaW5wdXQgdHJpZ2dlcnMgZXZlbnRzXG4gICAgICAgICAqIEBwcm9wZXJ0eSBwcmV2ZW50TW91c2VcbiAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICAqL1xuICAgICAgICBwcmV2ZW50TW91c2U6IGZhbHNlXG4gICAgfSxcbiAgICBoYW5kbGVyOiBmdW5jdGlvbiB0b3VjaEdlc3R1cmUoZXYsIGluc3QpIHtcbiAgICAgICAgaWYoaW5zdC5vcHRpb25zLnByZXZlbnRNb3VzZSAmJiBldi5wb2ludGVyVHlwZSA9PSBQT0lOVEVSX01PVVNFKSB7XG4gICAgICAgICAgICBldi5zdG9wRGV0ZWN0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZihpbnN0Lm9wdGlvbnMucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihldi5ldmVudFR5cGUgPT0gRVZFTlRfVE9VQ0gpIHtcbiAgICAgICAgICAgIGluc3QudHJpZ2dlcigndG91Y2gnLCBldik7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIEBtb2R1bGUgZ2VzdHVyZXNcbiAqL1xuLyoqXG4gKiBVc2VyIHdhbnQgdG8gc2NhbGUgb3Igcm90YXRlIHdpdGggMiBmaW5nZXJzXG4gKiBQcmV2ZW50aW5nIHRoZSBkZWZhdWx0IGJyb3dzZXIgYmVoYXZpb3IgaXMgYSBnb29kIHdheSB0byBpbXByb3ZlIGZlZWwgYW5kIHdvcmtpbmcuIFRoaXMgY2FuIGJlIGRvbmUgd2l0aCB0aGVcbiAqIGBwcmV2ZW50RGVmYXVsdGAgb3B0aW9uLlxuICpcbiAqIEBjbGFzcyBUcmFuc2Zvcm1cbiAqIEBzdGF0aWNcbiAqL1xuLyoqXG4gKiBAZXZlbnQgdHJhbnNmb3JtXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgdHJhbnNmb3Jtc3RhcnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG4vKipcbiAqIEBldmVudCB0cmFuc2Zvcm1lbmRcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG4vKipcbiAqIEBldmVudCBwaW5jaGluXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgcGluY2hvdXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG4vKipcbiAqIEBldmVudCByb3RhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG5cbi8qKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqL1xuKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdHJpZ2dlcmVkID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm1HZXN0dXJlKGV2LCBpbnN0KSB7XG4gICAgICAgIHN3aXRjaChldi5ldmVudFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgRVZFTlRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgdHJpZ2dlcmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgRVZFTlRfTU9WRTpcbiAgICAgICAgICAgICAgICAvLyBhdCBsZWFzdCBtdWx0aXRvdWNoXG4gICAgICAgICAgICAgICAgaWYoZXYudG91Y2hlcy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgc2NhbGVUaHJlc2hvbGQgPSBNYXRoLmFicygxIC0gZXYuc2NhbGUpO1xuICAgICAgICAgICAgICAgIHZhciByb3RhdGlvblRocmVzaG9sZCA9IE1hdGguYWJzKGV2LnJvdGF0aW9uKTtcblxuICAgICAgICAgICAgICAgIC8vIHdoZW4gdGhlIGRpc3RhbmNlIHdlIG1vdmVkIGlzIHRvbyBzbWFsbCB3ZSBza2lwIHRoaXMgZ2VzdHVyZVxuICAgICAgICAgICAgICAgIC8vIG9yIHdlIGNhbiBiZSBhbHJlYWR5IGluIGRyYWdnaW5nXG4gICAgICAgICAgICAgICAgaWYoc2NhbGVUaHJlc2hvbGQgPCBpbnN0Lm9wdGlvbnMudHJhbnNmb3JtTWluU2NhbGUgJiZcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb25UaHJlc2hvbGQgPCBpbnN0Lm9wdGlvbnMudHJhbnNmb3JtTWluUm90YXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHdlIGFyZSB0cmFuc2Zvcm1pbmchXG4gICAgICAgICAgICAgICAgRGV0ZWN0aW9uLmN1cnJlbnQubmFtZSA9IG5hbWU7XG5cbiAgICAgICAgICAgICAgICAvLyBmaXJzdCB0aW1lLCB0cmlnZ2VyIGRyYWdzdGFydCBldmVudFxuICAgICAgICAgICAgICAgIGlmKCF0cmlnZ2VyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdC50cmlnZ2VyKG5hbWUgKyAnc3RhcnQnLCBldik7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaW5zdC50cmlnZ2VyKG5hbWUsIGV2KTsgLy8gYmFzaWMgdHJhbnNmb3JtIGV2ZW50XG5cbiAgICAgICAgICAgICAgICAvLyB0cmlnZ2VyIHJvdGF0ZSBldmVudFxuICAgICAgICAgICAgICAgIGlmKHJvdGF0aW9uVGhyZXNob2xkID4gaW5zdC5vcHRpb25zLnRyYW5zZm9ybU1pblJvdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcigncm90YXRlJywgZXYpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHRyaWdnZXIgcGluY2ggZXZlbnRcbiAgICAgICAgICAgICAgICBpZihzY2FsZVRocmVzaG9sZCA+IGluc3Qub3B0aW9ucy50cmFuc2Zvcm1NaW5TY2FsZSkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIoJ3BpbmNoJywgZXYpO1xuICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIoJ3BpbmNoJyArIChldi5zY2FsZSA8IDEgPyAnaW4nIDogJ291dCcpLCBldik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIEVWRU5UX1JFTEVBU0U6XG4gICAgICAgICAgICAgICAgaWYodHJpZ2dlcmVkICYmIGV2LmNoYW5nZWRMZW5ndGggPCAyKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcihuYW1lICsgJ2VuZCcsIGV2KTtcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgSGFtbWVyLmdlc3R1cmVzLlRyYW5zZm9ybSA9IHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgaW5kZXg6IDQ1LFxuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBtaW5pbWFsIHNjYWxlIGZhY3Rvciwgbm8gc2NhbGUgaXMgMSwgem9vbWluIGlzIHRvIDAgYW5kIHpvb21vdXQgdW50aWwgaGlnaGVyIHRoZW4gMVxuICAgICAgICAgICAgICogQHByb3BlcnR5IHRyYW5zZm9ybU1pblNjYWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMC4wMVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cmFuc2Zvcm1NaW5TY2FsZTogMC4wMSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiByb3RhdGlvbiBpbiBkZWdyZWVzXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgdHJhbnNmb3JtTWluUm90YXRpb25cbiAgICAgICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCAxXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRyYW5zZm9ybU1pblJvdGF0aW9uOiAxXG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlcjogdHJhbnNmb3JtR2VzdHVyZVxuICAgIH07XG59KSgndHJhbnNmb3JtJyk7XG5cbi8qKlxuICogQG1vZHVsZSBoYW1tZXJcbiAqL1xuXG4vLyBBTUQgZXhwb3J0XG5pZih0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEhhbW1lcjtcbiAgICB9KTtcbi8vIGNvbW1vbmpzIGV4cG9ydFxufSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBIYW1tZXI7XG4vLyBicm93c2VyIGV4cG9ydFxufSBlbHNlIHtcbiAgICB3aW5kb3cuSGFtbWVyID0gSGFtbWVyO1xufVxuXG59KSh3aW5kb3cpOyIsImZ1bmN0aW9uIFBvaW50ICggeCAsIHkgKSB7XG4gICByZXR1cm4ge1xuICAgICAgIHggOiB4LCBcbiAgICAgICB5IDogeVxuICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gUG9pbnQ7IiwiLypcclxuICBwcm9qNGpzLmpzIC0tIEphdmFzY3JpcHQgcmVwcm9qZWN0aW9uIGxpYnJhcnkuIFxyXG4gIFxyXG4gIEF1dGhvcnM6ICAgICAgTWlrZSBBZGFpciBtYWRhaXJBVGRtc29sdXRpb25zLmNhXHJcbiAgICAgICAgICAgICAgICBSaWNoYXJkIEdyZWVud29vZCByaWNoQVRncmVlbndvb2RtYXAuY29tXHJcbiAgICAgICAgICAgICAgICBEaWRpZXIgUmljaGFyZCBkaWRpZXIucmljaGFyZEFUaWduLmZyXHJcbiAgICAgICAgICAgICAgICBTdGVwaGVuIElyb25zIHN0ZXBoZW4uaXJvbnNBVGNsZWFyLm5ldC5uelxyXG4gICAgICAgICAgICAgICAgT2xpdmllciBUZXJyYWwgb3RlcnJhbEFUZ21haWwuY29tXHJcbiAgICAgICAgICAgICAgICBcclxuICBMaWNlbnNlOiAgICAgIFxyXG4gQ29weXJpZ2h0IChjKSAyMDEyLCBNaWtlIEFkYWlyLCBSaWNoYXJkIEdyZWVud29vZCwgRGlkaWVyIFJpY2hhcmQsIFxyXG4gICAgICAgICAgICAgICAgICAgICBTdGVwaGVuIElyb25zIGFuZCBPbGl2aWVyIFRlcnJhbFxyXG5cclxuIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXHJcbiBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksXHJcbiB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uXHJcbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSxcclxuIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZVxyXG4gU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuXHJcbiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxyXG4gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcblxyXG4gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xyXG4gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTFxyXG4gVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HXHJcbiBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSXHJcbiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXHJcbiBcclxuIE5vdGU6IFRoaXMgcHJvZ3JhbSBpcyBhbiBhbG1vc3QgZGlyZWN0IHBvcnQgb2YgdGhlIEMgbGlicmFyeSBQUk9KLjQuXHJcbiovXHJcbnZhciBQcm9qNGpzPXtkZWZhdWx0RGF0dW06XCJXR1M4NFwiLHRyYW5zZm9ybTpmdW5jdGlvbihhLGMsYil7aWYoIWEucmVhZHlUb1VzZSlyZXR1cm4gdGhpcy5yZXBvcnRFcnJvcihcIlByb2o0anMgaW5pdGlhbGl6YXRpb24gZm9yOlwiK2Euc3JzQ29kZStcIiBub3QgeWV0IGNvbXBsZXRlXCIpLGI7aWYoIWMucmVhZHlUb1VzZSlyZXR1cm4gdGhpcy5yZXBvcnRFcnJvcihcIlByb2o0anMgaW5pdGlhbGl6YXRpb24gZm9yOlwiK2Muc3JzQ29kZStcIiBub3QgeWV0IGNvbXBsZXRlXCIpLGI7aWYoYS5kYXR1bSYmYy5kYXR1bSYmKChhLmRhdHVtLmRhdHVtX3R5cGU9PVByb2o0anMuY29tbW9uLlBKRF8zUEFSQU18fGEuZGF0dW0uZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEXzdQQVJBTSkmJlwiV0dTODRcIiE9Yy5kYXR1bUNvZGV8fChjLmRhdHVtLmRhdHVtX3R5cGU9PVByb2o0anMuY29tbW9uLlBKRF8zUEFSQU18fGMuZGF0dW0uZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEXzdQQVJBTSkmJlxuXCJXR1M4NFwiIT1hLmRhdHVtQ29kZSkpe3ZhciBkPVByb2o0anMuV0dTODQ7dGhpcy50cmFuc2Zvcm0oYSxkLGIpO2E9ZH1cImVudVwiIT1hLmF4aXMmJnRoaXMuYWRqdXN0X2F4aXMoYSwhMSxiKTtcImxvbmdsYXRcIj09YS5wcm9qTmFtZT8oYi54Kj1Qcm9qNGpzLmNvbW1vbi5EMlIsYi55Kj1Qcm9qNGpzLmNvbW1vbi5EMlIpOihhLnRvX21ldGVyJiYoYi54Kj1hLnRvX21ldGVyLGIueSo9YS50b19tZXRlciksYS5pbnZlcnNlKGIpKTthLmZyb21fZ3JlZW53aWNoJiYoYi54Kz1hLmZyb21fZ3JlZW53aWNoKTtiPXRoaXMuZGF0dW1fdHJhbnNmb3JtKGEuZGF0dW0sYy5kYXR1bSxiKTtjLmZyb21fZ3JlZW53aWNoJiYoYi54LT1jLmZyb21fZ3JlZW53aWNoKTtcImxvbmdsYXRcIj09Yy5wcm9qTmFtZT8oYi54Kj1Qcm9qNGpzLmNvbW1vbi5SMkQsYi55Kj1Qcm9qNGpzLmNvbW1vbi5SMkQpOihjLmZvcndhcmQoYiksYy50b19tZXRlciYmKGIueC89Yy50b19tZXRlcixiLnkvPWMudG9fbWV0ZXIpKTtcblwiZW51XCIhPWMuYXhpcyYmdGhpcy5hZGp1c3RfYXhpcyhjLCEwLGIpO3JldHVybiBifSxkYXR1bV90cmFuc2Zvcm06ZnVuY3Rpb24oYSxjLGIpe2lmKGEuY29tcGFyZV9kYXR1bXMoYyl8fGEuZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEX05PREFUVU18fGMuZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEX05PREFUVU0pcmV0dXJuIGI7aWYoYS5lcyE9Yy5lc3x8YS5hIT1jLmF8fGEuZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEXzNQQVJBTXx8YS5kYXR1bV90eXBlPT1Qcm9qNGpzLmNvbW1vbi5QSkRfN1BBUkFNfHxjLmRhdHVtX3R5cGU9PVByb2o0anMuY29tbW9uLlBKRF8zUEFSQU18fGMuZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEXzdQQVJBTSlhLmdlb2RldGljX3RvX2dlb2NlbnRyaWMoYiksKGEuZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEXzNQQVJBTXx8YS5kYXR1bV90eXBlPT1Qcm9qNGpzLmNvbW1vbi5QSkRfN1BBUkFNKSYmYS5nZW9jZW50cmljX3RvX3dnczg0KGIpLFxuKGMuZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEXzNQQVJBTXx8Yy5kYXR1bV90eXBlPT1Qcm9qNGpzLmNvbW1vbi5QSkRfN1BBUkFNKSYmYy5nZW9jZW50cmljX2Zyb21fd2dzODQoYiksYy5nZW9jZW50cmljX3RvX2dlb2RldGljKGIpO3JldHVybiBifSxhZGp1c3RfYXhpczpmdW5jdGlvbihhLGMsYil7Zm9yKHZhciBkPWIueCxlPWIueSxmPWIuenx8MCxnLGksaD0wOzM+aDtoKyspaWYoIWN8fCEoMj09aCYmdm9pZCAwPT09Yi56KSlzd2l0Y2goMD09aD8oZz1kLGk9XCJ4XCIpOjE9PWg/KGc9ZSxpPVwieVwiKTooZz1mLGk9XCJ6XCIpLGEuYXhpc1toXSl7Y2FzZSBcImVcIjpiW2ldPWc7YnJlYWs7Y2FzZSBcIndcIjpiW2ldPS1nO2JyZWFrO2Nhc2UgXCJuXCI6YltpXT1nO2JyZWFrO2Nhc2UgXCJzXCI6YltpXT0tZzticmVhaztjYXNlIFwidVwiOnZvaWQgMCE9PWJbaV0mJihiLno9Zyk7YnJlYWs7Y2FzZSBcImRcIjp2b2lkIDAhPT1iW2ldJiYoYi56PS1nKTticmVhaztkZWZhdWx0OnJldHVybiBhbGVydChcIkVSUk9SOiB1bmtub3cgYXhpcyAoXCIrXG5hLmF4aXNbaF0rXCIpIC0gY2hlY2sgZGVmaW5pdGlvbiBvZiBcIithLnByb2pOYW1lKSxudWxsfXJldHVybiBifSxyZXBvcnRFcnJvcjpmdW5jdGlvbigpe30sZXh0ZW5kOmZ1bmN0aW9uKGEsYyl7YT1hfHx7fTtpZihjKWZvcih2YXIgYiBpbiBjKXt2YXIgZD1jW2JdO3ZvaWQgMCE9PWQmJihhW2JdPWQpfXJldHVybiBhfSxDbGFzczpmdW5jdGlvbigpe2Zvcih2YXIgYT1mdW5jdGlvbigpe3RoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9LGM9e30sYixkPTA7ZDxhcmd1bWVudHMubGVuZ3RoOysrZCliPVwiZnVuY3Rpb25cIj09dHlwZW9mIGFyZ3VtZW50c1tkXT9hcmd1bWVudHNbZF0ucHJvdG90eXBlOmFyZ3VtZW50c1tkXSxQcm9qNGpzLmV4dGVuZChjLGIpO2EucHJvdG90eXBlPWM7cmV0dXJuIGF9LGJpbmQ6ZnVuY3Rpb24oYSxjKXt2YXIgYj1BcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoYXJndW1lbnRzLFsyXSk7cmV0dXJuIGZ1bmN0aW9uKCl7dmFyIGQ9Yi5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cyxcblswXSkpO3JldHVybiBhLmFwcGx5KGMsZCl9fSxzY3JpcHROYW1lOlwicHJvajRqcy1jb21wcmVzc2VkLmpzXCIsZGVmc0xvb2t1cFNlcnZpY2U6XCJodHRwOi8vc3BhdGlhbHJlZmVyZW5jZS5vcmcvcmVmXCIsbGliUGF0aDpudWxsLGdldFNjcmlwdExvY2F0aW9uOmZ1bmN0aW9uKCl7aWYodGhpcy5saWJQYXRoKXJldHVybiB0aGlzLmxpYlBhdGg7Zm9yKHZhciBhPXRoaXMuc2NyaXB0TmFtZSxjPWEubGVuZ3RoLGI9ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIiksZD0wO2Q8Yi5sZW5ndGg7ZCsrKXt2YXIgZT1iW2RdLmdldEF0dHJpYnV0ZShcInNyY1wiKTtpZihlKXt2YXIgZj1lLmxhc3RJbmRleE9mKGEpO2lmKC0xPGYmJmYrYz09ZS5sZW5ndGgpe3RoaXMubGliUGF0aD1lLnNsaWNlKDAsLWMpO2JyZWFrfX19cmV0dXJuIHRoaXMubGliUGF0aHx8XCJcIn0sbG9hZFNjcmlwdDpmdW5jdGlvbihhLGMsYixkKXt2YXIgZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuZS5kZWZlcj0hMTtlLnR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIjtlLmlkPWE7ZS5zcmM9YTtlLm9ubG9hZD1jO2Uub25lcnJvcj1iO2UubG9hZENoZWNrPWQ7L01TSUUvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkmJihlLm9ucmVhZHlzdGF0ZWNoYW5nZT10aGlzLmNoZWNrUmVhZHlTdGF0ZSk7ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdLmFwcGVuZENoaWxkKGUpfSxjaGVja1JlYWR5U3RhdGU6ZnVuY3Rpb24oKXtpZihcImxvYWRlZFwiPT10aGlzLnJlYWR5U3RhdGUpaWYodGhpcy5sb2FkQ2hlY2soKSl0aGlzLm9ubG9hZCgpO2Vsc2UgdGhpcy5vbmVycm9yKCl9fTtcblByb2o0anMuUHJvaj1Qcm9qNGpzLkNsYXNzKHtyZWFkeVRvVXNlOiExLHRpdGxlOm51bGwscHJvak5hbWU6bnVsbCx1bml0czpudWxsLGRhdHVtOm51bGwseDA6MCx5MDowLGxvY2FsQ1M6ITEscXVldWU6bnVsbCxpbml0aWFsaXplOmZ1bmN0aW9uKGEsYyl7dGhpcy5zcnNDb2RlSW5wdXQ9YTt0aGlzLnF1ZXVlPVtdO2MmJnRoaXMucXVldWUucHVzaChjKTtpZigwPD1hLmluZGV4T2YoXCJHRU9HQ1NcIil8fDA8PWEuaW5kZXhPZihcIkdFT0NDU1wiKXx8MDw9YS5pbmRleE9mKFwiUFJPSkNTXCIpfHwwPD1hLmluZGV4T2YoXCJMT0NBTF9DU1wiKSl0aGlzLnBhcnNlV0tUKGEpLHRoaXMuZGVyaXZlQ29uc3RhbnRzKCksdGhpcy5sb2FkUHJvakNvZGUodGhpcy5wcm9qTmFtZSk7ZWxzZXtpZigwPT1hLmluZGV4T2YoXCJ1cm46XCIpKXt2YXIgYj1hLnNwbGl0KFwiOlwiKTtpZigoXCJvZ2NcIj09YlsxXXx8XCJ4LW9nY1wiPT1iWzFdKSYmXCJkZWZcIj09YlsyXSYmXCJjcnNcIj09YlszXSlhPWJbNF0rXCI6XCIrYltiLmxlbmd0aC1cbjFdfWVsc2UgMD09YS5pbmRleE9mKFwiaHR0cDovL1wiKSYmKGI9YS5zcGxpdChcIiNcIiksYlswXS5tYXRjaCgvZXBzZy5vcmcvKT9hPVwiRVBTRzpcIitiWzFdOmJbMF0ubWF0Y2goL1JJRy54bWwvKSYmKGE9XCJJR05GOlwiK2JbMV0pKTt0aGlzLnNyc0NvZGU9YS50b1VwcGVyQ2FzZSgpOzA9PXRoaXMuc3JzQ29kZS5pbmRleE9mKFwiRVBTR1wiKT8odGhpcy5zcnNDb2RlPXRoaXMuc3JzQ29kZSx0aGlzLnNyc0F1dGg9XCJlcHNnXCIsdGhpcy5zcnNQcm9qTnVtYmVyPXRoaXMuc3JzQ29kZS5zdWJzdHJpbmcoNSkpOjA9PXRoaXMuc3JzQ29kZS5pbmRleE9mKFwiSUdORlwiKT8odGhpcy5zcnNDb2RlPXRoaXMuc3JzQ29kZSx0aGlzLnNyc0F1dGg9XCJJR05GXCIsdGhpcy5zcnNQcm9qTnVtYmVyPXRoaXMuc3JzQ29kZS5zdWJzdHJpbmcoNSkpOjA9PXRoaXMuc3JzQ29kZS5pbmRleE9mKFwiQ1JTXCIpPyh0aGlzLnNyc0NvZGU9dGhpcy5zcnNDb2RlLHRoaXMuc3JzQXV0aD1cIkNSU1wiLHRoaXMuc3JzUHJvak51bWJlcj1cbnRoaXMuc3JzQ29kZS5zdWJzdHJpbmcoNCkpOih0aGlzLnNyc0F1dGg9XCJcIix0aGlzLnNyc1Byb2pOdW1iZXI9dGhpcy5zcnNDb2RlKTt0aGlzLmxvYWRQcm9qRGVmaW5pdGlvbigpfX0sbG9hZFByb2pEZWZpbml0aW9uOmZ1bmN0aW9uKCl7aWYoUHJvajRqcy5kZWZzW3RoaXMuc3JzQ29kZV0pdGhpcy5kZWZzTG9hZGVkKCk7ZWxzZXt2YXIgYT1Qcm9qNGpzLmdldFNjcmlwdExvY2F0aW9uKCkrXCJkZWZzL1wiK3RoaXMuc3JzQXV0aC50b1VwcGVyQ2FzZSgpK3RoaXMuc3JzUHJvak51bWJlcitcIi5qc1wiO1Byb2o0anMubG9hZFNjcmlwdChhLFByb2o0anMuYmluZCh0aGlzLmRlZnNMb2FkZWQsdGhpcyksUHJvajRqcy5iaW5kKHRoaXMubG9hZEZyb21TZXJ2aWNlLHRoaXMpLFByb2o0anMuYmluZCh0aGlzLmNoZWNrRGVmc0xvYWRlZCx0aGlzKSl9fSxsb2FkRnJvbVNlcnZpY2U6ZnVuY3Rpb24oKXtQcm9qNGpzLmxvYWRTY3JpcHQoUHJvajRqcy5kZWZzTG9va3VwU2VydmljZStcIi9cIit0aGlzLnNyc0F1dGgrXG5cIi9cIit0aGlzLnNyc1Byb2pOdW1iZXIrXCIvcHJvajRqcy9cIixQcm9qNGpzLmJpbmQodGhpcy5kZWZzTG9hZGVkLHRoaXMpLFByb2o0anMuYmluZCh0aGlzLmRlZnNGYWlsZWQsdGhpcyksUHJvajRqcy5iaW5kKHRoaXMuY2hlY2tEZWZzTG9hZGVkLHRoaXMpKX0sZGVmc0xvYWRlZDpmdW5jdGlvbigpe3RoaXMucGFyc2VEZWZzKCk7dGhpcy5sb2FkUHJvakNvZGUodGhpcy5wcm9qTmFtZSl9LGNoZWNrRGVmc0xvYWRlZDpmdW5jdGlvbigpe3JldHVybiBQcm9qNGpzLmRlZnNbdGhpcy5zcnNDb2RlXT8hMDohMX0sZGVmc0ZhaWxlZDpmdW5jdGlvbigpe1Byb2o0anMucmVwb3J0RXJyb3IoXCJmYWlsZWQgdG8gbG9hZCBwcm9qZWN0aW9uIGRlZmluaXRpb24gZm9yOiBcIit0aGlzLnNyc0NvZGUpO1Byb2o0anMuZGVmc1t0aGlzLnNyc0NvZGVdPVByb2o0anMuZGVmcy5XR1M4NDt0aGlzLmRlZnNMb2FkZWQoKX0sbG9hZFByb2pDb2RlOmZ1bmN0aW9uKGEpe2lmKFByb2o0anMuUHJvalthXSl0aGlzLmluaXRUcmFuc2Zvcm1zKCk7XG5lbHNle3ZhciBjPVByb2o0anMuZ2V0U2NyaXB0TG9jYXRpb24oKStcInByb2pDb2RlL1wiK2ErXCIuanNcIjtQcm9qNGpzLmxvYWRTY3JpcHQoYyxQcm9qNGpzLmJpbmQodGhpcy5sb2FkUHJvakNvZGVTdWNjZXNzLHRoaXMsYSksUHJvajRqcy5iaW5kKHRoaXMubG9hZFByb2pDb2RlRmFpbHVyZSx0aGlzLGEpLFByb2o0anMuYmluZCh0aGlzLmNoZWNrQ29kZUxvYWRlZCx0aGlzLGEpKX19LGxvYWRQcm9qQ29kZVN1Y2Nlc3M6ZnVuY3Rpb24oYSl7UHJvajRqcy5Qcm9qW2FdLmRlcGVuZHNPbj90aGlzLmxvYWRQcm9qQ29kZShQcm9qNGpzLlByb2pbYV0uZGVwZW5kc09uKTp0aGlzLmluaXRUcmFuc2Zvcm1zKCl9LGxvYWRQcm9qQ29kZUZhaWx1cmU6ZnVuY3Rpb24oYSl7UHJvajRqcy5yZXBvcnRFcnJvcihcImZhaWxlZCB0byBmaW5kIHByb2plY3Rpb24gZmlsZSBmb3I6IFwiK2EpfSxjaGVja0NvZGVMb2FkZWQ6ZnVuY3Rpb24oYSl7cmV0dXJuIFByb2o0anMuUHJvalthXT8hMDohMX0saW5pdFRyYW5zZm9ybXM6ZnVuY3Rpb24oKXtQcm9qNGpzLmV4dGVuZCh0aGlzLFxuUHJvajRqcy5Qcm9qW3RoaXMucHJvak5hbWVdKTt0aGlzLmluaXQoKTt0aGlzLnJlYWR5VG9Vc2U9ITA7aWYodGhpcy5xdWV1ZSlmb3IodmFyIGE7YT10aGlzLnF1ZXVlLnNoaWZ0KCk7KWEuY2FsbCh0aGlzLHRoaXMpfSx3a3RSRTovXihcXHcrKVxcWyguKilcXF0kLyxwYXJzZVdLVDpmdW5jdGlvbihhKXtpZihhPWEubWF0Y2godGhpcy53a3RSRSkpe3ZhciBjPWFbMV0sYj1hWzJdLnNwbGl0KFwiLFwiKSxkO2Q9XCJUT1dHUzg0XCI9PWMudG9VcHBlckNhc2UoKT9jOmIuc2hpZnQoKTtkPWQucmVwbGFjZSgvXlxcXCIvLFwiXCIpO2Q9ZC5yZXBsYWNlKC9cXFwiJC8sXCJcIik7Zm9yKHZhciBhPVtdLGU9MCxmPVwiXCIsZz0wO2c8Yi5sZW5ndGg7KytnKXtmb3IodmFyIGk9YltnXSxoPTA7aDxpLmxlbmd0aDsrK2gpXCJbXCI9PWkuY2hhckF0KGgpJiYrK2UsXCJdXCI9PWkuY2hhckF0KGgpJiYtLWU7Zis9aTswPT09ZT8oYS5wdXNoKGYpLGY9XCJcIik6Zis9XCIsXCJ9c3dpdGNoKGMpe2Nhc2UgXCJMT0NBTF9DU1wiOnRoaXMucHJvak5hbWU9XG5cImlkZW50aXR5XCI7dGhpcy5sb2NhbENTPSEwO3RoaXMuc3JzQ29kZT1kO2JyZWFrO2Nhc2UgXCJHRU9HQ1NcIjp0aGlzLnByb2pOYW1lPVwibG9uZ2xhdFwiO3RoaXMuZ2VvY3NDb2RlPWQ7dGhpcy5zcnNDb2RlfHwodGhpcy5zcnNDb2RlPWQpO2JyZWFrO2Nhc2UgXCJQUk9KQ1NcIjp0aGlzLnNyc0NvZGU9ZDticmVhaztjYXNlIFwiUFJPSkVDVElPTlwiOnRoaXMucHJvak5hbWU9UHJvajRqcy53a3RQcm9qZWN0aW9uc1tkXTticmVhaztjYXNlIFwiREFUVU1cIjp0aGlzLmRhdHVtTmFtZT1kO2JyZWFrO2Nhc2UgXCJMT0NBTF9EQVRVTVwiOnRoaXMuZGF0dW1Db2RlPVwibm9uZVwiO2JyZWFrO2Nhc2UgXCJTUEhFUk9JRFwiOnRoaXMuZWxscHM9ZDt0aGlzLmE9cGFyc2VGbG9hdChhLnNoaWZ0KCkpO3RoaXMucmY9cGFyc2VGbG9hdChhLnNoaWZ0KCkpO2JyZWFrO2Nhc2UgXCJQUklNRU1cIjp0aGlzLmZyb21fZ3JlZW53aWNoPXBhcnNlRmxvYXQoYS5zaGlmdCgpKTticmVhaztjYXNlIFwiVU5JVFwiOnRoaXMudW5pdHM9XG5kO3RoaXMudW5pdHNQZXJNZXRlcj1wYXJzZUZsb2F0KGEuc2hpZnQoKSk7YnJlYWs7Y2FzZSBcIlBBUkFNRVRFUlwiOmM9ZC50b0xvd2VyQ2FzZSgpO2I9cGFyc2VGbG9hdChhLnNoaWZ0KCkpO3N3aXRjaChjKXtjYXNlIFwiZmFsc2VfZWFzdGluZ1wiOnRoaXMueDA9YjticmVhaztjYXNlIFwiZmFsc2Vfbm9ydGhpbmdcIjp0aGlzLnkwPWI7YnJlYWs7Y2FzZSBcInNjYWxlX2ZhY3RvclwiOnRoaXMuazA9YjticmVhaztjYXNlIFwiY2VudHJhbF9tZXJpZGlhblwiOnRoaXMubG9uZzA9YipQcm9qNGpzLmNvbW1vbi5EMlI7YnJlYWs7Y2FzZSBcImxhdGl0dWRlX29mX29yaWdpblwiOnRoaXMubGF0MD1iKlByb2o0anMuY29tbW9uLkQyUn1icmVhaztjYXNlIFwiVE9XR1M4NFwiOnRoaXMuZGF0dW1fcGFyYW1zPWE7YnJlYWs7Y2FzZSBcIkFYSVNcIjpjPWQudG9Mb3dlckNhc2UoKTtiPWEuc2hpZnQoKTtzd2l0Y2goYil7Y2FzZSBcIkVBU1RcIjpiPVwiZVwiO2JyZWFrO2Nhc2UgXCJXRVNUXCI6Yj1cIndcIjticmVhaztjYXNlIFwiTk9SVEhcIjpiPVxuXCJuXCI7YnJlYWs7Y2FzZSBcIlNPVVRIXCI6Yj1cInNcIjticmVhaztjYXNlIFwiVVBcIjpiPVwidVwiO2JyZWFrO2Nhc2UgXCJET1dOXCI6Yj1cImRcIjticmVhaztkZWZhdWx0OmI9XCIgXCJ9dGhpcy5heGlzfHwodGhpcy5heGlzPVwiZW51XCIpO3N3aXRjaChjKXtjYXNlIFwieFwiOnRoaXMuYXhpcz1iK3RoaXMuYXhpcy5zdWJzdHIoMSwyKTticmVhaztjYXNlIFwieVwiOnRoaXMuYXhpcz10aGlzLmF4aXMuc3Vic3RyKDAsMSkrYit0aGlzLmF4aXMuc3Vic3RyKDIsMSk7YnJlYWs7Y2FzZSBcInpcIjp0aGlzLmF4aXM9dGhpcy5heGlzLnN1YnN0cigwLDIpK2J9fWZvcihnPTA7ZzxhLmxlbmd0aDsrK2cpdGhpcy5wYXJzZVdLVChhW2ddKX19LHBhcnNlRGVmczpmdW5jdGlvbigpe3RoaXMuZGVmRGF0YT1Qcm9qNGpzLmRlZnNbdGhpcy5zcnNDb2RlXTt2YXIgYSxjO2lmKHRoaXMuZGVmRGF0YSl7Zm9yKHZhciBiPXRoaXMuZGVmRGF0YS5zcGxpdChcIitcIiksZD0wO2Q8Yi5sZW5ndGg7ZCsrKXN3aXRjaChjPWJbZF0uc3BsaXQoXCI9XCIpLFxuYT1jWzBdLnRvTG93ZXJDYXNlKCksYz1jWzFdLGEucmVwbGFjZSgvXFxzL2dpLFwiXCIpKXtjYXNlIFwidGl0bGVcIjp0aGlzLnRpdGxlPWM7YnJlYWs7Y2FzZSBcInByb2pcIjp0aGlzLnByb2pOYW1lPWMucmVwbGFjZSgvXFxzL2dpLFwiXCIpO2JyZWFrO2Nhc2UgXCJ1bml0c1wiOnRoaXMudW5pdHM9Yy5yZXBsYWNlKC9cXHMvZ2ksXCJcIik7YnJlYWs7Y2FzZSBcImRhdHVtXCI6dGhpcy5kYXR1bUNvZGU9Yy5yZXBsYWNlKC9cXHMvZ2ksXCJcIik7YnJlYWs7Y2FzZSBcIm5hZGdyaWRzXCI6dGhpcy5uYWdyaWRzPWMucmVwbGFjZSgvXFxzL2dpLFwiXCIpO2JyZWFrO2Nhc2UgXCJlbGxwc1wiOnRoaXMuZWxscHM9Yy5yZXBsYWNlKC9cXHMvZ2ksXCJcIik7YnJlYWs7Y2FzZSBcImFcIjp0aGlzLmE9cGFyc2VGbG9hdChjKTticmVhaztjYXNlIFwiYlwiOnRoaXMuYj1wYXJzZUZsb2F0KGMpO2JyZWFrO2Nhc2UgXCJyZlwiOnRoaXMucmY9cGFyc2VGbG9hdChjKTticmVhaztjYXNlIFwibGF0XzBcIjp0aGlzLmxhdDA9YypQcm9qNGpzLmNvbW1vbi5EMlI7XG5icmVhaztjYXNlIFwibGF0XzFcIjp0aGlzLmxhdDE9YypQcm9qNGpzLmNvbW1vbi5EMlI7YnJlYWs7Y2FzZSBcImxhdF8yXCI6dGhpcy5sYXQyPWMqUHJvajRqcy5jb21tb24uRDJSO2JyZWFrO2Nhc2UgXCJsYXRfdHNcIjp0aGlzLmxhdF90cz1jKlByb2o0anMuY29tbW9uLkQyUjticmVhaztjYXNlIFwibG9uXzBcIjp0aGlzLmxvbmcwPWMqUHJvajRqcy5jb21tb24uRDJSO2JyZWFrO2Nhc2UgXCJhbHBoYVwiOnRoaXMuYWxwaGE9cGFyc2VGbG9hdChjKSpQcm9qNGpzLmNvbW1vbi5EMlI7YnJlYWs7Y2FzZSBcImxvbmNcIjp0aGlzLmxvbmdjPWMqUHJvajRqcy5jb21tb24uRDJSO2JyZWFrO2Nhc2UgXCJ4XzBcIjp0aGlzLngwPXBhcnNlRmxvYXQoYyk7YnJlYWs7Y2FzZSBcInlfMFwiOnRoaXMueTA9cGFyc2VGbG9hdChjKTticmVhaztjYXNlIFwia18wXCI6dGhpcy5rMD1wYXJzZUZsb2F0KGMpO2JyZWFrO2Nhc2UgXCJrXCI6dGhpcy5rMD1wYXJzZUZsb2F0KGMpO2JyZWFrO2Nhc2UgXCJyX2FcIjp0aGlzLlJfQT0hMDticmVhaztcbmNhc2UgXCJ6b25lXCI6dGhpcy56b25lPXBhcnNlSW50KGMsMTApO2JyZWFrO2Nhc2UgXCJzb3V0aFwiOnRoaXMudXRtU291dGg9ITA7YnJlYWs7Y2FzZSBcInRvd2dzODRcIjp0aGlzLmRhdHVtX3BhcmFtcz1jLnNwbGl0KFwiLFwiKTticmVhaztjYXNlIFwidG9fbWV0ZXJcIjp0aGlzLnRvX21ldGVyPXBhcnNlRmxvYXQoYyk7YnJlYWs7Y2FzZSBcImZyb21fZ3JlZW53aWNoXCI6dGhpcy5mcm9tX2dyZWVud2ljaD1jKlByb2o0anMuY29tbW9uLkQyUjticmVhaztjYXNlIFwicG1cIjpjPWMucmVwbGFjZSgvXFxzL2dpLFwiXCIpO3RoaXMuZnJvbV9ncmVlbndpY2g9UHJvajRqcy5QcmltZU1lcmlkaWFuW2NdP1Byb2o0anMuUHJpbWVNZXJpZGlhbltjXTpwYXJzZUZsb2F0KGMpO3RoaXMuZnJvbV9ncmVlbndpY2gqPVByb2o0anMuY29tbW9uLkQyUjticmVhaztjYXNlIFwiYXhpc1wiOmM9Yy5yZXBsYWNlKC9cXHMvZ2ksXCJcIiksMz09Yy5sZW5ndGgmJi0xIT1cImV3bnN1ZFwiLmluZGV4T2YoYy5zdWJzdHIoMCwxKSkmJi0xIT1cblwiZXduc3VkXCIuaW5kZXhPZihjLnN1YnN0cigxLDEpKSYmLTEhPVwiZXduc3VkXCIuaW5kZXhPZihjLnN1YnN0cigyLDEpKSYmKHRoaXMuYXhpcz1jKX10aGlzLmRlcml2ZUNvbnN0YW50cygpfX0sZGVyaXZlQ29uc3RhbnRzOmZ1bmN0aW9uKCl7XCJAbnVsbFwiPT10aGlzLm5hZ3JpZHMmJih0aGlzLmRhdHVtQ29kZT1cIm5vbmVcIik7aWYodGhpcy5kYXR1bUNvZGUmJlwibm9uZVwiIT10aGlzLmRhdHVtQ29kZSl7dmFyIGE9UHJvajRqcy5EYXR1bVt0aGlzLmRhdHVtQ29kZV07YSYmKHRoaXMuZGF0dW1fcGFyYW1zPWEudG93Z3M4ND9hLnRvd2dzODQuc3BsaXQoXCIsXCIpOm51bGwsdGhpcy5lbGxwcz1hLmVsbGlwc2UsdGhpcy5kYXR1bU5hbWU9YS5kYXR1bU5hbWU/YS5kYXR1bU5hbWU6dGhpcy5kYXR1bUNvZGUpfXRoaXMuYXx8UHJvajRqcy5leHRlbmQodGhpcyxQcm9qNGpzLkVsbGlwc29pZFt0aGlzLmVsbHBzXT9Qcm9qNGpzLkVsbGlwc29pZFt0aGlzLmVsbHBzXTpQcm9qNGpzLkVsbGlwc29pZC5XR1M4NCk7XG50aGlzLnJmJiYhdGhpcy5iJiYodGhpcy5iPSgxLTEvdGhpcy5yZikqdGhpcy5hKTtpZigwPT09dGhpcy5yZnx8TWF0aC5hYnModGhpcy5hLXRoaXMuYik8UHJvajRqcy5jb21tb24uRVBTTE4pdGhpcy5zcGhlcmU9ITAsdGhpcy5iPXRoaXMuYTt0aGlzLmEyPXRoaXMuYSp0aGlzLmE7dGhpcy5iMj10aGlzLmIqdGhpcy5iO3RoaXMuZXM9KHRoaXMuYTItdGhpcy5iMikvdGhpcy5hMjt0aGlzLmU9TWF0aC5zcXJ0KHRoaXMuZXMpO3RoaXMuUl9BJiYodGhpcy5hKj0xLXRoaXMuZXMqKFByb2o0anMuY29tbW9uLlNJWFRIK3RoaXMuZXMqKFByb2o0anMuY29tbW9uLlJBNCt0aGlzLmVzKlByb2o0anMuY29tbW9uLlJBNikpLHRoaXMuYTI9dGhpcy5hKnRoaXMuYSx0aGlzLmIyPXRoaXMuYip0aGlzLmIsdGhpcy5lcz0wKTt0aGlzLmVwMj0odGhpcy5hMi10aGlzLmIyKS90aGlzLmIyO3RoaXMuazB8fCh0aGlzLmswPTEpO3RoaXMuYXhpc3x8KHRoaXMuYXhpcz1cImVudVwiKTt0aGlzLmRhdHVtPVxubmV3IFByb2o0anMuZGF0dW0odGhpcyl9fSk7UHJvajRqcy5Qcm9qLmxvbmdsYXQ9e2luaXQ6ZnVuY3Rpb24oKXt9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7cmV0dXJuIGF9LGludmVyc2U6ZnVuY3Rpb24oYSl7cmV0dXJuIGF9fTtQcm9qNGpzLlByb2ouaWRlbnRpdHk9UHJvajRqcy5Qcm9qLmxvbmdsYXQ7XG5Qcm9qNGpzLmRlZnM9e1dHUzg0OlwiK3RpdGxlPWxvbmcvbGF0OldHUzg0ICtwcm9qPWxvbmdsYXQgK2VsbHBzPVdHUzg0ICtkYXR1bT1XR1M4NCArdW5pdHM9ZGVncmVlc1wiLFwiRVBTRzo0MzI2XCI6XCIrdGl0bGU9bG9uZy9sYXQ6V0dTODQgK3Byb2o9bG9uZ2xhdCArYT02Mzc4MTM3LjAgK2I9NjM1Njc1Mi4zMTQyNDUxOCArZWxscHM9V0dTODQgK2RhdHVtPVdHUzg0ICt1bml0cz1kZWdyZWVzXCIsXCJFUFNHOjQyNjlcIjpcIit0aXRsZT1sb25nL2xhdDpOQUQ4MyArcHJvaj1sb25nbGF0ICthPTYzNzgxMzcuMCArYj02MzU2NzUyLjMxNDE0MDM2ICtlbGxwcz1HUlM4MCArZGF0dW09TkFEODMgK3VuaXRzPWRlZ3JlZXNcIixcIkVQU0c6Mzg3NVwiOlwiK3RpdGxlPSBHb29nbGUgTWVyY2F0b3IgK3Byb2o9bWVyYyArYT02Mzc4MTM3ICtiPTYzNzgxMzcgK2xhdF90cz0wLjAgK2xvbl8wPTAuMCAreF8wPTAuMCAreV8wPTAgK2s9MS4wICt1bml0cz1tICtuYWRncmlkcz1AbnVsbCArbm9fZGVmc1wifTtcblByb2o0anMuZGVmc1tcIkVQU0c6Mzc4NVwiXT1Qcm9qNGpzLmRlZnNbXCJFUFNHOjM4NzVcIl07UHJvajRqcy5kZWZzLkdPT0dMRT1Qcm9qNGpzLmRlZnNbXCJFUFNHOjM4NzVcIl07UHJvajRqcy5kZWZzW1wiRVBTRzo5MDA5MTNcIl09UHJvajRqcy5kZWZzW1wiRVBTRzozODc1XCJdO1Byb2o0anMuZGVmc1tcIkVQU0c6MTAyMTEzXCJdPVByb2o0anMuZGVmc1tcIkVQU0c6Mzg3NVwiXTtcblByb2o0anMuY29tbW9uPXtQSTozLjE0MTU5MjY1MzU4OTc5MyxIQUxGX1BJOjEuNTcwNzk2MzI2Nzk0ODk2NixUV09fUEk6Ni4yODMxODUzMDcxNzk1ODYsRk9SVFBJOjAuNzg1Mzk4MTYzMzk3NDQ4MyxSMkQ6NTcuMjk1Nzc5NTEzMDgyMzIsRDJSOjAuMDE3NDUzMjkyNTE5OTQzMjk1LFNFQ19UT19SQUQ6NC44NDgxMzY4MTEwOTUzNkUtNixFUFNMTjoxLjBFLTEwLE1BWF9JVEVSOjIwLENPU182N1A1OjAuMzgyNjgzNDMyMzY1MDg5OCxBRF9DOjEuMDAyNixQSkRfVU5LTk9XTjowLFBKRF8zUEFSQU06MSxQSkRfN1BBUkFNOjIsUEpEX0dSSURTSElGVDozLFBKRF9XR1M4NDo0LFBKRF9OT0RBVFVNOjUsU1JTX1dHUzg0X1NFTUlNQUpPUjo2Mzc4MTM3LFNJWFRIOjAuMTY2NjY2NjY2NjY2NjY2NjYsUkE0OjAuMDQ3MjIyMjIyMjIyMjIyMjIsUkE2OjAuMDIyMTU2MDg0NjU2MDg0NjU1LFJWNDowLjA2OTQ0NDQ0NDQ0NDQ0NDQ1LFJWNjowLjA0MjQzODI3MTYwNDkzODI3LG1zZm56OmZ1bmN0aW9uKGEsXG5jLGIpe2EqPWM7cmV0dXJuIGIvTWF0aC5zcXJ0KDEtYSphKX0sdHNmbno6ZnVuY3Rpb24oYSxjLGIpe2IqPWE7Yj1NYXRoLnBvdygoMS1iKS8oMStiKSwwLjUqYSk7cmV0dXJuIE1hdGgudGFuKDAuNSoodGhpcy5IQUxGX1BJLWMpKS9ifSxwaGkyejpmdW5jdGlvbihhLGMpe2Zvcih2YXIgYj0wLjUqYSxkLGU9dGhpcy5IQUxGX1BJLTIqTWF0aC5hdGFuKGMpLGY9MDsxNT49ZjtmKyspaWYoZD1hKk1hdGguc2luKGUpLGQ9dGhpcy5IQUxGX1BJLTIqTWF0aC5hdGFuKGMqTWF0aC5wb3coKDEtZCkvKDErZCksYikpLWUsZSs9ZCwxLjBFLTEwPj1NYXRoLmFicyhkKSlyZXR1cm4gZTthbGVydChcInBoaTJ6IGhhcyBOb0NvbnZlcmdlbmNlXCIpO3JldHVybi05OTk5fSxxc2ZuejpmdW5jdGlvbihhLGMpe3ZhciBiO3JldHVybiAxLjBFLTc8YT8oYj1hKmMsKDEtYSphKSooYy8oMS1iKmIpLTAuNS9hKk1hdGgubG9nKCgxLWIpLygxK2IpKSkpOjIqY30sYXNpbno6ZnVuY3Rpb24oYSl7MTxNYXRoLmFicyhhKSYmXG4oYT0xPGE/MTotMSk7cmV0dXJuIE1hdGguYXNpbihhKX0sZTBmbjpmdW5jdGlvbihhKXtyZXR1cm4gMS0wLjI1KmEqKDErYS8xNiooMysxLjI1KmEpKX0sZTFmbjpmdW5jdGlvbihhKXtyZXR1cm4gMC4zNzUqYSooMSswLjI1KmEqKDErMC40Njg3NSphKSl9LGUyZm46ZnVuY3Rpb24oYSl7cmV0dXJuIDAuMDU4NTkzNzUqYSphKigxKzAuNzUqYSl9LGUzZm46ZnVuY3Rpb24oYSl7cmV0dXJuIGEqYSphKigzNS8zMDcyKX0sbWxmbjpmdW5jdGlvbihhLGMsYixkLGUpe3JldHVybiBhKmUtYypNYXRoLnNpbigyKmUpK2IqTWF0aC5zaW4oNCplKS1kKk1hdGguc2luKDYqZSl9LHNyYXQ6ZnVuY3Rpb24oYSxjKXtyZXR1cm4gTWF0aC5wb3coKDEtYSkvKDErYSksYyl9LHNpZ246ZnVuY3Rpb24oYSl7cmV0dXJuIDA+YT8tMToxfSxhZGp1c3RfbG9uOmZ1bmN0aW9uKGEpe3JldHVybiBhPU1hdGguYWJzKGEpPHRoaXMuUEk/YTphLXRoaXMuc2lnbihhKSp0aGlzLlRXT19QSX0sYWRqdXN0X2xhdDpmdW5jdGlvbihhKXtyZXR1cm4gYT1cbk1hdGguYWJzKGEpPHRoaXMuSEFMRl9QST9hOmEtdGhpcy5zaWduKGEpKnRoaXMuUEl9LGxhdGlzbzpmdW5jdGlvbihhLGMsYil7aWYoTWF0aC5hYnMoYyk+dGhpcy5IQUxGX1BJKXJldHVybitOdW1iZXIuTmFOO2lmKGM9PXRoaXMuSEFMRl9QSSlyZXR1cm4gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO2lmKGM9PS0xKnRoaXMuSEFMRl9QSSlyZXR1cm4tMSpOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7Yio9YTtyZXR1cm4gTWF0aC5sb2coTWF0aC50YW4oKHRoaXMuSEFMRl9QSStjKS8yKSkrYSpNYXRoLmxvZygoMS1iKS8oMStiKSkvMn0sZkw6ZnVuY3Rpb24oYSxjKXtyZXR1cm4gMipNYXRoLmF0YW4oYSpNYXRoLmV4cChjKSktdGhpcy5IQUxGX1BJfSxpbnZsYXRpc286ZnVuY3Rpb24oYSxjKXt2YXIgYj10aGlzLmZMKDEsYyksZD0wLGU9MDtkbyBkPWIsZT1hKk1hdGguc2luKGQpLGI9dGhpcy5mTChNYXRoLmV4cChhKk1hdGgubG9nKCgxK2UpLygxLWUpKS8yKSxjKTt3aGlsZSgxLjBFLTEyPFxuTWF0aC5hYnMoYi1kKSk7cmV0dXJuIGJ9LHNpbmg6ZnVuY3Rpb24oYSl7YT1NYXRoLmV4cChhKTtyZXR1cm4oYS0xL2EpLzJ9LGNvc2g6ZnVuY3Rpb24oYSl7YT1NYXRoLmV4cChhKTtyZXR1cm4oYSsxL2EpLzJ9LHRhbmg6ZnVuY3Rpb24oYSl7YT1NYXRoLmV4cChhKTtyZXR1cm4oYS0xL2EpLyhhKzEvYSl9LGFzaW5oOmZ1bmN0aW9uKGEpe3JldHVybigwPD1hPzE6LTEpKk1hdGgubG9nKE1hdGguYWJzKGEpK01hdGguc3FydChhKmErMSkpfSxhY29zaDpmdW5jdGlvbihhKXtyZXR1cm4gMipNYXRoLmxvZyhNYXRoLnNxcnQoKGErMSkvMikrTWF0aC5zcXJ0KChhLTEpLzIpKX0sYXRhbmg6ZnVuY3Rpb24oYSl7cmV0dXJuIE1hdGgubG9nKChhLTEpLyhhKzEpKS8yfSxnTjpmdW5jdGlvbihhLGMsYil7Yyo9YjtyZXR1cm4gYS9NYXRoLnNxcnQoMS1jKmMpfSxwal9lbmZuOmZ1bmN0aW9uKGEpe3ZhciBjPVtdO2NbMF09dGhpcy5DMDAtYSoodGhpcy5DMDIrYSoodGhpcy5DMDQrYSoodGhpcy5DMDYrXG5hKnRoaXMuQzA4KSkpO2NbMV09YSoodGhpcy5DMjItYSoodGhpcy5DMDQrYSoodGhpcy5DMDYrYSp0aGlzLkMwOCkpKTt2YXIgYj1hKmE7Y1syXT1iKih0aGlzLkM0NC1hKih0aGlzLkM0NithKnRoaXMuQzQ4KSk7Yio9YTtjWzNdPWIqKHRoaXMuQzY2LWEqdGhpcy5DNjgpO2NbNF09YiphKnRoaXMuQzg4O3JldHVybiBjfSxwal9tbGZuOmZ1bmN0aW9uKGEsYyxiLGQpe2IqPWM7Yyo9YztyZXR1cm4gZFswXSphLWIqKGRbMV0rYyooZFsyXStjKihkWzNdK2MqZFs0XSkpKX0scGpfaW52X21sZm46ZnVuY3Rpb24oYSxjLGIpe2Zvcih2YXIgZD0xLygxLWMpLGU9YSxmPVByb2o0anMuY29tbW9uLk1BWF9JVEVSO2Y7LS1mKXt2YXIgZz1NYXRoLnNpbihlKSxpPTEtYypnKmcsaT0odGhpcy5wal9tbGZuKGUsZyxNYXRoLmNvcyhlKSxiKS1hKSppKk1hdGguc3FydChpKSpkLGU9ZS1pO2lmKE1hdGguYWJzKGkpPFByb2o0anMuY29tbW9uLkVQU0xOKXJldHVybiBlfVByb2o0anMucmVwb3J0RXJyb3IoXCJjYXNzOnBqX2ludl9tbGZuOiBDb252ZXJnZW5jZSBlcnJvclwiKTtcbnJldHVybiBlfSxDMDA6MSxDMDI6MC4yNSxDMDQ6MC4wNDY4NzUsQzA2OjAuMDE5NTMxMjUsQzA4OjAuMDEwNjgxMTUyMzQzNzUsQzIyOjAuNzUsQzQ0OjAuNDY4NzUsQzQ2OjAuMDEzMDIwODMzMzMzMzMzMzM0LEM0ODowLjAwNzEyMDc2ODIyOTE2NjY2NyxDNjY6MC4zNjQ1ODMzMzMzMzMzMzMzLEM2ODowLjAwNTY5NjYxNDU4MzMzMzMzMyxDODg6MC4zMDc2MTcxODc1fTtcblByb2o0anMuZGF0dW09UHJvajRqcy5DbGFzcyh7aW5pdGlhbGl6ZTpmdW5jdGlvbihhKXt0aGlzLmRhdHVtX3R5cGU9UHJvajRqcy5jb21tb24uUEpEX1dHUzg0O2EuZGF0dW1Db2RlJiZcIm5vbmVcIj09YS5kYXR1bUNvZGUmJih0aGlzLmRhdHVtX3R5cGU9UHJvajRqcy5jb21tb24uUEpEX05PREFUVU0pO2lmKGEmJmEuZGF0dW1fcGFyYW1zKXtmb3IodmFyIGM9MDtjPGEuZGF0dW1fcGFyYW1zLmxlbmd0aDtjKyspYS5kYXR1bV9wYXJhbXNbY109cGFyc2VGbG9hdChhLmRhdHVtX3BhcmFtc1tjXSk7aWYoMCE9YS5kYXR1bV9wYXJhbXNbMF18fDAhPWEuZGF0dW1fcGFyYW1zWzFdfHwwIT1hLmRhdHVtX3BhcmFtc1syXSl0aGlzLmRhdHVtX3R5cGU9UHJvajRqcy5jb21tb24uUEpEXzNQQVJBTTtpZigzPGEuZGF0dW1fcGFyYW1zLmxlbmd0aCYmKDAhPWEuZGF0dW1fcGFyYW1zWzNdfHwwIT1hLmRhdHVtX3BhcmFtc1s0XXx8MCE9YS5kYXR1bV9wYXJhbXNbNV18fDAhPWEuZGF0dW1fcGFyYW1zWzZdKSl0aGlzLmRhdHVtX3R5cGU9XG5Qcm9qNGpzLmNvbW1vbi5QSkRfN1BBUkFNLGEuZGF0dW1fcGFyYW1zWzNdKj1Qcm9qNGpzLmNvbW1vbi5TRUNfVE9fUkFELGEuZGF0dW1fcGFyYW1zWzRdKj1Qcm9qNGpzLmNvbW1vbi5TRUNfVE9fUkFELGEuZGF0dW1fcGFyYW1zWzVdKj1Qcm9qNGpzLmNvbW1vbi5TRUNfVE9fUkFELGEuZGF0dW1fcGFyYW1zWzZdPWEuZGF0dW1fcGFyYW1zWzZdLzFFNisxfWEmJih0aGlzLmE9YS5hLHRoaXMuYj1hLmIsdGhpcy5lcz1hLmVzLHRoaXMuZXAyPWEuZXAyLHRoaXMuZGF0dW1fcGFyYW1zPWEuZGF0dW1fcGFyYW1zKX0sY29tcGFyZV9kYXR1bXM6ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMuZGF0dW1fdHlwZSE9YS5kYXR1bV90eXBlfHx0aGlzLmEhPWEuYXx8NS4wRS0xMTxNYXRoLmFicyh0aGlzLmVzLWEuZXMpPyExOnRoaXMuZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEXzNQQVJBTT90aGlzLmRhdHVtX3BhcmFtc1swXT09YS5kYXR1bV9wYXJhbXNbMF0mJnRoaXMuZGF0dW1fcGFyYW1zWzFdPT1cbmEuZGF0dW1fcGFyYW1zWzFdJiZ0aGlzLmRhdHVtX3BhcmFtc1syXT09YS5kYXR1bV9wYXJhbXNbMl06dGhpcy5kYXR1bV90eXBlPT1Qcm9qNGpzLmNvbW1vbi5QSkRfN1BBUkFNP3RoaXMuZGF0dW1fcGFyYW1zWzBdPT1hLmRhdHVtX3BhcmFtc1swXSYmdGhpcy5kYXR1bV9wYXJhbXNbMV09PWEuZGF0dW1fcGFyYW1zWzFdJiZ0aGlzLmRhdHVtX3BhcmFtc1syXT09YS5kYXR1bV9wYXJhbXNbMl0mJnRoaXMuZGF0dW1fcGFyYW1zWzNdPT1hLmRhdHVtX3BhcmFtc1szXSYmdGhpcy5kYXR1bV9wYXJhbXNbNF09PWEuZGF0dW1fcGFyYW1zWzRdJiZ0aGlzLmRhdHVtX3BhcmFtc1s1XT09YS5kYXR1bV9wYXJhbXNbNV0mJnRoaXMuZGF0dW1fcGFyYW1zWzZdPT1hLmRhdHVtX3BhcmFtc1s2XTp0aGlzLmRhdHVtX3R5cGU9PVByb2o0anMuY29tbW9uLlBKRF9HUklEU0hJRlR8fGEuZGF0dW1fdHlwZT09UHJvajRqcy5jb21tb24uUEpEX0dSSURTSElGVD8oYWxlcnQoXCJFUlJPUjogR3JpZCBzaGlmdCB0cmFuc2Zvcm1hdGlvbnMgYXJlIG5vdCBpbXBsZW1lbnRlZC5cIiksXG4hMSk6ITB9LGdlb2RldGljX3RvX2dlb2NlbnRyaWM6ZnVuY3Rpb24oYSl7dmFyIGM9YS54LGI9YS55LGQ9YS56P2EuejowLGUsZixnO2lmKGI8LVByb2o0anMuY29tbW9uLkhBTEZfUEkmJmI+LTEuMDAxKlByb2o0anMuY29tbW9uLkhBTEZfUEkpYj0tUHJvajRqcy5jb21tb24uSEFMRl9QSTtlbHNlIGlmKGI+UHJvajRqcy5jb21tb24uSEFMRl9QSSYmYjwxLjAwMSpQcm9qNGpzLmNvbW1vbi5IQUxGX1BJKWI9UHJvajRqcy5jb21tb24uSEFMRl9QSTtlbHNlIGlmKGI8LVByb2o0anMuY29tbW9uLkhBTEZfUEl8fGI+UHJvajRqcy5jb21tb24uSEFMRl9QSSlyZXR1cm4gUHJvajRqcy5yZXBvcnRFcnJvcihcImdlb2NlbnQ6bGF0IG91dCBvZiByYW5nZTpcIitiKSxudWxsO2M+UHJvajRqcy5jb21tb24uUEkmJihjLT0yKlByb2o0anMuY29tbW9uLlBJKTtmPU1hdGguc2luKGIpO2c9TWF0aC5jb3MoYik7ZT10aGlzLmEvTWF0aC5zcXJ0KDEtdGhpcy5lcypmKmYpO2I9KGUrZCkqZypNYXRoLmNvcyhjKTtcbmM9KGUrZCkqZypNYXRoLnNpbihjKTtkPShlKigxLXRoaXMuZXMpK2QpKmY7YS54PWI7YS55PWM7YS56PWQ7cmV0dXJuIDB9LGdlb2NlbnRyaWNfdG9fZ2VvZGV0aWM6ZnVuY3Rpb24oYSl7dmFyIGMsYixkLGUsZixnLGksaCxqLGssbD1hLng7ZD1hLnk7dmFyIG09YS56P2EuejowO2M9TWF0aC5zcXJ0KGwqbCtkKmQpO2I9TWF0aC5zcXJ0KGwqbCtkKmQrbSptKTtpZigxLjBFLTEyPmMvdGhpcy5hKXtpZihsPTAsMS4wRS0xMj5iL3RoaXMuYSlyZXR1cm59ZWxzZSBsPU1hdGguYXRhbjIoZCxsKTtkPW0vYjtlPWMvYjtmPTEvTWF0aC5zcXJ0KDEtdGhpcy5lcyooMi10aGlzLmVzKSplKmUpO2k9ZSooMS10aGlzLmVzKSpmO2g9ZCpmO2s9MDtkbyBrKyssZz10aGlzLmEvTWF0aC5zcXJ0KDEtdGhpcy5lcypoKmgpLGI9YyppK20qaC1nKigxLXRoaXMuZXMqaCpoKSxnPXRoaXMuZXMqZy8oZytiKSxmPTEvTWF0aC5zcXJ0KDEtZyooMi1nKSplKmUpLGc9ZSooMS1nKSpmLGYqPWQsaj1mKmktZypcbmgsaT1nLGg9Zjt3aGlsZSgxLjBFLTI0PGoqaiYmMzA+ayk7Yz1NYXRoLmF0YW4oZi9NYXRoLmFicyhnKSk7YS54PWw7YS55PWM7YS56PWI7cmV0dXJuIGF9LGdlb2NlbnRyaWNfdG9fZ2VvZGV0aWNfbm9uaXRlcjpmdW5jdGlvbihhKXt2YXIgYz1hLngsYj1hLnksZD1hLno/YS56OjAsZSxmLGcsaSxoLGM9cGFyc2VGbG9hdChjKSxiPXBhcnNlRmxvYXQoYiksZD1wYXJzZUZsb2F0KGQpO2g9ITE7aWYoMCE9YyllPU1hdGguYXRhbjIoYixjKTtlbHNlIGlmKDA8YillPVByb2o0anMuY29tbW9uLkhBTEZfUEk7ZWxzZSBpZigwPmIpZT0tUHJvajRqcy5jb21tb24uSEFMRl9QSTtlbHNlIGlmKGg9ITAsZT0wLDA8ZClmPVByb2o0anMuY29tbW9uLkhBTEZfUEk7ZWxzZSBpZigwPmQpZj0tUHJvajRqcy5jb21tb24uSEFMRl9QSTtlbHNlIHJldHVybjtnPWMqYytiKmI7Yz1NYXRoLnNxcnQoZyk7Yj1kKlByb2o0anMuY29tbW9uLkFEX0M7Zz1NYXRoLnNxcnQoYipiK2cpO2IvPWc7Zz1jL2c7Yj1cbmQrdGhpcy5iKnRoaXMuZXAyKmIqYipiO2k9Yy10aGlzLmEqdGhpcy5lcypnKmcqZztnPU1hdGguc3FydChiKmIraSppKTtiLz1nO2c9aS9nO2k9dGhpcy5hL01hdGguc3FydCgxLXRoaXMuZXMqYipiKTtkPWc+PVByb2o0anMuY29tbW9uLkNPU182N1A1P2MvZy1pOmc8PS1Qcm9qNGpzLmNvbW1vbi5DT1NfNjdQNT9jLy1nLWk6ZC9iK2kqKHRoaXMuZXMtMSk7ITE9PWgmJihmPU1hdGguYXRhbihiL2cpKTthLng9ZTthLnk9ZjthLno9ZDtyZXR1cm4gYX0sZ2VvY2VudHJpY190b193Z3M4NDpmdW5jdGlvbihhKXtpZih0aGlzLmRhdHVtX3R5cGU9PVByb2o0anMuY29tbW9uLlBKRF8zUEFSQU0pYS54Kz10aGlzLmRhdHVtX3BhcmFtc1swXSxhLnkrPXRoaXMuZGF0dW1fcGFyYW1zWzFdLGEueis9dGhpcy5kYXR1bV9wYXJhbXNbMl07ZWxzZSBpZih0aGlzLmRhdHVtX3R5cGU9PVByb2o0anMuY29tbW9uLlBKRF83UEFSQU0pe3ZhciBjPXRoaXMuZGF0dW1fcGFyYW1zWzNdLGI9dGhpcy5kYXR1bV9wYXJhbXNbNF0sXG5kPXRoaXMuZGF0dW1fcGFyYW1zWzVdLGU9dGhpcy5kYXR1bV9wYXJhbXNbNl0sZj1lKihkKmEueCthLnktYyphLnopK3RoaXMuZGF0dW1fcGFyYW1zWzFdLGM9ZSooLWIqYS54K2MqYS55K2EueikrdGhpcy5kYXR1bV9wYXJhbXNbMl07YS54PWUqKGEueC1kKmEueStiKmEueikrdGhpcy5kYXR1bV9wYXJhbXNbMF07YS55PWY7YS56PWN9fSxnZW9jZW50cmljX2Zyb21fd2dzODQ6ZnVuY3Rpb24oYSl7aWYodGhpcy5kYXR1bV90eXBlPT1Qcm9qNGpzLmNvbW1vbi5QSkRfM1BBUkFNKWEueC09dGhpcy5kYXR1bV9wYXJhbXNbMF0sYS55LT10aGlzLmRhdHVtX3BhcmFtc1sxXSxhLnotPXRoaXMuZGF0dW1fcGFyYW1zWzJdO2Vsc2UgaWYodGhpcy5kYXR1bV90eXBlPT1Qcm9qNGpzLmNvbW1vbi5QSkRfN1BBUkFNKXt2YXIgYz10aGlzLmRhdHVtX3BhcmFtc1szXSxiPXRoaXMuZGF0dW1fcGFyYW1zWzRdLGQ9dGhpcy5kYXR1bV9wYXJhbXNbNV0sZT10aGlzLmRhdHVtX3BhcmFtc1s2XSxmPShhLngtXG50aGlzLmRhdHVtX3BhcmFtc1swXSkvZSxnPShhLnktdGhpcy5kYXR1bV9wYXJhbXNbMV0pL2UsZT0oYS56LXRoaXMuZGF0dW1fcGFyYW1zWzJdKS9lO2EueD1mK2QqZy1iKmU7YS55PS1kKmYrZytjKmU7YS56PWIqZi1jKmcrZX19fSk7XG5Qcm9qNGpzLlBvaW50PVByb2o0anMuQ2xhc3Moe2luaXRpYWxpemU6ZnVuY3Rpb24oYSxjLGIpe1wib2JqZWN0XCI9PXR5cGVvZiBhPyh0aGlzLng9YVswXSx0aGlzLnk9YVsxXSx0aGlzLno9YVsyXXx8MCk6XCJzdHJpbmdcIj09dHlwZW9mIGEmJlwidW5kZWZpbmVkXCI9PXR5cGVvZiBjPyhhPWEuc3BsaXQoXCIsXCIpLHRoaXMueD1wYXJzZUZsb2F0KGFbMF0pLHRoaXMueT1wYXJzZUZsb2F0KGFbMV0pLHRoaXMuej1wYXJzZUZsb2F0KGFbMl0pfHwwKToodGhpcy54PWEsdGhpcy55PWMsdGhpcy56PWJ8fDApfSxjbG9uZTpmdW5jdGlvbigpe3JldHVybiBuZXcgUHJvajRqcy5Qb2ludCh0aGlzLngsdGhpcy55LHRoaXMueil9LHRvU3RyaW5nOmZ1bmN0aW9uKCl7cmV0dXJuXCJ4PVwiK3RoaXMueCtcIix5PVwiK3RoaXMueX0sdG9TaG9ydFN0cmluZzpmdW5jdGlvbigpe3JldHVybiB0aGlzLngrXCIsIFwiK3RoaXMueX19KTtcblByb2o0anMuUHJpbWVNZXJpZGlhbj17Z3JlZW53aWNoOjAsbGlzYm9uOi05LjEzMTkwNjExMTExMSxwYXJpczoyLjMzNzIyOTE2NjY2Nyxib2dvdGE6LTc0LjA4MDkxNjY2NjY2NyxtYWRyaWQ6LTMuNjg3OTM4ODg4ODg5LHJvbWU6MTIuNDUyMzMzMzMzMzMzLGJlcm46Ny40Mzk1ODMzMzMzMzMsamFrYXJ0YToxMDYuODA3NzE5NDQ0NDQ0LGZlcnJvOi0xNy42NjY2NjY2NjY2NjcsYnJ1c3NlbHM6NC4zNjc5NzUsc3RvY2tob2xtOjE4LjA1ODI3Nzc3Nzc3OCxhdGhlbnM6MjMuNzE2MzM3NSxvc2xvOjEwLjcyMjkxNjY2NjY2N307XG5Qcm9qNGpzLkVsbGlwc29pZD17TUVSSVQ6e2E6NjM3ODEzNyxyZjoyOTguMjU3LGVsbGlwc2VOYW1lOlwiTUVSSVQgMTk4M1wifSxTR1M4NTp7YTo2Mzc4MTM2LHJmOjI5OC4yNTcsZWxsaXBzZU5hbWU6XCJTb3ZpZXQgR2VvZGV0aWMgU3lzdGVtIDg1XCJ9LEdSUzgwOnthOjYzNzgxMzcscmY6Mjk4LjI1NzIyMjEwMSxlbGxpcHNlTmFtZTpcIkdSUyAxOTgwKElVR0csIDE5ODApXCJ9LElBVTc2OnthOjYzNzgxNDAscmY6Mjk4LjI1NyxlbGxpcHNlTmFtZTpcIklBVSAxOTc2XCJ9LGFpcnk6e2E6NjM3NzU2My4zOTYsYjo2MzU2MjU2LjkxLGVsbGlwc2VOYW1lOlwiQWlyeSAxODMwXCJ9LFwiQVBMNC5cIjp7YTo2Mzc4MTM3LHJmOjI5OC4yNSxlbGxpcHNlTmFtZTpcIkFwcGwuIFBoeXNpY3MuIDE5NjVcIn0sTldMOUQ6e2E6NjM3ODE0NSxyZjoyOTguMjUsZWxsaXBzZU5hbWU6XCJOYXZhbCBXZWFwb25zIExhYi4sIDE5NjVcIn0sbW9kX2Fpcnk6e2E6NjM3NzM0MC4xODksYjo2MzU2MDM0LjQ0NixlbGxpcHNlTmFtZTpcIk1vZGlmaWVkIEFpcnlcIn0sXG5hbmRyYWU6e2E6NjM3NzEwNC40MyxyZjozMDAsZWxsaXBzZU5hbWU6XCJBbmRyYWUgMTg3NiAoRGVuLiwgSWNsbmQuKVwifSxhdXN0X1NBOnthOjYzNzgxNjAscmY6Mjk4LjI1LGVsbGlwc2VOYW1lOlwiQXVzdHJhbGlhbiBOYXRsICYgUy4gQW1lci4gMTk2OVwifSxHUlM2Nzp7YTo2Mzc4MTYwLHJmOjI5OC4yNDcxNjc0MjcsZWxsaXBzZU5hbWU6XCJHUlMgNjcoSVVHRyAxOTY3KVwifSxiZXNzZWw6e2E6NjM3NzM5Ny4xNTUscmY6Mjk5LjE1MjgxMjgsZWxsaXBzZU5hbWU6XCJCZXNzZWwgMTg0MVwifSxiZXNzX25hbTp7YTo2Mzc3NDgzLjg2NSxyZjoyOTkuMTUyODEyOCxlbGxpcHNlTmFtZTpcIkJlc3NlbCAxODQxIChOYW1pYmlhKVwifSxjbHJrNjY6e2E6NjM3ODIwNi40LGI6NjM1NjU4My44LGVsbGlwc2VOYW1lOlwiQ2xhcmtlIDE4NjZcIn0sY2xyazgwOnthOjYzNzgyNDkuMTQ1LHJmOjI5My40NjYzLGVsbGlwc2VOYW1lOlwiQ2xhcmtlIDE4ODAgbW9kLlwifSxDUE06e2E6NjM3NTczOC43LHJmOjMzNC4yOSxcbmVsbGlwc2VOYW1lOlwiQ29tbS4gZGVzIFBvaWRzIGV0IE1lc3VyZXMgMTc5OVwifSxkZWxtYnI6e2E6NjM3NjQyOCxyZjozMTEuNSxlbGxpcHNlTmFtZTpcIkRlbGFtYnJlIDE4MTAgKEJlbGdpdW0pXCJ9LGVuZ2VsaXM6e2E6NjM3ODEzNi4wNSxyZjoyOTguMjU2NixlbGxpcHNlTmFtZTpcIkVuZ2VsaXMgMTk4NVwifSxldnJzdDMwOnthOjYzNzcyNzYuMzQ1LHJmOjMwMC44MDE3LGVsbGlwc2VOYW1lOlwiRXZlcmVzdCAxODMwXCJ9LGV2cnN0NDg6e2E6NjM3NzMwNC4wNjMscmY6MzAwLjgwMTcsZWxsaXBzZU5hbWU6XCJFdmVyZXN0IDE5NDhcIn0sZXZyc3Q1Njp7YTo2Mzc3MzAxLjI0MyxyZjozMDAuODAxNyxlbGxpcHNlTmFtZTpcIkV2ZXJlc3QgMTk1NlwifSxldnJzdDY5OnthOjYzNzcyOTUuNjY0LHJmOjMwMC44MDE3LGVsbGlwc2VOYW1lOlwiRXZlcmVzdCAxOTY5XCJ9LGV2cnN0U1M6e2E6NjM3NzI5OC41NTYscmY6MzAwLjgwMTcsZWxsaXBzZU5hbWU6XCJFdmVyZXN0IChTYWJhaCAmIFNhcmF3YWspXCJ9LFxuZnNjaHI2MDp7YTo2Mzc4MTY2LHJmOjI5OC4zLGVsbGlwc2VOYW1lOlwiRmlzY2hlciAoTWVyY3VyeSBEYXR1bSkgMTk2MFwifSxmc2NocjYwbTp7YTo2Mzc4MTU1LHJmOjI5OC4zLGVsbGlwc2VOYW1lOlwiRmlzY2hlciAxOTYwXCJ9LGZzY2hyNjg6e2E6NjM3ODE1MCxyZjoyOTguMyxlbGxpcHNlTmFtZTpcIkZpc2NoZXIgMTk2OFwifSxoZWxtZXJ0OnthOjYzNzgyMDAscmY6Mjk4LjMsZWxsaXBzZU5hbWU6XCJIZWxtZXJ0IDE5MDZcIn0saG91Z2g6e2E6NjM3ODI3MCxyZjoyOTcsZWxsaXBzZU5hbWU6XCJIb3VnaFwifSxpbnRsOnthOjYzNzgzODgscmY6Mjk3LGVsbGlwc2VOYW1lOlwiSW50ZXJuYXRpb25hbCAxOTA5IChIYXlmb3JkKVwifSxrYXVsYTp7YTo2Mzc4MTYzLHJmOjI5OC4yNCxlbGxpcHNlTmFtZTpcIkthdWxhIDE5NjFcIn0sbGVyY2g6e2E6NjM3ODEzOSxyZjoyOTguMjU3LGVsbGlwc2VOYW1lOlwiTGVyY2ggMTk3OVwifSxtcHJ0czp7YTo2Mzk3MzAwLHJmOjE5MSxlbGxpcHNlTmFtZTpcIk1hdXBlcnRpdXMgMTczOFwifSxcbm5ld19pbnRsOnthOjYzNzgxNTcuNSxiOjYzNTY3NzIuMixlbGxpcHNlTmFtZTpcIk5ldyBJbnRlcm5hdGlvbmFsIDE5NjdcIn0scGxlc3Npczp7YTo2Mzc2NTIzLHJmOjYzNTU4NjMsZWxsaXBzZU5hbWU6XCJQbGVzc2lzIDE4MTcgKEZyYW5jZSlcIn0sa3Jhc3M6e2E6NjM3ODI0NSxyZjoyOTguMyxlbGxpcHNlTmFtZTpcIktyYXNzb3Zza3ksIDE5NDJcIn0sU0Vhc2lhOnthOjYzNzgxNTUsYjo2MzU2NzczLjMyMDUsZWxsaXBzZU5hbWU6XCJTb3V0aGVhc3QgQXNpYVwifSx3YWxiZWNrOnthOjYzNzY4OTYsYjo2MzU1ODM0Ljg0NjcsZWxsaXBzZU5hbWU6XCJXYWxiZWNrXCJ9LFdHUzYwOnthOjYzNzgxNjUscmY6Mjk4LjMsZWxsaXBzZU5hbWU6XCJXR1MgNjBcIn0sV0dTNjY6e2E6NjM3ODE0NSxyZjoyOTguMjUsZWxsaXBzZU5hbWU6XCJXR1MgNjZcIn0sV0dTNzI6e2E6NjM3ODEzNSxyZjoyOTguMjYsZWxsaXBzZU5hbWU6XCJXR1MgNzJcIn0sV0dTODQ6e2E6NjM3ODEzNyxyZjoyOTguMjU3MjIzNTYzLGVsbGlwc2VOYW1lOlwiV0dTIDg0XCJ9LFxuc3BoZXJlOnthOjYzNzA5OTcsYjo2MzcwOTk3LGVsbGlwc2VOYW1lOlwiTm9ybWFsIFNwaGVyZSAocj02MzcwOTk3KVwifX07XG5Qcm9qNGpzLkRhdHVtPXtXR1M4NDp7dG93Z3M4NDpcIjAsMCwwXCIsZWxsaXBzZTpcIldHUzg0XCIsZGF0dW1OYW1lOlwiV0dTODRcIn0sR0dSUzg3Ont0b3dnczg0OlwiLTE5OS44Nyw3NC43OSwyNDYuNjJcIixlbGxpcHNlOlwiR1JTODBcIixkYXR1bU5hbWU6XCJHcmVla19HZW9kZXRpY19SZWZlcmVuY2VfU3lzdGVtXzE5ODdcIn0sTkFEODM6e3Rvd2dzODQ6XCIwLDAsMFwiLGVsbGlwc2U6XCJHUlM4MFwiLGRhdHVtTmFtZTpcIk5vcnRoX0FtZXJpY2FuX0RhdHVtXzE5ODNcIn0sTkFEMjc6e25hZGdyaWRzOlwiQGNvbnVzLEBhbGFza2EsQG50djJfMC5nc2IsQG50djFfY2FuLmRhdFwiLGVsbGlwc2U6XCJjbHJrNjZcIixkYXR1bU5hbWU6XCJOb3J0aF9BbWVyaWNhbl9EYXR1bV8xOTI3XCJ9LHBvdHNkYW06e3Rvd2dzODQ6XCI2MDYuMCwyMy4wLDQxMy4wXCIsZWxsaXBzZTpcImJlc3NlbFwiLGRhdHVtTmFtZTpcIlBvdHNkYW0gUmF1ZW5iZXJnIDE5NTAgREhETlwifSxjYXJ0aGFnZTp7dG93Z3M4NDpcIi0yNjMuMCw2LjAsNDMxLjBcIixcbmVsbGlwc2U6XCJjbGFyazgwXCIsZGF0dW1OYW1lOlwiQ2FydGhhZ2UgMTkzNCBUdW5pc2lhXCJ9LGhlcm1hbm5za29nZWw6e3Rvd2dzODQ6XCI2NTMuMCwtMjEyLjAsNDQ5LjBcIixlbGxpcHNlOlwiYmVzc2VsXCIsZGF0dW1OYW1lOlwiSGVybWFubnNrb2dlbFwifSxpcmU2NTp7dG93Z3M4NDpcIjQ4Mi41MzAsLTEzMC41OTYsNTY0LjU1NywtMS4wNDIsLTAuMjE0LC0wLjYzMSw4LjE1XCIsZWxsaXBzZTpcIm1vZF9haXJ5XCIsZGF0dW1OYW1lOlwiSXJlbGFuZCAxOTY1XCJ9LG56Z2Q0OTp7dG93Z3M4NDpcIjU5LjQ3LC01LjA0LDE4Ny40NCwwLjQ3LC0wLjEsMS4wMjQsLTQuNTk5M1wiLGVsbGlwc2U6XCJpbnRsXCIsZGF0dW1OYW1lOlwiTmV3IFplYWxhbmQgR2VvZGV0aWMgRGF0dW0gMTk0OVwifSxPU0dCMzY6e3Rvd2dzODQ6XCI0NDYuNDQ4LC0xMjUuMTU3LDU0Mi4wNjAsMC4xNTAyLDAuMjQ3MCwwLjg0MjEsLTIwLjQ4OTRcIixlbGxpcHNlOlwiYWlyeVwiLGRhdHVtTmFtZTpcIkFpcnkgMTgzMFwifX07XG5Qcm9qNGpzLldHUzg0PW5ldyBQcm9qNGpzLlByb2ooXCJXR1M4NFwiKTtQcm9qNGpzLkRhdHVtLk9TQjM2PVByb2o0anMuRGF0dW0uT1NHQjM2O1Byb2o0anMud2t0UHJvamVjdGlvbnM9e1wiTGFtYmVydCBUYW5nZW50aWFsIENvbmZvcm1hbCBDb25pYyBQcm9qZWN0aW9uXCI6XCJsY2NcIixNZXJjYXRvcjpcIm1lcmNcIixcIlBvcHVsYXIgVmlzdWFsaXNhdGlvbiBQc2V1ZG8gTWVyY2F0b3JcIjpcIm1lcmNcIixNZXJjYXRvcl8xU1A6XCJtZXJjXCIsVHJhbnN2ZXJzZV9NZXJjYXRvcjpcInRtZXJjXCIsXCJUcmFuc3ZlcnNlIE1lcmNhdG9yXCI6XCJ0bWVyY1wiLFwiTGFtYmVydCBBemltdXRoYWwgRXF1YWwgQXJlYVwiOlwibGFlYVwiLFwiVW5pdmVyc2FsIFRyYW5zdmVyc2UgTWVyY2F0b3IgU3lzdGVtXCI6XCJ1dG1cIn07XG5Qcm9qNGpzLlByb2ouYWVhPXtpbml0OmZ1bmN0aW9uKCl7TWF0aC5hYnModGhpcy5sYXQxK3RoaXMubGF0Mik8UHJvajRqcy5jb21tb24uRVBTTE4/UHJvajRqcy5yZXBvcnRFcnJvcihcImFlYUluaXRFcXVhbExhdGl0dWRlc1wiKToodGhpcy50ZW1wPXRoaXMuYi90aGlzLmEsdGhpcy5lcz0xLU1hdGgucG93KHRoaXMudGVtcCwyKSx0aGlzLmUzPU1hdGguc3FydCh0aGlzLmVzKSx0aGlzLnNpbl9wbz1NYXRoLnNpbih0aGlzLmxhdDEpLHRoaXMuY29zX3BvPU1hdGguY29zKHRoaXMubGF0MSksdGhpcy5jb249dGhpcy50MT10aGlzLnNpbl9wbyx0aGlzLm1zMT1Qcm9qNGpzLmNvbW1vbi5tc2Zueih0aGlzLmUzLHRoaXMuc2luX3BvLHRoaXMuY29zX3BvKSx0aGlzLnFzMT1Qcm9qNGpzLmNvbW1vbi5xc2Zueih0aGlzLmUzLHRoaXMuc2luX3BvLHRoaXMuY29zX3BvKSx0aGlzLnNpbl9wbz1NYXRoLnNpbih0aGlzLmxhdDIpLHRoaXMuY29zX3BvPU1hdGguY29zKHRoaXMubGF0MiksdGhpcy50Mj1cbnRoaXMuc2luX3BvLHRoaXMubXMyPVByb2o0anMuY29tbW9uLm1zZm56KHRoaXMuZTMsdGhpcy5zaW5fcG8sdGhpcy5jb3NfcG8pLHRoaXMucXMyPVByb2o0anMuY29tbW9uLnFzZm56KHRoaXMuZTMsdGhpcy5zaW5fcG8sdGhpcy5jb3NfcG8pLHRoaXMuc2luX3BvPU1hdGguc2luKHRoaXMubGF0MCksdGhpcy5jb3NfcG89TWF0aC5jb3ModGhpcy5sYXQwKSx0aGlzLnQzPXRoaXMuc2luX3BvLHRoaXMucXMwPVByb2o0anMuY29tbW9uLnFzZm56KHRoaXMuZTMsdGhpcy5zaW5fcG8sdGhpcy5jb3NfcG8pLHRoaXMubnMwPU1hdGguYWJzKHRoaXMubGF0MS10aGlzLmxhdDIpPlByb2o0anMuY29tbW9uLkVQU0xOPyh0aGlzLm1zMSp0aGlzLm1zMS10aGlzLm1zMip0aGlzLm1zMikvKHRoaXMucXMyLXRoaXMucXMxKTp0aGlzLmNvbix0aGlzLmM9dGhpcy5tczEqdGhpcy5tczErdGhpcy5uczAqdGhpcy5xczEsdGhpcy5yaD10aGlzLmEqTWF0aC5zcXJ0KHRoaXMuYy10aGlzLm5zMCp0aGlzLnFzMCkvXG50aGlzLm5zMCl9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGM9YS54LGI9YS55O3RoaXMuc2luX3BoaT1NYXRoLnNpbihiKTt0aGlzLmNvc19waGk9TWF0aC5jb3MoYik7dmFyIGI9UHJvajRqcy5jb21tb24ucXNmbnoodGhpcy5lMyx0aGlzLnNpbl9waGksdGhpcy5jb3NfcGhpKSxiPXRoaXMuYSpNYXRoLnNxcnQodGhpcy5jLXRoaXMubnMwKmIpL3RoaXMubnMwLGQ9dGhpcy5uczAqUHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihjLXRoaXMubG9uZzApLGM9YipNYXRoLnNpbihkKSt0aGlzLngwLGI9dGhpcy5yaC1iKk1hdGguY29zKGQpK3RoaXMueTA7YS54PWM7YS55PWI7cmV0dXJuIGF9LGludmVyc2U6ZnVuY3Rpb24oYSl7dmFyIGMsYixkO2EueC09dGhpcy54MDthLnk9dGhpcy5yaC1hLnkrdGhpcy55MDswPD10aGlzLm5zMD8oYz1NYXRoLnNxcnQoYS54KmEueCthLnkqYS55KSxiPTEpOihjPS1NYXRoLnNxcnQoYS54KmEueCthLnkqYS55KSxiPS0xKTtkPTA7MCE9YyYmKGQ9TWF0aC5hdGFuMihiKlxuYS54LGIqYS55KSk7Yj1jKnRoaXMubnMwL3RoaXMuYTtjPSh0aGlzLmMtYipiKS90aGlzLm5zMDsxLjBFLTEwPD10aGlzLmUzPyhiPTEtMC41KigxLXRoaXMuZXMpKk1hdGgubG9nKCgxLXRoaXMuZTMpLygxK3RoaXMuZTMpKS90aGlzLmUzLGI9MS4wRS0xMDxNYXRoLmFicyhNYXRoLmFicyhiKS1NYXRoLmFicyhjKSk/dGhpcy5waGkxeih0aGlzLmUzLGMpOjA8PWM/MC41KlByb2o0anMuY29tbW9uLlBJOi0wLjUqUHJvajRqcy5jb21tb24uUEkpOmI9dGhpcy5waGkxeih0aGlzLmUzLGMpO2Q9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihkL3RoaXMubnMwK3RoaXMubG9uZzApO2EueD1kO2EueT1iO3JldHVybiBhfSxwaGkxejpmdW5jdGlvbihhLGMpe3ZhciBiLGQsZSxmLGc9UHJvajRqcy5jb21tb24uYXNpbnooMC41KmMpO2lmKGE8UHJvajRqcy5jb21tb24uRVBTTE4pcmV0dXJuIGc7Zm9yKHZhciBpPWEqYSxoPTE7MjU+PWg7aCsrKWlmKGI9TWF0aC5zaW4oZyksZD1NYXRoLmNvcyhnKSxcbmU9YSpiLGY9MS1lKmUsYj0wLjUqZipmL2QqKGMvKDEtaSktYi9mKzAuNS9hKk1hdGgubG9nKCgxLWUpLygxK2UpKSksZys9YiwxLjBFLTc+PU1hdGguYWJzKGIpKXJldHVybiBnO1Byb2o0anMucmVwb3J0RXJyb3IoXCJhZWE6cGhpMXo6Q29udmVyZ2VuY2UgZXJyb3JcIik7cmV0dXJuIG51bGx9fTtcblByb2o0anMuUHJvai5zdGVyZWE9e2RlcGVuZHNPbjpcImdhdXNzXCIsaW5pdDpmdW5jdGlvbigpe1Byb2o0anMuUHJvai5nYXVzcy5pbml0LmFwcGx5KHRoaXMpO3RoaXMucmM/KHRoaXMuc2luYzA9TWF0aC5zaW4odGhpcy5waGljMCksdGhpcy5jb3NjMD1NYXRoLmNvcyh0aGlzLnBoaWMwKSx0aGlzLlIyPTIqdGhpcy5yYyx0aGlzLnRpdGxlfHwodGhpcy50aXRsZT1cIk9ibGlxdWUgU3RlcmVvZ3JhcGhpYyBBbHRlcm5hdGl2ZVwiKSk6UHJvajRqcy5yZXBvcnRFcnJvcihcInN0ZXJlYTppbml0OkVfRVJST1JfMFwiKX0sZm9yd2FyZDpmdW5jdGlvbihhKXt2YXIgYyxiLGQsZTthLng9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihhLngtdGhpcy5sb25nMCk7UHJvajRqcy5Qcm9qLmdhdXNzLmZvcndhcmQuYXBwbHkodGhpcyxbYV0pO2M9TWF0aC5zaW4oYS55KTtiPU1hdGguY29zKGEueSk7ZD1NYXRoLmNvcyhhLngpO2U9dGhpcy5rMCp0aGlzLlIyLygxK3RoaXMuc2luYzAqYyt0aGlzLmNvc2MwKlxuYipkKTthLng9ZSpiKk1hdGguc2luKGEueCk7YS55PWUqKHRoaXMuY29zYzAqYy10aGlzLnNpbmMwKmIqZCk7YS54PXRoaXMuYSphLngrdGhpcy54MDthLnk9dGhpcy5hKmEueSt0aGlzLnkwO3JldHVybiBhfSxpbnZlcnNlOmZ1bmN0aW9uKGEpe3ZhciBjLGIsZCxlO2EueD0oYS54LXRoaXMueDApL3RoaXMuYTthLnk9KGEueS10aGlzLnkwKS90aGlzLmE7YS54Lz10aGlzLmswO2EueS89dGhpcy5rMDsoZT1NYXRoLnNxcnQoYS54KmEueCthLnkqYS55KSk/KGQ9MipNYXRoLmF0YW4yKGUsdGhpcy5SMiksYz1NYXRoLnNpbihkKSxiPU1hdGguY29zKGQpLGQ9TWF0aC5hc2luKGIqdGhpcy5zaW5jMCthLnkqYyp0aGlzLmNvc2MwL2UpLGM9TWF0aC5hdGFuMihhLngqYyxlKnRoaXMuY29zYzAqYi1hLnkqdGhpcy5zaW5jMCpjKSk6KGQ9dGhpcy5waGljMCxjPTApO2EueD1jO2EueT1kO1Byb2o0anMuUHJvai5nYXVzcy5pbnZlcnNlLmFwcGx5KHRoaXMsW2FdKTthLng9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihhLngrXG50aGlzLmxvbmcwKTtyZXR1cm4gYX19O2Z1bmN0aW9uIHBoaTR6KGEsYyxiLGQsZSxmLGcsaSxoKXt2YXIgaixrLGwsbSxuLG8saD1mO2ZvcihvPTE7MTU+PW87bysrKWlmKGo9TWF0aC5zaW4oaCksbD1NYXRoLnRhbihoKSxpPWwqTWF0aC5zcXJ0KDEtYSpqKmopLGs9TWF0aC5zaW4oMipoKSxtPWMqaC1iKmsrZCpNYXRoLnNpbig0KmgpLWUqTWF0aC5zaW4oNipoKSxuPWMtMipiKk1hdGguY29zKDIqaCkrNCpkKk1hdGguY29zKDQqaCktNiplKk1hdGguY29zKDYqaCksaj0yKm0raSoobSptK2cpLTIqZiooaSptKzEpLGw9YSprKihtKm0rZy0yKmYqbSkvKDIqaSksaT0yKihmLW0pKihpKm4tMi9rKS0yKm4sai89bCtpLGgrPWosMS4wRS0xMD49TWF0aC5hYnMoaikpcmV0dXJuIGg7UHJvajRqcy5yZXBvcnRFcnJvcihcInBoaTR6OiBObyBjb252ZXJnZW5jZVwiKTtyZXR1cm4gbnVsbH1cbmZ1bmN0aW9uIGU0Zm4oYSl7dmFyIGM7Yz0xK2E7YT0xLWE7cmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhjLGMpKk1hdGgucG93KGEsYSkpfVxuUHJvajRqcy5Qcm9qLnBvbHk9e2luaXQ6ZnVuY3Rpb24oKXswPT10aGlzLmxhdDAmJih0aGlzLmxhdDA9OTApO3RoaXMudGVtcD10aGlzLmIvdGhpcy5hO3RoaXMuZXM9MS1NYXRoLnBvdyh0aGlzLnRlbXAsMik7dGhpcy5lPU1hdGguc3FydCh0aGlzLmVzKTt0aGlzLmUwPVByb2o0anMuY29tbW9uLmUwZm4odGhpcy5lcyk7dGhpcy5lMT1Qcm9qNGpzLmNvbW1vbi5lMWZuKHRoaXMuZXMpO3RoaXMuZTI9UHJvajRqcy5jb21tb24uZTJmbih0aGlzLmVzKTt0aGlzLmUzPVByb2o0anMuY29tbW9uLmUzZm4odGhpcy5lcyk7dGhpcy5tbDA9UHJvajRqcy5jb21tb24ubWxmbih0aGlzLmUwLHRoaXMuZTEsdGhpcy5lMix0aGlzLmUzLHRoaXMubGF0MCl9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGMsYixkLGUsZjtkPWEueTtiPVByb2o0anMuY29tbW9uLmFkanVzdF9sb24oYS54LXRoaXMubG9uZzApOzEuMEUtNz49TWF0aC5hYnMoZCk/KGY9dGhpcy54MCt0aGlzLmEqYixjPXRoaXMueTAtXG50aGlzLmEqdGhpcy5tbDApOihjPU1hdGguc2luKGQpLGI9TWF0aC5jb3MoZCksZD1Qcm9qNGpzLmNvbW1vbi5tbGZuKHRoaXMuZTAsdGhpcy5lMSx0aGlzLmUyLHRoaXMuZTMsZCksZT1Qcm9qNGpzLmNvbW1vbi5tc2Zueih0aGlzLmUsYyxiKSxiPWMsZj10aGlzLngwK3RoaXMuYSplKk1hdGguc2luKGIpL2MsYz10aGlzLnkwK3RoaXMuYSooZC10aGlzLm1sMCtlKigxLU1hdGguY29zKGIpKS9jKSk7YS54PWY7YS55PWM7cmV0dXJuIGF9LGludmVyc2U6ZnVuY3Rpb24oYSl7dmFyIGMsYjthLngtPXRoaXMueDA7YS55LT10aGlzLnkwO2M9dGhpcy5tbDArYS55L3RoaXMuYTtpZigxLjBFLTc+PU1hdGguYWJzKGMpKWM9YS54L3RoaXMuYSt0aGlzLmxvbmcwLGI9MDtlbHNle2M9YypjK2EueC90aGlzLmEqKGEueC90aGlzLmEpO2M9cGhpNHoodGhpcy5lcyx0aGlzLmUwLHRoaXMuZTEsdGhpcy5lMix0aGlzLmUzLHRoaXMuYWwsYyx2b2lkIDAsYik7aWYoMSE9YylyZXR1cm4gYztjPVByb2o0anMuY29tbW9uLmFkanVzdF9sb24oUHJvajRqcy5jb21tb24uYXNpbnooTmFOKlxuYS54L3RoaXMuYSkvTWF0aC5zaW4oYikrdGhpcy5sb25nMCl9YS54PWM7YS55PWI7cmV0dXJuIGF9fTtcblByb2o0anMuUHJvai5lcXVpPXtpbml0OmZ1bmN0aW9uKCl7dGhpcy54MHx8KHRoaXMueDA9MCk7dGhpcy55MHx8KHRoaXMueTA9MCk7dGhpcy5sYXQwfHwodGhpcy5sYXQwPTApO3RoaXMubG9uZzB8fCh0aGlzLmxvbmcwPTApfSxmb3J3YXJkOmZ1bmN0aW9uKGEpe3ZhciBjPWEueSxiPXRoaXMueDArdGhpcy5hKlByb2o0anMuY29tbW9uLmFkanVzdF9sb24oYS54LXRoaXMubG9uZzApKk1hdGguY29zKHRoaXMubGF0MCksYz10aGlzLnkwK3RoaXMuYSpjO3RoaXMudDE9Yjt0aGlzLnQyPU1hdGguY29zKHRoaXMubGF0MCk7YS54PWI7YS55PWM7cmV0dXJuIGF9LGludmVyc2U6ZnVuY3Rpb24oYSl7YS54LT10aGlzLngwO2EueS09dGhpcy55MDt2YXIgYz1hLnkvdGhpcy5hO01hdGguYWJzKGMpPlByb2o0anMuY29tbW9uLkhBTEZfUEkmJlByb2o0anMucmVwb3J0RXJyb3IoXCJlcXVpOkludjpEYXRhRXJyb3JcIik7dmFyIGI9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbih0aGlzLmxvbmcwK1xuYS54Lyh0aGlzLmEqTWF0aC5jb3ModGhpcy5sYXQwKSkpO2EueD1iO2EueT1jfX07XG5Qcm9qNGpzLlByb2oubWVyYz17aW5pdDpmdW5jdGlvbigpe3RoaXMubGF0X3RzJiYodGhpcy5rMD10aGlzLnNwaGVyZT9NYXRoLmNvcyh0aGlzLmxhdF90cyk6UHJvajRqcy5jb21tb24ubXNmbnoodGhpcy5lcyxNYXRoLnNpbih0aGlzLmxhdF90cyksTWF0aC5jb3ModGhpcy5sYXRfdHMpKSl9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGM9YS54LGI9YS55O2lmKDkwPGIqUHJvajRqcy5jb21tb24uUjJEJiYtOTA+YipQcm9qNGpzLmNvbW1vbi5SMkQmJjE4MDxjKlByb2o0anMuY29tbW9uLlIyRCYmLTE4MD5jKlByb2o0anMuY29tbW9uLlIyRClyZXR1cm4gUHJvajRqcy5yZXBvcnRFcnJvcihcIm1lcmM6Zm9yd2FyZDogbGxJbnB1dE91dE9mUmFuZ2U6IFwiK2MrXCIgOiBcIitiKSxudWxsO2lmKE1hdGguYWJzKE1hdGguYWJzKGIpLVByb2o0anMuY29tbW9uLkhBTEZfUEkpPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTilyZXR1cm4gUHJvajRqcy5yZXBvcnRFcnJvcihcIm1lcmM6Zm9yd2FyZDogbGwybUF0UG9sZXNcIiksbnVsbDtcbmlmKHRoaXMuc3BoZXJlKWM9dGhpcy54MCt0aGlzLmEqdGhpcy5rMCpQcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGMtdGhpcy5sb25nMCksYj10aGlzLnkwK3RoaXMuYSp0aGlzLmswKk1hdGgubG9nKE1hdGgudGFuKFByb2o0anMuY29tbW9uLkZPUlRQSSswLjUqYikpO2Vsc2UgdmFyIGQ9TWF0aC5zaW4oYiksYj1Qcm9qNGpzLmNvbW1vbi50c2Zueih0aGlzLmUsYixkKSxjPXRoaXMueDArdGhpcy5hKnRoaXMuazAqUHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihjLXRoaXMubG9uZzApLGI9dGhpcy55MC10aGlzLmEqdGhpcy5rMCpNYXRoLmxvZyhiKTthLng9YzthLnk9YjtyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXt2YXIgYz1hLngtdGhpcy54MCxiPWEueS10aGlzLnkwO2lmKHRoaXMuc3BoZXJlKWI9UHJvajRqcy5jb21tb24uSEFMRl9QSS0yKk1hdGguYXRhbihNYXRoLmV4cCgtYi90aGlzLmEqdGhpcy5rMCkpO2Vsc2UgaWYoYj1NYXRoLmV4cCgtYi8odGhpcy5hKnRoaXMuazApKSxcbmI9UHJvajRqcy5jb21tb24ucGhpMnoodGhpcy5lLGIpLC05OTk5PT1iKXJldHVybiBQcm9qNGpzLnJlcG9ydEVycm9yKFwibWVyYzppbnZlcnNlOiBsYXQgPSAtOTk5OVwiKSxudWxsO2M9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbih0aGlzLmxvbmcwK2MvKHRoaXMuYSp0aGlzLmswKSk7YS54PWM7YS55PWI7cmV0dXJuIGF9fTtQcm9qNGpzLlByb2oudXRtPXtkZXBlbmRzT246XCJ0bWVyY1wiLGluaXQ6ZnVuY3Rpb24oKXt0aGlzLnpvbmU/KHRoaXMubGF0MD0wLHRoaXMubG9uZzA9KDYqTWF0aC5hYnModGhpcy56b25lKS0xODMpKlByb2o0anMuY29tbW9uLkQyUix0aGlzLngwPTVFNSx0aGlzLnkwPXRoaXMudXRtU291dGg/MUU3OjAsdGhpcy5rMD0wLjk5OTYsUHJvajRqcy5Qcm9qLnRtZXJjLmluaXQuYXBwbHkodGhpcyksdGhpcy5mb3J3YXJkPVByb2o0anMuUHJvai50bWVyYy5mb3J3YXJkLHRoaXMuaW52ZXJzZT1Qcm9qNGpzLlByb2oudG1lcmMuaW52ZXJzZSk6UHJvajRqcy5yZXBvcnRFcnJvcihcInV0bTppbml0OiB6b25lIG11c3QgYmUgc3BlY2lmaWVkIGZvciBVVE1cIil9fTtcblByb2o0anMuUHJvai5lcWRjPXtpbml0OmZ1bmN0aW9uKCl7dGhpcy5tb2RlfHwodGhpcy5tb2RlPTApO3RoaXMudGVtcD10aGlzLmIvdGhpcy5hO3RoaXMuZXM9MS1NYXRoLnBvdyh0aGlzLnRlbXAsMik7dGhpcy5lPU1hdGguc3FydCh0aGlzLmVzKTt0aGlzLmUwPVByb2o0anMuY29tbW9uLmUwZm4odGhpcy5lcyk7dGhpcy5lMT1Qcm9qNGpzLmNvbW1vbi5lMWZuKHRoaXMuZXMpO3RoaXMuZTI9UHJvajRqcy5jb21tb24uZTJmbih0aGlzLmVzKTt0aGlzLmUzPVByb2o0anMuY29tbW9uLmUzZm4odGhpcy5lcyk7dGhpcy5zaW5waGk9TWF0aC5zaW4odGhpcy5sYXQxKTt0aGlzLmNvc3BoaT1NYXRoLmNvcyh0aGlzLmxhdDEpO3RoaXMubXMxPVByb2o0anMuY29tbW9uLm1zZm56KHRoaXMuZSx0aGlzLnNpbnBoaSx0aGlzLmNvc3BoaSk7dGhpcy5tbDE9UHJvajRqcy5jb21tb24ubWxmbih0aGlzLmUwLHRoaXMuZTEsdGhpcy5lMix0aGlzLmUzLHRoaXMubGF0MSk7MCE9dGhpcy5tb2RlP1xuKE1hdGguYWJzKHRoaXMubGF0MSt0aGlzLmxhdDIpPFByb2o0anMuY29tbW9uLkVQU0xOJiZQcm9qNGpzLnJlcG9ydEVycm9yKFwiZXFkYzpJbml0OkVxdWFsTGF0aXR1ZGVzXCIpLHRoaXMuc2lucGhpPU1hdGguc2luKHRoaXMubGF0MiksdGhpcy5jb3NwaGk9TWF0aC5jb3ModGhpcy5sYXQyKSx0aGlzLm1zMj1Qcm9qNGpzLmNvbW1vbi5tc2Zueih0aGlzLmUsdGhpcy5zaW5waGksdGhpcy5jb3NwaGkpLHRoaXMubWwyPVByb2o0anMuY29tbW9uLm1sZm4odGhpcy5lMCx0aGlzLmUxLHRoaXMuZTIsdGhpcy5lMyx0aGlzLmxhdDIpLHRoaXMubnM9TWF0aC5hYnModGhpcy5sYXQxLXRoaXMubGF0Mik+PVByb2o0anMuY29tbW9uLkVQU0xOPyh0aGlzLm1zMS10aGlzLm1zMikvKHRoaXMubWwyLXRoaXMubWwxKTp0aGlzLnNpbnBoaSk6dGhpcy5ucz10aGlzLnNpbnBoaTt0aGlzLmc9dGhpcy5tbDErdGhpcy5tczEvdGhpcy5uczt0aGlzLm1sMD1Qcm9qNGpzLmNvbW1vbi5tbGZuKHRoaXMuZTAsXG50aGlzLmUxLHRoaXMuZTIsdGhpcy5lMyx0aGlzLmxhdDApO3RoaXMucmg9dGhpcy5hKih0aGlzLmctdGhpcy5tbDApfSxmb3J3YXJkOmZ1bmN0aW9uKGEpe3ZhciBjPWEueCxiPXRoaXMuYSoodGhpcy5nLVByb2o0anMuY29tbW9uLm1sZm4odGhpcy5lMCx0aGlzLmUxLHRoaXMuZTIsdGhpcy5lMyxhLnkpKSxkPXRoaXMubnMqUHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihjLXRoaXMubG9uZzApLGM9dGhpcy54MCtiKk1hdGguc2luKGQpLGI9dGhpcy55MCt0aGlzLnJoLWIqTWF0aC5jb3MoZCk7YS54PWM7YS55PWI7cmV0dXJuIGF9LGludmVyc2U6ZnVuY3Rpb24oYSl7YS54LT10aGlzLngwO2EueT10aGlzLnJoLWEueSt0aGlzLnkwO3ZhciBjLGI7MDw9dGhpcy5ucz8oYj1NYXRoLnNxcnQoYS54KmEueCthLnkqYS55KSxjPTEpOihiPS1NYXRoLnNxcnQoYS54KmEueCthLnkqYS55KSxjPS0xKTt2YXIgZD0wOzAhPWImJihkPU1hdGguYXRhbjIoYyphLngsYyphLnkpKTtjPXRoaXMucGhpM3oodGhpcy5nLVxuYi90aGlzLmEsdGhpcy5lMCx0aGlzLmUxLHRoaXMuZTIsdGhpcy5lMyk7ZD1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKHRoaXMubG9uZzArZC90aGlzLm5zKTthLng9ZDthLnk9YztyZXR1cm4gYX0scGhpM3o6ZnVuY3Rpb24oYSxjLGIsZCxlKXt2YXIgZixnO2Y9YTtmb3IodmFyIGk9MDsxNT5pO2krKylpZihnPShhK2IqTWF0aC5zaW4oMipmKS1kKk1hdGguc2luKDQqZikrZSpNYXRoLnNpbig2KmYpKS9jLWYsZis9ZywxLjBFLTEwPj1NYXRoLmFicyhnKSlyZXR1cm4gZjtQcm9qNGpzLnJlcG9ydEVycm9yKFwiUEhJM1otQ09OVjpMYXRpdHVkZSBmYWlsZWQgdG8gY29udmVyZ2UgYWZ0ZXIgMTUgaXRlcmF0aW9uc1wiKTtyZXR1cm4gbnVsbH19O1xuUHJvajRqcy5Qcm9qLnRtZXJjPXtpbml0OmZ1bmN0aW9uKCl7dGhpcy5lMD1Qcm9qNGpzLmNvbW1vbi5lMGZuKHRoaXMuZXMpO3RoaXMuZTE9UHJvajRqcy5jb21tb24uZTFmbih0aGlzLmVzKTt0aGlzLmUyPVByb2o0anMuY29tbW9uLmUyZm4odGhpcy5lcyk7dGhpcy5lMz1Qcm9qNGpzLmNvbW1vbi5lM2ZuKHRoaXMuZXMpO3RoaXMubWwwPXRoaXMuYSpQcm9qNGpzLmNvbW1vbi5tbGZuKHRoaXMuZTAsdGhpcy5lMSx0aGlzLmUyLHRoaXMuZTMsdGhpcy5sYXQwKX0sZm9yd2FyZDpmdW5jdGlvbihhKXt2YXIgYz1hLnksYj1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGEueC10aGlzLmxvbmcwKSxkLGU7ZD1NYXRoLnNpbihjKTt2YXIgZj1NYXRoLmNvcyhjKTtpZih0aGlzLnNwaGVyZSl7dmFyIGc9ZipNYXRoLnNpbihiKTtpZigxLjBFLTEwPk1hdGguYWJzKE1hdGguYWJzKGcpLTEpKXJldHVybiBQcm9qNGpzLnJlcG9ydEVycm9yKFwidG1lcmM6Zm9yd2FyZDogUG9pbnQgcHJvamVjdHMgaW50byBpbmZpbml0eVwiKSxcbjkzO2U9MC41KnRoaXMuYSp0aGlzLmswKk1hdGgubG9nKCgxK2cpLygxLWcpKTtkPU1hdGguYWNvcyhmKk1hdGguY29zKGIpL01hdGguc3FydCgxLWcqZykpOzA+YyYmKGQ9LWQpO2M9dGhpcy5hKnRoaXMuazAqKGQtdGhpcy5sYXQwKX1lbHNle2U9ZipiO3ZhciBiPU1hdGgucG93KGUsMiksZj10aGlzLmVwMipNYXRoLnBvdyhmLDIpLGc9TWF0aC50YW4oYyksaT1NYXRoLnBvdyhnLDIpO2Q9MS10aGlzLmVzKk1hdGgucG93KGQsMik7ZD10aGlzLmEvTWF0aC5zcXJ0KGQpO2M9dGhpcy5hKlByb2o0anMuY29tbW9uLm1sZm4odGhpcy5lMCx0aGlzLmUxLHRoaXMuZTIsdGhpcy5lMyxjKTtlPXRoaXMuazAqZCplKigxK2IvNiooMS1pK2YrYi8yMCooNS0xOCppK01hdGgucG93KGksMikrNzIqZi01OCp0aGlzLmVwMikpKSt0aGlzLngwO2M9dGhpcy5rMCooYy10aGlzLm1sMCtkKmcqYiooMC41K2IvMjQqKDUtaSs5KmYrNCpNYXRoLnBvdyhmLDIpK2IvMzAqKDYxLTU4KmkrTWF0aC5wb3coaSxcbjIpKzYwMCpmLTMzMCp0aGlzLmVwMikpKSkrdGhpcy55MH1hLng9ZTthLnk9YztyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXt2YXIgYyxiLGQsZTtpZih0aGlzLnNwaGVyZSl7Yj1NYXRoLmV4cChhLngvKHRoaXMuYSp0aGlzLmswKSk7dmFyIGY9MC41KihiLTEvYik7ZD10aGlzLmxhdDArYS55Lyh0aGlzLmEqdGhpcy5rMCk7ZT1NYXRoLmNvcyhkKTtjPU1hdGguc3FydCgoMS1lKmUpLygxK2YqZikpO2I9UHJvajRqcy5jb21tb24uYXNpbnooYyk7MD5kJiYoYj0tYik7Yz0wPT1mJiYwPT1lP3RoaXMubG9uZzA6UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihNYXRoLmF0YW4yKGYsZSkrdGhpcy5sb25nMCl9ZWxzZXt2YXIgZj1hLngtdGhpcy54MCxnPWEueS10aGlzLnkwO2I9Yz0odGhpcy5tbDArZy90aGlzLmswKS90aGlzLmE7Zm9yKGU9MDs7ZSsrKXtkPShjK3RoaXMuZTEqTWF0aC5zaW4oMipiKS10aGlzLmUyKk1hdGguc2luKDQqYikrdGhpcy5lMypNYXRoLnNpbig2KmIpKS9cbnRoaXMuZTAtYjtiKz1kO2lmKE1hdGguYWJzKGQpPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTilicmVhaztpZig2PD1lKXJldHVybiBQcm9qNGpzLnJlcG9ydEVycm9yKFwidG1lcmM6aW52ZXJzZTogTGF0aXR1ZGUgZmFpbGVkIHRvIGNvbnZlcmdlXCIpLDk1fWlmKE1hdGguYWJzKGIpPFByb2o0anMuY29tbW9uLkhBTEZfUEkpe2M9TWF0aC5zaW4oYik7ZD1NYXRoLmNvcyhiKTt2YXIgaT1NYXRoLnRhbihiKTtlPXRoaXMuZXAyKk1hdGgucG93KGQsMik7dmFyIGc9TWF0aC5wb3coZSwyKSxoPU1hdGgucG93KGksMiksaj1NYXRoLnBvdyhoLDIpO2M9MS10aGlzLmVzKk1hdGgucG93KGMsMik7dmFyIGs9dGhpcy5hL01hdGguc3FydChjKTtjPWsqKDEtdGhpcy5lcykvYzt2YXIgZj1mLyhrKnRoaXMuazApLGw9TWF0aC5wb3coZiwyKTtiLT1rKmkqbC9jKigwLjUtbC8yNCooNSszKmgrMTAqZS00KmctOSp0aGlzLmVwMi1sLzMwKig2MSs5MCpoKzI5OCplKzQ1KmotMjUyKnRoaXMuZXAyLTMqZykpKTtcbmM9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbih0aGlzLmxvbmcwK2YqKDEtbC82KigxKzIqaCtlLWwvMjAqKDUtMiplKzI4KmgtMypnKzgqdGhpcy5lcDIrMjQqaikpKS9kKX1lbHNlIGI9UHJvajRqcy5jb21tb24uSEFMRl9QSSpQcm9qNGpzLmNvbW1vbi5zaWduKGcpLGM9dGhpcy5sb25nMH1hLng9YzthLnk9YjtyZXR1cm4gYX19O1Byb2o0anMuZGVmcy5HT09HTEU9XCIrcHJvaj1tZXJjICthPTYzNzgxMzcgK2I9NjM3ODEzNyArbGF0X3RzPTAuMCArbG9uXzA9MC4wICt4XzA9MC4wICt5XzA9MCAraz0xLjAgK3VuaXRzPW0gK25hZGdyaWRzPUBudWxsICtub19kZWZzXCI7UHJvajRqcy5kZWZzW1wiRVBTRzo5MDA5MTNcIl09UHJvajRqcy5kZWZzLkdPT0dMRTtcblByb2o0anMuUHJvai5nc3RtZXJjPXtpbml0OmZ1bmN0aW9uKCl7dmFyIGE9dGhpcy5iL3RoaXMuYTt0aGlzLmU9TWF0aC5zcXJ0KDEtYSphKTt0aGlzLmxjPXRoaXMubG9uZzA7dGhpcy5ycz1NYXRoLnNxcnQoMSt0aGlzLmUqdGhpcy5lKk1hdGgucG93KE1hdGguY29zKHRoaXMubGF0MCksNCkvKDEtdGhpcy5lKnRoaXMuZSkpO3ZhciBhPU1hdGguc2luKHRoaXMubGF0MCksYz1NYXRoLmFzaW4oYS90aGlzLnJzKSxiPU1hdGguc2luKGMpO3RoaXMuY3A9UHJvajRqcy5jb21tb24ubGF0aXNvKDAsYyxiKS10aGlzLnJzKlByb2o0anMuY29tbW9uLmxhdGlzbyh0aGlzLmUsdGhpcy5sYXQwLGEpO3RoaXMubjI9dGhpcy5rMCp0aGlzLmEqTWF0aC5zcXJ0KDEtdGhpcy5lKnRoaXMuZSkvKDEtdGhpcy5lKnRoaXMuZSphKmEpO3RoaXMueHM9dGhpcy54MDt0aGlzLnlzPXRoaXMueTAtdGhpcy5uMipjO3RoaXMudGl0bGV8fCh0aGlzLnRpdGxlPVwiR2F1c3MgU2NocmVpYmVyIHRyYW5zdmVyc2UgbWVyY2F0b3JcIil9LFxuZm9yd2FyZDpmdW5jdGlvbihhKXt2YXIgYz1hLnksYj10aGlzLnJzKihhLngtdGhpcy5sYyksYz10aGlzLmNwK3RoaXMucnMqUHJvajRqcy5jb21tb24ubGF0aXNvKHRoaXMuZSxjLE1hdGguc2luKGMpKSxkPU1hdGguYXNpbihNYXRoLnNpbihiKS9Qcm9qNGpzLmNvbW1vbi5jb3NoKGMpKSxkPVByb2o0anMuY29tbW9uLmxhdGlzbygwLGQsTWF0aC5zaW4oZCkpO2EueD10aGlzLnhzK3RoaXMubjIqZDthLnk9dGhpcy55cyt0aGlzLm4yKk1hdGguYXRhbihQcm9qNGpzLmNvbW1vbi5zaW5oKGMpL01hdGguY29zKGIpKTtyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXt2YXIgYz1hLngsYj1hLnksZD1NYXRoLmF0YW4oUHJvajRqcy5jb21tb24uc2luaCgoYy10aGlzLnhzKS90aGlzLm4yKS9NYXRoLmNvcygoYi10aGlzLnlzKS90aGlzLm4yKSksYz1NYXRoLmFzaW4oTWF0aC5zaW4oKGItdGhpcy55cykvdGhpcy5uMikvUHJvajRqcy5jb21tb24uY29zaCgoYy10aGlzLnhzKS90aGlzLm4yKSksXG5jPVByb2o0anMuY29tbW9uLmxhdGlzbygwLGMsTWF0aC5zaW4oYykpO2EueD10aGlzLmxjK2QvdGhpcy5yczthLnk9UHJvajRqcy5jb21tb24uaW52bGF0aXNvKHRoaXMuZSwoYy10aGlzLmNwKS90aGlzLnJzKTtyZXR1cm4gYX19O1xuUHJvajRqcy5Qcm9qLm9ydGhvPXtpbml0OmZ1bmN0aW9uKCl7dGhpcy5zaW5fcDE0PU1hdGguc2luKHRoaXMubGF0MCk7dGhpcy5jb3NfcDE0PU1hdGguY29zKHRoaXMubGF0MCl9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGMsYixkLGUsZjtiPWEueTtkPVByb2o0anMuY29tbW9uLmFkanVzdF9sb24oYS54LXRoaXMubG9uZzApO2M9TWF0aC5zaW4oYik7Yj1NYXRoLmNvcyhiKTtlPU1hdGguY29zKGQpO2Y9dGhpcy5zaW5fcDE0KmMrdGhpcy5jb3NfcDE0KmIqZTtpZigwPGZ8fE1hdGguYWJzKGYpPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTil2YXIgZz0xKnRoaXMuYSpiKk1hdGguc2luKGQpLGk9dGhpcy55MCsxKnRoaXMuYSoodGhpcy5jb3NfcDE0KmMtdGhpcy5zaW5fcDE0KmIqZSk7ZWxzZSBQcm9qNGpzLnJlcG9ydEVycm9yKFwib3J0aG9Gd2RQb2ludEVycm9yXCIpO2EueD1nO2EueT1pO3JldHVybiBhfSxpbnZlcnNlOmZ1bmN0aW9uKGEpe3ZhciBjLGIsZCxlO2EueC09dGhpcy54MDtcbmEueS09dGhpcy55MDtjPU1hdGguc3FydChhLngqYS54K2EueSphLnkpO2M+dGhpcy5hKzEuMEUtNyYmUHJvajRqcy5yZXBvcnRFcnJvcihcIm9ydGhvSW52RGF0YUVycm9yXCIpO2I9UHJvajRqcy5jb21tb24uYXNpbnooYy90aGlzLmEpO2Q9TWF0aC5zaW4oYik7ZT1NYXRoLmNvcyhiKTtiPXRoaXMubG9uZzA7TWF0aC5hYnMoYyk7ZD1Qcm9qNGpzLmNvbW1vbi5hc2lueihlKnRoaXMuc2luX3AxNCthLnkqZCp0aGlzLmNvc19wMTQvYyk7Yz1NYXRoLmFicyh0aGlzLmxhdDApLVByb2o0anMuY29tbW9uLkhBTEZfUEk7TWF0aC5hYnMoYyk8PVByb2o0anMuY29tbW9uLkVQU0xOJiYoYj0wPD10aGlzLmxhdDA/UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbih0aGlzLmxvbmcwK01hdGguYXRhbjIoYS54LC1hLnkpKTpQcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKHRoaXMubG9uZzAtTWF0aC5hdGFuMigtYS54LGEueSkpKTtNYXRoLnNpbihkKTthLng9YjthLnk9ZDtyZXR1cm4gYX19O1xuUHJvajRqcy5Qcm9qLmtyb3Zhaz17aW5pdDpmdW5jdGlvbigpe3RoaXMuYT02Mzc3Mzk3LjE1NTt0aGlzLmVzPTAuMDA2Njc0MzcyMjMwNjE0O3RoaXMuZT1NYXRoLnNxcnQodGhpcy5lcyk7dGhpcy5sYXQwfHwodGhpcy5sYXQwPTAuODYzOTM3OTc5NzM3MTkzKTt0aGlzLmxvbmcwfHwodGhpcy5sb25nMD0wLjQzMzQyMzQzMDkxMTkyNTEpO3RoaXMuazB8fCh0aGlzLmswPTAuOTk5OSk7dGhpcy5zNDU9MC43ODUzOTgxNjMzOTc0NDg7dGhpcy5zOTA9Mip0aGlzLnM0NTt0aGlzLmZpMD10aGlzLmxhdDA7dGhpcy5lMj10aGlzLmVzO3RoaXMuZT1NYXRoLnNxcnQodGhpcy5lMik7dGhpcy5hbGZhPU1hdGguc3FydCgxK3RoaXMuZTIqTWF0aC5wb3coTWF0aC5jb3ModGhpcy5maTApLDQpLygxLXRoaXMuZTIpKTt0aGlzLnVxPTEuMDQyMTY4NTYzODA0NzQ7dGhpcy51MD1NYXRoLmFzaW4oTWF0aC5zaW4odGhpcy5maTApL3RoaXMuYWxmYSk7dGhpcy5nPU1hdGgucG93KCgxK3RoaXMuZSpNYXRoLnNpbih0aGlzLmZpMCkpL1xuKDEtdGhpcy5lKk1hdGguc2luKHRoaXMuZmkwKSksdGhpcy5hbGZhKnRoaXMuZS8yKTt0aGlzLms9TWF0aC50YW4odGhpcy51MC8yK3RoaXMuczQ1KS9NYXRoLnBvdyhNYXRoLnRhbih0aGlzLmZpMC8yK3RoaXMuczQ1KSx0aGlzLmFsZmEpKnRoaXMuZzt0aGlzLmsxPXRoaXMuazA7dGhpcy5uMD10aGlzLmEqTWF0aC5zcXJ0KDEtdGhpcy5lMikvKDEtdGhpcy5lMipNYXRoLnBvdyhNYXRoLnNpbih0aGlzLmZpMCksMikpO3RoaXMuczA9MS4zNzAwODM0NjI4MTU1NTt0aGlzLm49TWF0aC5zaW4odGhpcy5zMCk7dGhpcy5ybzA9dGhpcy5rMSp0aGlzLm4wL01hdGgudGFuKHRoaXMuczApO3RoaXMuYWQ9dGhpcy5zOTAtdGhpcy51cX0sZm9yd2FyZDpmdW5jdGlvbihhKXt2YXIgYyxiLGQ7Yj1hLnk7ZD1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGEueC10aGlzLmxvbmcwKTtjPU1hdGgucG93KCgxK3RoaXMuZSpNYXRoLnNpbihiKSkvKDEtdGhpcy5lKk1hdGguc2luKGIpKSx0aGlzLmFsZmEqXG50aGlzLmUvMik7Yz0yKihNYXRoLmF0YW4odGhpcy5rKk1hdGgucG93KE1hdGgudGFuKGIvMit0aGlzLnM0NSksdGhpcy5hbGZhKS9jKS10aGlzLnM0NSk7Yj0tZCp0aGlzLmFsZmE7ZD1NYXRoLmFzaW4oTWF0aC5jb3ModGhpcy5hZCkqTWF0aC5zaW4oYykrTWF0aC5zaW4odGhpcy5hZCkqTWF0aC5jb3MoYykqTWF0aC5jb3MoYikpO2M9dGhpcy5uKk1hdGguYXNpbihNYXRoLmNvcyhjKSpNYXRoLnNpbihiKS9NYXRoLmNvcyhkKSk7ZD10aGlzLnJvMCpNYXRoLnBvdyhNYXRoLnRhbih0aGlzLnMwLzIrdGhpcy5zNDUpLHRoaXMubikvTWF0aC5wb3coTWF0aC50YW4oZC8yK3RoaXMuczQ1KSx0aGlzLm4pO2EueT1kKk1hdGguY29zKGMpLzE7YS54PWQqTWF0aC5zaW4oYykvMTt0aGlzLmN6ZWNoJiYoYS55Kj0tMSxhLngqPS0xKTtyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXt2YXIgYyxiLGQ7Yz1hLng7YS54PWEueTthLnk9Yzt0aGlzLmN6ZWNoJiYoYS55Kj0tMSxhLngqPS0xKTtcbmM9TWF0aC5zcXJ0KGEueCphLngrYS55KmEueSk7Yj1NYXRoLmF0YW4yKGEueSxhLngpL01hdGguc2luKHRoaXMuczApO2Q9MiooTWF0aC5hdGFuKE1hdGgucG93KHRoaXMucm8wL2MsMS90aGlzLm4pKk1hdGgudGFuKHRoaXMuczAvMit0aGlzLnM0NSkpLXRoaXMuczQ1KTtjPU1hdGguYXNpbihNYXRoLmNvcyh0aGlzLmFkKSpNYXRoLnNpbihkKS1NYXRoLnNpbih0aGlzLmFkKSpNYXRoLmNvcyhkKSpNYXRoLmNvcyhiKSk7Yj1NYXRoLmFzaW4oTWF0aC5jb3MoZCkqTWF0aC5zaW4oYikvTWF0aC5jb3MoYykpO2EueD10aGlzLmxvbmcwLWIvdGhpcy5hbGZhO2I9Yzt2YXIgZT1kPTA7ZG8gYS55PTIqKE1hdGguYXRhbihNYXRoLnBvdyh0aGlzLmssLTEvdGhpcy5hbGZhKSpNYXRoLnBvdyhNYXRoLnRhbihjLzIrdGhpcy5zNDUpLDEvdGhpcy5hbGZhKSpNYXRoLnBvdygoMSt0aGlzLmUqTWF0aC5zaW4oYikpLygxLXRoaXMuZSpNYXRoLnNpbihiKSksdGhpcy5lLzIpKS10aGlzLnM0NSksMS4wRS0xMD5cbk1hdGguYWJzKGItYS55KSYmKGQ9MSksYj1hLnksZSs9MTt3aGlsZSgwPT1kJiYxNT5lKTtyZXR1cm4gMTU8PWU/KFByb2o0anMucmVwb3J0RXJyb3IoXCJQSEkzWi1DT05WOkxhdGl0dWRlIGZhaWxlZCB0byBjb252ZXJnZSBhZnRlciAxNSBpdGVyYXRpb25zXCIpLG51bGwpOmF9fTtcblByb2o0anMuUHJvai5zb21lcmM9e2luaXQ6ZnVuY3Rpb24oKXt2YXIgYT10aGlzLmxhdDA7dGhpcy5sYW1iZGEwPXRoaXMubG9uZzA7dmFyIGM9TWF0aC5zaW4oYSksYj10aGlzLmEsZD0xL3RoaXMucmYsZD0yKmQtTWF0aC5wb3coZCwyKSxlPXRoaXMuZT1NYXRoLnNxcnQoZCk7dGhpcy5SPXRoaXMuazAqYipNYXRoLnNxcnQoMS1kKS8oMS1kKk1hdGgucG93KGMsMikpO3RoaXMuYWxwaGE9TWF0aC5zcXJ0KDErZC8oMS1kKSpNYXRoLnBvdyhNYXRoLmNvcyhhKSw0KSk7dGhpcy5iMD1NYXRoLmFzaW4oYy90aGlzLmFscGhhKTt0aGlzLks9TWF0aC5sb2coTWF0aC50YW4oTWF0aC5QSS80K3RoaXMuYjAvMikpLXRoaXMuYWxwaGEqTWF0aC5sb2coTWF0aC50YW4oTWF0aC5QSS80K2EvMikpK3RoaXMuYWxwaGEqZS8yKk1hdGgubG9nKCgxK2UqYykvKDEtZSpjKSl9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGM9TWF0aC5sb2coTWF0aC50YW4oTWF0aC5QSS80LWEueS8yKSksYj10aGlzLmUvXG4yKk1hdGgubG9nKCgxK3RoaXMuZSpNYXRoLnNpbihhLnkpKS8oMS10aGlzLmUqTWF0aC5zaW4oYS55KSkpLGI9MiooTWF0aC5hdGFuKE1hdGguZXhwKC10aGlzLmFscGhhKihjK2IpK3RoaXMuSykpLU1hdGguUEkvNCksZD10aGlzLmFscGhhKihhLngtdGhpcy5sYW1iZGEwKSxjPU1hdGguYXRhbihNYXRoLnNpbihkKS8oTWF0aC5zaW4odGhpcy5iMCkqTWF0aC50YW4oYikrTWF0aC5jb3ModGhpcy5iMCkqTWF0aC5jb3MoZCkpKSxiPU1hdGguYXNpbihNYXRoLmNvcyh0aGlzLmIwKSpNYXRoLnNpbihiKS1NYXRoLnNpbih0aGlzLmIwKSpNYXRoLmNvcyhiKSpNYXRoLmNvcyhkKSk7YS55PXRoaXMuUi8yKk1hdGgubG9nKCgxK01hdGguc2luKGIpKS8oMS1NYXRoLnNpbihiKSkpK3RoaXMueTA7YS54PXRoaXMuUipjK3RoaXMueDA7cmV0dXJuIGF9LGludmVyc2U6ZnVuY3Rpb24oYSl7Zm9yKHZhciBjPShhLngtdGhpcy54MCkvdGhpcy5SLGI9MiooTWF0aC5hdGFuKE1hdGguZXhwKChhLnktXG50aGlzLnkwKS90aGlzLlIpKS1NYXRoLlBJLzQpLGQ9TWF0aC5hc2luKE1hdGguY29zKHRoaXMuYjApKk1hdGguc2luKGIpK01hdGguc2luKHRoaXMuYjApKk1hdGguY29zKGIpKk1hdGguY29zKGMpKSxjPXRoaXMubGFtYmRhMCtNYXRoLmF0YW4oTWF0aC5zaW4oYykvKE1hdGguY29zKHRoaXMuYjApKk1hdGguY29zKGMpLU1hdGguc2luKHRoaXMuYjApKk1hdGgudGFuKGIpKSkvdGhpcy5hbHBoYSxiPTAsZT1kLGY9LTFFMyxnPTA7MS4wRS03PE1hdGguYWJzKGUtZik7KXtpZigyMDwrK2cpe1Byb2o0anMucmVwb3J0RXJyb3IoXCJvbWVyY0Z3ZEluZmluaXR5XCIpO3JldHVybn1iPTEvdGhpcy5hbHBoYSooTWF0aC5sb2coTWF0aC50YW4oTWF0aC5QSS80K2QvMikpLXRoaXMuSykrdGhpcy5lKk1hdGgubG9nKE1hdGgudGFuKE1hdGguUEkvNCtNYXRoLmFzaW4odGhpcy5lKk1hdGguc2luKGUpKS8yKSk7Zj1lO2U9MipNYXRoLmF0YW4oTWF0aC5leHAoYikpLU1hdGguUEkvMn1hLng9YzthLnk9XG5lO3JldHVybiBhfX07XG5Qcm9qNGpzLlByb2ouc3RlcmU9e3NzZm5fOmZ1bmN0aW9uKGEsYyxiKXtjKj1iO3JldHVybiBNYXRoLnRhbigwLjUqKFByb2o0anMuY29tbW9uLkhBTEZfUEkrYSkpKk1hdGgucG93KCgxLWMpLygxK2MpLDAuNSpiKX0sVE9MOjEuMEUtOCxOSVRFUjo4LENPTlY6MS4wRS0xMCxTX1BPTEU6MCxOX1BPTEU6MSxPQkxJUToyLEVRVUlUOjMsaW5pdDpmdW5jdGlvbigpe3RoaXMucGhpdHM9dGhpcy5sYXRfdHM/dGhpcy5sYXRfdHM6UHJvajRqcy5jb21tb24uSEFMRl9QSTt2YXIgYT1NYXRoLmFicyh0aGlzLmxhdDApO3RoaXMubW9kZT1NYXRoLmFicyhhKS1Qcm9qNGpzLmNvbW1vbi5IQUxGX1BJPFByb2o0anMuY29tbW9uLkVQU0xOPzA+dGhpcy5sYXQwP3RoaXMuU19QT0xFOnRoaXMuTl9QT0xFOmE+UHJvajRqcy5jb21tb24uRVBTTE4/dGhpcy5PQkxJUTp0aGlzLkVRVUlUO3RoaXMucGhpdHM9TWF0aC5hYnModGhpcy5waGl0cyk7aWYodGhpcy5lcyl7dmFyIGM7c3dpdGNoKHRoaXMubW9kZSl7Y2FzZSB0aGlzLk5fUE9MRTpjYXNlIHRoaXMuU19QT0xFOk1hdGguYWJzKHRoaXMucGhpdHMtUHJvajRqcy5jb21tb24uSEFMRl9QSSk8XG5Qcm9qNGpzLmNvbW1vbi5FUFNMTj90aGlzLmFrbTE9Mip0aGlzLmswL01hdGguc3FydChNYXRoLnBvdygxK3RoaXMuZSwxK3RoaXMuZSkqTWF0aC5wb3coMS10aGlzLmUsMS10aGlzLmUpKTooYT1NYXRoLnNpbih0aGlzLnBoaXRzKSx0aGlzLmFrbTE9TWF0aC5jb3ModGhpcy5waGl0cykvUHJvajRqcy5jb21tb24udHNmbnoodGhpcy5lLHRoaXMucGhpdHMsYSksYSo9dGhpcy5lLHRoaXMuYWttMS89TWF0aC5zcXJ0KDEtYSphKSk7YnJlYWs7Y2FzZSB0aGlzLkVRVUlUOnRoaXMuYWttMT0yKnRoaXMuazA7YnJlYWs7Y2FzZSB0aGlzLk9CTElROmE9TWF0aC5zaW4odGhpcy5sYXQwKSxjPTIqTWF0aC5hdGFuKHRoaXMuc3Nmbl8odGhpcy5sYXQwLGEsdGhpcy5lKSktUHJvajRqcy5jb21tb24uSEFMRl9QSSxhKj10aGlzLmUsdGhpcy5ha20xPTIqdGhpcy5rMCpNYXRoLmNvcyh0aGlzLmxhdDApL01hdGguc3FydCgxLWEqYSksdGhpcy5zaW5YMT1NYXRoLnNpbihjKSx0aGlzLmNvc1gxPU1hdGguY29zKGMpfX1lbHNlIHN3aXRjaCh0aGlzLm1vZGUpe2Nhc2UgdGhpcy5PQkxJUTp0aGlzLnNpbnBoMD1cbk1hdGguc2luKHRoaXMubGF0MCksdGhpcy5jb3NwaDA9TWF0aC5jb3ModGhpcy5sYXQwKTtjYXNlIHRoaXMuRVFVSVQ6dGhpcy5ha20xPTIqdGhpcy5rMDticmVhaztjYXNlIHRoaXMuU19QT0xFOmNhc2UgdGhpcy5OX1BPTEU6dGhpcy5ha20xPU1hdGguYWJzKHRoaXMucGhpdHMtUHJvajRqcy5jb21tb24uSEFMRl9QSSk+PVByb2o0anMuY29tbW9uLkVQU0xOP01hdGguY29zKHRoaXMucGhpdHMpL01hdGgudGFuKFByb2o0anMuY29tbW9uLkZPUlRQSS0wLjUqdGhpcy5waGl0cyk6Mip0aGlzLmswfX0sZm9yd2FyZDpmdW5jdGlvbihhKXt2YXIgYz1hLngsYz1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGMtdGhpcy5sb25nMCksYj1hLnksZCxlO2lmKHRoaXMuc3BoZXJlKXt2YXIgZixnLGk7Zj1NYXRoLnNpbihiKTtnPU1hdGguY29zKGIpO2k9TWF0aC5jb3MoYyk7Yz1NYXRoLnNpbihjKTtzd2l0Y2godGhpcy5tb2RlKXtjYXNlIHRoaXMuRVFVSVQ6ZT0xK2cqaTtlPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTiYmXG5Qcm9qNGpzLnJlcG9ydEVycm9yKFwic3RlcmU6Zm9yd2FyZDpFcXVpdFwiKTtlPXRoaXMuYWttMS9lO2Q9ZSpnKmM7ZSo9ZjticmVhaztjYXNlIHRoaXMuT0JMSVE6ZT0xK3RoaXMuc2lucGgwKmYrdGhpcy5jb3NwaDAqZyppO2U8PVByb2o0anMuY29tbW9uLkVQU0xOJiZQcm9qNGpzLnJlcG9ydEVycm9yKFwic3RlcmU6Zm9yd2FyZDpPYmxpcVwiKTtlPXRoaXMuYWttMS9lO2Q9ZSpnKmM7ZSo9dGhpcy5jb3NwaDAqZi10aGlzLnNpbnBoMCpnKmk7YnJlYWs7Y2FzZSB0aGlzLk5fUE9MRTppPS1pLGI9LWI7Y2FzZSB0aGlzLlNfUE9MRTpNYXRoLmFicyhiLVByb2o0anMuY29tbW9uLkhBTEZfUEkpPHRoaXMuVE9MJiZQcm9qNGpzLnJlcG9ydEVycm9yKFwic3RlcmU6Zm9yd2FyZDpTX1BPTEVcIiksZT10aGlzLmFrbTEqTWF0aC50YW4oUHJvajRqcy5jb21tb24uRk9SVFBJKzAuNSpiKSxkPWMqZSxlKj1pfX1lbHNle2k9TWF0aC5jb3MoYyk7Yz1NYXRoLnNpbihjKTtmPU1hdGguc2luKGIpO3ZhciBoO1xuaWYodGhpcy5tb2RlPT10aGlzLk9CTElRfHx0aGlzLm1vZGU9PXRoaXMuRVFVSVQpaD0yKk1hdGguYXRhbih0aGlzLnNzZm5fKGIsZix0aGlzLmUpKSxnPU1hdGguc2luKGgtUHJvajRqcy5jb21tb24uSEFMRl9QSSksaD1NYXRoLmNvcyhoKTtzd2l0Y2godGhpcy5tb2RlKXtjYXNlIHRoaXMuT0JMSVE6Yj10aGlzLmFrbTEvKHRoaXMuY29zWDEqKDErdGhpcy5zaW5YMSpnK3RoaXMuY29zWDEqaCppKSk7ZT1iKih0aGlzLmNvc1gxKmctdGhpcy5zaW5YMSpoKmkpO2Q9YipoO2JyZWFrO2Nhc2UgdGhpcy5FUVVJVDpiPTIqdGhpcy5ha20xLygxK2gqaSk7ZT1iKmc7ZD1iKmg7YnJlYWs7Y2FzZSB0aGlzLlNfUE9MRTpiPS1iLGk9LWksZj0tZjtjYXNlIHRoaXMuTl9QT0xFOmQ9dGhpcy5ha20xKlByb2o0anMuY29tbW9uLnRzZm56KHRoaXMuZSxiLGYpLGU9LWQqaX1kKj1jfWEueD1kKnRoaXMuYSt0aGlzLngwO2EueT1lKnRoaXMuYSt0aGlzLnkwO3JldHVybiBhfSxpbnZlcnNlOmZ1bmN0aW9uKGEpe3ZhciBjPVxuKGEueC10aGlzLngwKS90aGlzLmEsYj0oYS55LXRoaXMueTApL3RoaXMuYSxkLGUsZixnPWQ9MCxpLGg9Zj0wO2lmKHRoaXMuc3BoZXJlKXtnPU1hdGguc3FydChjKmMrYipiKTtoPTIqTWF0aC5hdGFuKGcvdGhpcy5ha20xKTtmPU1hdGguc2luKGgpO2g9TWF0aC5jb3MoaCk7ZD0wO3N3aXRjaCh0aGlzLm1vZGUpe2Nhc2UgdGhpcy5FUVVJVDplPU1hdGguYWJzKGcpPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTj8wOk1hdGguYXNpbihiKmYvZyk7aWYoMCE9aHx8MCE9YylkPU1hdGguYXRhbjIoYypmLGgqZyk7YnJlYWs7Y2FzZSB0aGlzLk9CTElROmU9TWF0aC5hYnMoZyk8PVByb2o0anMuY29tbW9uLkVQU0xOP3RoaXMucGhpMDpNYXRoLmFzaW4oaCp0aGlzLnNpbnBoMCtiKmYqdGhpcy5jb3NwaDAvZyk7aC09dGhpcy5zaW5waDAqTWF0aC5zaW4oZSk7aWYoMCE9aHx8MCE9YylkPU1hdGguYXRhbjIoYypmKnRoaXMuY29zcGgwLGgqZyk7YnJlYWs7Y2FzZSB0aGlzLk5fUE9MRTpiPS1iO2Nhc2UgdGhpcy5TX1BPTEU6ZT1cbk1hdGguYWJzKGcpPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTj90aGlzLnBoaTA6TWF0aC5hc2luKHRoaXMubW9kZT09dGhpcy5TX1BPTEU/LWg6aCksZD0wPT1jJiYwPT1iPzA6TWF0aC5hdGFuMihjLGIpfWEueD1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGQrdGhpcy5sb25nMCk7YS55PWV9ZWxzZXtpPU1hdGguc3FydChjKmMrYipiKTtzd2l0Y2godGhpcy5tb2RlKXtjYXNlIHRoaXMuT0JMSVE6Y2FzZSB0aGlzLkVRVUlUOmQ9MipNYXRoLmF0YW4yKGkqdGhpcy5jb3NYMSx0aGlzLmFrbTEpO2Y9TWF0aC5jb3MoZCk7ZT1NYXRoLnNpbihkKTtnPTA9PWk/TWF0aC5hc2luKGYqdGhpcy5zaW5YMSk6TWF0aC5hc2luKGYqdGhpcy5zaW5YMStiKmUqdGhpcy5jb3NYMS9pKTtkPU1hdGgudGFuKDAuNSooUHJvajRqcy5jb21tb24uSEFMRl9QSStnKSk7Yyo9ZTtiPWkqdGhpcy5jb3NYMSpmLWIqdGhpcy5zaW5YMSplO2g9UHJvajRqcy5jb21tb24uSEFMRl9QSTtmPTAuNSp0aGlzLmU7YnJlYWs7XG5jYXNlIHRoaXMuTl9QT0xFOmI9LWI7Y2FzZSB0aGlzLlNfUE9MRTpkPS1pL3RoaXMuYWttMSxnPVByb2o0anMuY29tbW9uLkhBTEZfUEktMipNYXRoLmF0YW4oZCksaD0tUHJvajRqcy5jb21tb24uSEFMRl9QSSxmPS0wLjUqdGhpcy5lfWZvcihpPXRoaXMuTklURVI7aS0tO2c9ZSlpZihlPXRoaXMuZSpNYXRoLnNpbihnKSxlPTIqTWF0aC5hdGFuKGQqTWF0aC5wb3coKDErZSkvKDEtZSksZikpLWgsTWF0aC5hYnMoZy1lKTx0aGlzLkNPTlYpcmV0dXJuIHRoaXMubW9kZT09dGhpcy5TX1BPTEUmJihlPS1lKSxkPTA9PWMmJjA9PWI/MDpNYXRoLmF0YW4yKGMsYiksYS54PVByb2o0anMuY29tbW9uLmFkanVzdF9sb24oZCt0aGlzLmxvbmcwKSxhLnk9ZSxhfX19O1xuUHJvajRqcy5Qcm9qLm56bWc9e2l0ZXJhdGlvbnM6MSxpbml0OmZ1bmN0aW9uKCl7dGhpcy5BPVtdO3RoaXMuQVsxXT0wLjYzOTkxNzUwNzM7dGhpcy5BWzJdPS0wLjEzNTg3OTc2MTM7dGhpcy5BWzNdPTAuMDYzMjk0NDA5O3RoaXMuQVs0XT0tMC4wMjUyNjg1Mzt0aGlzLkFbNV09MC4wMTE3ODc5O3RoaXMuQVs2XT0tMC4wMDU1MTYxO3RoaXMuQVs3XT0wLjAwMjY5MDY7dGhpcy5BWzhdPS0wLjAwMTMzMzt0aGlzLkFbOV09Ni43RS00O3RoaXMuQVsxMF09LTMuNEUtNDt0aGlzLkJfcmU9W107dGhpcy5CX2ltPVtdO3RoaXMuQl9yZVsxXT0wLjc1NTc4NTMyMjg7dGhpcy5CX2ltWzFdPTA7dGhpcy5CX3JlWzJdPTAuMjQ5MjA0NjQ2O3RoaXMuQl9pbVsyXT0wLjAwMzM3MTUwNzt0aGlzLkJfcmVbM109LTAuMDAxNTQxNzM5O3RoaXMuQl9pbVszXT0wLjA0MTA1ODU2O3RoaXMuQl9yZVs0XT0tMC4xMDE2MjkwNzt0aGlzLkJfaW1bNF09MC4wMTcyNzYwOTt0aGlzLkJfcmVbNV09LTAuMjY2MjM0ODk7XG50aGlzLkJfaW1bNV09LTAuMzYyNDkyMTg7dGhpcy5CX3JlWzZdPS0wLjY4NzA5ODM7dGhpcy5CX2ltWzZdPS0xLjE2NTE5Njc7dGhpcy5DX3JlPVtdO3RoaXMuQ19pbT1bXTt0aGlzLkNfcmVbMV09MS4zMjMxMjcwNDM5O3RoaXMuQ19pbVsxXT0wO3RoaXMuQ19yZVsyXT0tMC41NzcyNDU3ODk7dGhpcy5DX2ltWzJdPS0wLjAwNzgwOTU5ODt0aGlzLkNfcmVbM109MC41MDgzMDc1MTM7dGhpcy5DX2ltWzNdPS0wLjExMjIwODk1Mjt0aGlzLkNfcmVbNF09LTAuMTUwOTQ3NjI7dGhpcy5DX2ltWzRdPTAuMTgyMDA2MDI7dGhpcy5DX3JlWzVdPTEuMDE0MTgxNzk7dGhpcy5DX2ltWzVdPTEuNjQ0OTc2OTY7dGhpcy5DX3JlWzZdPTEuOTY2MDU0OTt0aGlzLkNfaW1bNl09Mi41MTI3NjQ1O3RoaXMuRD1bXTt0aGlzLkRbMV09MS41NjI3MDE0MjQzO3RoaXMuRFsyXT0wLjUxODU0MDYzOTg7dGhpcy5EWzNdPS0wLjAzMzMzMDk4O3RoaXMuRFs0XT0tMC4xMDUyOTA2O3RoaXMuRFs1XT0tMC4wMzY4NTk0O1xudGhpcy5EWzZdPTAuMDA3MzE3O3RoaXMuRFs3XT0wLjAxMjI7dGhpcy5EWzhdPTAuMDAzOTQ7dGhpcy5EWzldPS0wLjAwMTN9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7Zm9yKHZhciBjPTEuMEUtNSooKGEueS10aGlzLmxhdDApL1Byb2o0anMuY29tbW9uLlNFQ19UT19SQUQpLGI9YS54LXRoaXMubG9uZzAsZD0xLGU9MCxmPTE7MTA+PWY7ZisrKWQqPWMsZSs9dGhpcy5BW2ZdKmQ7Zm9yKHZhciBjPWUsZD0xLGc9MCxpPTAsaD0wLGY9MTs2Pj1mO2YrKyllPWQqYy1nKmIsZz1nKmMrZCpiLGQ9ZSxpPWkrdGhpcy5CX3JlW2ZdKmQtdGhpcy5CX2ltW2ZdKmcsaD1oK3RoaXMuQl9pbVtmXSpkK3RoaXMuQl9yZVtmXSpnO2EueD1oKnRoaXMuYSt0aGlzLngwO2EueT1pKnRoaXMuYSt0aGlzLnkwO3JldHVybiBhfSxpbnZlcnNlOmZ1bmN0aW9uKGEpe2Zvcih2YXIgYz0oYS55LXRoaXMueTApL3RoaXMuYSxiPShhLngtdGhpcy54MCkvdGhpcy5hLGQ9MSxlPTAsZixnPTAsaT0wLGg9MTs2Pj1oO2grKylmPVxuZCpjLWUqYixlPWUqYytkKmIsZD1mLGc9Zyt0aGlzLkNfcmVbaF0qZC10aGlzLkNfaW1baF0qZSxpPWkrdGhpcy5DX2ltW2hdKmQrdGhpcy5DX3JlW2hdKmU7Zm9yKGQ9MDtkPHRoaXMuaXRlcmF0aW9ucztkKyspe3ZhciBqPWcsaz1pLGw7Zj1jO2U9Yjtmb3IoaD0yOzY+PWg7aCsrKWw9aipnLWsqaSxrPWsqZytqKmksaj1sLGYrPShoLTEpKih0aGlzLkJfcmVbaF0qai10aGlzLkJfaW1baF0qayksZSs9KGgtMSkqKHRoaXMuQl9pbVtoXSpqK3RoaXMuQl9yZVtoXSprKTtmb3IodmFyIGo9MSxrPTAsbT10aGlzLkJfcmVbMV0sbj10aGlzLkJfaW1bMV0saD0yOzY+PWg7aCsrKWw9aipnLWsqaSxrPWsqZytqKmksaj1sLG0rPWgqKHRoaXMuQl9yZVtoXSpqLXRoaXMuQl9pbVtoXSprKSxuKz1oKih0aGlzLkJfaW1baF0qait0aGlzLkJfcmVbaF0qayk7aT1tKm0rbipuO2c9KGYqbStlKm4pL2k7aT0oZSptLWYqbikvaX1jPWc7Yj0xO2c9MDtmb3IoaD0xOzk+PWg7aCsrKWIqPWMsZys9dGhpcy5EW2hdKlxuYjtoPXRoaXMubGF0MCsxRTUqZypQcm9qNGpzLmNvbW1vbi5TRUNfVE9fUkFEO2EueD10aGlzLmxvbmcwK2k7YS55PWg7cmV0dXJuIGF9fTtQcm9qNGpzLlByb2oubWlsbD17aW5pdDpmdW5jdGlvbigpe30sZm9yd2FyZDpmdW5jdGlvbihhKXt2YXIgYz1hLnksYj10aGlzLngwK3RoaXMuYSpQcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGEueC10aGlzLmxvbmcwKSxjPXRoaXMueTArMS4yNSp0aGlzLmEqTWF0aC5sb2coTWF0aC50YW4oUHJvajRqcy5jb21tb24uUEkvNCtjLzIuNSkpO2EueD1iO2EueT1jO3JldHVybiBhfSxpbnZlcnNlOmZ1bmN0aW9uKGEpe2EueC09dGhpcy54MDthLnktPXRoaXMueTA7dmFyIGM9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbih0aGlzLmxvbmcwK2EueC90aGlzLmEpLGI9Mi41KihNYXRoLmF0YW4oTWF0aC5leHAoMC44KmEueS90aGlzLmEpKS1Qcm9qNGpzLmNvbW1vbi5QSS80KTthLng9YzthLnk9YjtyZXR1cm4gYX19O1xuUHJvajRqcy5Qcm9qLmdub209e2luaXQ6ZnVuY3Rpb24oKXt0aGlzLnNpbl9wMTQ9TWF0aC5zaW4odGhpcy5sYXQwKTt0aGlzLmNvc19wMTQ9TWF0aC5jb3ModGhpcy5sYXQwKTt0aGlzLmluZmluaXR5X2Rpc3Q9MUUzKnRoaXMuYTt0aGlzLnJjPTF9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGMsYixkLGUsZjtiPWEueTtkPVByb2o0anMuY29tbW9uLmFkanVzdF9sb24oYS54LXRoaXMubG9uZzApO2M9TWF0aC5zaW4oYik7Yj1NYXRoLmNvcyhiKTtlPU1hdGguY29zKGQpO2Y9dGhpcy5zaW5fcDE0KmMrdGhpcy5jb3NfcDE0KmIqZTswPGZ8fE1hdGguYWJzKGYpPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTj8oZD10aGlzLngwKzEqdGhpcy5hKmIqTWF0aC5zaW4oZCkvZixjPXRoaXMueTArMSp0aGlzLmEqKHRoaXMuY29zX3AxNCpjLXRoaXMuc2luX3AxNCpiKmUpL2YpOihQcm9qNGpzLnJlcG9ydEVycm9yKFwib3J0aG9Gd2RQb2ludEVycm9yXCIpLGQ9dGhpcy54MCt0aGlzLmluZmluaXR5X2Rpc3QqXG5iKk1hdGguc2luKGQpLGM9dGhpcy55MCt0aGlzLmluZmluaXR5X2Rpc3QqKHRoaXMuY29zX3AxNCpjLXRoaXMuc2luX3AxNCpiKmUpKTthLng9ZDthLnk9YztyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXt2YXIgYyxiLGQsZTthLng9KGEueC10aGlzLngwKS90aGlzLmE7YS55PShhLnktdGhpcy55MCkvdGhpcy5hO2EueC89dGhpcy5rMDthLnkvPXRoaXMuazA7KGM9TWF0aC5zcXJ0KGEueCphLngrYS55KmEueSkpPyhlPU1hdGguYXRhbjIoYyx0aGlzLnJjKSxiPU1hdGguc2luKGUpLGQ9TWF0aC5jb3MoZSksZT1Qcm9qNGpzLmNvbW1vbi5hc2lueihkKnRoaXMuc2luX3AxNCthLnkqYip0aGlzLmNvc19wMTQvYyksYz1NYXRoLmF0YW4yKGEueCpiLGMqdGhpcy5jb3NfcDE0KmQtYS55KnRoaXMuc2luX3AxNCpiKSxjPVByb2o0anMuY29tbW9uLmFkanVzdF9sb24odGhpcy5sb25nMCtjKSk6KGU9dGhpcy5waGljMCxjPTApO2EueD1jO2EueT1lO3JldHVybiBhfX07XG5Qcm9qNGpzLlByb2ouc2ludT17aW5pdDpmdW5jdGlvbigpe3RoaXMuc3BoZXJlPyh0aGlzLm49MSx0aGlzLmVzPXRoaXMubT0wLHRoaXMuQ195PU1hdGguc3FydCgodGhpcy5tKzEpL3RoaXMubiksdGhpcy5DX3g9dGhpcy5DX3kvKHRoaXMubSsxKSk6dGhpcy5lbj1Qcm9qNGpzLmNvbW1vbi5wal9lbmZuKHRoaXMuZXMpfSxmb3J3YXJkOmZ1bmN0aW9uKGEpe3ZhciBjLGI7Yz1hLng7Yj1hLnk7Yz1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGMtdGhpcy5sb25nMCk7aWYodGhpcy5zcGhlcmUpe2lmKHRoaXMubSlmb3IodmFyIGQ9dGhpcy5uKk1hdGguc2luKGIpLGU9UHJvajRqcy5jb21tb24uTUFYX0lURVI7ZTstLWUpe3ZhciBmPSh0aGlzLm0qYitNYXRoLnNpbihiKS1kKS8odGhpcy5tK01hdGguY29zKGIpKTtiLT1mO2lmKE1hdGguYWJzKGYpPFByb2o0anMuY29tbW9uLkVQU0xOKWJyZWFrfWVsc2UgYj0xIT10aGlzLm4/TWF0aC5hc2luKHRoaXMubipNYXRoLnNpbihiKSk6YjtcbmM9dGhpcy5hKnRoaXMuQ194KmMqKHRoaXMubStNYXRoLmNvcyhiKSk7Yio9dGhpcy5hKnRoaXMuQ195fWVsc2UgZD1NYXRoLnNpbihiKSxlPU1hdGguY29zKGIpLGI9dGhpcy5hKlByb2o0anMuY29tbW9uLnBqX21sZm4oYixkLGUsdGhpcy5lbiksYz10aGlzLmEqYyplL01hdGguc3FydCgxLXRoaXMuZXMqZCpkKTthLng9YzthLnk9YjtyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXt2YXIgYyxiO2EueC09dGhpcy54MDthLnktPXRoaXMueTA7aWYodGhpcy5zcGhlcmUpYS55Lz10aGlzLkNfeSxjPXRoaXMubT9NYXRoLmFzaW4oKHRoaXMubSphLnkrTWF0aC5zaW4oYS55KSkvdGhpcy5uKToxIT10aGlzLm4/TWF0aC5hc2luKE1hdGguc2luKGEueSkvdGhpcy5uKTphLnksYj1hLngvKHRoaXMuQ194Kih0aGlzLm0rTWF0aC5jb3MoYS55KSkpO2Vsc2V7Yz1Qcm9qNGpzLmNvbW1vbi5wal9pbnZfbWxmbihhLnkvdGhpcy5hLHRoaXMuZXMsdGhpcy5lbik7dmFyIGQ9TWF0aC5hYnMoYyk7XG5kPFByb2o0anMuY29tbW9uLkhBTEZfUEk/KGQ9TWF0aC5zaW4oYyksYj10aGlzLmxvbmcwK2EueCpNYXRoLnNxcnQoMS10aGlzLmVzKmQqZCkvKHRoaXMuYSpNYXRoLmNvcyhjKSksYj1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGIpKTpkLVByb2o0anMuY29tbW9uLkVQU0xOPFByb2o0anMuY29tbW9uLkhBTEZfUEkmJihiPXRoaXMubG9uZzApfWEueD1iO2EueT1jO3JldHVybiBhfX07XG5Qcm9qNGpzLlByb2oudmFuZGc9e2luaXQ6ZnVuY3Rpb24oKXt0aGlzLlI9NjM3MDk5N30sZm9yd2FyZDpmdW5jdGlvbihhKXt2YXIgYz1hLnksYj1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGEueC10aGlzLmxvbmcwKTtNYXRoLmFicyhjKTt2YXIgZD1Qcm9qNGpzLmNvbW1vbi5hc2lueigyKk1hdGguYWJzKGMvUHJvajRqcy5jb21tb24uUEkpKTsoTWF0aC5hYnMoYik8PVByb2o0anMuY29tbW9uLkVQU0xOfHxNYXRoLmFicyhNYXRoLmFicyhjKS1Qcm9qNGpzLmNvbW1vbi5IQUxGX1BJKTw9UHJvajRqcy5jb21tb24uRVBTTE4pJiZNYXRoLnRhbigwLjUqZCk7dmFyIGU9MC41Kk1hdGguYWJzKFByb2o0anMuY29tbW9uLlBJL2ItYi9Qcm9qNGpzLmNvbW1vbi5QSSksZj1lKmUsZz1NYXRoLnNpbihkKSxkPU1hdGguY29zKGQpLGQ9ZC8oZytkLTEpLGc9ZCooMi9nLTEpLGc9ZypnLGY9UHJvajRqcy5jb21tb24uUEkqdGhpcy5SKihlKihkLWcpK01hdGguc3FydChmKihkLWcpKihkLWcpLVxuKGcrZikqKGQqZC1nKSkpLyhnK2YpOzA+YiYmKGY9LWYpO2I9dGhpcy54MCtmO2Y9TWF0aC5hYnMoZi8oUHJvajRqcy5jb21tb24uUEkqdGhpcy5SKSk7Yz0wPD1jP3RoaXMueTArUHJvajRqcy5jb21tb24uUEkqdGhpcy5SKk1hdGguc3FydCgxLWYqZi0yKmUqZik6dGhpcy55MC1Qcm9qNGpzLmNvbW1vbi5QSSp0aGlzLlIqTWF0aC5zcXJ0KDEtZipmLTIqZSpmKTthLng9YjthLnk9YztyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXt2YXIgYyxiLGQsZSxmLGcsaSxoO2EueC09dGhpcy54MDthLnktPXRoaXMueTA7aD1Qcm9qNGpzLmNvbW1vbi5QSSp0aGlzLlI7Yz1hLngvaDtkPWEueS9oO2U9YypjK2QqZDtmPS1NYXRoLmFicyhkKSooMStlKTtiPWYtMipkKmQrYypjO2c9LTIqZisxKzIqZCpkK2UqZTtoPWQqZC9nKygyKmIqYipiL2cvZy9nLTkqZipiL2cvZykvMjc7aT0oZi1iKmIvMy9nKS9nO2Y9MipNYXRoLnNxcnQoLWkvMyk7aD0zKmgvaS9mOzE8TWF0aC5hYnMoaCkmJihoPVxuMDw9aD8xOi0xKTtoPU1hdGguYWNvcyhoKS8zO2I9MDw9YS55PygtZipNYXRoLmNvcyhoK1Byb2o0anMuY29tbW9uLlBJLzMpLWIvMy9nKSpQcm9qNGpzLmNvbW1vbi5QSTotKC1mKk1hdGguY29zKGgrUHJvajRqcy5jb21tb24uUEkvMyktYi8zL2cpKlByb2o0anMuY29tbW9uLlBJO01hdGguYWJzKGMpO2M9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbih0aGlzLmxvbmcwK1Byb2o0anMuY29tbW9uLlBJKihlLTErTWF0aC5zcXJ0KDErMiooYypjLWQqZCkrZSplKSkvMi9jKTthLng9YzthLnk9YjtyZXR1cm4gYX19O1xuUHJvajRqcy5Qcm9qLmNlYT17aW5pdDpmdW5jdGlvbigpe30sZm9yd2FyZDpmdW5jdGlvbihhKXt2YXIgYz1hLnksYj10aGlzLngwK3RoaXMuYSpQcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGEueC10aGlzLmxvbmcwKSpNYXRoLmNvcyh0aGlzLmxhdF90cyksYz10aGlzLnkwK3RoaXMuYSpNYXRoLnNpbihjKS9NYXRoLmNvcyh0aGlzLmxhdF90cyk7YS54PWI7YS55PWM7cmV0dXJuIGF9LGludmVyc2U6ZnVuY3Rpb24oYSl7YS54LT10aGlzLngwO2EueS09dGhpcy55MDt2YXIgYz1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKHRoaXMubG9uZzArYS54L3RoaXMuYS9NYXRoLmNvcyh0aGlzLmxhdF90cykpLGI9TWF0aC5hc2luKGEueS90aGlzLmEqTWF0aC5jb3ModGhpcy5sYXRfdHMpKTthLng9YzthLnk9YjtyZXR1cm4gYX19O1xuUHJvajRqcy5Qcm9qLmVxYz17aW5pdDpmdW5jdGlvbigpe3RoaXMueDB8fCh0aGlzLngwPTApO3RoaXMueTB8fCh0aGlzLnkwPTApO3RoaXMubGF0MHx8KHRoaXMubGF0MD0wKTt0aGlzLmxvbmcwfHwodGhpcy5sb25nMD0wKTt0aGlzLmxhdF90c3x8KHRoaXMubGF0X3RzPTApO3RoaXMudGl0bGV8fCh0aGlzLnRpdGxlPVwiRXF1aWRpc3RhbnQgQ3lsaW5kcmljYWwgKFBsYXRlIENhcnJlKVwiKTt0aGlzLnJjPU1hdGguY29zKHRoaXMubGF0X3RzKX0sZm9yd2FyZDpmdW5jdGlvbihhKXt2YXIgYz1hLnksYj1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGEueC10aGlzLmxvbmcwKSxjPVByb2o0anMuY29tbW9uLmFkanVzdF9sYXQoYy10aGlzLmxhdDApO2EueD10aGlzLngwK3RoaXMuYSpiKnRoaXMucmM7YS55PXRoaXMueTArdGhpcy5hKmM7cmV0dXJuIGF9LGludmVyc2U6ZnVuY3Rpb24oYSl7dmFyIGM9YS55O2EueD1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKHRoaXMubG9uZzArKGEueC1cbnRoaXMueDApLyh0aGlzLmEqdGhpcy5yYykpO2EueT1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbGF0KHRoaXMubGF0MCsoYy10aGlzLnkwKS90aGlzLmEpO3JldHVybiBhfX07XG5Qcm9qNGpzLlByb2ouY2Fzcz17aW5pdDpmdW5jdGlvbigpe3RoaXMuc3BoZXJlfHwodGhpcy5lbj1Qcm9qNGpzLmNvbW1vbi5wal9lbmZuKHRoaXMuZXMpLHRoaXMubTA9UHJvajRqcy5jb21tb24ucGpfbWxmbih0aGlzLmxhdDAsTWF0aC5zaW4odGhpcy5sYXQwKSxNYXRoLmNvcyh0aGlzLmxhdDApLHRoaXMuZW4pKX0sQzE6MC4xNjY2NjY2NjY2NjY2NjY2NixDMjowLjAwODMzMzMzMzMzMzMzMzMzMyxDMzowLjA0MTY2NjY2NjY2NjY2NjY2NCxDNDowLjMzMzMzMzMzMzMzMzMzMzMsQzU6MC4wNjY2NjY2NjY2NjY2NjY2Nyxmb3J3YXJkOmZ1bmN0aW9uKGEpe3ZhciBjLGIsZD1hLngsZT1hLnksZD1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGQtdGhpcy5sb25nMCk7dGhpcy5zcGhlcmU/KGM9TWF0aC5hc2luKE1hdGguY29zKGUpKk1hdGguc2luKGQpKSxiPU1hdGguYXRhbjIoTWF0aC50YW4oZSksTWF0aC5jb3MoZCkpLXRoaXMucGhpMCk6KHRoaXMubj1NYXRoLnNpbihlKSx0aGlzLmM9XG5NYXRoLmNvcyhlKSxiPVByb2o0anMuY29tbW9uLnBqX21sZm4oZSx0aGlzLm4sdGhpcy5jLHRoaXMuZW4pLHRoaXMubj0xL01hdGguc3FydCgxLXRoaXMuZXMqdGhpcy5uKnRoaXMubiksdGhpcy50bj1NYXRoLnRhbihlKSx0aGlzLnQ9dGhpcy50bip0aGlzLnRuLHRoaXMuYTE9ZCp0aGlzLmMsdGhpcy5jKj10aGlzLmVzKnRoaXMuYy8oMS10aGlzLmVzKSx0aGlzLmEyPXRoaXMuYTEqdGhpcy5hMSxjPXRoaXMubip0aGlzLmExKigxLXRoaXMuYTIqdGhpcy50Kih0aGlzLkMxLSg4LXRoaXMudCs4KnRoaXMuYykqdGhpcy5hMip0aGlzLkMyKSksYi09dGhpcy5tMC10aGlzLm4qdGhpcy50bip0aGlzLmEyKigwLjUrKDUtdGhpcy50KzYqdGhpcy5jKSp0aGlzLmEyKnRoaXMuQzMpKTthLng9dGhpcy5hKmMrdGhpcy54MDthLnk9dGhpcy5hKmIrdGhpcy55MDtyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXthLngtPXRoaXMueDA7YS55LT10aGlzLnkwO3ZhciBjPWEueC90aGlzLmEsYj1cbmEueS90aGlzLmE7aWYodGhpcy5zcGhlcmUpdGhpcy5kZD1iK3RoaXMubGF0MCxiPU1hdGguYXNpbihNYXRoLnNpbih0aGlzLmRkKSpNYXRoLmNvcyhjKSksYz1NYXRoLmF0YW4yKE1hdGgudGFuKGMpLE1hdGguY29zKHRoaXMuZGQpKTtlbHNle3ZhciBkPVByb2o0anMuY29tbW9uLnBqX2ludl9tbGZuKHRoaXMubTArYix0aGlzLmVzLHRoaXMuZW4pO3RoaXMudG49TWF0aC50YW4oZCk7dGhpcy50PXRoaXMudG4qdGhpcy50bjt0aGlzLm49TWF0aC5zaW4oZCk7dGhpcy5yPTEvKDEtdGhpcy5lcyp0aGlzLm4qdGhpcy5uKTt0aGlzLm49TWF0aC5zcXJ0KHRoaXMucik7dGhpcy5yKj0oMS10aGlzLmVzKSp0aGlzLm47dGhpcy5kZD1jL3RoaXMubjt0aGlzLmQyPXRoaXMuZGQqdGhpcy5kZDtiPWQtdGhpcy5uKnRoaXMudG4vdGhpcy5yKnRoaXMuZDIqKDAuNS0oMSszKnRoaXMudCkqdGhpcy5kMip0aGlzLkMzKTtjPXRoaXMuZGQqKDErdGhpcy50KnRoaXMuZDIqKC10aGlzLkM0KygxKzMqdGhpcy50KSpcbnRoaXMuZDIqdGhpcy5DNSkpL01hdGguY29zKGQpfWEueD1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKHRoaXMubG9uZzArYyk7YS55PWI7cmV0dXJuIGF9fTtcblByb2o0anMuUHJvai5nYXVzcz17aW5pdDpmdW5jdGlvbigpe3ZhciBhPU1hdGguc2luKHRoaXMubGF0MCksYz1NYXRoLmNvcyh0aGlzLmxhdDApLGM9YypjO3RoaXMucmM9TWF0aC5zcXJ0KDEtdGhpcy5lcykvKDEtdGhpcy5lcyphKmEpO3RoaXMuQz1NYXRoLnNxcnQoMSt0aGlzLmVzKmMqYy8oMS10aGlzLmVzKSk7dGhpcy5waGljMD1NYXRoLmFzaW4oYS90aGlzLkMpO3RoaXMucmF0ZXhwPTAuNSp0aGlzLkMqdGhpcy5lO3RoaXMuSz1NYXRoLnRhbigwLjUqdGhpcy5waGljMCtQcm9qNGpzLmNvbW1vbi5GT1JUUEkpLyhNYXRoLnBvdyhNYXRoLnRhbigwLjUqdGhpcy5sYXQwK1Byb2o0anMuY29tbW9uLkZPUlRQSSksdGhpcy5DKSpQcm9qNGpzLmNvbW1vbi5zcmF0KHRoaXMuZSphLHRoaXMucmF0ZXhwKSl9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGM9YS54LGI9YS55O2EueT0yKk1hdGguYXRhbih0aGlzLksqTWF0aC5wb3coTWF0aC50YW4oMC41KmIrUHJvajRqcy5jb21tb24uRk9SVFBJKSxcbnRoaXMuQykqUHJvajRqcy5jb21tb24uc3JhdCh0aGlzLmUqTWF0aC5zaW4oYiksdGhpcy5yYXRleHApKS1Qcm9qNGpzLmNvbW1vbi5IQUxGX1BJO2EueD10aGlzLkMqYztyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXtmb3IodmFyIGM9YS54L3RoaXMuQyxiPWEueSxkPU1hdGgucG93KE1hdGgudGFuKDAuNSpiK1Byb2o0anMuY29tbW9uLkZPUlRQSSkvdGhpcy5LLDEvdGhpcy5DKSxlPVByb2o0anMuY29tbW9uLk1BWF9JVEVSOzA8ZTstLWUpe2I9MipNYXRoLmF0YW4oZCpQcm9qNGpzLmNvbW1vbi5zcmF0KHRoaXMuZSpNYXRoLnNpbihhLnkpLC0wLjUqdGhpcy5lKSktUHJvajRqcy5jb21tb24uSEFMRl9QSTtpZigxLjBFLTE0Pk1hdGguYWJzKGItYS55KSlicmVhazthLnk9Yn1pZighZSlyZXR1cm4gUHJvajRqcy5yZXBvcnRFcnJvcihcImdhdXNzOmludmVyc2U6Y29udmVyZ2VuY2UgZmFpbGVkXCIpLG51bGw7YS54PWM7YS55PWI7cmV0dXJuIGF9fTtcblByb2o0anMuUHJvai5vbWVyYz17aW5pdDpmdW5jdGlvbigpe3RoaXMubW9kZXx8KHRoaXMubW9kZT0wKTt0aGlzLmxvbjF8fCh0aGlzLmxvbjE9MCx0aGlzLm1vZGU9MSk7dGhpcy5sb24yfHwodGhpcy5sb24yPTApO3RoaXMubGF0Mnx8KHRoaXMubGF0Mj0wKTt2YXIgYT0xLU1hdGgucG93KHRoaXMuYi90aGlzLmEsMik7TWF0aC5zcXJ0KGEpO3RoaXMuc2luX3AyMD1NYXRoLnNpbih0aGlzLmxhdDApO3RoaXMuY29zX3AyMD1NYXRoLmNvcyh0aGlzLmxhdDApO3RoaXMuY29uPTEtdGhpcy5lcyp0aGlzLnNpbl9wMjAqdGhpcy5zaW5fcDIwO3RoaXMuY29tPU1hdGguc3FydCgxLWEpO3RoaXMuYmw9TWF0aC5zcXJ0KDErdGhpcy5lcypNYXRoLnBvdyh0aGlzLmNvc19wMjAsNCkvKDEtYSkpO3RoaXMuYWw9dGhpcy5hKnRoaXMuYmwqdGhpcy5rMCp0aGlzLmNvbS90aGlzLmNvbjtNYXRoLmFicyh0aGlzLmxhdDApPFByb2o0anMuY29tbW9uLkVQU0xOP3RoaXMuZWw9dGhpcy5kPXRoaXMudHM9XG4xOih0aGlzLnRzPVByb2o0anMuY29tbW9uLnRzZm56KHRoaXMuZSx0aGlzLmxhdDAsdGhpcy5zaW5fcDIwKSx0aGlzLmNvbj1NYXRoLnNxcnQodGhpcy5jb24pLHRoaXMuZD10aGlzLmJsKnRoaXMuY29tLyh0aGlzLmNvc19wMjAqdGhpcy5jb24pLHRoaXMuZj0wPHRoaXMuZCp0aGlzLmQtMT8wPD10aGlzLmxhdDA/dGhpcy5kK01hdGguc3FydCh0aGlzLmQqdGhpcy5kLTEpOnRoaXMuZC1NYXRoLnNxcnQodGhpcy5kKnRoaXMuZC0xKTp0aGlzLmQsdGhpcy5lbD10aGlzLmYqTWF0aC5wb3codGhpcy50cyx0aGlzLmJsKSk7MCE9dGhpcy5tb2RlPyh0aGlzLmc9MC41Kih0aGlzLmYtMS90aGlzLmYpLHRoaXMuZ2FtYT1Qcm9qNGpzLmNvbW1vbi5hc2lueihNYXRoLnNpbih0aGlzLmFscGhhKS90aGlzLmQpLHRoaXMubG9uZ2MtPVByb2o0anMuY29tbW9uLmFzaW56KHRoaXMuZypNYXRoLnRhbih0aGlzLmdhbWEpKS90aGlzLmJsLHRoaXMuY29uPU1hdGguYWJzKHRoaXMubGF0MCksdGhpcy5jb24+XG5Qcm9qNGpzLmNvbW1vbi5FUFNMTiYmTWF0aC5hYnModGhpcy5jb24tUHJvajRqcy5jb21tb24uSEFMRl9QSSk+UHJvajRqcy5jb21tb24uRVBTTE4/KHRoaXMuc2luZ2FtPU1hdGguc2luKHRoaXMuZ2FtYSksdGhpcy5jb3NnYW09TWF0aC5jb3ModGhpcy5nYW1hKSx0aGlzLnNpbmF6PU1hdGguc2luKHRoaXMuYWxwaGEpLHRoaXMuY29zYXo9TWF0aC5jb3ModGhpcy5hbHBoYSksdGhpcy51PTA8PXRoaXMubGF0MD90aGlzLmFsL3RoaXMuYmwqTWF0aC5hdGFuKE1hdGguc3FydCh0aGlzLmQqdGhpcy5kLTEpL3RoaXMuY29zYXopOi0odGhpcy5hbC90aGlzLmJsKSpNYXRoLmF0YW4oTWF0aC5zcXJ0KHRoaXMuZCp0aGlzLmQtMSkvdGhpcy5jb3NheikpOlByb2o0anMucmVwb3J0RXJyb3IoXCJvbWVyYzpJbml0OkRhdGFFcnJvclwiKSk6KHRoaXMuc2lucGhpPU1hdGguc2luKHRoaXMuYXQxKSx0aGlzLnRzMT1Qcm9qNGpzLmNvbW1vbi50c2Zueih0aGlzLmUsdGhpcy5sYXQxLHRoaXMuc2lucGhpKSxcbnRoaXMuc2lucGhpPU1hdGguc2luKHRoaXMubGF0MiksdGhpcy50czI9UHJvajRqcy5jb21tb24udHNmbnoodGhpcy5lLHRoaXMubGF0Mix0aGlzLnNpbnBoaSksdGhpcy5oPU1hdGgucG93KHRoaXMudHMxLHRoaXMuYmwpLHRoaXMubD1NYXRoLnBvdyh0aGlzLnRzMix0aGlzLmJsKSx0aGlzLmY9dGhpcy5lbC90aGlzLmgsdGhpcy5nPTAuNSoodGhpcy5mLTEvdGhpcy5mKSx0aGlzLmo9KHRoaXMuZWwqdGhpcy5lbC10aGlzLmwqdGhpcy5oKS8odGhpcy5lbCp0aGlzLmVsK3RoaXMubCp0aGlzLmgpLHRoaXMucD0odGhpcy5sLXRoaXMuaCkvKHRoaXMubCt0aGlzLmgpLHRoaXMuZGxvbj10aGlzLmxvbjEtdGhpcy5sb24yLHRoaXMuZGxvbjwtUHJvajRqcy5jb21tb24uUEkmJih0aGlzLmxvbjItPTIqUHJvajRqcy5jb21tb24uUEkpLHRoaXMuZGxvbj5Qcm9qNGpzLmNvbW1vbi5QSSYmKHRoaXMubG9uMis9MipQcm9qNGpzLmNvbW1vbi5QSSksdGhpcy5kbG9uPXRoaXMubG9uMS10aGlzLmxvbjIsXG50aGlzLmxvbmdjPTAuNSoodGhpcy5sb24xK3RoaXMubG9uMiktTWF0aC5hdGFuKHRoaXMuaipNYXRoLnRhbigwLjUqdGhpcy5ibCp0aGlzLmRsb24pL3RoaXMucCkvdGhpcy5ibCx0aGlzLmRsb249UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbih0aGlzLmxvbjEtdGhpcy5sb25nYyksdGhpcy5nYW1hPU1hdGguYXRhbihNYXRoLnNpbih0aGlzLmJsKnRoaXMuZGxvbikvdGhpcy5nKSx0aGlzLmFscGhhPVByb2o0anMuY29tbW9uLmFzaW56KHRoaXMuZCpNYXRoLnNpbih0aGlzLmdhbWEpKSxNYXRoLmFicyh0aGlzLmxhdDEtdGhpcy5sYXQyKTw9UHJvajRqcy5jb21tb24uRVBTTE4/UHJvajRqcy5yZXBvcnRFcnJvcihcIm9tZXJjSW5pdERhdGFFcnJvclwiKTp0aGlzLmNvbj1NYXRoLmFicyh0aGlzLmxhdDEpLHRoaXMuY29uPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTnx8TWF0aC5hYnModGhpcy5jb24tUHJvajRqcy5jb21tb24uSEFMRl9QSSk8PVByb2o0anMuY29tbW9uLkVQU0xOP1Byb2o0anMucmVwb3J0RXJyb3IoXCJvbWVyY0luaXREYXRhRXJyb3JcIik6XG5NYXRoLmFicyhNYXRoLmFicyh0aGlzLmxhdDApLVByb2o0anMuY29tbW9uLkhBTEZfUEkpPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTiYmUHJvajRqcy5yZXBvcnRFcnJvcihcIm9tZXJjSW5pdERhdGFFcnJvclwiKSx0aGlzLnNpbmdhbT1NYXRoLnNpbih0aGlzLmdhbSksdGhpcy5jb3NnYW09TWF0aC5jb3ModGhpcy5nYW0pLHRoaXMuc2luYXo9TWF0aC5zaW4odGhpcy5hbHBoYSksdGhpcy5jb3Nhej1NYXRoLmNvcyh0aGlzLmFscGhhKSx0aGlzLnU9MDw9dGhpcy5sYXQwP3RoaXMuYWwvdGhpcy5ibCpNYXRoLmF0YW4oTWF0aC5zcXJ0KHRoaXMuZCp0aGlzLmQtMSkvdGhpcy5jb3Nheik6LSh0aGlzLmFsL3RoaXMuYmwpKk1hdGguYXRhbihNYXRoLnNxcnQodGhpcy5kKnRoaXMuZC0xKS90aGlzLmNvc2F6KSl9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGMsYixkLGUsZjtkPWEueDtiPWEueTtjPU1hdGguc2luKGIpO2U9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihkLXRoaXMubG9uZ2MpO1xuZD1NYXRoLnNpbih0aGlzLmJsKmUpO01hdGguYWJzKE1hdGguYWJzKGIpLVByb2o0anMuY29tbW9uLkhBTEZfUEkpPlByb2o0anMuY29tbW9uLkVQU0xOPyhjPVByb2o0anMuY29tbW9uLnRzZm56KHRoaXMuZSxiLGMpLGM9dGhpcy5lbC9NYXRoLnBvdyhjLHRoaXMuYmwpLGY9MC41KihjLTEvYyksYz0oZip0aGlzLnNpbmdhbS1kKnRoaXMuY29zZ2FtKS8oMC41KihjKzEvYykpLGI9TWF0aC5jb3ModGhpcy5ibCplKSwxLjBFLTc+TWF0aC5hYnMoYik/ZD10aGlzLmFsKnRoaXMuYmwqZTooZD10aGlzLmFsKk1hdGguYXRhbigoZip0aGlzLmNvc2dhbStkKnRoaXMuc2luZ2FtKS9iKS90aGlzLmJsLDA+YiYmKGQrPVByb2o0anMuY29tbW9uLlBJKnRoaXMuYWwvdGhpcy5ibCkpKTooYz0wPD1iP3RoaXMuc2luZ2FtOi10aGlzLnNpbmdhbSxkPXRoaXMuYWwqYi90aGlzLmJsKTtNYXRoLmFicyhNYXRoLmFicyhjKS0xKTw9UHJvajRqcy5jb21tb24uRVBTTE4mJlByb2o0anMucmVwb3J0RXJyb3IoXCJvbWVyY0Z3ZEluZmluaXR5XCIpO1xuZT0wLjUqdGhpcy5hbCpNYXRoLmxvZygoMS1jKS8oMStjKSkvdGhpcy5ibDtkLT10aGlzLnU7Yz10aGlzLnkwK2QqdGhpcy5jb3Nhei1lKnRoaXMuc2luYXo7YS54PXRoaXMueDArZSp0aGlzLmNvc2F6K2QqdGhpcy5zaW5hejthLnk9YztyZXR1cm4gYX0saW52ZXJzZTpmdW5jdGlvbihhKXt2YXIgYyxiLGQsZTthLngtPXRoaXMueDA7YS55LT10aGlzLnkwO2M9YS54KnRoaXMuY29zYXotYS55KnRoaXMuc2luYXo7ZD1hLnkqdGhpcy5jb3NheithLngqdGhpcy5zaW5hejtkKz10aGlzLnU7Yj1NYXRoLmV4cCgtdGhpcy5ibCpjL3RoaXMuYWwpO2M9MC41KihiLTEvYik7Yj0wLjUqKGIrMS9iKTtkPU1hdGguc2luKHRoaXMuYmwqZC90aGlzLmFsKTtlPShkKnRoaXMuY29zZ2FtK2MqdGhpcy5zaW5nYW0pL2I7TWF0aC5hYnMoTWF0aC5hYnMoZSktMSk8PVByb2o0anMuY29tbW9uLkVQU0xOPyhjPXRoaXMubG9uZ2MsZT0wPD1lP1Byb2o0anMuY29tbW9uLkhBTEZfUEk6LVByb2o0anMuY29tbW9uLkhBTEZfUEkpOlxuKGI9MS90aGlzLmJsLGU9TWF0aC5wb3codGhpcy5lbC9NYXRoLnNxcnQoKDErZSkvKDEtZSkpLGIpLGU9UHJvajRqcy5jb21tb24ucGhpMnoodGhpcy5lLGUpLGM9dGhpcy5sb25nYy1NYXRoLmF0YW4yKGMqdGhpcy5jb3NnYW0tZCp0aGlzLnNpbmdhbSxiKS90aGlzLmJsLGM9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihjKSk7YS54PWM7YS55PWU7cmV0dXJuIGF9fTtcblByb2o0anMuUHJvai5sY2M9e2luaXQ6ZnVuY3Rpb24oKXt0aGlzLmxhdDJ8fCh0aGlzLmxhdDI9dGhpcy5sYXQwKTt0aGlzLmswfHwodGhpcy5rMD0xKTtpZihNYXRoLmFicyh0aGlzLmxhdDErdGhpcy5sYXQyKTxQcm9qNGpzLmNvbW1vbi5FUFNMTilQcm9qNGpzLnJlcG9ydEVycm9yKFwibGNjOmluaXQ6IEVxdWFsIExhdGl0dWRlc1wiKTtlbHNle3ZhciBhPXRoaXMuYi90aGlzLmE7dGhpcy5lPU1hdGguc3FydCgxLWEqYSk7dmFyIGE9TWF0aC5zaW4odGhpcy5sYXQxKSxjPU1hdGguY29zKHRoaXMubGF0MSksYz1Qcm9qNGpzLmNvbW1vbi5tc2Zueih0aGlzLmUsYSxjKSxiPVByb2o0anMuY29tbW9uLnRzZm56KHRoaXMuZSx0aGlzLmxhdDEsYSksZD1NYXRoLnNpbih0aGlzLmxhdDIpLGU9TWF0aC5jb3ModGhpcy5sYXQyKSxlPVByb2o0anMuY29tbW9uLm1zZm56KHRoaXMuZSxkLGUpLGQ9UHJvajRqcy5jb21tb24udHNmbnoodGhpcy5lLHRoaXMubGF0MixkKSxmPVByb2o0anMuY29tbW9uLnRzZm56KHRoaXMuZSxcbnRoaXMubGF0MCxNYXRoLnNpbih0aGlzLmxhdDApKTt0aGlzLm5zPU1hdGguYWJzKHRoaXMubGF0MS10aGlzLmxhdDIpPlByb2o0anMuY29tbW9uLkVQU0xOP01hdGgubG9nKGMvZSkvTWF0aC5sb2coYi9kKTphO3RoaXMuZjA9Yy8odGhpcy5ucypNYXRoLnBvdyhiLHRoaXMubnMpKTt0aGlzLnJoPXRoaXMuYSp0aGlzLmYwKk1hdGgucG93KGYsdGhpcy5ucyk7dGhpcy50aXRsZXx8KHRoaXMudGl0bGU9XCJMYW1iZXJ0IENvbmZvcm1hbCBDb25pY1wiKX19LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGM9YS54LGI9YS55O2lmKCEoOTA+PWImJi05MDw9YiYmMTgwPj1jJiYtMTgwPD1jKSlyZXR1cm4gUHJvajRqcy5yZXBvcnRFcnJvcihcImxjYzpmb3J3YXJkOiBsbElucHV0T3V0T2ZSYW5nZTogXCIrYytcIiA6IFwiK2IpLG51bGw7dmFyIGQ9TWF0aC5hYnMoTWF0aC5hYnMoYiktUHJvajRqcy5jb21tb24uSEFMRl9QSSk7aWYoZD5Qcm9qNGpzLmNvbW1vbi5FUFNMTiliPVByb2o0anMuY29tbW9uLnRzZm56KHRoaXMuZSxcbmIsTWF0aC5zaW4oYikpLGI9dGhpcy5hKnRoaXMuZjAqTWF0aC5wb3coYix0aGlzLm5zKTtlbHNle2Q9Yip0aGlzLm5zO2lmKDA+PWQpcmV0dXJuIFByb2o0anMucmVwb3J0RXJyb3IoXCJsY2M6Zm9yd2FyZDogTm8gUHJvamVjdGlvblwiKSxudWxsO2I9MH1jPXRoaXMubnMqUHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihjLXRoaXMubG9uZzApO2EueD10aGlzLmswKmIqTWF0aC5zaW4oYykrdGhpcy54MDthLnk9dGhpcy5rMCoodGhpcy5yaC1iKk1hdGguY29zKGMpKSt0aGlzLnkwO3JldHVybiBhfSxpbnZlcnNlOmZ1bmN0aW9uKGEpe3ZhciBjLGIsZCxlPShhLngtdGhpcy54MCkvdGhpcy5rMCxmPXRoaXMucmgtKGEueS10aGlzLnkwKS90aGlzLmswOzA8dGhpcy5ucz8oYz1NYXRoLnNxcnQoZSplK2YqZiksYj0xKTooYz0tTWF0aC5zcXJ0KGUqZStmKmYpLGI9LTEpO2Q9MDswIT1jJiYoZD1NYXRoLmF0YW4yKGIqZSxiKmYpKTtpZigwIT1jfHwwPHRoaXMubnMpe2lmKGI9MS90aGlzLm5zLFxuYz1NYXRoLnBvdyhjLyh0aGlzLmEqdGhpcy5mMCksYiksYz1Qcm9qNGpzLmNvbW1vbi5waGkyeih0aGlzLmUsYyksLTk5OTk9PWMpcmV0dXJuIG51bGx9ZWxzZSBjPS1Qcm9qNGpzLmNvbW1vbi5IQUxGX1BJO2Q9UHJvajRqcy5jb21tb24uYWRqdXN0X2xvbihkL3RoaXMubnMrdGhpcy5sb25nMCk7YS54PWQ7YS55PWM7cmV0dXJuIGF9fTtcblByb2o0anMuUHJvai5sYWVhPXtTX1BPTEU6MSxOX1BPTEU6MixFUVVJVDozLE9CTElROjQsaW5pdDpmdW5jdGlvbigpe3ZhciBhPU1hdGguYWJzKHRoaXMubGF0MCk7dGhpcy5tb2RlPU1hdGguYWJzKGEtUHJvajRqcy5jb21tb24uSEFMRl9QSSk8UHJvajRqcy5jb21tb24uRVBTTE4/MD50aGlzLmxhdDA/dGhpcy5TX1BPTEU6dGhpcy5OX1BPTEU6TWF0aC5hYnMoYSk8UHJvajRqcy5jb21tb24uRVBTTE4/dGhpcy5FUVVJVDp0aGlzLk9CTElRO2lmKDA8dGhpcy5lcylzd2l0Y2godGhpcy5xcD1Qcm9qNGpzLmNvbW1vbi5xc2Zueih0aGlzLmUsMSksdGhpcy5tbWY9MC41LygxLXRoaXMuZXMpLHRoaXMuYXBhPXRoaXMuYXV0aHNldCh0aGlzLmVzKSx0aGlzLm1vZGUpe2Nhc2UgdGhpcy5OX1BPTEU6Y2FzZSB0aGlzLlNfUE9MRTp0aGlzLmRkPTE7YnJlYWs7Y2FzZSB0aGlzLkVRVUlUOnRoaXMucnE9TWF0aC5zcXJ0KDAuNSp0aGlzLnFwKTt0aGlzLmRkPTEvdGhpcy5ycTt0aGlzLnhtZj1cbjE7dGhpcy55bWY9MC41KnRoaXMucXA7YnJlYWs7Y2FzZSB0aGlzLk9CTElROnRoaXMucnE9TWF0aC5zcXJ0KDAuNSp0aGlzLnFwKSxhPU1hdGguc2luKHRoaXMubGF0MCksdGhpcy5zaW5iMT1Qcm9qNGpzLmNvbW1vbi5xc2Zueih0aGlzLmUsYSkvdGhpcy5xcCx0aGlzLmNvc2IxPU1hdGguc3FydCgxLXRoaXMuc2luYjEqdGhpcy5zaW5iMSksdGhpcy5kZD1NYXRoLmNvcyh0aGlzLmxhdDApLyhNYXRoLnNxcnQoMS10aGlzLmVzKmEqYSkqdGhpcy5ycSp0aGlzLmNvc2IxKSx0aGlzLnltZj0odGhpcy54bWY9dGhpcy5ycSkvdGhpcy5kZCx0aGlzLnhtZio9dGhpcy5kZH1lbHNlIHRoaXMubW9kZT09dGhpcy5PQkxJUSYmKHRoaXMuc2lucGgwPU1hdGguc2luKHRoaXMubGF0MCksdGhpcy5jb3NwaDA9TWF0aC5jb3ModGhpcy5sYXQwKSl9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGMsYixkPWEueCxlPWEueSxkPVByb2o0anMuY29tbW9uLmFkanVzdF9sb24oZC10aGlzLmxvbmcwKTtpZih0aGlzLnNwaGVyZSl7dmFyIGYsXG5nLGk7aT1NYXRoLnNpbihlKTtnPU1hdGguY29zKGUpO2Y9TWF0aC5jb3MoZCk7c3dpdGNoKHRoaXMubW9kZSl7Y2FzZSB0aGlzLk9CTElROmNhc2UgdGhpcy5FUVVJVDpiPXRoaXMubW9kZT09dGhpcy5FUVVJVD8xK2cqZjoxK3RoaXMuc2lucGgwKmkrdGhpcy5jb3NwaDAqZypmO2lmKGI8PVByb2o0anMuY29tbW9uLkVQU0xOKXJldHVybiBQcm9qNGpzLnJlcG9ydEVycm9yKFwibGFlYTpmd2Q6eSBsZXNzIHRoYW4gZXBzXCIpLG51bGw7Yj1NYXRoLnNxcnQoMi9iKTtjPWIqZypNYXRoLnNpbihkKTtiKj10aGlzLm1vZGU9PXRoaXMuRVFVSVQ/aTp0aGlzLmNvc3BoMCppLXRoaXMuc2lucGgwKmcqZjticmVhaztjYXNlIHRoaXMuTl9QT0xFOmY9LWY7Y2FzZSB0aGlzLlNfUE9MRTppZihNYXRoLmFicyhlK3RoaXMucGhpMCk8UHJvajRqcy5jb21tb24uRVBTTE4pcmV0dXJuIFByb2o0anMucmVwb3J0RXJyb3IoXCJsYWVhOmZ3ZDpwaGkgPCBlcHNcIiksbnVsbDtiPVByb2o0anMuY29tbW9uLkZPUlRQSS1cbjAuNSplO2I9MioodGhpcy5tb2RlPT10aGlzLlNfUE9MRT9NYXRoLmNvcyhiKTpNYXRoLnNpbihiKSk7Yz1iKk1hdGguc2luKGQpO2IqPWZ9fWVsc2V7dmFyIGg9Zz0wLGo9MDtmPU1hdGguY29zKGQpO2Q9TWF0aC5zaW4oZCk7aT1NYXRoLnNpbihlKTtpPVByb2o0anMuY29tbW9uLnFzZm56KHRoaXMuZSxpKTtpZih0aGlzLm1vZGU9PXRoaXMuT0JMSVF8fHRoaXMubW9kZT09dGhpcy5FUVVJVClnPWkvdGhpcy5xcCxoPU1hdGguc3FydCgxLWcqZyk7c3dpdGNoKHRoaXMubW9kZSl7Y2FzZSB0aGlzLk9CTElROmo9MSt0aGlzLnNpbmIxKmcrdGhpcy5jb3NiMSpoKmY7YnJlYWs7Y2FzZSB0aGlzLkVRVUlUOmo9MStoKmY7YnJlYWs7Y2FzZSB0aGlzLk5fUE9MRTpqPVByb2o0anMuY29tbW9uLkhBTEZfUEkrZTtpPXRoaXMucXAtaTticmVhaztjYXNlIHRoaXMuU19QT0xFOmo9ZS1Qcm9qNGpzLmNvbW1vbi5IQUxGX1BJLGk9dGhpcy5xcCtpfWlmKE1hdGguYWJzKGopPFByb2o0anMuY29tbW9uLkVQU0xOKXJldHVybiBQcm9qNGpzLnJlcG9ydEVycm9yKFwibGFlYTpmd2Q6YiA8IGVwc1wiKSxcbm51bGw7c3dpdGNoKHRoaXMubW9kZSl7Y2FzZSB0aGlzLk9CTElROmNhc2UgdGhpcy5FUVVJVDpqPU1hdGguc3FydCgyL2opO2I9dGhpcy5tb2RlPT10aGlzLk9CTElRP3RoaXMueW1mKmoqKHRoaXMuY29zYjEqZy10aGlzLnNpbmIxKmgqZik6KGo9TWF0aC5zcXJ0KDIvKDEraCpmKSkpKmcqdGhpcy55bWY7Yz10aGlzLnhtZipqKmgqZDticmVhaztjYXNlIHRoaXMuTl9QT0xFOmNhc2UgdGhpcy5TX1BPTEU6MDw9aT8oYz0oaj1NYXRoLnNxcnQoaSkpKmQsYj1mKih0aGlzLm1vZGU9PXRoaXMuU19QT0xFP2o6LWopKTpjPWI9MH19YS54PXRoaXMuYSpjK3RoaXMueDA7YS55PXRoaXMuYSpiK3RoaXMueTA7cmV0dXJuIGF9LGludmVyc2U6ZnVuY3Rpb24oYSl7YS54LT10aGlzLngwO2EueS09dGhpcy55MDt2YXIgYz1hLngvdGhpcy5hLGI9YS55L3RoaXMuYSxkO2lmKHRoaXMuc3BoZXJlKXt2YXIgZT0wLGYsZz0wO2Y9TWF0aC5zcXJ0KGMqYytiKmIpO2Q9MC41KmY7aWYoMTxkKXJldHVybiBQcm9qNGpzLnJlcG9ydEVycm9yKFwibGFlYTpJbnY6RGF0YUVycm9yXCIpLFxubnVsbDtkPTIqTWF0aC5hc2luKGQpO2lmKHRoaXMubW9kZT09dGhpcy5PQkxJUXx8dGhpcy5tb2RlPT10aGlzLkVRVUlUKWc9TWF0aC5zaW4oZCksZT1NYXRoLmNvcyhkKTtzd2l0Y2godGhpcy5tb2RlKXtjYXNlIHRoaXMuRVFVSVQ6ZD1NYXRoLmFicyhmKTw9UHJvajRqcy5jb21tb24uRVBTTE4/MDpNYXRoLmFzaW4oYipnL2YpO2MqPWc7Yj1lKmY7YnJlYWs7Y2FzZSB0aGlzLk9CTElROmQ9TWF0aC5hYnMoZik8PVByb2o0anMuY29tbW9uLkVQU0xOP3RoaXMucGhpMDpNYXRoLmFzaW4oZSp0aGlzLnNpbnBoMCtiKmcqdGhpcy5jb3NwaDAvZik7Yyo9Zyp0aGlzLmNvc3BoMDtiPShlLU1hdGguc2luKGQpKnRoaXMuc2lucGgwKSpmO2JyZWFrO2Nhc2UgdGhpcy5OX1BPTEU6Yj0tYjtkPVByb2o0anMuY29tbW9uLkhBTEZfUEktZDticmVhaztjYXNlIHRoaXMuU19QT0xFOmQtPVByb2o0anMuY29tbW9uLkhBTEZfUEl9Yz0wPT1iJiYodGhpcy5tb2RlPT10aGlzLkVRVUlUfHx0aGlzLm1vZGU9PVxudGhpcy5PQkxJUSk/MDpNYXRoLmF0YW4yKGMsYil9ZWxzZXtkPTA7c3dpdGNoKHRoaXMubW9kZSl7Y2FzZSB0aGlzLkVRVUlUOmNhc2UgdGhpcy5PQkxJUTpjLz10aGlzLmRkO2IqPXRoaXMuZGQ7Zz1NYXRoLnNxcnQoYypjK2IqYik7aWYoZzxQcm9qNGpzLmNvbW1vbi5FUFNMTilyZXR1cm4gYS54PTAsYS55PXRoaXMucGhpMCxhO2Y9MipNYXRoLmFzaW4oMC41KmcvdGhpcy5ycSk7ZT1NYXRoLmNvcyhmKTtjKj1mPU1hdGguc2luKGYpO3RoaXMubW9kZT09dGhpcy5PQkxJUT8oZD1lKnRoaXMuc2luYjErYipmKnRoaXMuY29zYjEvZyxiPWcqdGhpcy5jb3NiMSplLWIqdGhpcy5zaW5iMSpmKTooZD1iKmYvZyxiPWcqZSk7YnJlYWs7Y2FzZSB0aGlzLk5fUE9MRTpiPS1iO2Nhc2UgdGhpcy5TX1BPTEU6ZD1jKmMrYipiO2lmKCFkKXJldHVybiBhLng9MCxhLnk9dGhpcy5waGkwLGE7ZD0xLWQvdGhpcy5xcDt0aGlzLm1vZGU9PXRoaXMuU19QT0xFJiYoZD0tZCl9Yz1NYXRoLmF0YW4yKGMsXG5iKTtkPXRoaXMuYXV0aGxhdChNYXRoLmFzaW4oZCksdGhpcy5hcGEpfWEueD1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKHRoaXMubG9uZzArYyk7YS55PWQ7cmV0dXJuIGF9LFAwMDowLjMzMzMzMzMzMzMzMzMzMzMsUDAxOjAuMTcyMjIyMjIyMjIyMjIyMjIsUDAyOjAuMTAyNTc5MzY1MDc5MzY1MDgsUDEwOjAuMDYzODg4ODg4ODg4ODg4ODgsUDExOjAuMDY2NDAyMTE2NDAyMTE2NCxQMjA6MC4wMTY0MTUwMTI5NDIxOTE1NDMsYXV0aHNldDpmdW5jdGlvbihhKXt2YXIgYyxiPVtdO2JbMF09YSp0aGlzLlAwMDtjPWEqYTtiWzBdKz1jKnRoaXMuUDAxO2JbMV09Yyp0aGlzLlAxMDtjKj1hO2JbMF0rPWMqdGhpcy5QMDI7YlsxXSs9Yyp0aGlzLlAxMTtiWzJdPWMqdGhpcy5QMjA7cmV0dXJuIGJ9LGF1dGhsYXQ6ZnVuY3Rpb24oYSxjKXt2YXIgYj1hK2E7cmV0dXJuIGErY1swXSpNYXRoLnNpbihiKStjWzFdKk1hdGguc2luKGIrYikrY1syXSpNYXRoLnNpbihiK2IrYil9fTtcblByb2o0anMuUHJvai5hZXFkPXtpbml0OmZ1bmN0aW9uKCl7dGhpcy5zaW5fcDEyPU1hdGguc2luKHRoaXMubGF0MCk7dGhpcy5jb3NfcDEyPU1hdGguY29zKHRoaXMubGF0MCl9LGZvcndhcmQ6ZnVuY3Rpb24oYSl7dmFyIGM9YS54LGIsZD1NYXRoLnNpbihhLnkpLGU9TWF0aC5jb3MoYS55KSxjPVByb2o0anMuY29tbW9uLmFkanVzdF9sb24oYy10aGlzLmxvbmcwKSxmPU1hdGguY29zKGMpLGc9dGhpcy5zaW5fcDEyKmQrdGhpcy5jb3NfcDEyKmUqZjtpZihNYXRoLmFicyhNYXRoLmFicyhnKS0xKTxQcm9qNGpzLmNvbW1vbi5FUFNMTil7aWYoYj0xLDA+Zyl7UHJvajRqcy5yZXBvcnRFcnJvcihcImFlcWQ6RndkOlBvaW50RXJyb3JcIik7cmV0dXJufX1lbHNlIGI9TWF0aC5hY29zKGcpLGIvPU1hdGguc2luKGIpO2EueD10aGlzLngwK3RoaXMuYSpiKmUqTWF0aC5zaW4oYyk7YS55PXRoaXMueTArdGhpcy5hKmIqKHRoaXMuY29zX3AxMipkLXRoaXMuc2luX3AxMiplKmYpO3JldHVybiBhfSxcbmludmVyc2U6ZnVuY3Rpb24oYSl7YS54LT10aGlzLngwO2EueS09dGhpcy55MDt2YXIgYz1NYXRoLnNxcnQoYS54KmEueCthLnkqYS55KTtpZihjPjIqUHJvajRqcy5jb21tb24uSEFMRl9QSSp0aGlzLmEpUHJvajRqcy5yZXBvcnRFcnJvcihcImFlcWRJbnZEYXRhRXJyb3JcIik7ZWxzZXt2YXIgYj1jL3RoaXMuYSxkPU1hdGguc2luKGIpLGI9TWF0aC5jb3MoYiksZT10aGlzLmxvbmcwLGY7aWYoTWF0aC5hYnMoYyk8PVByb2o0anMuY29tbW9uLkVQU0xOKWY9dGhpcy5sYXQwO2Vsc2V7Zj1Qcm9qNGpzLmNvbW1vbi5hc2lueihiKnRoaXMuc2luX3AxMithLnkqZCp0aGlzLmNvc19wMTIvYyk7dmFyIGc9TWF0aC5hYnModGhpcy5sYXQwKS1Qcm9qNGpzLmNvbW1vbi5IQUxGX1BJO01hdGguYWJzKGcpPD1Qcm9qNGpzLmNvbW1vbi5FUFNMTj9lPTA8PXRoaXMubGF0MD9Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKHRoaXMubG9uZzArTWF0aC5hdGFuMihhLngsLWEueSkpOlByb2o0anMuY29tbW9uLmFkanVzdF9sb24odGhpcy5sb25nMC1cbk1hdGguYXRhbjIoLWEueCxhLnkpKTooZz1iLXRoaXMuc2luX3AxMipNYXRoLnNpbihmKSxNYXRoLmFicyhnKTxQcm9qNGpzLmNvbW1vbi5FUFNMTiYmTWF0aC5hYnMoYS54KTxQcm9qNGpzLmNvbW1vbi5FUFNMTnx8KE1hdGguYXRhbjIoYS54KmQqdGhpcy5jb3NfcDEyLGcqYyksZT1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKHRoaXMubG9uZzArTWF0aC5hdGFuMihhLngqZCp0aGlzLmNvc19wMTIsZypjKSkpKX1hLng9ZTthLnk9ZjtyZXR1cm4gYX19fTtcblByb2o0anMuUHJvai5tb2xsPXtpbml0OmZ1bmN0aW9uKCl7fSxmb3J3YXJkOmZ1bmN0aW9uKGEpe2Zvcih2YXIgYz1hLnksYj1Qcm9qNGpzLmNvbW1vbi5hZGp1c3RfbG9uKGEueC10aGlzLmxvbmcwKSxkPWMsZT1Qcm9qNGpzLmNvbW1vbi5QSSpNYXRoLnNpbihjKSxmPTA7O2YrKyl7dmFyIGc9LShkK01hdGguc2luKGQpLWUpLygxK01hdGguY29zKGQpKSxkPWQrZztpZihNYXRoLmFicyhnKTxQcm9qNGpzLmNvbW1vbi5FUFNMTilicmVhazs1MDw9ZiYmUHJvajRqcy5yZXBvcnRFcnJvcihcIm1vbGw6RndkOkl0ZXJhdGlvbkVycm9yXCIpfWQvPTI7UHJvajRqcy5jb21tb24uUEkvMi1NYXRoLmFicyhjKTxQcm9qNGpzLmNvbW1vbi5FUFNMTiYmKGI9MCk7Yz0wLjkwMDMxNjMxNjE1OCp0aGlzLmEqYipNYXRoLmNvcyhkKSt0aGlzLngwO2Q9MS40MTQyMTM1NjIzNzMxKnRoaXMuYSpNYXRoLnNpbihkKSt0aGlzLnkwO2EueD1jO2EueT1kO3JldHVybiBhfSxpbnZlcnNlOmZ1bmN0aW9uKGEpe3ZhciBjO1xuYS54LT10aGlzLngwO2M9YS55LygxLjQxNDIxMzU2MjM3MzEqdGhpcy5hKTswLjk5OTk5OTk5OTk5OTxNYXRoLmFicyhjKSYmKGM9MC45OTk5OTk5OTk5OTkpO2M9TWF0aC5hc2luKGMpO3ZhciBiPVByb2o0anMuY29tbW9uLmFkanVzdF9sb24odGhpcy5sb25nMCthLngvKDAuOTAwMzE2MzE2MTU4KnRoaXMuYSpNYXRoLmNvcyhjKSkpO2I8LVByb2o0anMuY29tbW9uLlBJJiYoYj0tUHJvajRqcy5jb21tb24uUEkpO2I+UHJvajRqcy5jb21tb24uUEkmJihiPVByb2o0anMuY29tbW9uLlBJKTtjPSgyKmMrTWF0aC5zaW4oMipjKSkvUHJvajRqcy5jb21tb24uUEk7MTxNYXRoLmFicyhjKSYmKGM9MSk7Yz1NYXRoLmFzaW4oYyk7YS54PWI7YS55PWM7cmV0dXJuIGF9fTtcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvajRqcztcbiIsIi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbmZ1bmN0aW9uIFJHQkFDb2xvciAocixnLGIsYSkge1xyXG4gICAgaWYgKHR5cGVvZiAoYSkgPT0gXCJ1bmRlZmluZWRcIil7XHJcbiAgICAgICAgYSA9IDEuMDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5yID0gcjtcclxuICAgIHRoaXMuZyA9IGc7XHJcbiAgICB0aGlzLmIgPSBiO1xyXG4gICAgdGhpcy5hID0gYTtcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuUkdCQUNvbG9yLnByb3RvdHlwZS5HZXRXaXRoICA9IGZ1bmN0aW9uKCBpbkMgLCBpblQgKXtcclxuICAgIHJldHVybiBuZXcgUkdCQUNvbG9yKHRoaXMucix0aGlzLmcsdGhpcy5iLHRoaXMuYSk7XHJcbn1cclxuXHJcblJHQkFDb2xvci5wcm90b3R5cGUuUkdCQSAgPSBmdW5jdGlvbiggICl7XHJcbiAgICByZXR1cm4gWyB0aGlzLnIsIHRoaXMuZywgdGhpcy5iICwgdGhpcy5hIF07XHJcbn1cclxuXHJcblJHQkFDb2xvci5wcm90b3R5cGUuUkdCQWkgID0gZnVuY3Rpb24oICApe1xyXG4gICAgcmV0dXJuIFsgdGhpcy5SaSgpLCB0aGlzLkdpKCksIHRoaXMuQmkoKSAsIHRoaXMuQWkoKSBdO1xyXG59XHJcblxyXG5SR0JBQ29sb3IucHJvdG90eXBlLlJpICA9IGZ1bmN0aW9uKCAgKXtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKCBNYXRoLm1pbihNYXRoLm1heCggdGhpcy5yICwgMC4wICApLCAxLjAgKSAqIDI1NSApO1xyXG59XHJcblxyXG5SR0JBQ29sb3IucHJvdG90eXBlLkdpICA9IGZ1bmN0aW9uKCAgKXtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKCBNYXRoLm1pbihNYXRoLm1heCggdGhpcy5nICwgMC4wICApLCAxLjAgKSAqIDI1NSApO1xyXG59XHJcblxyXG5SR0JBQ29sb3IucHJvdG90eXBlLkJpICA9IGZ1bmN0aW9uKCAgKXtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKCBNYXRoLm1pbihNYXRoLm1heCggdGhpcy5iICwgMC4wICApLCAxLjAgKSAqIDI1NSApO1xyXG59XHJcblxyXG5SR0JBQ29sb3IucHJvdG90eXBlLkFpICA9IGZ1bmN0aW9uKCAgKXtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKCBNYXRoLm1pbihNYXRoLm1heCggdGhpcy5hICwgMC4wICApLCAxLjAgKSAqIDI1NSApO1xyXG59XHJcblxyXG5SR0JBQ29sb3IucHJvdG90eXBlLlRvQ2FudmFzID0gZnVuY3Rpb24oICApIHtcclxuICAgIHZhciByID0gTWF0aC5tYXggKCBNYXRoLm1pbiAoIE1hdGgucm91bmQgKCB0aGlzLnIgKiAyNTUgKSAsIDI1NSApICwgMCApO1xyXG4gICAgdmFyIGcgPSBNYXRoLm1heCAoIE1hdGgubWluICggTWF0aC5yb3VuZCAoIHRoaXMuZyAqIDI1NSApICwgMjU1ICkgLCAwICk7XHJcbiAgICB2YXIgYiA9IE1hdGgubWF4ICggTWF0aC5taW4gKCBNYXRoLnJvdW5kICggdGhpcy5iICogMjU1ICkgLCAyNTUgKSAsIDAgKTtcclxuICAgIHZhciBhID0gTWF0aC5tYXggKCBNYXRoLm1pbiAoICB0aGlzLmEgLCAxLjAgKSAsIDAuMCApO1xyXG4gICAgcmV0dXJuIFwicmdiYShcIityK1wiLFwiK2crXCIsXCIrYitcIixcIithK1wiKVwiO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJHQkFDb2xvcjtcclxuIiwiLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuZnVuY3Rpb24gVXRpbHMoKXt9O1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG4vL1V0aWxzLnByb3RvdHlwZS5ibGFja1Njcm9sbFRyYWNrID0gZnVuY3Rpb24oKXtcbi8vdmFyIHJ1bGVzID0gZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uY3NzUnVsZXM7XG4vL2Zvcih2YXIgaT0wOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcbi8vaWYocnVsZXNbaV0udHlwZSAhPSAxKVxuLy9jb25zb2xlLmxvZyhydWxlc1tpXSk7XG4vL31cblxuLy9kb2N1bWVudC5zdHlsZVNoZWV0c1swXS5hZGRSdWxlKFwiOjotd2Via2l0LXNjcm9sbGJhci10cmFja1wiLCBcImJhY2tncm91bmQ6IHJnYmEoMCwwLDAsMCk7XCIpO1xuLy99IFxuXG4vKlxuICogemVyb1BhZCg1LCAyKSBcdC0tPiBcIjA1XCJcbiAgIHplcm9QYWQoMTIzNCwgMikgLS0+IFwiMTIzNFwiXG4gKi9cblV0aWxzLnByb3RvdHlwZS56ZXJvUGFkID0gZnVuY3Rpb24obnVtLCBwbGFjZXMpIFxue1xuICAgdmFyIHplcm8gPSBwbGFjZXMgLSBudW0udG9TdHJpbmcoKS5sZW5ndGggKyAxO1xuICAgcmV0dXJuIEFycmF5KCsoemVybyA+IDAgJiYgemVybykpLmpvaW4oXCIwXCIpICsgbnVtO1xufVxuXG4vKlxuICogbm93IGFzIFlZWVktTU0tRERcbiAqL1xuVXRpbHMucHJvdG90eXBlLmRhdGVUaW1lID0gZnVuY3Rpb24oKVxue1xuICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICByZXR1cm4gbm93LmdldEZ1bGxZZWFyKCkgKyBcIi1cIiBcbiAgICsgdGhpcy56ZXJvUGFkKG5vdy5nZXRNb250aCgpKzEsIDIpICsgXCItXCIgXG4gICArIHRoaXMuemVyb1BhZChub3cuZ2V0RGF0ZSgpLCAyKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuVXRpbHMucHJvdG90eXBlLmFsZXJ0ID0gZnVuY3Rpb24gKGFyZWEsIHR5cGUsIHRpdGxlLCBtZXNzYWdlKSB7XG4gICAkKFwiI1wiICsgYXJlYSkuYXBwZW5kKCQoXCI8ZGl2IGNsYXNzPSdhbGVydC1tZXNzYWdlIGFsZXJ0LVwiICsgdHlwZSArIFwiIGZhZGUgaW4nIGRhdGEtYWxlcnQ+PGEgY2xhc3M9XFxcImJ0biBidG4tcm91bmRlZCBidG4taWNvbi1vbmx5IGJ0bi1kYXJrIGNsb3NlclxcXCIgZGF0YS1kaXNtaXNzPVxcXCJhbGVydFxcXCI+IDxpIGNsYXNzPVxcXCJpY29uIGljb24tZXgtd2hpdGUtb3V0bGluZVxcXCI+PC9pPjwvYT48aDQgY2xhc3M9XFxcImFsZXJ0LWhlYWRpbmdcXFwiPlwiK3RpdGxlK1wiPC9oND4gXCIgKyBtZXNzYWdlICsgXCIgPC9kaXY+XCIpKTtcbiAgIC8vJChcIi5hbGVydC1tZXNzYWdlXCIpLmRlbGF5KDIwMDApLmZhZGVPdXQoXCJzbG93XCIsIGZ1bmN0aW9uICgpIHsgJCh0aGlzKS5yZW1vdmUoKTsgfSk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbi8qXG4gKiBoZWxwZXJzIGZvciBodG1sIGVuY29kaW5nIGFuZCBkZWNvZGluZ1xuICovXG5VdGlscy5wcm90b3R5cGUuaHRtbEVuY29kZSA9IGZ1bmN0aW9uICh2YWx1ZSl7XG4gICByZXR1cm4gJCgnPGRpdi8+JykudGV4dCh2YWx1ZSkuaHRtbCgpO1xufVxuXG5VdGlscy5wcm90b3R5cGUuaHRtbERlY29kZSA9IGZ1bmN0aW9uKHZhbHVlKXtcbiAgIHJldHVybiAkKCc8ZGl2Lz4nKS5odG1sKHZhbHVlKS50ZXh0KCk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbi8qXG4gKi9cblV0aWxzLnByb3RvdHlwZS5yZXBsYWNlQWxsID0gZnVuY3Rpb24oY2hhaW4sIHZhbHVlLCByZXBsYWNlbWVudClcbntcbiAgIHJldHVybiBjaGFpbi5yZXBsYWNlKG5ldyBSZWdFeHAodmFsdWUsICdnJyksIHJlcGxhY2VtZW50KTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuVXRpbHMucHJvdG90eXBlLnJnYlRvSGV4ID0gZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgIGlmIChyID4gMjU1IHx8IGcgPiAyNTUgfHwgYiA+IDI1NSlcbiAgICAgIHRocm93IFwiSW52YWxpZCBjb2xvciBjb21wb25lbnRcIjtcbiAgIHJldHVybiAoKHIgPDwgMTYpIHwgKGcgPDwgOCkgfCBiKS50b1N0cmluZygxNik7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbi8qKipcbiAqIGJ5dGVzID0gMzY1NTBcbiAqIHJldHVybiAzNi41NSBLQlxuICovXG5VdGlscy5wcm90b3R5cGUuZm9ybWF0RmlsZVNpemUgPSBmdW5jdGlvbiAoYnl0ZXMpIFxue1xuICAgaWYgKHR5cGVvZiBieXRlcyAhPT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiAnJztcbiAgIH1cbiAgIGlmIChieXRlcyA+PSAxMDAwMDAwMDAwKSB7XG4gICAgICByZXR1cm4gKGJ5dGVzIC8gMTAwMDAwMDAwMCkudG9GaXhlZCgyKSArICcgR0InO1xuICAgfVxuICAgaWYgKGJ5dGVzID49IDEwMDAwMDApIHtcbiAgICAgIHJldHVybiAoYnl0ZXMgLyAxMDAwMDAwKS50b0ZpeGVkKDIpICsgJyBNQic7XG4gICB9XG4gICByZXR1cm4gKGJ5dGVzIC8gMTAwMCkudG9GaXhlZCgyKSArICcgS0InO1xufVxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuLyoqKlxuICogdGltZXN0YW1wID0gMTM1NTM0MjM4OTcxMVxuICogcmV0dXJuIDEyLzEyLzIwMTJcbiAqIFxuICogdGltZXN0YW1wID0gdW5kZWZpbmVkID0+IHVzZSB0b2RheS5cbiAqIFxuICogQEltcHJvdmUgI01BUC0xMlxuICovXG5VdGlscy5wcm90b3R5cGUuZm9ybWF0RGF0ZSA9IGZ1bmN0aW9uKHRpbWVzdGFtcCkgXG57XG4gICB2YXIgbm93ID0gdGltZXN0YW1wID09IHVuZGVmaW5lZCA/IG5ldyBEYXRlKCkgOiBuZXcgRGF0ZSh0aW1lc3RhbXApO1xuICAgdmFyIGRheSA9IHRoaXMuemVyb1BhZChub3cuZ2V0RGF0ZSgpLCAyKTtcbiAgIHZhciBtb250aCA9IHRoaXMuemVyb1BhZChub3cuZ2V0TW9udGgoKSArIDEsIDIpOyAvL01vbnRocyBhcmUgemVybyBiYXNlZFxuICAgdmFyIHllYXIgPSBub3cuZ2V0RnVsbFllYXIoKTtcblxuICAgcmV0dXJuIGRheSArIFwiL1wiICsgbW9udGggKyBcIi9cIiArIHllYXI7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbi8vcmV0dXJuIDEtPmlcblV0aWxzLnByb3RvdHlwZS5yYW5kb20xID0gZnVuY3Rpb24oaSl7XG4gICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmkpICsgMTtcbn1cblxuLy9yZXR1cm4gMC0+aVxuVXRpbHMucHJvdG90eXBlLnJhbmRvbTAgPSBmdW5jdGlvbihpKXtcbiAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqKGkrMSkpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5VdGlscy5wcm90b3R5cGUuZ2VuZXJhdGVHdWlkID0gZnVuY3Rpb24oKSBcbntcbiAgIHZhciByZXN1bHQsIGksIGo7XG4gICByZXN1bHQgPSAnJztcbiAgIGZvcihqPTA7IGo8MzI7IGorKykge1xuICAgICAgaWYoIGogPT0gOCB8fCBqID09IDEyfHwgaiA9PSAxNnx8IGogPT0gMjApXG4gICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnXyc7XG4gICAgICBpID0gdGhpcy5yYW5kb20wKDE1KS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcbiAgICAgIHJlc3VsdCA9IHJlc3VsdCArIGk7XG4gICB9XG4gICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5VdGlscy5wcm90b3R5cGUuZ2VuZXJhdGVVSUQgPSBmdW5jdGlvbigpIFxue1xuICAgdmFyIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLnRvU3RyaW5nKDE2KTtcbiAgIHZhciByYW5kb20gICAgPSAoTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDIsIDMyKSkudG9TdHJpbmcoMTYpO1xuICAgXG4gICByZXR1cm4gdGltZXN0YW1wICsgcmFuZG9tO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5VdGlscy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbih1cmwsIHRpdGxlLCB3aWR0aCwgaGVpZ2h0KSBcbntcbiAgIHZhciBsZWZ0ID0gKHNjcmVlbi53aWR0aC8yKS0od2lkdGgvMik7XG4gICB2YXIgdG9wID0gKHNjcmVlbi5oZWlnaHQvMiktKGhlaWdodC8yKTtcbiAgIHJldHVybiB3aW5kb3cub3Blbih1cmwsIHRpdGxlLCAndG9vbGJhcj1ubywgbG9jYXRpb249bm8sIGRpcmVjdG9yaWVzPW5vLCBzdGF0dXM9bm8sIG1lbnViYXI9bm8sIHNjcm9sbGJhcnM9bm8sIHJlc2l6YWJsZT1ubywgY29weWhpc3Rvcnk9bm8sIHdpZHRoPScrd2lkdGgrJywgaGVpZ2h0PScraGVpZ2h0KycsIHRvcD0nK3RvcCsnLCBsZWZ0PScrbGVmdCk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbi8qKlxuICogY3VzdG9tIG11c3RhY2hlIGV2YWx1YXRpb24gOiApXG4gKiBkYXRhIGlzIHVzZWQgZm9yIHRoZSBmdW5jdGlvbnMtaW4tY3VzdG9tTXVzdGFjaGUgcGFyYW1ldGVycyBcbiAqIFxuICogaHR0cDovL21hcC54LXJheS5mci93aWtpL2Rpc3BsYXkvSURFRVMvQ3VzdG9tK011c3RhY2hlc1xuICovXG5VdGlscy5wcm90b3R5cGUudG9IdG1sID0gZnVuY3Rpb24odGVtcGxhdGUpXG57XG4gICB3aGlsZSh0ZW1wbGF0ZS5pbmRleE9mKFwie1wiKSAhPSAtMSlcbiAgIHtcbiAgICAgIHZhciBjdXN0b21NdXN0YWNoZSA9IHRlbXBsYXRlLnN1YnN0cmluZyh0ZW1wbGF0ZS5pbmRleE9mKFwie1wiKSwgdGVtcGxhdGUuaW5kZXhPZihcIn1cIikrMSk7XG5cbiAgICAgIHZhciBodG1sID0gZXZhbChjdXN0b21NdXN0YWNoZSk7XG4gICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UoY3VzdG9tTXVzdGFjaGUsIGh0bWwpO1xuICAgfVxuXG4gICByZXR1cm4gdGVtcGxhdGU7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cblV0aWxzLnByb3RvdHlwZS5pc09iamVjdCA9IGZ1bmN0aW9uKHN0dWZmKSBcbntcbiAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoIHN0dWZmICkgPT09ICdbb2JqZWN0IE9iamVjdF0nIDtcbn1cblxuLyoqXG4gKiBFbWJlciA6IGVkaXRpb24gKyBiaW5kaW5nIG9mIG9iamVjdHMgY29udGFpbmVkIGluIGFuIGFycmF5IDogdGhhbmtzIHRvIE9iamVjdFByb3h5XG4gKi9cblV0aWxzLnByb3RvdHlwZS5lZGl0T2JqZWN0SW5BcnJheSA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHksIHZhbHVlKVxue1xuICAgdmFyIHByb3h5ID0gRW1iZXIuT2JqZWN0UHJveHkuY3JlYXRlKHtcbiAgICAgIGNvbnRlbnQ6IG9iamVjdFxuICAgfSk7XG5cbiAgIHByb3h5LnNldChwcm9wZXJ0eSwgdmFsdWUpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5VdGlscy5wcm90b3R5cGUuc3R5bGVUaHVtYlVSTCA9IGZ1bmN0aW9uKHN0eWxlVUlELCBzaXplKSBcbntcbiAgIHJldHVybiB0aGlzLnRodW1iVVJMKHN0eWxlVUlELCBcInN0eWxlXCIsIHNpemUpXG59XG5cblV0aWxzLnByb3RvdHlwZS5jb2xvcmJhclRodW1iVVJMID0gZnVuY3Rpb24oY29sb3JiYXJVSUQpIFxue1xuICAgcmV0dXJuIHRoaXMudGh1bWJVUkwoY29sb3JiYXJVSUQsIFwiY29sb3JiYXJcIilcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuVXRpbHMucHJvdG90eXBlLnRodW1iVVJMID0gZnVuY3Rpb24odWlkLCB0eXBlLCBzaXplKSBcbntcbiAgIGlmKHVpZCA9PSB1bmRlZmluZWQgfHwgdWlkID09IG51bGwpXG4gICAgICByZXR1cm4gXCJcIjtcbiAgIFxuICAgaWYoc2l6ZSA9PSB1bmRlZmluZWQgfHwgc2l6ZSA9PSBudWxsKVxuICAgICAgc2l6ZSA9IFwiXCI7XG4gICBlbHNlXG4gICAgICBzaXplID0gXCJfXCIrc2l6ZTtcblxuICAgdmFyIGVuZCA9IHVpZC5zdWJzdHJpbmcodWlkLmxlbmd0aC00KTtcbiAgIHZhciBmb2xkZXJzID0gZW5kLnNwbGl0KFwiXCIpO1xuICAgXG4gICB2YXIgdXJsID0gXCJodHRwOi8vc3RhdGljLm1hcGVyaWFsLmNvbS90aHVtYnMvXCIgKyB0eXBlO1xuICAgZm9sZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGZvbGRlcikge1xuICAgICAgdXJsICs9IFwiL1wiICsgZm9sZGVyO1xuICAgfSk7XG5cbiAgIHJldHVybiB1cmwgKyBcIi9cIiArIHVpZCArIHNpemUgKyBcIi5wbmdcIjtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuVXRpbHMucHJvdG90eXBlLmdldFNvdXJjZVRodW1iID0gZnVuY3Rpb24obGF5ZXIpIHtcbiAgIFxuICAgc3dpdGNoKGxheWVyLnNvdXJjZS50eXBlKXtcbiAgICAgIGNhc2UgU291cmNlLk1hcGVyaWFsT1NNOlxuICAgICAgICAgcmV0dXJuIFwiIHNyYz1cXFwiXCIrdGhpcy5zdHlsZVRodW1iVVJMKGxheWVyLnBhcmFtcy5zdHlsZXNbbGF5ZXIucGFyYW1zLnNlbGVjdGVkU3R5bGVdLCBcImxcIikrXCJcXFwiXCI7XG4gICBcbiAgICAgIGNhc2UgU291cmNlLlZlY3RvcjpcbiAgICAgIGNhc2UgU291cmNlLkltYWdlczpcbiAgICAgIGNhc2UgU291cmNlLldNUzpcbiAgICAgICAgIHJldHVybiBcIiBzcmM9XFxcImh0dHA6Ly9zdGF0aWMubWFwZXJpYWwubG9jYWxob3N0L2ltYWdlcy9pY29ucy9sYXllci5cIitsYXllci5zb3VyY2UucGFyYW1zLnNyYytcIi5wbmdcXFwiXCI7XG4gICAgICAgICBcbiAgICAgIGNhc2UgU291cmNlLlJhc3RlcjpcbiAgICAgICAgIHJldHVybiBcIiBzcmM9XFxcImh0dHA6Ly9zdGF0aWMubWFwZXJpYWwubG9jYWxob3N0L2ltYWdlcy9pY29ucy9sYXllci5yYXN0ZXIucG5nXFxcIlwiOyAvLyBUT0RPIDogdGh1bWIgZHUgcmFzdGVyXG4gICB9XG4gICBcblxuICAgc3dpdGNoKGxheWVyLnR5cGUpe1xuICAgICAgY2FzZSBMYXllcnNNYW5hZ2VyLlNSVE06XG4gICAgICAgICByZXR1cm4gXCIgc3JjPVxcXCJodHRwOi8vc3RhdGljLm1hcGVyaWFsLmxvY2FsaG9zdC9pbWFnZXMvaWNvbnMvbGF5ZXIuc3J0bS5wbmdcXFwiXCI7XG4gICAgICAgICBcbiAgICAgIGNhc2UgTGF5ZXJzTWFuYWdlci5TaGFkZTpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgICByZXR1cm4gXCIgc3JjPVxcXCJodHRwOi8vc3RhdGljLm1hcGVyaWFsLmxvY2FsaG9zdC9pbWFnZXMvaWNvbnMvbGF5ZXIuc2hhZGUucG5nXFxcIlwiO1xuICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG4vL3VpLXNsaWRlci1oYW5kbGUgdWktc3RhdGUtZGVmYXVsdCB1aS1jb3JuZXItYWxsXG5VdGlscy5wcm90b3R5cGUuYnVpbGRTbGlkZXJTdHlsZSA9IGZ1bmN0aW9uIChpZCl7XG5cbiAgICQoXCIjXCIgKyBpZCArIFwiIGFcIikuY3NzKHtjb2xvcjpcIiMwMDBcIn0pO1xuICAgJChcIiNcIiArIGlkICsgXCIgYVwiKS5jc3Moe3RleHREZWNvcmF0aW9uOlwibm9uZVwifSk7XG4gICAkKFwiI1wiICsgaWQgKyBcIiBhXCIpLmNzcyh7dGV4dEFsaWduOlwiY2VudGVyXCJ9KTtcbiAgICQoXCIjXCIgKyBpZCArIFwiIGFcIikuY3NzKHt3aWR0aDpcIjIwcHhcIn0pO1xuICAgJChcIiNcIiArIGlkICsgXCIgYVwiKS5jc3Moe2hlaWdodDpcIjIwcHhcIn0pO1xuICAgJChcIiNcIiArIGlkICsgXCIgYVwiKS5jc3Moe2JvcmRlclRvcExlZnRSYWRpdXM6XCIzMHB4XCJ9KTtcbiAgICQoXCIjXCIgKyBpZCArIFwiIGFcIikuY3NzKHtib3JkZXJUb3BSaWdodFJhZGl1czpcIjMwcHhcIn0pO1xuICAgJChcIiNcIiArIGlkICsgXCIgYVwiKS5jc3Moe2JvcmRlckJvdHRvbUxlZnRSYWRpdXM6XCIzMHB4XCJ9KTtcbiAgICQoXCIjXCIgKyBpZCArIFwiIGFcIikuY3NzKHtib3JkZXJCb3R0b21SaWdodFJhZGl1czpcIjMwcHhcIn0pO1xuICAgJChcIiNcIiArIGlkICsgXCIgYVwiKS5jc3Moe291dGxpbmU6XCJub25lXCJ9KTtcbiAgICQoXCIjXCIgKyBpZCArIFwiIGFcIikuY3NzKHtjdXJzb3I6XCJwb2ludGVyXCJ9KTtcbiAgICQoXCIjXCIgKyBpZCArIFwiIGFcIikuY3NzKHtjdXJzb3I6XCJoYW5kXCJ9KTtcblxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5VdGlscy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAodG9PYmplY3QsIG1ldGhvZE5hbWUpe1xuICAgcmV0dXJuIChmdW5jdGlvbihwYXJhbTEsIHBhcmFtMiwgcGFyYW0zLCBwYXJhbTQsIHBhcmFtNSwgcGFyYW02KXt0b09iamVjdFttZXRob2ROYW1lXShwYXJhbTEsIHBhcmFtMiwgcGFyYW0zLCBwYXJhbTQsIHBhcmFtNSwgcGFyYW02KX0pO1xufVxuXG5VdGlscy5wcm90b3R5cGUuZ2V0UG9pbnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgIHJldHVybiB7XG4gICAgICAgeCA6IGV2ZW50LmNsaWVudFggLSAkKGV2ZW50LnRhcmdldCkub2Zmc2V0KCkubGVmdCxcbiAgICAgICB5IDogZXZlbnQuY2xpZW50WSAtICQoZXZlbnQudGFyZ2V0KS5vZmZzZXQoKS50b3BcbiAgIH07XG59XG5cblV0aWxzLnByb3RvdHlwZS5yYW5kb21Sb3RhdGUgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuXG4gICB2YXIgcm90YXRpb24gPSB0aGlzLnJhbmRvbTAoMTUpIC0gOFxuICAgaWYoTWF0aC5hYnMocm90YXRpb24pIDwgMilcbiAgICAgIHRoaXMucmFuZG9tUm90YXRlKGVsZW1lbnQpXG4gICBlbHNle1xuICAgICAgJChcIiNcIitlbGVtZW50KS5jc3MoXCItd2Via2l0LXRyYW5zZm9ybVwiLCBcInJvdGF0ZShcIityb3RhdGlvbitcImRlZylcIilcbiAgICAgICQoXCIjXCIrZWxlbWVudCkuY3NzKFwiLW1vei10cmFuc2Zvcm1cIiwgXCJyb3RhdGUoXCIrcm90YXRpb24rXCJkZWcpXCIpXG4gICB9XG4gICAgICBcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuVXRpbHMucHJvdG90eXBlLnByZXBhcmVPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMsIG1haW5QYXJhbSkge1xuXG4gICBpZihvcHRpb25zID09PSB1bmRlZmluZWQpe1xuICAgICAgcmV0dXJuIG51bGxcbiAgIH1cbiAgIFxuICAgZWxzZSBpZih0eXBlb2Ygb3B0aW9ucyA9PSBcInN0cmluZ1wiKXtcbiAgICAgIHZhciB2YWx1ZSA9IG9wdGlvbnNcbiAgICAgIHZhciBuZXdPcHRpb25zID0ge31cbiAgICAgIG5ld09wdGlvbnNbbWFpblBhcmFtXSA9IHZhbHVlXG4gICAgICByZXR1cm4gbmV3T3B0aW9uc1xuICAgfVxuICAgICAgXG4gICBlbHNlIGlmKG9wdGlvbnNbbWFpblBhcmFtXSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIGNvbnNvbGUubG9nKFwiQ291bGQgbm90IGZpbmQgXCIgKyBtYWluUGFyYW0gKyBcIi4gQ2hlY2sgeW91ciBvcHRpb25zLlwiKVxuICAgICAgcmV0dXJuIG51bGxcbiAgIH1cbiAgIFxuICAgZWxzZVxuICAgICAgcmV0dXJuIG9wdGlvbnNcbn1cbiAgIFxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cbiAgIFxuVXRpbHMucHJvdG90eXBlLmNsb25lSnNvbk9iamVjdCA9IGZ1bmN0aW9uIChqc29uT2JqZWN0KSB7XG4gICByZXR1cm4gJC5wYXJzZUpTT04oSlNPTi5zdHJpbmdpZnkoanNvbk9iamVjdCkpO1xufVxuXG5VdGlscy5wcm90b3R5cGUub2R1bXAgPSBmdW5jdGlvbihvKXtcbiAgIGNvbnNvbGUubG9nKHRoaXMuY2xvbmVKc29uT2JqZWN0KG8pKTtcbn1cblxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFV0aWxzKCk7Il19
(7)
});
