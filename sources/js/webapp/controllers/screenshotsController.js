
(function() {
	'use strict';

	var ScreenshotsController = Ember.ObjectController.extend({});

	//==================================================================//

	ScreenshotsController.renderUI = function(){
	     // $(".gallery a[rel^='prettyPhoto']").prettyPhoto({animation_speed:'fast',slideshow:10000, hideflash: true});
	      
	       Galleria.loadTheme('http://static.maperial.localhost/galleria/themes/classic/galleria.classic.min.js');
	       Galleria.run('#galleria');
	}

	ScreenshotsController.cleanUI = function(){
	   
	}

	//==================================================================//

	App.ScreenshotsController = ScreenshotsController;

	//==================================================================//
	// Routing

	App.ScreenshotsRouting = Ember.Route.extend({
		route: '/screenshots',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "screenshots");
		},
		
	});

	//==================================================================//

})();

