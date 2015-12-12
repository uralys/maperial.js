// -----------------------------------------------------------------
'use strict';
var Events      = require('../../libs/events.js');
var Composition = require('./layers/composition.js');
var utils       = require('../../libs/utils.js');
var _           = require('lodash/object');

// -----------------------------------------------------------------

function Layer(options) {
    Events.call(this);

    this.id      = utils.generateUID();
    this.mapView = options.mapView;

    this.composition = new Composition(this);
    _.extend(this, this.composition.api);

    this.refresh = function() {
        this.trigger(Layer.REFRESH);
    };
}

// -----------------------------------------------------------------

Layer.REFRESH = 'layer:refresh';

// -----------------------------------------------------------------

Layer.Dynamical = 'layer.dynamical';
Layer.Heat      = 'layer.heat';
Layer.Vectorial = 'layer.vectorial';
Layer.Raster    = 'layer.raster';
Layer.Images    = 'layer.images';
Layer.Shade     = 'layer.shade'; // fuse with ReTil;

  // WMS       : "Layer.WMS",
  // ReTiler   : "Layer.ReTiler"
  //
// -----------------------------------------------------------------

module.exports = Layer;
