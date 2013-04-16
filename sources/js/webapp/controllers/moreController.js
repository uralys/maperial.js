
(function() {
	'use strict';

	var MoreController = Ember.ObjectController.extend({});

	//==================================================================//

	MoreController.renderUI = function()
	{
	   
	}

	MoreController.cleanUI = function()
	{
	   
	}

	//==================================================================//
	// Controls

	MoreController.openLoginWindow = function() 
	{
		$('#loginWindow').modal();
	}
	
	MoreController.openVideoWindow = function() 
	{
	   window.youtubeManager.openVideoWindow();
	}

	//----------------------------------------------------//

	App.MoreController = MoreController;

	//==================================================================//
	// Routing

	App.MoreRouting = Ember.Route.extend({
		route: '/more',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "more");
		},
		
		//-----------------------------------//
		// actions
		
		openTryscreen: function(){  App.finishLoadings("tryscreen") },
		openLoginWindow: function(){App.MoreController.openLoginWindow()},
		showVideo: function(){App.MoreController.openVideoWindow()},
		signin: function(){$("#loginWindow").modal()},
		
		maperialLogin: function(){MaperialAuth.authorize()},
	});

	//==================================================================//

})();

