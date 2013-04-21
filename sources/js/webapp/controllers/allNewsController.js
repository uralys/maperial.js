
(function() {
	'use strict';

	var AllNewsController = Ember.ObjectController.extend({});

	//==================================================================//

	AllNewsController.renderUI = function()
	{
	   
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

