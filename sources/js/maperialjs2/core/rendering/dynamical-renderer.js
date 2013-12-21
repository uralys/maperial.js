
function DynamicalRenderer ( mapView, dynamicalData ) {
   // They don't realy need mapView ... And it's the same for all gl XX layers no ?
   // upgrade : One GL canvas for every GL renderers : views +  DynamicalRenderers

   this.id              = Utils.generateUID();
   this.mapView         = mapView;
   this.dynamicalData   = dynamicalData;
   this.dataVersion     = 0;
   
   this.gl              = mapView.context.assets.ctx;
   this.cnv             = null;
   this.ctx             = null;
   this.layerCount      = 0;
   this.z               = null;
   this.tx              = null;
   this.ty              = null; 
   this.nbtx            = null;
   this.nbty            = null;
   
   this.w               = 0;
   this.h               = 0;
   
   this.version         = 0;
   this.tex             = [];
   
   this.initialResolution   = 2 * Math.PI * 6378137 / 256;
   this.originShift         = 2 * Math.PI * 6378137 / 2.0 ;
}

DynamicalRenderer.prototype.Refresh = function ( z , tileX, tileY, nbTX , nbTY ) {
    
   var cameraMoved = this.z != z || this.tx == null || tileX < this.tx || tileY < this.ty || tileX + nbTX > this.tx + this.nbtx || tileY + nbTY > this.ty + this.nbty,
       dataChanged = this.dataVersion != this.dynamicalData.version;
   
   if (cameraMoved || dataChanged) {
      this.Reset();
      var nbTX2 = 1;
      while ( nbTX2 < nbTX ) nbTX2 = nbTX2 * 2;
      var nbTY2 = 1;
      while ( nbTY2 < nbTY ) nbTY2 = nbTY2 * 2;
      
      var sizeX   = nbTX2 * 256;
      var sizeY   = nbTY2 * 256;

      //console.log ( "SetContext : " + tileX + ", " + tileY + ", " + nbTX + ", " + nbTY)
      //console.log ( "SetContext : " + nbTX2 + ", " + nbTY2 + ", " + sizeX + ", " + sizeY)
      
      this.w = sizeX;
      this.h = sizeY;
   
      this.AllocCanvas (sizeX,sizeY) ;
      
      var dx = nbTX2 - (nbTX);
      var dy = nbTY2 - (nbTY);
      
      var tx = tileX - Math.floor ( dx / 2.0 );
      var ty = tileY - Math.floor ( dy / 2.0 );
      
      this.tx     = tx;
      this.ty     = ty;
      this.nbtx   = nbTX2
      this.nbty   = nbTY2;
      this.z      = z;
      
      var tmpP    = Math.pow ( 2 , this.z);
      var res     = this.initialResolution / tmpP;
      var mapSize = 256 * tmpP;
      this.scaleX = (1 / res);
      this.scaleY = - (1 / res);
      this.trX    = (this.originShift / res) - this.tx * 256;
      this.trY    = this.h - ((this.originShift / res) - this.ty * 256);
      
      this.version ++
   }
}

DynamicalRenderer.prototype.AllocCanvas = function ( sizeX, sizeY) {
   this.cnv             = document.createElement("canvas");
   this.cnv.height      = sizeY ;
   this.cnv.width       = sizeX ;
   this.ctx             = this.cnv.getContext("2d");
   ExtendCanvasContext  ( this.ctx );
   this.ctx.globalCompositeOperation="source-over";

   // Clear ...
   this.ctx.beginPath   (  );
   this.ctx.rect        ( 0,0,this.cnv.width,this.cnv.height );
   this.ctx.closePath   (  );
   this.ctx.fillStyle    = 'rgba(255,255,255,0.0)';
   this.ctx.fill        (  );
   
   this.ctx.setTexViewBox(-1,-1,sizeX+1,sizeY+1)
}

DynamicalRenderer.prototype.Reset = function (  ) {
   var gl            = this.gl;
   this.layerCount   = 0
   if (this.cnv) {
      delete      this.cnv;
      this.cnv    = null;
   }
   if (this.tex.length) {
      for (var i = 0 ; i < this.tex.length ; ++i) {
         gl.deleteTexture ( this.tex[i] );
      }
      this.tex = [];
   }
}

DynamicalRenderer.prototype.Release = function (  ) {
   this.Reset()
}

DynamicalRenderer.prototype.IsUpToDate = function ( ) {
   return this.layerCount == null;
}

DynamicalRenderer.prototype.Update = function ( params ) {
   if (this.cnv == null || this.layerCount == null)
      return 0;

   var gl         = this.gl;
   var styleUID   = params.styles[params.selectedStyle];
   var style      = this.mapView.stylesManager.getStyle(styleUID);

   if ( ! style ) {
      console.log ( "Invalid style");
      this.layerCount = null;
      this._BuildTexture();
      return 2;
   }
   style = style.content;
   
   this.ctx._sx = this.scaleX;
   this.ctx._sy = this.scaleY;
   this.ctx._tx = this.trX;
   this.ctx._ty = this.trY;
   var rendererStatus   = TileRenderer.RenderLayers (null, null, this.ctx , this.data.content , this.z , style , this.layerCount ) ;
   this.layerCount      = rendererStatus[0];

   var diffT = 0;
   if (this.IsUpToDate()) { // Render is finished, build GL Texture
      var date    = (new Date)
      var startT  = date.getTime()
      this._BuildTexture();
      diffT   = date.getTime() - startT;
   }
   
   
   return rendererStatus[1] + diffT
}

DynamicalRenderer.prototype.GetTex = function ( tx , ty) {
   var i = tx - this.tx;
   var j = ty - this.ty;
   if ( i >= this.nbtx || j >= this.nbty || this.layerCount != null || i < 0 || j < 0) {
      console.log ( "invalid custom tile")
      return null
   }
   j = this.nbty - j - 1
   return this.tex [ i + j * this.nbtx ]
}

DynamicalRenderer.prototype._BuildTexture = function (  ) {

   var tileCanvas    = document.createElement('canvas');
   tileCanvas.width  = 256;
   tileCanvas.height = 256;
   var tileCanvasCtx = tileCanvas.getContext('2d');
   
   tileCanvasCtx.globalCompositeOperation="copy";
   
   var gl = this.gl;
   for (var j = 0 ; j < this.nbty ; j = j + 1 ) {
      for (var i = 0 ; i < this.nbtx ; i = i + 1 ) {
      
         var tx   = this.tx + i
         var ty   = this.ty + j
         var tex  = gl.createTexture();
      
         tileCanvasCtx.drawImage(this.cnv, i*256, j*256 , 256 , 256 , 0 , 0 , 256 , 256);
      
         gl.bindTexture  (gl.TEXTURE_2D           , tex           );
         gl.pixelStorei  (gl.UNPACK_FLIP_Y_WEBGL  , false         );
         gl.texImage2D   (gl.TEXTURE_2D           , 0                      , gl.RGBA    , gl.RGBA, gl.UNSIGNED_BYTE, tileCanvas);
         gl.texParameteri(gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
         gl.texParameteri(gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
         this.tex.push ( tex );
      }
   }
   gl.bindTexture  (gl.TEXTURE_2D           , null         );
   delete tileCanvasCtx;
   delete tileCanvas;
}
