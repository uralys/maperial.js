//=============================================================//
// @FIXME à refaire pour maperial 2.0
//=============================================================//

VectorialLayerPart.BACK = "back";
VectorialLayerPart.FRONT = "front";

//=============================================================//

/* TODO : il faut un this.layer pour la composition */
function VectorialLayerPart(mapView, inZoom) {
    this.mapView = mapView;

    this.gl = mapView.context.assets.ctx;

    this.cnv = null;
    this.tex = null;
    this.ctx = null;
    this.data = null;
    this.z = inZoom;

    this.layerCount = 0;
}

VectorialLayerPart.prototype.AllocCanvas = function () {
    this.cnv = document.createElement("canvas");
    this.cnv.height = Maperial.tileSize;
    this.cnv.width = Maperial.tileSize;
    this.ctx = this.cnv.getContext("2d");
    ExtendCanvasContext(this.ctx);
    this.ctx.globalCompositeOperation = "source-over";

    // Clear ...

    if (Maperial.bgdimg in window.maperialSymb) {
        var symb = window.maperialSymb[Maperial.bgdimg];
        this.ctx.drawImage(symb.data, 0, 0);
    } else {
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.cnv.width, this.cnv.height);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(255,255,255,0.0)';
        this.ctx.fill();
    }
}

VectorialLayerPart.prototype.GetType = function () {
    return LayerManager.Vector;
}

VectorialLayerPart.prototype.Init = function (data) {
    if (this.tex)
        return;

    this.data = data;
    var gl = this.gl;

    if (data) {
        this.AllocCanvas();
    }
}

VectorialLayerPart.prototype.reset = function () {
    var gl = this.gl;
    this.layerCount = 0
    if (this.cnv) {
        delete this.cnv;
        this.cnv = null;
        this.AllocCanvas();
    }
    if (this.tex) {
        gl.deleteTexture(this.tex);
        delete this.tex;
        this.tex = null;
    }
}

VectorialLayerPart.prototype.release = function () {
    var gl = this.gl;
    if (this.tex) {
        gl.deleteTexture(this.tex);
        delete this.tex;
        this.tex = null;
    }
    if (this.cnv) {
        delete this.cnv;
        this.cnv = null;
    }
}

VectorialLayerPart.prototype.isUpToDate = function () {
    return this.layerCount == null;
}

VectorialLayerPart.prototype.update = function (layerPosition) {
    var gl = this.gl;
    if (this.tex == null) {
        if (this.data) {
            this.tex = gl.createTexture();
        } else { // create fake !
            this.tex = gl.createTexture();
            this.layerCount = null;
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            var byteArray = new Uint8Array([1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
            return 2;
        }
    }

    var osmVisibilities = this.mapView.context.osmVisibilities;
    var styleUID = params.styles[params.selectedStyle];
    var style = this.mapView.stylesManager.getStyle(styleUID).content;

    if (!style) {
        console.log("Invalid style");
        this.layerCount = null;
        this._BuildTexture();
        return 2;
    }
    var rendererStatus = TileRenderer.RenderLayers(osmVisibilities, layerPosition, this.ctx, this.data, this.z, style, this.layerCount);

    this.layerCount = rendererStatus[0];

    var diffT = 0;
    if (this.isUpToDate()) { // render is finished, build GL Texture
        var date = (new Date)
        var startT = date.getTime()
        this._BuildTexture();
        diffT = date.getTime() - startT;
    }

    return rendererStatus[1] + diffT
}

VectorialLayerPart.prototype._BuildTexture = function () {
    var gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.cnv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

//------------------------------------------------------------------//

module.exports = VectorialLayerPart;
