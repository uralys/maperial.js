var utils = require('../../../../libs/utils.js'),
    _ = require('../../../../libs/lodash.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');


//---------------------------------------------------------------------------

function RasterLayer(options) {

    _.extend(this, new Layer(options));

    this.type = Layer.Raster;
    this.sourceId = options.sourceId;

    this.setAlphaBlend();
}

//---------------------------------------------------------------------------

module.exports = RasterLayer;
