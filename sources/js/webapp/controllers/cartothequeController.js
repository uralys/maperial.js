
(function() {
	'use strict';

	var CartothequeController = Ember.ObjectController.extend({});

	//==================================================================//

	CartothequeController.renderUI = function()
	{
	   
	}

	CartothequeController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.CartothequeController = CartothequeController;

	//==================================================================//
	// Routing

	App.CartothequeRouting = Ember.Route.extend({
		route: '/demos',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "cartotheque");
		},
		
	});

	//==================================================================//

})();

