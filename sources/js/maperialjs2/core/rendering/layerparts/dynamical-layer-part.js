
function DynamicalLayerPart ( layer, tile ) {
   
   this.layer     = layer;
   this.tile      = tile;
   this.x         = tile.x;
   this.y         = tile.y;
   this.z         = tile.z;

   this.version   = null;
   this.tex       = null;
   
   this.dynamicalRenderer = layer.dynamicalRenderer;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.DataReady = function(){

   if(this.dynamicalRenderer.version == this.version){
      return true;
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