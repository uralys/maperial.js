//-----------------------------------------------------------------------------------//

function HeatmapLayer (params, composition) {
   this.id                 = Utils.generateUID();
   this.type               = Layer.Heat;
   this.mapView            = params.mapView;
   this.heatmapData        = params.heatmapData;
   this.colorbar           = params.colorbar;
   this.options            = params.options;
   
   this.composition        = composition;
   
   this.renderer           = this.mapView.mapRenderer.addHeatmapRenderer(this.heatmapData, this.colorbar, this.options);
}

//-----------------------------------------------------------------------------------//