var utils = require('../../../../libs/utils.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//-----------------------------------------------------------------------

function HeatmapLayer(options) {

    _.extend(this, new Layer(options));
    this.composition = new Composition(this);
    _.extend(this, this.composition.api);

    this.id = utils.generateUID();
    this.type = Layer.Heat;
    this.mapView = options.params.mapView;
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
