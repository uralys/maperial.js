
(function() {
	'use strict';

	var PresentationController = Ember.ObjectController.extend({});

	//==================================================================//

	PresentationController.renderUI = function()
	{
	   
	}

	PresentationController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.PresentationController = PresentationController;

	//==================================================================//
	// Routing

	App.PresentationRouting = App.Page.extend({
		route: '/presentation',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "presentation");
		},
		
	});

	//==================================================================//

})();

