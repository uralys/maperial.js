
function DynamicalLayerPart ( layer, tile ) {
   
   this.layer     = layer;
   this.tile      = tile;
   this.x         = tile.x;
   this.y         = tile.y;
   this.z         = tile.z;

   this.tex       = null;
//   this.data      = new ImageData(layer.sourceId, tile.x, tile.y, tile.z);
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.DataReady = function(){

   return false
   
   if(this.data.content){
      return true
   }
   else{
      this.data.tryToFillContent()

      if(this.data.content){
         this.prepare()
         return true
      }
   }

   return false;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.GetType = function ( ) {
   return this.layer.type;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.prepare = function () {

}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.Reset = function (  ) {
   this.tex = null;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.Release = function (  ) {
   this.tex = null;
}

DynamicalLayerPart.prototype.IsUpToDate = function ( ) {
   return this.tex != null;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.Update = function ( params, layerPosition ) {
   if (this.tex == null ) {   
      if ( ! this.data.IsUpToDate() ) {
         return this.data.Update(params);
      }
      else {
         this.tex = this.data.GetTex(this.x,this.y)
      }
   }
   return 0;
}