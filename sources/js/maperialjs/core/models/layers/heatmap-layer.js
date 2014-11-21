var utils = require('../../../../libs/utils.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//-----------------------------------------------------------------------

function HeatmapLayer(options) {

    Composition.call(this);

    this.id = utils.generateUID();
    this.type = Layer.Heat;
    this.mapView = options.params.mapView;
    this.heatmapData = options.params.heatmapData;

    this.colorbar = options.params.colorbar;
    this.options = options.params.options;

    this.composition = this.defaultComposition();

    this.renderer = this.mapView.mapRenderer.addHeatmapRenderer(
        this.heatmapData,
        this.colorbar,
        this.options
    );
}

//-----------------------------------------------------------------------

module.exports = HeatmapLayer;

//-----------------------------------------------------------------------
