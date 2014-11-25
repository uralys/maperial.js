var utils = require('../../../../libs/utils.js'),
    _ = require('../../../../libs/lodash.js'),
    Composition = require('./composition.js'),
    Layer = require('../layer.js');

//------------------------------------------------------------------------

/**
 * A MapView is the object you get when you create :
 * <ul>
 * <li>a [Map]{@link Maperial#createMap}</li>
 * <li>an [Anchor]{@link #addAnchor}</li>
 * <li>a Minifier</li>
 * <li>a Magnifier</li>
 * <li>a Lens</li>
 * </ul>
 *
 * @constructor
 */
function ImageLayer(options) {

    _.extend(this, new Layer(options));

    this.type = Layer.Images;
    this.sourceId = options.sourceId;

    this.setAlphaBlend();
}

//------------------------------------------------------------------------

module.exports = ImageLayer;
