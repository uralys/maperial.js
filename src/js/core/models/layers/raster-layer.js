var utils       = require('../../../libs/utils.js'),
    _extend     = require('lodash/object/extend'),
    Composition = require('./composition.js'),
    Layer       = require('../layer.js');


//---------------------------------------------------------------------------

function RasterLayer(options) {

    _extend(this, new Layer(options));

    this.type = Layer.Raster;
    this.sourceId = options.sourceId;

    this.setAlphaBlend();
}

//---------------------------------------------------------------------------

module.exports = RasterLayer;
