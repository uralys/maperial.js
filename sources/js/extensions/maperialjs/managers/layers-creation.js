/**
 * This is the panel-layer-creation Controller
 */
function LayersCreation(maperial){
   this.maperial = maperial
}

//--------------------------------------//

LayersCreation.prototype.openBasemaps = function(viewName, callback){
   if(!callback){
      var me = this
      callback = function (viewName, dataType, src) { me.addBasemap (viewName, dataType, src) }
   }
      
   this.maperial.getView(viewName).hud.openBasemaps(HUD.ALL_BASEMAPS, callback)
}

LayersCreation.prototype.addBasemap = function(viewName, sourceType, src){
   var view = this.maperial.getView(viewName)
   this.addLayer(view, sourceType, src)
   this.closeBasemaps(view)
}

LayersCreation.prototype.closeBasemaps = function(view){
   view.hud.closeBasemaps()
}

//--------------------------------------//
//Data

LayersCreation.prototype.openData = function(viewName, callback){
   if(!callback){
      var me = this
      callback = function (viewName, dataType, src) { me.addData (viewName, dataType, src) }
   }

   this.maperial.getView(viewName).hud.openData(HUD.WMS_DATA, callback)
}

LayersCreation.prototype.addData = function(viewName, dataType, src){
   var view = this.maperial.getView(viewName)
   this.addLayer(view, dataType, src)
   this.closeData(view)
}

LayersCreation.prototype.closeData = function(view){
   view.hud.closeData()
}

//--------------------------------------//
// Edit Images

LayersCreation.prototype.editImages = function(view){
   view.hud.openBasemaps(HUD.IMAGE_BASEMAPS, this.changeImage)
}

LayersCreation.prototype.changeImage = function(viewName, sourceType, src){
   var view = this.maperial.getView(viewName)
   
   if(src != null)
      view.layersManager.changeImages(this.currentLayerIndex, src)
   
   this.closeBasemaps(view)
}

//--------------------------------------//
// Edit WMS

LayersCreation.prototype.editWMS = function(view){
   view.hud.openData(HUD.WMS_DATA, this.changeWMS)
}

LayersCreation.prototype.changeWMS = function(viewName, dataType, src){
   var view = this.maperial.getView(viewName)

   if(src != null)
      view.layersManager.changeImages(this.currentLayerIndex, src)
   
   this.closeData(view)
}

//==============================================================//

LayersCreation.prototype.addLayer = function(view, sourceType, src){
   console.log("-----> addLayer ", view.name, sourceType, src)
   switch(sourceType){

      // ------------------------------------------//
      // Sources for LayersManager.Vector
      
      case Source.MaperialOSM:
         this.addOSMLayer(view, src);
         break;

      case Source.Vector:
         console.log("addLayer Source.Vector | Not developed yet")
         break;

      // ------------------------------------------//
      // Sources for LayersManager.Raster
         
      case Source.Raster:
         this.openSelectRasterWindow();
         break;


      // ------------------------------------------//
      // Sources for LayersManager.Images
         
      case Source.Images:
         this.addImagesLayer(view, src);
         break;
         
      case Source.WMS:
         this.addWMSLayer(view, src);
         break;
         
      // ------------------------------------------//
      // Sources for LayersManager.Shade and LayersManager.SRTM
         
      case LayersManager.SRTM:
      case LayersManager.Shade:
         view.layersManager.addLayer(sourceType);
         break;
   }
}

//--------------------------------------//

LayersCreation.prototype.addOSMLayer = function(view, src){
   
   var params;
   console.log("addOSMLayer : ", view.name, src)
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
   view.layersManager.addLayer(Source.MaperialOSM, params);
}
//--------------------------------------//

LayersCreation.prototype.addImagesLayer = function(view, src){
   console.log("-----> addImagesLayer ", view.name, src)
   view.layersManager.addLayer(Source.Images, [src]);
}

//--------------------------------------//

LayersCreation.prototype.addWMSLayer = function(view, src){
   view.layersManager.addLayer(Source.WMS, [src]);
}

//--------------------------------------//

LayersCreation.prototype.editLayer = function(viewName, layerIndex){
   
   if(this.preventNextEdit){
      // mouseUp when dragging layer arrives here : not a click : prevent this call.
      return;
   }

   var view    = this.maperial.getView(viewName)
   var layer   = view.config.layers[layerIndex];
   this.currentLayerIndex = layerIndex;
   
   switch(layer.source.type){
      case Source.MaperialOSM :
         this.openSelectStyleWindow();
         break;

      case Source.Raster :
         this.openSelectRasterWindow();
         break;
         
      case Source.Images:
         this.editImages(view);
         break;

      case Source.WMS:
         this.editWMS(view);
         break;
         
   }
}

//--------------------------------------//

/** Attention ! dependant de WEBAPP **/
LayersCreation.prototype.customizeLayer = function(viewName, layerIndex){
   var view  = this.maperial.getView(viewName)
   var layer = view.config.layers[layerIndex];
   this.currentLayerIndex = layerIndex;
   this.openCustomizeLayerWindow(layer);
}

//--------------------------------------//

/** Attention ! dependant de WEBAPP **/
LayersCreation.prototype.editStyle = function(viewName, layerIndex){
   var view  = this.maperial.getView(viewName)
   var layer = view.config.layers[layerIndex];
   
   App.mapManager.backUpMap()
   App.stylesData.set("selectedStyle.uid", layer.params.styles[layer.params.selectedStyle])
   App.StylesController.editStyle(App.stylesData.selectedStyle)
}

//--------------------------------------//

LayersCreation.prototype.deleteLayer = function(viewName, layerIndex){
   var view  = this.maperial.getView(viewName)
   view.layersManager.deleteLayer(layerIndex);

   if(view.config.layers.length == 0)
      this.openBasemaps(view, this.addBasemap)
}

//=============================================================================//
// OSM Styles

/** Attention ! dependant de WEBAPP **/
LayersCreation.prototype.openSelectStyleWindow = function(){
   App.get('router').transitionTo('mapCreation.publicStyles');
   $("#selectStyleWindow").modal();
   $('#selectStyleWindow').off('hidden');
   $('#selectStyleWindow').on('hidden', this.setSelectedStyle);
}

LayersCreation.prototype.selectStyle = function(style){
   // TODO EVENT
   App.stylesData.set("selectedStyle", style);
}

//** called from StylesController.changeStyle()... 
LayersCreation.prototype.changeStyle = function(){
   // TODO EVENT
   this.mapView.changeStyle(App.stylesData.selectedStyle.uid);
   $("#selectStyleWindow").modal("hide");
}

//=============================================================================//
// Customize 

LayersCreation.prototype.openCustomizeLayerWindow = function(layer){

   console.log("customize layer " + this.currentLayerIndex);

   switch(layer.source.type){

      case Source.MaperialOSM :
         $("#customizeLayerOSMWindow").modal();
        // App.layersHelper.buildOSMSets(this.currentLayerIndex);
         break;
         
      case Source.Raster :
      case Source.Images:
      case Source.WMS:
         break;
         
   }
}

//=============================================================================//
// Rasters

/** Attention ! dependant de WEBAPP **/
LayersCreation.prototype.openSelectRasterWindow = function(){
   $("#selectRasterWindow").modal();
}

/** Attention ! dependant de WEBAPP **/
LayersCreation.prototype.selectRaster = function(raster){
   $("#selectRasterWindow").modal("hide");
   
   if(this.currentLayerIndex >= 0){
      console.log("editing a raster");
      this.mapView.layersManager.changeRaster(this.currentLayerIndex, raster.uid);
   }
   else{
      console.log("adding a new raster");
      this.mapView.layersManager.addLayer(Source.Raster, [raster.uid]);
   }
}

//=============================================================================//
// --- settings view

LayersCreation.prototype.openSettings = function(viewName){
   this.wizardSetView(this.SETTINGS);
   this.mapView.apply(this.getSettingsConfig());
   this.buildZoomSlider();
}

LayersCreation.prototype.backToLayers = function(){
   this.closeSettings();
   this.wizardSetView(this.LAYERS_CREATION);
   
   var config = this.getLayersCreationConfig();
   config.layers = this.mapView.config.layers;
   config.map = this.mapView.config.map;

   this.mapView.apply(config);
}

LayersCreation.prototype.closeSettings = function(){

}

//------------------------------------------------------------------//

LayersCreation.prototype.buildZoomSlider = function()
{
   // TODO EVENT
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

LayersCreation.prototype.editBoundingBox = function(){
   
   //------------------------------------------------//
   // Build HUD for this screen 
   
   this.mapView.config.hud = {elements:{}, options:{}};
   this.mapView.config.hud.elements["Settings"] = {show : true, type : HUD.PANEL, position : { right: "0", top: "0"}, disableHide : true, disableDrag : true };
   this.mapView.config.hud.elements[HUD.LATLON] = {show : true, type : HUD.PANEL, position : { left: "0", top: "0"}, disableHide : true, disableDrag : true };

   // TODO EVENT
   App.addMargins(this.mapView.config);
   
   this.mapView.hud.refresh();

   //------------------------------------------------//
   // listen to BB changes 
   
   $(window).on(MaperialEvents.NEW_BOUNDING_BOX, function(event, latMin, lonMin, latMax, lonMax){
      this.setMapBoundingBox(latMin, lonMin, latMax, lonMax);
   });
   
   //------------------------------------------------//

   // TODO APP
   var boundingBox = {};
   if(App.user.selectedMap.config.map.latMin){
      boundingBox.latMin = App.user.selectedMap.config.map.latMin;
      boundingBox.latMax = App.user.selectedMap.config.map.latMax;
      boundingBox.lonMin = App.user.selectedMap.config.map.lonMin;
      boundingBox.lonMax = App.user.selectedMap.config.map.lonMax;
   }
   
   this.mapView.showBoundingBox(boundingBox);

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
      this.mapView.deactivateBoundingBoxDrawing();
      return false;
   });

   $("#buttonDrawMode").click(function(){
      $("#buttonDrawMode").addClass("hide");
      $("#buttonMapMode").removeClass("hide");
      this.mapView.activateBoundingBoxDrawing();
      return false;
   });
   
   $("#buttonCenter").click(function(){
      this.mapView.boundingBoxDrawer.center();
      return false;
   });
   
   //------------------------------------------------//

   this.setUpValidation();
   
}

//------------------------------------------------------------------------------------------//

LayersCreation.prototype.setUpValidation = function(){

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

LayersCreation.prototype.saveBoundingBox = function(){
   this.closeBoundingBox();
}

LayersCreation.prototype.cancelBoundingBox = function(){
   this.mapView.boundingBoxDrawer.cancelEdition();
   
   var latMin = this.mapView.boundingBoxDrawer.initLatMin;
   var latMax = this.mapView.boundingBoxDrawer.initLatMax;
   var lonMin = this.mapView.boundingBoxDrawer.initLonMin;
   var lonMax = this.mapView.boundingBoxDrawer.initLonMax;
   
   App.user.set("selectedMap.config.map.latMin", latMin);
   App.user.set("selectedMap.config.map.latMax", latMax);
   App.user.set("selectedMap.config.map.lonMin", lonMin);
   App.user.set("selectedMap.config.map.lonMax", lonMax);
   
   this.closeBoundingBox();
}

LayersCreation.prototype.setMapBoundingBox = function(latMin, lonMin, latMax, lonMax){

   App.user.set("selectedMap.config.map.latMin", latMin);
   App.user.set("selectedMap.config.map.latMax", latMax);
   App.user.set("selectedMap.config.map.lonMin", lonMin);
   App.user.set("selectedMap.config.map.lonMax", lonMax);
}

LayersCreation.prototype.closeBoundingBox = function(){
   
   $(window).off(MaperialEvents.NEW_BOUNDING_BOX);
   this.mapView.hideBoundingBox();
   $("#buttonMapMode").unbind("click");
   $("#buttonDrawMode").unbind("click");
   $("#buttonCenter").unbind("click");
   $("#buttonReset").unbind("click");

   $("#globalSettings").removeClass("hide");
   $("#boundingBoxSettings").addClass("hide");

   this.mapView.config.hud = App.user.selectedMap.config.hud;
   this.mapView.hud.refresh();
}

//-----------------------------------//

LayersCreation.prototype.resetInputs = function(){
   var latMin = this.mapView.boundingBoxDrawer.latMin;
   var latMax = this.mapView.boundingBoxDrawer.latMax;
   var lonMin = this.mapView.boundingBoxDrawer.lonMin;
   var lonMax = this.mapView.boundingBoxDrawer.lonMax;
   
   $("#latMinInput").val(latMin);
   $("#latMaxInput").val(latMax);
   $("#lonMinInput").val(lonMin);
   $("#lonMaxInput").val(lonMax);
   
   $("#latLonForm").valid();
}

//-----------------------------------//

LayersCreation.prototype.useInputs = function(){
   
   if($("#latLonForm").valid()){
      var latMin = parseFloat($("#latMinInput").val());
      var latMax = parseFloat($("#latMaxInput").val());
      var lonMin = parseFloat($("#lonMinInput").val());
      var lonMax = parseFloat($("#lonMaxInput").val());
      
      this.mapView.boundingBoxDrawer.forceLatLon(latMin, lonMin, latMax, lonMax);
   }
}