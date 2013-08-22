
function CustomLayer ( mapView, x , y , inZoom ) {
   this.tex       = null;
   this.data      = null;
   this.z         = inZoom;
   this.x         = x;
   this.y         = y;
}

CustomLayer.prototype.GetType = function ( ) {
   return LayersManager.Custom;
}

CustomLayer.prototype.Init = function ( data ) {
   if (this.tex)
      return;
   this.data   = data;
}

CustomLayer.prototype.Reset = function (  ) {
   this.tex = null;
}

CustomLayer.prototype.Release = function (  ) {
   this.tex = null;
}

CustomLayer.prototype.IsUpToDate = function ( ) {
   return this.tex != null;
}

CustomLayer.prototype.Update = function ( params, layerPosition ) {
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