//-------------------------------------------//
//- StylesManager - note: "StyleManager" exists as webapp.managers.styleManager...
//-------------------------------------------//

window.maperialStyles   = window.maperialStyles || {};  // cache containing all previously loaded styles
window.maperialSymb     = window.maperialSymb   || {};  
window.maperialFont     = window.maperialFont   || {};  


function _getSymbURL(name) {
   return Maperial.staticURL + "/" + name;
}
function _getFontURL (name) {
   return Maperial.staticURL + "/font/" + name.replace(" ","_") + "_400.font.js";
}
function _LoadFontList (fontList,next) {
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
      url = _getFontURL(key)
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
function _LoadSymbList (symbList,next) {
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
      url = _getSymbURL(key)
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

//-----------------------------------------------------------------------------------------------//

function StylesManager(mapView){
   this.mapView      = mapView;
   this.stylesToLoad = null;
   this.nextFunction = null;
}

//-------------------------------------------//

StylesManager.prototype.styleCacheEmpty = function() {
   return $.isEmptyObject(window.maperialStyles);   
}

//-------------------------------------------//

/**
 * Quel que soit le nbre de layers OSM, il y a un seul style selectionne a la fois
 */
StylesManager.prototype.getSelectedStyle = function() {

   for(var i = 0; i < this.mapView.config.layers.length; i++){
      var layerParams = this.mapView.config.layers[i].params;
      if(layerParams.styles){
         var styleUID = layerParams.styles[layerParams.selectedStyle];
         return window.maperialStyles[styleUID];
      }
   }
   
   return null;
}

StylesManager.prototype.getStyle = function(uid){
   return window.maperialStyles[uid];
}

StylesManager.prototype.addStyle = function ( styleObj ) {
   window.maperialStyles[styleObj.uid] = styleObj;
}
//-------------------------------------------//

StylesManager.prototype.fetchStyles = function(styleUIDs, next) {

   this.nextFunction = next;

   if(styleUIDs.length > 0){
      var styleUID      = styleUIDs.shift();
      this.stylesToLoad = styleUIDs;
      this.loadStyle    (styleUID);
   }
   else{
      next();
   }
}

//-------------------//

StylesManager.prototype.loadStyle = function(styleUID, next) {

   var me = this;

   if(!next){
      next = function(){ me.loadNextStyle() };
   }

   if(window.maperialStyles[styleUID] && window.maperialStyles[styleUID].content){
      next();
      return;
   }

   var styleURL = this.getURL(styleUID);
   console.log("  fetching : " + styleURL);

   $.ajax({  
      type: "GET",  
      url: styleURL,
      dataType: "json",
      success: function (style) {
         //window.maperialStyles[styleUID] = {uid : styleUID, name: styleUID, content:style};
         window.maperialStyles[styleUID] = new Style (styleUID , style)
         me.LoadFont(styleUID,function() {var n = next;me.LoadSymb(styleUID,n)});
         //next()
      }
   });

}

//-------------------//

StylesManager.prototype.LoadFont = function (styleUID,next) {
   
   console.log("-----------> LoadFont");
   if( !( styleUID in window.maperialStyles ) || !window.maperialStyles[styleUID].content ){
      return;
   }
   
   var content = window.maperialStyles[styleUID].content;
   var toLoad = {};
   
   toLoad["DejaVu Sans"] = 1;
   
   for ( var key in content) {
      var subLayer = content [ key ] 
      for (var _s = 0 ; _s < subLayer.s.length ; _s++ ) {
         var curStyle = subLayer.s[_s];
         for (var _ss = 0 ; _ss < curStyle.s.length ; _ss++){ 
            var params = curStyle.s[_ss];
            if  ( params.rt == "TextSymbolizer" && params.face-name && !(params.face-name in toLoad) ) {
               toLoad[params.face-name] = 1
            }
         }
      }
   }
   _LoadFontList ( toLoad , next );
}   

//----------------------------//

StylesManager.prototype.LoadSymb = function (styleUID,next) {

   if( !( styleUID in window.maperialStyles ) || !window.maperialStyles[styleUID].content ){
      return;
   }
   
   var content = window.maperialStyles[styleUID].content;
   var toLoad = {};
   for ( var key in content) {
      var subLayer = content [ key ] 
      for (var _s = 0 ; _s < subLayer.s.length ; _s++ ) {
         var curStyle = subLayer.s[_s];
         for (var _ss = 0 ; _ss < curStyle.s.length ; _ss++){ 
            var params = curStyle.s[_ss];
            if  ( params.rt == "PointSymbolizer" && params.file && !(params.file in toLoad) ) {
               toLoad[params.file] = 1
            }
            if  ( params.rt == "PolygonPatternSymbolizer" && params.file && !(params.file in toLoad)) {
               toLoad[params.file] = 1
            }
            if  ( params.rt == "ShieldSymbolizer" && params.file && !(params.file in toLoad)) {
               toLoad[params.file] = 1
            }
         }
      }
   }
   var toLoadExt = {}
   for ( var key in toLoad ) {
      if ( key.indexOf("[length]") == -1 )  {
         toLoadExt[key] = 1;
      }
      else {
         for (var i = 1 ; i <= 8 ; i = i + 1 ) {
            var k = key.replace ("[length]",i.toString())
            toLoadExt[k] = 1;
         }
      }
   }

   _LoadSymbList (toLoadExt,next);
}

//----------------------------//

StylesManager.prototype.loadNextStyle = function() {
   this.fetchStyles(this.stylesToLoad, this.nextFunction);
}

//----------------------------//

StylesManager.prototype.getURL = function(styleUID) {
   return Maperial.apiURL + "/api/style/" + styleUID;
}