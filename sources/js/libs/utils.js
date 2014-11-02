//----------------------------//

function Utils() {};

//----------------------------//

/*
 * zeroPad(5, 2) 	--> "05"
   zeroPad(1234, 2) --> "1234"
 */
Utils.prototype.zeroPad = function (num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
};

/*
 * now as YYYY-MM-DD
 */
Utils.prototype.dateTime = function () {
    var now = new Date();
    return now.getFullYear() + "-" + this.zeroPad(now.getMonth() + 1, 2) + "-" + this.zeroPad(now.getDate(), 2);
};

//----------------------------------------------------------------------------------------//
/*
 */
Utils.prototype.replaceAll = function (chain, value, replacement) {
    return chain.replace(new RegExp(value, 'g'), replacement);
};

//----------------------------------------------------------------------------------------//

Utils.prototype.rgbToHex = function (r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
};

//----------------------------------------------------------------------------------------//

/***
 * bytes = 36550
 * return 36.55 KB
 */
Utils.prototype.formatFileSize = function (bytes) {
    if (typeof bytes !== 'number') {
        return '';
    }
    if (bytes >= 1000000000) {
        return (bytes / 1000000000).toFixed(2) + ' GB';
    }
    if (bytes >= 1000000) {
        return (bytes / 1000000).toFixed(2) + ' MB';
    }
    return (bytes / 1000).toFixed(2) + ' KB';
};
//----------------------------------------------------------------------------------------//

/***
 * timestamp = 1355342389711
 * return 12/12/2012
 *
 * timestamp = undefined => use today.
 *
 * @Improve #MAP-12
 */
Utils.prototype.formatDate = function (timestamp) {
    var now = timestamp == undefined ? new Date() : new Date(timestamp);
    var day = this.zeroPad(now.getDate(), 2);
    var month = this.zeroPad(now.getMonth() + 1, 2); //Months are zero based
    var year = now.getFullYear();

    return day + "/" + month + "/" + year;
};

//----------------------------------------------------------------------------------------//

//return 1->i
Utils.prototype.random1 = function (i) {
    return Math.floor(Math.random() * i) + 1;
};

//return 0->i
Utils.prototype.random0 = function (i) {
    return Math.floor(Math.random() * (i + 1));
};

//----------------------------------------------------------------------------------------//

Utils.prototype.generateUID = function () {
    var timestamp = new Date().getTime().toString(16);
    var random = (Math.random() * Math.pow(2, 32)).toString(16);

    return timestamp + random;
};

//----------------------------------------------------------------------------------------//

Utils.prototype.popup = function (url, title, width, height) {
    var left = (screen.width / 2) - (width / 2);
    var top = (screen.height / 2) - (height / 2);
    return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left);
};

//----------------------------------------------------------------------------------------//

Utils.prototype.isObject = function (stuff) {
    return Object.prototype.toString.call(stuff) === '[object Object]';
}

//----------------------------------------------------------------------------------------//

Utils.prototype.styleThumbURL = function (styleUID, size) {
    return this.thumbURL(styleUID, "style", size);
};

Utils.prototype.colorbarThumbURL = function (colorbarUID) {
    return this.thumbURL(colorbarUID, "colorbar");
};

//----------------------------------------------------------------------------------------//

Utils.prototype.thumbURL = function (uid, type, size) {
    if (uid == undefined || uid == null)
        return "";

    if (size == undefined || size == null)
        size = "";
    else
        size = "_" + size;

    var end = uid.substring(uid.length - 4);
    var folders = end.split("");

    var url = "http://static.maperial.com/thumbs/" + type;
    folders.forEach(function (folder) {
        url += "/" + folder;
    });

    return url + "/" + uid + size + ".png";
};

//----------------------------------------------------------------------------------------//

Utils.prototype.getSourceThumb = function (layer) {

    switch (layer.source.type) {
    case Source.MaperialOSM:
        return " src=\"" + this.styleThumbURL(layer.params.styles[layer.params.selectedStyle], "l") + "\"";

    case Source.Vector:
    case Source.Images:
    case Source.WMS:
        return " src=\"http://192.168.1.19/p/maperial/web/static/images/icons/layer." + layer.source.params.src + ".png\"";

    case Source.Raster:
        return " src=\"http://192.168.1.19/p/maperial/web/static/images/icons/layer.raster.png\""; // TODO : thumb du raster
    }

    switch (layer.type) {
    case LayersManager.ReTiler:
        return " src=\"http://192.168.1.19/p/maperial/web/static/images/icons/layer.ReTiler.png\"";

    case LayersManager.Shade: // TODO fuse with ReTiler ???
    default:
        return " src=\"http://192.168.1.19/p/maperial/web/static/images/icons/layer.shade.png\"";
    }
};

//----------------------------------------------------------------------------------------//

Utils.prototype.getPoint = function (event) {
    return {
        x: event.gesture.center.clientX,
        y: event.gesture.center.clientY
    };
};

/**
 * param  point : Point with coordinates in pixels, in the Canvas coordinates system
 * return mouseM : Point with coordinates in meters, in the Meters coordinates system
 */
Utils.prototype.converToMeters = function (canvas, context, point) {

    var w = canvas.width,
        h = canvas.height,

        centerP = context.coordS.MetersToPixels(
            context.centerM.x,
            context.centerM.y,
            context.zoom
        ),

        shiftX = w / 2 - point.x,
        shiftY = h / 2 - point.y,

        meters = context.coordS.PixelsToMeters(
            centerP.x - shiftX,
            centerP.y + shiftY,
            context.zoom
        );

    return meters;
};

//----------------------------------------------------------------------------------------//

Utils.prototype.randomRotate = function (element) {

    var rotation = this.random0(15) - 8;
    if (Math.abs(rotation) < 2)
        this.randomRotate(element);
    else {

        //       node.style.transform = style;
        //       node.style.webkitTransform = style;
        //       node.style.mozTransform = style;
        //
        //
        //      $("#"+element).css("-webkit-transform", "rotate("+rotation+"deg)")
        //      $("#"+element).css("-moz-transform", "rotate("+rotation+"deg)")
    }

};

//----------------------------------------------------------------------------------------//

Utils.prototype.prepareOptions = function (options, mainParam) {

    if (options === undefined) {
        return null;
    } else if (typeof options == "string") {
        var value = options,
            newOptions = {};

        newOptions[mainParam] = value;
        return newOptions;
    } else if (options[mainParam] === undefined) {
        console.log("Could not find " + mainParam + ". Check your options.");
        return null;
    } else
        return options;
};

//----------------------------------------------------------------------------------------//

//Utils.prototype.cloneJsonObject = function (jsonObject) {
//   return $.parseJSON(JSON.stringify(jsonObject));
//}
//
//Utils.prototype.odump = function(o){
//   console.log(this.cloneJsonObject(o));
//}

//------------------------------------------------------------------//

module.exports = new Utils();
