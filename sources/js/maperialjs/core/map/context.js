//------------------------------------------------------------------------------

var CoordinateSystem = require('../../libs/coordinate-system.js');

//------------------------------------------------------------------------------

function Context(mapView) {
    this.mapView = mapView

    this.assets = null
    this.coordS = new CoordinateSystem(Maperial.tileSize);

    this.centerM = this.coordS.LatLonToMeters(
        this.startLatitude(),
        this.startLongitude()
    );

    this.mouseM = this.centerM; // Mouse coordinates in meters
    this.mouseP = null; // Mouse coordinates inside the canvas
    this.zoom = this.startZoom();
}

//------------------------------------------------------------------------------

Context.prototype.latLon = function () {
    return this.coordS.MetersToLatLon(this.centerM.x, this.centerM.y);
}

//------------------------------------------------------------------------------

Context.prototype.startZoom = function () {

    // Options
    if (this.mapView.options.defaultZoom)
        return this.mapView.options.defaultZoom;

    // Default
    else
        return Maperial.DEFAULT_ZOOM;

}

//------------------------------------------------------------------------------

Context.prototype.startLatitude = function () {

    // BoundingBox
    if (this.latMin)
        return (this.latMin + this.latMax) / 2;

    // Options
    else if (this.mapView.options.latitude)
        return this.mapView.options.latitude;

    // Default
    else
        return Maperial.DEFAULT_LATITUDE;

}

//------------------------------------------------------------------------------

Context.prototype.startLongitude = function () {

    // BoundingBox
    if (this.lonMin)
        return (this.lonMin + this.lonMax) / 2;

    // Options
    else if (this.mapView.options.longitude)
        return this.mapView.options.longitude;

    // Default
    else
        return Maperial.DEFAULT_LONGITUDE;

}

//------------------------------------------------------------------------------

module.exports = Context;
