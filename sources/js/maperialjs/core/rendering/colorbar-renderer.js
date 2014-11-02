//-----------------------------------------------------------------------------

function ColorbarRenderer(mapView) {
    this.mapView = mapView;
    this.gl = mapView.context.assets.ctx;
}

//-----------------------------------------------------------------------------

ColorbarRenderer.prototype.refreshAllColorBars = function () {

    var colorbars = Maperial.colorbars;

    this.gl.flush();
    this.gl.finish();

    for (var colorbarUID in colorbars) {
        var colorbar = colorbars[colorbarUID],
            sync = colorbar.version === colorbar.data.version,
            sameView = colorbar.mapView === this.mapView;

        if (sameView && !sync) {
            this.renderColorbar(colorbar);
            colorbar.version = colorbar.data.version;
        }
    }

    return true;
}

//-----------------------------------------------------------------------------

ColorbarRenderer.prototype.renderColorbar = function (colorbar) {

    if (colorbar == null || !colorbar.data.IsValid()) {
        console.log("Invalid colorbar data : " + colorbar.uid);
    }

    // Raster it !
    var data = [];
    for (var i = 0.0; i < 1.0; i += 1.0 / 256) {
        var c = colorbar.data.Get(i);
        data.push(c.Ri());
        data.push(c.Gi());
        data.push(c.Bi());
        data.push(c.Ai());
    }

    data = new Uint8Array(data);

    if (colorbar.tex) {
        this.deleteTexture(colorbar.tex);
    }

    try {
        colorbar.tex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, colorbar.tex);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 256, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    } catch (e) {
        this.deleteTexture(colorbar.tex);
        console.log("Error in colorbar building : " + colorbar.uid);
    }
}

//-----------------------------------------------------------------------------

ColorbarRenderer.prototype.deleteTexture = function (tex) {
    this.gl.deleteTexture(tex);
    delete tex;
    tex = null;
}

//-----------------------------------------------------

module.exports = ColorbarRenderer;
