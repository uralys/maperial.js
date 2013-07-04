//==================================================================//

function MapView(maperial, map, options, config){

   //--------------------------------------------------------------//
   
   options                 = options || {}
   options.type            = options.type ?           (options.type == Maperial.MAIN || options.type == Maperial.ANCHOR || options.type == Maperial.LENS || options.type == Maperial.MINIFIER || options.type == Maperial.MAGNIFIER ? options.type : Maperial.ANCHOR) : Maperial.ANCHOR
   options.width           = options.width            || 150
   options.height          = options.height           || 150
   options.position        = options.position         || { left : 0, top : 0 }
   options.opacity         = options.opacity          || 1
   options.padding         = options.padding          || 0
   options.borderRadius    = options.borderRadius     || 0

   if(options.type == Maperial.ANCHOR){
      options.zoomable = true
      options.deltaZoom = 0
   }

   console.log("  prepare MapView ", map, options)
   
   //--------------------------------------------------------------//

   this.maperial           = maperial
   this.map                = map
   this.options            = options;
   this.config             = config;

   this.context            = null;

   this.type               = options.type
   this.name               = ((options && options.name)  ? options.name : Utils.generateGuid()) + "_" + this.map
   
   this.zoomable           = (options && options.zoomable != null) ? options.zoomable : true
   this.deltaZoom          = (options && options.deltaZoom != null) ? options.deltaZoom : 0

   //--------------------------------------------------------------//

   this.hud                = new HUD( this );

   this.mapRenderer        = null;
   this.mapMover           = null;
   this.mapMouse           = null;

   this.stylesManager      = null;
   this.colorbarsManager   = null;
   this.layersManager      = null;

   this.geoloc             = null;
   this.styleMenu          = null;
   this.colorbarRenderer   = null;
   
   //--------------------------------------------------------------//
   
   this.shaders            = [Maperial.AlphaClip, Maperial.AlphaBlend, Maperial.MulBlend];

   //--------------------------------------------------------------//
};

//==================================================================//

MapView.prototype.build = function(){
   console.log("MapView", this.name, "starts building", this.config);
   this.checkConfig();
   this.restart();
}

//==================================================================//

/**
 * Must be called whenever the config is changed, in order to build MapView again
 */
MapView.prototype.restart = function(){
   console.log("MapView restarts ", this.name, this.type, this.config);
   $(window).trigger(MaperialEvents.VIEW_LOADING, [this.name]);
   this.reset();
   this.load();
}

//==================================================================//

MapView.prototype.reset = function(){

   console.log("Reset MapView...");

   try{
      if(this.mapRenderer){
         this.mapRenderer.Stop();
         this.mapRenderer.reset();
      }
   }catch(e){
   }

   try{
      if(this.mapMover)
         this.mapMover.removeListeners();
      
      if(this.mapMouse)
         this.mapMouse.removeListeners();
      
      if(this.hud)
         this.hud.reset();
   }catch(e){
   }

   try{
      if(this.styleMenu)
         this.styleMenu.removeListeners();
   }catch(e){}

   try{
      if(this.maperial.sourcesManager)
         this.maperial.sourcesManager.releaseReceiver(this.name);
   }catch(e){
   }
   
   this.colorbarsManager = new ColorbarsManager(this);
   this.stylesManager = new StylesManager(this);
   this.layersManager = new LayersManager(this);
   
   this.maperial.sourcesManager.addReceiver(this)

   for(var i = 0; i < this.config.layers.length; i++){
      if(this.config.layers[i].source.type == Source.WMS){
         this.centerWMS( this.config.layers[i].source.params.src, "prepare" )
      }
   }
   
   console.log("stylesCache : ", window.maperialViewStyles);
   console.log("sourcesManager : ", this.maperial.sourcesManager);
}

//==================================================================//

MapView.prototype.load = function() {

   console.log("Starting MapViewJS build...");

   //--------------------------//

   this.maperial.templateBuilder.build(this);
   this.createContext();

   //--------------------------//
   // After having checked the config, there still may be no layers.
   // For instance in webapp.map.layersCreation the user may remove every layers.

   if(this.config.layers.length > 0){
      var mapView = this;
      mapView.loadStyles(function(){
         mapView.loadColorbars(function(){
            mapView.checkOSMSets();
            mapView.buildAll();
         });
      });
   }
   else{
      this.buildHUD();
      this.finishStartup();
   }
}

//==================================================================//

MapView.prototype.checkConfig = function() {

   console.log("checking config...");
   odump(this.config)

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
      this.checkIds()
   }

   //--------------------------//
   // checking if Default style must be used

   //this.changeStyle(Maperial.DEFAULT_STYLE_UID, 0, false);
}

/**
 * to get source.id for old layers
 * TMP : ids should be ok for maps from now on
 */
MapView.prototype.checkIds = function() {

   for(var i = 0; i < this.config.layers.length; i++){
      
      //--> Map having no source.id
      if(!this.config.layers[i].source.id){
         console.log("  -------> OLD MAP -------> looking for id...");
         
         switch(this.config.layers[i].source.type){
            case Source.MaperialOSM:
               this.config.layers[i].source.id = this.config.layers[i].params.styles[this.config.layers[i].params.selectedStyle]
               break;

            case Source.SRTM:
               this.config.layers[i].source.id = Source.SRTM
               break;

            case Source.Raster:
               this.config.layers[i].source.id = this.config.layers[i].source.params.uid
               break;

            case Source.Images:
            case Source.WMS:
               this.config.layers[i].source.id = this.config.layers[i].source.params.src
               break;
         }
      }

      //--> Map having shade --> now source.SRTM
      else if(this.config.layers[i].source.id == "shade"){
         console.log("  -------> OLD MAP with shade -------> switching to SRTM...");
         this.config.layers[i].source.type = Source.SRTM
         this.config.layers[i].source.id   = Source.SRTM
      }
   }
}

//==================================================================//

MapView.prototype.createContext = function() {

   if(!this.context){
      console.log("creating context...");

      this.context         = {};
      this.context.coordS  = new CoordinateSystem ( Maperial.tileSize );
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

   this.context.mapCanvas = $("#Map_"+this.name);
   this.setCanvasSize();

   if(this.config.hud.elements[HUD.MAGNIFIER]){
      this.context.magnifierCanvas = $("#Magnifier"+this.name);
   }

   //----------------------------------------------------------
}

MapView.prototype.startLatitude = function() {
   if(this.config.map.currentLat)
      return this.config.map.currentLat
   else if(this.config.map.latMin)
      return (this.config.map.latMin + this.config.map.latMax)/2;
   else if(this.config.map.latitude)
      return this.config.map.latitude;
   else
      return Maperial.DEFAULT_LATITUDE;
}

MapView.prototype.startLongitude = function() {
   if(this.config.map.currentLon)
      return this.config.map.currentLon
   else if(this.config.map.lonMin)
      return (this.config.map.lonMin + this.config.map.lonMax)/2;
   else if(this.config.map.longitude)
      return this.config.map.longitude;
   else
      return Maperial.DEFAULT_LONGITUDE;
}

MapView.prototype.startZoom = function() {
   
   if(this.config.map.currentZoom)
      return this.config.map.currentZoom
   else if(this.config.map.defaultZoom)
      return this.config.map.defaultZoom;
   else
      return Maperial.DEFAULT_ZOOM;
}

//==================================================================//

MapView.prototype.loadStyles = function(next){

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

/**
 * a revoir completement pour une gestion multi styles.
 * ici on recupere le dernier layerOSM pour le refresh = pas possible d'avoir plusieurs layers OSM avec ce fonctionnement
 */
MapView.prototype.changeStyle = function(styleUID, position, refresh){

   if(position === undefined) position = 0;
   if(refresh === undefined) refresh = true;
   
   // ici c'est foireux : ca ne permet pas proprement un multi layerCreation sur plusieurs mapView.
   // ca bugguera si on ouvre une edition, puis une 2e sur la 2e view avant de finir la premiere.
   var layerToRefresh = this.maperial.layersCreation.currentLayerIndex
   
   var layerParams = this.config.layers[layerToRefresh].params;
   if(!layerParams.styles || refresh){

      if(refresh)
         console.log("Changing style...");
      else
         console.log("  using default style...");

      layerParams.styles = {};
      layerParams.styles[position] = styleUID;
      layerParams.selectedStyle = position;
   }

   if(refresh){
      var me = this
      this.stylesManager.loadStyle(styleUID, function(){
         var mapLatLon = me.context.coordS.MetersToLatLon(me.context.centerM.x, me.context.centerM.y)
         
         me.config.map.currentLat    = mapLatLon.y
         me.config.map.currentLon    = mapLatLon.x
         me.config.map.currentZoom   = me.context.zoom
         
         me.refreshOSMVisibilities()
         $(window).trigger(MaperialEvents.STYLE_CHANGED, [me.name, layerToRefresh]);
      })
   }
}

//==================================================================//

MapView.prototype.loadColorbars = function(next){

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

MapView.prototype.checkOSMSets = function(){

   if(this.stylesManager.styleCacheEmpty())
      return;

   console.log("checking OSM sets...");

   var selectedStyle = this.stylesManager.getSelectedStyle();

   if(selectedStyle && !this.config.map.osmSets){
      this.layersManager.defaultOSMSets(selectedStyle);
   }

   this.refreshOSMVisibilities();
}

MapView.prototype.refreshOSMVisibilities = function(){
   this.context.osmVisibilities = LayersManager.buildOSMVisibilities(this.config.map.osmSets);
}

//==================================================================//

MapView.prototype.buildAll = function() {

   console.log("build all elements...");

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

MapView.prototype.finishStartup = function() {

   this.refreshScreen();
   
   console.log("MapView is ready")
   
   $(window).trigger(MaperialEvents.VIEW_READY, [this.name])
}

//==================================================================//

MapView.prototype.buildMap = function() {

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
   
   //------------------------//
   
   var me = this
   var panel = $("#panel"+this.name)

   if(this.options.draggable){
      var me = this
      panel.draggable({ 
         snap           : false, 
         containment    : "#TheMaperial",
         scroll         : false,   
         start: function(event) {
            if(me.type == Maperial.LENS)
               me.moveChildInterval = setInterval( function(){ me.refreshCamera() } , 0.01 );
         },
         stop: function(event) {
            clearInterval(me.moveChildInterval);
            me.moveChildInterval = null
         }
      });
   }
      
}

//==================================================================//

MapView.prototype.requireGeoloc = function() {
   return this.config.hud.elements[HUD.GEOLOC] && (this.config.hud.elements[HUD.GEOLOC].show || this.config.hud.elements[HUD.SETTINGS]);
}

MapView.prototype.initGeoloc = function() {
   this.geoloc = new GeoLoc(this, "GeoLoc_"+this.name, $("#GeoLocGo_"+this.name), false);
}

//==================================================================//

MapView.prototype.buildStyleMenu = function() {
   this.styleMenu = new StyleMenu($("#DetailsMenu_"+this.name) , $("#QuickEdit_"+this.name) , $("#Zooms_"+this.name) , this);
}

//==================================================================//

MapView.prototype.buildColorbar = function() {
   this.colorbar = new Colorbar(
         $("#ColorBar_"+this.name),
         this.colorbarsManager.getColorbar(Maperial.DEFAULT_COLORBAR_UID),
         50,355,50,40,true,25.4,375.89
   );
   
   this.mapRenderer.renderAllColorBars();
}

//==================================================================//

MapView.prototype.buildHUD = function() {
   this.hud.build();
}

//==================================================================//

MapView.prototype.setCanvasSize = function() {

   var w = this.width;
   var h = this.height;
   
   if(this.context.mapCanvas[0]){
      this.context.mapCanvas.css("width", w);
      this.context.mapCanvas.css("height", h);
      this.context.mapCanvas[0].width = w;
      this.context.mapCanvas[0].height = h;
   }
}

MapView.prototype.refreshScreen = function() {
   console.log(" refreshing screen...")
   
   $('body').css('overflow', 'hidden');
   if(typeof this.options.width == "string"){
      var parentWidth   = this.parent ? this.parent.width : $("#TheMaperial").width()
      var widthParams   = this.options.width.split("%")
      if(widthParams.length > 1)
         this.width = widthParams[0] * parentWidth/100
      else
         this.width =  this.options.width
   }
   else
      this.width =  $("#TheMaperial").width()

   if(typeof this.options.height == "string"){
      var parentHeight   = this.parent ? this.parent.height : $("#TheMaperial").height()
      var heightParams   = this.options.height.split("%")
      if(heightParams.length > 1)
         this.height = heightParams[0] * parentHeight/100
      else
         this.height =  this.options.height
   }
   else
      this.height = $("#TheMaperial").height()
      
   this.setCanvasSize()
      
   $('body').css('overflow', 'hidden');
   this.context.mapCanvas.css("position", "relative");
   
   try{
      this.mapRenderer.fitToSize();
   }
   catch(e){
      console.log("------------> fito size pb")
      console.log(e)
   }

   try{
      this.hud.placeElements();
      this.mapMover.resizeDrawers();
   }
   catch(e){
      console.log("------------> placing pb")
      console.log(e)
   }

   if(this.type != Maperial.MAIN){
      this.hud.placeMapView()
      this.refreshCamera()
   }

   this.hud.styleView()

   $('body').css('overflow', 'auto');
}

//==================================================================//

MapView.prototype.refreshCurrentLatLon = function(){
   var mapLatLon = this.context.coordS.MetersToLatLon(this.context.centerM.x, this.context.centerM.y)
   this.config.map.currentLat   = mapLatLon.y
   this.config.map.currentLon   = mapLatLon.x
   this.config.map.currentZoom  = this.context.zoom
}

//==================================================================//

MapView.prototype.centerMap = function(lat, lon, zoom, type){

   switch(type){
      case "prepare" : 
         this.prepareCenter(lat, lon, zoom)
         break;
      case "place" : 
         this.placeMap(lat, lon, zoom)
         break;
   }  
}

/**
 * Prepare the config being created to put the map at given x.y.z
 */
MapView.prototype.prepareCenter = function(lat, lon, zoom){
   this.config.map.currentLat   = lat
   this.config.map.currentLon   = lon
   this.config.map.currentZoom  = zoom
}

/**
 * Immediately put the map at given x.y.z
 */
MapView.prototype.placeMap = function(lat, lon, zoom){
   this.SetCenter (lat, lon)
   this.SetZoom   (zoom)
}

//==================================================================//

MapView.prototype.SetCenter = function(lat,lon){
   this.context.centerM = this.context.coordS.LatLonToMeters( lat , lon );
   this.refreshCurrentLatLon();
   //this.mapRenderer.DrawScene();
}

MapView.prototype.SetZoom = function(z){
   if ( z > -1 && z < 19 ){
      this.context.zoom = z;
   }
}

MapView.prototype.GetZoom = function(){
   return this.context.zoom;
}

MapView.prototype.ZoomIn = function(){
   if ( this.context.zoom < 18 ){
      this.SetZoom(this.context.zoom + 1 );
   }
}

MapView.prototype.ZoomOut = function(){
   if ( this.context.zoom > 0 ){
      this.SetZoom(this.context.zoom - 1 );
   }
}

//==================================================================//

MapView.prototype.showBoundingBox = function(boundingBox){
   this.boundingBoxDrawer.init(boundingBox);
   $("#drawBoardContainer"+this.name).removeClass("hide");
}

MapView.prototype.hideBoundingBox = function(){
   $("#drawBoardContainer"+this.name).addClass("hide");
}

MapView.prototype.deactivateBoundingBoxDrawing = function(){
   this.boundingBoxDrawer.deactivateDrawing();
}

MapView.prototype.activateBoundingBoxDrawing = function(){
   this.boundingBoxDrawer.activateDrawing();
}

//==================================================================//

MapView.prototype.getFullName = function(childName){
   return childName + "_" + this.name
}

//==================================================================//

/**
 * type = "prepare" or "place"
 */
MapView.prototype.centerWMS = function (src, type) {
   
   switch(src){
      // US - only
      case Source.IMAGES_STAMEN_TERRAIN : 
         this.centerMap(40.68, -74.12, 7, type)
         break;

         // Bretagne
      case Source.WMS_BRETAGNECANTONS : 
         this.centerMap(48.27, -2.87, 9, type)
         break;

         // Rennes
      case Source.WMS_SOLS_ILEETVILAINE : 
         this.centerMap(48.11, -1.78, 10, type)
         break;
   }   
}

//==================================================================//

MapView.prototype.refreshZoom = function (typeTriggering, zoom) {
   
   switch(this.type){
      case Maperial.MAIN : 
      case Maperial.ANCHOR :

         switch(typeTriggering){
            case Maperial.MAIN : 
            case Maperial.ANCHOR :
               this.context.zoom = zoom;
               break;

            case Maperial.MINIFIER : 
            case Maperial.MAGNIFIER : 
            case Maperial.LENS :
               break;
         }

         break;

      case Maperial.MINIFIER : 
      case Maperial.MAGNIFIER : 
      case Maperial.LENS :

         switch(typeTriggering){
            case Maperial.MAIN : 
            case Maperial.ANCHOR :
               this.context.zoom = zoom + this.deltaZoom;
               break;

            case Maperial.MINIFIER : 
            case Maperial.MAGNIFIER : 
            case Maperial.LENS :
               break;
         }
         break;
   }

}

//==================================================================//

MapView.prototype.refreshCamera = function (viewTriggering, typeTriggering, zoom) {

   if(!viewTriggering)
      viewTriggering = this.maperial.getMainView(this.map).name

   if(!typeTriggering)
      typeTriggering = Maperial.MAIN

   if(!zoom)
      zoom = this.maperial.getZoom(this.map)

   this.refreshZoom(typeTriggering, zoom);
   
   switch(this.type){
      case Maperial.MINIFIER : 
         this.context.centerM = this.maperial.getMainView(this.map).context.centerM
         break;

      case Maperial.MAGNIFIER : 
         this.context.centerM = this.maperial.getView(viewTriggering).context.mouseM
         break;

      case Maperial.MAIN : 
      case Maperial.LENS :
      case Maperial.ANCHOR :
         
         if(this.type == Maperial.MAIN && typeTriggering != Maperial.ANCHOR)
            return
            
         var panel = $("#panel"+this.name)
         var panelTriggering = $("#panel"+viewTriggering)

         var panelTriggeringPosition = panelTriggering.position();
         var viewPosition = panel.position();
         
         var viewCenterX = viewPosition.left + panel.width()/2
         var viewCenterY = viewPosition.top + panel.height()/2

         var panelTriggeringCenterX = panelTriggeringPosition.left + panelTriggering.width()/2
         var panelTriggeringCenterY = panelTriggeringPosition.top + panelTriggering.height()/2
         
         var viewTriggeringCenterP = this.maperial.getCenterP(viewTriggering)
         var lensCenterP = new Point( viewTriggeringCenterP.x - panelTriggeringCenterX + viewCenterX , viewTriggeringCenterP.y + panelTriggeringCenterY - viewCenterY);

         this.context.centerM = this.context.coordS.PixelsToMeters ( lensCenterP.x, lensCenterP.y, this.maperial.getZoom(this.map) );
         //this.mapRenderer.DrawScene()
         break;
   }
   
}
