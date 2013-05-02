
(function() {
	'use strict';

	var FeaturesController = Ember.ObjectController.extend({});

	//==================================================================//

	FeaturesController.renderUI = function()
	{
	   
	}

	FeaturesController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.FeaturesController = FeaturesController;

	//==================================================================//
	// Routing

	App.FeaturesRouting = App.Page.extend({
		route: '/features',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "features");
		},
		
	});

	//==================================================================//

})();

