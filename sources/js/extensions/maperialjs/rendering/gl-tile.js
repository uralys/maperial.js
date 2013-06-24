
function Tile (mapView, x, y, z) {

   //--------------------------------//

   this.mapView = mapView;
   this.config = mapView.config;

   this.x         = x;
   this.y         = y;
   this.z         = z;

   //--------------------------------//
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Init = function () {

   this.assets       = this.mapView.context.assets;
   this.gl           = this.assets.ctx;

   // preparing double buffering to render as texture !
   this.frameBufferL = [];
   this.texL         = [];
   this.tex          = null;
   this.nbErrors     = 0;

   this.prepareBuffering();
   
   this.buildLayers();
   window.maperialSourcesManager.loadSources(this.x, this.y, this.z, this.mapView.name);
}

//----------------------------------------------------------------------------------------------------------------------//


Tile.prototype.buildLayers = function () {
   this.layers = [];

   for(var i = 0; i< this.config.layers.length; i++){
      this.createLayerFromConfig(this.config.layers[i], i)
   }
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.createLayerFromConfig = function (layer, index) {
   
   switch(layer.type){
      case LayersManager.Vector:
         this.layers.splice(index, 0, new VectorialLayer ( this.mapView , this.z));
         break;
         
      case LayersManager.Raster:
         this.layers.splice(index, 0, new RasterLayer8    ( this.mapView , this.z));
         break;
         
      case LayersManager.SRTM:
         this.layers.splice(index, 0, new RasterLayer16    ( this.mapView , this.z));
         break;
         
      case LayersManager.Images:
         this.layers.splice(index, 0, new ImageLayer     ( this.mapView.context.assets.ctx , this.z));
         break;
         
      case LayersManager.Shade:
         this.layers.splice(index, 0, new ShadeLayer    ( this.mapView , this.z));
         break;
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
// PUBLIC
//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.addLayer = function (layerConfig) {
   this.createLayerFromConfig(layerConfig, this.config.layers.length - 1)
   window.maperialSourcesManager.loadSources(this.x, this.y, this.z, this.mapView.name)
   this.Refresh()
}

Tile.prototype.removeLayer = function (position) {
   if(this.layers.length > 0){
      this.layers[position].Release()
      this.layers.splice(position, 1)
      this.Refresh()
   }
   //  else : all layers are released because no layer remains
}

/**
 * Exactly the same as LayersManager.exchangeLayers
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
      newLayers.push(this.layers[exchangedIds[id]]);
   }

   this.layers = newLayers;
   this.Refresh();
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Release = function() {
   
   window.maperialSourcesManager.release(this.x, this.y, this.z, this.mapView.name);
   
   for(var i = 0; i < this.config.layers.length; i++){
      try{
         this.layers[i].Release();
      }
      catch(e){
         console.log("------------> tile.Release")
         console.log(e, this.layers[i])
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
   return this.tex;
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.ResetLayer = function (id) {

   if(this.layers[id])
      this.layers[id].Reset();
   
   this.Refresh();
}

Tile.prototype.Reset = function (onlyFuse) {
   
   onlyFuse = (typeof(onlyFuse)==='undefined')?false:onlyFuse;
   
   if (!onlyFuse) {
      for (var i = 0; i < this.layers.length; i++) {      
         this.layers[i].Reset();
      }
   }

   this.Refresh();
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.sourceReady = function ( source, data ) {
  
   if(!data){
      console.log("-------> tile.sourceReady : DATA NULL !")
      //this.nbErrors ++;
      this.Release();
      this.Reset();
      return
   }

   for(var i = 0; i< this.config.layers.length; i++){
      
      if(this.config.layers[i].source.id != source.id )
         continue;

      try{
         this.layers[i].Init( data )
      }
      catch(e){
         console.log("-------> ERROR")
      }
   }   
}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.RenderVectorialLayers = function ( context, wx, wy ) {
   for (var i = 0; i < this.layers.length; i++) {
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

      var data = window.maperialSourcesManager.getData(this.config.layers[i].source, this.x, this.y, this.z);
      var subLayerId = TileRenderer.FindSubLayerId(tileClickCoord , ctx , data , zoom, styleContent, i, this.mapView.context.osmVisibilities );

      if(subLayerId)
         return [i, subLayerId];
   }

}

//----------------------------------------------------------------------------------------------------------------------//

Tile.prototype.Update = function ( maxTime ) {

   if (this.IsUpToDate() || !this.IsLoaded() )
      return maxTime - 1 ;

   var date    = (new Date)
   var startT  = date.getTime()
   var diffT   = 0
   //var timeRemaining = maxTime;

   for(var i = 0; i< this.config.layers.length; i++){
      if (! this.layers[i].IsUpToDate ( ) ) {
         /*timeRemaining -= this.layers[i].Update( this.config.layers[i].params, i );
         if ( timeRemaining <= 0 )
            break;
            */
         this.layers[i].Update( this.config.layers[i].params, i );
         diffT   = date.getTime() - startT;
         if ( maxTime - diffT <= 0 )
            break;
      }
   }

   if ( maxTime - diffT > 0 ) {
      var ready = true;
      for (var i = 0; i < this.layers.length; i++) {
         if (! this.layers[i].IsUpToDate ( ) )
            ready = false;
      }

      // Get elapsed time !!
      if ( ready ) {
         this.Compose();
         diffT   = date.getTime() - startT;
      }
   }
   return maxTime - diffT; 
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
   return window.maperialSourcesManager.isTileLoaded(this.x, this.y, this.z, this.mapView.name);
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
