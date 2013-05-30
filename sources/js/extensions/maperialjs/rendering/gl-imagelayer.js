
function ImageLayer (gl, inZoom) {
   this.gl     = gl;
   
   this.tex    = null;
   this.data   = null;
   this.w      = 0;
   this.h      = 0;
   this.z      = inZoom;
}

ImageLayer.prototype.GetType = function ( ) {
   return LayersManager.Raster;
}

ImageLayer.prototype.Init = function ( data ) {
   if (this.tex)
      return;
   if (data) {
      this.w      = data.width;      
      this.h      = data.height; 
      this.data   = data;
   }
}

ImageLayer.prototype.Reset = function (  ) {
   var gl = this.gl;
   if (this.tex) {
      gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
}

ImageLayer.prototype.Release = function (  ) {
   var gl = this.gl;
   if (this.tex) {
      gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
   if (this.data) {
      delete this.data;
      this.data = null;
   }
}

ImageLayer.prototype.IsUpToDate = function ( ) {
   return this.tex != null;
}

ImageLayer.prototype.Update = function () {
   if (this.tex)
      return 1;

   var gl = this.gl;
   
   if (this.data != null && this.data.width > 0) {
      this.tex             = gl.createTexture();
      gl.bindTexture       ( gl.TEXTURE_2D           , this.tex     );
      gl.pixelStorei       ( gl.UNPACK_FLIP_Y_WEBGL  , false        );
      gl.texImage2D        ( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.data);
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
      gl.bindTexture       ( gl.TEXTURE_2D           , null         );
      }
   else { // create fake
      this.tex             = gl.createTexture();
      gl.bindTexture       ( gl.TEXTURE_2D           , this.tex     );
      gl.pixelStorei       ( gl.UNPACK_FLIP_Y_WEBGL  , false        );
      var byteArray        = new Uint8Array        ( [1,1,1,0 , 1,1,1,0 , 1,1,1,0 , 1,1,1,0] );
      gl.texImage2D        ( gl.TEXTURE_2D           , 0                           , gl.RGBA, 2 , 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray)
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
      gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
      gl.bindTexture       ( gl.TEXTURE_2D           , null         );
      this.w = 2;
      this.h = 2;
   }
   
   // Time it and return !!!
   return 2
}