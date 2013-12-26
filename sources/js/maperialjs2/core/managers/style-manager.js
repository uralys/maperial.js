//-------------------------------------------//
//- StyleManager
//-------------------------------------------//

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
            console.log("------------------- received symb", oEvent)
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