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

Source.WMSA                        = "wms.a";
Source.WMSB                        = "wms.b";

//-----------------------------------------------------------------------------------//

function Source (type, params) {
   this.type = type;
   this.params = params;
}

//-----------------------------------------------------------------------------------//