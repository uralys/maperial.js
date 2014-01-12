
var utils       = require('../../../../../tools/utils.js'),
    Layer       = require('../layer.js');

//-----------------------------------------------------------------------------------//

function HeatmapLayer (params, composition) {
   this.id                 = utils.generateUID();
   this.type               = Layer.Heat;
   this.mapView            = params.mapView;
   this.heatmapData        = params.heatmapData;
   this.colorbar           = params.colorbar;
   this.options            = params.options;
   
   this.composition        = composition;
   
   this.renderer           = this.mapView.mapRenderer.addHeatmapRenderer(this.heatmapData, this.colorbar, this.options);
}

//-----------------------------------------------------------------------------------//

module.exports = HeatmapLayer;

//-----------------------------------------------------------------------------------//