
(function() {
	'use strict';

	var PricesController = Ember.ObjectController.extend({});

	//==================================================================//

	PricesController.renderUI = function()
	{
	   
	}

	PricesController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.PricesController = PricesController;

	//==================================================================//
	// Routing

	App.PricesRouting = App.Page.extend({
		route: '/prices',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "prices");
		},
		
	});

	//==================================================================//

})();

