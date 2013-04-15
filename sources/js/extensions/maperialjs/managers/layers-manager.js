//-------------------------------------------//
//- LayersManager 
//-------------------------------------------//

function LayersManager(maperial){
   this.maperial = maperial;
   this.firstOSMPosition = -1; // set in maperial.loadStyles
}

//-------------------------------------------//

LayersManager.Vector = "vector";
LayersManager.Raster = "raster";
LayersManager.Images = "images";

//-------------------------------------------//

LayersManager.prototype.addLayer = function(sourceType, params) {

   var layerConfig;
   switch(sourceType){
   case Source.MaperialOSM :
      layerConfig = LayersManager.getOSMLayerConfig();
      break;

   case Source.Raster :
      var rasterUID = params[0];
      layerConfig = LayersManager.getRasterLayerConfig(rasterUID);
      break;

   case Source.Vector :
      layerConfig = LayersManager.getVectorLayerConfig();
      break;

   case Source.Images :
      var src = params[0];
      layerConfig = LayersManager.getImagesLayerConfig(src);
      break;
   }

   this.maperial.config.layers.push(layerConfig);
   this.maperial.restart();

}

//-------------------------------------------//

LayersManager.prototype.deleteLayer = function(layerRemovedPosition) {
   var layerRemoved = this.maperial.config.layers.splice(layerRemovedPosition, 1)[0];

   for(i in this.maperial.config.map.osmSets){
      if(this.maperial.config.map.osmSets[i].layerPosition > layerRemovedPosition)
         this.maperial.config.map.osmSets[i].layerPosition--;
   }

   this.maperial.restart();
}

//=======================================================================================//

LayersManager.prototype.changeRaster = function(layerIndex, rasterUID) {

   if(this.maperial.config.layers[layerIndex].type == Source.Raster
         && this.maperial.config.layers[layerIndex].source.params.uid != rasterUID){

      this.maperial.config.layers[layerIndex].source.params.uid = rasterUID;
      this.maperial.restart();
   }
}

//=======================================================================================//

LayersManager.prototype.changeImages = function(layerIndex, imagesSrc) {

   if(this.maperial.config.layers[layerIndex].type == Source.Images
         && this.maperial.config.layers[layerIndex].source.params.src != imagesSrc){

      this.maperial.config.layers[layerIndex].source.params.src = imagesSrc;
      this.maperial.restart();
   }
}

LayersManager.prototype.switchImagesTo = function(imagesSrc) {

   for(var i = 0; i < this.maperial.config.layers.length; i++){
      if(this.maperial.config.layers[i].source.type == Source.Images){
         this.changeImages(i, imagesSrc);
         break;
      }
   }
}

//------------------------------------------------------------------//

LayersManager.prototype.useDefaultLayers = function() {

   if(this.maperial.config.map.layersCreation){
      console.log("  using no layer...");
   }
   else{
      console.log("  using default layers...");
      this.maperial.config.layers.push(LayersManager.getOSMLayerConfig());
   }
   
}

//=======================================================================================//

/**
 * exchangedIds contains a mapping between old layerIndexes and the new one, after a layer reposition
 * example, with 3 layers, after moving layer0 (ui bottom) to the top (becomes layer 2) : 
 * exchangedIds = {
     {0: 1},
     {1: 2},
     {2: 0}
   } 
 */
LayersManager.prototype.exchangeLayers = function(exchangedIds) {

   var newLayers = [];
   for(id in exchangedIds){
      newLayers.push(this.maperial.config.layers[exchangedIds[id]]);
   }

   for(i in this.maperial.config.map.osmSets)
      this.maperial.config.map.osmSets[i].layerPosition = exchangedIds[this.maperial.config.map.osmSets[i].layerPosition];

   this.maperial.config.layers = newLayers;
   this.maperial.restart();
}


//=======================================================================================//


LayersManager.prototype.detachSet = function(setIndex) {
   this.maperial.config.map.osmSets[setIndex].layerPosition = -1;
   this.maperial.restart();
}

LayersManager.prototype.attachSet = function(setIndex, layerPosition) {
   this.maperial.config.map.osmSets[setIndex].layerPosition = layerPosition;
   this.maperial.restart();
}


//=======================================================================================//

LayersManager.prototype.defaultOSMSets = function(style) {

   console.log("  building default OSM Sets for style '" + style.name + "'...");
   console.log("  firstOSMPosition : " + this.firstOSMPosition); 

   this.maperial.config.map.osmSets = {
         "0" : {
            label: "Roads", 
            subLayerIds:["02f", "030", "031", "032", "033", "034", "035", "036", "037", "038", "039", "03a", "03b", "03c","03d", "03e"], 
            layerPosition: -1
         },
         "1" : {
            label: "Floors", 
            subLayerIds:["001", "008", "011"],
            layerPosition: -1
         },
         "2" : {
            label: "Buildings", 
            subLayerIds:["050"],
            layerPosition: -1
         },
         "3" : {
            label: "Others", 
            subLayerIds:[],
            layerPosition: -1
         }
   };

   // ----------------------------------------------
   // building 'Others' subLayerIds

   for(subLayerId in style.content){

      var addInOthers = true;
      for(i in this.maperial.config.map.osmSets){
         if(i == "3")
            continue;

         if($.inArray(subLayerId, this.maperial.config.map.osmSets[i].subLayerIds) >= 0){
            addInOthers = false;
            break;
         }
      }

      if(addInOthers){
         this.maperial.config.map.osmSets["3"].subLayerIds.push(subLayerId); 
      }
   }

   // ----------------------------------------------
   // init osmSets

   for(i in this.maperial.config.map.osmSets){
      this.maperial.config.map.osmSets[i].layerPosition = this.firstOSMPosition;
   }
}

//=======================================================================================//

LayersManager.prototype.atLeastOneImageLayer = function() {

   for(var i = 0; i < this.maperial.config.layers.length; i++){
      if(this.maperial.config.layers[i].source.type == Source.Images)
         return true;
   }

   return false;
}

//=======================================================================================//

LayersManager.buildOSMVisibilities = function(osmSets) {

   console.log("building OSM visibilities...");

   var osmVisibilities = {};

   for(s in osmSets){
      for(var i=0;  i < osmSets[s].subLayerIds.length; i++){
         var subLayerId = osmSets[s].subLayerIds[i];
         osmVisibilities[subLayerId] = osmSets[s].layerPosition;
      }
   }

   return osmVisibilities;
}

//=======================================================================================//
// Default configs
//-------------------------------------------//

LayersManager.getOSMLayerConfig = function(styleUIDs) {

   var styles = (styleUIDs === undefined) ? [Maperial.DEFAULT_STYLE_UID] : styleUIDs; 
   
   return { 
      type: LayersManager.Vector, 
      source: {
         type: Source.MaperialOSM
      },
      params: {
         styles: styles,
         selectedStyle: 0
      },
      composition: {
         shader : Maperial.MulBlend,
         params : { uParams : [ -0.5, -0.5, 1.0 ]}
      }
   }
}

//-------------------------------------------//

LayersManager.getRasterLayerConfig = function(rasterUID, colorbarUIDs) {
   
   var colorbars = (colorbarUIDs === undefined) ? [Maperial.DEFAULT_COLORBAR_UID] : colorbarUIDs; 
   
   return { 
      type: LayersManager.Raster, 
      source: {
         type: Source.Raster,
         params: { uid : rasterUID }
      },
      params: {
         colorbars: colorbars,
         selectedColorbar : 0
      },
      composition: {
         shader : Maperial.MulBlend,
         params : { uParams : [ -0.5, -0.5, 1 ]}
      }
   }
}

//-------------------------------------------//

LayersManager.getVectorLayerConfig = function() {
   return { 
      type: LayersManager.Vector, 
      source: {
         type: Source.Vector
      },
      params: {

      },
      composition: {
         shader : Maperial.AlphaBlend
      }
   }
}

//-------------------------------------------//

/**
 * src : 
 *    Source.IMAGES_MAPQUEST
 *    Source.IMAGES_MAPQUEST_SATELLITE
 *    Source.IMAGES_OSM
 */
LayersManager.getImagesLayerConfig = function(src) {
   return { 
      type: LayersManager.Images, 
      source: {
         type: Source.Images,
         params: { src: src }
      },
      params: {

      },
      composition: {
         shader : Maperial.AlphaBlend
      }
   }
}
