var utils = require('../../../../libs/utils.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//---------------------------------------------------------------------------

function RasterLayer(options) {

    _.extend(this, new Layer());
    this.composition = new Composition(this);
    _.extend(this, this.composition.api);

    this.id = utils.generateUID();
    this.type = Layer.Raster;
    this.sourceId = options.sourceId;

    this.setAlphaBlend();
}

//---------------------------------------------------------------------------

module.exports = RasterLayer;
