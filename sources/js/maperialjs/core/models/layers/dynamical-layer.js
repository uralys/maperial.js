
var utils       = require('../../../../../tools/utils.js'),
    Layer       = require('../layer.js');

//-----------------------------------------------------------------------------------//

function DynamicalLayer (params, composition) {
   this.id                 = utils.generateUID();
   this.type               = Layer.Dynamical;
   this.mapView            = params.mapView;
   this.dynamicalData      = params.dynamicalData;

   this.style              = styleManager.createCustomStyle(params.style);
   this.composition        = composition;

   this.renderer           = this.mapView.mapRenderer.addDynamicalRenderer(this.dynamicalData, this.style);
}

//-----------------------------------------------------------------------------------//

module.exports = DynamicalLayer;