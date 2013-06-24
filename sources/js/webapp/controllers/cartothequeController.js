
(function() {
	'use strict';

	var CartothequeController = Ember.ObjectController.extend({});

	//==================================================================//

	CartothequeController.renderUI = function()
	{
	   var options = {
         name:"maperialDemos",
         width : "80%",
         height : "100%"
	   }
	   
	   var config = CartothequeController.config2()
	   
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
	
	
	CartothequeController.config2 = function()
	{
	   var config = ConfigManager.emptyConfig();
	   config.map.defaultZoom = 13
	   
	   var anchor1Config = ConfigManager.emptyConfig();
	   anchor1Config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_STAMEN_WATERCOLOR))
	   
	   var anchor1 = {
	      type       : Maperial.LENS,
	      name       : "Anchor1",
	      config     : anchor1Config,
         width      : "350",
         height     : "350",
	      position   : { 
	         left    : "20%", 
	         top     : "35%" 
	      },
	      zoomable   : false,
	      deltaZoom  : 0
	   }

	   var anchor2Config = ConfigManager.emptyConfig();
	   anchor2Config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_OCM_TRANSPORT))
	   
	   var anchor2 = {
	      type       : Maperial.LENS,
	      name       : "Anchor2",
	      config     : anchor2Config,
	      width      : "370",
	      height     : "370",
	      position   : { 
	         right   : "25%", 
	         bottom  : "35%" 
	      },
	      zoomable   : false,
	      deltaZoom  : 0
	   }
	   
	   config.children.push(anchor1)
	   config.children.push(anchor2)
	   config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_STAMEN_TONER_BG))
	   
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

