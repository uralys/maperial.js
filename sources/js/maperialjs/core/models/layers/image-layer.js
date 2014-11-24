var utils = require('../../../../libs/utils.js'),
    _ = require('../../../../libs/lodash.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//------------------------------------------------------------------------

function ImageLayer(options) {

    _.extend(this, new Layer(options));
    this.composition = new Composition(this);
    _.extend(this, this.composition.api);

    this.id = utils.generateUID();
    this.type = Layer.Images;
    this.sourceId = options.sourceId;

    this.setAlphaBlend();
}

//------------------------------------------------------------------------

module.exports = ImageLayer;
