
(function() {
	'use strict';

	var IconsController = Ember.ObjectController.extend({});

	//==================================================================//

	IconsController.renderUI = function()
	{

	}

	IconsController.cleanUI = function()
	{
		
	}

	//==================================================================//
	// Controls

	App.IconsController = IconsController;

	//==================================================================//
	// Routing

	App.IconsRouting = Ember.Route.extend({
		route: '/icons',
	
		connectOutlets: function(router){
			App.Router.openPage(router, "icons");
		}
	});

	//==================================================================//

})();