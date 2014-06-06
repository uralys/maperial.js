//---------------------------------------------------------------

var Layer                   = require('../models/layer.js'),
    DynamicalLayer          = require('../models/layers/dynamical-layer.js'),
    ImageLayer              = require('../models/layers/image-layer.js'),
    RasterLayer             = require('../models/layers/raster-layer.js'),
    HeatmapLayer            = require('../models/layers/heatmap-layer.js');

//---------------------------------------------------------------

function LayerManager(mapView){
    this.mapView = mapView;
}

//----------------------------------------

LayerManager.prototype.addLayer = function(layerType, params) {

    console.log("  adding layer " + layerType)
    var layer = null

    switch(layerType){

        // ---------------------------------------

        case Layer.Dynamical :
            layer = new DynamicalLayer(params, this.defaultDynamicalComposition());
            break;

        // ---------------------------------------

        case Layer.Heat :
            layer = new HeatmapLayer(params, this.defaultComposition());
            break;

        // ---------------------------------------

        case Layer.Raster :
            layer = new RasterLayer(params, this.defaultComposition());
            break;

        // ---------------------------------------

        case Layer.Images :
        case Layer.WMS:
            layer = new ImageLayer(params, this.defaultComposition());
            break;

        // ---------------------------------------

        case Layer.Vectorial :
            break;

    }

    for (var key in this.mapView.tiles) {
        this.mapView.tiles[key].createLayerPart(layer, this.mapView.layers.length);
    }  

    this.mapView.layers.push(layer);

    return layer;
}

//===========================================================================
//Default settings

LayerManager.prototype.defaultMulBlend = function() {
    return {
        shader : Maperial.MulBlend,
        params : LayerManager.defaultMulBlendParams
    };
}

LayerManager.prototype.defaultComposition = function() {
    return {
        shader : Maperial.AlphaBlend,
        params : LayerManager.defaultAlphaBlendParams
    };
}

LayerManager.prototype.defaultDynamicalComposition = function() {
    return {
        shader : Maperial.AlphaBlend,
        params : {
            uParams : 1
        }
    };
}

//----------------------------------------

LayerManager.defaultMulBlendParams = {
uParams : [ 0.0, 0.0, 1 ]
}


LayerManager.defaultAlphaBlendParams = {
uParams : 0.5
}

LayerManager.defaultAlphaClipParams = {
uParams : 0.5
}

//---------------------------------------------------------------

module.exports = LayerManager;
