//==================================================================//

function Maperial(){
   console.log(" NEW Maperial ")
   
   this.maps      = null
   this.options   = null

   this.views      = []
   this.viewsReady = {}

   this.sourcesManager     = new SourcesManager();
   this.templateBuilder    = new TemplateBuilder();
   this.layersCreation     = new LayersCreation(this);

   window.maperial = this
};


//==================================================================//
// TYPE = css class

Maperial.MAIN                    = "maperial-main"
Maperial.ANCHOR                  = "maperial-anchor"
Maperial.LENS                    = "maperial-lens"       // camera centered on what is under it
Maperial.MINIFIER                = "maperial-minifier"   // camera centered on the parent's center
Maperial.MAGNIFIER               = "maperial-magnifier"  // camera centered on what is under the mouse

//==================================================================//

Maperial.staticURL              = (window.location.hostname.indexOf("localhost") !== -1) ? 'http://static.maperial.localhost'+ (!window.location.port || window.location.port == "9000" ? "" : ":"+window.location.port) : 'http://static.maperial.com';
Maperial.shaderURL              = (window.location.hostname.indexOf("localhost") !== -1) ? (window.location.port == "9000" ? "http://static.maperial.localhost" : 'http://' + window.location.host+'/shaders') : 'http://static.maperial.com';

Maperial.apiURL                 = 'http://api.maperial.com';

Maperial.DEFAULT_ZOOM           = 10;
Maperial.DEFAULT_LATITUDE       = 48.813;
Maperial.DEFAULT_LONGITUDE      = 2.313;

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

Maperial.DEMO_MAP = {
      "0" : "1_map_13ee017c8dac3b49852",
      "1" : "1_map_13f18ec522f1ec62e0b",
      "2" : "1_map_13f196019c63431328a",
      "3" : "1_map_13f1969e6d19a5e46a5",
      "4" : "1_map_13f1976a6cea80a51d6",
      "5" : "1_map_13f19833d3afac2f76a",
}

//==================================================================//

Maperial.prototype.build = function(maps, options){

   if(!maps || maps.length == 0){
      console.log("pas encore revu pour un set par defaut")
      return
   }
   
   //-------------------------------------------------------------------//

   console.log("=================================")         
   console.log("Maperial starts a new build");
   $(window).trigger(MaperialEvents.LOADING);

   //-------------------------------------------------------------------//

   this.destroy()
   this.templateBuilder.prepareView();
   
   this.maps = maps
   this.options = options || {}
   
   //-------------------------------------------------------------------//
   
   this.refreshTheMaperial()
   
   //-------------------------------------------------------------------//
   
   this.initListeners()
   
   //----------------------------------------------------------------------//
   // Prepare
   
   for(var i = 0; i < this.maps.length; i++){
      var map = this.maps[i]
      console.log("preparing map ", map)

      for(var j = 0; j < map.views.length; j++){
         console.log("preparing view ", map.views[j])
         
         var mapView = new MapView(this, "map"+i, map.views[j].options, map.views[j].config)
         
         this.views.push (mapView)
         this.templateBuilder.prepareMapView(mapView);
      }
   }
   
   //----------------------------------------------------------------------//
   // Build

   console.log("Maperial starts building " + this.views.length + " views")
   
   for(var i = 0; i < this.views.length; i++){
      this.viewsReady[this.views[i].name] = false
      this.views[i].build()
   }
}

//==================================================================//

Maperial.prototype.restart = function(){
   this.build(this.maps, this.options)
}

//==================================================================//

Maperial.prototype.width = function(){
   return $('#TheMaperial').width();
}

Maperial.prototype.height = function(){
   return $('#TheMaperial').height();
}
   
//==================================================================//
   
Maperial.prototype.destroy = function(){

   this.removeAllListeners()
   this.sourcesManager.releaseNetwork()
   this.sourcesManager.releaseAllReceivers()

   for(var i = 0; i < this.views.length; i++){
      this.views[i].reset()
      $("#panel"+this.views[i].name).remove()
   }

   this.views = []
   this.templateBuilder.destroyView();
}

//==================================================================//

Maperial.prototype.refreshTheMaperial = function(){

   $('#TheMaperial').css('position', 'absolute');

   if(this.options && this.options.left){
      $('#TheMaperial').css('left', this.options.left);
   }

   if(this.options && this.options.top){
      $('#TheMaperial').css('top', this.options.top);
   }

   if(this.options && this.options.width)
      $('#TheMaperial').css('width', this.options.width);
   else
      $('#TheMaperial').css('width', $(window).width());
  
   
   if(this.options && this.options.height)
      $('#TheMaperial').css('height', this.options.height);
   else
      $('#TheMaperial').css('height', $(window).height());
   
}

//==================================================================//

Maperial.prototype.removeAllListeners = function(){
   $(window).off("resize");
   $(window).off(MaperialEvents.MOUSE_MOVE)
   $(window).off(MaperialEvents.MAP_MOVING)
   $(window).off(MaperialEvents.ZOOM_TO_REFRESH)
   $(window).off(MaperialEvents.VIEW_READY)
   
}

Maperial.prototype.initListeners = function(){
   
   var maperial = this

   $(window).on("resize", function(){
      maperial.refreshTheMaperial();

      for(var i = 0; i< maperial.views.length; i++){
         maperial.views[i].refreshScreen()
      }
   });
   
   $(window).on(MaperialEvents.MOUSE_MOVE, function(event, map, viewTriggering, typeTriggering){
      maperial.refreshAllViews(map, viewTriggering, typeTriggering)
   });

   $(window).on(MaperialEvents.MAP_MOVING, function(event, map, viewTriggering, typeTriggering){
      maperial.refreshAllViews(map, viewTriggering, typeTriggering)
   });

   $(window).on(MaperialEvents.ZOOM_TO_REFRESH, function(event, map, viewTriggering, typeTriggering, zoom){
      maperial.refreshAllViews(map, viewTriggering, typeTriggering, zoom)
   });
   
   
   $(window).on(MaperialEvents.VIEW_READY, function(event, view){
      maperial.viewsReady[view] = true
      console.log("view " + view + " is ready")
      
      var maperialIsReady = true
      for(var i = 0; i< maperial.views.length; i++){
         if(!maperial.viewsReady[maperial.views[i].name]){
            console.log("view " + maperial.views[i].name + " still being built")
            maperialIsReady = false
            break;
         }
         else{
            console.log("view " + maperial.views[i].name + " ready")
         }
            
      }
      
      if(maperialIsReady){
         console.log("Maperial is ready")         
         console.log("=================================")         
         $(window).trigger(MaperialEvents.READY)
      }
   });

   $(window).on(MaperialEvents.VIEW_LOADING, function(event, view){
      maperial.viewsReady[view] = false
      console.log("view " + view + " is loading | " + maperial.viewsReady + " views ready")
      $(window).trigger(MaperialEvents.LOADING);
   });
}

//==================================================================//

Maperial.prototype.refreshAllViews = function(map, viewTriggering, typeTriggering, zoom){
   for(var i = 0; i < this.views.length; i++){
      if(this.views[i].map == map && this.views[i].name != viewTriggering){
         this.views[i].refreshCamera(viewTriggering, typeTriggering, zoom)
      }
   }
}

//==================================================================//
   
Maperial.prototype.getMainView = function(map){
   for(var i = 0; i < this.views.length; i++){
      if(this.views[i].map == map && this.views[i].type == Maperial.MAIN){
         return this.views[i]
      }
   }
}

Maperial.prototype.getView = function(name){
   for(var i = 0; i < this.views.length; i++){
      if(this.views[i].name == name){
         return this.views[i]
      }
   }
   
   return this.views[0]
}

//==================================================================//

Maperial.prototype.getZoom = function(map){
   return this.getMainView(map).context.zoom;
}

//==================================================================//

Maperial.prototype.centerWMS = function (viewName, src, type){
   return this.getView(viewName).centerWMS(src, type);
}

//==================================================================//

Maperial.prototype.getCenterP = function(viewName){
   var view = this.getView(viewName);
   return view.context.coordS.MetersToPixels(view.context.centerM.x, view.context.centerM.y, view.context.zoom);
}

