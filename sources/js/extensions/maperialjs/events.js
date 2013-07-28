
//==================================================================//

this.MaperialEvents = {}

//==================================================================//

// GLobal Events
MaperialEvents.LOADING              = "MaperialEvents.LOADING";
MaperialEvents.READY                = "MaperialEvents.READY";

MaperialEvents.VIEW_LOADING         = "MaperialEvents.VIEW_LOADING";
MaperialEvents.VIEW_READY           = "MaperialEvents.VIEW_READY";

MaperialEvents.REFRESH_SIZES        = "MaperialEvents.REFRESH_SIZES";

// Mouse Events
MaperialEvents.MOUSE_DOWN           = "MaperialEvents.MOUSE_DOWN";
MaperialEvents.MOUSE_UP             = "MaperialEvents.MOUSE_UP";
MaperialEvents.MOUSE_MOVE           = "MaperialEvents.MOUSE_MOVE";
MaperialEvents.MOUSE_UP_WIHTOUT_AUTOMOVE  = "MaperialEvents.MOUSE_UP_WIHTOUT_AUTOMOVE";

// Control Events
MaperialEvents.CONTROL_UP           = "MaperialEvents.CONTROL_UP";
MaperialEvents.CONTROL_DOWN         = "MaperialEvents.CONTROL_DOWN";
MaperialEvents.CONTROL_LEFT         = "MaperialEvents.CONTROL_LEFT";
MaperialEvents.CONTROL_RIGHT        = "MaperialEvents.CONTROL_RIGHT";

// Map Events
MaperialEvents.DRAGGING_MAP         = "MaperialEvents.DRAGGING_MAP";
MaperialEvents.MAP_MOVING           = "MaperialEvents.MAP_MOVING";
MaperialEvents.ZOOM_TO_REFRESH      = "MaperialEvents.ZOOM_TO_REFRESH";
MaperialEvents.ZOOM_CHANGED         = "MaperialEvents.ZOOM_CHANGED";

MaperialEvents.UPDATE_LATLON        = "MaperialEvents.UPDATE_LATLON";
MaperialEvents.NEW_BOUNDING_BOX     = "MaperialEvents.NEW_BOUNDING_BOX";

// Style Menu Events
MaperialEvents.OPEN_STYLE           = "MaperialEvents.OPEN_STYLE";
MaperialEvents.EDIT_ZOOMS           = "MaperialEvents.EDIT_ZOOMS";
MaperialEvents.OPEN_ZOOMS           = "MaperialEvents.OPEN_ZOOMS";

// Rendering Events
MaperialEvents.SOURCE_READY         = "MaperialEvents.SOURCE_READY";
MaperialEvents.STYLE_CHANGED        = "MaperialEvents.STYLE_CHANGED";
MaperialEvents.COLORBAR_CHANGED     = "MaperialEvents.COLORBAR_CHANGED";
MaperialEvents.CONTRAST_CHANGED     = "MaperialEvents.CONTRAST_CHANGED";
MaperialEvents.BRIGHTNESS_CHANGED   = "MaperialEvents.BRIGHTNESS_CHANGED";
MaperialEvents.BW_METHOD_CHANGED    = "MaperialEvents.BW_METHOD_CHANGED";
MaperialEvents.ALPHA_CHANGED        = "MaperialEvents.ALPHA_CHANGED";
MaperialEvents.DATA_SOURCE_CHANGED  = "MaperialEvents.DATA_SOURCE_CHANGED";

MaperialEvents.XY_LIGHT_CHANGED     = "MaperialEvents.XY_LIGHT_CHANGED";
MaperialEvents.Z_LIGHT_CHANGED      = "MaperialEvents.Z_LIGHT_CHANGED";
MaperialEvents.SCALE_CHANGED        = "MaperialEvents.SCALE_CHANGED";

//==================================================================//

MaperialEvents.removeAllListeners = function (){
   
   $(window).off(MaperialEvents.UPDATE_LATLON);
   $(window).off(MaperialEvents.OPEN_STYLE);
   
   $(window).off(MaperialEvents.SOURCE_READY);
   $(window).off(MaperialEvents.STYLE_CHANGED);
   $(window).off(MaperialEvents.COLORBAR_CHANGED);
   $(window).off(MaperialEvents.CONTRAST_CHANGED);
   $(window).off(MaperialEvents.BRIGHTNESS_CHANGED);
   $(window).off(MaperialEvents.BW_METHOD_CHANGED);
   $(window).off(MaperialEvents.DATA_SOURCE_CHANGED);
   $(window).off(MaperialEvents.MOUSE_UP_WIHTOUT_AUTOMOVE);

   $(window).off(MaperialEvents.CONTROL_UP);
   $(window).off(MaperialEvents.CONTROL_DOWN);
   $(window).off(MaperialEvents.CONTROL_LEFT);
   $(window).off(MaperialEvents.CONTROL_RIGHT);
}