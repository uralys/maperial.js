
(function() {
	'use strict';

	var TeamController = Ember.ObjectController.extend({});

	//==================================================================//

	TeamController.renderUI = function()
	{
      Utils.randomRotate("photoDjoul")
      Utils.randomRotate("photoVivien")
      Utils.randomRotate("photoChris")
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

