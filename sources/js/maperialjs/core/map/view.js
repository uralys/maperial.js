//--------------------------------------------------------------------------

var Context                 = require('./context.js'),
    Mouse                   = require('./mouse.js'),
    Mover                   = require('./mover.js'),
    MapRenderer             = require('../rendering/map-renderer.js'),
    LayerManager            = require('../managers/layer-manager.js'),
    Layer                   = require('../models/layer.js'),
    Source                  = require('../models/source.js'),
    Events                  = require('../../libs/events.js'),
    utils                   = require('../../../libs/utils.js');

//--------------------------------------------------------------------------

function MapView(maperial, options){
    this.prepare(maperial, options);
    this.expose();
};

//--------------------------------------------------------------------------
//-     API
//--------------------------------------------------------------------------

MapView.prototype.expose = function () {

    /*********************************/
    // Images

    /* TODO doc */
    this.addOCMTransport = function(){
        return this.addImageLayer(Source.IMAGES_OCM_TRANSPORT);
    }.bind(this);

    /* TODO doc */
    this.addWatercolor = function(){
        return this.addImageLayer(Source.IMAGES_STAMEN_WATERCOLOR);
    }.bind(this);


    /**********************************/
    /* Maperial layers*/

    /* TODO doc */
    this.addShade = function(){
        return this.addShadeLayer();
    }.bind(this);

};

//--------------------------------------------------------------------------
//-     VIEW
//--------------------------------------------------------------------------

MapView.prototype.prepare = function (maperial, options)   {
    console.log("  prepare MapView : " + options.container.id);

    //-------------------------------------------------------------
    // settings

    this.maperial       = maperial;
    this.options        = options;
    this.id             = utils.generateUID() + "_" + this.options.container.id;
    this.type           = options.type;

    //-------------------------------------------------------------
    // plug mixins in

    Events.call(this);

    //-------------------------------------------------------------
    // prepare the view

    this.prepareView();

    //-------------------------------------------------------------
    // plug modules

    new Mouse(this);
    new Mover(this);

    //-------------------------------------------------------------

    // array to use push and splice
    this.layers             = [];

    // hashmap : tiles[key] = tile
    this.tiles              = {};

    // hashmap : dynamicalRenderers[dynamicalData.id] = dynamicalRenderer
    this.dynamicalRenderers = {};

    this.context            = new Context(this);

    this.mapRenderer        = new MapRenderer(this);
    this.layerManager       = new LayerManager(this);

    //-------------------------------------------------------------

    this.shaders = [ Maperial.AlphaClip,
                     Maperial.AlphaBlend,
                     Maperial.MulBlend ];
};

//--------------------------------------------------------------------------
//-     CONTAINER
//--------------------------------------------------------------------------

MapView.prototype.prepareView = function ()   {

    this.canvas = document.createElement('canvas');
    this.canvas.className = this.type;
    this.options.container.appendChild(this.canvas);

    this.width       = this.options.container.clientWidth;
    this.height      = this.options.container.clientHeight;

    this.setCanvasSize();
};

MapView.prototype.setCanvasSize = function() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
};

//--------------------------------------------------------------------------
//-     PLUGINS for API
//--------------------------------------------------------------------------

MapView.prototype.addImageLayer = function (sourceId)   {
    return this.layerManager.addLayer(Layer.Images, sourceId);
};

//-----------------------------------------------------------------

MapView.prototype.addDynamicalLayer = function (dynamicalData, options)   {

    //-------------------------------------------
    // Checking options

    var options = utils.prepareOptions(options, "style");
    if(!options){
        console.log("Wrong call to addDynamicalLayer. Check the options");
    }

    //-------------------------------------------
    // Proceed

    return this.layerManager.addLayer(Layer.Dynamical, {
        mapView           : this,
        dynamicalData     : dynamicalData,
        style             : options.style
    });

};

//-----------------------------------------------------------------

MapView.prototype.addHeatmapLayer = function (heatmapData, options)   {

    options.colorbar = options.colorbar || colorbarManager.createColorbar();

    //-------------------------------------------
    // Proceed

    return this.layerManager.addLayer(Layer.Heat, {
        mapView        : this,
        heatmapData    : heatmapData,
        colorbar       : options.colorbar,
        options        : options
    });

};

//-----------------------------------------------------------------

// SHADE AND RASTER SHOULD JSUT BE OPTIONS IN RETILER TYPE LAYER

MapView.prototype.addShadeLayer = function () {
    this.layerManager.addLayer(Layer.Shade);
};

//-----------------------------------------------------------------

MapView.prototype.addRasterLayer = function (sourceId) {
    return this.layerManager.addLayer(Layer.Raster, sourceId);
};

//-----------------------------------------------------------------

MapView.prototype.addWMSLayer = function (sourceId) {

};

//-----------------------------------------------------------------

MapView.prototype.addOSMLayer = function (styleId)   {

  if(!styleId)
      styleId = Maperial.DEFAULT_STYLE_UID;

};

//--------------------------------------------------------------------------
//-     Camera
//--------------------------------------------------------------------------




//--------------------------------------------------------------------------

module.exports = MapView;
