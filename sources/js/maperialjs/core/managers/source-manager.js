var utils = require('../../../libs/utils.js'),
    Source = require('../models/source.js'),
    ajax = require('../../../libs/lodash.js'),
    ajax = require('../../../libs/ajax.js');

//------------------------------------------------------------------------------
// à analyser : ancien loadRaster, ou passage par loadAPISource ?
// https://ks3359720.kimsufi.com:90/root/maperial/blob/master/web/sources/js/extensions/maperialjs/managers/sources-manager.js#L331
//------------------------------------------------------------------------------

function SourceManager() {

    this.data = {};
    this.requests = {};
    this.complete = {};
    this.errors = {};

    this.requestsCounter = {};
}

//------------------------------------------------------------------------------

SourceManager.prototype.getData = function (source, x, y, z) {
    var requestId = getRequestId(source, x, y, z);
    return this.data[requestId];
};

//------------------------------------------------------------------------------

SourceManager.prototype.releaseNetwork = function () {

    for (var requestId in this.requests) {

        if (!this.complete[requestId] ||
            this.errors[requestId] ||
            !this.data[requestId]
        ) {
            try {
                this.requests[requestId].abort();
            } catch (e) {}
        }

        delete this.data[requestId];
        delete this.errors[requestId];
        delete this.complete[requestId];
        delete this.requests[requestId];
    }

};

//------------------------------------------------------------------------------

SourceManager.prototype.release = function (sourceId, x, y, z) {

    var requestId = getRequestId(sourceId, x, y, z),
        nbRequests = this.requestsCounter[requestId] || 0;

    if (nbRequests > 1) {
        this.requestsCounter[requestId] = nbRequests - 1;
    } else {
        if (!this.complete[requestId]) {

            try {
                this.requests[requestId].abort();
            } catch (e) {}
        }

        delete this.data[requestId];
        delete this.errors[requestId];
        delete this.complete[requestId];
        delete this.requests[requestId];
    }
};

//------------------------------------------------------------------------------

SourceManager.prototype.loadVectorial = function (sourceId, x, y, z) {
    var url = Maperial.apiURL + "/api/tile?x=" + x + "&y=" + y + "&z=" + z,
        requestId = getRequestId(sourceId, x, y, z);
    this.loadAPISource(url, requestId);
};

SourceManager.prototype.loadShade = function (x, y, z) {
    var url = Maperial.apiURL + "/api/srtm?x=" + x + "&y=" + y + "&z=" + z,
        // var url = Maperial.apiURL + "/api/ReTiler?x="+x+"&y="+y+"&z="+z,
        requestId = getRequestId(Source.Shade, x, y, z);
    this.loadAPISource(url, requestId);
};

// à analyser : ReTiler (not sade but anything)
SourceManager.prototype.loadReTiler = function (sourceId, x, y, z) {
    var url = "/api/ReTiler?x=" + tx + "&y=" + ty + "&z=" + z,
        requestId = getRequestId(sourceId, x, y, z);
    this.loadAPISource(url, requestId)
}

//------------------------------------------------------------------------------

SourceManager.prototype.loadAPISource = function (url, requestId) {

    var sourceReceived = function (error, content) {
        if (!error) {
            if (!content) {
                this.errors[requestId] = true;
            } else {
                this.data[requestId] = content;
            }

            this.complete[requestId] = true;
        } else {
            this.errors[requestId] = true;
            this.complete[requestId] = true;
        }
    }.bind(this);

    ajax.get({
        url: url,
        data: null,
        callback: sourceReceived,
        responseType: "arraybuffer",
        async: true
    });
};

//------------------------------------------------------------------------------

SourceManager.prototype.loadImage = function (sourceId, x, y, z, wmsBounds) {

    var url = wmsBounds ? this.getWMSURL(sourceId, wmsBounds)
                        : this.getImageURL(sourceId, x, y, z);

    var requestId = getRequestId(sourceId, x, y, z);

    if (this.requests[requestId])
        return;

    this.requests[requestId] = new Image();

    // blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
    // no credentials flag. Same as img.crossOrigin='anonymous'
    this.requests[requestId].crossOrigin = '';

    this.requests[requestId].onload = function (oEvent) {
        var img = this.requests[requestId];
        this.errors[requestId] = false;
        this.complete[requestId] = true;
        this.data[requestId] = img;
    }.bind(this);

    this.requests[requestId].onerror = function (oEvent) {
        this.errors[requestId] = true;
        this.complete[requestId] = true;
    }.bind(this);

    this.requests[requestId].abort = function () {
        this.requests[requestId].src = "";
    }.bind(this);

    this.requests[requestId].src = url;
};

//------------------------------------------------------------------------------

SourceManager.prototype.getImageURL = function (sourceId, tx, ty, z) {

    var gty = (Math.pow(2, z) - 1) - ty,
        server = ['a', 'b', 'c', 'd'];

    switch (sourceId) {

        case Source.MAPERIAL_EARTHLIGHT:
            return Maperial.staticURL +
                        '/tiles/earthlight/earth_' +
                        tx + '_' +
                        ty + '_' +
                        z + '.png';

        case Source.MAPERIAL_AEROSOL:
            return Maperial.staticURL +
                        '/tiles/aerosol/aerosol_' +
                        tx + '_' +
                        ty + '_' +
                        z + '.png';

        case Source.MAPERIAL_NDVI:
            return Maperial.staticURL +
                        '/tiles/ndvi/ndvi_' +
                        tx + '_' +
                        ty + '_' +
                        z + '.png';

        case Source.MAPERIAL_SRTM:
            return Maperial.staticURL +
                        '/tiles/srtm/retiled_' +
                        tx + '_' +
                        ty + '_' +
                        z + '.png';

        case Source.MAPERIAL_SST:
            return Maperial.staticURL +
                        '/tiles/sst/sst_' +
                        tx + '_' +
                        ty + '_' +
                        z + '.png';

        // check http://developer.mapquest.com/web/products/open/map
        case Source.IMAGES_MAPQUEST:
            var r = utils.random1(4);
            return 'http://otile' + r +
                    '.mqcdn.com/tiles/1.0.0/osm/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.png';

        // check http://developer.mapquest.com/web/products/open/map
        case Source.IMAGES_MAPQUEST_SATELLITE:
            var r = utils.random1(4);
            return 'http://otile' + r +
                    '.mqcdn.com/tiles/1.0.0/sat/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.png';

        case Source.IMAGES_OCM:
            var s = utils.random0(2);
            return 'http://' + server[s] +
                    '.tile.opencyclemap.org/cycle/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.png';

        case Source.IMAGES_OCM_TRANSPORT:
            var s = utils.random0(3);
            // 10/528-354.png
            return 'http://mtc' + s +
                    '.meilleursagents.com/www_pricemap_fr/2015-02-01/' +
                    z + '/' +
                    tx + '-' +
                    gty + '.png';

            // return 'http://' + server[s] +
            //         '.tile2.opencyclemap.org/transport/' +
            //         z + '/' +
            //         tx + '/' +
            //         gty + '.png';

        case Source.IMAGES_OCM_LANDSCAPE:
            var s = utils.random0(2);
            return 'http://' + server[s] +
                    '.tile3.opencyclemap.org/landscape/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.png';

        case Source.IMAGES_OCM_TRANSPORT_DARK:
            var s = utils.random0(2);
            return 'http://' + server[s] +
                    '.tile3.opencyclemap.org/transport-dark/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.png';

        case Source.IMAGES_OCM_OUTDOORS:
            var s = utils.random0(2);
            return 'http://' + server[s] +
                    '.tile3.opencyclemap.org/outdoors/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.png';

        case Source.IMAGES_STAMEN_WATERCOLOR:
            var s = utils.random0(3);
            return 'http://' + server[s] +
                    '.tile.stamen.com/watercolor/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.jpg';

        case Source.IMAGES_STAMEN_TERRAIN: // US only
            var s = utils.random0(3);
            return 'http://' + server[s] +
                    '.tile.stamen.com/terrain/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.jpg';

        case Source.IMAGES_STAMEN_TONER:
            var s = utils.random0(3);
            return 'http://' + server[s] +
                    '.tile.stamen.com/toner/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.png';

        case Source.IMAGES_STAMEN_TONER_BG:
            var s = utils.random0(3);
            return 'http://' + server[s] +
                    '.tile.stamen.com/toner-background/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.png';

        // http://wiki.openstreetmap.org/wiki/Tile_usage_policy
        case Source.IMAGES_OSM:
        default:
            var s = utils.random0(2);
            return 'http://' + server[s] +
                    '.tile.openstreetmap.org/' +
                    z + '/' +
                    tx + '/' +
                    gty + '.png';

    };

// // Use google API
// case Source.IMAGES_GOOGLE_SATELLITE :
// return 'http://khm1.google.com/kh/v=121&x='+tx+'&y='+gty+'&z='+z
// case Source.IMAGES_GOOGLE_TERRAIN :
// return 'http://mt0.googleapis.com/vt?x='+tx+'&y='+gty+'&z='+z;

// PB JPG ?
// case Source.IRS_SATELLITE:
// return 'http://irs.gis-lab.info/?layers=landsat&request=GetTile&z='+z+'&x='+tx+'&y='+gty;
// //http://irs.gis-lab.info/

// // Check nokia

// http://www.neongeo.com/wiki/doku.php?id=map_servers

};

//------------------------------------------------------------------------------

SourceManager.prototype.getWMSURL = function (sourceId, bounds) {

    switch (sourceId) {

        //http://www.mapmatters.org/wms/602246
        case Source.WMS_BRETAGNECANTONS:
            return (
                Maperial.apiURL +
                '/geo1?SERVICE=WMS&LAYERS=bzh%3ACANTON&FORMAT=image%2Fpng' +
                '&VERSION=1.1.1&REQUEST=GetMap&SRS=EPSG%3A900913&BBOX=' +
                bounds.topLeft.x     + ',' +
                bounds.topLeft.y     + ',' +
                bounds.bottomRight.x + ',' +
                bounds.bottomRight.y +
                '&WIDTH='     + Maperial.tileSize +
                '&HEIGHT='    + Maperial.tileSize
            );

        //http://www.mapmatters.org/wms/647145
        case Source.WMS_FRANCECOURSDEAU:
            return (
                Maperial.apiURL +
                '/geo2?SERVICE=WMS&LAYERS=france%3Arh_france_1000ha' +
                '&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng' +
                '&VERSION=1.1.1&REQUEST=GetMap&STYLES=' +
                '&EXCEPTIONS=application%2Fvnd.ogc.se_inimage' +
                '&SRS=EPSG%3A900913&BBOX=' +
                bounds.topLeft.x     + ',' +
                bounds.topLeft.y     + ',' +
                bounds.bottomRight.x + ',' +
                bounds.bottomRight.y +
                '&WIDTH='     + Maperial.tileSize +
                '&HEIGHT='    + Maperial.tileSize
            );

        //http://www.mapmatters.org/wms/647148
        case Source.WMS_SOLS_ILEETVILAINE:
            return (
                Maperial.apiURL +
                '/geo2?SERVICE=WMS&LAYERS=igcs%3Aucs35&ISBASELAYER=false' +
                '&TRANSPARENT=true&FORMAT=image%2Fpng' +
                '&VERSION=1.1.1&REQUEST=GetMap&STYLES=' +
                '&EXCEPTIONS=application%2Fvnd.ogc.se_inimage' +
                '&SRS=EPSG%3A900913&BBOX=' +
                bounds.topLeft.x     + ',' +
                bounds.topLeft.y     + ',' +
                bounds.bottomRight.x + ',' +
                bounds.bottomRight.y +
                '&WIDTH='     + Maperial.tileSize +
                '&HEIGHT='    + Maperial.tileSize
            );

        case Source.WMS_CORINE_LAND_COVER:
            return (
                Maperial.apiURL +
                '/geo3?SERVICE=WMS&LAYERS=topp%3ACLC06_WGS&ISBASELAYER=false' +
                '&TRANSPARENT=true&FORMAT=image%2Fpng' +
                '&VERSION=1.1.1&REQUEST=GetMap&STYLES=' +
                '&EXCEPTIONS=application%2Fvnd.ogc.se_inimage' +
                '&SRS=EPSG%3A900913&BBOX=' +
                bounds.topLeft.x     + ',' +
                bounds.topLeft.y     + ',' +
                bounds.bottomRight.x + ',' +
                bounds.bottomRight.y +
                '&WIDTH='     + Maperial.tileSize +
                '&HEIGHT='    + Maperial.tileSize
            );

            //          case Source.WMS4:
            // http://www.mapmatters.org/wms/624097
            // http://www.mapmatters.org/wms/603594
            // http://www.mapmatters.org/server/4114
            //  (leurs png n'ont pas dalpha :( )
            // Bretagne : http://www.mapmatters.org/server/3525

            //          break;

        default:
            return (
                source.params.src + '&BBOX=' +
                bounds.topLeft.x         + ',' +
                bounds.topLeft.y         + ',' +
                bounds.bottomRight.x     + ',' +
                bounds.bottomRight.y     +
                '&WIDTH='         + Maperial.tileSize +
                '&HEIGHT='        + Maperial.tileSize
            );

    };
};

//------------------------------------------------------------------------------
//- PRIVATE
//------------------------------------------------------------------------------

function getRequestId(sourceId, x, y, z) {
    return sourceId + '_' + x + '_' + y + '_' + z;
}

//------------------------------------------------------------------------------

module.exports = SourceManager;
