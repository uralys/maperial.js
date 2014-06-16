
var ShadeData       = require("../../models/data/shade-data.js"),
    GLTools         = require("../tools/gl-tools.js");

//---------------------------------------------------------------------------

function ShadeLayerPart ( tile, context, layer ) {

    this.context    = context;
    this.assets     = context.assets;
    this.gl         = context.assets.ctx;

    /* sync params with those from the layer */
    this.layer      = layer;
    this.params     = null;

    this.tex        = null;
    this.w          = 0;
    this.h          = 0;

    this.resolution = context.coordS.Resolution ( tile.z );

    this.data       = new ShadeData(tile.x, tile.y, tile.z);

}

//---------------------------------------------------------------------------

ShadeLayerPart.prototype.IsUpToDate = function ( ) {

    if(this.params === this.layer.params
    && this.tex != null){
        return true;
    }
    else{
        this.params = this.layer.params;
        this.reset();
        return false;
    }
};

//---------------------------------------------------------------------------

ShadeLayerPart.prototype.dataReady = function(){

    if(this.data.content){
        return true;
    }
    else{
        this.data.tryToFillContent();

        if(this.data.content){
            this.prepare();
            return true;
        }
    }

    return false;
};

//---------------------------------------------------------------------------

ShadeLayerPart.prototype.prepare = function () {

    if (this.tex)
        return;

    console.log("prepare shade");

    var nl          = [],
        byteArray   = new Uint8Array ( this.data.content );

    for ( var i = 0 ; i < Maperial.tileSize*Maperial.tileSize*2 ; i = i+2 ) {

        var a   = ( byteArray[i] / 255.0 ) * 2.0    - 1.0,
            b   = ( byteArray[i+1] / 255.0 ) * 2.0  - 1.0,
            tmp = - (a*a) - (b*b) + 1.0,
            c   = Math.sqrt( tmp );

        nl.push(  Math.ceil( ((a + 1.0)/2.0) * Maperial.tileSize-1));
        nl.push(  Math.ceil( ((b + 1.0)/2.0) * Maperial.tileSize-1));
        nl.push(  Math.ceil( ((c + 1.0)/2.0) * Maperial.tileSize-1));
    }

    this.data.content       = new Uint8Array (nl);
    this.w                  = Maperial.tileSize;
    this.h                  = Maperial.tileSize;
};

ShadeLayerPart.prototype.reset = function (  ) {
    if (this.tex) {
        this.gl.deleteTexture ( this.tex );
        delete this.tex;
        this.tex = null;
    }
};

ShadeLayerPart.prototype.release = function (  ) {
    this.reset();
    if (this.data.content) {
        delete this.data.content;
        this.data.content = null;
    }
};

ShadeLayerPart.prototype.update = function () {

    if (this.tex)
        return 0;

    var date    = (new Date()),
        startT  = date.getTime(),
        gl      = this.gl;

    if ( this.data.content ) {

        var gltools                = new GLTools (),
            fbtx                   = gltools.CreateFrameBufferTex(gl,this.w,this.h),
            tmpTex                 = gl.createTexture ();

        this.tex                   = fbtx[1];
        gl.bindTexture             (gl.TEXTURE_2D, tmpTex);
        gl.pixelStorei             (gl.UNPACK_FLIP_Y_WEBGL  , false );
        gl.texImage2D              (gl.TEXTURE_2D, 0, gl.RGB, this.w , this.h, 0, gl.RGB, gl.UNSIGNED_BYTE, this.data.content);
        gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S    , gl.CLAMP_TO_EDGE);
        gl.texParameteri           (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T    , gl.CLAMP_TO_EDGE);

        gl.bindFramebuffer         ( gl.FRAMEBUFFER, fbtx[0] );
        this.gl.clearColor         ( 1.0, 1.0,1.0, 1.0  );
        this.gl.disable            ( this.gl.DEPTH_TEST  );
        gl.viewport                ( 0, 0, fbtx[0].width, fbtx[0].height);
        gl.clear                   ( gl.COLOR_BUFFER_BIT );

        var mvMatrix               = mat4.create();
        var pMatrix                = mat4.create();
        mat4.identity              ( mvMatrix );
        mat4.scale                 ( mvMatrix, [this.w  / Maperial.tileSize , this.h / Maperial.tileSize, 1.0] );
        mat4.identity              ( pMatrix );
        mat4.ortho                 ( 0, fbtx[0].width , 0, fbtx[0].height, 0, 1, pMatrix ); // Y swap !

        var prog                   = this.assets.prog[ "Shade" ];

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

        gl.uniform3fv              (prog.params.uLight.name   , [-this.params.uLight[0],-this.params.uLight[1],-this.params.uLight[2]]);
        gl.uniform1f               (prog.params.uScale.name   , this.params.scale);
        //gl.uniform3fv              (prog.params.uLight.name   , [0.0,0.0,-50.0] );
        //gl.uniform1f               (prog.params.uScale.name   , 1);

        gl.uniform1f               (prog.params.uPixRes.name  , this.resolution );

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
        gl.texImage2D        ( gl.TEXTURE_2D           , 0                           , gl.RGBA, 2 , 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray);
        gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MAG_FILTER  , gl.NEAREST );
        gl.texParameteri     ( gl.TEXTURE_2D           , gl.TEXTURE_MIN_FILTER  , gl.NEAREST );
        gl.bindTexture       ( gl.TEXTURE_2D           , null         );
        this.w = 2;
        this.h = 2;
    }

    var diffT   = date.getTime() - startT;
    return diffT;
};

//------------------------------------------------------------------//

module.exports = ShadeLayerPart;
