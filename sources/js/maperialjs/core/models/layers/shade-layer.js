
var utils       = require('../../../../libs/utils.js'),
    Layer       = require('../layer.js');

//---------------------------------------------------------------------------

function ShadeLayer (composition) {
   
   this.id              = utils.generateUID();
   this.type            = Layer.Shade;
   this.composition     = composition;
   
}

//---------------------------------------------------------------------------

module.exports = ShadeLayer;
