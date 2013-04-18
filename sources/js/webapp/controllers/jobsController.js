
(function() {
	'use strict';

	var JobsController = Ember.ObjectController.extend({});

	//==================================================================//

	JobsController.renderUI = function()
	{
	   
	}

	JobsController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.JobsController = JobsController;

	//==================================================================//
	// Routing

	App.JobsRouting = Ember.Route.extend({
		route: '/jobs',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "jobs");
		},
		
	});

	//==================================================================//

})();

