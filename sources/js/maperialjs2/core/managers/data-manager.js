//-------------------------------------------//
//- DataManager
//-------------------------------------------//

function DataManager(){
   this.renderers  = {};
}

//---------------------------------------------------------------------------//

DataManager.prototype.addDynamicalRenderer = function(mapView, dynamicalData, style){
   var renderer = new DynamicalRenderer(mapView, dynamicalData, style);
   this.renderers[renderer.id] = renderer;
   return renderer;
}

//---------------------------------------------------------------------------//

DataManager.prototype.addHeatmapRenderer = function(mapView, heatmapData, colorbar){
    var renderer = new HeatmapRenderer(mapView, heatmapData, colorbar);
    this.renderers[renderer.id] = renderer;
    return renderer;
}