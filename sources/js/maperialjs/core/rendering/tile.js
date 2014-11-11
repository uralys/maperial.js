var GLTools = require("./tools/gl-tools.js"),
    Layer = require("../models/layer.js"),
    DynamicalLayerPart = require('./layerparts/dynamical-layer-part.js'),
    ImageLayerPart = require('./layerparts/image-layer-part.js'),
    RasterLayer8 = require('./layerparts/raster-layer-part.js').RasterLayer8,
    RasterLayer16 = require('./layerparts/raster-layer-part.js').RasterLayer16,
    ShadeLayerPart = require('./layerparts/shade-layer-part.js'),
    VectorialLayerPart = require('./layerparts/vectorial-layer-part.js');

//----------------------------------------------------------------------------

function Tile(mapView, x, y, z) {

    this.mapView = mapView;
    this.gl = mapView.context.assets.ctx;
    this.assets = mapView.context.assets;

    this.x = x;
    this.y = y;
    this.z = z;

    this.layerParts = [];

    // preparing double buffering to render as texture !
    this.frameBufferL = [];
    this.texL = [];
    this.nbErrors = 0;

    this.refresh();
    this.buildLayerParts();
    this.prepareBuffering();
}

//-----------------------------------------------------------------------------
//-  STATUS MANAGEMENT
//-----------------------------------------------------------------------------

Tile.prototype.refresh = function () {
    this.tex = null;
};

Tile.prototype.isUpToDate = function () {

    var textureReady = this.textureReady(),
        allLayerPartsAreReady = true;

    for (var i = 0; i < this.layerParts.length; i++) {
        if (!this.layerParts[i].isUpToDate()) {
            allLayerPartsAreReady = false;
            break;
        }
    }

    // console.log('is up to date : ' + textureReady && allLayerPartsAreReady);
    return textureReady && allLayerPartsAreReady;
};

//-----------------------------------------------------------------------------

Tile.prototype.textureReady = function () {
    return this.tex != null || this.layerParts.length == 0;
};

//----------------------------------------------------------------------------

Tile.prototype.release = function () {
    this.layerParts.forEach(function (layerPart) {
        try {
            layerPart.release();
        } catch (e) {
            console.log(e, layerPart);
        }

    });

    var gl = this.gl;
    for (var i = 0; i < 2; i = i + 1) {
        gl.deleteFramebuffer(this.frameBufferL[i]);
        gl.deleteTexture(this.texL[i]);
    }
};

//----------------------------------------------------------------------------

Tile.prototype.releaseLayer = function (id) {

    if (this.layerParts[id]) {
        this.layerParts[id].release();
        this.layerParts[id].reset();
    }

    this.refresh();
};

Tile.prototype.resetLayer = function (id) {

    if (this.layerParts[id])
        this.layerParts[id].reset();

    this.refresh();
};

Tile.prototype.reset = function (onlyfuse) {

    onlyfuse = (typeof (onlyfuse) === 'undefined') ? false : onlyfuse;

    if (!onlyfuse) {
        for (var i = 0; i < this.layerParts.length; i++) {
            this.layerParts[i].reset();
        }
    }

    this.refresh();
};

//-----------------------------------------------------------------------------
//  LAYER PARTS MANAGEMENT
//-----------------------------------------------------------------------------

Tile.prototype.buildLayerParts = function () {
    for (var i = 0; i < this.mapView.layers.length; i++) {
        this.createLayerPart(this.mapView.layers[i], i);
    }
};

//----------------------------------------------------------------------------

Tile.prototype.createLayerPart = function (layer, index) {

    switch (layer.type) {

    case Layer.Images:
        this.layerParts.splice(
            index, 0,
            new ImageLayerPart(
                layer,
                this,
                this.mapView.context.assets.ctx
            )
        );
        break;

    case Layer.Dynamical:
    case Layer.Heat:
        this.layerParts.splice(
            index, 0,
            new DynamicalLayerPart(layer, this)
        );
        break;

    case Layer.Shade:
        this.layerParts.splice(
            index, 0,
            new ShadeLayerPart(
                this,
                this.mapView.context,
                layer
            )
        );
        break;

        /* TODO other layers */

        //          case Layer.Vector:
        //          this.layerParts.splice(index, 0, new VectorialLayerPart ( layer, this.mapView , this.z));
        //          break;

        //          case Layer.Raster: // TODO fuse with ReTiler
        //          this.layerParts.splice(index, 0, new RasterLayer8    ( layer, this.mapView , this.z));
        //          break;

        //          case Layer.RETILER:
        //          this.layerParts.splice(index, 0, new RasterLayer16    ( layer, this.mapView , this.z));
        //          break;
    }
};

//----------------------------------------------------------------------------

Tile.prototype.addLayer = function (layerConfig) {
    this.createLayerFromConfig(layerConfig, this.config.layers.length - 1)
    Maperial.sourceManager.loadSources(this.x, this.y, this.z, this.mapView.id)
    this.refresh()
}

Tile.prototype.changeLayer = function (layerConfig, index) {
    this.removeLayer(index)
    this.createLayerFromConfig(layerConfig, index)
    Maperial.sourceManager.loadSources(this.x, this.y, this.z, this.mapView.id)
    this.refresh()
}

Tile.prototype.removeLayer = function (position) {
    if (this.layerParts.length > 0) {
        this.layerParts[position].release()
        this.layerParts.splice(position, 1)
        this.refresh()
    }
    //  else : all layers are released because no layer remains
}

/*
 * Exactly the same as Layer.exchangeLayers
 * exchangedIds contains a mapping between old layerIndexes and the new one, after a layer reposition
 * example, with 3 layers, after moving layer0 (ui bottom) to the top (becomes layer 2) :
 * exchangedIds = {
   {0: 1},
   {1: 2},
   {2: 0}
 }
 */
Tile.prototype.exchangeLayers = function (exchangedIds) {

    var newLayers = [];
    for (id in exchangedIds) {
        newLayers.push(this.layerParts[exchangedIds[id]]);
    }

    this.layerParts = newLayers;
    this.refresh();
}

//----------------------------------------------------------------------------

//TODO v2 : A mettre dans chaque layerpart.prepare (layerParts[i].Init -> layerParts[i].prepare)

//Tile.prototype.sourceReady = function ( source, data , li) { /* li is for customRenderer => HEAT/Vector can use the same source (same source gid)!!!*/

//if(!data){
//console.log("-------> tile.sourceReady : DATA NULL !")
//this.release();
//this.reset();
//return
//}
//if  ( (typeof(li) ==='undefined') || li < 0 || li >= this.config.layers.length) {
//for(var i = 0; i< this.config.layers.length; i++){

//if(this.config.layers[i].source.id != source.id )
//continue;

//try{
//this.layerParts[i].Init( data )
//}
//catch(e){
//console.log("-------> ERROR")
//}
//}
//}
//else {
//if ( this.config.layers[li].source.id == source.id )
//this.layerParts[li].Init( data )
//}
//}

//----------------------------------------------------------------------------

//v2 @deprecated ?
Tile.prototype.RenderVectorialLayers = function (context, wx, wy) {
    for (var i = 0; i < this.layerParts.length; i++) {
        if (this.layerParts[i].GetType() == Layer.Vector && this.layerParts[i].isUpToDate() && this.layerParts[i].cnv) {
            context.drawImage(this.layerParts[i].cnv, wx, wy);
        }
    }
}

//-----------------------------------------------------------------------------
//RENDERING
//-----------------------------------------------------------------------------

Tile.prototype.prepareBuffering = function () {
    var gltools = new GLTools()
    for (var i = 0; i < 2; i = i + 1) {
        var fbtx = gltools.CreateFrameBufferTex(this.gl, Maperial.tileSize, Maperial.tileSize);
        this.frameBufferL.push(fbtx[0]);
        this.texL.push(fbtx[1]);
    }
}

//----------------------------------------------------------------------------

Tile.prototype.update = function (maxTime) {

    //-------------------------------------

    var date = new Date(),
        startT = date.getTime(),
        diffT = 0,
        noLayerPartUpdate = true;

    //-------------------------------------
    // layerParts update

    this.layerParts.forEach(function (part, index) {
        if (!part.isUpToDate()) {
            if (part.dataReady()) {
                part.update(index);
                noLayerPartUpdate = false;

                diffT = date.getTime() - startT;
                if (maxTime - diffT <= 0) {
                    return false;
                }
            }
        }
    }.bind(this));

    //-------------------------------------
    // tile.tex update

    if (noLayerPartUpdate && this.textureReady()) {
        return maxTime - 1;
    } else {
        if (!noLayerPartUpdate && (maxTime - diffT > 0)) {
            this.refresh();
            this.compose();
            diffT = date.getTime() - startT;
        }

        return maxTime - diffT;
    }

}

//----------------------------------------------------------------------------

Tile.prototype.compose = function () {

    //------------------------

    var layerPartsTocompose = []
    for (var i = 0; i < this.layerParts.length; i++) {
        if (this.layerParts[i].isUpToDate())
            layerPartsTocompose.push(this.layerParts[i]);
    }

    if (layerPartsTocompose.length == 0)
        return;

    //------------------------

    var backTex = layerPartsTocompose[0].tex
    var destFb = this.frameBufferL[0]
    var tmpI = 0;

    /* FIXME demo dynamical-data-geojson :
        image received and data not seen : fuse issue ? */
    if (layerPartsTocompose.length > 1) {

        for (var i = 1; i < layerPartsTocompose.length; i++) {
            var frontTex = layerPartsTocompose[i].tex;
            if (frontTex) {
                var composition = layerPartsTocompose[i].layer.composition,
                    prog = this.assets.prog[composition.shader],
                    params = composition.params;

                this.fuse(backTex, frontTex, destFb, prog, params);
            } else {
                this.copy(backTex, destFb);
            }
            backTex = this.texL[tmpI];
            this.tex = backTex;

            tmpI = (tmpI + 1) % 2;
            destFb = this.frameBufferL[tmpI];
        }
    } else {
        this.copy(backTex, destFb);
        this.tex = this.texL[0];
    }
}

//----------------------------------------------------------------------------

Tile.prototype.copy = function (backTex, destFB) {

        var gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, destFB);

        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.disable(this.gl.DEPTH_TEST);
        gl.viewport(0, 0, destFB.width, destFB.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        var mvMatrix = mat4.create();
        var pMatrix = mat4.create();
        mat4.identity(pMatrix);
        mat4.identity(mvMatrix);
        mat4.ortho(0, destFB.width, 0, destFB.height, 0, 1, pMatrix); // Y swap !

        var prog = this.assets.prog["Tex"];

        this.gl.useProgram(prog);
        this.gl.uniformMatrix4fv(prog.params.pMatrixUniform.name, false, pMatrix);
        this.gl.uniformMatrix4fv(prog.params.mvMatrixUniform.name, false, mvMatrix);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
        this.gl.enableVertexAttribArray(prog.attr.vertexPositionAttribute);
        this.gl.vertexAttribPointer(prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
        this.gl.enableVertexAttribArray(prog.attr.textureCoordAttribute);
        this.gl.vertexAttribPointer(prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, backTex);
        this.gl.uniform1i(prog.params.uSamplerTex1.name, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
    //----------------------------------------------------------------------------

Tile.prototype.fuse = function (backTex, frontTex, destFB, prog, params) {
    var gl = this.gl,
        mvMatrix = mat4.create(),
        pMatrix = mat4.create();

    gl.bindFramebuffer(gl.FRAMEBUFFER, destFB);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, destFB.width, destFB.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    mat4.identity(pMatrix);
    mat4.identity(mvMatrix);
    mat4.ortho(0, destFB.width, 0, destFB.height, 0, 1, pMatrix); // Y swap !

    gl.useProgram(prog);
    gl.uniformMatrix4fv(prog.params.pMatrixUniform.name, false, pMatrix);
    gl.uniformMatrix4fv(prog.params.mvMatrixUniform.name, false, mvMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
    gl.enableVertexAttribArray(prog.attr.vertexPositionAttribute);
    gl.vertexAttribPointer(prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
    gl.enableVertexAttribArray(prog.attr.textureCoordAttribute);
    gl.vertexAttribPointer(prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backTex);
    gl.uniform1i(prog.params.uSamplerTex1.name, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, frontTex);
    gl.uniform1i(prog.params.uSamplerTex2.name, 1);

    for (var p in params) {
        // WRONG !!!!! always  uniform3fv ???
        //gl.uniform3fv             (prog.params[p] , params[p] );
        gl[prog.params[p].fct](prog.params[p].name, params[p]);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

//----------------------------------------------------------------------------

Tile.prototype.render = function (pMatrix, mvMatrix) {

    if (this.textureReady()) {
        var prog = this.assets.prog["Tex"];
        this.gl.useProgram(prog);
        this.gl.uniformMatrix4fv(prog.params.pMatrixUniform.name, false, pMatrix);
        this.gl.uniformMatrix4fv(prog.params.mvMatrixUniform.name, false, mvMatrix);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.assets.squareVertexPositionBuffer);
        this.gl.enableVertexAttribArray(prog.attr.vertexPositionAttribute);
        this.gl.vertexAttribPointer(prog.attr.vertexPositionAttribute, this.assets.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.assets.squareVertexTextureBuffer);
        this.gl.enableVertexAttribArray(prog.attr.textureCoordAttribute);
        this.gl.vertexAttribPointer(prog.attr.textureCoordAttribute, this.assets.squareVertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);

        var err = this.gl.getError();
        if (err != 0)
            console.log(err);

        this.gl.uniform1i(prog.params.uSamplerTex1.name, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.assets.squareVertexPositionBuffer.numItems);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

        var err = this.gl.getError();
        if (err != 0)
            console.log(err);
    }
}

//----------------------------------------------------------------------------

module.exports = Tile;
