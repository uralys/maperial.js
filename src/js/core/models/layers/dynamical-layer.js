var utils       = require('../../../libs/utils.js'),
    _extend     = require('lodash/object/extend'),
    Composition = require('./composition.js'),
    Layer       = require('../layer.js');

//--------------------------------------------------------------------------

function DynamicalLayer(options) {

    _extend(this, new Layer(options));

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
