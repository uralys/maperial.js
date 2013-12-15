//-------------------------------------------//
//- DataManager
//-------------------------------------------//

function DataManager(){
   this.dynamicalRenderers  = {};
}

//---------------------------------------------------------------------------//

DataManager.prototype.addDynamicalRenderer = function(mapView, dynamicalData){
   var renderer = new DynamicalRenderer(mapView, dynamicalData);
   this.dynamicalRenderers[renderer.id] = renderer
   return renderer;
}