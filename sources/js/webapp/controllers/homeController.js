
(function() {
	'use strict';

	var HomeController = Ember.ObjectController.extend({});

	//==================================================================//

	HomeController.renderUI = function()
	{
	   $("area[rel^='prettyPhoto']").prettyPhoto();
	   $(".gallery a[rel^='prettyPhoto']").prettyPhoto({animation_speed:'fast',slideshow:10000, hideflash: true});
	}

	HomeController.cleanUI = function()
	{
	   
	}

	//==================================================================//
	// Controls

	HomeController.openLoginWindow = function() 
	{
		$('#loginWindow').modal();
	}
	
	HomeController.openVideoWindow = function() 
	{
	   window.youtubeManager.openVideoWindow();
	}

	//----------------------------------------------------//

	App.HomeController = HomeController;

	//==================================================================//
	// Routing

	App.HomeRouting = Ember.Route.extend({
		route: '/',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "home");
		},
		
		//-----------------------------------//
		// actions
		
		more: Ember.Route.transitionTo('more'),
		openLoginWindow: function(){App.HomeController.openLoginWindow()},
		showVideo: function(){App.HomeController.openVideoWindow()},
		
		maperialLogin: function(){MaperialAuth.authorize()},

		
	});

	//==================================================================//

})();

