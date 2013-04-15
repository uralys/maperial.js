//-----------------------------------------------------------------------------------//
// Source.type

Source.MaperialOSM     = "osm";
Source.Raster          = "raster";
Source.Vector          = "vector";
Source.Images          = "images";

//-----------------------------------------------------------------------------------//
// Images.src

Source.IMAGES_MAPQUEST              = "images.mapquest";
Source.IMAGES_MAPQUEST_SATELLITE    = "images.mapquest.satellite";
Source.IMAGES_OSM                   = "images.osm";

//-----------------------------------------------------------------------------------//

function Source (type, params) {
   this.type = type;
   this.params = params;
}

//-----------------------------------------------------------------------------------//