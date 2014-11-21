var utils = require('../../../../libs/utils.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//--------------------------------------------------------------------------

function DynamicalLayer(options) {

    Composition.call(this);

    this.id = utils.generateUID();
    this.type = Layer.Dynamical;
    this.mapView = options.params.mapView;
    this.dynamicalData = options.params.dynamicalData;

    this.style = Maperial.styleManager.createCustomStyle(params.style);

    this.composition = this.defaultDynamicalComposition();

    this.renderer = this.mapView.mapRenderer.addDynamicalRenderer(
        this.dynamicalData,
        this.style
    );
}

//--------------------------------------------------------------------------

module.exports = DynamicalLayer;

//--------------------------------------------------------------------------
