
(function() {
   'use strict';

   var MapCreationController = Ember.ObjectController.extend({});
   
   //==================================================================//
   
   MapCreationController.LAYERS_CREATION  = "LAYERS_CREATION";
   MapCreationController.SETTINGS         = "SETTINGS";

   //==================================================================//
   // Rendering
   
   MapCreationController.init = function() {
      App.layersHelper = new LayersHelper(App.maperial, App.MapCreationController);

      $(window).on(  MaperialEvents.READY, MapCreationController.maperialReady);

      console.log("mapCreation", App.user.selectedMap)
      
      App.user.set("isCreatingANewMap", (App.user.selectedMap.uid == null));
      MapCreationController.wizardSetView(MapCreationController.LAYERS_CREATION);
      MapCreationController.openLayersCreation();

      $(".demobutton").tooltip()
   }
   
   MapCreationController.terminate = function () {
      App.user.set("isCreatingANewMap"    , false);  
      App.user.set("selectedMap"          , null);  
   }
   
   //==================================================================//
   // Calls by Listeners
   
   MapCreationController.maperialReady = function (){

      // not set before MaperialEvents.READY, because MaperialJS removes every Listeners on MaperialEvents during reset
      $(window).on(MaperialEvents.STYLE_CHANGED, MapCreationController.refreshLayersPanel);
      
      if(App.Globals.isViewLayerCreation){
         App.layersHelper.refreshLayersPanel();
      }
      else{
         App.layersHelper.refreshHUDViewerSettings();
      }
      
      MapCreationController.setSelectedStyle();
   }

   MapCreationController.refreshLayersPanel = function (){
      App.layersHelper.refreshLayersPanel();
   }
   
   //==================================================================//

   // init : once maperial is ready, getSelectedStyle is also the selected one in the styleSelectionWindow
   MapCreationController.setSelectedStyle = function (){
      App.stylesData.set("selectedStyle", App.maperial.stylesManager.getSelectedStyle());
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

      var config = App.maperial.emptyConfig();

      config.map.layersCreation = true;
      
      // custom
      config.hud.elements["Layers"]          = {show : true,  type : HUD.PANEL,  position : { right: "0", top: "0"},      disableHide : true, disableDrag : true };

      // maperial hud
      config.hud.elements[HUD.SETTINGS]      = {show : true,  type : HUD.TRIGGER,  disableHide : true,         disableDrag : true };
      config.hud.elements[HUD.COMPOSITIONS]  = {show : true,  type : HUD.PANEL,    label : "Composition",      disableDrag : true };
      config.hud.elements[HUD.LAYER_SETTINGS]= {show : true,  type : HUD.PANEL,    label : "Layer Settings",   disableDrag : true };
      config.hud.elements[HUD.CONTROLS]      = {show : false, type : HUD.PANEL,    label : "Controls",         disableDrag : true };
      config.hud.elements[HUD.SCALE]         = {show : false, type : HUD.PANEL,    label : "Scale" };
      config.hud.elements[HUD.GEOLOC]        = {show : false, type : HUD.PANEL,    label : "Location" };
      config.hud.elements[HUD.BASEMAPS]      = {show : true,  type : HUD.PANEL,    disableHide : true,         disableDrag : true };
      config.hud.elements[HUD.DATA]          = {show : true,  type : HUD.PANEL,    disableHide : true,         disableDrag : true };
      
      App.addMargins(config);      

      return config;
   }  

   //--------------------------------------------------------//
   
   MapCreationController.getSettingsConfig = function(){

      var config = App.maperial.emptyConfig()
      
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
      config.layers = App.maperial.config.layers

      config.map = App.maperial.config.map
      config.map.requireBoundingBoxDrawer = true
      
      return config
   }  
   
   //=============================================================================//
   // --- layer view

   MapCreationController.openLayersCreation = function()
   {
      var config = MapCreationController.getLayersCreationConfig();
      
      if(App.user.isCreatingANewMap){
         App.maperial.apply(config);

         if(App.Globals.isTryscreen)
            MapCreationController.openDemoSelection();
         else
            MapCreationController.openBasemaps();
      }
      else{
         config.layers = App.user.selectedMap.config.layers;
         config.map = App.user.selectedMap.config.map;
         App.maperial.apply(config);
      }

   }

   //=============================================================================//
   // Layers
   
   MapCreationController.openDemoSelection = function(){
      $("#demoSelectionWindow").modal();
      $('#demoSelectionWindow').off('hidden');
      $('#demoSelectionWindow').on('hidden', function(){
         setTimeout(function(){
            if(App.maperial.config.layers.length == 0)
               MapCreationController.openBasemaps()
         }, 350);
      });
   }

   //--------------------------------------//

   //old openSourceSelection  : MapCreationController.currentLayerIndex = -1;
   MapCreationController.openBasemaps = function(){
      App.maperial.hud.openBasemaps(
         HUD.ALL_BASEMAPS,
         MapCreationController.addBasemap
      )
   }

   MapCreationController.addBasemap = function(sourceType, src){
      MapCreationController.addLayer(sourceType, src)
      MapCreationController.closeBasemaps()
   }

   MapCreationController.closeBasemaps = function(){
      App.maperial.hud.closeBasemaps()
   }
   
   //--------------------------------------//
   // Edit Images

   MapCreationController.editImages = function(){
      App.maperial.hud.openBasemaps(
            HUD.IMAGE_BASEMAPS,
            MapCreationController.changeImage
      )
   }

   MapCreationController.changeImage = function(sourceType, src){
      if(src != null)
         App.maperial.layersManager.changeImages(MapCreationController.currentLayerIndex, src);
      
      MapCreationController.closeBasemaps()
   }
   
   //--------------------------------------//
   // Data
   
   MapCreationController.openData = function(){
      App.maperial.hud.openData(
         HUD.WMS_DATA,
         MapCreationController.addData
      )
   }

   MapCreationController.addData = function(dataType, src){
      MapCreationController.addLayer(dataType, src)
      MapCreationController.closeData()
   }

   MapCreationController.closeData = function(){
      App.maperial.hud.closeData()
   }

   //--------------------------------------//
   // Edit WMS

   MapCreationController.editWMS = function(){
      App.maperial.hud.openData(
            HUD.WMS_DATA,
            MapCreationController.changeWMS
      )
   }

   MapCreationController.changeWMS = function(dataType, src){
      if(src != null)
         App.maperial.layersManager.changeImages(MapCreationController.currentLayerIndex, src);
      
      MapCreationController.closeData()
   }
   
   //==============================================================//

   MapCreationController.addLayer = function(sourceType, src){
      console.log("-----> addLayer " + sourceType, src)
      switch(sourceType){

         // ------------------------------------------//
         // Sources for LayersManager.Vector
         
         case Source.MaperialOSM:
            MapCreationController.addOSMLayer(src);
            break;

         case Source.Vector:
            console.log("addLayer Source.Vector | Not developed yet")
            break;

         // ------------------------------------------//
         // Sources for LayersManager.Raster
            
         case Source.Raster:
            MapCreationController.openSelectRasterWindow();
            break;


         // ------------------------------------------//
         // Sources for LayersManager.Images
            
         case Source.Images:
            MapCreationController.addImagesLayer(src);
            break;
            
         case Source.WMS:
            MapCreationController.addWMSLayer(src);
            break;
            
         // ------------------------------------------//
         // Sources for LayersManager.Shade and LayersManager.SRTM
            
         case LayersManager.SRTM:
         case LayersManager.Shade:
            App.maperial.layersManager.addLayer(sourceType);
            MapCreationController.refreshLayersPanel()
            break;
      }
   }

   //--------------------------------------//

   MapCreationController.addOSMLayer = function(src){
//      if(App.maperial.config.layers.length > 0 
//      && App.maperial.config.layers[App.maperial.config.layers.length-1].source.type == Source.MaperialOSM){
//         // TODO :  ameliorer le UI avec bootstrap.alert
//         alert("Le layer du dessus est deja OSM");
//      }
//      else{
      
      var params;
      console.log("addOSMLayer : " + src)
      switch(src){
         case Source.MAPERIAL_BROWNIE:
            params = Source.MAPERIAL_BROWNIE_ID;
            break;
         case Source.MAPERIAL_CLASSIC:
            params = Source.MAPERIAL_CLASSIC_ID;
            break;
         case Source.MAPERIAL_COOKIES:
            params = Source.MAPERIAL_COOKIES_ID;
            break;
         case Source.MAPERIAL_FLUO:
            params = Source.MAPERIAL_FLUO_ID;
            break;
         case Source.MAPERIAL_GREEN:
            params = Source.MAPERIAL_GREEN_ID;
            break;
         case Source.MAPERIAL_LIGHT:
            params = Source.MAPERIAL_LIGHT_ID;
            break;
         case Source.MAPERIAL_PINK:
            params = Source.MAPERIAL_PINK_ID;
            break;
         case Source.MAPERIAL_YELLOW:
            params = Source.MAPERIAL_YELLOW_ID;
            break;
      }
      
      console.log("params : " + params)
      App.maperial.layersManager.addLayer(Source.MaperialOSM, params);
      MapCreationController.refreshLayersPanel()
   }

   //--------------------------------------//
   
   MapCreationController.addImagesLayer = function(src){
      App.maperial.layersManager.addLayer(Source.Images, [src]);
      MapCreationController.refreshLayersPanel()
   }
   
   //--------------------------------------//

   MapCreationController.addWMSLayer = function(src){
      App.maperial.layersManager.addLayer(Source.WMS, [src]);
      MapCreationController.refreshLayersPanel()
   }
   
   //--------------------------------------//

   MapCreationController.editLayer = function(layerIndex){
      
      if(MapCreationController.preventNextEdit){
         // mouseUp when dragging layer arrives here : not a click : prevent this call.
         return;
      }
         
      var layer = App.maperial.config.layers[layerIndex];
      MapCreationController.currentLayerIndex = layerIndex;
      
      switch(layer.source.type){
         case Source.MaperialOSM :
            MapCreationController.openSelectStyleWindow();
            break;

         case Source.Raster :
            MapCreationController.openSelectRasterWindow();
            break;
            
         case Source.Images:
            MapCreationController.editImages();
            break;

         case Source.WMS:
            MapCreationController.editWMS();
            break;
            
      }
   }

   //--------------------------------------//
   
   MapCreationController.customizeLayer = function(layerIndex){
      var layer = App.maperial.config.layers[layerIndex];
      MapCreationController.currentLayerIndex = layerIndex;
      MapCreationController.openCustomizeLayerWindow(layer);
   }
   
   //--------------------------------------//
   
   MapCreationController.editStyle = function(layerIndex){
      var layer = App.maperial.config.layers[layerIndex];
      App.mapManager.backUpMap()
      App.stylesData.set("selectedStyle.uid", layer.params.styles[layer.params.selectedStyle])
      App.StylesController.editStyle(App.stylesData.selectedStyle)
   }
   
   //--------------------------------------//
   
   MapCreationController.deleteLayer = function(layerIndex){
      App.maperial.layersManager.deleteLayer(layerIndex);
      
      if(App.maperial.config.layers.length == 0)
         MapCreationController.openBasemaps()
   }
   
   //=============================================================================//
   // OSM Styles
   
   MapCreationController.openSelectStyleWindow = function(){
      App.get('router').transitionTo('mapCreation.publicStyles');
      $("#selectStyleWindow").modal();
      $('#selectStyleWindow').off('hidden');
      $('#selectStyleWindow').on('hidden', MapCreationController.setSelectedStyle);
   }

   MapCreationController.selectStyle = function(style){
      App.stylesData.set("selectedStyle", style);
   }

   //** called from StylesController.changeStyle()... 
   MapCreationController.changeStyle = function(){
      App.maperial.changeStyle(App.stylesData.selectedStyle.uid);
      $("#selectStyleWindow").modal("hide");
   }

   //=============================================================================//
   // Customize 
   
   MapCreationController.openCustomizeLayerWindow = function(layer){

      console.log("customize layer " + MapCreationController.currentLayerIndex);

      switch(layer.source.type){

         case Source.MaperialOSM :
            $("#customizeLayerOSMWindow").modal();
            App.layersHelper.buildOSMSets(MapCreationController.currentLayerIndex);
            break;
            
         case Source.Raster :
         case Source.Images:
         case Source.WMS:
            break;
            
      }
   }
   
   //=============================================================================//
   // Rasters
   
   MapCreationController.openSelectRasterWindow = function(){
      $("#selectRasterWindow").modal();
   }

   MapCreationController.selectRaster = function(raster){
      $("#selectRasterWindow").modal("hide");
      
      if(MapCreationController.currentLayerIndex >= 0){
         console.log("editing a raster");
         App.maperial.layersManager.changeRaster(MapCreationController.currentLayerIndex, raster.uid);
      }
      else{
         console.log("adding a new raster");
         App.maperial.layersManager.addLayer(Source.Raster, [raster.uid]);
         MapCreationController.refreshLayersPanel()
      }
   }
   
   //=============================================================================//
   // --- settings view

   MapCreationController.openSettings = function(){
      MapCreationController.wizardSetView(MapCreationController.SETTINGS);
      App.maperial.apply(MapCreationController.getSettingsConfig());
      MapCreationController.buildZoomSlider();
   }

   MapCreationController.backToLayers = function(){
      MapCreationController.closeSettings();
      MapCreationController.wizardSetView(MapCreationController.LAYERS_CREATION);
      
      var config = MapCreationController.getLayersCreationConfig();
      config.layers = App.maperial.config.layers;
      config.map = App.maperial.config.map;

      App.maperial.apply(config);
   }
   
   MapCreationController.closeSettings = function(){

   }

   //------------------------------------------------------------------//
   
   MapCreationController.buildZoomSlider = function()
   {
      $("#zoomSelector").slider({
         range: "min",
         min: 1,
         max: 18,
         value: App.user.selectedMap.config.map.defaultZoom,
         slide: function( event, ui ) {
            $("#zoomSelector a").html(ui.value);
         },
         change: function( event, ui ) {
            App.user.set("selectedMap.config.map.defaultZoom", parseInt(ui.value));
         }
       });
      
      $("#zoomSelector a").html(App.user.selectedMap.config.map.defaultZoom);
      Utils.buildSliderStyle("zoomSelector");      
   }
   
   //------------------------------------------------------------------//
   
   MapCreationController.editBoundingBox = function(){
      
      //------------------------------------------------//
      // Build HUD for this screen 
      
      App.maperial.config.hud = {elements:{}, options:{}};
      App.maperial.config.hud.elements["Settings"] = {show : true, type : HUD.PANEL, position : { right: "0", top: "0"}, disableHide : true, disableDrag : true };
      App.maperial.config.hud.elements[HUD.LATLON] = {show : true, type : HUD.PANEL, position : { left: "0", top: "0"}, disableHide : true, disableDrag : true };
      
      App.addMargins(App.maperial.config);
      
      App.maperial.hud.refresh();

      //------------------------------------------------//
      // listen to BB changes 
      
      $(window).on(MaperialEvents.NEW_BOUNDING_BOX, function(event, latMin, lonMin, latMax, lonMax){
         MapCreationController.setMapBoundingBox(latMin, lonMin, latMax, lonMax);
      });
      
      //------------------------------------------------//
      
      var boundingBox = {};
      if(App.user.selectedMap.config.map.latMin){
         boundingBox.latMin = App.user.selectedMap.config.map.latMin;
         boundingBox.latMax = App.user.selectedMap.config.map.latMax;
         boundingBox.lonMin = App.user.selectedMap.config.map.lonMin;
         boundingBox.lonMax = App.user.selectedMap.config.map.lonMax;
      }
      
      App.maperial.showBoundingBox(boundingBox);

      //------------------------------------------------//
      // show/hide Webapp panels + button-mode

      $("#globalSettings").addClass("hide");
      $("#boundingBoxSettings").removeClass("hide");
      
      $("#buttonMapMode").addClass("hide");
      $("#buttonDrawMode").removeClass("hide");

      //------------------------------------------------//
      // button-mode actions
      
      $("#buttonMapMode").click(function(){
         $("#buttonMapMode").addClass("hide");
         $("#buttonDrawMode").removeClass("hide");
         App.maperial.deactivateBoundingBoxDrawing();
         return false;
      });

      $("#buttonDrawMode").click(function(){
         $("#buttonDrawMode").addClass("hide");
         $("#buttonMapMode").removeClass("hide");
         App.maperial.activateBoundingBoxDrawing();
         return false;
      });
      
      $("#buttonCenter").click(function(){
         App.maperial.boundingBoxDrawer.center();
         return false;
      });
      
      //------------------------------------------------//

      MapCreationController.setUpValidation();
      
   }

   //------------------------------------------------------------------------------------------//

   MapCreationController.setUpValidation = function(){

      $.validator.addMethod(
            "greaterThan",
            function(value, element, params) {
                var target = $(params).val();
                var isValueNumeric = !isNaN(parseFloat(value)) && isFinite(value);
                var isTargetNumeric = !isNaN(parseFloat(target)) && isFinite(target);
                if (isValueNumeric && isTargetNumeric) {
                   return Number(value) > Number(target);
                }
                 
                if (!/Invalid|NaN/.test(new Date(value))) {
                   return new Date(value) > new Date(target);
                }

                return false;
            });
      
      $.validator.addMethod(
            "lowerThan",
            function(value, element, params) {
               var target = $(params).val();
               var isValueNumeric = !isNaN(parseFloat(value)) && isFinite(value);
               var isTargetNumeric = !isNaN(parseFloat(target)) && isFinite(target);
               if (isValueNumeric && isTargetNumeric) {
                  return Number(value) < Number(target);
               }
               
               if (!/Invalid|NaN/.test(new Date(value))) {
                  return new Date(value) < new Date(target);
               }

               return false;
            });
      
      
      $("#latLonForm").validate({
         rules: {
            latMinInput: {
               number: true,
               required: true,
               min: -90,
               max: +90,
               lowerThan: "#latMaxInput"
            },
            latMaxInput: {
               required: true,
               number: true,
               min: -90,
               max: +90,
               greaterThan: "#latMinInput"
            },
            lonMinInput: {
               required: true,
               number: true,
               min: -180,
               max: +180,
               lowerThan: "#lonMaxInput"
            },
            lonMaxInput: {
               required: true,
               number: true,
               min: -180,
               max: +180,
               greaterThan: "#lonMinInput"
            },
         },
         messages: {
            latMinInput: {
               number: "Latitude is a number !",
               min: "-90 < Latitude < +90",
               max: "-90 < Latitude < +90",
               required: "Please provide a latitude",
               lowerThan: "Should be < latMax"
            },
            latMaxInput: {
               number: "Latitude is a number !",
               min: "-90 < Latitude < +90",
               max: "-90 < Latitude < +90",
               required: "Please provide a latitude",
               greaterThan: "Should be > latMin"
            },
            lonMinInput: {
               number: "Longitude is a number !",
               min: "-180 < Latitude < +180",
               max: "-180 < Latitude < +180",
               required: "Please provide a longitude",
               lowerThan: "Should be < lonMax"
            },
            lonMaxInput: {
               number: "Longitude is a number !",
               min: "-180 < Latitude < +180",
               max: "-180 < Latitude < +180",
               required: "Please provide a longitude",
               greaterThan: "Should be > lonMin"
            },
         }
      });
      
   }

   //------------------------------------------------------------------------------------------//
   
   MapCreationController.saveBoundingBox = function(){
      MapCreationController.closeBoundingBox();
   }

   MapCreationController.cancelBoundingBox = function(){
      App.maperial.boundingBoxDrawer.cancelEdition();
      
      var latMin = App.maperial.boundingBoxDrawer.initLatMin;
      var latMax = App.maperial.boundingBoxDrawer.initLatMax;
      var lonMin = App.maperial.boundingBoxDrawer.initLonMin;
      var lonMax = App.maperial.boundingBoxDrawer.initLonMax;
      
      App.user.set("selectedMap.config.map.latMin", latMin);
      App.user.set("selectedMap.config.map.latMax", latMax);
      App.user.set("selectedMap.config.map.lonMin", lonMin);
      App.user.set("selectedMap.config.map.lonMax", lonMax);
      
      MapCreationController.closeBoundingBox();
   }

   MapCreationController.setMapBoundingBox = function(latMin, lonMin, latMax, lonMax){

      App.user.set("selectedMap.config.map.latMin", latMin);
      App.user.set("selectedMap.config.map.latMax", latMax);
      App.user.set("selectedMap.config.map.lonMin", lonMin);
      App.user.set("selectedMap.config.map.lonMax", lonMax);
   }
   
   MapCreationController.closeBoundingBox = function(){
      
      $(window).off(MaperialEvents.NEW_BOUNDING_BOX);
      App.maperial.hideBoundingBox();
      $("#buttonMapMode").unbind("click");
      $("#buttonDrawMode").unbind("click");
      $("#buttonCenter").unbind("click");
      $("#buttonReset").unbind("click");

      $("#globalSettings").removeClass("hide");
      $("#boundingBoxSettings").addClass("hide");

      App.maperial.config.hud = App.user.selectedMap.config.hud;
      App.maperial.hud.refresh();
   }

   //-----------------------------------//

   MapCreationController.resetInputs = function(){
      var latMin = App.maperial.boundingBoxDrawer.latMin;
      var latMax = App.maperial.boundingBoxDrawer.latMax;
      var lonMin = App.maperial.boundingBoxDrawer.lonMin;
      var lonMax = App.maperial.boundingBoxDrawer.lonMax;
      
      $("#latMinInput").val(latMin);
      $("#latMaxInput").val(latMax);
      $("#lonMinInput").val(lonMin);
      $("#lonMaxInput").val(lonMax);
      
      $("#latLonForm").valid();
   }

   //-----------------------------------//
   
   MapCreationController.useInputs = function(){
      
      if($("#latLonForm").valid()){
         var latMin = parseFloat($("#latMinInput").val());
         var latMax = parseFloat($("#latMaxInput").val());
         var lonMin = parseFloat($("#lonMinInput").val());
         var lonMax = parseFloat($("#lonMaxInput").val());
         
         App.maperial.boundingBoxDrawer.forceLatLon(latMin, lonMin, latMax, lonMax);
      }
   }
   
   //=============================================================================//
   // Map controls

   MapCreationController.saveMap = function()
   {
      MapCreationController.closeSettings();
      
      // remove custom settingView stuffs from config
      delete App.maperial.config.hud.elements["Settings"];
      delete App.maperial.config.map.requireBoundingBoxDrawer;
      delete App.maperial.config.map.layersCreation;

      App.removeMargins(App.maperial.config);
      
      // update the selectedMap
      App.user.set('selectedMap.config', App.maperial.config);
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
      
      openBasemaps: function(router, event){
         MapCreationController.openBasemaps()
      },

      openData: function(router, event){
         MapCreationController.openData()
      },
      
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
         App.maperial.apply(config);
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