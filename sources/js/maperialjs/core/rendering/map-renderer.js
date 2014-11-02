var GLTools = require("./tools/gl-tools.js"),
    Point = require('../../libs/point.js'),
    Tile = require('./tile.js'),
    ColorbarRenderer = require('./colorbar-renderer.js'),
    DynamicalRenderer = require('./dynamical-renderer.js'),
    HeatmapRenderer = require('./heatmap-renderer.js'),
    utils = require('../../../libs/utils.js'),
    mat4 = require('../../libs/gl-matrix-min.js').mat4,
    ajax = require('../../../libs/ajax.js'),
    TWEEN = require('tween.js');

//-----------------------------------------------------------------------------

function MapRenderer(mapView) {

    console.log("  starting MapRenderer for view " + mapView.id + "...");

    this.mapView = mapView;

    /** init GL **/
    this.start();

    this.assets = mapView.context.assets;
    this.gl = mapView.context.assets.ctx;

    this.dynamicalRenderers = {};
    this.colorbarRenderer = new ColorbarRenderer(this.mapView);
}

//-----------------------------------------------------------------------------

MapRenderer.prototype.start = function () {

    this.gl = null;
    this.drawSceneInterval = null;

    try {
        // Try to grab the standard context.
        // If it fails, fallback to experimental.
        this.gl = this.mapView.canvas.getContext("webgl", {
            preserveDrawingBuffer: true
        }) || this.mapView.canvas.getContext("experimental-webgl", {
            preserveDrawingBuffer: true
        });
        this.fitToSize();
    } catch (e) {}

    if (!this.gl) {
        console.log("     Could not initialise WebGL")
        return false;
    }

    this.gltools = new GLTools();
    this.initGL();

    this.drawSceneInterval = setInterval(
        this.drawScene.bind(this),
        Maperial.refreshRate
    );

    return true;
}

//--------------------------------------------------------------------

MapRenderer.prototype.fitToSize = function () {

    if (this.gl) {
        this.gl.viewportWidth = this.mapView.canvas.width();
        this.gl.viewportHeight = this.mapView.canvas.height();
    } else {
        console.log("---------> couldn't fitToSize")
    }

}

MapRenderer.prototype.initGL = function () {

    this.glAsset = new Object();
    this.glAsset.ctx = this.gl;
    this.mapView.context.assets = this.glAsset;

    prepareGL(this.glAsset, this.gl, this.gltools);

}

//--------------------------------------------------------------------

MapRenderer.prototype.addDynamicalRenderer = function (dynamicalData, style) {

    var renderer = new DynamicalRenderer(
        this.gl,
        dynamicalData,
        style
    );

    this.dynamicalRenderers[renderer.id] = renderer;
    return renderer;
}

//-------------------------------------------------------------------------

MapRenderer.prototype.addHeatmapRenderer = function (heatmapData, colorbar, options) {

    var renderer = new HeatmapRenderer(
        this.mapView,
        heatmapData,
        colorbar,
        options
    );

    this.dynamicalRenderers[renderer.id] = renderer;
    return renderer;
}

//--------------------------------------------------------------------

MapRenderer.prototype.drawScene = function () {

    TWEEN.update();

    var w = this.mapView.canvas.clientWidth,
        h = this.mapView.canvas.clientHeight,

        w2 = Math.floor(w / 2),
        h2 = Math.floor(h / 2),

        r = this.mapView.context.coordS.Resolution(this.mapView.context.zoom),

        originM = new Point(
            this.mapView.context.centerM.x - w2 * r,
            this.mapView.context.centerM.y + h2 * r
        ),

        tileC = this.mapView.context.coordS.MetersToTile(
            originM.x,
            originM.y,
            this.mapView.context.zoom
        ),

        originP = this.mapView.context.coordS.MetersToPixels(
            originM.x,
            originM.y,
            this.mapView.context.zoom
        ),

        shift = new Point(
            Math.floor(tileC.x * Maperial.tileSize - originP.x),
            Math.floor(-((tileC.y + 1) * Maperial.tileSize - originP.y))
        ),

        nbTileX = Math.floor(w / Maperial.tileSize + 1),
        nbTileY = Math.floor(h / Maperial.tileSize + 1);

    //---------------------------------------------------------------

    this.colorbarRenderer.refreshAllColorBars();

    //---------------------------------------------------------------

    var tilesChanged = this.updateTiles(
        tileC.x,
        tileC.x + nbTileX,
        tileC.y - nbTileY,
        tileC.y,
        this.forceTileRedraw
    );

    if (tilesChanged || this.forceGlobalRedraw) {

        var mvMatrix = mat4.create(),
            pMatrix = mat4.create();

        mat4.identity(pMatrix);
        mat4.ortho(0, w, h, 0, 0, 1, pMatrix); // Y swap !

        this.gl.viewport(0, 0, w, h);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        for (var wx = shift.x, tx = tileC.x; wx < w; wx = wx + Maperial.tileSize, tx = tx + 1) {
            for (var wy = shift.y, ty = tileC.y; wy < h; wy = wy + Maperial.tileSize, ty = ty - 1) {
                mat4.identity(mvMatrix);
                mat4.translate(mvMatrix, [wx, wy, 0]);
                var key = tx + "," + ty + "," + this.mapView.context.zoom,
                    tile = this.mapView.tiles[key];
                tile.render(pMatrix, mvMatrix);
            }
        }
    }

    //---------------------------------------------------------------

    for (var rendererId in this.dynamicalRenderers) {
        var renderer = this.dynamicalRenderers[rendererId];
        renderer.synchronize(
            this.mapView.context.zoom,
            tileC.x,
            tileC.y - nbTileY,
            nbTileX + 1,
            nbTileY + 1
        );
    }

    //---------------------------------------------------------------

    this.forceGlobalRedraw = true;
    // this.forceTileRedraw    = false;
};

//--------------------------------------------------------------------

MapRenderer.prototype.updateTiles = function (txB, txE, tyB, tyE, forceTileRedraw) {

    var keyList = [];
    var zoom = this.mapView.context.zoom;

    for (var tx = txB; tx <= txE; tx++) {
        for (var ty = tyB; ty <= tyE; ty++) {
            var key = tx + "," + ty + "," + zoom;
            keyList.push(key);

            if (this.mapView.tiles[key] == null) {
                this.mapView.tiles[key] = this.createTile(tx, ty, zoom);
            }
        }
    }

    // unload unnecessary loaded tile
    for (var key in this.mapView.tiles) {
        var isInKeyList = false;
        for (var ki = 0; ki < keyList.length; ki++) {
            if (keyList[ki] === key) isInKeyList = true;
        }
        if (!isInKeyList) {
            this.mapView.tiles[key].release();
            delete this.mapView.tiles[key];
        }
    }

    if (forceTileRedraw) {
        for (var key in this.mapView.tiles) {
            this.mapView.tiles[key].reset();
        }
    }

    var tileModified = false,
        timeRemaining = Maperial.refreshRate - 5;

    for (var ki = 0; ki < keyList.length; ki++) {
        var tile = this.mapView.tiles[keyList[ki]];
        if (tile && !tile.isUpToDate()) {
            tileModified = true;

            timeRemaining = tile.update(timeRemaining);
            if (timeRemaining <= 0)
                break;
        }
    }

    return tileModified;
};

MapRenderer.prototype.createTile = function (x, y, z) {
    return new Tile(this.mapView, x, y, z);
};

//----------------------------------------------------------------
//PRIVATE
//--------------------------------------------------------------------

function prepareGL(glAsset, gl, glTools) {

    glAsset.shaderData = null;
    glAsset.shaderError = false;

    var shadersReceived = function (error, result) {
        if (error) {
            glAsset.shaderError = true
            console.log(Maperial.staticURL + "/shaders/all.json : failed");
        } else {
            glAsset.shaderData = result;
            for (var k in glAsset.shaderData) {
                var shader = glAsset.shaderData[k];
                shader.code = shader.code.replace(/---/g, "\n");
            }
        }
    };

    ajax.get({
        url: Maperial.staticURL + "/shaders/all.json",
        data: null,
        callback: shadersReceived,
        responseType: "json",
        async: false
    });

    var vertices = [
        0.0, 0.0, 0.0,
        256.0, 0.0, 0.0,
        0.0, 256.0, 0.0,
        256.0, 256.0, 0.0
    ];

    glAsset.squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glAsset.squareVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    glAsset.squareVertexPositionBuffer.itemSize = 3;
    glAsset.squareVertexPositionBuffer.numItems = 4;

    // Y swap
    var textureCoords = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];

    glAsset.squareVertexTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glAsset.squareVertexTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    glAsset.squareVertexTextureBuffer.itemSize = 2;
    glAsset.squareVertexTextureBuffer.numItems = 4;

    var nb = 1;
    vertices = [0.0, 0.0, 0.0]; // center
    textureCoords = [0.0, 0.0];
    for (var i = 0; i <= 360; i += 5) {
        var a = i * (2.0 * Math.PI / 360.0);
        vertices.push(Math.sin(a) * 0.5)
        vertices.push(Math.cos(a) * 0.5)
        vertices.push(0.0)
        textureCoords.push(1.0)
        textureCoords.push(1.0)
        nb += 1;
    }

    //GL_TRIANGLE_FAN
    glAsset.circleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glAsset.circleVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    glAsset.circleVertexPositionBuffer.itemSize = 3;
    glAsset.circleVertexPositionBuffer.numItems = nb;

    glAsset.circleVertexTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glAsset.circleVertexTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    glAsset.circleVertexTextureBuffer.itemSize = 2;
    glAsset.circleVertexTextureBuffer.numItems = nb;

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.disable(gl.DEPTH_TEST);

    glAsset.prog = {}
    glAsset.prog["HeatGaussian"] = glTools.MakeProgram("vertexTex", "fragmentHeatGaussian", glAsset);
    glAsset.prog["HeatLinear"] = glTools.MakeProgram("vertexTex", "fragmentHeatLinear", glAsset);
    glAsset.prog["Tex"] = glTools.MakeProgram("vertexTex", "fragmentTex", glAsset);
    glAsset.prog["Clut"] = glTools.MakeProgram("vertexTex", "fragmentClut", glAsset);
    glAsset.prog["Shade"] = glTools.MakeProgram("vertexTex", "fragmentShade", glAsset);
    glAsset.prog[Maperial.MulBlend] = glTools.MakeProgram("vertexTex", "fragmentMulBlend", glAsset);
    glAsset.prog[Maperial.AlphaClip] = glTools.MakeProgram("vertexTex", "fragmentAlphaClip", glAsset);
    glAsset.prog[Maperial.AlphaBlend] = glTools.MakeProgram("vertexTex", "fragmentAlphaBlend", glAsset);
}

//----------------------------------------------------------------

module.exports = MapRenderer;
