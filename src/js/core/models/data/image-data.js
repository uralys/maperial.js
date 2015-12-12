// ----------------------------------------------------------------------------

'use strict';
var _extend = require('lodash/object/extend');

// ----------------------------------------------------------------------------

function wmsBounds(sourceId, x, y, z, context) {
    if ('wms' !== sourceId.split('.')[0]) {
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

// ----------------------------------------------------------------------------

function ImageData(options, tile) {
    this.sourceId = options.sourceId;
    this.x = tile.x;
    this.y = tile.y;
    this.z = tile.z;

    this.content = null;

    var params = _extend({
        x: this.x,
        y: this.y,
        z: this.z,
        wmsBounds: wmsBounds(
            this.sourceId,
            this.x,
            this.y,
            this.z,
            tile.mapView.context
        )
    }, options);

    Maperial.sourceManager.loadImage(params);
}

// ----------------------------------------------------------------------------

ImageData.prototype.tryToFillContent = function() {
    this.content = Maperial.sourceManager.getData(this.sourceId, this.x, this.y, this.z);
};

ImageData.prototype.release = function() {
    Maperial.sourceManager.release(this.sourceId, this.x, this.y, this.z);
};

// ----------------------------------------------------------------------------

module.exports = ImageData;
