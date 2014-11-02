var Point = require('./point.js');

//------------------------------------------------------------------//

function CoordinateSystem(inTileSize) {
    this.tileSize = inTileSize;
    this.initialResolution = 2 * Math.PI * 6378137 / inTileSize; //# 156543.03392804062 for tileSize 256 pixels
    this.originShift = 2 * Math.PI * 6378137 / 2.0;
}

//------------------------------------------------------------------//

//"Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913"
CoordinateSystem.prototype.LatLonToMeters = function (lat, lon) {
    mx = lon * this.originShift / 180.0;
    my = Math.log(Math.tan((90 + lat) * Math.PI / 360.0)) / (Math.PI / 180.0);
    my = my * this.originShift / 180.0;
    return new Point(mx, my);
}

//"Converts XY point from Spherical Mercator EPSG:900913 to lat/lon in WGS84 Datum"
CoordinateSystem.prototype.MetersToLatLon = function (mx, my) {
    lon = (mx / this.originShift) * 180.0;
    lat = (my / this.originShift) * 180.0;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);
    return new Point(lon, lat);
}

//"Converts pixel coordinates in given zoom level of pyramid to EPSG:900913"
CoordinateSystem.prototype.PixelsToMeters = function (px, py, zoom) {
    res = this.Resolution(zoom);
    mx = px * res - this.originShift;
    my = py * res - this.originShift;
    return new Point(mx, my);
}

//"Converts EPSG:900913 to pyramid pixel coordinates in given zoom level"  
CoordinateSystem.prototype.MetersToPixels = function (mx, my, zoom) {
    res = this.Resolution(zoom);
    px = (mx + this.originShift) / res;
    py = (my + this.originShift) / res;
    return new Point(px, py);
}

CoordinateSystem.prototype.MetersToPixelsAccurate = function (mx, my, zoom) {

    var lat = this.MetersToLatLon(mx, my).y;
    res = this.ResolutionByLat(zoom, lat);

    px = (mx + this.originShift) / res;
    py = (my + this.originShift) / res;
    return new Point(px, py);
}

//"Returns a tile covering region in given pixel coordinates"
CoordinateSystem.prototype.PixelsToTile = function (px, py) {
    tx = Math.floor(Math.ceil(px / this.tileSize) - 1);
    ty = Math.floor(Math.ceil(py / this.tileSize) - 1);
    return new Point(tx, ty);
}

//"Move the origin of pixel coordinates to top-left corner"
CoordinateSystem.prototype.PixelsToRaster = function (px, py, zoom) {
    mapSize = this.tileSize * Math.pow(2, zoom);
    return new Point(px, mapSize - py);
}

//"Returns tile for given mercator coordinates"
CoordinateSystem.prototype.MetersToTile = function (mx, my, zoom) {
        p = this.MetersToPixels(mx, my, zoom);
        return this.PixelsToTile(p.x, p.y);
    }
    /*
    //"Returns bounds of the given tile in EPSG:900913 coordinates"
    CoordinateSystem.prototype.TileBounds = function ( tx, ty, zoom) {
      min = this.PixelsToMeters( tx*this.tileSize, ty*this.tileSize, zoom )
      max = this.PixelsToMeters( (tx+1)*this.tileSize, (ty+1)*this.tileSize, zoom )
      return ( minx, miny, maxx, maxy )
    }

    CoordinateSystem.prototype.TileLatLonBounds = function ( tx, ty, zoom ):
      "Returns bounds of the given tile in latutude/longitude using WGS84 datum"

      bounds = this.TileBounds( tx, ty, zoom)
      minLat, minLon = this.MetersToLatLon(bounds[0], bounds[1])
      maxLat, maxLon = this.MetersToLatLon(bounds[2], bounds[3])

      return ( minLat, minLon, maxLat, maxLon )
     */
    //"Resolution (meters/pixel) for given zoom level (measured at Equator)"  

CoordinateSystem.prototype.Resolution = function (zoom) {
    return this.initialResolution / Math.pow(2, zoom);
}

CoordinateSystem.prototype.ResolutionByLat = function (zoom, lat) {
    var R = 6378 * Math.cos((lat / 180) * Math.PI);
    return (2 * Math.PI * R * 1000 / this.tileSize) / Math.pow(2, zoom);
}

/*  
CoordinateSystem.prototype.ZoomForPixelSize = function ( pixelSize ):
  "Maximal scaledown zoom of the pyramid closest to the pixelSize."

  for i in range(30):
      if pixelSize > this.Resolution(i):
          return i-1 if i!=0 else 0 # We don't want to scale up
 */

//"Converts TMS tile coordinates to Google Tile coordinates"
CoordinateSystem.prototype.GoogleTile = function (tx, ty, zoom) {
    //coordinate origin is moved from bottom-left to top-left corner of the extent
    return new Point(tx, (Math.pow(2, zoom) - 1) - ty);

}

//------------------------------------------------------------------//

module.exports = CoordinateSystem;

/*
CoordinateSystem.prototype.QuadTree = function ( tx, ty, zoom ):
  "Converts TMS tile coordinates to Microsoft QuadTree"

  quadKey = ""
  ty = (2**zoom - 1) - ty
  for i in range(zoom, 0, -1):
      digit = 0
      mask = 1 << (i-1)
      if (tx & mask) != 0:
          digit += 1
      if (ty & mask) != 0:
          digit += 2
      quadKey += str(digit)

  return quadKey
 */
