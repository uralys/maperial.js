
//=====================================================================================//

function MapRenderer(mapView) {

   console.log("  starting MapRenderer for view " + mapView.id + "...");
   
   this.mapView               = mapView;
   this.dataCache             = {};
   this.customLayersRenderer  = [];

   this.start()

   this.tileRenderer          = new TileRenderer(mapView)
}

//----------------------------------------------------------------------//

MapRenderer.prototype.start = function () {

   this.gl                = null;
   this.drawSceneInterval = null;
   
   try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      this.gl = this.mapView.canvas[0].getContext("webgl") || this.mapView.canvas[0].getContext("experimental-webgl");
      this.fitToSize();
   } catch (e) {}
   
   if (!this.gl) {
      console.log("     Could not initialise WebGL")
      return false;
   }

   this.gltools = new GLTools ()
   this.InitGL()

//   for(var i = 0; i< this.mapView.layers.length; i++){
//      if ( this.mapView.layers[i].type == LayerManager.Custom ) {
//         var cstR = new CustomRenderer ( this.mapView );
//         cstR.Init ( this.mapView.layers[i].source.data )
//         this.customLayersRenderer.push ( cstR )
//      }
//      else if ( this.mapView.layers[i].type == LayerManager.Heat ) {
//         var cstR = new HeatRenderer ( this.mapView );
//         cstR.Init ( this.mapView.layers[i].source.data )
//         this.customLayersRenderer.push ( cstR )
//      }
//      else {
//         this.customLayersRenderer.push ( null )
//      }
//   }
   
   this.drawSceneInterval = setInterval( Utils.apply ( this, "DrawScene" ) , Maperial.refreshRate);
   return true;

   console.log("  rendering started");
} 

//----------------------------------------------------------------------//

MapRenderer.prototype.fitToSize = function () {

   if(this.gl){
      this.gl.viewportWidth  = this.mapView.canvas.width();
      this.gl.viewportHeight = this.mapView.canvas.height();
   }
   else{
      console.log("---------> couldn't fitToSize")      
   }
   
}

//----------------------------------------------------------------------//

function GlobalInitGL( glAsset , gl , glTools) {
   
   glAsset.shaderData                = null;
   glAsset.shaderError               = false;
   var me                            = glAsset;
   
   glAsset.ShaderReq  = $.ajax({
      type     : "GET",
      url      : Maperial.shaderURL + "/all.json",
      dataType : "json",
      async    : false,
      success  : function(data, textStatus, jqXHR) {
         me.shaderData = data;
         for (k in me.shaderData) {
            me.shaderData[k].code = me.shaderData[k].code.replace (/---/g,"\n") 
         }
      },
      error : function(jqXHR, textStatus, errorThrown) {
         me.shaderError = true
         console.log ( Maperial.staticURL + "/all.json" + " : loading failed : " + textStatus );
      }
   });

   var vertices                                  = [ 0.0  , 0.0  , 0.0,     256.0, 0.0  , 0.0,      0.0  , 256.0, 0.0,      256.0, 256.0, 0.0 ];
   glAsset.squareVertexPositionBuffer            = gl.createBuffer();
   gl.bindBuffer   ( gl.ARRAY_BUFFER, glAsset.squareVertexPositionBuffer );
   gl.bufferData   ( gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW );
   glAsset.squareVertexPositionBuffer.itemSize   = 3;
   glAsset.squareVertexPositionBuffer.numItems   = 4;
   
   var textureCoords                             = [ 0.0, 0.0,     1.0, 0.0,      0.0, 1.0,      1.0, 1.0 ]; // Y swap
   glAsset.squareVertexTextureBuffer             = gl.createBuffer();
   gl.bindBuffer   ( gl.ARRAY_BUFFER, glAsset.squareVertexTextureBuffer );
   gl.bufferData   ( gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW );
   glAsset.squareVertexTextureBuffer.itemSize    = 2;
   glAsset.squareVertexTextureBuffer.numItems    = 4;

   var nb = 1;
   vertices                                      = [ 0.0, 0.0, 0.0 ]; // center
   textureCoords                                 = [ 0.0, 0.0 ]; 
   for (var i = 0 ; i <= 360 ; i += 5 ) {
      var a = i * (2.0 * Math.PI / 360.0);
      vertices.push ( Math.sin(a) * 0.5 )
      vertices.push ( Math.cos(a) * 0.5 )
      vertices.push ( 0.0 )
      textureCoords.push (1.0)
      textureCoords.push (1.0)
      nb += 1;
   }

   //GL_TRIANGLE_FAN
   glAsset.circleVertexPositionBuffer            = gl.createBuffer();
   gl.bindBuffer   ( gl.ARRAY_BUFFER, glAsset.circleVertexPositionBuffer );
   gl.bufferData   ( gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW );
   glAsset.circleVertexPositionBuffer.itemSize   = 3;
   glAsset.circleVertexPositionBuffer.numItems   = nb;

   glAsset.circleVertexTextureBuffer             = gl.createBuffer();
   gl.bindBuffer   ( gl.ARRAY_BUFFER, glAsset.circleVertexTextureBuffer );
   gl.bufferData   ( gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW );
   glAsset.circleVertexTextureBuffer.itemSize    = 2;
   glAsset.circleVertexTextureBuffer.numItems    = nb;
   
   gl.clearColor   ( 1.0, 1.0, 1.0, 1.0  );
   gl.disable      ( gl.DEPTH_TEST  );
   
   glAsset.prog = {}
   glAsset.prog["HeatGaussian"]         = glTools.MakeProgram   ( "vertexTex" , "fragmentHeatGaussian" , glAsset); 
   glAsset.prog["HeatLinear"]           = glTools.MakeProgram   ( "vertexTex" , "fragmentHeatLinear"   , glAsset); 
   glAsset.prog["Tex"]                  = glTools.MakeProgram   ( "vertexTex" , "fragmentTex"          , glAsset); 
   glAsset.prog["Clut"]                 = glTools.MakeProgram   ( "vertexTex" , "fragmentClut"         , glAsset);
   glAsset.prog["Shade"]                = glTools.MakeProgram   ( "vertexTex" , "fragmentShade"        , glAsset);
   glAsset.prog[Maperial.MulBlend]      = glTools.MakeProgram   ( "vertexTex" , "fragmentMulBlend"     , glAsset);
   glAsset.prog[Maperial.AlphaClip]     = glTools.MakeProgram   ( "vertexTex" , "fragmentAlphaClip"    , glAsset);
   glAsset.prog[Maperial.AlphaBlend]    = glTools.MakeProgram   ( "vertexTex" , "fragmentAlphaBlend"   , glAsset);
}

MapRenderer.prototype.InitGL = function () {

   this.glAsset         = new Object();
   this.glAsset.ctx     = this.gl;
   this.mapView.context.assets  = this.glAsset;
   
   GlobalInitGL( this.glAsset , this.gl , this.gltools);
   
}

//
//MapRenderer.prototype.renderAllColorBars = function () {
//
//   var colorbarUIDs = this.mapView.colorbarsManager.allColorbars();
//   
//   this.gl.flush ()
//   this.gl.finish()
//      
//   for ( var colorbarUID in colorbarUIDs ) {
//      var colorbar = colorbarUIDs[ colorbarUID ];
//      
//      if ( colorbar == null  || ! colorbar.data.IsValid () ) {
//         console.log ( "Invalid colorbar data : " + colorbarUID )
//         break;
//      }
//
//      if(!colorbar.tex)
//         colorbar.tex = []
//      
//      // Raster it !
//      var data = []
//      for (var i = 0.0 ; i < 1.0 ; i+= 1.0/256) {
//         var c = colorbar.data.Get ( i ) 
//         data.push ( c.Ri() )
//         data.push ( c.Gi() )
//         data.push ( c.Bi() )
//         data.push ( c.Ai() )
//      }
//      data = new Uint8Array(data)
//      
//      if ( colorbar.tex[this.mapView.id] ) {
//         this.gl.deleteTexture ( colorbar.tex[this.mapView.id] )
//         delete colorbar.tex[this.mapView.id] // good ??
//         colorbar.tex[this.mapView.id] = null;
//      }
//    
//      try {
//         colorbar.tex[this.mapView.id] = this.gl.createTexture();
//         this.gl.bindTexture  (this.gl.TEXTURE_2D, colorbar.tex[this.mapView.id] );
//         this.gl.pixelStorei  (this.gl.UNPACK_FLIP_Y_WEBGL  , false    );
//         this.gl.texImage2D   (this.gl.TEXTURE_2D, 0 , this.gl.RGBA, 256 , 1 , 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data );
//         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
//         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
//         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE);
//         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE);
//         this.gl.bindTexture  (this.gl.TEXTURE_2D, null );
//      } catch (e) { 
//         this.gl.deleteTexture ( colorbar.tex[this.mapView.id] );
//         delete colorbar.tex[this.mapView.id];
//         colorbar.tex[this.mapView.id] = null;
//         console.log ( "Error in colorbar building : " + colorbarUID );
//      }
//   }
//   return true;
//}

//----------------------------------------------------------------------//

MapRenderer.prototype.DrawScene = function ( ) {

   var w = this.mapView.canvas.width();
   var h = this.mapView.canvas.height();

   var w2 = Math.floor ( w / 2 );
   var h2 = Math.floor ( h / 2 );

   var r       = this.mapView.context.coordS.Resolution ( this.mapView.context.zoom );
   var originM = new Point( this.mapView.context.centerM.x - w2 * r , this.mapView.context.centerM.y + h2 * r );
   var tileC   = this.mapView.context.coordS.MetersToTile ( originM.x, originM.y , this.mapView.context.zoom );

   var originP = this.mapView.context.coordS.MetersToPixels ( originM.x, originM.y, this.mapView.context.zoom );
   var shift   = new Point ( Math.floor ( tileC.x * Maperial.tileSize - originP.x ) , Math.floor ( - ( (tileC.y+1) * Maperial.tileSize - originP.y ) ) );

   var nbTileX = Math.floor ( w  / Maperial.tileSize + 1 );
   var nbTileY = Math.floor ( h  / Maperial.tileSize + 1 ) ; 
   
   for ( var i = 0 ; i < this.customLayersRenderer.length ; ++i) {
      if (this.customLayersRenderer[i])
         this.customLayersRenderer [i].SetContext ( this.mapView.context.zoom , tileC.x , tileC.y - nbTileY , nbTileX + 1 , nbTileY + 1 ) ;
   }
   if ( this.tileRenderer.UpdateTiles ( tileC.x , tileC.x + nbTileX , tileC.y - nbTileY , tileC.y , this.forceTileRedraw ) || this.forceGlobalRedraw) {
      
      var mvMatrix      = mat4.create();
      var pMatrix       = mat4.create();
      mat4.identity    ( pMatrix );
      mat4.ortho       ( 0, w , h, 0 , 0, 1, pMatrix ); // Y swap !
      this.gl.viewport ( 0, 0, w , h);
      this.gl.clear    ( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );
      
      for ( var wx = shift.x, tx = tileC.x ; wx < w ; wx = wx + Maperial.tileSize , tx = tx + 1) {
         for ( var wy = shift.y, ty = tileC.y ; wy < h ; wy = wy+ Maperial.tileSize , ty = ty - 1) {
            mat4.identity (mvMatrix);
            mat4.translate(mvMatrix, [wx, wy , 0]);
            var key  = tx + "," + ty + "," + this.mapView.context.zoom;
            var tile = this.mapView.tiles[key]
            this.tileRenderer.Render (tile, pMatrix, mvMatrix);
         }
      }
   }
   this.forceGlobalRedraw = true;
   this.forceTileRedraw = false;
}
