//-------------------------------------------//
//- StylesManager - note: "StyleManager" exists as webapp.managers.styleManager...
//-------------------------------------------//

function StylesManager(maperial){

   this.maperial = maperial;

   this.stylesToLoad = null;
   this.nextFunction = null;

   window.maperialStyles = window.maperialStyles || {};  // cache containing all previously loaded styles
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
         next()
      }
   });

}

//----------------------------//

StylesManager.prototype.loadNextStyle = function() {
   this.fetchStyles(this.stylesToLoad, this.nextFunction);
}

//----------------------------//

StylesManager.prototype.getURL = function(styleUID) {
   return Maperial.apiURL + "/api/style/" + styleUID;
}
