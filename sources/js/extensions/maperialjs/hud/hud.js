
//==================================================================//

function HUD(maperial){

   console.log("  building HUD...");

   this.maperial = maperial;
   this.context = this.maperial.context;

   if(this.maperial.config){
      this.buildTriggers();
      this.buildControls();

      this.refreshDisplay();

      this.initListeners();
      this.updateScale();
   }
}

//----------------------------------------------------------------------//

HUD.TRIGGER                = "trigger";
HUD.PANEL                  = "panel";
HUD.ICON                   = "icon";

//hud options user only
HUD.SETTINGS               = "HUDSettings";
HUD.COLORBAR               = "ColorBar";
HUD.QUICK_EDIT             = "QuickEdit";
HUD.DETAILS_MENU           = "DetailsMenu";
HUD.ZOOMS                  = "Zooms";

//hud options user + viewer
HUD.CONTROLS               = "Controls";
HUD.SCALE                  = "Scale";
HUD.GEOLOC                 = "Geoloc";
HUD.LATLON                 = "LatLon";
HUD.MAPKEY                 = "MapKey";
HUD.COMPOSITIONS           = "Compositions";
HUD.LAYER_SETTINGS         = "LayerSettings";
HUD.BASEMAPS               = "Basemaps";
HUD.DATA                   = "Data";
HUD.SWITCH_IMAGES          = "SwitchImages";

//----------------------------------------------------------------------//

HUD.ALL_BASEMAPS          = "HUD.ALL_BASEMAPS";
HUD.STYLED_BASEMAPS       = "HUD.STYLED_BASEMAPS ";
HUD.IMAGE_BASEMAPS        = "HUD.IMAGE_BASEMAPS ";

HUD.WMS_DATA              = "HUD.WMS_DATA ";
HUD.RASTER_DATA           = "HUD.RASTER_DATA ";

//----------------------------------------------------------------------//

HUD.VIEWER_OPTIONS = {
      "0" : {element : HUD.CONTROLS,        label : "Controls",        defaultDisableDrag : true  },
      "1" : {element : HUD.SCALE,           label : "Scale",           defaultDisableDrag : false },
      "2" : {element : HUD.GEOLOC,          label : "Geoloc",          defaultDisableDrag : false },
      "3" : {element : HUD.LATLON,          label : "Lat/Lon",         defaultDisableDrag : false },
      "4" : {element : HUD.MAPKEY,          label : "Map Key",         defaultDisableDrag : false },
      "5" : {element : HUD.SWITCH_IMAGES,   label : "Switch Basemap",  defaultDisableDrag : true },
      "6" : {element : HUD.BASEMAPS,        label : "Basemaps",        defaultDisableDrag : true },
      "7" : {element : HUD.DATA,            label : "Data",            defaultDisableDrag : true },
//    "6" : {element : HUD.COMPOSITIONS,    label : "Compositions",    defaultDisableDrag : false },
//    "7" : {element : HUD.LAYER_SETTINGS,  label : "Layer Settings",  defaultDisableDrag : false },
}

//----------------------------------------------------------------------//

HUD.positions = [];

HUD.positions[HUD.SETTINGS]      = { left  : "0",    top    : "0"   };
HUD.positions[HUD.COMPOSITIONS]  = { left  : "0",    bottom : "120" };
HUD.positions[HUD.LAYER_SETTINGS]= { right : "5",    top    : "50%" };
HUD.positions[HUD.SWITCH_IMAGES] = { left  : "10",   top    : "10"  };
HUD.positions[HUD.COLORBAR]      = { left  : "0",    top    : "180" };
HUD.positions[HUD.SCALE]         = { left  : "20",   bottom : "10"  };
HUD.positions[HUD.MAPKEY]        = { right : "5",    bottom : "0"   };
HUD.positions[HUD.CONTROLS]      = { left  : "15",   top    : "40"  };
HUD.positions[HUD.LATLON]        = { left  : "30%",  bottom : "0"   };
HUD.positions[HUD.GEOLOC]        = { left  : "50%",  top    : "0"   };
HUD.positions[HUD.DETAILS_MENU]  = { left  : "50%",  top    : "30%" };
HUD.positions[HUD.QUICK_EDIT]    = { right : "5",    top    : "38", };
HUD.positions[HUD.ZOOMS]         = { left  : "50%",  bottom : "0"   };
HUD.positions[HUD.BASEMAPS]      = { right : "-550", top    : "0"   };
HUD.positions[HUD.DATA]          = { right : "-550", top    : "0"   };

//----------------------------------------------------------------------//

HUD.prototype.reset = function () {
   this.hideAllHUD();
   this.removeListeners();
}

//----------------------------------------------------------------------//

HUD.prototype.refresh = function () {
   console.log("refresh HUD");
   this.hideAllHUD();
   this.refreshDisplay();
   this.placeElements();
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
      hud.refreshDisplay(true);
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
      
      this.placeElement(element, position, this.maperial.config.hud.elements[element].type)
   }
   
   this.refreshAttribution()
}

//----------------------------------------------------------------------//

HUD.prototype.placeElement = function(element, position, type){
   
   for (property in position) {

      var value = position[property];

      if(position[property].indexOf("%") == -1){
         value = parseInt(value);
         this.placeElementAt(element, value, property);
      }
      else{
         var percentage = position[property].split("%")[0];
         
         if(this.maperial.config.hud.elements[element]){
            var triggerWidth     = this.trigger(element).width();
            var triggerHeight    = this.trigger(element).height();
            var panelWidth       = this.panel(element).width();
            var panelHeight      = this.panel(element).height();
         }
         else{
            var panelWidth       = element.width();
            var panelHeight      = element.height();
         }

         switch(property){
            case "top":
            case "bottom":
               switch(type){
                  case HUD.TRIGGER  : value = (percentage/100 * this.context.mapCanvas[0].height) - triggerHeight/2; break;
                  case HUD.PANEL : default : value = (percentage/100 * this.context.mapCanvas[0].height) - panelHeight/2; break;
               }
               break;
            case "left":
            case "right":
               switch(type){
                  case HUD.TRIGGER  : value = (percentage/100 * this.context.mapCanvas[0].width) - triggerWidth/2; break;
                  case HUD.PANEL : default : value = (percentage/100 * this.context.mapCanvas[0].width) - panelWidth/2; break;
               }
               break;
         }

         this.placeElementAt(element, value, property)
      }
   }
}

//==================================================================//

HUD.prototype.placeChild = function(options){
   var childPanel    = $("#panel"   + this.maperial.getFullName(options.name))
   var childCanvas   = $("#Map"     + this.maperial.getFullName(options.name))
   
   childPanel.css ("width",                  options.width              )
   childPanel.css ("height",                 options.height             )
   childPanel.css ("opacity",                options.opacity            )
   childPanel.css ("padding",                options.padding            )
   childPanel.css ("border-radius",          options.borderRadius       )
   childPanel.css ("-moz-border-radius",     options.borderRadius       )
   childPanel.css ("-moz-border-radius",     options.borderRadius       )
   childPanel.css ("-khtml-border-radius",   options.borderRadius       )

   childCanvas.css("border-radius",          options.borderRadius       )
   childCanvas.css("-moz-border-radius",     options.borderRadius       )
   childCanvas.css("-moz-border-radius",     options.borderRadius       )
   childCanvas.css("-khtml-border-radius",   options.borderRadius       )
   childCanvas.css("overflow",               "hidden"                   )
   childCanvas.css("-webkit-mask-image",     "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA5JREFUeNpiYGBgAAgwAAAEAAGbA+oJAAAAAElFTkSuQmCC)")
   
   this.placeElement(childPanel, options.position, HUD.PANEL)
}

//==================================================================//

HUD.prototype.placeElementAt = function(element, value, property){

   var elementName
   if(this.maperial.config.hud.elements[element]){
      elementName = element
      element = this.element(this.maperial.config.hud.elements[elementName].type+elementName)
   }

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
         value -= element.height();
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
         value -= element.width();
         value -= margin;
         value -= 10;
         property = "left";
         break;
   }

   element.css(property, value+"px");

   if(elementName){
      this.panel(elementName).css(property, value+"px");
      this.trigger(elementName).css(property, value+"px");
   }
}

HUD.prototype.refreshDisplay = function(dontHideColorpickers){
   this.showAllHUD(dontHideColorpickers);

   if(this.maperial.config.hud.elements[HUD.SETTINGS])
      this.refreshSettingsPanel();

   if(this.maperial.config.hud.elements[HUD.COMPOSITIONS])
      this.refreshCompositionsPanel();

   if(this.maperial.config.hud.elements[HUD.LAYER_SETTINGS])
      this.refreshLayerSettingsPanel();

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

HUD.prototype.showAllHUD = function(dontHideColorpickers){

   for (element in this.maperial.config.hud.elements) {
      if(this.maperial.config.hud.elements[element].show == true){
         this.element(this.maperial.config.hud.elements[element].type + element).removeClass("hide");
      }
   }

   $(".tooltip").remove();

   if(!dontHideColorpickers)
      $(".colorpicker").hide();
}

//------------------------------------------------//

HUD.prototype.putOnTop = function(element){
   this.allTriggers().css({ zIndex : 101 });
   this.allPanels().css({ zIndex : 100 });
   this.trigger(element).css({ zIndex : 201 });
   this.panel(element).css({ zIndex : 200 });  
}

//====================================================================================//
//SELECTION PANELS : TODO : extraire une "classe"
//====================================================================================//

HUD.prototype.closeBasemaps = function(params, callBack){
   this.closePanel(params, callBack, HUD.BASEMAPS)
}

//-------------------------------------------------//

HUD.prototype.openBasemaps = function(params, callBack){
   this.buildBasemapsPanel(params, callBack);
   this.openPanel(params, callBack, HUD.BASEMAPS)
}

//====================================================================================//

HUD.prototype.closeData = function(params, callBack){
   this.closePanel(params, callBack, HUD.DATA)
}

//-------------------------------------------------//

HUD.prototype.openData = function(params, callBack){
   this.buildDataPanel(params, callBack);
   this.openPanel(params, callBack, HUD.DATA)
}

//====================================================================================//

HUD.prototype.closePanel = function(params, callBack, panel){

   var mapWidth = this.context.mapCanvas[0].offsetWidth;
   var mapLeft = this.context.mapCanvas[0].offsetLeft;
   var margin = this.getMargin("right");

   var value = mapLeft + mapWidth + 550;
   value -= this.panel(panel).width();
   value -= margin;
   value -= 10;

   this.panel(panel).animate({
      left: value,
      duration: 200,
   });

}

//-------------------------------------------------//

HUD.prototype.openPanel = function(params, callBack, panel){

   var mapWidth = this.context.mapCanvas[0].offsetWidth;
   var mapLeft = this.context.mapCanvas[0].offsetLeft;
   var margin = this.getMargin("right");

   var value = mapLeft + mapWidth - 220;
   value -= this.panel(panel).width();
   value -= margin;
   value -= 10;

   this.panel(panel).animate({
      left: value, 
      duration: 200,
   });

}

//----------------------------------------------------------------------//

HUD.prototype.element = function(name){
   return $("#"+this.maperial.getFullName(name));
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
   var panels = $("#"+this.maperial.name).find("."+HUD.PANEL);
   var panelsWebapp = $(".panel-webapp");

   return $.merge(panels, panelsWebapp);
}

HUD.prototype.allTriggers = function(){
   var triggers = $("#"+this.maperial.name).find("."+HUD.TRIGGER);
   var triggersWebapp = $(".trigger-webapp");

   return $.merge(triggers, triggersWebapp);
}

HUD.prototype.controlZoomCursor = function(){
   return $("#control-zoom"+this.maperial.name+" a");
}
