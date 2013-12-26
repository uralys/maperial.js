//-------------------------------------------//
//- DataManager
//-------------------------------------------//

function DataManager(){
   this.dynamicalRenderers  = {};
}

//---------------------------------------------------------------------------//

DataManager.prototype.addDynamicalRenderer = function(mapView, dynamicalData, styleUID){
   var renderer = new DynamicalRenderer(mapView, dynamicalData, styleUID);
   this.dynamicalRenderers[renderer.id] = renderer
   return renderer;
}