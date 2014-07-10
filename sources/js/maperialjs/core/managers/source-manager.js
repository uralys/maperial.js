
var utils           = require('../../../libs/utils.js'),
    Source          = require('../models/source.js'),
    ajax            = require('../../../libs/ajax.js');

//----------------------------------------------------------------------------

function SourceManager(){

    this.data      = {};
    this.requests  = {};
    this.complete  = {};
    this.errors    = {};

    this.requestsCounter = {};
}

//----------------------------------------------------------------------------

SourceManager.prototype.getData = function ( source, x, y, z ) {
    var requestId = getRequestId(source, x, y, z);
    return this.data[requestId];
};

//----------------------------------------------------------------------------

SourceManager.prototype.releaseNetwork = function () {

    for(var requestId in this.requests){

        if(!this.complete[requestId] || this.errors[requestId] || !this.data[requestId]){
            try{
                this.requests[requestId].abort();
            }
            catch(e){}
        }

        delete this.data[requestId];
        delete this.errors[requestId];
        delete this.complete[requestId];
        delete this.requests[requestId];
    }

};

//----------------------------------------------------------------------------

SourceManager.prototype.release = function (sourceId, x, y, z) {

    var requestId   = getRequestId(sourceId, x, y, z),
        nbRequests  = this.requestsCounter[requestId] || 0;

    if(nbRequests > 1){
        this.requestsCounter[requestId] = nbRequests - 1;
    }
    else{
        if(!this.complete[requestId]){

            try{
                this.requests[requestId].abort();
            }
            catch(e){}
        }

        delete this.data[requestId];
        delete this.errors[requestId];
        delete this.complete[requestId];
        delete this.requests[requestId];
    }
};

//----------------------------------------------------------------------------

SourceManager.prototype.loadVectorial = function ( sourceId, x, y, z ) {
    var url         = Maperial.apiURL + "/api/tile?x="+x+"&y="+y+"&z="+z,
        requestId   = getRequestId(sourceId, x, y, z);
    this.loadAPISource(url, requestId);
};

SourceManager.prototype.loadShade = function ( x, y, z ) {
   var url         = Maperial.apiURL + "/api/srtm?x="+x+"&y="+y+"&z="+z,
    // var url         = Maperial.apiURL + "/api/ReTiler?x="+x+"&y="+y+"&z="+z,
        requestId   = getRequestId(Source.Shade, x, y, z);
    this.loadAPISource(url, requestId);
};

// à analyser : ReTiler (not sade but anything)
SourceManager.prototype.loadReTiler = function ( sourceId, x, y, z ) {
    var url         = "/api/ReTiler?x="+tx+"&y="+ty+"&z="+z,
        requestId   = getRequestId(sourceId, x, y, z);
    this.loadAPISource(url, requestId)
}

//----------------------------------------------------------------------------

SourceManager.prototype.loadAPISource = function ( url, requestId ) {

    var sourceReceived = function(error, content){
        if(!error){
            if ( ! content ) {
                this.errors[requestId]  = true;
            }
            else {
                this.data[requestId]    = content;
            }

            this.complete[requestId]    = true;
        }
        else{
            this.errors[requestId]      = true;
            this.complete[requestId]    = true;
        }
    }.bind(this);

    ajax.get(
        url,
        null,
        sourceReceived,
        "arraybuffer",
        true
    );
};

//----------------------------------------------------------------------------

SourceManager.prototype.loadImage = function ( sourceId, x, y, z ) {

    var url        = this.getImageURL(sourceId, x, y, z),
        requestId  = getRequestId(sourceId, x, y, z);

    if(this.requests[requestId])
        return;
    
    this.requests[requestId] = new Image();

    //http://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
    this.requests[requestId].crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'

    this.requests[requestId].onload = function (oEvent) {
        console.log("onload : requestId : " + requestId);
        var img                     = this.requests[requestId];
        this.errors[requestId]      = false;
        this.complete[requestId]    = true;
        this.data[requestId]        = img;
    }.bind(this);

    this.requests[requestId].onerror = function (oEvent) {
        console.log("ON ERROR : requestId : " + requestId);
        this.errors[requestId]    = true;
        this.complete[requestId]  = true;
    }.bind(this);

    this.requests[requestId].abort = function () {
        console.log("ABORT : requestId : " + requestId);
        this.requests[requestId].src = "";
    }.bind(this);

    this.requests[requestId].src = url;
};

//----------------------------------------------------------------------------

//à analyser : ancien loadRaster, ou passage par loadAPISource ?

//SourceManager.prototype.LoadRaster = function ( source, x, y, z ) {

//var requestId = getRequestId(source, x, y, z);

//if ( ! this.getURL(source, x, y, z) ) {
//this.errors[requestId] = true;
//this.complete[requestId] = true;
//return ;
//}

////https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/Sending_and_Receiving_Binary_Data
////JQuery can not use XMLHttpRequest V2 (binary data)
//var me = this;
//this.requests[requestId] = new XMLHttpRequest();
//this.requests[requestId].open ("GET", this.getURL(source, x, y, z), true);
//this.requests[requestId].responseType = "arraybuffer";

//this.requests[requestId].onload = function (oEvent) {

//var arrayBuffer = me.requests[requestId].response;  // Note: not this.requests[requestId].responseText
//if (arrayBuffer && ( me.requests[requestId].status != 200 || arrayBuffer.byteLength <= 0 )) {
//arrayBuffer = null;
//}

//me.errors[requestId] = arrayBuffer == null;
//me.complete[requestId]  = true;
//me.data[requestId]  = arrayBuffer;

//$(window).trigger(MaperialEvents.SOURCE_READY, [source, me.data[requestId], x, y, z])
//};

//this.requests[requestId].onerror = function (oEvent) {
//me.errors[requestId] = true;
//me.complete[requestId]  = true;
//}

//function ajaxTimeout() {
//if ( ! me.complete[requestId] ) {
//try{
//me.requests[requestId].abort();
//}catch(e){
//console.log("------------> LoadRaster")
//console.log(e)
//}
//}
//}
//var tm = setTimeout(ajaxTimeout, Maperial.tileDLTimeOut);

//this.requests[requestId].send(null);
//}

//----------------------------------------------------------------------------

//SourceManager.prototype.getURL = function (source, tx, ty, z) {

//switch(source.type){

//case Source.MaperialOSM:
//return Maperial.tileURL + "/api/tile?x="+tx+"&y="+ty+"&z="+z;

//case Source.ReTiler:
//return Maperial.tileURL + "/api/ReTiler?x="+tx+"&y="+ty+"&z="+z; // missing an id to identify data type

//case Source.Raster: // fuse with ReTiler ???
//return Maperial.tileURL + "/api/tile/"+source.params.rasterUID+"?x="+tx+"&y="+ty+"&z="+z;

//case Source.Images: // fuse with ReTiler ???
//return this.getImageURL(source, tx, ty, z)

//case Source.WMS:
//return this.getWMSURL(source, tx, ty, z)
//}
//}


SourceManager.prototype.getImageURL = function (sourceId, tx, ty, z) {

    var gty     = (Math.pow ( 2,z ) - 1) - ty,
        server  = ["a", "b", "c", "d"];

    switch (sourceId) {

        case Source.MAPERIAL_EARTHLIGHT : 
            return Maperial.staticURL + "/tiles/earthlight/earth_"+tx+"_"+gty+"_"+z+".png";
            break;


        case Source.IMAGES_MAPQUEST : // need to check http://developer.mapquest.com/web/products/open/map
            var r = utils.random1(4);
            return "http://otile"+r+".mqcdn.com/tiles/1.0.0/osm/"+z+"/"+tx+"/"+gty+".png";
            break;

        case Source.IMAGES_MAPQUEST_SATELLITE : // need to check http://developer.mapquest.com/web/products/open/map
            var r = utils.random1(4);
            return "http://otile"+r+".mqcdn.com/tiles/1.0.0/sat/"+z+"/"+tx+"/"+gty+".png";


        case Source.IMAGES_OCM_CYCLE :
            var s = utils.random0(2);
            return "http://"+server[s]+".tile.opencyclemap.org/cycle/"+z+"/"+tx+"/"+gty+".png";

        case Source.IMAGES_OCM_TRANSPORT :
            var s = utils.random0(2);
            return "http://"+server[s]+".tile2.opencyclemap.org/transport/"+z+"/"+tx+"/"+gty+".png";

        case Source.IMAGES_OCM_LANDSCAPE :
            var s = utils.random0(2);
            return "http://"+server[s]+".tile3.opencyclemap.org/landscape/"+z+"/"+tx+"/"+gty+".png";



        case Source.IMAGES_STAMEN_WATERCOLOR :
            var s = utils.random0(3);
            return "http://"+server[s]+".tile.stamen.com/watercolor/"+z+"/"+tx+"/"+gty+".jpg";

        case Source.IMAGES_STAMEN_TERRAIN : // US only
            var s = utils.random0(3);
            return "http://"+server[s]+".tile.stamen.com/terrain/"+z+"/"+tx+"/"+gty+".jpg";

        case Source.IMAGES_STAMEN_TONER :
            var s = utils.random0(3);
            return "http://"+server[s]+".tile.stamen.com/toner/"+z+"/"+tx+"/"+gty+".png";

        case Source.IMAGES_STAMEN_TONER_BG :
            var s = utils.random0(3);
            return "http://"+server[s]+".tile.stamen.com/toner-background/"+z+"/"+tx+"/"+gty+".png";


        case Source.IMAGES_OSM:  // http://wiki.openstreetmap.org/wiki/Tile_usage_policy
        default :
            var s = utils.random0(2);
        return "http://"+server[s]+".tile.openstreetmap.org/"+z+"/"+tx+"/"+gty+".png";
        break;

//      // Use google API
//      case Source.IMAGES_GOOGLE_SATELLITE :
//      return "http://khm1.google.com/kh/v=121&x="+tx+"&y="+gty+"&z="+z
//      case Source.IMAGES_GOOGLE_TERRAIN :
//      return "http://mt0.googleapis.com/vt?x="+tx+"&y="+gty+"&z="+z;

        // PB JPG ?
//      case Source.IRS_SATELLITE:
//      return "http://irs.gis-lab.info/?layers=landsat&request=GetTile&z="+z+"&x="+tx+"&y="+gty;
//      //http://irs.gis-lab.info/

//      // Check nokia


//      http://www.neongeo.com/wiki/doku.php?id=map_servers
    };

};

//----------------------------------------------------------------------------

/**
 * Source.WMS_BRETAGNECANTONS
 *    geo1 : "http://geobretagne.fr/geoserver/ows?SERVICE=WMS&LAYERS=d22%3AASS_LIN_22&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize
 *
 * Source.WMS_FRANCECOURSDEAU
 * Source.WMS_SOLS_ILEETVILAINE
 *    geo2 : "http://geowww.agrocampus-ouest.fr/geoserver/ows?SERVICE=WMS&LAYERS=france%3Arh_france_1000ha&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize

 * Source.WMS_CORINE_LAND_COVER
 *    geo3 : "http://sd1878-2.sivit.org/geoserver/gwc/service/wms?SERVICE=WMS&LAYERS=topp%3ACLC06_WGS&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize
 */
SourceManager.prototype.getWMSURL = function (source, tx, ty, z) {

    var topLeftP     = new Point(tx * Maperial.tileSize, ty*Maperial.tileSize);
    var topLeftM     = receiver.context.coordS.PixelsToMeters(topLeftP.x, topLeftP.y, receiver.context.zoom);

    var bottomRightP = new Point(topLeftP.x + Maperial.tileSize, topLeftP.y + Maperial.tileSize);
    var bottomRightM = receiver.context.coordS.PixelsToMeters(bottomRightP.x, bottomRightP.y, receiver.context.zoom);

    switch(source.params.src){

        case Source.WMS_BRETAGNECANTONS:
            //http://www.mapmatters.org/wms/602246

            var topLeft       = topLeftM;
            var bottomRight   = bottomRightM;

            return(Maperial.apiURL + "/geo1?SERVICE=WMS&LAYERS=bzh%3ACANTON&FORMAT=image%2Fpng&VERSION=1.1.1&REQUEST=GetMap&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize);
            break;

        case Source.WMS_FRANCECOURSDEAU:
            //http://www.mapmatters.org/wms/647145

            var topLeft       = topLeftM;
            var bottomRight   = bottomRightM;

            return(Maperial.apiURL + "/geo2?SERVICE=WMS&LAYERS=france%3Arh_france_1000ha&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize);
            break;

        case Source.WMS_SOLS_ILEETVILAINE:
            //http://www.mapmatters.org/wms/647148

            var topLeft       = topLeftM;
            var bottomRight   = bottomRightM;

            return(Maperial.apiURL + "/geo2?SERVICE=WMS&LAYERS=igcs%3Aucs35&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize);
            break;

        case Source.WMS_CORINE_LAND_COVER:

            var topLeft       = topLeftM;
            var bottomRight   = bottomRightM;

            return(Maperial.apiURL + "/geo3?SERVICE=WMS&LAYERS=topp%3ACLC06_WGS&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A900913&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize);
            break;


//          case Source.WMS4:
            // http://www.mapmatters.org/wms/624097
            // http://www.mapmatters.org/wms/603594
            // http://www.mapmatters.org/server/4114
            // Bretagne : http://www.mapmatters.org/server/3525   (leurs png n'ont pas dalpha :( )


//          console.log("http://ws.carmen.developpement-durable.gouv.fr/cgi-bin/mapserv?map=/mnt/data_carmen/PACA/Publication/environnement.map&LAYERS=layer227&ISBASELAYER=false&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A2154&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize)
//          break;


            break;

        default :
            var topLeft       = topLeftM;
        var bottomRight   = bottomRightM;

        return(source.params.src + "&BBOX="+topLeft.x+","+topLeft.y+","+bottomRight.x+","+bottomRight.y+"&WIDTH="+Maperial.tileSize+"&HEIGHT="+Maperial.tileSize);

    }
};

//----------------------------------------------------------------------------
//- PRIVATE
//----------------------------------------------------------------------------

function getRequestId (sourceId, x, y, z) {
    return sourceId + "_" + x + "_" + y + "_" + z;
}

//----------------------------------------------------------------------------

module.exports = SourceManager;
