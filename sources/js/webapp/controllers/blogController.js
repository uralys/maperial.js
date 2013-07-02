
(function() {
	'use strict';

	var BlogController = Ember.ObjectController.extend({});

	//==================================================================//

	BlogController.renderUI = function()
	{
	   $("#blogFrame").css("margin-top", App.Globals.HEADER_HEIGHT + "px")
	   $("#blogFrame").css("height", "100%")
	   $("#blogFrame").css("height", ($("#blogFrame").height() - App.Globals.HEADER_HEIGHT) + "px")
	}

	BlogController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.BlogController = BlogController;

	//==================================================================//
	// Routing

	App.BlogRouting = App.Page.extend({
		route: '/blog',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "blog");
		},
		
	});

	//==================================================================//

})();

