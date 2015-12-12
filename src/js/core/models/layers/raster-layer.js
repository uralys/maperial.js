var utils = require('../../../libs/utils.js'),
    _ = require('lodash/object'),
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
