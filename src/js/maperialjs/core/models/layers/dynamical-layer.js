var utils = require('../../../../libs/utils.js'),
    _ = require('../../../../libs/lodash.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//--------------------------------------------------------------------------

function DynamicalLayer(options) {

    _.extend(this, new Layer(options));

    this.type = Layer.Dynamical;
    this.dynamicalData = options.params.dynamicalData;

    this.style = Maperial.styleManager.createCustomStyle(options.params.style);

    this.renderer = this.mapView.mapRenderer.addDynamicalRenderer(
        this.dynamicalData,
        this.style
    );

    this.setAlphaBlend();
    this.setAlpha(1);
}

//--------------------------------------------------------------------------

module.exports = DynamicalLayer;

//--------------------------------------------------------------------------
