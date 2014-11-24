//---------------------------------------------------------------

var Layer          = require('../models/layer.js'),
    Composition    = require('../models/layers/composition.js'),
    DynamicalLayer = require('../models/layers/dynamical-layer.js'),
    ImageLayer     = require('../models/layers/image-layer.js'),
    ShadeLayer     = require('../models/layers/shade-layer.js'),
    RasterLayer    = require('../models/layers/raster-layer.js'),
    HeatmapLayer   = require('../models/layers/heatmap-layer.js');

//---------------------------------------------------------------

// TODO : une mapview doit gerer ca, cest de la merde ce manager
// --> exemple : mapview.layer.reset -> reset all layertparts
function LayerManager(mapView) {
    this.mapView = mapView;
}

//---------------------------------------------------------------

LayerManager.prototype.addLayer = function (layerType, params) {

    console.log("  adding layer " + layerType);
    var layer = null,
        tiles = this.mapView.tiles,
        layers = this.mapView.layers;

    switch (layerType) {

        // ---------------------------------------

        case Layer.Dynamical:
            layer = new DynamicalLayer({
                mapView: this.mapView,
                params: params,
            });
            break;

            // ---------------------------------------

        case Layer.Heat:
            layer = new HeatmapLayer({
                mapView: this.mapView,
                params: params
            });
            break;

            // ---------------------------------------

        case Layer.Shade:
            layer = new ShadeLayer({
                mapView: this.mapView
            });
            break;

            // ---------------------------------------

        case Layer.Raster:
            layer = new RasterLayer({
                mapView: this.mapView,
                sourceId: params
            });
            break;

            // ---------------------------------------

        case Layer.Images:
        case Layer.WMS:
            layer = new ImageLayer({
                mapView: this.mapView,
                sourceId: params
            });
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

module.exports = LayerManager;
