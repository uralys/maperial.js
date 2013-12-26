//------------------------------------------------------------------------------------------//

function DynamicalRenderer ( mapView, dynamicalData, styleUID ) {
   // They don't realy need mapView ... And it's the same for all gl XX layers no ?
   // upgrade : One GL canvas for every GL renderers : views +  DynamicalRenderers

   this.id              = Utils.generateUID();
   this.mapView         = mapView;
   this.dynamicalData   = dynamicalData;
   this.styleUID        = styleUID;
   
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
   
   this.initialResolution   = 2 * Math.PI * 6378137 / Maperial.tileSize;
   this.originShift         = 2 * Math.PI * 6378137 / 2.0 ;
}

//------------------------------------------------------------------------------------------//

DynamicalRenderer.prototype.isSync = function () {
    if(this.version == this.dynamicalData.version){
        return true;
    }
    else{
       if(this.cnv)
          this.Reset();
       
       return false;
    }
}

//------------------------------------------------------------------------------------------//

DynamicalRenderer.prototype.Refresh = function ( z , tileX, tileY, nbTX , nbTY ) {

   var cameraMoved = this.z != z || this.tx == null || tileX < this.tx || tileY < this.ty || tileX + nbTX > this.tx + this.nbtx || tileY + nbTY > this.ty + this.nbty,
       dataChanged = this.version != this.dynamicalData.version;

   if (cameraMoved || dataChanged) {

      this.Reset();
      this.version = this.dynamicalData.version;

      var nbTX2 = 1;
      while ( nbTX2 < nbTX ) nbTX2 = nbTX2 * 2;
      var nbTY2 = 1;
      while ( nbTY2 < nbTY ) nbTY2 = nbTY2 * 2;
      
      var sizeX   = nbTX2 * Maperial.tileSize;
      var sizeY   = nbTY2 * Maperial.tileSize;

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
      var mapSize = Maperial.tileSize * tmpP;
      this.scaleX = (1 / res);
      this.scaleY = - (1 / res);
      this.trX    = (this.originShift / res) - this.tx * Maperial.tileSize;
      this.trY    = this.h - ((this.originShift / res) - this.ty * Maperial.tileSize);
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
   console.log("Reset");
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
   this.Reset();
}

DynamicalRenderer.prototype.IsUpToDate = function ( ) {
   return this.layerCount == null;
}

DynamicalRenderer.prototype.Update = function () {

   console.log("DynamicalRenderer.Update", this.cnv, this.layerCount);
   if (this.cnv == null || this.layerCount == null)
      return 0;

   var gl         = this.gl;
   var style      = styleManager.getStyle(this.styleUID);

   if ( ! style ) {
      console.log ( "Invalid style");
      this.layerCount = null;
      this._BuildTexture();
      return 2;
   }

   style = style.content;
   console.log(style);
   
   this.ctx._sx = this.scaleX;
   this.ctx._sy = this.scaleY;
   this.ctx._tx = this.trX;
   this.ctx._ty = this.trY;
   console.log("TileRenderer.RenderLayers");
   var rendererStatus   = TileRenderer.RenderLayers (null, null, this.ctx , this.dynamicalData.content , this.z , style , this.layerCount ) ;
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

DynamicalRenderer.prototype._BuildTexture = function () {
   console.log("_BuildTexture");
   var tileCanvas    = document.createElement('canvas');
   tileCanvas.width  = Maperial.tileSize;
   tileCanvas.height = Maperial.tileSize;
   var tileCanvasCtx = tileCanvas.getContext('2d');
   
   tileCanvasCtx.globalCompositeOperation="copy";
   
   var gl = this.gl;
   for (var j = 0 ; j < this.nbty ; j = j + 1 ) {
      for (var i = 0 ; i < this.nbtx ; i = i + 1 ) {
      
         var tx   = this.tx + i
         var ty   = this.ty + j
         var tex  = gl.createTexture();
      
         tileCanvasCtx.drawImage(this.cnv, i*Maperial.tileSize, j*Maperial.tileSize , Maperial.tileSize , Maperial.tileSize , 0 , 0 , Maperial.tileSize , Maperial.tileSize);
      
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
