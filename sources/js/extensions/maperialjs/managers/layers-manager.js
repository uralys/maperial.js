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
LayersManager.Shade  = "shade";
LayersManager.SRTM   = "SRTM";

//-------------------------------------------//

LayersManager.prototype.addLayer = function(sourceType, params) {

   var layerConfig;
   switch(sourceType){

      // ------------------------------------------//
      // Sources for LayersManager.Vector

      case Source.MaperialOSM :
         if(params != undefined && params != null )
            layerConfig = LayersManager.getOSMLayerConfig([params]);
         else
            layerConfig = LayersManager.getOSMLayerConfig();
         break;

      case Source.Vector :
         layerConfig = LayersManager.getVectorLayerConfig();
         break;

      // ------------------------------------------//
      // Sources for LayersManager.Raster

      case Source.Raster :
         var rasterUID = params[0];
         layerConfig = LayersManager.getRasterLayerConfig(rasterUID);
         break;

      // ------------------------------------------//
      // Sources for LayersManager.Images

      case Source.Images :
      case Source.WMS:
         var src = params[0];
         layerConfig = LayersManager.getImagesLayerConfig(sourceType, src);
         break;

      // ------------------------------------------//
      // Sources for LayersManager.SRTM

      case LayersManager.SRTM :
         layerConfig = LayersManager.getSrtmLayerConfig();
         break;

      // ------------------------------------------//
      // Sources for LayersManager.Shade

      case LayersManager.Shade :
         layerConfig = LayersManager.getShadeLayerConfig();
         break;

   }
   
   //-----------------------//

   // la config est modifiee ici plutot que dans le refresh
   // ainsi a la fin de cet appel, la config est prete dans tous les cas, meme Source.MaperialOSM
   // et donc mapCreationController va pouvoir faire son refresh de panel a partir de la config sans pb.
   this.maperial.config.layers.push(layerConfig);
   
   //-----------------------//
   
   var me = this
   var refresh = function() { return me.refreshMaperialForLayerAdded(layerConfig) }
   
   if(sourceType == Source.MaperialOSM)
      this.maperial.stylesManager.fetchStyles([layerConfig.params.styles[layerConfig.params.selectedStyle]], refresh)
   else
      this.refreshMaperialForLayerAdded(layerConfig)
   
}

LayersManager.prototype.refreshMaperialForLayerAdded = function(layerConfig) {
   if(this.maperial.config.layers.length == 1){
      this.maperial.restart()      
   }
   else{
      this.maperial.sourcesManager.addSource(layerConfig)
      this.maperial.mapRenderer.addLayer(layerConfig)
      this.maperial.hud.refresh()
   }
}

//-------------------------------------------//

LayersManager.prototype.deleteLayer = function(layerRemovedPosition) {
   var layerRemoved = this.maperial.config.layers.splice(layerRemovedPosition, 1)[0];

   for(i in this.maperial.config.map.osmSets){
      if(this.maperial.config.map.osmSets[i].layerPosition > layerRemovedPosition)
         this.maperial.config.map.osmSets[i].layerPosition--;
   }

   //-----------------------//
   
   if(this.maperial.config.layers.length == 0){
      this.maperial.mapRenderer.Stop()
      this.maperial.mapRenderer.reset()
   }
   
   this.maperial.sourcesManager.removeSource(layerRemoved)
   this.maperial.mapRenderer.removeLayer(layerRemovedPosition)
   this.maperial.hud.refresh()
   
}

//=======================================================================================//

LayersManager.prototype.changeRaster = function(layerIndex, rasterUID) {

   if(this.maperial.config.layers[layerIndex].type == Source.Raster
         && this.maperial.config.layers[layerIndex].source.params.uid != rasterUID){

      this.maperial.config.layers[layerIndex].source.params.uid = rasterUID;
      this.maperial.config.layers[layerIndex].source.id         = rasterUID;
      this.maperial.restart();
   }
}

//=======================================================================================//

LayersManager.prototype.changeImages = function(layerIndex, imagesSrc) {

   if(this.maperial.config.layers[layerIndex].type == Source.Images
         && this.maperial.config.layers[layerIndex].source.params.src != imagesSrc){

      this.maperial.config.layers[layerIndex].source.params.src = imagesSrc;
      this.maperial.config.layers[layerIndex].source.id         = imagesSrc;
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

   this.maperial.mapRenderer.exchangeLayers(exchangedIds)
   this.maperial.hud.refresh()
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

LayersManager.prototype.changeComposition = function(l, shader) {

   var composition = this.maperial.config.layers[l].composition;

   //-----------------------------------------------//
   // storing previous params

   if(!composition.storedparams)
      composition.storedparams = {}

   composition.storedparams[composition.shader] = composition.params

   //-----------------------------------------------//

   composition.shader = shader;

   if(composition.storedparams && composition.storedparams[shader])
      composition.params = composition.storedparams[shader]
   else{
      switch(shader){

         case Maperial.AlphaClip : 
            composition.params = LayersManager.defaultAlphaClipParams
            break;

         case Maperial.AlphaBlend : 
            composition.params = LayersManager.defaultAlphaBlendParams
            break;

         case Maperial.MulBlend : 
            composition.params = LayersManager.defaultMulBlendParams
            break;
      }
   }

   console.log("setting uParams : " + composition.params.uParams)

   this.maperial.restart();   
}

//=======================================================================================//
//Default configs
//-------------------------------------------//

LayersManager.getOSMLayerConfig = function(styleUIDs) {

   var styles = (styleUIDs === undefined) ? [Maperial.DEFAULT_STYLE_UID] : styleUIDs; 

   return { 
      type: LayersManager.Vector, 
      source: {
         type  : Source.MaperialOSM,
         id    : styles[0]
      },
      params: {
         styles : styles,
         selectedStyle: 0
      },
      composition: {
         shader : Maperial.MulBlend,
         params : LayersManager.defaultMulBlendParams
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
         shader : Maperial.AlphaBlend,
         params : LayersManager.defaultAlphaBlendParams
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
         params : LayersManager.defaultMulBlendParams
      }
   }
}

//-------------------------------------------//

/**
 * sourceType
 *    Source.IMAGES
 *    Source.WMS
 */
LayersManager.getImagesLayerConfig = function(sourceType, src) {

   return { 
      type: LayersManager.Images, 
      source: {
         type     : sourceType,
         params   : { src: src },
         id       : src
      },
      params: {

      },
      composition: {
         shader : Maperial.AlphaBlend,
         params : LayersManager.defaultAlphaBlendParams
      }
   }
}

//-------------------------------------------//

LayersManager.getShadeLayerConfig = function() {
   return { 
      type: LayersManager.Shade, 
      source: {
         type     : Source.SRTM,
         id       : Source.SRTM,
         params   : {  }
      },
      params: {
         uLight   : [ 0, 0, 50 ], 
         scale    : 50
      },
      composition: {
         shader : Maperial.MulBlend,
         params : LayersManager.defaultMulBlendParams
      }
   }
}

//-------------------------------------------//

LayersManager.getSrtmLayerConfig = function(colorbarUIDs) {
   
   var colorbars = (colorbarUIDs === undefined) ? [Maperial.DEFAULT_COLORBAR_UID] : colorbarUIDs; 
   
   return { 
      type: LayersManager.SRTM, 
      source: {
         type     : Source.SRTM,
         id       : Source.SRTM,
         params   : {  }
      },
      params: {
         colorbars: colorbars,
         selectedColorbar : 0
      },
      composition: {
         shader : Maperial.MulBlend,
         params : LayersManager.defaultMulBlendParams
      }
   }
}

//-------------------------------------------//

LayersManager.getDefaultParams = function(shader) {
   switch(shader){
      case Maperial.AlphaClip : 
         return LayersManager.defaultAlphaClipParams

      case Maperial.AlphaBlend : 
         return LayersManager.defaultAlphaBlendParams

      case Maperial.MulBlend : 
         return LayersManager.defaultMulBlendParams
   }
}

//-------------------------------------------//

LayersManager.defaultMulBlendParams = {
      uParams : [ 0.0, 0.0, 1 ]
}


LayersManager.defaultAlphaBlendParams = {
      uParams : 0.5
}

LayersManager.defaultAlphaClipParams = {
      uParams : 0.5
}