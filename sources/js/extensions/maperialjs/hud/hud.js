
//==================================================================//

function HUD(maperial){

   console.log("  building HUD...");
   
   this.maperial = maperial;
   this.context = this.maperial.context;

   this.buildTriggers();
   this.buildControls();
   this.display();

   this.initListeners();
   this.updateScale();

}
//----------------------------------------------------------------------//

HUD.prototype.element = function(name){
   return $("#"+name+this.maperial.tagId);
}

HUD.prototype.panel = function(name){
   return this.element(HUD.PANEL+name);
}

HUD.prototype.trigger = function(name){
   return this.element(HUD.TRIGGER+name);
}

HUD.prototype.icon = function(name){
   return this.element(HUD.ICON+name);
}

HUD.prototype.allPanels = function(){
   var panels = $("#"+this.maperial.tagId).find("."+HUD.PANEL);
   var panelsWebapp = $(".panel-webapp");
   
   return $.merge(panels, panelsWebapp);
}

HUD.prototype.allTriggers = function(){
   var triggers = $("#"+this.maperial.tagId).find("."+HUD.TRIGGER);
   var triggersWebapp = $(".trigger-webapp");
   
   return $.merge(triggers, triggersWebapp);
}

HUD.prototype.controlZoomCursor = function(){
   return $("#control-zoom"+this.maperial.tagId+" a");
}

//----------------------------------------------------------------------//

HUD.TRIGGER                = "trigger";
HUD.PANEL                  = "panel";
HUD.ICON                   = "icon";

// hud options user only
HUD.SETTINGS               = "HUDSettings";
HUD.COLORBAR               = "ColorBar";
HUD.QUICK_EDIT             = "QuickEdit";
HUD.DETAILS_MENU           = "DetailsMenu";
HUD.ZOOMS                  = "Zooms";

// hud options user + viewer
HUD.CONTROLS               = "Controls";
HUD.SCALE                  = "Scale";
HUD.GEOLOC                 = "Geoloc";
HUD.LATLON                 = "LatLon";
HUD.MAPKEY                 = "MapKey";
HUD.MAGNIFIER              = "Magnifier";
HUD.COMPOSITIONS           = "Compositions";
HUD.SWITCH_IMAGES          = "SwitchImages";

//----------------------------------------------------------------------//

HUD.VIEWER_OPTIONS = {
    "0" : {element : HUD.CONTROLS,     label : "Controls",        defaultDisableDrag : true  },
    "1" : {element : HUD.SCALE,        label : "Scale",           defaultDisableDrag : false },
    "2" : {element : HUD.GEOLOC,       label : "Geoloc",          defaultDisableDrag : false },
    "3" : {element : HUD.COMPOSITIONS, label : "Compositions",    defaultDisableDrag : false },
    "4" : {element : HUD.LATLON,       label : "Lat/Lon",         defaultDisableDrag : false },
    "5" : {element : HUD.MAPKEY,       label : "Map Key",         defaultDisableDrag : false },
    "6" : {element : HUD.MAGNIFIER,    label : "Magnifier",       defaultDisableDrag : false },
    "7" : {element : HUD.SWITCH_IMAGES,label : "Switch Basemap",  defaultDisableDrag : true },
}

//----------------------------------------------------------------------//

HUD.applyDefaultHUD = function(config) {

   for (i in HUD.VIEWER_OPTIONS) {
      var element             = HUD.VIEWER_OPTIONS[i].element;
      var label               = HUD.VIEWER_OPTIONS[i].label;
      var defaultDisableDrag  = HUD.VIEWER_OPTIONS[i].defaultDisableDrag;

      config.hud.elements[element] = {show : false, type : HUD.PANEL, label : label, disableDrag : defaultDisableDrag };
   }
}

//----------------------------------------------------------------------//

HUD.positions = [];

HUD.positions[HUD.SETTINGS]      = { left  : "0",    top    : "0"   };
HUD.positions[HUD.COMPOSITIONS]  = { left  : "0",    bottom : "0"   };
HUD.positions[HUD.SWITCH_IMAGES] = { left : "10",   top    : "10"  };
HUD.positions[HUD.MAGNIFIER]     = { left  : "0",    bottom : "0"   };
HUD.positions[HUD.COLORBAR]      = { left  : "0",    top    : "180" };
HUD.positions[HUD.SCALE]         = { right : "10",   bottom : "10"  };
HUD.positions[HUD.MAPKEY]        = { right : "0",    bottom : "0"   };
HUD.positions[HUD.CONTROLS]      = { left  : "15",   top    : "40"  };
HUD.positions[HUD.LATLON]        = { left  : "50%",  bottom : "0"   };
HUD.positions[HUD.GEOLOC]        = { left  : "50%",  top    : "0"   };
HUD.positions[HUD.DETAILS_MENU]  = { left  : "50%",  top    : "30%" };
HUD.positions[HUD.QUICK_EDIT]    = { right : "0",    top    : "38", };
HUD.positions[HUD.ZOOMS]         = { left  : "50%",  bottom : "0"   };


//----------------------------------------------------------------------//

HUD.prototype.reset = function () {
   this.hideAllHUD();
   this.removeListeners();
}

//----------------------------------------------------------------------//

HUD.prototype.refresh = function () {
   this.hideAllHUD();
   this.placeElements();
   this.showAllHUD();
}

//----------------------------------------------------------------------//

HUD.prototype.initListeners = function () {

   var hud = this;
   
   this.context.mapCanvas.on(MaperialEvents.UPDATE_LATLON, function(event, x, y){
      hud.updateLatLon();
   });

   $(window).on(MaperialEvents.MAP_MOVING, function(event, x, y){
      hud.updateScale();
   });

   $(window).on(MaperialEvents.ZOOM_CHANGED, function(event, x, y){
      hud.updateScale();
   });

   $(window).on(MaperialEvents.ZOOM_TO_REFRESH, function(event, x, y){
      hud.refreshZoom();
   });

   $(window).on(MaperialEvents.STYLE_CHANGED, function(event, x, y){
      hud.refreshCompositionsPanel();
   });
}

//----------------------------------------------------------------------//

HUD.prototype.removeListeners = function () {

   this.context.mapCanvas.off(MaperialEvents.UPDATE_LATLON);
   $(window).off(MaperialEvents.MAP_MOVING);
   $(window).off(MaperialEvents.ZOOM_CHANGED);
   $(window).off(MaperialEvents.ZOOM_TO_REFRESH);
   
   this.allTriggers().unbind("click");
   this.allPanels().unbind("click");
   this.allTriggers().unbind("dragstart");
   this.allTriggers().unbind("dragstop");
   this.allPanels().unbind("dragstart");
   this.allPanels().unbind("dragstop");

   this.element("control-up").unbind("click");
   this.element("control-down").unbind("click");
   this.element("control-left").unbind("click");
   this.element("control-right").unbind("click");

   this.element("imagesMapquest").unbind("click");
   this.element("imagesMapquestSatellite").unbind("click");
   this.element("imagesOSM").unbind("click");
}

//----------------------------------------------------------------------//

HUD.prototype.getMargin = function (property) {
   if(!this.maperial.config.hud.options["margin-"+property])
      return 0;
   else
      return this.maperial.config.hud.options["margin-"+property];
}

//----------------------------------------------------------------------//

HUD.prototype.placeElements = function () {
   
   for (element in this.maperial.config.hud.elements) {

      var position = HUD.positions[element];
      
      // position in config overrides default position
      if(this.maperial.config.hud.elements[element].position){
         position = this.maperial.config.hud.elements[element].position;
      }

      for (property in position) {
         
         var value = position[property];
         
         if(position[property].indexOf("%") == -1){
            value = parseInt(value);
            this.placeElementAt(element, value, property);
         }
         else{
            var percentage = position[property].split("%")[0];
            var triggerWidth = this.trigger(element).width();
            var triggerHeight = this.trigger(element).height();
            var panelWidth = this.panel(element).width();
            var panelHeight = this.panel(element).height();
            
            switch(property){
               case "top":
               case "bottom":
                  switch(this.maperial.config.hud.elements[element].type){
                     case HUD.PANEL    : value = (percentage/100 * this.context.mapCanvas[0].height) - panelHeight/2; break;
                     case HUD.TRIGGER  : value = (percentage/100 * this.context.mapCanvas[0].height) - triggerHeight/2; break;
                  }
                  break;
               case "left":
               case "right":
                  switch(this.maperial.config.hud.elements[element].type){
                     case HUD.PANEL    : value = (percentage/100 * this.context.mapCanvas[0].width) - panelWidth/2; break;
                     case HUD.TRIGGER  : value = (percentage/100 * this.context.mapCanvas[0].width) - triggerWidth/2; break;
                  }
                  break;
            }

            this.placeElementAt(element, value, property)
         }
         
      }
   }
}

//==================================================================//

HUD.prototype.placeElementAt = function(element, value, property){

   var margin = this.getMargin(property);

   var mapTop = this.context.mapCanvas[0].offsetTop;
   var mapLeft = this.context.mapCanvas[0].offsetLeft;
   var mapWidth = this.context.mapCanvas[0].offsetWidth;
   var mapHeight = this.context.mapCanvas[0].offsetHeight;
   
   switch(property){
      case "top":
         value += mapTop;
         value += margin;
         break;
      case "bottom":
         value = mapTop + mapHeight - value;
         value -= this.element(this.maperial.config.hud.elements[element].type+element).height();
         value -= margin;
         value -= 8;
         property = "top";
         break;
      case "left":
         value += mapLeft;
         value += margin;
         break;
      case "right":
         value = mapLeft + mapWidth - value;
         value -= this.element(this.maperial.config.hud.elements[element].type+element).width();
         value -= margin;
         value -= 8;
         property = "left";
         break;
   }
   
   this.panel(element).css(property, value+"px");
   this.trigger(element).css(property, value+"px");
}

HUD.prototype.display = function(){
   this.showAllHUD();

   if(this.maperial.config.hud.elements[HUD.SETTINGS])
      this.refreshSettingsPanel();

   if(this.maperial.config.hud.elements[HUD.COMPOSITIONS])
      this.refreshCompositionsPanel();

   if(this.maperial.config.hud.elements[HUD.SWITCH_IMAGES])
      this.refreshSwitchImagesPanel();
}

//==================================================================//

/**
 * slider.change calls refreshZoom => infinite loop if no shunt !
 */
HUD.prototype.refreshZoom = function(shuntSlider){
   
   if(!shuntSlider)
      this.element("control-zoom").slider({value: this.context.zoom});
   
   this.controlZoomCursor().html(this.context.zoom);
   $(window).trigger(MaperialEvents.ZOOM_CHANGED);
   
}

//====================================================================================//

HUD.prototype.hideAllHUD = function(){
   this.allPanels().addClass("hide");
   this.allTriggers().addClass("hide");
}

//------------------------------------------------//

HUD.prototype.showAllHUD = function(){

   for (element in this.maperial.config.hud.elements) {
      if(this.maperial.config.hud.elements[element].show == true){
         this.element(this.maperial.config.hud.elements[element].type + element).removeClass("hide");
      }
   }

}

//------------------------------------------------//

HUD.prototype.putOnTop = function(element){
   this.allTriggers().css({ zIndex : 101 });
   this.allPanels().css({ zIndex : 100 });
   this.trigger(element).css({ zIndex : 201 });
   this.panel(element).css({ zIndex : 200 });  
}
