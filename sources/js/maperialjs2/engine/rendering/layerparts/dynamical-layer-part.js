
function DynamicalLayerPart ( mapView, x , y , inZoom ) {
   this.tex       = null;
   this.data      = null;
   this.z         = inZoom;
   this.x         = x;
   this.y         = y;
}

DynamicalLayerPart.prototype.GetType = function ( ) {
   return LayerManager.Custom;
}

DynamicalLayerPart.prototype.Init = function ( data ) {
   if (this.tex)
      return;
   this.data   = data;
}

DynamicalLayerPart.prototype.Reset = function (  ) {
   this.tex = null;
}

DynamicalLayerPart.prototype.Release = function (  ) {
   this.tex = null;
}

DynamicalLayerPart.prototype.IsUpToDate = function ( ) {
   return this.tex != null;
}

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