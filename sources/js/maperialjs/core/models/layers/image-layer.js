var utils = require('../../../../libs/utils.js'),
    Layer = require('../layer.js');

//------------------------------------------------------------------------

function ImageLayer(sourceId, composition) {

    this.id = utils.generateUID();
    this.type = Layer.Images;
    this.sourceId = sourceId;
    this.composition = composition;

}

//------------------------------------------------------------------------

module.exports = ImageLayer;
