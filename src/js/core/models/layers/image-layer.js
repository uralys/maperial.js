var utils = require('../../../libs/utils.js'),
    _ = require('lodash'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//------------------------------------------------------------------------

/**
 * @constructor
 *
 * @mixes Composition
 */
function ImageLayer(options) {

    _.extend(this, new Layer(options));

    this.type = Layer.Images;
    this.sourceId = options.sourceId;

    this.setAlphaBlend();
}

//------------------------------------------------------------------------

module.exports = ImageLayer;
