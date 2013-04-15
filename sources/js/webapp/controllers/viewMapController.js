
(function() {
   'use strict';

   //==================================================================//

   var ViewMapController = Ember.ObjectController.extend({});

   //==================================================================//

   ViewMapController.renderUI = function()
   {
      App.user.set("isViewingAMap", true);
      
      var config = App.user.selectedMap.config;
      App.addMargins(config);
      
      App.maperial.apply(config);
   }
   
   //-----------------------------------------//

   ViewMapController.close = function()
   {
      App.user.set("isViewingAMap", false);  
      App.user.set("selectedMap", null);  
   }

   //==================================================================//

   App.ViewMapController = ViewMapController;

   //==================================================================//
   // Routing

   App.ViewMapRouting = Ember.Route.extend({
      route: '/map',

      connectOutlets: function(router) {
         App.Router.openPage(router, "viewMap");
      }

   });

   //==================================================================//

})();

