(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//------------------------------------------------------------------//

var GradiantColor           = require('../../libs/gradient-color.js'),
    ColorbarData            = require('../models/data/colorbar-data.js'),
    utils                   = require('../../../tools/utils.js');

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

},{"../../../tools/utils.js":41,"../../libs/gradient-color.js":36,"../models/data/colorbar-data.js":8}],2:[function(require,module,exports){
//------------------------------------------------------------------//

var Layer                   = require('../models/layer.js'),
    DynamicalLayer          = require('../models/layers/dynamical-layer.js'),
    ImageLayer              = require('../models/layers/image-layer.js'),
    HeatmapLayer            = require('../models/layers/heatmap-layer.js');

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
},{"../models/layer.js":12,"../models/layers/dynamical-layer.js":13,"../models/layers/heatmap-layer.js":14,"../models/layers/image-layer.js":15}],3:[function(require,module,exports){

var utils       = require('../../../tools/utils.js');

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

},{"../../../tools/utils.js":41}],4:[function(require,module,exports){
//------------------------------------------------------------------//

var VectorialStyle     = require('../models/vectorial-style.js'),
    Style              = require('../models/style.js');

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

},{"../models/style.js":17,"../models/vectorial-style.js":18}],5:[function(require,module,exports){
//------------------------------------------------------------------//

var CoordinateSystem = require('../libs/coordinate-system.js');

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
},{"../libs/coordinate-system.js":34}],6:[function(require,module,exports){
//------------------------------------------------------------------//

var MapContext              = require('./map-context.js'),
    MouseListener           = require('./mouse-listener.js'),
    MapRenderer             = require('./rendering/map-renderer.js'),
    LayerManager            = require('./managers/layer-manager.js'),
    Layer                   = require('./models/layer.js'),
    utils                   = require('../../tools/utils.js');

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

},{"../../tools/utils.js":41,"./managers/layer-manager.js":2,"./map-context.js":5,"./models/layer.js":12,"./mouse-listener.js":19,"./rendering/map-renderer.js":28}],7:[function(require,module,exports){
//------------------------------------------------------------------//

var MapView                 = require('./map-view.js'),
    SourceManager           = require('./managers/source-manager.js'),
    StyleManager            = require('./managers/style-manager.js'),
    ColorbarManager         = require('./managers/colorbar-manager.js'),
    DynamicalData           = require('./models/data/dynamical-data.js'),
    HeatmapData             = require('./models/data/heatmap-data.js'),
    Source                  = require('./models/source.js'),
    utils                   = require('../../tools/utils.js');

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

},{"../../tools/utils.js":41,"./managers/colorbar-manager.js":1,"./managers/source-manager.js":3,"./managers/style-manager.js":4,"./map-view.js":6,"./models/data/dynamical-data.js":9,"./models/data/heatmap-data.js":10,"./models/source.js":16}],8:[function(require,module,exports){

var utils       = require('../../../../tools/utils.js'),
    RGBAColor   = require('../../../libs/rgba-color.js');
    
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
},{"../../../../tools/utils.js":41,"../../../libs/rgba-color.js":40}],9:[function(require,module,exports){

var utils       = require('../../../../tools/utils.js'),
    Proj4js     = require('../../../libs/proj4js-compressed.js');

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
},{"../../../../tools/utils.js":41,"../../../libs/proj4js-compressed.js":39}],10:[function(require,module,exports){

var utils       = require('../../../../tools/utils.js'),
    Proj4js     = require('../../../libs/proj4js-compressed.js');

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

},{"../../../../tools/utils.js":41,"../../../libs/proj4js-compressed.js":39}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){

var utils       = require('../../../../tools/utils.js'),
    Layer       = require('../layer.js');

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
},{"../../../../tools/utils.js":41,"../layer.js":12}],14:[function(require,module,exports){

var utils       = require('../../../../tools/utils.js'),
    Layer       = require('../layer.js');

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
},{"../../../../tools/utils.js":41,"../layer.js":12}],15:[function(require,module,exports){

var utils       = require('../../../../tools/utils.js'),
    Layer       = require('../layer.js');

//-----------------------------------------------------------------------------------//

function ImageLayer (sourceId, composition) {
   
   this.id              = utils.generateUID();
   this.type            = Layer.Images;
   this.sourceId        = sourceId;
   this.composition     = composition;
   
}

//-----------------------------------------------------------------------------------//

module.exports = ImageLayer;

},{"../../../../tools/utils.js":41,"../layer.js":12}],16:[function(require,module,exports){

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
},{}],17:[function(require,module,exports){
//-----------------------------------------------------------------------------------//

function Style(){}

//------------------------------------------------------------------//

Style.Vectorial   = "Style.Vectorial";
Style.Custom      = "Style.Custom";

//------------------------------------------------------------------//

module.exports = Style;

},{}],18:[function(require,module,exports){
//------------------------------------------------------------------//

var Style               = require('./style.js'),
    PointSymbolizer     = require('../rendering/symbolizers/point-symbolizer.js'),
    utils               = require('../../../tools/utils.js');

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

},{"../../../tools/utils.js":41,"../rendering/symbolizers/point-symbolizer.js":29,"./style.js":17}],19:[function(require,module,exports){
//---------------------------------------------------------------------------------------//

var Hammer      = require('../libs/hammer.js'),
utils       = require('../../tools/utils.js');

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


},{"../../tools/utils.js":41,"../libs/hammer.js":37}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){

var utils                   = require('../../../tools/utils.js'),
    ExtendCanvasContext     = require('./tools/render-text.js'),
    TileRenderer            = require('./tile-renderer.js');
    
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

},{"../../../tools/utils.js":41,"./tile-renderer.js":30,"./tools/render-text.js":33}],22:[function(require,module,exports){

var utils                   = require('../../../tools/utils.js'),
    GLTools                 = require("./tools/gl-tools.js"),
    CoordinateSystem        = require('../../libs/coordinate-system.js');
    
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

},{"../../../tools/utils.js":41,"../../libs/coordinate-system.js":34,"./tools/gl-tools.js":32}],23:[function(require,module,exports){

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
},{}],24:[function(require,module,exports){

var ImageData       = require("../../models/data/image-data.js");

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

},{"../../models/data/image-data.js":11}],25:[function(require,module,exports){

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

},{}],26:[function(require,module,exports){

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

},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){

var GLTools                 = require("./tools/gl-tools.js"),
Point                   = require('../../libs/point.js'),
Tile                    = require('./tile.js'),
ColorbarRenderer        = require('./colorbar-renderer.js'),
DynamicalRenderer       = require('./dynamical-renderer.js'),
HeatmapRenderer         = require('./heatmap-renderer.js'),
utils                   = require('../../../tools/utils.js'),
mat4                    = require('../../libs/gl-matrix-min.js').mat4;

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

},{"../../../tools/utils.js":41,"../../libs/gl-matrix-min.js":35,"../../libs/point.js":38,"./colorbar-renderer.js":20,"./dynamical-renderer.js":21,"./heatmap-renderer.js":22,"./tile.js":31,"./tools/gl-tools.js":32}],29:[function(require,module,exports){


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
},{}],30:[function(require,module,exports){

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

},{}],31:[function(require,module,exports){

var GLTools                 = require("./tools/gl-tools.js"),
    Layer                   = require("../models/layer.js"),
    DynamicalLayerPart      = require('./layerparts/dynamical-layer-part.js'),
    ImageLayerPart          = require('./layerparts/image-layer-part.js'),
    RasterLayer8            = require('./layerparts/raster-layer-part.js').RasterLayer8,
    RasterLayer16           = require('./layerparts/raster-layer-part.js').RasterLayer16,
    ShadeLayerPart          = require('./layerparts/shade-layer-part.js'),
    VectorialLayerPart      = require('./layerparts/vectorial-layer-part.js');
    
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


},{"../models/layer.js":12,"./layerparts/dynamical-layer-part.js":23,"./layerparts/image-layer-part.js":24,"./layerparts/raster-layer-part.js":25,"./layerparts/shade-layer-part.js":26,"./layerparts/vectorial-layer-part.js":27,"./tools/gl-tools.js":32}],32:[function(require,module,exports){

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

},{}],33:[function(require,module,exports){

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

},{}],34:[function(require,module,exports){

var Point = require('./point.js');

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
},{"./point.js":38}],35:[function(require,module,exports){
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
},{}],36:[function(require,module,exports){
//------------------------------------------------------------------//

var RGBAColor = require('./rgba-color.js');

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

},{"./rgba-color.js":40}],37:[function(require,module,exports){
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
},{}],38:[function(require,module,exports){
function Point ( x , y ) {
   return {
       x : x, 
       y : y
   }
}

//------------------------------------------------------------------//

module.exports = Point;
},{}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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