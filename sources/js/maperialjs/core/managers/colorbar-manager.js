//------------------------------------------------------------------//

var GradiantColor           = require('../../libs/gradient-color.js'),
    ColorbarData            = require('../models/data/colorbar-data.js'),
    utils                   = require('../../../libs/utils.js'),
    lodash              = require('../../../libs/lodash.js'),
    ajax                    = require('../../../libs/ajax.js');

//------------------------------------------------------------------//

function ColorbarManager(){
   this.colorbarsToLoad    = null;
   this.nextFunction       = null;
}

//-------------------------------------------//

ColorbarManager.prototype.createColorbar = function(options) {

   if(!options){
      options = {
            beginAlphaAtZero : true
      };
   }

   var steps         = options.steps || ColorbarManager.defaultSteps,
       colorbarData  = new ColorbarData({
      beginAlphaAtZero : options.beginAlphaAtZero
   });

   for(var step in steps){
      colorbarData.Set(step, new GradiantColor(steps[step].r, steps[step].g, steps[step].b, steps[step].a));
   }

   var colorbar = this.addColorbar(colorbarData);
   return colorbar;
};

//----------------------------//

ColorbarManager.prototype.addColorbar = function( colorbarData ) {

   var uid = utils.generateUID();

   window.maperialColorbars[uid] = {
         uid      : uid,
         name     : uid,
         data     : colorbarData,   /**  1 common data for every mapview      **/
         tex      : {},             /**  1 tex/mapview                        **/
         version  : -1              /**  force not to be sync to build tex    **/
   };

   return window.maperialColorbars[uid];
}

//-------------------------------------------//

ColorbarManager.prototype.noColorbar = function() {
   return _.isEmpty(window.maperialColorbars);
}

//-------------------------------------------//

ColorbarManager.prototype.getColorbar = function(uid){
   return window.maperialColorbars[uid];
}

//-------------------------------------------//

ColorbarManager.prototype.fetchColorbars = function(colorbarUIDs, next) {

   this.nextFunction = next;

   if(colorbarUIDs.length > 0){
      var colorbarUID = colorbarUIDs.shift();
      this.colorbarsToLoad = colorbarUIDs;
      this.loadColorbar(colorbarUID);
   }
   else{
      next();
   }
};

//-------------------//

ColorbarManager.prototype.loadColorbar = function(colorbarUID) {

   if(window.maperialColorbars[colorbarUID]){
      this.loadNextColorbar();
      return;
   }
   var colorbarURL = this.getURL(colorbarUID);
   console.log("  fetching : " + colorbarURL);

   var colobarReceived = function(error, json){
       if(!error){
           var cb = new ColorBarData ( );
           cb.FromJson (json);
           this.SetColorBar (colorbarUID,cb );
           this.loadNextColorbar();
       }
   }.bind(this);

   ajax.get(
       colorbarURL,
       null,
       colobarReceived,
       true
   );
};

//----------------------------//

ColorbarManager.prototype.loadNextColorbar = function() {
   this.fetchColorbars(this.colorbarsToLoad, this.nextFunction);
};

//----------------------------//

ColorbarManager.prototype.getURL = function(colorbarUID) {
   return Maperial.apiURL + "/api/colorbar/" + colorbarUID;
};

//----------------------------//

ColorbarManager.defaultSteps = {

      "0.0" : {
         "r" : 0.0,
         "g" : 0.0,
         "b" : 1.0,
         "a" : 0.0
      },

      "0.10" : {
         "r" : 0.0,
         "g" : 0.0,
         "b" : 1.0,
         "a" : 1.0
      },

      "0.15" : {
         "r" : 0.0,
         "g" : 1.0,
         "b" : 1.0,
         "a" : 1.0
      },

      "0.45" : {
         "r" : 0.0,
         "g" : 1.0,
         "b" : 0.0,
         "a" : 1.0
      },

      "0.75" : {
         "r" : 1.0,
         "g" : 1.0,
         "b" : 0.0,
         "a" : 1.0
      },

      "1.0" : {
         "r" : 1.0,
         "g" : 0.0,
         "b" : 0.0,
         "a" : 1.0
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
