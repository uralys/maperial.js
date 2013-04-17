
(function() {
	'use strict';

	var CreditsController = Ember.ObjectController.extend({});

	//==================================================================//

	CreditsController.renderUI = function()
	{
	   
	}

	CreditsController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.CreditsController = CreditsController;

	//==================================================================//
	// Routing

	App.CreditsRouting = Ember.Route.extend({
		route: '/credits',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "credits");
		},
		
	});

	//==================================================================//

})();

