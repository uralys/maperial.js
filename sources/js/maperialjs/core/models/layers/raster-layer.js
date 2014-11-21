var utils = require('../../../../libs/utils.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//---------------------------------------------------------------------------

function RasterLayer(options) {

    Composition.call(this);

    this.id = utils.generateUID();
    this.type = Layer.Raster;
    this.sourceId = options.sourceId;
    this.composition = this.defaultComposition();

}

//---------------------------------------------------------------------------

module.exports = RasterLayer;
