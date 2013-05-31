/**
 * Draw the compositions panel in the layerCreation screen
 */
HUD.prototype.refreshLayerSettingsPanel = function() {

   console.log("     building layer settings...");

   //-----------------------------------------------------//

   this.element(HUD.LAYER_SETTINGS).empty();

   //-----------------------------------------------------//

   this.element(HUD.LAYER_SETTINGS).removeClass("hide"); 
   this.element(HUD.LAYER_SETTINGS).append("<p class=\"compositionSettingsTitle\">Layer Settings</p>");

   //-----------------------------------------------------//

   var panelHeight = 40;
   var me = this;

   //-----------------------------------------------------//

   var nbSettings = 0
   for(var i = this.maperial.config.layers.length - 1; i >= 0 ; i--) {

      var layer = this.maperial.config.layers[i];
      switch(layer.type){
         case LayersManager.Images:
         case LayersManager.Raster:
         case LayersManager.Vector:
            continue;
            break;

         case LayersManager.Shade:
            nbSettings ++
            panelHeight += 120
            this.buildShadeSettings(i);
            break;
      }

   }

   //-----------------------------------------------------//
   
   if(nbSettings == 0){
      this.panel(HUD.LAYER_SETTINGS).addClass("hide"); 
      return;
   }

   //-----------------------------------------------------//

   $("#panelLayers"+this.maperial.tagId).css("height", panelHeight+"px");
   $("#panelLayers"+this.maperial.tagId).removeClass("hide"); // maperial reset hideAllHUD + no layers => no HUD => orce show here
   
   //-----------------------------------------------------//

   this.panel(HUD.LAYER_SETTINGS).css("height", panelHeight+"px");
}

//--------------------------------------//

HUD.prototype.buildShadeSettings = function(layerIndex) {

   var layer = this.maperial.config.layers[layerIndex];
   var composition = this.maperial.config.layers[layerIndex].composition;

   var zSelector = "zSelector"+layerIndex;
   var scaleSelector = "scaleSelector"+layerIndex;
   var selectArea = "selectArea"+layerIndex;
   var selector = "selector"+layerIndex;
   
   var html = "";

   html += "   <div id='"+scaleSelector+"' class='span1 offset1'></div>";
   html += "<div class=\"row-fluid marginbottom\" id=\"layer_"+layerIndex+"\">";
   html += "   <div class=\"span3 offset1\"><img class=\"sourceThumb\" "+Utils.getSourceThumb(layer)+"></img></div>";
   html += "   <div id='"+zSelector+"' class='span1 offset1 zSelector'></div>";
   html += "   <div id='"+selectArea+"' class='offset7 selectArea'>";
   html += "      <div id='"+selector+"' class='selector'></div>";
   html += "   </div>";
   html += "</div>";

   this.element(HUD.LAYER_SETTINGS).append(html);
   

   var width = $("#"+selectArea).width() - $("#"+selector).width()
   var height = $("#"+selectArea).height() - $("#"+selector).height()

   $("#"+selector).css("left", (width/2)   + "px")
   $("#"+selector).css("top",  (height/2)  + "px")

   $("#"+selector).draggable({ 
      containment: "parent" ,
      stop: function() {
         var position = $("#"+selector).position()
         composition.params.uLight[0] = Math.round(100*position.left/width) - 50
         composition.params.uLight[1] = Math.round(100*position.top/height) - 50

         console.log("x light : " + composition.params.uLight[0] + " on layer " + layerIndex)
         console.log("y light : " + composition.params.uLight[1] + " on layer " + layerIndex)

         $(window).trigger(MaperialEvents.XY_LIGHT_CHANGED, [layerIndex]);
      }
   });
   

   $( "#"+zSelector ).slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 100,
      step: 1,
      value: 50,
      slide: function(zSelector){
         //-----
      }(zSelector),

      change: function(zSelector, composition, layerIndex){
         return function( event, ui ) {
            composition.params.uLight[2] = ui.value;
            console.log("z light : " + composition.params.uLight[2] + " on layer " + layerIndex)
            $(window).trigger(MaperialEvents.Z_LIGHT_CHANGED, [layerIndex]);
         }
      }(zSelector, composition, layerIndex)
      
   });
   
   
   $( "#"+scaleSelector ).slider({
      range: "min",
      min: 0,
      max: 100,
      step: 1,
      value: 50,
      slide: function(scaleSelector){
         //-----
      }(scaleSelector),
      
      change: function(scaleSelector, composition, layerIndex){
         return function( event, ui ) {
            composition.params.scale = ui.value;
            console.log("scale : " + composition.params.scale + " on layer " + layerIndex)
            $(window).trigger(MaperialEvents.SCALE_CHANGED, [layerIndex]);
         }
      }(scaleSelector, composition, layerIndex)
      
   });
   
   Utils.buildSliderStyle(zSelector);
   Utils.buildSliderStyle(scaleSelector);
}