
(function() {
	'use strict';

	var UsechromeController = Ember.ObjectController.extend({});

	//==================================================================//

	UsechromeController.renderUI = function()
	{
	   
	}

	UsechromeController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.UsechromeController = UsechromeController;

	//==================================================================//
	// Routing

	App.UsechromeRouting = App.Page.extend({
		route: '/usechrome',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "usechrome");
		},
		
	});

	//==================================================================//

})();

