//--------------------------------------------------------------------------

var Context                 = require('./context.js'),
    Mouse                   = require('./mouse.js'),
    Mover                   = require('./mover.js'),
    MapRenderer             = require('../rendering/map-renderer.js'),
    LayerManager            = require('../managers/layer-manager.js'),
    Layer                   = require('../models/layer.js'),
    Source                  = require('../models/source.js'),
    Events                  = require('../../libs/events.js'),
    utils                   = require('../../../libs/utils.js'),
    TWEEN                   = require('tween.js');

//--------------------------------------------------------------------------

function MapView(maperial, options){
    this.prepare(maperial, options);
    this.expose();
};

//--------------------------------------------------------------------------
//-     API
//--------------------------------------------------------------------------

MapView.prototype.expose = function () {

    /*---------------------*/
    // Images

    /* TODO doc */
    this.addOCMTransport = function(){
        return this.addImageLayer(Source.IMAGES_OCM_TRANSPORT);
    }.bind(this);

    /* TODO doc */
    this.addWatercolor = function(){
        return this.addImageLayer(Source.IMAGES_STAMEN_WATERCOLOR);
    }.bind(this);


    /*---------------------*/
    /* Maperial layers */

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

    this.maperial = maperial;
    this.options  = options;
    this.id       = utils.generateUID() + "_" + this.options.container.id;
    this.type     = options.type;

    //-------------------------------------------------------------
    // plug mixins in

    Events.call(this);

    //-------------------------------------------------------------
    // prepare the view

    this.prepareView();
    this.prepareCamera();

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
    
    this.options.container.style.overflow = 'hidden';
    this.options.container.appendChild(this.canvas);

    this.refresh();
};

MapView.prototype.refresh = function() {
    this.canvas.width  = this.width    = this.options.container.clientWidth;
    this.canvas.height = this.height   = this.options.container.clientHeight;
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

    options.colorbar = options.colorbar 
    || Maperial.colorbarManager.defaultColorbar(this);

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
    return this.layerManager.addLayer(Layer.Shade);
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

MapView.prototype.prepareCamera= function ()   {
    
    this.on("zoom-in", function(){
        this.zoomCanvas(2);
        this.context.zoom ++;   
    }.bind(this));

    this.on("zoom-out", function(){
        this.zoomCanvas(0.5);
        this.context.zoom --;   
    }.bind(this));
};

//--------------------------------------------------------------------------
// TODO: create ./zoomer.js and move the following algo there

MapView.prototype.zoomCanvas = function(scaleTo) {

    var canvas    = cloneCanvas(this.canvas),
        container = this.options.container;
    
    container.appendChild(canvas);

    canvas.className      = this.canvas.className;
    canvas.style.position = 'absolute';
    canvas.style.top      = '0';
    canvas.style.left     = '0';

    var from    = { scale: 1 },
        to      = { scale: scaleTo },
        time    = 600,
        tween   = new TWEEN.Tween( from )
        .to( to, time )
        .easing( TWEEN.Easing.Circular.Out )
        .onUpdate( function () {
            var transform = 'scale(' + this.scale + ')';
            canvas.style.webkitTransform = transform;
            canvas.style.transform = transform;
        })
        .onComplete( function () {
            var from    = { alpha: 1 },
                to      = { alpha: 0 },
                time    = 500,
                tween   = new TWEEN.Tween( from )
                .to( to, time )
                .easing( TWEEN.Easing.Circular.In )
                .onUpdate( function () {
                    canvas.style.opacity = this.alpha;
                })
                .onComplete( function () {
                    container.removeChild(canvas);                    
                })
                .start();
        })
        .start();

}

function cloneCanvas(oldCanvas) {

    //create a new canvas
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    var dataURL = oldCanvas.toDataURL("image/jpeg", 1);
    var imageExported = new Image();
    
    // load image from data url
    imageExported.onload = function() {
      context.drawImage(this, 0, 0);
    };

    imageExported.src = dataURL;

    //return the new canvas
    return newCanvas;
}

//--------------------------------------------------------------------------

module.exports = MapView;
