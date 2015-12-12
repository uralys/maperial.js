'use strict';

// ------------------------------------------------------------------------

var utils       = require('../../../libs/utils.js');
var _extend     = require('lodash/object/extend');
var Composition = require('./composition.js');
var Layer       = require('../layer.js');

// ------------------------------------------------------------------------

/**
 * @constructor
 *
 * @mixes Composition
 */
function ImageLayer(options) {
    _extend(this, new Layer(options));

    this.type     = Layer.Images;
    this.options  = options;
    this.sourceId = options.sourceId;

    this.setAlphaBlend();
}

// ------------------------------------------------------------------------

module.exports = ImageLayer;
