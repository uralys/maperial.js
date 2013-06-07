(function( win ) {
   'use strict';
   
   win.App = null 
   win.App = Ember.Application.create({
      VERSION: '1.0',
      rootElement: '#webappDiv',
      //storeNamespace: 'todos-emberjs',
      // Extend to inherit outlet support
      ApplicationController: Ember.Controller.extend(),
      ready: function() {
         //	initialisation is done inside model.Globals
      }
   });

   //------------------------------------------------------//
   
   App.Page = Em.Route.extend({
       enter: function(router) {
          window.scrollTo(0, 0);
       }
   });
   
   //------------------------------------------------------//

   App.initWindowSize = function() {

//    App.homeScroller = new HomeScroller();
      App.homeMover = new HomeMover();
      App.resize();

      $(window).resize(function() {
         App.resize();
      });
   }

   //------------------------------------------------------//

   App.placeFooter = function(forceFix){
      setTimeout(function(){
         if(($("#webappDiv").height() + App.Globals.FOOTER_HEIGHT) < $(window).height() || forceFix){
            console.log("fix footer", ($("#webappDiv").height() + App.Globals.FOOTER_HEIGHT), $(window).height(), forceFix);
            $("#footerClassic").css({ position : "fixed" });
            $("#footerHome").css({ position : "fixed" });
         }
         else{
            console.log("release footer");
            $("#footerClassic").css({ position : "relative" });
            $("#footerHome").css({ position : "relative" });
         }
      }, 70);
   }

   //------------------------------------------------------//

   App.resize = function() {
      //App.homeScroller.resizeWindow();
   }

   App.finishLoadings = function(nextPage){

      if(App.Globals.APP_READY){
         App.appReadyToOpenPage(nextPage);
         return;
      }
      
      App.user.set("waiting", true);

      //-------------------------------------------//
      //init getPublicData

      $.ajax({  
         type: "POST",  
         url: "/getPublicData",
         dataType: "json",
         success: function (publicData, textStatus, jqXHR)
         {
            console.log(publicData);

            App.publicData.set("maps", publicData.maps);
            App.publicData.set("styles", publicData.styles);
            App.publicData.set("datasets", publicData.datasets);
            App.publicData.set("colorbars", publicData.colorbars);
            App.publicData.set("fonts", publicData.fonts);
            App.publicData.set("icons", publicData.icons);
         }
      });

      //-------------------------------------------//

      var scripts = [];

      var maperialJSScripts = "";
      
      if(!App.Globals.isDev)
         scripts.push(App.Globals.ASSETS_URL + "/js/maperial-js.min.localhost.js"); 

      scripts.push("http://fabricjs.com/lib/fabric.js");

      //-------------------------------------------//

      window.scriptLoader.getScripts(scripts, function(){

         //-------------------------------------//

         App.Globals.shaders.push(Maperial.AlphaClip);
         App.Globals.shaders.push(Maperial.AlphaBlend);
         App.Globals.shaders.push(Maperial.MulBlend);

         //-------------------------------------//

         $(window).on(MaperialEvents.LOADING, function(){
            App.user.set("waiting", true);
         });

         $(window).on(MaperialEvents.READY, function(){
            App.placeFooter(true);
            App.user.set("waiting", false);
         });

         //-------------------------------------//

         App.maperial = new Maperial();
         App.appReadyToOpenPage(nextPage);

         //-------------------------------------//

         App.user.set("waiting", false);
      });
   }

   App.appReadyToOpenPage = function(page) {
      
      App.Globals.set("APP_READY", true);
      
      if(page == "tryscreen"){
         if(App.Globals.currentPage == "mapCreation"){
            App.MapCreationController.openDemoSelection()
         }
         else{
            App.Globals.set("isTryscreen", true);
            App.mapManager.createNewMap();
            App.get('router').transitionTo('mapCreation');
         }
      }
      else{
         App.Globals.set("isTryscreen", false);
         App.get('router').transitionTo(page);
      }
   }
   
   //------------------------------------------------------//

   App.addMargins = function(config) {
      config.hud.options["margin-top"] = App.Globals.HEADER_HEIGHT;
//      config.hud.options["margin-bottom"] = App.Globals.FOOTER_HEIGHT;
   }

   App.removeMargins = function(config) {
      delete config.hud.options["margin-top"];
//      delete config.hud.options["margin-bottom"];
   }

   //------------------------------------------------------//

   App.changedTranslations = function(event, messages) {
      App.translations.set("messages", messages);
   }


})( this );