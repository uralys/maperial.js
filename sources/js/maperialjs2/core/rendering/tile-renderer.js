//----------------------------------------------------------------------//

function TileRenderer(mapView) {
   this.mapView   = mapView 
   this.assets    = mapView.context.assets;
   this.gl        = mapView.context.assets.ctx
}

//----------------------------------------------------------------------------------------------------------------------//

TileRenderer.prototype.createTile = function (x,y,z) {

   var tile = new Tile (this.mapView, x,y,z);
   this.prepareBuffering(tile);

   return tile
}

//----------------------------------------------------------------------------------------------------------------------//

TileRenderer.prototype.prepareBuffering = function (tile) {
   var gltools = new GLTools ()
   for ( var i = 0 ; i < 2 ; i = i + 1 ) {
      var fbtx = gltools.CreateFrameBufferTex(this.gl, Maperial.tileSize, Maperial.tileSize);
      tile.frameBufferL.push        ( fbtx[0] );
      tile.texL.push                ( fbtx[1] );
   }
}

//----------------------------------------------------------------------------------------------------------------------//

TileRenderer.prototype.Update = function ( tile, maxTime ) {

   if (tile.IsUpToDate() || !tile.IsLoaded() )
      return maxTime - 1 ;
   
   console.log("updating tile ", tile.x, tile.y, tile.z)

   var date    = (new Date)
   var startT  = date.getTime()
   var diffT   = 0
   //var timeRemaining = maxTime;

   for(var i = 0; i< tile.layerParts.length; i++){
      if (! tile.layerParts[i].IsUpToDate ( ) ) {
         /*timeRemaining -= tile.layerParts[i].Update( tile.layerParts[i].params, i );
         if ( timeRemaining <= 0 )
            break;
          */

         tile.layerParts[i].Update( tile.layerParts[i].params, i );
         diffT   = date.getTime() - startT;
         if ( maxTime - diffT <= 0 )
            break;
      }
   }

   if ( maxTime - diffT > 0 ) {
      var ready = true;
      for (var i = 0; i < tile.layerParts.length; i++) {
         if (! tile.layerParts[i].IsUpToDate ( ) )
            ready = false;
      }

      // Get elapsed time !!
      if ( ready ) {
         this.Compose(tile);
         diffT   = date.getTime() - startT;
      }
   }
   return maxTime - diffT; 
}

//----------------------------------------------------------------------------------------------------------------------//

TileRenderer.prototype.Fuse = function ( tile, backTex,frontTex,destFB, prog, params ) {

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

TileRenderer.prototype.Copy = function ( tile, backTex , destFB ) {

   console.log("copying tile ", tile.x, tile.y, tile.z)
   
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

TileRenderer.prototype.Compose = function ( tile ) {

   console.log("composing tile ", tile.x, tile.y, tile.z)

   var backTex = tile.layerParts[0].tex
   var destFb  = tile.frameBufferL[ 0 ]
   var tmpI    = 0;

   if ( tile.layerParts.length > 1 ) {

      for( var i = 1 ; i < tile.layerParts.length ; i++ ) {
         var frontTex   = tile.layerParts[i].tex;
         if (frontTex) {
            var prog       = this.assets.prog[ tile.layerParts[i].composition.shader ]
            var params     = tile.layerParts[i].composition.params;

            this.Fuse      ( tile, backTex,frontTex,destFb, prog , params);
         }
         else {
            this.Copy (tile, backTex, destFb);
         }
         backTex        = tile.texL[tmpI];
         tile.tex       = backTex;

         tmpI           = ( tmpI + 1 ) % 2;
         destFb         = tile.frameBufferL[ tmpI ];
      }
   }
   else {
      this.Copy (tile, backTex, destFb);
      tile.tex = tile.texL[0];
   }
}


//----------------------------------------------------------------------------------------------------------------------//

TileRenderer.prototype.Render = function (tile, pMatrix, mvMatrix) {

   if ( tile.IsUpToDate() ) {
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

//----------------------------------------------------------------------//

TileRenderer.prototype.UpdateTiles = function ( txB , txE , tyB , tyE, forceTileRedraw ) {

   var keyList = [];
   var zoom = this.mapView.context.zoom;

   for ( tx = txB ; tx <= txE ; tx++) {
      for ( ty = tyB ; ty <= tyE ; ty++) {
         var key = tx + "," + ty + "," + zoom;
         keyList.push(key)

         if ( this.mapView.tiles[key] == null ) {
            this.mapView.tiles[key] = this.createTile(tx, ty, zoom);
         }
      }
   }

   // unload unnecessary loaded tile
   for (var key in this.mapView.tiles) {
      var isInKeyList = false
      for (var ki = 0 ; ki < keyList.length ; ki++) {
         if (keyList[ki] === key) isInKeyList = true
      }
      if ( ! isInKeyList ) {
         this.mapView.tiles[key].Release();
         delete this.mapView.tiles[key];
      }
   }

   if ( forceTileRedraw ) {
      for (var key in this.mapView.tiles) {
         var tile = this.mapView.tiles[key].Reset ( );
      }
   }

   var tileModified  = false;
   var timeRemaining = Maperial.refreshRate - 5;

   for (var ki = 0 ; ki < keyList.length ; ki++) {      
      var tile = this.mapView.tiles[keyList[ki]];
      if (tile && !tile.IsUpToDate () )  {
         tileModified = true
         timeRemaining = this.Update( tile, timeRemaining )
         if ( timeRemaining <= 0 )
            break;
      }
   }

   return tileModified
}