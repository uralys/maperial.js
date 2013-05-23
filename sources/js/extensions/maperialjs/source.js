//-----------------------------------------------------------------------------------//
// Source.type

Source.MaperialOSM      = "osm";
Source.Raster           = "raster";
Source.Vector           = "vector";
Source.Images           = "images";
Source.WMS              = "wms";

//-----------------------------------------------------------------------------------//
// Images.src

Source.IMAGES_MAPQUEST              = "images.mapquest";
Source.IMAGES_MAPQUEST_SATELLITE    = "images.mapquest.satellite";
Source.IMAGES_OSM                   = "images.osm";

//-----------------------------------------------------------------------------------//
// WMS.src

Source.WMS_1                        = "WMS1";
Source.WMS_2                        = "WMS2";

//-----------------------------------------------------------------------------------//

function Source (type, params) {
   this.type = type;
   this.params = params;
}

//-----------------------------------------------------------------------------------//