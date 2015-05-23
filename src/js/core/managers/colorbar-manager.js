//------------------------------------------------------------------//

var GradiantColor = require('../../libs/gradient-color.js'),
    ColorbarData = require('../models/data/colorbar-data.js'),
    utils = require('../../libs/utils.js'),
    ajax = require('../../libs/ajax.js');

//------------------------------------------------------------------//

function ColorbarManager() {
    this.colorbarsToLoad = null;
    this.nextFunction = null;

    this.initDefaultColorbarData();
}

//-------------------------------------------//

ColorbarManager.prototype.initDefaultColorbarData = function () {

    if (!Maperial.defaultColorbarData) {
        Maperial.defaultColorbarData = new ColorbarData({
            beginAlphaAtZero: true
        });

        var steps = ColorbarManager.defaultSteps;

        for (var step in steps) {
            Maperial.defaultColorbarData.Set(step, new GradiantColor(
                steps[step].r,
                steps[step].g,
                steps[step].b,
                steps[step].a
            ));
        }

    }
}

//-------------------------------------------//

ColorbarManager.prototype.defaultColorbar = function (mapView, options) {
    return this.addColorbar(mapView, Maperial.defaultColorbarData);
};

//----------------------------//

ColorbarManager.prototype.addColorbar = function (mapView, colorbarData) {

    var uid = utils.generateUID();

    Maperial.colorbars[uid] = {
        uid: uid,
        name: uid,
        mapView: mapView,
        data: colorbarData,
        /*  1 common data for every mapview      **/
        version: -1,
        /*  force not to be sync to build tex    **/
        tex: null,
    };

    return Maperial.colorbars[uid];
}

//-------------------------------------------//

ColorbarManager.prototype.noColorbar = function () {
    return _.isEmpty(Maperial.colorbars);
}

//-------------------------------------------//

ColorbarManager.prototype.getColorbar = function (uid) {
    return Maperial.colorbars[uid];
}

//-------------------------------------------//

ColorbarManager.prototype.fetchColorbars = function (colorbarUIDs, next) {

    this.nextFunction = next;

    if (colorbarUIDs.length > 0) {
        var colorbarUID = colorbarUIDs.shift();
        this.colorbarsToLoad = colorbarUIDs;
        this.loadColorbar(colorbarUID);
    } else {
        next();
    }
};

//-------------------//

ColorbarManager.prototype.loadColorbar = function (colorbarUID) {

    if (Maperial.colorbars[colorbarUID]) {
        this.loadNextColorbar();
        return;
    }
    var colorbarURL = this.getURL(colorbarUID);
    console.log("  fetching : " + colorbarURL);

    var colobarReceived = function (error, json) {
        if (!error) {
            var cb = new ColorBarData();
            cb.FromJson(json);
            this.SetColorBar(colorbarUID, cb);
            this.loadNextColorbar();
        }
    }.bind(this);

    ajax.get({
        url: colorbarURL,
        data: null,
        callback: colobarReceived,
        responseType: 'json',
        async: true
    });
};

//----------------------------//

ColorbarManager.prototype.loadNextColorbar = function () {
    this.fetchColorbars(this.colorbarsToLoad, this.nextFunction);
};

//----------------------------//

ColorbarManager.prototype.getURL = function (colorbarUID) {
    return Maperial.apiURL + "/api/colorbar/" + colorbarUID;
};

//----------------------------//

ColorbarManager.defaultSteps = {

    "0.0": {
        "r": 0.0,
        "g": 0.0,
        "b": 1.0,
        "a": 0.0
    },

    "0.10": {
        "r": 0.0,
        "g": 0.0,
        "b": 1.0,
        "a": 1.0
    },

    "0.15": {
        "r": 0.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
    },

    "0.45": {
        "r": 0.0,
        "g": 1.0,
        "b": 0.0,
        "a": 1.0
    },

    "0.75": {
        "r": 1.0,
        "g": 1.0,
        "b": 0.0,
        "a": 1.0
    },

    "1.0": {
        "r": 1.0,
        "g": 0.0,
        "b": 0.0,
        "a": 1.0
    },
}

/*
ColorbarManager.prototype.convertJsonToData = function(colorbarJson) {

   var data = [];
   var previousStep = 0;
   for (var i in colorbarJson) {
      for ( var n = previousStep; n <= parseInt(i); n++) {
         data.push ( colorbarJson[i].r );
         data.push ( colorbarJson[i].g );
         data.push ( colorbarJson[i].b );
         data.push ( colorbarJson[i].a * 255 );
      }

      previousStep = n;
   }

   return new Uint8Array(data);
}
*/

//------------------------------------------------------------------//

module.exports = ColorbarManager;
