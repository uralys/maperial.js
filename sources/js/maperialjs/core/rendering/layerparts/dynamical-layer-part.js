function DynamicalLayerPart(layer, tile) {

    this.layer = layer;
    this.tile = tile;
    this.x = tile.x;
    this.y = tile.y;
    this.z = tile.z;

    this.version = null;
    this.tex = null;

    this.renderer = layer.renderer;
}

//-----------------------------------------------------------------------------

DynamicalLayerPart.prototype.isUpToDate = function () {
    var isUpTodate = this.renderer.isSync() && this.tex != null;

    if (!isUpTodate)
        this.reset();

    return isUpTodate;
}

//-----------------------------------------------------------------------------

DynamicalLayerPart.prototype.dataReady = function () {

    if (this.renderer.isUpToDate()) {
        return true;
    } else {
        this.renderer.update();
        return false;
    }
}

//-----------------------------------------------------------------------------

DynamicalLayerPart.prototype.prepare = function () {

}

//-----------------------------------------------------------------------------

DynamicalLayerPart.prototype.reset = function () {
    this.tex = null;
}

//-----------------------------------------------------------------------------

DynamicalLayerPart.prototype.release = function () {
    this.tex = null;
}

//-----------------------------------------------------------------------------

DynamicalLayerPart.prototype.update = function () {
    if (this.tex == null) {
        this.tex = this.renderer.GetTex(this.x, this.y)
    }
    return 0;
}

//------------------------------------------------------------

module.exports = DynamicalLayerPart;
