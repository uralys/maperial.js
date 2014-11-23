var utils = require('../../../../libs/utils.js'),
    _ = require('../../../../libs/lodash.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//--------------------------------------------------------------------------

function DynamicalLayer(options) {

    this.id = utils.generateUID();
    this.type = Layer.Dynamical;
    this.mapView = options.params.mapView;
    this.dynamicalData = options.params.dynamicalData;

    this.style = Maperial.styleManager.createCustomStyle(params.style);

    this.composition = _.extend({}, Composition);
    this.composition.applyDefaultDynamicalComposition();

    this.renderer = this.mapView.mapRenderer.addDynamicalRenderer(
        this.dynamicalData,
        this.style
    );
}

//--------------------------------------------------------------------------

module.exports = DynamicalLayer;

//--------------------------------------------------------------------------
