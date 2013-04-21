
(function() {
	'use strict';

	var TeamController = Ember.ObjectController.extend({});

	//==================================================================//

	TeamController.renderUI = function()
	{
	   
	}

	TeamController.cleanUI = function()
	{
	   
	}

	//==================================================================//

	App.TeamController = TeamController;

	//==================================================================//
	// Routing

	App.TeamRouting = App.Page.extend({
		route: '/team',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "team");
		},
		
	});

	//==================================================================//

})();

