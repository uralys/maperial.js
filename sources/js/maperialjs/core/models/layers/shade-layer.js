
var utils       = require('../../../../libs/utils.js'),
    Layer       = require('../layer.js');

//---------------------------------------------------------------------------

function RasterLayer (sourceId, composition) {
   
   this.id              = utils.generateUID();
   this.type            = Layer.Shade;
   this.sourceId        = sourceId;
   this.composition     = composition;
   
}

//---------------------------------------------------------------------------

module.exports = RasterLayer;
