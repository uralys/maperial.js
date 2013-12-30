//-----------------------------------------------------------------------------------//

function HeatmapLayer (params, composition) {
   this.id                 = Utils.generateUID();
   this.type               = Layer.Heat;
   this.mapView            = params.mapView;
   this.heatmapData        = params.heatmapData;
   this.options            = params.options;
   
   this.composition        = composition;
   
   this.heatmapRenderer    = dataManager.addHeatmapRenderer(this.mapView, this.dynamicalData, this.options);
}

//-----------------------------------------------------------------------------------//