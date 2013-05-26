//==================================================================//

function Maperial(tagId, width, height){

   this.tagId = tagId || "_maperial";
   this.width = width;
   this.height = height;

   this.config = null;
   this.context = null;

   this.mapRenderer = null;
   this.mapMover = null;
   this.mapMouse = null;
   this.hud = null;

   this.stylesManager = null;
   this.colorbarsManager = null;
   this.layersManager = null;
   this.sourcesManager = null;

   this.geoloc = null;
   this.styleMenu = null;
   this.colorbarRenderer = null;

   this.templateBuilder = new TemplateBuilder();
   
   this.shaders = [Maperial.AlphaClip, Maperial.AlphaBlend, Maperial.MulBlend];
};

//==================================================================//

Maperial.staticURL              = (window.location.hostname == "maperial.localhost" || window.location.hostname == "maperial.localhost.deploy") ? 'http://static.maperial.localhost' : 'http://static.maperial.com';
Maperial.apiURL                 = 'http://api.maperial.com';

Maperial.DEFAULT_ZOOM           = 10;
Maperial.DEFAULT_LATITUDE       = 48.833;
Maperial.DEFAULT_LONGITUDE      = 2.333;

Maperial.refreshRate            = 15; // ms
Maperial.tileDLTimeOut          = 60000; //ms
Maperial.tileSize               = 256;

Maperial.autoMoveSpeedRate      = 0.2;
Maperial.autoMoveMillis         = 700;
Maperial.autoMoveDeceleration   = 0.005;
Maperial.autoMoveAnalyseSize    = 10;

Maperial.DEFAULT_STYLE_UID      = "1_style_13ed75438c8b2ed8914";
Maperial.DEFAULT_COLORBAR_UID   = "1_colorbar_13c630ec3a5068919c3";

Maperial.AlphaClip              = "AlphaClip";
Maperial.AlphaBlend             = "AlphaBlend";
Maperial.MulBlend               = "MulBlend";

//==================================================================//

Maperial.DEMO_MAP_1              = "1_map_13ee017c8dac3b49852";
Maperial.DEMO_MAP_2              = "1_map_13e4686751744c4fb4b";

//==================================================================//

/**
 * Must be called whenever the config is changed, in order to build Maperial again
 */
Maperial.prototype.restart = function(){
   $(window).trigger(MaperialEvents.LOADING);
   this.reset();
   this.load();
}

//==================================================================//

Maperial.prototype.apply = function(config){
   console.log("MaperialJS applies ", config);
   this.config = config;
   this.checkConfig();
   this.restart();
}

//==================================================================//

Maperial.prototype.reset = function(){

   console.log("Reset maperial...");

   try{
      this.mapRenderer.reset();
   }catch(e){}

   try{
      this.mapMover.removeListeners();
      this.mapMouse.removeListeners();
      this.hud.reset();
   }catch(e){}

   try{
      this.styleMenu.removeListeners();
   }catch(e){}

   try{
      this.sourcesManager.releaseEverything();
   }catch(e){}
   
   this.colorbarsManager = new ColorbarsManager(this);
   this.stylesManager = new StylesManager(this);
   this.layersManager = new LayersManager(this);
   this.sourcesManager = new SourcesManager(this);

   console.log("stylesCache : ", window.maperialStyles);
}

//==================================================================//

Maperial.prototype.load = function() {

   console.log("Starting maperialJS build...");

   //--------------------------//

   this.templateBuilder.build(this);
   this.createContext();

   //--------------------------//
   // After having checked the config, there still may be no layers.
   // For instance in webapp.map.layersCreation the user may remove every layers.

   if(this.config.layers.length > 0){
      var maperial = this;
      maperial.loadStyles(function(){
         maperial.loadColorbars(function(){
            maperial.checkOSMSets();
            maperial.build();
         });
      });
   }
   else{
      this.finishStartup();
   }
}

//==================================================================//

Maperial.prototype.checkConfig = function() {

   console.log("checking config...");

   //--------------------------//
   // checking default objects

   if(!this.config)
      this.config = this.defaultConfig();

   if(!this.config.hud)
      this.config.hud = {elements:{}, options:{}};

   if(!this.config.map)
      this.config.map = {};

   if(!this.config.layers)
      this.config.layers = [];

   //--------------------------//
   // checking layer config

   if(this.config.layers.length == 0){
      if(this.config.map.layersCreation){
         console.log("  using no layer...");
      }
      else{
         console.log("  using default layers...");
         this.config.layers.push(LayersManager.getOSMLayerConfig());
      }      
   }
   else{
      console.log("  using custom layers...");
   }

   //--------------------------//
   // checking if Default style must be used

   this.changeStyle(Maperial.DEFAULT_STYLE_UID, 0, false);
}

//==================================================================//

Maperial.prototype.emptyConfig = function() {
   return {hud:{elements:{}, options:{}}, map: {defaultZoom: Maperial.DEFAULT_ZOOM}, layers:[]};
}

Maperial.prototype.defaultConfig = function() {
   console.log("using default config");
   var config = this.emptyConfig();
   HUD.applyDefaultHUD(config);
   return config;
}

//==================================================================//

Maperial.prototype.createContext = function() {

   if(!this.context){
      console.log("creating context...");

      this.context = {};
      this.context.coordS     = new CoordinateSystem ( Maperial.tileSize );
   }
   else
      console.log("reset context...");

   //----------------------------------------------------------

   this.context.centerM    = this.context.coordS.LatLonToMeters( this.startLatitude() , this.startLongitude() );
   this.context.mouseM     = this.context.centerM;     // Mouse coordinates in meters
   this.context.mouseP     = null;                     // Mouse coordinates inside the canvas
   this.context.zoom       = this.startZoom();

   //----------------------------------------------------------
   // set new divs (ember erase and build new divs)

   this.context.mapCanvas = $("#Map"+this.tagId);

   if(this.config.hud.elements[HUD.MAGNIFIER]){
      this.context.magnifierCanvas = $("#Magnifier"+this.tagId);
   }

   //----------------------------------------------------------
}

Maperial.prototype.startLatitude = function() {
   console.log("start", this.config.map.latMin, Maperial.DEFAULT_LATITUDE)
   if(this.config.map.latMin)
      return (this.config.map.latMin + this.config.map.latMax)/2;
   else
      return Maperial.DEFAULT_LATITUDE;
}

Maperial.prototype.startLongitude = function() {
   if(this.config.map.lonMin)
      return (this.config.map.lonMin + this.config.map.lonMax)/2;
   else
      return Maperial.DEFAULT_LONGITUDE;
}

Maperial.prototype.startZoom = function() {
   if(this.config.map.defaultZoom)
      return this.config.map.defaultZoom;
   else
      return Maperial.DEFAULT_ZOOM;
}

//==================================================================//

Maperial.prototype.loadStyles = function(next){

   console.log("checking styles...");
   var styleUIDs = [];

   for(var i = 0; i < this.config.layers.length; i++){
      var layerParams = this.config.layers[i].params;
      if(layerParams.styles){
         styleUIDs.push(layerParams.styles[layerParams.selectedStyle]);

         if(this.layersManager.firstOSMPosition < 0)
            this.layersManager.firstOSMPosition = i;
      }
   }

   if(styleUIDs.length > 0){
      this.stylesManager.fetchStyles(styleUIDs, next);
   }
   else 
      next();
}

//==================================================================//

Maperial.prototype.changeStyle = function(styleUID, position, overidde){

   if(position === undefined) position = 0;
   if(overidde === undefined) overidde = true;

   for(var i = 0; i < this.config.layers.length; i++){

      if(this.config.layers[i].source.type != Source.MaperialOSM)
         continue;

      var layerParams = this.config.layers[i].params;
      if(!layerParams.styles || overidde){

         if(!overidde)
            console.log("  using default style...");
         else
            console.log("Changing style...");

         layerParams.styles = {};
         layerParams.styles[position] = styleUID;
         layerParams.selectedStyle = position;
      }
   }

   if(overidde)
      this.restart();
}

//==================================================================//

Maperial.prototype.loadColorbars = function(next){

   console.log("checking colorbars...");
   var colorbarUIDs = [];

   for(var i = 0; i < this.config.layers.length; i++){
      var layerParams = this.config.layers[i].params;
      if(layerParams.colorbars){
         colorbarUIDs.push(layerParams.colorbars[layerParams.selectedColorbar]);
      }
   }

   if(colorbarUIDs.length > 0){
      this.colorbarsManager.fetchColorbars(colorbarUIDs, next);
   }
   else 
      next();
}

//==================================================================//

Maperial.prototype.checkOSMSets = function(){

   if(this.stylesManager.styleCacheEmpty())
      return;

   console.log("checking OSM sets...");

   var selectedStyle = this.stylesManager.getSelectedStyle();

   if(selectedStyle && !this.config.map.osmSets){
      this.layersManager.defaultOSMSets(selectedStyle);
   }

   this.refreshOSMVisibilities();
}

Maperial.prototype.refreshOSMVisibilities = function(){
   this.context.osmVisibilities = LayersManager.buildOSMVisibilities(this.config.map.osmSets);
}

//==================================================================//

Maperial.prototype.build = function() {

   console.log("starting build...");

   //--------------------------//

   this.buildMap();
   this.buildHUD();

   if(this.config.map.edition)
      this.buildStyleMenu();

   if(!this.colorbarsManager.colorbarCacheEmpty()){
      this.buildColorbar();
   }

   //--------------------------//

   if(this.requireGeoloc())
      this.initGeoloc();

   //--------------------------//

   this.finishStartup();
}

//==================================================================//

Maperial.prototype.finishStartup = function() {

   this.refreshScreen();
   $(window).resize(Utils.apply ( this , "refreshScreen" ) );
   $(window).trigger(MaperialEvents.READY);
}

//==================================================================//

Maperial.prototype.buildMap = function() {

   console.log("  building map...");

   this.mapRenderer = new MapRenderer( this );
   this.mapMover = new MapMover( this );
   this.mapMouse = new MapMouse( this );
   this.mapRenderer.Start();

   if(this.config.map.requireBoundingBoxDrawer){
      
      this.boundingBoxDrawer = new BoundingBoxDrawer(this);
      
      if(this.config.map.boundingBoxStartLat){
         this.boundingBoxDrawer.centerLat = this.config.map.boundingBoxStartLat;
         this.boundingBoxDrawer.centerLon = this.config.map.boundingBoxStartLon;
         this.SetCenter(this.boundingBoxDrawer.centerLat, this.boundingBoxDrawer.centerLon);
      }
   }
}

//==================================================================//

Maperial.prototype.requireGeoloc = function() {
   return this.config.hud.elements[HUD.GEOLOC] && (this.config.hud.elements[HUD.GEOLOC].show || this.config.hud.elements[HUD.SETTINGS]);
}

Maperial.prototype.initGeoloc = function() {
   this.geoloc = new GeoLoc(this, "GeoLoc"+this.tagId, $("#GeoLocGo"+this.tagId), false);
}

//==================================================================//

Maperial.prototype.buildStyleMenu = function() {
   this.styleMenu = new StyleMenu($("#DetailsMenu"+this.tagId) , $("#QuickEdit"+this.tagId) , $("#Zooms"+this.tagId) , this);
}

//==================================================================//

Maperial.prototype.buildColorbar = function() {
   this.colorbar = new Colorbar(
         $("#ColorBar"+this.tagId),
         this.colorbarsManager.getColorbar(Maperial.DEFAULT_COLORBAR_UID),
         50,355,50,40,true,25.4,375.89
   );
   
   this.mapRenderer.renderAllColorBars();
}

//==================================================================//

Maperial.prototype.buildHUD = function() {
   this.hud = new HUD( this );
}

//==================================================================//

Maperial.prototype.refreshScreen = function() {

   console.log("refreshing screen...");

   var w = $(window).width(); 
   var h = $(window).height();

   if(this.width)
      w = this.width;

   if(this.height)
      h = this.height;

   if(this.context.mapCanvas[0]){
      this.context.mapCanvas.css("width", w);
      this.context.mapCanvas.css("height", h);
      this.context.mapCanvas[0].width = w;
      this.context.mapCanvas[0].height = h;
   }

   try{
      this.mapRenderer.fitToSize();
      this.mapMover.resizeDrawers();
      this.hud.placeElements();
   }
   catch(e){}
}

//==================================================================//

Maperial.prototype.setConfigCoordinates = function(lat, lon, zoom){
   this.config.map.latMin        = lat;
   this.config.map.latMax        = lat;
   this.config.map.lonMin        = lon;
   this.config.map.lonMax        = lon;
   this.config.map.defaultZoom   = zoom;
}

//==================================================================//
   
Maperial.prototype.SetCenter = function(lat,lon){
   this.context.centerM = this.context.coordS.LatLonToMeters( lat , lon );
   this.mapRenderer.DrawScene();
}

Maperial.prototype.SetZoom = function(z){
   if ( z > -1 && z < 19 ){
      this.context.zoom = z;
   }
}

Maperial.prototype.GetZoom = function(){
   return this.context.zoom;
}

Maperial.prototype.ZoomIn = function(){
   if ( this.context.zoom < 18 ){
      this.SetZoom(this.context.zoom + 1 );
   }
}

Maperial.prototype.ZoomOut = function(){
   if ( this.context.zoom > 0 ){
      this.SetZoom(this.context.zoom - 1 );
   }
}

//==================================================================//

Maperial.prototype.showBoundingBox = function(boundingBox){
   this.boundingBoxDrawer.init(boundingBox);
   $("#drawBoardContainer"+this.tagId).removeClass("hide");
}

Maperial.prototype.hideBoundingBox = function(){
   $("#drawBoardContainer"+this.tagId).addClass("hide");
}

Maperial.prototype.deactivateBoundingBoxDrawing = function(){
   this.boundingBoxDrawer.deactivateDrawing();
}

Maperial.prototype.activateBoundingBoxDrawing = function(){
   this.boundingBoxDrawer.activateDrawing();
}