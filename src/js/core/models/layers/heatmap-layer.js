var utils = require('../../../libs/utils.js'),
    _ = require('lodash/object'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//-----------------------------------------------------------------------

function HeatmapLayer(options) {

    _.extend(this, new Layer(options));

    this.type = Layer.Heat;
    this.heatmapData = options.params.heatmapData;

    this.colorbar = options.params.colorbar;
    this.options = options.params.options;

    this.renderer = this.mapView.mapRenderer.addHeatmapRenderer(
        this.heatmapData,
        this.colorbar,
        this.options
    );

    this.setAlphaBlend();
}

//-----------------------------------------------------------------------

module.exports = HeatmapLayer;

//-----------------------------------------------------------------------
