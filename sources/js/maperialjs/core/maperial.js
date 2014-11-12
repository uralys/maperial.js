//-----------------------------------------------------------------

/**
 * @fileOverview ewrtdyf ert ertg   s e
 */
var MapView = require('./map/map-view.js'),
    SourceManager = require('./managers/source-manager.js'),
    StyleManager = require('./managers/style-manager.js'),
    ColorbarManager = require('./managers/colorbar-manager.js'),
    DynamicalData = require('./models/data/dynamical-data.js'),
    HeatmapData = require('./models/data/heatmap-data.js'),
    Source = require('./models/source.js'),
    utils = require('../../libs/utils.js'),
    SimpleZoom = require('../extensions/hud/simple-zoom.js'),
    environment = require('../../environment/config.js');

//-----------------------------------------------------------------

/**
 * Instanciate one Maperial to build every maps on your web page.
 *
 * With your Maperial you can now draw Maps and share Data between them.
 *
 * @example
 * var maperial = new Maperial();
 *
 * @constructor
 */
function Maperial(options) {
    console.log("-----------------------");
    console.log("Creating a Maperial");
    this.options = options;
    this.views = [];

    /* global content */
    this.refreshSharedItems();

    /* expose maperial api */
    this.expose();
}

//-----------------------------------------------------------------

Maperial.prototype.refreshSharedItems = function () {
    console.log("Refreshing shared items");

    // cache containing all previously loaded colorbars
    Maperial.colorbars = Maperial.colorbars || {};

    Maperial.sourceManager = Maperial.sourceManager || new SourceManager();
    Maperial.styleManager = Maperial.styleManager || new StyleManager();
    Maperial.colorbarManager = Maperial.colorbarManager || new ColorbarManager();

    window.addEventListener("resize", function () {
        this.views.forEach(function (view) {
            view.refresh();
        })
    }.bind(this));
};

//-----------------------------------------------------------------
//Views types
//TYPE = css class

Maperial.MAIN = "maperial-main";
Maperial.ANCHOR = "maperial-anchor";

//camera centered on what is under it
Maperial.LENS = "maperial-lens";

//camera centered on the parent's center
Maperial.MINIFIER = "maperial-minifier";

//camera centered on what is under the mouse
Maperial.MAGNIFIER = "maperial-magnifier";

//-----------------------------------------------------------------
//Vectorial layers types

Maperial.OSM = "tiles";
Maperial.VECTORIAL_DATA = "data";

//-----------------------------------------------------------------

Maperial.staticURL = environment.staticURL;
Maperial.apiURL = environment.apiURL;
Maperial.tileURL = environment.tileURL;

//-----------------------------------------------------------------

Maperial.DEFAULT_ZOOM = 10;
Maperial.DEFAULT_LATITUDE = 48.813;
Maperial.DEFAULT_LONGITUDE = 2.313;

//Clermont City
//Maperial.DEFAULT_LATITUDE       = 45.779017;
//Maperial.DEFAULT_LONGITUDE      = 3.10617;

//-----------------------------------------------------------------

Maperial.bgdimg = "symbols/water.png";

Maperial.refreshRate = 1000 / 30; // ms
Maperial.tileDLTimeOut = 60000; // ms
Maperial.tileSize = 256;

Maperial.autoMoveSpeedRate = 0.2;
Maperial.autoMoveMillis = 700;
Maperial.autoMoveDeceleration = 0.005;
Maperial.autoMoveAnalyseSize = 10;

Maperial.DEFAULT_STYLE_UID = "1_style_13ed75438c8b2ed8914";
Maperial.DEFAULT_COLORBAR_UID = "1_colorbar_13c630ec3a5068919c3";

Maperial.AlphaClip = "AlphaClip";
Maperial.AlphaBlend = "AlphaBlend";
Maperial.XBlend = "XBlend";

Maperial.globalDataCpt = 0;

//------------------------------------------------------------------------------
// API
//------------------------------------------------------------------------------

Maperial.prototype.expose = function () {

    /**
     * @function
     * @param {object|string} options May be either an object containing many
     *                                settings or just the container as
     *                                unique parameter.
     * @param {string} options.container [Mandatory] The div id that will contain
     *                                      the map. May replace 'options'
     * @param {integer} options.defaultZoom The map start zoom (default : 10)
     * @param {float} options.latitude The map start latitude (default : 48.813)
     * @param {float} options.longitude The map start longitude (default : 2.313)
     *
     * @returns {MapView} <-toplink_dummydesc_bottomlink-> {@link MapView}
     *
     * @example <caption>
     * Both following examples use this container :
     * <b>&lt;div id="map-container"&gt;&lt;/div&gt;</b>
     * </caption>
     *
     * var map = maperial.createMap('map-container');
     *
     * @example
     * var map = maperial.createMap({
     *     container:   'map-container',
     *     defaultZoom: 15,
     *     latitude:    53.03787562127988,
     *     longitude:   4.844833878624368
     * });
     */
    this.createMap = function (options) {

        //-------------------------------------------
        // Checking options

        utils.prepareOptions(options, "container");

        if (!options) {
            console.log("Wrong call to createMap. Check the options");
        }

        //-------------------------------------------
        // Checking view

        console.log("Adding view in container " + options.container);

        if (document.getElementById(options.container) == null) {
            console.log("Container " + options.container + " could not be found");
            return;
        }

        options.container = document.getElementById(options.container);

        //-------------------------------------------
        // Set defaults

        if (options.type === undefined) {
            options.type = Maperial.MAIN;
        }

        if (options.latitude === undefined) {
            options.latitude = Maperial.DEFAULT_LATITUDE;
        }

        if (options.longitude === undefined) {
            options.longitude = Maperial.DEFAULT_LONGITUDE;
        }

        //-------------------------------------------
        // Proceed

        var view = new MapView(this, options);
        this.views.push(view);

        return view;
    };

    /**
     * @function
     * @param {object|string} data May be either an GeoJson object or a url
     *                             providing a GeoJson object
     *
     * @returns {DynamicalData} <-toplink_dd_bottomlink-> {@link DynamicalData}
     *
     * @example <caption> Example with a GeoJson provided by a url </caption>
     *
     * @example
     * var url = 'http://static.maperial.com/geojson/demo.geojson.json';
     * var data = maperial.createDynamicalData(url);
     *
     */
    this.createDynamicalData = function (data) {
        return new DynamicalData(data);
    };

    /**
     * @function
     * @param {object|string} data May be either an GeoJson object or a url
     *                             providing a GeoJson object
     *
     * @returns {HeatmapData} <-toplink_dd_bottomlink-> {@link HeatmapData}
     * @example <caption> Example with a GeoJson provided by a url </caption>
     * var url = 'http://static.maperial.com/geojson/heatmap.geojson.json';
     * var data = maperial.createHeatmapData(url);
     *
     */
    this.createHeatmapData = function (data) {
        return new HeatmapData(data);
    };

    /**
     * @function
     * @param {array} layers Add controls to an array of layers.
     */
    this.addShadeControls = function (layers) {
        var hud = document.createElement("div");
        var bar = document.createElement("input");

        hud.className = "hud";
        bar.className = "scale";
        bar.setAttribute("type", "range");
        bar.setAttribute("min", "1");
        bar.setAttribute("max", "100");
        bar.setAttribute("step", "1");
        bar.setAttribute("value", layers[0].params.scale);

        bar.addEventListener("input", function (event) {
            layers[0].params.scale = event.target.valueAsNumber;
        });

        hud.appendChild(bar);

        document.querySelector("body").appendChild(hud);
    }.bind(this);

    /*
     * TODO : container should be optional : default 2 buttons on top left
     * TODO doc
     */
    this.addSimpleZoom = function (options) {
        new SimpleZoom(options);
    };
};

//-----------------------------------------------------------------
// quicker than standalone...
window.Maperial = Maperial;

//-----------------------------------------------------------------

module.exports = Maperial;
