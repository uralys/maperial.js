var ImageData = require('../../models/data/image-data.js'),
    Layer = require('../../models/layer.js');

//---------------------------------------------------------------------------

function ImageLayerPart(layer, tile, gl) {

    this.layer = layer;
    this.gl = gl;

    this.tex = null;
    this.w = 0;
    this.h = 0;

    this.data = new ImageData(layer.sourceId, tile.x, tile.y, tile.z);

    this.layer.on(Layer.REFRESH, function(){
        this.reset();
    }.bind(this));

}

//---------------------------------------------------------------------------

ImageLayerPart.prototype.dataReady = function () {

    if (this.data.content) {
        return 1;
    } else {
        this.data.tryToFillContent();

        if (this.data.content) {
            this.prepare();
            return 2;
        }
    }

    return 0;
};

//---------------------------------------------------------------------------

ImageLayerPart.prototype.prepare = function () {
    this.w = this.data.content.width;
    this.h = this.data.content.height;
};

//---------------------------------------------------------------------------

ImageLayerPart.prototype.reset = function () {
    if (this.tex) {
        this.gl.deleteTexture(this.tex);
        delete this.tex;
        this.tex = null;
    }
};

ImageLayerPart.prototype.release = function () {
    this.reset();

    if (this.data.content) {
        delete this.data.content;
        this.data.content = null;
    }
};

//---------------------------------------------------------------------------

ImageLayerPart.prototype.isUpToDate = function () {
    return this.tex != null;
};

//---------------------------------------------------------------------------

ImageLayerPart.prototype.update = function () {

    if (this.tex)
        return 0;

    var date = (new Date),
        startT = date.getTime(),
        gl = this.gl;

    if (this.data.content != null && this.data.content.width > 0) {

        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.data.content);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    } else { // create fake

        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        var byteArray = new Uint8Array([1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.w = 2;
        this.h = 2;
    }

    var diffT = date.getTime() - startT;
    return diffT

}

//---------------------------------------------------------------------------

module.exports = ImageLayerPart;
