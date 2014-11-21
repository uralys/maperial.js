var utils = require('../../../../libs/utils.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//------------------------------------------------------------------------

function ImageLayer(options) {

    Composition.call(this);

    this.id = utils.generateUID();
    this.type = Layer.Images;
    this.sourceId = options.sourceId;
    this.composition = this.defaultComposition();

}

//------------------------------------------------------------------------

module.exports = ImageLayer;
