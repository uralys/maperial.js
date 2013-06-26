
(function() {
	'use strict';

	var CartothequeController = Ember.ObjectController.extend({});

	//==================================================================//

	CartothequeController.renderUI = function()
	{
	   $("#listDemos").css("max-height", $(window).height() - 105)
	   CartothequeController.maps = []
	   CartothequeController.maps.push(CartothequeController.maps0)
	   CartothequeController.maps.push(CartothequeController.maps1)
	   
	   for(var i = 0; i < CartothequeController.maps.length; i++){
	      Utils.randomRotate("imageDemo"+i)
	   }
	   
	   CartothequeController.openDemo(1)
	}

	CartothequeController.cleanUI = function()
	{
	   App.maperial.destroy()
	}

	//==================================================================//
	
	CartothequeController.openDemo = function(num){

      var options = {
         width    : "80%",
         height   : "100%",
         left     : "20%"
      }

      App.maperial.build(CartothequeController.maps[num](), options)
	}
	
	
	//==================================================================//
	
	CartothequeController.maps0 = function()
	{
	   var config = ConfigManager.newConfig();

//	   var lensConfig = ConfigManager.newConfig();
//	   lensConfig.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_MAPQUEST))
//
//	   var lens = {
//	      type       : Maperial.LENS,
//	      name       : "Lens",
//	      config     : lensConfig,
//	      draggable  : true,
//	      position   : { 
//	         left    : "12%", 
//	         bottom  : "45%" 
//	      },
//	   }

	   var minifierConfig = ConfigManager.newConfig();
	   minifierConfig.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_OCM_TRANSPORT))

	   var minifier = {
	      type       : Maperial.MINIFIER,
	      name       : "Minifier",
	      config     : minifierConfig,
	      width      : "250",
	      height     : "250",
	      position   : { 
	         left    : "15%", 
	         bottom  : "25%" 
	      },
	      borderRadius : 130,
	      padding    : 4,
	      deltaZoom  : -4,
	      zoomable   : false,
	      draggable  : true
	   }

//	   config.children.push(lens)
	   config.children.push(minifier)
	   config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_STAMEN_WATERCOLOR))
	   config.map.latitude = 47.600607
      config.map.longitude = -122.315125
      config.map.defaultZoom = 11
	   
	   return config
	}
	
	//==================================================================//
	
	
	CartothequeController.maps1 = function()
	{
	   var mainConfig   = ConfigManager.newConfig();
	   var anchor1Config   = ConfigManager.newConfig();
	   var anchor2Config   = ConfigManager.newConfig();
	   
	   mainConfig.map.defaultZoom    = 13
	   mainConfig.layers.push        (LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_STAMEN_TONER_BG))
	   anchor1Config.layers.push    (LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_STAMEN_WATERCOLOR))
	   anchor2Config.layers.push    (LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_OCM_TRANSPORT))
	   
	   var mainOptions = {
	      type       : Maperial.MAIN,
	      name       : "maperialDemo1",
	      config     : mainConfig
	   }
	   
	   var anchor1Options = {
	      type       : Maperial.ANCHOR,
	      name       : "Anchor1",
	      config     : anchor1Config,
	      width      : "350",
	      height     : "350",
	      position   : { 
	         left    : "20%", 
	         top     : "35%" 
	      }
	   }

	   var anchor2Options = {
	      type       : Maperial.ANCHOR,
	      name       : "Anchor2",
	      config     : anchor2Config,
	      width      : "370",
	      height     : "370",
	      position   : { 
	         right   : "25%", 
	         bottom  : "35%" 
	      }
	   }
	   
	   var map = {
	      views : [{
	         config  : mainConfig,
	         options : mainOptions,
	      },{
	         config  : anchor1Config,
	         options : anchor1Options,
	      },{
	         config  : anchor2Config,
	         options : anchor2Options,
	      }]
	   }
	      
	   return [map]
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

      openDemo0 : function(){ App.CartothequeController.openDemo(0) },
      openDemo1 : function(){ App.CartothequeController.openDemo(1) },
	})

	//==================================================================//

})();

