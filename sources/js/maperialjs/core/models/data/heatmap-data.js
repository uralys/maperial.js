var utils = require('../../../../libs/utils.js'),
    ajax = require('../../../../libs/ajax.js'),
    Proj4js = require('../../../libs/proj4js-compressed.js');

//------------------------------------------------------------------------------

/**
 * To gather heat points on your maps, use HeatmapData.
 *
 * One HeatmapData may be shared between many {@link MapView}.
 *
 * Create a HeatmapData using {@link Maperial#createHeatmapData}
 *
 * You may directly import a FeatureCollection either by a url or an object.
 *
 * Each 'feature' in your FeatureCollection should be formatted as Point, with a scale and a diameter as properties :
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
 *   "properties": {
 *       "diameter": 10000,
 *       "scale": 0.6
 *   }
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
 * var url = 'http://static.maperial.com/geojson/heatmap.geojson.json';
 * var data = maperial.createHeatmapData(url);
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
 *       "properties": {
 *           "diameter": 9000,
 *           "scale": 0.54
 *       }
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
 *       "properties": {
 *           "diameter": 10000,
 *           "scale": 0.67
 *       }
 *     }
 *   ]
 * }
 *
 * var data = maperial.createHeatmapData(collection);
 *
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
                    this.addPoints(data);
                }.bind(this)
            });
        } else if ('object' === typeof (data)) {
            this.addPoints(data);
        }

    }
}

//------------------------------------------------------------------------------

/**
 * @function
 */
HeatmapData.prototype.addPoints = function (collection) {
    collection.features.forEach(function (feature) {
        this.addPoint(feature);
    }.bind(this))
}

//------------------------------------------------------------------------------

/**
 * @function
 */
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
    this.points.push(point);
    this.version++;

    return point;
}

//------------------------------------------------------------------------------

/**
 * @function
 */
HeatmapData.prototype.reset = function () {
    this.points = [];
    this.content = {
        "h": Maperial.tileSize,
        "w": Maperial.tileSize,
        "l": []
    }
    this.version++;
}

/**
 * alias for {@link #reset}
 * @function
 */
HeatmapData.prototype.removeAll = HeatmapData.prototype.reset;

//------------------------------------------------------------------------------

/**
 * @function
 */
HeatmapData.prototype.removePoint = function (pointToRemove) {
    if (pointToRemove) {
        this.points.splice(
            this.points.indexOf(
                this.points.filter(function (point) {
                    return point.id === pointToRemove.id;
                })
            ), 1
        );
        this.version++;
    }
}

//------------------------------------------------------------------------------

/**
 * @function
 * @param {Array} data An array of FeatureCollections. The animation will load one FeatureCollection after the other to animate your Array over time.
 */
HeatmapData.prototype.animate = function (data) {
    if (data) {
        if ('string' === typeof (data)) {
            ajax.get({
                url: data,
                async: true,
                callback: function (error, batch) {
                    this.animateBatches(batch);
                }.bind(this)
            });
        } else if ('object' === typeof (data)) {
            this.animateBatches(data);
        }
    }
}

HeatmapData.prototype.animateBatches = function (batches, options) {

    options      = options || {};
    options.step = options.step || 0;

    var displayBatch = function(){
        this.removeAll();
        this.import(batches[options.step]);
        options.step = (options.step + 1) % batches.length;
        setTimeout(displayBatch, 25);
    }.bind(this);

    setTimeout(displayBatch, 25);
}

//------------------------------------------------------------------------------

module.exports = HeatmapData;
