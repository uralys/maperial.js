var utils       = require('../../../libs/utils.js'),
    _extend     = require('lodash/object/extend'),
    Composition = require('./composition.js'),
    Layer       = require('../layer.js');

//-----------------------------------------------------------------------

function HeatmapLayer(options) {

    _extend(this, new Layer(options));

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
