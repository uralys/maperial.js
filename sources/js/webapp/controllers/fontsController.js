
(function() {
	'use strict';

	var FontsController = Ember.ObjectController.extend({});

	//==================================================================//

	FontsController.renderUI = function()
	{

	}

	FontsController.cleanUI = function()
	{
		
	}

	//==================================================================//
	// Controls

	App.FontsController = FontsController;

	//==================================================================//
	// Routing

	App.FontsRouting = App.Page.extend({
		route: '/fonts',
	
		connectOutlets: function(router){
			App.Router.openPage(router, "fonts");
		}
	});

	//==================================================================//

})();