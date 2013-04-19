
(function() {
	'use strict';

	var HomeController = Ember.ObjectController.extend({});

	//==================================================================//

	HomeController.renderUI = function()
	{
	  // $(".gallery a[rel^='prettyPhoto']").prettyPhoto({animation_speed:'fast',slideshow:10000, hideflash: true});
	   
	    Galleria.loadTheme('http://static.maperial.localhost/galleria/themes/classic/galleria.classic.min.js');
	    Galleria.run('#galleria');

	    $('#news').codaSlider({
	       dynamicArrowsGraphical:true,
	       width : $(window).width(),
	       autoHeight : false,
	       autoSlide : true
	    });
	    
	    $(window).on(Translator.LANG_CHANGED, function(){
	       window.location.href = "/";
	    });
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

