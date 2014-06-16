
var utils       = require('../../../../libs/utils.js'),
    Layer       = require('../layer.js');

//---------------------------------------------------------------------------

function ShadeLayer (params, composition) {
   this.id              = utils.generateUID();
   this.type            = Layer.Shade;
   this.params          = params;
   this.composition     = composition;
}

//---------------------------------------------------------------------------

module.exports = ShadeLayer;
