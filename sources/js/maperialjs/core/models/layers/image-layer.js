var utils = require('../../../../libs/utils.js'),
    _ = require('../../../../libs/lodash.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//------------------------------------------------------------------------

function ImageLayer(options) {

    _.extend(this, new Layer(options));

    this.type = Layer.Images;
    this.sourceId = options.sourceId;

    this.setAlphaBlend();
}

//------------------------------------------------------------------------

module.exports = ImageLayer;
