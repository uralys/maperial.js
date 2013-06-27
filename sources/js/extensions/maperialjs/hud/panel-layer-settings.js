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
   for(var i = this.mapView.config.layers.length - 1; i >= 0 ; i--) {

      var layer = this.mapView.config.layers[i];
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

   console.log("%%----> " + "#panelLayers_"+this.mapView.name)
   $("#panelLayers_"+this.mapView.name).css("height", panelHeight+"px");
   $("#panelLayers_"+this.mapView.name).removeClass("hide"); // maperial reset hideAllHUD + no layers => no HUD => orce show here
   
   //-----------------------------------------------------//

   this.panel(HUD.LAYER_SETTINGS).css("height", panelHeight+"px");
}

//--------------------------------------//

HUD.prototype.buildShadeSettings = function(layerIndex) {

   var layer = this.mapView.config.layers[layerIndex];

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
      drag: function() {
         var position = $("#"+selector).position()
         layer.params.uLight[0] = Math.round(100*position.left/width) - 50
         layer.params.uLight[1] = Math.round(100*position.top/height) - 50

         $(window).trigger(MaperialEvents.XY_LIGHT_CHANGED, [layerIndex]);
      }
   });
   

   $( "#"+zSelector ).slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 100,
      step: 1,
      value: layer.params.uLight[2],
      slide: function(zSelector, layer, layerIndex){
         return function( event, ui ) {
            layer.params.uLight[2] = ui.value;
            $(window).trigger(MaperialEvents.Z_LIGHT_CHANGED, [layerIndex]);
         }
      }(zSelector, layer, layerIndex)
      
   });
   
   
   $( "#"+scaleSelector ).slider({
      range: "min",
      min: 0,
      max: 100,
      step: 1,
      value: layer.params.scale,
      slide: function(scaleSelector, layer, layerIndex){
         return function( event, ui ) {
            layer.params.scale = ui.value;
            $(window).trigger(MaperialEvents.SCALE_CHANGED, [layerIndex]);
         }
      }(scaleSelector, layer, layerIndex)
      
   });
   
   Utils.buildSliderStyle(zSelector);
   Utils.buildSliderStyle(scaleSelector);
}