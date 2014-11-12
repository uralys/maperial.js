//---------------------------------------------------------------

var Layer = require('../models/layer.js'),
    DynamicalLayer = require('../models/layers/dynamical-layer.js'),
    ImageLayer = require('../models/layers/image-layer.js'),
    ShadeLayer = require('../models/layers/shade-layer.js'),
    RasterLayer = require('../models/layers/raster-layer.js'),
    HeatmapLayer = require('../models/layers/heatmap-layer.js');

//---------------------------------------------------------------

function LayerManager(mapView) {
    this.mapView = mapView;
}

//----------------------------------------

LayerManager.prototype.addLayer = function (layerType, params) {

    console.log("  adding layer " + layerType);
    var layer = null,
        tiles = this.mapView.tiles,
        layers = this.mapView.layers;

    switch (layerType) {

        // ---------------------------------------

    case Layer.Dynamical:
        layer = new DynamicalLayer(params, this.defaultDynamicalComposition());
        break;

        // ---------------------------------------

    case Layer.Heat:
        layer = new HeatmapLayer(params, this.defaultComposition());
        break;

        // ---------------------------------------

    case Layer.Shade:
        layer = new ShadeLayer(
            LayerManager.defaultShade,
            this.defaultComposition()
        );
        break;

        // ---------------------------------------

    case Layer.Raster:
        layer = new RasterLayer(params, this.defaultComposition());
        break;

        // ---------------------------------------

    case Layer.Images:
    case Layer.WMS:
        layer = new ImageLayer(params, this.defaultComposition());
        break;

        // ---------------------------------------

    case Layer.Vectorial:
        break;

    }

    for (var key in tiles) {
        tiles[key].createLayerPart(layer, layers.length);
    }

    layers.push(layer);

    return layer;
};

//---------------------------------------------------------------
//Default settings

LayerManager.prototype.defaultXBlend = function () {
    return {
        shader: Maperial.XBlend,
        params: LayerManager.defaultXBlendParams
    };
};

LayerManager.prototype.defaultComposition = function () {
    return {
        shader: Maperial.AlphaBlend,
        params: LayerManager.defaultAlphaBlendParams
    };
};

LayerManager.prototype.defaultDynamicalComposition = function () {
    return {
        shader: Maperial.AlphaBlend,
        params: {
            uParams: 1
        }
    };
};

//----------------------------------------

LayerManager.defaultShade = {
    uLight: [10, 10, 20],
    scale: 10
};

//----------------------------------------

LayerManager.defaultXBlendParams = {
    uParams: [0.0, 0.0, 1]
};

LayerManager.defaultAlphaBlendParams = {
    uParams: 0.5
};

LayerManager.defaultAlphaClipParams = {
    uParams: 0.5
};

//---------------------------------------------------------------

module.exports = LayerManager;
