
function ShadeLayer ( maperial , inZoom) {
   this.maperial = maperial;
   this.assets = maperial.context.assets;
   this.gl     = this.assets.ctx;
   
   this.tex    = null;
   this.data   = null;
   this.w      = 0;
   this.h      = 0;
   this.z      = inZoom;
}

ShadeLayer.prototype.GetType = function ( ) {
   return LayersManager.Shade;
}

ShadeLayer.prototype.Init = function ( data ) {
   if (this.tex)
      return;
   if (data) {
      var newV                   = []
      /*
      for (var y = 255 ; y >= 0 ; y-- ) {
         for (var x = 0 ; x < 256 ; x++ ) {
            newV.push(data[y + x * 256] & 255)
            newV.push((data[y + x * 256] >> 8) & 255)
            newV.push(0)
         }
      }
      var byteArray              = new Uint8Array        ( newV );
      */
      /*
      for (var y = 0 ; y <= 256 ; y++ ) {
         for (var x = 0 ; x < 256 ; x++ ) {
            newV.push(data [y * 256 + x ] & 255)
            newV.push((data[y * 256 + x ] >> 8) & 255)
            newV.push(0)
         }
      }
      var byteArray              = new Uint8Array        ( newV );
      */
      /*
      var byteArray              = new Uint8Array        ( data['s'] );
      this.w                     = 256;      
      this.h                     = 256; 
      this.data                  = byteArray;
      */
      var byteArray              = new Uint8Array        ( data );
      var nl = []
      for ( var i = 0 ; i < 256*256*2 ; i = i+2 ) {
         var a = ( byteArray[i] / 255.0 ) * 2.0 - 1.0;
         var b = ( byteArray[i+1] / 255.0 ) * 2.0 - 1.0;
         var tmp = - (a*a) - (b*b) + 1.0
         var c = Math.sqrt( tmp );
         
         var tt = (a*a) + (b*b) + (c*c);
         
         nl.push(  Math.ceil( ((a + 1.0)/2.0) * 255));
         nl.push(  Math.ceil( ((b + 1.0)/2.0) * 255));
         nl.push(  Math.ceil( ((c + 1.0)/2.0) * 255));
      }
      this.data = new Uint8Array  (nl)
      this.w                     = 256;      
      this.h                     = 256; 
   }
}

ShadeLayer.prototype.Reset = function (  ) {
   var gl = this.gl;
   if (this.tex) {
      gl.deleteTexture ( this.tex );
      delete this.tex;
      this.tex = null;
   }
}

ShadeLayer.prototype.Release = function (  ) {
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

ShadeLayer.prototype.IsUpToDate = function ( ) {
   return this.tex != null;
}

ShadeLayer.prototype.Update = function ( params ) {
   if (this.tex)
      return 0;

   var date    = (new Date)
   var startT  = date.getTime()
   
   var gl = this.gl;

   if ( this.data ) {
      var gltools                = new GLTools ()
      var fbtx                   = gltools.CreateFrameBufferTex(gl,this.w,this.h)
      var tmpTex                 = gl.createTexture (      );
      this.tex                   = fbtx[1];
      gl.bindTexture             (gl.TEXTURE_2D, tmpTex);      
      gl.pixelStorei             (gl.UNPACK_FLIP_Y_WEBGL  , false );
      gl.texImage2D              (gl.TEXTURE_2D, 0, gl.RGB, this.w , this.h, 0, gl.RGB, gl.UNSIGNED_BYTE, this.data)
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S    , gl.CLAMP_TO_EDGE);
      gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T    , gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer         ( gl.FRAMEBUFFER, fbtx[0] );
      this.gl.clearColor         ( 1.0, 1.0,1.0, 1.0  );
      this.gl.disable            ( this.gl.DEPTH_TEST  );
      gl.viewport                ( 0, 0, fbtx[0].width, fbtx[0].height);
      gl.clear                   ( gl.COLOR_BUFFER_BIT );

      mvMatrix                   = mat4.create();
      pMatrix                    = mat4.create();
      mat4.identity              ( mvMatrix );
      mat4.scale                 ( mvMatrix, [this.w  / Maperial.tileSize , this.h / Maperial.tileSize, 1.0] );
      mat4.identity              ( pMatrix );
      mat4.ortho                 ( 0, fbtx[0].width , 0, fbtx[0].height, 0, 1, pMatrix ); // Y swap !

      var prog                   = this.assets.prog[ "Shade" ]
      
      gl.useProgram              (prog);
      gl.uniformMatrix4fv        (prog.params.pMatrixUniform.name , false, pMatrix);
      gl.uniformMatrix4fv        (prog.params.mvMatrixUniform.name, false, mvMatrix);
      gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
      gl.enableVertexAttribArray (prog.attr.vertexPositionAttribute);
      gl.vertexAttribPointer     (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
                                 
      gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
      gl.enableVertexAttribArray (prog.attr.textureCoordAttribute);
      gl.vertexAttribPointer     (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
   
      gl.activeTexture           (gl.TEXTURE0);
      gl.bindTexture             (gl.TEXTURE_2D, tmpTex);
      gl.uniform1i               (prog.params.uSamplerTex1.name, 0);

      gl.uniform3fv              (prog.params.uLight.name   , [-params.uLight[0],-params.uLight[1],-params.uLight[2]]);
      gl.uniform1f               (prog.params.uScale.name   , params.scale);
      //gl.uniform3fv              (prog.params.uLight.name   , [0.0,0.0,-50.0] ); 
      //gl.uniform1f               (prog.params.uScale.name   , 1); 
      var r = this.maperial.context.coordS.Resolution ( this.z );
      gl.uniform1f               (prog.params.uPixRes.name  , r ); 
         
      gl.drawArrays              (gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

      gl.bindFramebuffer         ( gl.FRAMEBUFFER, null );
      gl.activeTexture           (gl.TEXTURE0);
      gl.bindTexture             (gl.TEXTURE_2D, null );
      
      gl.deleteTexture           (tmpTex);
      gl.deleteFramebuffer       (fbtx[0]);
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
   
   var diffT   = date.getTime() - startT;   
   return diffT
}