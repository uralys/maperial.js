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

      App.homeMover = new HomeMover();
      App.resize();

      $(window).resize(function() {
         App.resize();
      });
   }

   //------------------------------------------------------//
   

   App.openPrezi = function() 
   {
      $('#preziWindow').off('reveal:hidden');
      $('#preziWindow').off("reveal:revealed");
      
      $("#preziWindow").reveal({
         animation: 'fade',
         animationspeed: 100, 
      });

      $('#preziWindow').on('reveal:hidden', function(){
         $("#maperialPrezi").remove()
      });

      $('#preziWindow').append("<div class='row-fluid darkest' id='maperialPrezi'>" +
            "<object data='http://prezi.com/e6x5_urdmufe/view' width='100%' height='600px'  ></object >" +
      "</div>")
      
      // center.....dont ask me about the + 285 stuff
      var left = ($(window).width()/2 - $("#preziWindow").width()/2) + 285
      
      $("#preziWindow").css("left",left+"px");
   }

   
   //------------------------------------------------------//

   App.placeFooter = function(forceFix){
      setTimeout(function(){
         if(($("#webappDiv").height() + App.Globals.FOOTER_HEIGHT) < $(window).height() || forceFix){
            $("#footerClassic").css({ position : "fixed" });
            $("#footerHome").css({ position : "fixed" });
         }
         else{
            $("#footerClassic").css({ position : "relative" });
            $("#footerHome").css({ position : "relative" });
         }
      }, 70);
   }

   //------------------------------------------------------//

   App.resize = function() {
      //App.homeScroller.resizeWindow();
   }

   //-------------------------------------//

   $(window).on(MaperialEvents.LOADING, function(){
      App.user.set("waiting", true);
   });

   $(window).on(MaperialEvents.READY, function(){
      App.placeFooter(true);
      App.user.set("waiting", false);
   });

   //-------------------------------------//

   App.finishLoadings = function(nextPage){

      console.log("finish Loading")
      
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
      
      scripts.push("https://maps.googleapis.com/maps/api/js?key=AIzaSyATwlkawyHykpfJF24jcPgL_b8kK8zO2Bc&sensor=false&libraries=places,panoramio&callback=initialize");
      scripts.push("http://fabricjs.com/lib/fabric.js");

      //-------------------------------------------//

      window.scriptLoader.getScripts(scripts, function(){

         //-------------------------------------//

         App.Globals.shaders.push(Maperial.AlphaClip);
         App.Globals.shaders.push(Maperial.AlphaBlend);
         App.Globals.shaders.push(Maperial.MulBlend);

         //-------------------------------------//

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
   }

   App.removeMargins = function(config) {
      delete config.hud.options["margin-top"];
   }

   //------------------------------------------------------//

   App.changedTranslations = function(event, messages) {
      App.translations.set("messages", messages);
   }

})( this );