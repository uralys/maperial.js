var utils = require('../../../../libs/utils.js'),
    ajax = require('../../../../libs/ajax.js'),
    Proj4js = require('../../../libs/proj4js-compressed.js');

//------------------------------------------------------------------------------

/**
 * A HeatmapData may be shared between many MapView.
 *
 * Create a HeatmapData using the [Maperial]{@link Maperial#createHeatmapData}
 *
 * @class
 *
 * @example on [codepen](http://codepen.io/chrisdugne/pen/Wbbggr?editors=101)
 */
function HeatmapData(data) {
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

    this.reset();
    this.import(data);
}

//------------------------------------------------------------------------------

HeatmapData.prototype.import = function (data) {
    if (data) {
        if ('string' === typeof (data)) {
            ajax.get({
                url: data,
                async: true,
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

HeatmapData.prototype.addPoint = function (feature) {

    var latitude = feature.geometry.coordinates[1];
    var longitude = feature.geometry.coordinates[0];
    var diameter = feature.properties.diameter;
    var scale = feature.properties.scale;

    var id = utils.generateUID();
    var p = new Proj4js.Point(longitude, latitude);
    var attr = {
        diameter: diameter,
        scale: scale
    };

    Proj4js.transform(this.srcPrj, this.dstPrj, p);
    this.minx = Math.min(this.minx, p.x);
    this.maxx = Math.max(this.maxx, p.x);
    this.miny = Math.min(this.miny, p.y);
    this.maxy = Math.max(this.maxy, p.y);

    //
    //   var point = {
    //         id       : id,
    //         lat      : latitude,
    //         lon      : longitude,
    //         x        : p.x,
    //         y        : p.y,
    //         diameter : diameter,
    //         scale    : scale,
    //   };

    var point = {
        'c': null,
        'g': [
            [
                [p.x, p.y]
            ]
        ],
        'a': [attr]
    };

    this.content.l.push(point);
    this.points[id] = point;
    this.version++;
    this.nbPoints++;

    return point;
}

//------------------------------------------------------------------------------

HeatmapData.prototype.reset = function () {
    this.points = {},
        this.content = {
            "h": Maperial.tileSize,
            "w": Maperial.tileSize,
            "l": []
        }
    this.nbPoints = 0;
    this.version++;
}

//------------------------------------------------------------------------------

HeatmapData.prototype.removePoint = function (point) {
    if (point) {
        delete this.points[point.id];
        this.version++;
        this.nbPoints--;
    }
}

//--------------------------------------------------------------

module.exports = HeatmapData;
