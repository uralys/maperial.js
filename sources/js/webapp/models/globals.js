(function() {
   'use strict';

   var Globals = Ember.Object.extend({

      //-------------------------------------------//

      HEADER_HEIGHT: 67,
      FOOTER_HEIGHT: 67,

      RASTER_DEFAULT_ZMIN: 4,
      RASTER_DEFAULT_ZMAX: 10,

      //-------------------------------------------//

      isLocal: (window.location.hostname == "maperial.localhost" || window.location.hostname == "maperial.localhost.deploy") ,
      debug: false,
      mapServer: '//maperial.com',
      apiKey: 'AIzaSyCrc-COPNAP_0ysMjr8ySruAnfmImnFuH8',
      scopes: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      googleClientId : (window.location.hostname == "maperial.localhost" || window.location.hostname == "maperial.localhost.deploy") ? '643408271777.apps.googleusercontent.com' : '643408271777-ss5bnucbnm5vv5gbpn0jpqcufph73das.apps.googleusercontent.com',
      ASSETS_URL : (window.location.hostname == "maperial.localhost" || window.location.hostname == "maperial.localhost.deploy") ? 'http://resources.maperial.localhost' : 'http://assets.maperial.com',
      maperialEmail: "",
      currentView: "",
      parentView: "",
      currentPage: "",
      epsg: [],
      shaders: [],
      separators: [",", ";", "|", "\t"],

      //-------------------------------------------//
      // mapcreation - wizardStepper in header
      isViewLayerCreation: false,
      isViewDatasetSelection: false,
      isViewStyleAndColorbar: false,
      isViewGeneration: false,

      //-------------------------------------------//

   });

   //------------------------------------------------------//

   App.Globals = Globals.create();

   App.mapManager = new MapManager();
   App.styleManager = new StyleManager();
   App.youtubeManager = new YoutubeManager();
   
   App.initWindowSize(); // we now have HEADER_HEIGHT and FOOTER_HEIGHT : possible to set webappdiv.min-height

   //------------------------------------------------------//
   // create footer email

   var guymal_enc= "ncjjiFkgvho`(eik";
   var email = "";
   for(var i=0;i<guymal_enc.length;++i)
   {
      email += String.fromCharCode(6^guymal_enc.charCodeAt(i));
   }

   App.Globals.set("maperialEmail", email);
  
})( App);
