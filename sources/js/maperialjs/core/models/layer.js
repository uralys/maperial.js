
var Events = require('../../libs/events.js');

//-----------------------------------------------------------------

function Layer (){

    Events.call(this);

    this.refresh = function(){
        this.trigger(Layer.REFRESH);
    };

};

//-----------------------------------------------------------------

Layer.REFRESH = 'layer:refresh';

//-----------------------------------------------------------------

Layer.Dynamical = 'layer.dynamical';
Layer.Heat      = 'layer.heat';
Layer.Vectorial = 'layer.vectorial';
Layer.Raster    = 'layer.raster';
Layer.Images    = 'layer.images';
Layer.Shade     = 'layer.shade'; // fuse with ReTil;

  //WMS       : "Layer.WMS",
  //ReTiler   : "Layer.ReTiler"
  //
//-----------------------------------------------------------------

module.exports = Layer;
