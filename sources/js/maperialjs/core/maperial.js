//-----------------------------------------------------------------

var MapView                 = require('./map/view.js'),
    SourceManager           = require('./managers/source-manager.js'),
    StyleManager            = require('./managers/style-manager.js'),
    ColorbarManager         = require('./managers/colorbar-manager.js'),
    DynamicalData           = require('./models/data/dynamical-data.js'),
    HeatmapData             = require('./models/data/heatmap-data.js'),
    Source                  = require('./models/source.js'),
    utils                   = require('../../libs/utils.js'),
    environment             = require('../../environment/config.js');

//-----------------------------------------------------------------

function Maperial(options){
   console.log("-----------------------");
   console.log("Creating a Maperial");
   this.options   = options;
   this.views     = {};

   /* global content */
   this.refreshSharedItems();

   /* global entities for API*/
   window.DynamicalData = DynamicalData;
   window.HeatmapData   = HeatmapData;
}

//-----------------------------------------------------------------

Maperial.prototype.refreshSharedItems = function () {
    console.log("Refreshing shared items");

    // cache containing all previously loaded colorbars
    window.maperialColorbars    = window.maperialColorbars || {};

    window.sourceManager        = window.sourceManager  || new SourceManager();
    window.styleManager         = window.styleManager   || new StyleManager();
};

//-----------------------------------------------------------------
//Views types
//TYPE = css class

Maperial.MAIN                    = "maperial-main";
Maperial.ANCHOR                  = "maperial-anchor";

//camera centered on what is under it
Maperial.LENS                    = "maperial-lens";

//camera centered on the parent's center
Maperial.MINIFIER                = "maperial-minifier";

//camera centered on what is under the mouse
Maperial.MAGNIFIER               = "maperial-magnifier";

//-----------------------------------------------------------------
//Vectorial layers types

Maperial.OSM                     = "tiles";
Maperial.VECTORIAL_DATA          = "data";

//-----------------------------------------------------------------

Maperial.staticURL              = environment.staticURL;
Maperial.apiURL                 = 'http://api.maperial.com';
Maperial.tileURL                = 'http://api.maperial.com';

//-----------------------------------------------------------------

Maperial.DEFAULT_ZOOM           = 10;
Maperial.DEFAULT_LATITUDE       = 48.813;
Maperial.DEFAULT_LONGITUDE      = 2.313;

//Clermont City
//Maperial.DEFAULT_LATITUDE       = 45.779017;
//Maperial.DEFAULT_LONGITUDE      = 3.10617;

//-----------------------------------------------------------------

Maperial.bgdimg                 = "symbols/water.png";

Maperial.refreshRate            = 1000/30;   // ms
Maperial.tileDLTimeOut          = 60000;     // ms
Maperial.tileSize               = 256;

Maperial.autoMoveSpeedRate      = 0.2;
Maperial.autoMoveMillis         = 700;
Maperial.autoMoveDeceleration   = 0.005;
Maperial.autoMoveAnalyseSize    = 10;

Maperial.DEFAULT_STYLE_UID      = "1_style_13ed75438c8b2ed8914";
Maperial.DEFAULT_COLORBAR_UID   = "1_colorbar_13c630ec3a5068919c3";

Maperial.AlphaClip              = "AlphaClip";
Maperial.AlphaBlend             = "AlphaBlend";
Maperial.MulBlend               = "MulBlend";

Maperial.globalDataCpt          = 0;

//-----------------------------------------------------------------
// API
//-----------------------------------------------------------------

/**
 * options:
 *
 *    # mandatory ----------
 *
 *       view : "div.id"  (can be used as only param)
 *
 *    # others -------------
 *
 *       type
 *          Maperial.MAIN (default)
 *          Maperial.ANCHOR
 *          Maperial.LENS
 *          Maperial.MINIFIER
 *          Maperial.MAGNIFIER
 *
 *       defaultZoom
 *          default Maperial.DEFAULT_ZOOM
 *
 *       latitude
 *          default Maperial.DEFAULT_LATITUDE
 *
 *       longitude
 *          default Maperial.DEFAULT_LONGITUDE
 *
 */
Maperial.prototype.addView = function (options) {

   //-------------------------------------------
   // Checking options

   utils.prepareOptions(options, "container");

   if(!options){
      console.log("Wrong call to createView. Check the options");
   }

   //-------------------------------------------
   // Checking view

   console.log("Adding view in container " + options.container);

   if(document.getElementById(options.container) == null){
      console.log("Container " + options.container  + " could not be found");
      return;
   }

   options.container = document.getElementById(options.container);

   //-------------------------------------------
   // Set defaults

   if(options.type === undefined){
      options.type = Maperial.MAIN;
   }

   if(options.latitude === undefined){
      options.latitude = Maperial.DEFAULT_LATITUDE;
   }

   if(options.longitude === undefined){
      options.longitude = Maperial.DEFAULT_LONGITUDE;
   }

   //-------------------------------------------
   // Proceed

   var view =  new MapView(this, options);
   this.views[view.id] = view;

   return view;
};

//-----------------------------------------------------------------
// quicker than standalone...
window.Maperial = Maperial;

//-----------------------------------------------------------------

module.exports = Maperial;
