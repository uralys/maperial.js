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
   this.element(HUD.COMPOSITIONS).append("<p class=\"compositionSettingsTitle\">Composition Settings</p>");

   //-----------------------------------------------------//

   var panelHeight = 40;
   var me = this;

   //-----------------------------------------------------//

   for(var l = (this.maperial.config.layers.length-1); l>0 ; l--){

      var composition = this.maperial.config.layers[l].composition;
      var shadersSelectionId = "shadersSelection_"+l;

      //-----------------------------------------------------//
      
      if(!composition.params){
         composition.params = LayersManager.getDefaultParams(composition.shader)
      }
      
      //-----------------------------------------------------//
      // layer header html

      var div = "<div class=\"row-fluid marginbottom\">";
      div += "<div class=\"span1 mapthumb top\"><img class=\"sourceThumb\" "+Utils.getSourceThumb(this.maperial.config.layers[l])+"></img></div>";
      div += "<div class=\"span1 mapthumb\"><img class=\"sourceThumb\" "+Utils.getSourceThumb(this.maperial.config.layers[l-1])+"></img></div>";
      
      div += "<div class=\"span4 offset3\"><select class=\"shaderSelectbox\" name=\""+shadersSelectionId+"\" id=\""+shadersSelectionId+"\">";

      for(var s=0; s< this.maperial.shaders.length; s++) 
         div += "<option value=\""+s+"\">"+this.maperial.shaders[s]+"</option>";

      div += "</select></div>";
      div += "</div>";

      this.element(HUD.COMPOSITIONS).append(div);

      //-----------------------------------------------------//
      // build selectbox

      $("#"+shadersSelectionId).selectbox({
         onChange: function(l){
            return function (val, inst) {
               try{
                  me.maperial.layersManager.changeComposition(l, inst.input[0][val].label);
               }
               catch(e){}
            }
         }(l),
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
            min: -1,
            max: 1,
            step: 0.01,
            value: composition.params.uParams[0],
//            slide: function(constrastId){
//               //-----
//            }(constrastId),
            slide: function(constrastId, composition, l){
               return function( event, ui ) {
                  composition.params.uParams[0] = ui.value;
                  $(window).trigger(MaperialEvents.CONTRAST_CHANGED, [l]);
               }
            }(constrastId, composition, l)
         });

         $( "#"+brightnessId ).slider({
            orientation: "vertical",
            range: "min",
            min: -1,
            max: 1,
            step: 0.01,
            value: composition.params.uParams[1],
//            slide: function(brightnessId){
//               //-----
//            }(brightnessId),
            slide: function(brightnessId, composition, l){
               return function( event, ui ) {
                  composition.params.uParams[1] = ui.value;
                  $(window).trigger(MaperialEvents.BRIGHTNESS_CHANGED, [l]);
               }
            }(brightnessId, composition, l)
         });

         $( "#"+bwId ).slider({
            orientation: "vertical",
            range: "min",
            min: 1,
            max: 4,
            step: 1,
            value: composition.params.uParams[2],
//            slide: function(bwId){
//               //-----
//            }(bwId),
            slide: function(bwId, composition, l){
               return function( event, ui ) {
                  composition.params.uParams[2] = ui.value;
                  $(window).trigger(MaperialEvents.BW_METHOD_CHANGED, [l]);
               }
            }(bwId, composition, l)
         });

         panelHeight += 135;
         
         Utils.buildSliderStyle(constrastId);
         Utils.buildSliderStyle(brightnessId);
         Utils.buildSliderStyle(bwId);
      }

      //-----------------------------------------------------//
      
      if(composition.shader == Maperial.AlphaClip
      || composition.shader == Maperial.AlphaBlend){

         var alphaId = "user_alpha_"+l;
         
         var div = "<div class=\"row-fluid marginbottom\">" +
         "<div class=\"span1 offset1\"><i class=\"icon-white icon-eye-close\"></i></div>" +
         "<div class=\"span7 offset1\"><div class=\"mulblendSlider\" id="+alphaId+"></div></div>" +
         "</div>";

         this.element(HUD.COMPOSITIONS).append(div);
         
         $( "#"+alphaId ).slider({
            orientation: "horizontal",
            range: "min",
            min: 0,
            max: 1,
            step: 0.01,
            value: composition.params.uParams,
//            slide: function(alphaId){
//               //-----
//            }(alphaId),
            slide: function(alphaId, composition, l){
               return function( event, ui ) {
                  composition.params.uParams = ui.value;
                  $(window).trigger(MaperialEvents.ALPHA_CHANGED, [l]);
               }
            }(alphaId, composition, l)
         });

         panelHeight += 45;
         
         Utils.buildSliderStyle(alphaId);
      }
      
      //-----------------------------------------------------//

      panelHeight += 60;
   }

   this.panel(HUD.COMPOSITIONS).css("height", panelHeight+"px");
}