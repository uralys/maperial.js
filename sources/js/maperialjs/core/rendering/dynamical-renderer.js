var utils = require('../../../libs/utils.js'),
    ExtendCanvasContext = require('./tools/render-text.js'),
    TileRenderer = require('./tile-renderer.js');

//-----------------------------------------------------------------------------

function DynamicalRenderer(gl, dynamicalData, style) {
    // They don't realy need mapView ... And it's the same for all gl XX layers no ?
    // upgrade : One GL canvas for every GL renderers : views +  DynamicalRenderers

    this.id = utils.generateUID();
    this.dynamicalData = dynamicalData;
    this.style = style;

    this.gl = gl;
    this.cnv = null;
    this.ctx = null;

    /* passe à null qd tex est pret */
    this.renderingStep = 0;

    /* pour rendre au moins une fois la texture avec de sync de nouveau */
    this.texNeverRead = false;

    this.z = null;
    this.tx = null;
    this.ty = null;
    this.nbtx = null;
    this.nbty = null;

    this.w = 0;
    this.h = 0;

    this.version = 0;
    this.tex = [];

    this.initialResolution = 2 * Math.PI * 6378137 / Maperial.tileSize;
    this.originShift = 2 * Math.PI * 6378137 / 2.0;
}

//-----------------------------------------------------------------------------

DynamicalRenderer.prototype.isSync = function () {

    if (this.isUpToDate() && this.texNeverRead) {
        this.texNeverRead = false;
        return true;
    } else if (this.version == this.dynamicalData.version) {
        return true;
    } else {
        if (this.cnv)
            this.reset();

        return false;
    }
};

//-----------------------------------------------------------------------------

DynamicalRenderer.prototype.synchronize = function (z, tileX, tileY, nbTX, nbTY) {

    var cameraMoved = this.z != z || this.tx == null || tileX < this.tx || tileY < this.ty || tileX + nbTX > this.tx + this.nbtx || tileY + nbTY > this.ty + this.nbty,
        dataChanged = this.version != this.dynamicalData.version;

    if ((cameraMoved || dataChanged) && !this.texNeverRead) {
        this.reset();
        this.version = this.dynamicalData.version;

        var nbTX2 = 1,
            nbTY2 = 1;

        while (nbTX2 < nbTX) nbTX2 = nbTX2 * 2;
        while (nbTY2 < nbTY) nbTY2 = nbTY2 * 2;

        this.w = nbTX2 * Maperial.tileSize;
        this.h = nbTY2 * Maperial.tileSize;

        this.AllocCanvas(this.w, this.h);

        var dx = nbTX2 - (nbTX),
            dy = nbTY2 - (nbTY),

            tx = tileX - Math.floor(dx / 2.0),
            ty = tileY - Math.floor(dy / 2.0);

        this.tx = tx;
        this.ty = ty;
        this.nbtx = nbTX2;
        this.nbty = nbTY2;
        this.z = z;

        var tmpP = Math.pow(2, this.z),
            res = this.initialResolution / tmpP;

        this.scaleX = (1 / res);
        this.scaleY = -(1 / res);

        DynamicalRenderer.prototype.AllocCanvas = function (sizeX, sizeY) {
            this.cnv = document.createElement("canvas");
            this.cnv.height = sizeY;
            this.trX = (this.originShift / res) - this.tx * Maperial.tileSize;
            this.trY = this.h - ((this.originShift / res) - this.ty * Maperial.tileSize);
        };
    };
    this.cnv.width = sizeX;
    this.ctx = this.cnv.getContext("2d");
    ExtendCanvasContext(this.ctx);
    this.ctx.globalCompositeOperation = "source-over";

    // Clear ...
    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.cnv.width, this.cnv.height);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255,255,255,0.0)';
    this.ctx.fill();

    this.ctx.setTexViewBox(-1, -1, sizeX + 1, sizeY + 1);
};

DynamicalRenderer.prototype.reset = function () {

    var gl = this.gl;
    this.renderingStep = 0;
    this.texNeverRead = false;

    if (this.cnv) {
        delete this.cnv;
        this.cnv = null;
    }
    if (this.tex.length) {
        for (var i = 0; i < this.tex.length; ++i) {
            gl.deleteTexture(this.tex[i]);
        }
        this.tex = [];
    };
};

DynamicalRenderer.prototype.release = function () {
    this.reset();
};

DynamicalRenderer.prototype.isUpToDate = function () {
    return this.renderingStep == null;
};

DynamicalRenderer.prototype.update = function () {

    if (this.cnv == null || this.renderingStep == null || this.style == null)
        return 0;

    this.ctx._sx = this.scaleX;
    this.ctx._sy = this.scaleY;
    this.ctx._tx = this.trX;
    this.ctx._ty = this.trY;

    var rendererStatus = TileRenderer.RenderDynamicalLayer(
        this.ctx,
        this.dynamicalData,
        this.z,
        this.style,
        this.renderingStep
    );

    this.renderingStep = rendererStatus[0];

    var diffT = 0;
    if (this.isUpToDate()) { // render is finished, build GL Texture
        var date = new Date(),
            startT = date.getTime();
        this._BuildTexture();
        diffT = date.getTime() - startT;
    }

    return rendererStatus[1] + diffT;
};

DynamicalRenderer.prototype.GetTex = function (tx, ty) {
    var i = tx - this.tx;
    var j = ty - this.ty;
    if (i >= this.nbtx || j >= this.nbty || this.renderingStep != null || i < 0 || j < 0) {
        console.log("invalid custom tile");
        return null;
    }
    j = this.nbty - j - 1;
    return this.tex[i + j * this.nbtx];
};

DynamicalRenderer.prototype._BuildTexture = function () {

    var gl = this.gl,
        tileCanvas = document.createElement('canvas');

    tileCanvas.width = Maperial.tileSize;
    tileCanvas.height = Maperial.tileSize;
    var tileCanvasCtx = tileCanvas.getContext('2d');

    tileCanvasCtx.globalCompositeOperation = "copy";

    for (var j = 0; j < this.nbty; j = j + 1) {
        for (var i = 0; i < this.nbtx; i = i + 1) {

            var tex = gl.createTexture();

            tileCanvasCtx.drawImage(this.cnv, i * Maperial.tileSize, j * Maperial.tileSize, Maperial.tileSize, Maperial.tileSize, 0, 0, Maperial.tileSize, Maperial.tileSize);

            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tileCanvas);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            this.tex.push(tex);
        };
    }

    gl.bindTexture(gl.TEXTURE_2D, null);
    this.texNeverRead = true;
    delete tileCanvasCtx;
    delete tileCanvas;
};

//-----------------------------------------------------

module.exports = DynamicalRenderer;
