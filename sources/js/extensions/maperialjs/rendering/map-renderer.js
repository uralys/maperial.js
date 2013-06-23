
//=====================================================================================//

function MapRenderer(maperial) {

   console.log("  building map renderer...");
   
   this.drawSceneInterval = null;
   
   this.maperial = maperial;
   this.config = maperial.config;
   this.context = maperial.context;
   
   this.tileCache = {};
   this.dataCache = {};
   
   this.initListeners();
}

//----------------------------------------------------------------------//

MapRenderer.prototype.reset = function () {
   this.removeListeners();

   // unload every tile
   for (var key in this.tileCache) {
      this.tileCache[key].Release();
      this.tileCache[key].Reset(false);
      delete this.tileCache[key];
   }

   this.tileCache = {};
   this.dataCache = {};
   
   this.DrawScene(true, true);
}

//----------------------------------------------------------------------//

MapRenderer.prototype.Stop = function () {
   console.log("  stopping rendering...");
   clearInterval(this.drawSceneInterval);
   this.drawSceneInterval = null;
}

MapRenderer.prototype.Start = function () {

   console.log("  starting rendering...");

   try {
      this.gl = null;
      
      // Try to grab the standard context. If it fails, fallback to experimental.
      this.gl = this.context.mapCanvas[0].getContext("webgl") || this.context.mapCanvas[0].getContext("experimental-webgl");
//      this.gl = this.context.mapCanvas[0].getContext("experimental-webgl");
      this.fitToSize();
   } catch (e) {}
   
   if (!this.gl) {
      console.log("Could not initialise WebGL")
      
      if(window.location.hostname.indexOf("localhost") == -1)
         window.location.href = "http://www.maperial.com/#/usechrome";
      
      return false;
   }

   this.gltools = new GLTools ()
   this.InitGL()
   
   this.drawSceneInterval = setInterval( Utils.apply ( this, "DrawScene" ) , Maperial.refreshRate + 5 );
   return true;
} 

//----------------------------------------------------------------------//


MapRenderer.prototype.addLayer = function (layer) {
   for (var key in this.tileCache) {
      this.tileCache[key].addLayer(layer);
   }
}

MapRenderer.prototype.removeLayer = function (position) {
   for (var key in this.tileCache) {
      this.tileCache[key].removeLayer(position);
   }
}

MapRenderer.prototype.exchangeLayers = function (exchangedIds) {
   for (var key in this.tileCache) {
      this.tileCache[key].exchangeLayers(exchangedIds);
   }
}

//----------------------------------------------------------------------//
   
MapRenderer.prototype.initListeners = function () {

   var renderer = this;
   
   if(this.config.hud.elements[HUD.MAGNIFIER] && this.config.hud.elements[HUD.MAGNIFIER].show){
      this.context.mapCanvas.on(MaperialEvents.MOUSE_MOVE, function(){
         renderer.DrawMagnifier();
      });
   }
   
   $(window).on(MaperialEvents.MOUSE_UP_WIHTOUT_AUTOMOVE, function(){
      if(renderer.config.map.edition){
         renderer.FindLayerId();
      }
   });

   $(window).on(MaperialEvents.STYLE_CHANGED, function(event, layerIndex){
      for (var key in renderer.tileCache) {
         var tile = renderer.tileCache[key].ResetLayer (layerIndex);
      }
   });
   
   $(window).on(MaperialEvents.COLORBAR_CHANGED, function(event, layerIndex){
      renderer.renderAllColorBars(); //optim : refresh que de la colorbar modifiée non ?
      for (var key in renderer.tileCache) {
         var tile = renderer.tileCache[key].ResetLayer (layerIndex);
      }
   });
   
   $(window).on(MaperialEvents.CONTRAST_CHANGED, function(event, layerIndex){
      for (var key in renderer.tileCache) {
         var tile = renderer.tileCache[key].Refresh();
      }
   });
   
   $(window).on(MaperialEvents.BRIGHTNESS_CHANGED, function(event, layerIndex){
      for (var key in renderer.tileCache) {
         var tile = renderer.tileCache[key].Refresh();
      }
   });
   
   $(window).on(MaperialEvents.BW_METHOD_CHANGED, function(event, layerIndex){
      for (var key in renderer.tileCache) {
         var tile = renderer.tileCache[key].Refresh();
      }
   });
   
   $(window).on(MaperialEvents.ALPHA_CHANGED, function(event, layerIndex){
      for (var key in renderer.tileCache) {
         var tile = renderer.tileCache[key].Refresh();
      }
   });

   $(window).on(MaperialEvents.XY_LIGHT_CHANGED, function(event, layerIndex){
      for (var key in renderer.tileCache) {
         var tile = renderer.tileCache[key].ResetLayer (layerIndex);
      }
   });

   $(window).on(MaperialEvents.Z_LIGHT_CHANGED, function(event, layerIndex){
      for (var key in renderer.tileCache) {
         var tile = renderer.tileCache[key].ResetLayer (layerIndex);
      }
   });

   $(window).on(MaperialEvents.SCALE_CHANGED, function(event, layerIndex){
      for (var key in renderer.tileCache) {
         var tile = renderer.tileCache[key].ResetLayer (layerIndex);
      }
   });

   $(window).on(MaperialEvents.DATA_SOURCE_CHANGED, function(){
      //Reload ALL ???? and Redraw ??
      //renderer.DrawScene (true) 
   });

   $(window).on(MaperialEvents.SOURCE_READY, function(event, source, data, x, y, z){
      if(source.isForMe(renderer.maperial.name)){
         renderer.sourceReady(source, data, x, y, z);
      }
   });

//   $(window).on(MaperialEvents.ZOOM_CHANGED, function(event, x, y){
//      renderer.maperial.sourcesManager.stopEverything()
//   });
}

//-------------------------------------------//

MapRenderer.prototype.sourceReady = function ( source, data, x, y, z ) {

   var key = x + "," + y + "," + z;
   
   if ( this.tileCache[key] != null ) {
      this.tileCache[key].sourceReady(source, data);
   }
}

//----------------------------------------------------------------------//

MapRenderer.prototype.removeListeners = function () {

   this.context.mapCanvas.off(MaperialEvents.MOUSE_MOVE);
   $(window).off(MaperialEvents.MOUSE_UP_WIHTOUT_AUTOMOVE);
   $(window).off(MaperialEvents.STYLE_CHANGED);
   $(window).off(MaperialEvents.COLORBAR_CHANGED);
   $(window).off(MaperialEvents.CONTRAST_CHANGED);
   $(window).off(MaperialEvents.BRIGHTNESS_CHANGED);
   $(window).off(MaperialEvents.BW_METHOD_CHANGED);
   $(window).off(MaperialEvents.ALPHA_CHANGED);
   $(window).off(MaperialEvents.DATA_SOURCE_CHANGED);
//   $(window).off(MaperialEvents.ZOOM_CHANGED);
}

//----------------------------------------------------------------------//

MapRenderer.prototype.fitToSize = function () {

   if(this.gl){
      this.gl.viewportWidth  = this.context.mapCanvas.width();
      this.gl.viewportHeight = this.context.mapCanvas.height();
   }
   else{
      console.log("---------> NUBMP")      
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

   gl.clearColor   ( 1.0, 1.0, 1.0, 1.0  );
   gl.disable      ( gl.DEPTH_TEST  );
   
   glAsset.prog = {}
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
   this.context.assets  = this.glAsset;
   
   GlobalInitGL( this.glAsset , this.gl , this.gltools);
   
   /*
   this.glAsset.shaderData                = null;
   this.glAsset.shaderError               = false;
   var me                                 = this.glAsset;

   this.glAsset.ShaderReq  = $.ajax({
      type     : "GET",
      url      : Maperial.static + "/all.json",
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
         console.log ( Maperial.static + "/all.json" + " : loading failed : " + textStatus );
      }
   });

   var vertices                                       = [ 0.0  , 0.0  , 0.0,     256.0, 0.0  , 0.0,      0.0  , 256.0, 0.0,      256.0, 256.0, 0.0 ];
   this.glAsset.squareVertexPositionBuffer            = this.gl.createBuffer();
   this.gl.bindBuffer   ( this.gl.ARRAY_BUFFER, this.glAsset.squareVertexPositionBuffer );
   this.gl.bufferData   ( this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW );
   this.glAsset.squareVertexPositionBuffer.itemSize   = 3;
   this.glAsset.squareVertexPositionBuffer.numItems   = 4;
   
   var textureCoords                                  = [ 0.0, 0.0,     1.0, 0.0,      0.0, 1.0,      1.0, 1.0 ]; // Y swap
   this.glAsset.squareVertexTextureBuffer             = this.gl.createBuffer();
   this.gl.bindBuffer   ( this.gl.ARRAY_BUFFER, this.glAsset.squareVertexTextureBuffer );
   this.gl.bufferData   ( this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW );
   this.glAsset.squareVertexTextureBuffer.itemSize    = 2;
   this.glAsset.squareVertexTextureBuffer.numItems    = 4;

   this.gl.clearColor   ( 1.0, 1.0, 1.0, 1.0  );
   this.gl.disable      ( this.gl.DEPTH_TEST  );

   this.glAsset.prog = {}
   
   this.glAsset.prog["Tex"]                     = this.gltools.MakeProgram   ( "vertexTex" , "fragmentTex"         , this.glAsset); 
   this.glAsset.prog["Clut"]                    = this.gltools.MakeProgram   ( "vertexTex" , "fragmentClut"        , this.glAsset);
   this.glAsset.prog[Maperial.MulBlend]     = this.gltools.MakeProgram   ( "vertexTex" , "fragmentMulBlend"    , this.glAsset);
   this.glAsset.prog[Maperial.AlphaClip]    = this.gltools.MakeProgram   ( "vertexTex" , "fragmentAlphaClip"   , this.glAsset);
   this.glAsset.prog[Maperial.AlphaBlend]   = this.gltools.MakeProgram   ( "vertexTex" , "fragmentAlphaBlend"  , this.glAsset);
   */
   // Check good init !
   // ....
}

MapRenderer.prototype.renderAllColorBars = function () {

   var colorbarUIDs = this.maperial.colorbarsManager.allColorbars();
   
   this.gl.flush ()
   this.gl.finish()
      
   for ( colorbarUID in colorbarUIDs ) {
      
      var colorbar = colorbarUIDs[ colorbarUID ];
      console.log(colorbar);
      
      if ( colorbar.data == null || colorbar.data.length != 256 * 4)  {
         console.log ( "Invalid colorbar data : " + colorbarUID )
         break;
      }
      
      if ( colorbar.tex ) {
         this.gl.deleteTexture ( colorbar.tex )
         delete colorbar.tex // good ??
         colorbar.tex = null;
      }
    
      try {
         colorbar.tex = this.gl.createTexture();
         this.gl.bindTexture  (this.gl.TEXTURE_2D, colorbar.tex );
         this.gl.pixelStorei  (this.gl.UNPACK_FLIP_Y_WEBGL  , false    );
         this.gl.texImage2D   (this.gl.TEXTURE_2D, 0 , this.gl.RGBA, 256 , 1 , 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, colorbar.data );
         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE);
         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE);
         this.gl.bindTexture  (this.gl.TEXTURE_2D, null );
      } catch (e) { 
         this.gl.deleteTexture ( colorbar.tex );
         delete colorbar.tex;
         colorbar.tex = null;
         console.log ( "Error in colorbar building : " + colorbarUID );
      }
   }
   return true;
}

//----------------------------------------------------------------------//

MapRenderer.prototype.UpdateTileCache = function (zoom, txB , txE , tyB , tyE, forceTileRedraw) {
   
   var keyList = [];
   
//   var step
//   var gap = 2
//   var endX = txE
//   var endY = tyE
//   var nextY = tyB
//
//   console.log("-------------------")
//   console.log("startX",txB)
//   console.log("endX",endX)
//   console.log("startY",tyB)
//   console.log("endY",endY)
//   console.log("nextY",nextY)
//   console.log("-----")
//
//   for (step = 0; step < gap; step++){
//      for (tx = txB; tx <= endX; tx++){
//         console.log("tx",tx)
//         for (ty = nextY; ty <= endY; ty++){
//            console.log("  ty",ty)
//
//            var key = tx + "," + ty + "," + zoom;
//            console.log(key)
//            keyList.push(key)
//
//            if ( this.tileCache[key] == null ) {
//               this.tileCache[key]  = new Tile ( this.maperial, tx, ty, zoom);
//            }
//
//            ty = ty+gap-1;
//
//            if(ty > endY-gap+1){
//               nextY = (ty+1)%endY                  
//               break;
//            }
//         }
//      }
//   }    
   
//   
//   
   
   for ( tx = txB ; tx <= txE ; tx++) {
      for ( ty = tyB ; ty <= tyE ; ty++) {
         var key = tx + "," + ty + "," + zoom;
         keyList.push(key)
         
         if ( this.tileCache[key] == null ) {
            this.tileCache[key] = new Tile ( this.maperial, tx, ty, zoom);
            this.tileCache[key].Init();
         }
      }
   }

   // unload unnecessary loaded tile
   for (var key in this.tileCache) {
      var isInKeyList = false
      for (var ki = 0 ; ki < keyList.length ; ki++) {
         if (keyList[ki] === key) isInKeyList = true
      }
      if ( ! isInKeyList ) {
         this.tileCache[key].Release();
         delete this.tileCache[key];
      }
   }

   if ( forceTileRedraw ) {
      for (var key in this.tileCache) {
         var tile = this.tileCache[key].Reset ( );
      }
   }

   var tileModified  = false;
   var timeRemaining = Maperial.refreshRate;
   
   for (var ki = 0 ; ki < keyList.length ; ki++) {      
      var tile = this.tileCache[keyList[ki]];
      if (tile && !tile.IsUpToDate () )  {
         tileModified = true
         timeRemaining = tile.Update( timeRemaining )
         if ( timeRemaining <= 0 )
            break;
      }
   }
   
   return tileModified
}

//----------------------------------------------------------------------//

MapRenderer.prototype.DrawScene = function (forceGlobalRedraw,forceTileRedraw) {

   if(typeof(forceGlobalRedraw)==='undefined' )
      forceGlobalRedraw = true;
   if(typeof(forceTileRedraw)==='undefined' )
      forceTileRedraw = false;
   
   var w = this.context.mapCanvas.width();
   var h = this.context.mapCanvas.height();

   var w2 = Math.floor ( w / 2 );
   var h2 = Math.floor ( h / 2 );

   var r       = this.context.coordS.Resolution ( this.context.zoom );
   var originM = new Point( this.context.centerM.x - w2 * r , this.context.centerM.y + h2 * r );
   var tileC   = this.context.coordS.MetersToTile ( originM.x, originM.y , this.context.zoom );

   var originP = this.context.coordS.MetersToPixels ( originM.x, originM.y, this.context.zoom );
   var shift   = new Point ( Math.floor ( tileC.x * Maperial.tileSize - originP.x ) , Math.floor ( - ( (tileC.y+1) * Maperial.tileSize - originP.y ) ) );

   var nbTileX = Math.floor ( w  / Maperial.tileSize + 1 );
   var nbTileY = Math.floor ( h  / Maperial.tileSize + 1 ) ; 
   
   if ( this.UpdateTileCache ( this.context.zoom , tileC.x , tileC.x + nbTileX , tileC.y - nbTileY , tileC.y , forceTileRedraw ) || forceGlobalRedraw) {
      
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
            var key  = tx + "," + ty + "," + this.context.zoom;
            var tile = this.tileCache[key]
            tile.Render (pMatrix, mvMatrix);
         }
      }
   }
}

//----------------------------------------------------------------------//

/**
 * FindLayerId is still part of MapRenderer since there actually is a rendering here ! 
 */
MapRenderer.prototype.FindLayerId = function () {

   // retrieve the tile clicked
   var tileCoord = this.context.coordS.MetersToTile ( this.context.mouseM.x, this.context.mouseM.y , this.context.zoom );
   var key = tileCoord.x + "," + tileCoord.y + "," + this.context.zoom;

   var tile = this.tileCache[key];

   if(!tile || !tile.IsLoaded())
      return;

   // find the click coordinates inside invisibleCanvas
   // http://map.x-ray.fr/wiki/pages/viewpage.action?pageId=2097159 [3rd graph]
   var clickP = this.context.coordS.MetersToPixels ( this.context.mouseM.x, this.context.mouseM.y, this.context.zoom );
   var tileClickCoord = new Point(Math.floor (clickP.x - tileCoord.x*Maperial.tileSize), Math.floor ( (tileCoord.y+1) * Maperial.tileSize - clickP.y ) );
   
   var style = this.maperial.stylesManager.getSelectedStyle();
   var result = tile.FindSubLayerId( tileClickCoord , this.context.zoom, style.content ) ;

   var layerIndex = result[0];
   var subLayerId = result[1];

   console.log("subLayerId :  " + subLayerId + " | layer : " + layerIndex);
   $(window).trigger(MaperialEvents.OPEN_STYLE, [layerIndex, subLayerId]);
}

//----------------------------------------------------------------------//

MapRenderer.prototype.DrawMagnifier = function () {

   var scale = 3;
   var w = this.context.magnifierCanvas.width();
   var h = this.context.magnifierCanvas.height();
   var left = (w/2)/scale;
   var top = (h/2)/scale;
   var r = this.context.coordS.Resolution ( this.context.zoom );
   
   var originM = new Point( this.context.mouseM.x - left * r , this.context.mouseM.y + top * r );
   var tileC   = this.context.coordS.MetersToTile ( originM.x, originM.y , this.context.zoom );

   var originP = this.context.coordS.MetersToPixels ( originM.x, originM.y, this.context.zoom );
   var shift   = new Point ( Math.floor ( tileC.x * Maperial.tileSize - originP.x ) , Math.floor ( - ( (tileC.y+1) * Maperial.tileSize - originP.y ) ) );

   var ctxMagnifier = this.context.magnifierCanvas[0].getContext("2d");
   ctxMagnifier.save();
   ctxMagnifier.globalCompositeOperation="source-over";
   ctxMagnifier.scale(scale, scale);

   // wx/wy (pixels) in canvas mark ( coord ) !!
   for ( var wx = shift.x, tx = tileC.x ; wx < w ; wx = wx + Maperial.tileSize , tx = tx + 1) {
      for ( var wy = shift.y, ty = tileC.y ; wy < h ; wy = wy+Maperial.tileSize , ty = ty - 1) {
         var key  = tx + "," + ty + "," + this.context.zoom;
         var tile = this.tileCache[key] 
         TileRenderer.DrawImages(tile, ctxMagnifier, wx, wy);
      }
   }    

   ctxMagnifier.restore();

   this.DrawMagnifierSight(ctxMagnifier);
}

//----------------------------------------------------------------------//

//viseur counterStrike pour le zoom yeah
MapRenderer.prototype.DrawMagnifierSight = function (ctxMagnifier) {

   var w = this.context.magnifierCanvas.width();
   var h = this.context.magnifierCanvas.height();

   ctxMagnifier.beginPath();
   ctxMagnifier.moveTo(w/2-20, h/2);
   ctxMagnifier.lineTo(w/2-4, h/2);      
   ctxMagnifier.closePath();
   ctxMagnifier.stroke();      

   ctxMagnifier.beginPath();
   ctxMagnifier.moveTo(w/2+4, h/2);
   ctxMagnifier.lineTo(w/2+20, h/2);      
   ctxMagnifier.closePath();
   ctxMagnifier.stroke();      

   ctxMagnifier.beginPath();
   ctxMagnifier.moveTo(w/2, h/2-20);
   ctxMagnifier.lineTo(w/2, h/2-4);      
   ctxMagnifier.closePath();
   ctxMagnifier.stroke();      

   ctxMagnifier.beginPath();
   ctxMagnifier.moveTo(w/2, h/2+4);
   ctxMagnifier.lineTo(w/2, h/2+20);      
   ctxMagnifier.closePath();
   ctxMagnifier.stroke();      
}
