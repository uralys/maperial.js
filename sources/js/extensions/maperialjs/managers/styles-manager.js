//-------------------------------------------//
//- StylesManager - note: "StyleManager" exists as webapp.managers.styleManager...
//-------------------------------------------//

function StylesManager(maperial){

   this.maperial = maperial;

   this.stylesToLoad = null;
   this.nextFunction = null;

   window.maperialStyles   = window.maperialStyles || {};  // cache containing all previously loaded styles
   window.maperialSymb     = window.maperialSymb   || {};  
   window.maperialFont     = window.maperialFont   || {};  
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

   for(var i = 0; i < this.maperial.config.layers.length; i++){
      var layerParams = this.maperial.config.layers[i].params;
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

//-------------------------------------------//

StylesManager.prototype.fetchStyles = function(styleUIDs, next) {

   this.nextFunction = next;

   if(styleUIDs.length > 0){
      var styleUID = styleUIDs.shift();
      this.stylesToLoad = styleUIDs;
      this.loadStyle(styleUID);
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
         window.maperialStyles[styleUID] = {uid : styleUID, name: styleUID, content:style};
         me.LoadFont(styleUID,next);
         //me.LoadSymb(styleUID,next);
         //next()
      }
   });
}

StylesManager.prototype.LoadFont = function (styleUID,next) {
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

   var loaded   = 0;
   var nbToLoad = Object.keys(toLoad).length;
   
   if ( nbToLoad == 0 )  {
      this.LoadSymb(styleUID,next);
      return;
   }

   var me = this;

   for ( var key in toLoad ) {
      url = this.getFontURL(key)
      var req = $.ajax({  
         type: "GET",  
         url: url,
         dataType : "script",
         success: function (_data) {
            loaded = loaded + 1
            if ( loaded == nbToLoad ) me.LoadSymb(styleUID,next);
         },
         error : function() {
            loaded = loaded + 1
            if ( loaded == nbToLoad ) me.LoadSymb(styleUID,next);
         }
      });
   }
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
   
   var loaded   = 0;
   var nbToLoad = Object.keys(toLoadExt).length;
   
   if ( nbToLoad == 0 )  {
      next();
      return;
   }

   for ( var key in toLoadExt ) {
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
//----------------------------//

StylesManager.prototype.loadNextStyle = function() {
   this.fetchStyles(this.stylesToLoad, this.nextFunction);
}

//----------------------------//

StylesManager.prototype.getURL = function(styleUID) {
   return Maperial.apiURL + "/api/style/" + styleUID;
}

StylesManager.prototype.getSymbURL = function(name) {
   return Maperial.staticURL + "/" + name;
}

StylesManager.prototype.getFontURL = function(name) {
   return Maperial.staticURL + "/font/" + name.replace(" ","_") + "_400.font.js";
}

