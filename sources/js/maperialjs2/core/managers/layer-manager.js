//-------------------------------------------//
//- LayerManager 
//-------------------------------------------//

function LayerManager(mapView){
   this.mapView = mapView;
}

//-------------------------------------------//
//Layer Types
function Layer(){}

Layer.Dynamical   = "Layer.Dynamical";
Layer.Heat        = "Layer.Heat";
Layer.Vectorial   = "Layer.Vectorial";
Layer.Raster      = "Layer.Raster";
Layer.Images      = "Layer.Images";
Layer.WMS         = "Layer.WMS";
Layer.SRTM        = "Layer.SRTM";
Layer.Shade       = "Layer.Shade";

//-------------------------------------------//

LayerManager.prototype.addLayer = function(layerType, params) {

   console.log("  adding layer " + layerType)
   var layer = null

   switch(layerType){

      // ------------------------------------------//

      case Layer.Dynamical :
         layer = new DynamicalLayer(params, this.defaultDynamicalComposition());
         break;

         // ------------------------------------------//
         
      case Layer.Heat :
          layer = new HeatmapLayer(params, this.defaultComposition());
          break;

          // ------------------------------------------//

      case Layer.Vectorial :
         break;

         // ------------------------------------------//

      case Layer.Raster :
         break;

         // ------------------------------------------//

      case Layer.Images :
      case Layer.WMS:
         layer = new ImageLayer(params, this.defaultComposition());
         break;

         // ------------------------------------------//

      case Layer.SRTM :
         break;

         // ------------------------------------------//

      case Layer.Shade :
         break;

   }

   for (var key in this.mapView.tiles) {
      this.mapView.tiles[key].createLayerPart(layer, this.mapView.layers.length)
   }  

   this.mapView.layers.push(layer)

   return layer
}

//=======================================================================================//
//Default settings

LayerManager.prototype.defaultDynamicalComposition = function() {
   return {
      shader : Maperial.AlphaBlend,
      params : { uParams : 1.0 }
   };
}

LayerManager.prototype.defaultComposition = function() {
   return {
      shader : Maperial.MulBlend,
      params : LayerManager.defaultMulBlendParams
   };
}

//-------------------------------------------//

LayerManager.defaultMulBlendParams = {
      uParams : [ 0.0, 0.0, 1 ]
}


LayerManager.defaultAlphaBlendParams = {
      uParams : 0.5
}

LayerManager.defaultAlphaClipParams = {
      uParams : 0.5
}


//-------------------------------------------//
//OLD MAPERIAL : using config
//-------------------------------------------//

//LayerManager.prototype.refreshMaperialForLayerAdded = function(layerConfig) {

//if(this.mapView.config.layers.length == 1){
//this.mapView.restart()      
//}
//else{
//console.log("------------ refreshMaperialForLayerAdded ", this.mapView.config.map.osmSets)
//sourceManager.addSource(this.mapView.id, layerConfig)
//this.mapView.mapRenderer.addLayer(layerConfig)
//this.mapView.hud.refresh()
//}

//}

//-------------------------------------------//

//LayerManager.prototype.deleteLayer = function(layerRemovedPosition) {

//var layerRemoved = this.mapView.config.layers.splice(layerRemovedPosition, 1)[0];

//for(i in this.mapView.config.map.osmSets){
//if(this.mapView.config.map.osmSets[i].layerPosition > layerRemovedPosition)
//this.mapView.config.map.osmSets[i].layerPosition--;
//}


//console.log("------------ deleteLayer ", this.mapView.config.map.osmSets)

////-----------------------//

//if(this.mapView.config.layers.length == 0){
//this.mapView.maperial.restart()
//}
//else{
//sourceManager.detachSource(this.mapView.id, layerRemoved.source.id)
//this.mapView.mapRenderer.removeLayer(layerRemovedPosition)
//this.mapView.hud.refresh()
//}

//}

////=======================================================================================//

////TODO
//LayerManager.prototype.changeRaster = function(layerIndex, rasterUID) {

//if(this.mapView.config.layers[layerIndex].type == Source.Raster
//&& this.mapView.config.layers[layerIndex].source.params.uid != rasterUID){

//this.mapView.config.layers[layerIndex].source.params.uid = rasterUID;
//this.mapView.config.layers[layerIndex].source.id         = rasterUID;
//this.mapView.restart();
//}
//}

////=======================================================================================//

//LayerManager.prototype.changeImages = function(layerIndex, imagesSrc) {

//if(this.mapView.config.layers[layerIndex].type == Source.Images
//&& this.mapView.config.layers[layerIndex].source.params.src != imagesSrc){

//sourceManager.detachSource(this.mapView.id, this.mapView.config.layers[layerIndex].source.id)

//this.mapView.config.layers[layerIndex].source.params.src = imagesSrc;
//this.mapView.config.layers[layerIndex].source.id         = imagesSrc;

//sourceManager.addSource(this.mapView.id, this.mapView.config.layers[layerIndex])
//this.mapView.mapRenderer.changeLayer(this.mapView.config.layers[layerIndex], layerIndex)
//this.mapView.hud.refresh()
//}

//console.log(sourceManager.sources)
//}

//LayerManager.prototype.switchImagesTo = function(imagesSrc) {

//for(var i = 0; i < this.mapView.config.layers.length; i++){
//if(this.mapView.config.layers[i].source.type == Source.Images){
//this.changeImages(i, imagesSrc);
//break;
//}
//}
//}

////=======================================================================================//

///**
//* exchangedIds contains a mapping between old layerIndexes and the new one, after a layer reposition
//* example, with 3 layers, after moving layer0 (ui bottom) to the top (becomes layer 2) : 
//* exchangedIds = {
//{0: 2},
//{2: 1},
//{1: 0}
//} 
//*/
//LayerManager.prototype.exchangeLayers = function(exchangedIds) {

//var newLayers = [];

//for(id in exchangedIds){
//newLayers[exchangedIds[id]] = this.mapView.config.layers[id];
//}

//for(i in this.mapView.config.map.osmSets){
//if(this.mapView.config.map.osmSets[i].layerPosition >= 0)
//this.mapView.config.map.osmSets[i].layerPosition = exchangedIds[this.mapView.config.map.osmSets[i].layerPosition];
//}

//this.mapView.config.layers = newLayers;

//this.mapView.mapRenderer.exchangeLayers(exchangedIds)
//this.mapView.hud.refresh()
//}


////=======================================================================================//

//LayerManager.prototype.changeComposition = function(l, shader) {

//var composition = this.mapView.config.layers[l].composition;

////-----------------------------------------------//
//// storing previous params

//if(!composition.storedparams)
//composition.storedparams = {}

//composition.storedparams[composition.shader] = composition.params

////-----------------------------------------------//

//composition.shader = shader;

//if(composition.storedparams && composition.storedparams[shader]){
//composition.params = composition.storedparams[shader]
//}
//else{
//composition.params = LayerManager.getDefaultParams(shader)
//}

//this.mapView.mapRenderer.resetLayer(l)  
//this.mapView.hud.refresh()
//}