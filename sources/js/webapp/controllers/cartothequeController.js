
(function() {
	'use strict';

	var CartothequeController = Ember.ObjectController.extend({});

	//==================================================================//

	CartothequeController.renderUI = function()
	{
	   var options = {
         name:"maperialDemos",
         width : 4*$(window).width()/5,
         height : $(window).height()
	   }
	   
	   var config = CartothequeController.config1()
	   
	   App.maperial.build([{
	      options : options, 
	      config : config
	   }])
	}

	CartothequeController.cleanUI = function()
	{

	}

	//==================================================================//
	
	
	CartothequeController.config1 = function()
	{
	   var config = ConfigManager.emptyConfig();

	   var lensConfig = ConfigManager.emptyConfig();
	   lensConfig.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_MAPQUEST))

	   var lens = {
	      type       : Maperial.LENS,
	      name       : "Lens",
	      config     : lensConfig,
	      draggable  : true,
	      position   : { 
	         left    : "12%", 
	         bottom  : "45%" 
	      },
	   }

	   var minifierConfig = ConfigManager.emptyConfig();
	   minifierConfig.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_STAMEN_WATERCOLOR))

	   var minifier = {
	      type       : Maperial.MINIFIER,
	      name       : "Minifier",
	      config     : minifierConfig,
	      width      : 250,
	      height     : 250,
	      position   : { 
	         right : "25", 
	         top   : "25" 
	      },
	      borderRadius : 130,
	   }

	   config.children.push(lens)
	   config.children.push(minifier)
	   config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_STAMEN_TONER))

	   return config
	}
	
	//==================================================================//

	App.CartothequeController = CartothequeController;

	//==================================================================//
	// Routing

	App.CartothequeRouting = App.Page.extend({
		route: '/demos',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "cartotheque");
		},
		
	});

	//==================================================================//

})();

