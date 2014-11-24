var utils = require('../../../../libs/utils.js'),
    _ = require('../../../../libs/lodash.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//--------------------------------------------------------------------------

function DynamicalLayer(options) {

    _.extend(this, new Layer());
    this.composition = new Composition(this);
    _.extend(this, this.composition.api);

    this.id = utils.generateUID();
    this.type = Layer.Dynamical;
    this.mapView = options.params.mapView;
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
