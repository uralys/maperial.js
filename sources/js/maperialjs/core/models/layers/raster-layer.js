
var utils       = require('../../../../libs/utils.js'),
    Layer       = require('../layer.js');

//-----------------------------------------------------------------------------------//

function RasterLayer (sourceId, composition) {
   
   this.id              = utils.generateUID();
   this.type            = Layer.Raster;
   this.sourceId        = sourceId;
   this.composition     = composition;
   
}

//-----------------------------------------------------------------------------------//

module.exports = RasterLayer;
