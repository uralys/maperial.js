var utils = require('../../../../libs/utils.js'),
    _ = require('../../../../libs/lodash.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//------------------------------------------------------------------------

function ImageLayer(options) {

    this.id = utils.generateUID();
    this.type = Layer.Images;
    this.sourceId = options.sourceId;

    this.composition = _.extend({}, Composition);
    _.extend(this, this.composition.expose());

    this.setAlphaBlend();
}

//------------------------------------------------------------------------

module.exports = ImageLayer;
