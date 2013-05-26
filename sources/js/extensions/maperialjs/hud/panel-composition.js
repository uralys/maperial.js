/**
 * Draw the compositions panel in the layerCreation screen
 */
HUD.prototype.refreshCompositionsPanel = function() {

   console.log("     building compositions...");

   //-----------------------------------------------------//

   this.element(HUD.COMPOSITIONS).empty();

   //-----------------------------------------------------//
   
   if(this.maperial.config.layers.length < 2){
      this.panel(HUD.COMPOSITIONS).addClass("hide"); 
      return;
   }

   //-----------------------------------------------------//

   this.element(HUD.COMPOSITIONS).removeClass("hide"); 
   this.element(HUD.COMPOSITIONS).append("<p class=\"compositionSettingsTitle\">Compositions Settings</p>");

   //-----------------------------------------------------//

   var panelHeight = 40;
   var me = this;

   //-----------------------------------------------------//

   for(var l = (this.maperial.config.layers.length-1); l>0 ; l--){

      var composition = this.maperial.config.layers[l].composition;
      var shadersSelectionId = "shadersSelection_"+l;

      //-----------------------------------------------------//
      // layer header html

      var div = "<div class=\"row-fluid marginbottom\">";
      div += "<div class=\"span3\"><img class=\"sourceThumb\" "+Utils.getSourceThumb(this.maperial.config.layers[l])+"></img></div>";

      div += "<div class=\"span4 offset1\"><select class=\"shaderSelectbox\" name=\""+shadersSelectionId+"\" id=\""+shadersSelectionId+"\">";

      for(var s=0; s< this.maperial.shaders.length; s++) 
         div += "<option value=\""+s+"\">"+this.maperial.shaders[s]+"</option>";

      div += "</select></div>";
      div += "</div>";

      this.element(HUD.COMPOSITIONS).append(div);

      //-----------------------------------------------------//
      // build selectbox

      $("#"+shadersSelectionId).selectbox({
         onChange: function(composition){
            return function (val, inst) {
               try{
                  composition.shader = inst.input[0][val].label;
                  me.maperial.restart();
               }
               catch(e){}
            }
         }(composition),
         effect: "slide"
      });

      // init selectbox value
      $("#"+shadersSelectionId).selectbox('change', "", composition.shader);

      if(composition.shader == Maperial.MulBlend){

         //-----------------------------------------------------//
         // MulBlend params html 

         var constrastId = "mulblend_contrast_"+l;
         var brightnessId = "mulblend_brightness_"+l;
         var bwId = "mulblend_bw_"+l;

         var div = "<div class=\"row-fluid marginbottom\">" +
         "<div class=\"span1 offset4\"><i class=\"sprite-maperial maperial-contrast\"></i><div class=\"mulblendSlider\" id="+constrastId+"></div></div>" +
         "<div class=\"span1 offset1\"><i class=\"sprite-maperial maperial-brightness\"></i><div class=\"mulblendSlider\" id="+brightnessId+"></div></div>" +
         "<div class=\"span1 offset1\"><i class=\"icon-white icon-cog\"></i><div class=\"mulblendSlider\" id="+bwId+"></div></div>" +
         "</div>";

         this.element(HUD.COMPOSITIONS).append(div);

         //-----------------------------------------------------//
         // MulBlend params js 

         $( "#"+constrastId ).slider({
            orientation: "vertical",
            range: "min",
            min: -2,
            max: 2,
            step: 0.01,
            value: composition.params.uParams[0],
            slide: function(constrastId){
               //-----
            }(constrastId),
            change: function(constrastId, composition){
               return function( event, ui ) {
                  composition.params.uParams[0] = ui.value;
                  $(window).trigger(MaperialEvents.CONTRAST_CHANGED);
               }
            }(constrastId, composition)
         });

         $( "#"+brightnessId ).slider({
            orientation: "vertical",
            range: "min",
            min: -2,
            max: 2,
            step: 0.01,
            value: composition.params.uParams[1],
            slide: function(brightnessId){
               //-----
            }(brightnessId),
            change: function(brightnessId, composition){
               return function( event, ui ) {
                  composition.params.uParams[1] = ui.value;
                  $(window).trigger(MaperialEvents.LUMINOSITY_CHANGED);
               }
            }(brightnessId, composition)
         });

         $( "#"+bwId ).slider({
            orientation: "vertical",
            range: "min",
            min: 1,
            max: 4,
            step: 1,
            value: composition.params.uParams[2],
            slide: function(bwId){
               //-----
            }(bwId),
            change: function(bwId, composition){
               return function( event, ui ) {
                  composition.params.uParams[2] = ui.value;
                  $(window).trigger(MaperialEvents.BW_METHOD_CHANGED);
               }
            }(bwId, composition)
         });

         panelHeight += 135;
         
         Utils.buildSliderStyle(constrastId);
         Utils.buildSliderStyle(brightnessId);
         Utils.buildSliderStyle(bwId);
      }
      //-----------------------------------------------------//

      panelHeight += 60;
   }

   this.panel(HUD.COMPOSITIONS).css("height", panelHeight+"px");
}