//----------------------------------------------------------------------------------------------------------------------//

function Tile (mapView, x, y, z) {

   this.mapView      = mapView;

   this.x            = x;
   this.y            = y;
   this.z            = z;

   this.layerParts   = [];

   // preparing double buffering to render as texture !
   this.frameBufferL = [];
   this.texL         = [];
   this.tex          = null;
   this.nbErrors     = 0;
   
   this.buildLayerParts();
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.buildLayerParts = function () {
   for(var i = 0; i< this.mapView.layers.length; i++){
      this.createLayerPart(this.mapView.layers[i], i)
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.createLayerPart = function (layer, index) {
   
   console.log("createLayerPart " + layer.type +" at position " + index)
   
   switch(layer.type){
      
      case Layer.Images:
         this.layerParts.splice(index, 0, new ImageLayerPart     ( layer, this, this.mapView.context.assets.ctx , this.z));
         break;

      case Layer.Vector:
         this.layerParts.splice(index, 0, new VectorialLayerPart ( layer, this.mapView , this.z));
         break;
         
      case Layer.Raster:
         this.layerParts.splice(index, 0, new RasterLayer8    ( layer, this.mapView , this.z));
         break;
         
      case Layer.SRTM:
         this.layerParts.splice(index, 0, new RasterLayer16    ( layer, this.mapView , this.z));
         break;
         
      case Layer.Shade:
         this.layerParts.splice(index, 0, new ShadeLayerPart    ( layer, this.mapView , this.z));
         break;
         
      case Layer.Heat:
      case Layer.Dynamical:
         this.layerParts.splice(index, 0, new CustomLayerPart    ( layer, this.mapView , this.x, this.y , this.z));
         break;
   }
}

//----------------------------------------------------------------------------------------------------------------------//
// PUBLIC
//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.addLayer = function (layerConfig) {
   this.createLayerFromConfig(layerConfig, this.config.layers.length - 1)
   sourceManager.loadSources(this.x, this.y, this.z, this.mapView.id)
   this.Refresh()
}

Tile.prototype.changeLayer = function (layerConfig, index) {
   this.removeLayer(index)
   this.createLayerFromConfig(layerConfig, index)
   sourceManager.loadSources(this.x, this.y, this.z, this.mapView.id)
   this.Refresh()
}

Tile.prototype.removeLayer = function (position) {
   if(this.layerParts.length > 0){
      this.layerParts[position].Release()
      this.layerParts.splice(position, 1)
      this.Refresh()
   }
   //  else : all layers are released because no layer remains
}

/**
 * Exactly the same as Layer.exchangeLayers
 * exchangedIds contains a mapping between old layerIndexes and the new one, after a layer reposition
 * example, with 3 layers, after moving layer0 (ui bottom) to the top (becomes layer 2) : 
 * exchangedIds = {
     {0: 1},
     {1: 2},
     {2: 0}
   } 
 */
Tile.prototype.exchangeLayers = function(exchangedIds) {

   var newLayers = [];
   for(id in exchangedIds){
      newLayers.push(this.layerParts[exchangedIds[id]]);
   }

   this.layerParts = newLayers;
   this.Refresh();
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Release = function() {
   
   sourceManager.release(this.x, this.y, this.z, this.mapView.id);
   
   for(var i = 0; i < this.config.layers.length; i++){
      try{
         this.layerParts[i].Release();
      }
      catch(e){
         console.log("------------> tile.Release")
         console.log(e, this.layerParts[i])
      } 
   }
   
   var gl = this.gl;
   for ( var i = 0 ; i < 2 ; i = i + 1 ) {
      gl.deleteFramebuffer ( this.frameBufferL[i] );
      gl.deleteTexture     ( this.texL[i] );
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Refresh = function () {
   this.tex = null;
}

Tile.prototype.IsUpToDate = function ( ) {
   var upToDate = this.tex != null || this.layerParts.length == 0
   return upToDate;
}


Tile.prototype.IsLoaded = function () {
   var loaded = true

   for (var i = 0; i < this.layerParts.length; i++) {
      loaded = this.layerParts[i].checkDataContent()
   }

   return loaded
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.ReleaseLayer = function (id) {

   if(this.layerParts[id]){
      this.layerParts[id].Release();
      this.layerParts[id].Reset();
   }

   this.Refresh();
}

Tile.prototype.ResetLayer = function (id) {

   if(this.layerParts[id])
      this.layerParts[id].Reset();
   
   this.Refresh();
}

Tile.prototype.Reset = function (onlyFuse) {
   
   onlyFuse = (typeof(onlyFuse)==='undefined')?false:onlyFuse;
   
   if (!onlyFuse) {
      for (var i = 0; i < this.layerParts.length; i++) {      
         this.layerParts[i].Reset();
      }
   }

   this.Refresh();
}

//----------------------------------------------------------------------------------------------------------------------//

// TODO v2 : A mettre dans chaque layerpart.prepare

//Tile.prototype.sourceReady = function ( source, data , li) { /* li is for customRenderer => HEAT/Vector can use the same source (same source gid)!!!*/
//  
//   if(!data){
//      console.log("-------> tile.sourceReady : DATA NULL !")
//      this.Release();
//      this.Reset();
//      return
//   }
//   if  ( (typeof(li) ==='undefined') || li < 0 || li >= this.config.layers.length) {
//      for(var i = 0; i< this.config.layers.length; i++){
//         
//         if(this.config.layers[i].source.id != source.id )
//            continue;
//
//         try{
//            this.layerParts[i].Init( data )
//         }
//         catch(e){
//            console.log("-------> ERROR")
//         }
//      }   
//   }
//   else {
//      if ( this.config.layers[li].source.id == source.id )
//         this.layerParts[li].Init( data )
//   }
//}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.RenderVectorialLayers = function ( context, wx, wy ) {
   for (var i = 0; i < this.layerParts.length; i++) {
      if (this.layerParts[i].GetType() == Layer.Vector && this.layerParts[i].IsUpToDate() && this.layerParts[i].cnv) {
         context.drawImage(this.layerParts[i].cnv, wx, wy);
      }
   }
}

