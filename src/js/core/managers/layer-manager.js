'use strict';

// ---------------------------------------------------------------

var _              = require('lodash');
var Layer          = require('../models/layer.js');
var Composition    = require('../models/layers/composition.js');
var DynamicalLayer = require('../models/layers/dynamical-layer.js');
var ImageLayer     = require('../models/layers/image-layer.js');
var ShadeLayer     = require('../models/layers/shade-layer.js');
var RasterLayer    = require('../models/layers/raster-layer.js');
var HeatmapLayer   = require('../models/layers/heatmap-layer.js');

// ---------------------------------------------------------------

// TODO : une mapview doit gerer ca, cest de la merde ce manager
// --> exemple : mapview.layer.reset -> reset all layertparts
function LayerManager(mapView) {
    this.mapView = mapView;
}

// ---------------------------------------------------------------

LayerManager.prototype.addLayer = function(layerType, options) {
    console.log(' adding layer ' + layerType);
    var layer  = null;
    var tiles  = this.mapView.tiles;
    var layers = this.mapView.layers;

    switch (layerType) {

        // ---------------------------------------

        case Layer.Dynamical:
            layer = new DynamicalLayer({
                mapView: this.mapView,
                params: options
            });
            break;

            // ---------------------------------------

        case Layer.Heat:
            layer = new HeatmapLayer({
                mapView: this.mapView,
                params: options
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
                sourceId: options.sourceId
            });
            break;

            // ---------------------------------------

        case Layer.Images:
        case Layer.WMS:
            layer = new ImageLayer(_.extend({
                mapView: this.mapView
            }, options));
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

// ---------------------------------------------------------------

LayerManager.prototype.duplicate = function(layers) {
    layers.forEach(function(layer) {
        var tiles = this.mapView.tiles;
        var layers = this.mapView.layers;

        for (var key in tiles) {
            tiles[key].createLayerPart(layer, layers.length);
        }

        layers.push(layer);
    }.bind(this));
};

// ---------------------------------------------------------------

module.exports = LayerManager;
