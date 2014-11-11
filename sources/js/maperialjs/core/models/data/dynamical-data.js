var utils = require('../../../../libs/utils.js');
var ajax = require('../../../../libs/ajax.js'),
    Proj4js = require('../../../libs/proj4js-compressed.js');

//------------------------------------------------------------------------------

/**
 * To add points on your maps, use DynamicalData.
 *
 * One DynamicalData may be shared between many {@link MapView}.
 *
 * Create a DynamicalData using {@link Maperial#createDynamicalData}
 *
 * You may directly import a FeatureCollection either by a url or an object.
 *
 * Each 'feature' in your FeatureCollection should be formatted as Point :
 *
 * <pre>
 * {
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [
 *       4.792116752641117,
 *       53.05105507065753
 *     ]
 *   },
 *   "type": "Feature",
 *   "properties": {}
 * }
 * </pre>
 *
 * @constructor
 *
 * @param {object|string} featureCollection
 *                        <a href="http://geojson.org">GeoJson</a>
 *                        FeatureCollection
 *
 * @example <caption>Use a REST endpoint to import a FeatureCollection</caption>
 * var url = 'http://static.maperial.com/geojson/demo.geojson.json';
 * var data = maperial.createDynamicalData(url);
 *
 * @example <caption>Or use your js built FeatureCollection</caption>
 * var collection = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [
 *           4.792116752641117,
 *           53.05105507065753
 *         ]
 *       },
 *       "type": "Feature",
 *       "properties": {}
 *     },
 *     {
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [
 *           4.792800810802329,
 *           53.05119775566745
 *         ]
 *       },
 *       "type": "Feature",
 *       "properties": {}
 *     }
 *   ]
 * }
 *
 * var data = maperial.createDynamicalData(collection);
 */
function DynamicalData(featureCollection) {
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

    this.import(featureCollection);
}

//------------------------------------------------------------------------------

DynamicalData.prototype.import = function (data) {
    if (data) {
        if ('string' === typeof (data)) {
            ajax.get({
                url: data,
                callback: function (error, data) {
                    this.addPoints(data);
                }.bind(this)
            });
        } else if ('object' === typeof (data)) {
            this.addPoints(data);
        }
    }
}

//------------------------------------------------------------------------------

DynamicalData.prototype.addPoints = function (collection) {
    collection.features.forEach(function (feature) {
        this.addPoint(feature);
    }.bind(this))
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
