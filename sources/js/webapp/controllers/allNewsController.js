
(function() {
	'use strict';

	var AllNewsController = Ember.ObjectController.extend({});

	//==================================================================//

	AllNewsController.renderUI = function()
	{
      for(var i = 0; i < 100; i++){
         Utils.randomRotate("imageNews"+i)
      }
	}

	AllNewsController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.AllNewsController = AllNewsController;

	//==================================================================//
	// Routing

	App.AllNewsRouting = App.Page.extend({
		route: '/news',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "allNews");
		},
		
	});

	//==================================================================//

})();

