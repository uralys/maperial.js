
(function() {
   'use strict';

   var ColorbarEditorController = Ember.ObjectController.extend({});

   //==================================================================//

   ColorbarEditorController.renderUI = function() {
      App.maperial.apply(ColorbarEditorController.getConfig());
      $(window).on(MaperialEvents.READY, ColorbarEditorController.maperialReady);
   }

   ColorbarEditorController.cleanUI = function() {
      $(window).off(MaperialEvents.READY, ColorbarEditorController.maperialReady);
   }

   //==================================================================//

   ColorbarEditorController.maperialReady = function (){
      ColorbarEditorController.defaultColorbarSelection();
   }

   // init : once maperial is ready, use Maperial.SelectedColorbar to fill App.selectedColorbar
   ColorbarEditorController.defaultColorbarSelection = function (){
      console.log("ColorbarEditorController.defaultColorbarSelection");
      var name = App.colorbarsData.selectedColorbar.name; // ---> name vient de la db heroku !! on le garde ici pour linstant 
      App.colorbarsData.set("selectedColorbar", App.maperial.colorbarsManager.getSelectedColorbar());
      App.colorbarsData.set("selectedColorbar.name", name);
      
      //-----------------------------
      // if creating a new style : copy the selected style as a new style
      if(!App.colorbarsData.editingColorbar)
      {
         var newColorbar = {
               name : "CopyOf" + App.colorbarsData.selectedColorbar.name,
               content : App.colorbarsData.selectedColorbar.content,
               uid : "no_uid"  
         };

         App.colorbarsData.set("selectedColorbar", newColorbar);
      }
   }
   
   //==================================================================//

   ColorbarEditorController.getConfig = function(){

      var config = App.maperial.emptyConfig();

      // custom
      config.hud.elements["ColorbarEditorMenu"] = {show : true, type : HUD.PANEL, position : { right: "0", top: "0"}, disableHide : true };

      // maperial hud
      config.hud.elements[HUD.SETTINGS]      = {show : true,  type : HUD.TRIGGER,  disableHide : true, disableDrag : true };
      config.hud.elements[HUD.COLORBAR]      = {show : true,  type : HUD.PANEL};

      config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_OCM_TRANSPORT));
      config.layers.push(LayersManager.getSrtmLayerConfig())
      
//      config.layers.push(LayersManager.getRasterLayerConfig("1_raster_13dcc4de76c874941ef", [App.colorbarsData.selectedColorbar.uid]));
      
      App.addMargins(config);
      
      return config;
   }  

// ==================================================================//
// Controls

   ColorbarEditorController.saveColorbar = function() {
      
      var colorbarContent = {};
      ExtensionColorbar.fillContent(colorbarContent);

      App.colorbarsData.set('selectedColorbar.name', $("#colorbarNameInput").val());
      App.colorbarsData.set('selectedColorbar.content', colorbarContent);

      if(App.colorbarsData.editingColorbar)
         ColorbarManager.saveColorbar(App.colorbarsData.selectedColorbar);
      else
         ColorbarManager.uploadNewColorbar(App.colorbarsData.selectedColorbar);
   }

// ------------------------------------------------//

   App.ColorbarEditorController = ColorbarEditorController;

// ==================================================================//
// Routing

   App.ColorbarEditorRouting = App.Page.extend({
      route: '/colorbarEditor',

      connectOutlets: function(router) {
         App.Router.openPage(router, "colorbarEditor");
      },

      //--------------------------------------//
      // actions

   });

// ==================================================================//

})();

