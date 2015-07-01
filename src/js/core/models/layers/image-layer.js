'use strict';

// ------------------------------------------------------------------------

var utils       = require('../../../libs/utils.js');
var _           = require('lodash');
var Composition = require('./composition.js');
var Layer       = require('../layer.js');

// ------------------------------------------------------------------------

/**
 * @constructor
 *
 * @mixes Composition
 */
function ImageLayer(options) {
    _.extend(this, new Layer(options));

    this.type     = Layer.Images;
    this.options  = options;
    this.sourceId = options.sourceId;

    this.setAlphaBlend();
}

// ------------------------------------------------------------------------

module.exports = ImageLayer;
