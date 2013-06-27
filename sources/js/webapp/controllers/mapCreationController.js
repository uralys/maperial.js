
(function() {
   'use strict';

   var MapCreationController = Ember.ObjectController.extend({});
   
   //==================================================================//
   
   MapCreationController.LAYERS_CREATION  = "LAYERS_CREATION";
   MapCreationController.SETTINGS         = "SETTINGS";

   //==================================================================//
   // Rendering
   
   MapCreationController.init = function() {

      $(window).on(  MaperialEvents.READY, MapCreationController.maperialReady);

      console.log("mapCreation", App.user.selectedMap)
      
      App.user.set("isCreatingANewMap", (App.user.selectedMap.uid == null));
      MapCreationController.wizardSetView(MapCreationController.LAYERS_CREATION);
      MapCreationController.openLayersCreation();

      $(".demobutton").tooltipster({
         theme: '.tooltip-theme'
      })
   }
   
   MapCreationController.terminate = function () {
      App.user.set("isCreatingANewMap"    , false);  
      App.user.set("selectedMap"          , null);  

      $(window).off(MaperialEvents.READY, MapCreationController.maperialReady);
      $(window).off(MaperialEvents.STYLE_CHANGED, MapCreationController.refreshLayersPanel);
   }
   
   //==================================================================//
   // Calls by Listeners
   
   MapCreationController.maperialReady = function (){
      
      console.log("-------> maperialReady")
      MapCreationController.mapView = App.maperial.views[0]

      // not set before MaperialEvents.READY, because MaperialJS removes every Listeners on MaperialEvents during reset
      $(window).on(MaperialEvents.STYLE_CHANGED, MapCreationController.refreshLayersPanel);
//
//      if(App.Globals.isViewLayerCreation){
////         console.log("-------> refreshLayersPanel")
//         //App.layersHelper.refreshLayersPanel();
//      }
//      else{
//         //App.layersHelper.refreshHUDViewerSettings();
//      }

      MapCreationController.setSelectedStyle();
   }

   MapCreationController.refreshLayersPanel = function (){
      console.log("removeme")
     // App.layersHelper.refreshLayersPanel();
   }
   
   //==================================================================//

   // init : once maperial is ready, getSelectedStyle is also the selected one in the styleSelectionWindow
   MapCreationController.setSelectedStyle = function (){
      App.stylesData.set("selectedStyle", MapCreationController.mapView.stylesManager.getSelectedStyle());
   }
   
   //==================================================================//
   // Controls

   MapCreationController.wizardSetView = function(view)
   {
      var isViewLayerCreation = view == MapCreationController.LAYERS_CREATION;
      var isViewSettings      = view == MapCreationController.SETTINGS;
      
      App.Globals.set("isViewLayerCreation", isViewLayerCreation);
      App.Globals.set("isViewSettings", isViewSettings);   
   }
   
   //--------------------------------------------------------//
   
   MapCreationController.getLayersCreationConfig = function(){

      var config = ConfigManager.newConfig();

      config.map.layersCreation = true;
      
      // custom
      config.hud.elements["Layers"]          = {show : true,  type : HUD.PANEL,  position : { right: "0", top: "0"},      disableHide : true, disableDrag : true };

      // maperial hud
      config.hud.elements[HUD.SETTINGS]      = {show : true,  type : HUD.TRIGGER,  disableHide : true,         disableDrag : true };
      config.hud.elements[HUD.COMPOSITIONS]  = {show : true,  type : HUD.PANEL,    label : "Composition",      disableDrag : true };
      config.hud.elements[HUD.LAYER_SETTINGS]= {show : true,  type : HUD.PANEL,    label : "Layer Settings",   disableDrag : true };
      config.hud.elements[HUD.LAYERS_CREATION]= {show : true,  type : HUD.PANEL,    label : "Layers",           disableDrag : true };
      config.hud.elements[HUD.CONTROLS]      = {show : false, type : HUD.PANEL,    label : "Controls",         disableDrag : true };
      config.hud.elements[HUD.SCALE]         = {show : false, type : HUD.PANEL,    label : "Scale" };
      config.hud.elements[HUD.GEOLOC]        = {show : false, type : HUD.PANEL,    label : "Location" };
      config.hud.elements[HUD.BASEMAPS]      = {show : true,  type : HUD.PANEL,    disableHide : true,         disableDrag : true };
      config.hud.elements[HUD.DATA]          = {show : true,  type : HUD.PANEL,    disableHide : true,         disableDrag : true };
      
      App.addMargins(config);      


      var mapOptions = {
         type       : Maperial.MAIN,
         name       : "maperial"
      }
      
      var map = {
         views : [{
            config  : config,
            options : mapOptions,
         }]
      }
      
      return map
   }  

   //--------------------------------------------------------//
   
   MapCreationController.getSettingsConfig = function(){

      var config = ConfigManager.newConfig()
      
      // map viewer hud config
      config.hud = App.user.selectedMap.config.hud
      
      // custom
      config.hud.elements["Settings"] = {
            show : true, 
            type : HUD.PANEL, 
            position : { 
               right: "0", 
               top: "0"
            }, 
            disableHide : true, 
            disableDrag : true
      }

      App.addMargins(config)

      // layers + map options previously chosen
      config.layers = MapCreationController.mapView.config.layers

      config.map = MapCreationController.mapView.config.map
      config.map.requireBoundingBoxDrawer = true
      
      return config
   }  
   
   //=============================================================================//
   // --- layer view

   MapCreationController.openLayersCreation = function()
   {
      var options = {
         width    : "100%",
         height   : "100%"
      }
      
      var map = MapCreationController.getLayersCreationConfig()
      
      if(App.user.isCreatingANewMap){

         App.maperial.build([map], options)

         if(App.Globals.isTryscreen)
            MapCreationController.openDemoSelection();
         else
            MapCreationController.openBasemaps();
      }
      else{
         config.layers = App.user.selectedMap.config.layers;
         config.map = App.user.selectedMap.config.map;

         App.maperial.build([map], options)
      }

      MapCreationController.mapView = App.maperial.views[0]
   }

   //=============================================================================//
   // Layers
   
   MapCreationController.openDemoSelection = function(){
      $("#demoSelectionWindow").modal();
      $('#demoSelectionWindow').off('hidden');
      $('#demoSelectionWindow').on('hidden', function(){
         setTimeout(function(){
            if(MapCreationController.mapView.config.layers.length == 0)
               MapCreationController.openBasemaps()
         }, 350);
      });
   }
   
   //=============================================================================//
   // Map controls

   MapCreationController.saveMap = function()
   {
      MapCreationController.closeSettings();
      
      // remove custom settingView stuffs from config
      delete MapCreationController.mapView.config.hud.elements["Settings"];
      delete MapCreationController.mapView.config.map.requireBoundingBoxDrawer;
      delete MapCreationController.mapView.config.map.layersCreation;

      App.removeMargins(MapCreationController.mapView.config);
      
      // update the selectedMap
      App.user.set('selectedMap.config', MapCreationController.mapView.config);
      App.user.set('selectedMap.name', $("#mapNameInput").val());

      // Save the map server side !
      if(App.user.isCreatingANewMap)
         App.mapManager.uploadNewMap(App.user.selectedMap);
      else
         App.mapManager.saveMap(App.user.selectedMap);
   }
   
   //=============================================================================//
   
   MapCreationController.loadDemo = function(num)
   {
      var mapUID = Maperial.DEMO_MAP[num]

      App.mapManager.getMap(mapUID, function(map){
         App.user.set("selectedMap", map);
         App.user.set("isCreatingANewMap", false);
         MapCreationController.openLayersCreation();
         $("#demoSelectionWindow").modal("hide");
      });
   }
   
   //=============================================================================//

   App.MapCreationController = MapCreationController;

   //==================================================================//
   // Routing

   App.MapCreationRouting = App.Page.extend({
      route: '/mapCreation',

      connectOutlets: function(router){
         var customContext = new Object();
         customContext["datasetsData"] = App.datasetsData; // datasetsData required in rasterList
         App.Router.openPage(router, "mapCreation", customContext);
      },
   
      //--------------------------------------//
      // styles states

      myStyles: Ember.Route.extend({
         route: '/',
         connectOutlets: function(router) {
            var customParams = [];
            customParams["styles"] = App.user.styles;
            customParams["stylesData"] = App.stylesData;
            App.Router.openComponent(router, "mapCreation", customParams);
         }
      }),

      publicStyles: Ember.Route.extend({
         route: '/',
         connectOutlets: function(router) {
            var customParams = [];
            customParams["styles"] = App.publicData.styles;
            customParams["stylesData"] = App.stylesData;
            App.Router.openComponent(router, "mapCreation", customParams);
         }
      }),
      
      //---------------------//
      // styles actions

      showPublicStyles: Ember.Route.transitionTo('mapCreation.publicStyles'),
      showMyStyles: Ember.Route.transitionTo('mapCreation.myStyles'),

      selectStyle : function(router, event){
         MapCreationController.selectStyle(event.context);
      },

      changeStyle : function(router, event){
         MapCreationController.changeStyle();
      },

      //---------------------//
      // layers actions
      
//      openBasemaps: function(router, event){
//         MapCreationController.openBasemaps()
//      },
//
//      openData: function(router, event){
//         MapCreationController.openData()
//      },
      
      //-----------//
      
      addLayer: function(router, event){
         console.log("---------> addLayer : ", event.contexts)
         var source = event.contexts[0];
         var src    = event.contexts[1];
         MapCreationController.addLayer(source, src);
      },

      openSettings: function(router, event){
         MapCreationController.openSettings();
      },
      
      backToLayers: function(router, event){
         MapCreationController.backToLayers();
      },
      
      //--------------------------------------//
      // raster actions
      
      selectRaster: function(router, event){
         var raster = event.context;
         MapCreationController.selectRaster(raster);
      },

      //--------------------------------------//
      // Settings actions
      
      saveMap: function(router, event){
         MapCreationController.saveMap();
      },

      editBoundingBox: function(router, event){
         MapCreationController.editBoundingBox();
      },
      
      cancelBoundingBox: function(router, event){
         MapCreationController.cancelBoundingBox();
      },

      saveBoundingBox: function(router, event){
         MapCreationController.saveBoundingBox();
      },
      
      resetInputs: function(router, event){
         MapCreationController.resetInputs();
      },
      
      useInputs: function(router, event){
         MapCreationController.useInputs();
      },

      //--------------------------------------//
      // as a tryscreen

      signin      : function(){window.location.href="/?login"},
      
      startDemo   : function(){
         $("#demoSelectionWindow").modal("hide");
         App.user.set("isCreatingANewMap", true);  

         var config = MapCreationController.getLayersCreationConfig();
         App.maperial.build([{
            options  :  { name : "maperial"},
            config   :  config
         }]);
      },

      loadDemo1    : function(){ MapCreationController.loadDemo(0) },
      loadDemo2    : function(){ MapCreationController.loadDemo(1) },
      loadDemo3    : function(){ MapCreationController.loadDemo(2) },
      loadDemo4    : function(){ MapCreationController.loadDemo(3) },
      loadDemo5    : function(){ MapCreationController.loadDemo(4) },
      loadDemo6    : function(){ MapCreationController.loadDemo(5) },
   });

   //==================================================================//

})();