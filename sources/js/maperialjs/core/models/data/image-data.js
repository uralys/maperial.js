//----------------------------------------------------------------------------

function ImageData(sourceId, tile) {

    this.sourceId = sourceId;
    this.x = tile.x;
    this.y = tile.y;
    this.z = tile.z;

    this.content = null;

    Maperial.sourceManager.loadImage(
        sourceId,
        this.x,
        this.y,
        this.z,
        wmsBounds(
            sourceId,
            this.x,
            this.y,
            this.z,
            tile.mapView.context
        )
    );
};

//----------------------------------------------------------------------------

ImageData.prototype.tryToFillContent = function () {
    this.content = Maperial.sourceManager.getData(this.sourceId, this.x, this.y, this.z);
};

ImageData.prototype.release = function () {
    Maperial.sourceManager.release(this.sourceId, this.x, this.y, this.z);
};

//----------------------------------------------------------------------------

function wmsBounds(sourceId, x, y, z, context){

    if('wms' !== sourceId.split('.')[0]){
        return null;
    }

    var topLeftP = {
        x: x * Maperial.tileSize,
        y: y * Maperial.tileSize
    };

    var topLeftM = context.coordS.PixelsToMeters(
        topLeftP.x,
        topLeftP.y,
        context.zoom
    );

    var bottomRightP = {
        x: topLeftP.x + Maperial.tileSize,
        y: topLeftP.y + Maperial.tileSize
    };

    var bottomRightM = context.coordS.PixelsToMeters(
        bottomRightP.x,
        bottomRightP.y,
        context.zoom
    );

    return {
        topLeft:     topLeftM,
        bottomRight: bottomRightM
    };
}

//----------------------------------------------------------------------------

module.exports = ImageData;
