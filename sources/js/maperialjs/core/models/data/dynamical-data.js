var utils = require('../../../../libs/utils.js');
var ajax = require('../../../../libs/ajax.js'),
    Proj4js = require('../../../libs/proj4js-compressed.js');

//------------------------------------------------------------------------------

function DynamicalData(data) {
    this.points = {};
    this.id = utils.generateUID();
    this.version = 0;

    this.minx = 100000000000;
    this.maxx = -100000000000;
    this.miny = 100000000000;
    this.maxy = -100000000000;

    // source coordinates will be in Longitude/Latitude
    this.srcPrj = new Proj4js.Proj('EPSG:4326');

    // destination coordinates google
    this.dstPrj = new Proj4js.Proj('EPSG:900913');

    this.import(data);
}

//------------------------------------------------------------------------------

DynamicalData.prototype.import = function (data) {
    if (data) {
        if ('string' === typeof (data)) {
            ajax.get({
                url: data,
                callback: function (error, data) {
                    data.features.forEach(function (feature) {
                        this.addPoint(feature);
                    }.bind(this));
                }.bind(this)
            });
        } else if ('object' === typeof (data)) {
            console.log('--> importing geojson ? TODO');
        }
    }
}

//------------------------------------------------------------------------------

DynamicalData.prototype.addPoint = function (feature) {
    var latitude = feature.geometry.coordinates[1];
    var longitude = feature.geometry.coordinates[0];
    var data = feature.properties;

    var id = utils.generateUID();
    var p = new Proj4js.Point(longitude, latitude);

    Proj4js.transform(this.srcPrj, this.dstPrj, p);
    this.minx = Math.min(this.minx, p.x);
    this.maxx = Math.max(this.maxx, p.x);
    this.miny = Math.min(this.miny, p.y);
    this.maxy = Math.max(this.maxy, p.y);

    var point = {
        id: id,
        lat: latitude,
        lon: longitude,
        x: p.x,
        y: p.y,
        data: data,
    };

    this.points[id] = point;
    this.version++;

    return point;
}

//------------------------------------------------------------------------------

DynamicalData.prototype.removePoint = function (point) {
    if (point) {
        delete this.points[point.id];
        this.version++;
    }
}

//------------------------------------------------------------------------------

DynamicalData.prototype.removeAll = function () {
    this.points = {};
    this.version++;
}

//------------------------------------------------------------------------------

module.exports = DynamicalData;
