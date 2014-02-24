
var utils                   = require('../../../tools/utils.js'),
    GLTools                 = require("./tools/gl-tools.js"),
    CoordinateSystem        = require('../../libs/coordinate-system.js');
    
//------------------------------------------------------------------------------------------//

function HeatmapRenderer ( mapView, heatmapData, colorbar, options ) {
   // They don't realy need mapView ... And it's the same for all gl XX layers no ?

   this.id              = utils.generateUID();
   this.mapView         = mapView;
   this.heatmapData     = heatmapData;
   this.colorbar        = colorbar;
   this.options         = options;
   
   this.gl              = mapView.context.assets.ctx;
   this.assets          = mapView.context.assets;
   this.layerCount      = 0;
   this.z               = null;
   this.tx              = this.ty = this.nbtx = this.nbty = null;
   this.w               = this.h = 0;
   this.frmB            = null;
   this.texB            = null;
   this.cs              = new CoordinateSystem (Maperial.tileSize)

   this.version         = 0;
   this.tex             = [];

   this.initialResolution   = 2 * Math.PI * 6378137 / Maperial.tileSize;
   this.originShift         = 2 * Math.PI * 6378137 / 2.0 ;
}

//------------------------------------------------------------------------------------------//

HeatmapRenderer.prototype.isSync = function () {
  if(this.version == this.heatmapData.version){
      return true;
  }
  else{
     if(this.texB){
        console.log("not sync : reset");
        this.Reset();
     }
     
     return false;
  }
}

//------------------------------------------------------------------------------------------//

HeatmapRenderer.prototype.Refresh = function ( z , tileX, tileY, nbTX , nbTY ) {
   
   var cameraMoved = this.z != z || this.tx == null || tileX < this.tx || tileY < this.ty || tileX + nbTX > this.tx + this.nbtx || tileY + nbTY > this.ty + this.nbty,
       dataChanged = this.version != this.heatmapData.version;

   if (cameraMoved || dataChanged) {
      
      console.log("refesh : reset");
      this.Reset();
      this.version = this.heatmapData.version;
      
      var nbTX2 = 1;
      while ( nbTX2 < nbTX ) nbTX2 = nbTX2 * 2;
      var nbTY2 = 1;
      while ( nbTY2 < nbTY ) nbTY2 = nbTY2 * 2;
      
      var sizeX   = nbTX2 * 256;
      var sizeY   = nbTY2 * 256;
      
      this.w = sizeX;
      this.h = sizeY;
   
      console.log("AllocBuffer");
      this.AllocBuffer (sizeX,sizeY) ;
      
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
   }
}

HeatmapRenderer.prototype.AllocBuffer = function ( sizeX , sizeY ) {
   var gltools       = new GLTools();
   var fbtx          = gltools.CreateFrameBufferTex(this.gl,sizeX,sizeY);
   this.frmB         = fbtx[0];
   this.texB         = fbtx[1];
}

HeatmapRenderer.prototype.Reset = function (  ) {
   var gl            = this.gl;
   this.layerCount   = 0
   if ( this.texB ) {
      gl.deleteTexture ( this.texB );
      delete      this.texB;
      this.texB    = null;
   }
   if ( this.frmB ) {
      gl.deleteFramebuffer ( this.frmB );
      delete      this.frmB;
      this.frmB    = null;
   }
   if (this.tex.length) {
      for (var i = 0 ; i < this.tex.length ; ++i) {
         gl.deleteTexture ( this.tex[i] );
      }
      this.tex = [];
   }
}

HeatmapRenderer.prototype.Release = function (  ) {
   this.Reset()
}

HeatmapRenderer.prototype.IsUpToDate = function ( ) {
   return this.layerCount == null;
}

HeatmapRenderer.prototype.Update = function () {
   if (this.frmB == null || this.layerCount == null)
      return 0;
   console.log("heat Update");
      
   var gl       = this.gl;
//   this.scaleX;
//   this.scaleY;
//   this.trX;
//   this.trY;
   
   gl.bindFramebuffer         ( gl.FRAMEBUFFER, this.frmB );
   this.gl.clearColor         ( 0.0, 0.0, 0.0, 0.0  );
   this.gl.disable            ( this.gl.DEPTH_TEST  );
   gl.viewport                ( 0, 0, this.frmB.width, this.frmB.height);
   gl.clear                   ( gl.COLOR_BUFFER_BIT );
      
   var mvMatrix               = mat4.create();
   var pMatrix                = mat4.create();
   mat4.identity              ( mvMatrix );
   mat4.identity              ( pMatrix );
   mat4.ortho                 ( 0, this.frmB.width , 0, this.frmB.height, 0, 1, pMatrix ); // Y swap !

   var prog = null;
   if ( typeof this.options.fill !== 'undefined' && this.options.fill == "linear" ) {
      prog                   = this.assets.prog[ "HeatLinear" ]
   }
   else { // default gaussian   
      prog                   = this.assets.prog[ "HeatGaussian" ]
   }
   
   gl.useProgram              (prog);

   gl.uniformMatrix4fv        (prog.params.pMatrixUniform.name , false, pMatrix);
   gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.circleVertexPositionBuffer);
   gl.enableVertexAttribArray (prog.attr.vertexPositionAttribute);
   gl.vertexAttribPointer     (prog.attr.vertexPositionAttribute, this.assets.circleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
                              
   gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.circleVertexTextureBuffer);
   gl.enableVertexAttribArray (prog.attr.textureCoordAttribute);
   gl.vertexAttribPointer     (prog.attr.textureCoordAttribute, this.assets.circleVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

   var date    = new Date();
   var startT  = date.getTime();
   var diffT   = 0.0
   
   this.gl.enable(this.gl.BLEND);
   this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
   
   var defaultScale     = typeof this.options.scale !== 'undefined'             ? this.options.scale        : 1.0;
   var defaultDiameter  = typeof this.options.diameter !== 'undefined'          ? this.options.diameter     : 100;
   var unit             = typeof this.options.diameterUnit !== 'undefined'      ? this.options.diameterUnit : "pixel";
   var res              = this.cs.Resolution ( this.z )
   
   if  ( typeof this.options.diameterUnit !== 'undefined' ) {
      if ( this.options.diameterUnit == "meter" ) {
         unit             = 1 // meter
         // Need to be compute with all point !
      }
      else if ( this.options.diameterUnit == "metereq" ) {
         unit             = 2 // metereq
         defaultDiameter = defaultDiameter / res
      }
   }
   
   for (var i = this.layerCount ; i < this.heatmapData.content["l"].length ; ++i ) {
      var layer   = this.heatmapData.content["l"][i];
      var ll      = layer["g"]; // liste de listes de lignes
      var al      = null; // attributlist
      if ("a" in layer) al = layer["a"];
      if (ll == null)   continue;
      
      for ( var l = 0 ; l < ll.length ; ++l ) {
         var   lines = ll[l]; // liste de lignes
         var   attr  = null; // attribut
         if (al) attr = al[l] // attributlist

         var scale      = defaultScale
         var diameter   = defaultDiameter

         if ( attr && typeof (attr) == typeof ({}) ) {
            scale     = typeof attr.scale !== 'undefined' ? attr.scale : scale;
            if ( typeof attr.diameter !== 'undefined' ) {
               diameter = attr.diameter;
               if ( unit == 2 ) {
                  defaultDiameter = defaultDiameter / res
               }
            }
         }
         
         for ( var li = 0 ; li < lines.length ; ++li ) {
            var line = lines[li];
            if (line.length == 2) {
               var localScale = defaultScale
               var localDiam  = defaultDiameter 
               if (unit == 1) {
                  var tmp1 = this.cs.MetersToPixelsAccurate(line[0]   ,line[1],this.z )
                  var tmp2 = this.cs.MetersToPixelsAccurate(line[0] + diameter ,line[1],this.z )
                  diameter = tmp2.x - tmp1.x
               }
               
               mat4.identity              ( mvMatrix );
               var tmpx = line[0] * this.scaleX + this.trX;
               var tmpy = line[1] * this.scaleY + this.trY;
               mat4.translate         ( mvMatrix, [ tmpx , tmpy , 0] );
               mat4.scale             ( mvMatrix, [ diameter , diameter , 1.0] );               
               gl.uniformMatrix4fv    ( prog.params.mvMatrixUniform.name, false, mvMatrix );
               gl.uniform1f           ( prog.params.uParams.name , scale ); 
               gl.drawArrays          ( gl.TRIANGLE_FAN, 0, this.assets.circleVertexPositionBuffer.numItems );
            }
         }
      }
      diffT   = date.getTime() - startT;
      if ( diffT > 10 )
         break;
   }
   
   this.gl.disable(this.gl.BLEND);
   this.layerCount = i + 1
   gl.bindFramebuffer ( gl.FRAMEBUFFER, null );
   
   if ( this.layerCount >= this.heatmapData.content["l"].length ) {
      this._BuildTexture();
      gl.deleteFramebuffer       ( this.frmB );
      delete this.frmB;
      this.frmB = null;
      this.layerCount = null;
   }
   return diffT
}

HeatmapRenderer.prototype.GetTex = function ( tx , ty ) {
   var i = tx - this.tx;
   var j = ty - this.ty;
   if ( i >= this.nbtx || j >= this.nbty || this.layerCount != null || i < 0 || j < 0) {
      console.log ( "invalid custom tile")
      return null
   }
   j = this.nbty - j - 1
   return this.tex [ i + j * this.nbtx ]
   //return this.texB;
}

HeatmapRenderer.prototype._BuildTexture = function () {
   console.log("heat _BuildTexture");
   
   var gltools                = new GLTools ()
   var gl                     = this.gl;

   var mvMatrix               = mat4.create();
   var pMatrix                = mat4.create();
   mat4.identity              ( pMatrix );
   mat4.ortho                 ( 0, 256 , 0, 256, 0, 1, pMatrix ); // Y swap !

   var prog                   = this.assets.prog[ "Clut" ]
   gl.useProgram              (prog);

   var colorBbounds           = this.colorbar.data.GetBounds ()

   gl.uniform4fv              (prog.params.uParams.name ,[0.0,1.0,colorBbounds[0],colorBbounds[1]] ); 
   
   gl.uniformMatrix4fv        (prog.params.pMatrixUniform.name , false, pMatrix);
         
   gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
   gl.enableVertexAttribArray (prog.attr.vertexPositionAttribute);
   gl.vertexAttribPointer     (prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
                              
   gl.bindBuffer              (gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
   gl.enableVertexAttribArray (prog.attr.textureCoordAttribute);
   gl.vertexAttribPointer     (prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);


         
   for (var j = 0 ; j < this.nbty ; j = j + 1 ) {
      for (var i = 0 ; i < this.nbtx ; i = i + 1 ) {
         var fbtx         = gltools.CreateFrameBufferTex(gl,256,256);
         var frmB         = fbtx[0];
         var tex          = fbtx[1];
      
         gl.bindFramebuffer         ( gl.FRAMEBUFFER, frmB );
         gl.disable                 ( gl.DEPTH_TEST  );
         gl.viewport                ( 0, 0, 256, 256 );

         gl.activeTexture           (gl.TEXTURE0);
//         gl.bindTexture             (gl.TEXTURE_2D, this.texB);
         gl.bindTexture             (gl.TEXTURE_2D, tex);
         gl.uniform1i               (prog.params.uSamplerTex1.name, 0);
         
         gl.activeTexture           (gl.TEXTURE1);
         gl.bindTexture             (gl.TEXTURE_2D, this.colorbar.tex[this.mapView.id] );
         gl.uniform1i               (prog.params.uSamplerTex2.name, 1);      
               
         mat4.identity              ( mvMatrix );
         mat4.translate             ( mvMatrix, [- i*256, - j*256 , 0.0] );
         mat4.scale                 ( mvMatrix, [this.nbtx , this.nbty , 1.0] );
         
         gl.uniformMatrix4fv        ( prog.params.mvMatrixUniform.name, false, mvMatrix );
         gl.drawArrays              (gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

         this.tex.push ( tex );
         gl.deleteFramebuffer ( frmB );
      }
   }
   gl.bindFramebuffer         ( gl.FRAMEBUFFER, null );
   gl.activeTexture           (gl.TEXTURE0);
   gl.bindTexture             (gl.TEXTURE_2D, null );
   gl.activeTexture           (gl.TEXTURE1);
   gl.bindTexture             (gl.TEXTURE_2D, null );
}

//------------------------------------------------------------------//

module.exports = HeatmapRenderer;
