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
   for(var i = App.maperial.config.layers.length - 1; i >= 0 ; i--) {

      var layer = App.maperial.config.layers[i];
      switch(layer.type){
         case LayersManager.Images:
         case LayersManager.Raster:
            continue;
            break;

         case LayersManager.Vector:
            this.buildShadeSettings(i);
            nbSettings ++
            panelHeight += 100
            break;
            
         case LayersManager.Shade:
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

   var layer = App.maperial.config.layers[layerIndex];

   var zSelector = "zSelector"+layerIndex;
   var selectArea = "selectArea"+layerIndex;
   var selector = "selector"+layerIndex;
   
   var html = "";

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
         console.log("x : ", Math.round(100*position.left/width) - 50);
         console.log("y : ", Math.round(100*position.top/height) - 50);
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
      change: function(zSelector, layer, layerIndex){
         return function( event, ui ) {
//            layer.params.z = ui.value;
            console.log("z : " + ui.value + " on layer " + layerIndex)
//            $(window).trigger(MaperialEvents.Z_LIGHT_HAS_CHANGED, [layerIndex]);
         }
      }(zSelector, layer, layerIndex)
   });
   
   Utils.buildSliderStyle(zSelector);
}