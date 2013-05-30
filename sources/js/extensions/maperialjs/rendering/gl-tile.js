
function Tile (maperial, x, y, z) {

   //--------------------------------//

   this.maperial = maperial;
   this.config = maperial.config;

   this.x         = x;
   this.y         = y;
   this.z         = z;
   
   this.layers    = {};

   this.assets       = maperial.context.assets;
   this.gl           = this.assets.ctx;

   // preparing double buffering to render as texture !
   this.frameBufferL = [];
   this.texL         = [];
   this.tex          = null;

   //--------------------------------//

   this.nbErrors     = 0;

   //--------------------------------//

   this.Init();
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Init = function () {
   this.nbErrors = 0;
   this.initLayers();
   this.maperial.sourcesManager.loadSources(this.x, this.y, this.z);
   this.prepareBuffering();
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.initLayers = function () {

   for(var i = 0; i< this.config.layers.length; i++){

      switch(this.config.layers[i].type){
   
         case LayersManager.Vector:
            this.layers[i] = new VectorialLayer ( this.maperial , this.z);
            break;
   
         case LayersManager.Raster:
            this.layers[i] = new RasterLayer    ( this.maperial , this.z);
            break;
   
         case LayersManager.Images:
            this.layers[i] = new ImageLayer     ( this.maperial.context.assets.ctx , this.z);
            break;
            
         case LayersManager.Shade:
            this.layers[i] = new ShadeLayer    ( this.maperial , this.z);
            break;
      }
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.prepareBuffering = function () {
   var gltools = new GLTools ()
   for ( var i = 0 ; i < 2 ; i = i + 1 ) {
      var fbtx = gltools.CreateFrameBufferTex(this.gl, Maperial.tileSize, Maperial.tileSize);
      this.frameBufferL.push        ( fbtx[0] );
      this.texL.push                ( fbtx[1] );
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Release = function() {

   this.maperial.sourcesManager.release(this.x, this.y, this.z);
   
   for(var i = 0; i < this.config.layers.length; i++)
      this.layers[i].Release();
   
   var gl = this.gl;
   for ( var i = 0 ; i < 2 ; i = i + 1 ) {
      gl.deleteFramebuffer ( this.frameBufferL[i] );
      gl.deleteTexture     ( this.texL[i] );
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Reset = function ( id ) {
   if(this.IsLoaded()) {
      if( typeof(id)==='undefined' || id < 0 || id >= this.layers.length) {
         for (i in this.layers) {      
            this.layers[i].Reset ( );
         }
      }
      else {
         this.layers[id].Reset ( );
      }
      this.tex = null;
   }
}

Tile.prototype.IsUpToDate = function ( ) {
   return this.tex;
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.appendDataToLayers = function ( sourceType, data ) {
   
   if(!data){
      this.nbErrors ++;
   }
   
   for(var i = 0; i< this.config.layers.length; i++){
      try{
         if ( this.config.layers[i].source.type == sourceType )
            this.layers[i].Init( data );
      }
      catch(e){
         console.log("-------> ERROR")
      }
   }   
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.RenderVectorialLayers = function ( context, wx, wy ) {
   for (i in this.layers) {
      if (this.layers[i].GetType() == LayersManager.Vector && this.layers[i].IsUpToDate() && this.layers[i].cnv) {
         context.drawImage(this.layers[i].cnv, wx, wy);
      }
   }
}

//----------------------------------------------------------------------------------------------------------------------//

/*
 *  render the tile inside an invisibleCanvas with the layerId colors
 */
Tile.prototype.FindSubLayerId = function ( tileClickCoord, zoom, styleContent ) {

   // create an invisibleCanvas to render the pixel for every layers
   var canvas = document.getElementById("fakeCanvas");
   var ctx = canvas.getContext("2d");
   ExtendCanvasContext ( ctx );
   canvas.height = 1;
   canvas.width = 1;

   ctx.translate(-tileClickCoord.x, -tileClickCoord.y);

   for(var i = this.config.layers.length -1 ; i>=0 ; --i){

      // a ameliorer pour pouvoir PICK sur une source CUSTOM
      if(this.config.layers[i].source.type != Source.MaperialOSM)
         continue;

      var data = this.maperial.sourcesManager.getData(this.config.layers[i].source, this.x, this.y, this.z);
      var subLayerId = TileRenderer.FindSubLayerId(tileClickCoord , ctx , data , zoom, styleContent, i, this.maperial.context.osmVisibilities );

      if(subLayerId)
         return [i, subLayerId];
   }

}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Update = function ( maxTime ) {

   if (this.IsUpToDate() || !this.IsLoaded() )
      return maxTime - 1 ;

   var timeRemaining = maxTime;

   for(var i = 0; i< this.config.layers.length; i++){
      if (! this.layers[i].IsUpToDate ( ) ) {
         timeRemaining -= this.layers[i].Update( this.config.layers[i].params, i );
         if ( timeRemaining <= 0 )
            break;
      }
   }

   var ready = true;
   for (var i in this.layers) {
      if (! this.layers[i].IsUpToDate ( ) )
         ready = false;
   }

   // Get elapsed time !!
   if ( ready )
      this.Compose();

   return timeRemaining; 
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Fuse = function ( backTex,frontTex,destFB, prog, params ) {

   var gl                           = this.gl;
   gl.bindFramebuffer               ( gl.FRAMEBUFFER, destFB );

   this.gl.clearColor               ( 1.0, 1.0, 1.0, 1.0  );
   this.gl.disable                  ( this.gl.DEPTH_TEST  );
   gl.viewport                      ( 0, 0, destFB.width, destFB.height);
   gl.clear                         ( gl.COLOR_BUFFER_BIT );

   var mvMatrix                     = mat4.create();
   var pMatrix                      = mat4.create();
   mat4.identity                    ( pMatrix );
   mat4.identity                    ( mvMatrix );
   mat4.ortho                       ( 0, destFB.width , 0, destFB.height, 0, 1, pMatrix ); // Y swap !

   
   this.gl.useProgram               (prog);
   this.gl.uniformMatrix4fv         (prog.params.pMatrixUniform.name , false, pMatrix);
   this.gl.uniformMatrix4fv         (prog.params.mvMatrixUniform.name, false, mvMatrix);
   this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
   this.gl.enableVertexAttribArray  (prog.attr.vertexPositionAttribute);
   this.gl.vertexAttribPointer      (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

   this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
   this.gl.enableVertexAttribArray  (prog.attr.textureCoordAttribute);
   this.gl.vertexAttribPointer      (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);


   this.gl.activeTexture            (this.gl.TEXTURE0);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, backTex );
   this.gl.uniform1i                (prog.params.uSamplerTex1.name, 0);

   this.gl.activeTexture            (this.gl.TEXTURE1);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, frontTex );
   this.gl.uniform1i                (prog.params.uSamplerTex2.name, 1);

   for (var p in params) {
      // WRONG !!!!! always  uniform3fv ???
      //this.gl.uniform3fv             (prog.params[p] , params[p] ); 
      this.gl[prog.params[p].fct] (prog.params[p].name, params[p] ); 
   }

   this.gl.drawArrays               (this.gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

   this.gl.bindFramebuffer          (this.gl.FRAMEBUFFER, null );
   this.gl.activeTexture            (this.gl.TEXTURE0);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, null );
   this.gl.activeTexture            (this.gl.TEXTURE1);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, null );
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Copy = function ( backTex , destFB ) {
   var gl                           = this.gl;

   gl.bindFramebuffer               ( gl.FRAMEBUFFER, destFB );

   this.gl.clearColor               ( 1.0, 1.0, 1.0, 1.0  );
   this.gl.disable                  ( this.gl.DEPTH_TEST  );
   gl.viewport                      ( 0, 0, destFB.width, destFB.height);
   gl.clear                         ( gl.COLOR_BUFFER_BIT );

   var mvMatrix                     = mat4.create();
   var pMatrix                      = mat4.create();
   mat4.identity                    ( pMatrix );
   mat4.identity                    ( mvMatrix );
   mat4.ortho                       ( 0, destFB.width , 0, destFB.height, 0, 1, pMatrix ); // Y swap !

   var prog = this.assets.prog["Tex"];

   this.gl.useProgram               (prog);
   this.gl.uniformMatrix4fv         (prog.params.pMatrixUniform.name, false, pMatrix);
   this.gl.uniformMatrix4fv         (prog.params.mvMatrixUniform.name, false, mvMatrix);
   this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
   this.gl.enableVertexAttribArray  (prog.attr.vertexPositionAttribute);
   this.gl.vertexAttribPointer      (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

   this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
   this.gl.enableVertexAttribArray  (prog.attr.textureCoordAttribute);
   this.gl.vertexAttribPointer      (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

   this.gl.activeTexture            (this.gl.TEXTURE0);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, backTex );
   this.gl.uniform1i                (prog.params.uSamplerTex1.name, 0);
   this.gl.drawArrays               (this.gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

   gl.bindFramebuffer               ( gl.FRAMEBUFFER, null );
   this.gl.activeTexture            (this.gl.TEXTURE0);
   this.gl.bindTexture              (this.gl.TEXTURE_2D, null );
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Compose = function (  ) {

   var backTex = this.layers[0].tex
   var destFb  = this.frameBufferL[ 0 ]
   var tmpI    = 0;

   if ( this.config.layers.length > 1 ) {

      for( var i = 1 ; i < this.config.layers.length ; i++ ) {
         var frontTex   = this.layers[i].tex;
         if (frontTex) {
            var prog       = this.assets.prog[ this.config.layers[i].composition.shader ]
            var params     = this.config.layers[i].composition.params;

            this.Fuse      ( backTex,frontTex,destFb, prog , params);
         }
         else {
            this.Copy (backTex,destFb);
         }
         backTex        = this.texL[tmpI];
         this.tex       = backTex;

         tmpI           = ( tmpI + 1 ) % 2;
         destFb         = this.frameBufferL[ tmpI ];
      }
   }
   else {
      this.Copy (backTex,destFb);
      this.tex = this.texL[0];
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.IsLoaded = function () {
   return this.maperial.sourcesManager.isTileLoaded(this.x, this.y, this.z);
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Render = function (pMatrix, mvMatrix) {

   if ( this.IsUpToDate() ) {
      var prog                         = this.assets.prog["Tex"];
      this.gl.useProgram               (prog);
      this.gl.uniformMatrix4fv         (prog.params.pMatrixUniform.name, false, pMatrix);
      this.gl.uniformMatrix4fv         (prog.params.mvMatrixUniform.name, false, mvMatrix);
      this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
      this.gl.enableVertexAttribArray  (prog.attr.vertexPositionAttribute);
      this.gl.vertexAttribPointer      (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer               (this.gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
      this.gl.enableVertexAttribArray  (prog.attr.textureCoordAttribute);
      this.gl.vertexAttribPointer      (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.activeTexture            (this.gl.TEXTURE0);
      this.gl.bindTexture              (this.gl.TEXTURE_2D, this.tex );

      var err = this.gl.getError();
      if ( err != 0 )
         console.log ( err );

      this.gl.uniform1i                (prog.params.uSamplerTex1.name, 0);
      this.gl.drawArrays               (this.gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

      this.gl.activeTexture            (this.gl.TEXTURE0);
      this.gl.bindTexture              (this.gl.TEXTURE_2D, null );

      var err = this.gl.getError();
      if ( err != 0 )
         console.log ( err );
   }
}
