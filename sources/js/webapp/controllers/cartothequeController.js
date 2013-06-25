
(function() {
	'use strict';

	var CartothequeController = Ember.ObjectController.extend({});

	//==================================================================//

	CartothequeController.renderUI = function()
	{
	   $("#listDemos").css("max-height", $(window).height() - 105)
	   CartothequeController.openDemo(1)
	}

	CartothequeController.cleanUI = function()
	{

	}

	//==================================================================//
	
	CartothequeController.openDemo = function(num){

//      App.user.set("waiting", true);
      
      var views, options = {
         width    : "80%",
         height   : "100%",
         left     : "20%"
      }

      var mainViewOptions = {name : "maperialDemos"}
      
	   switch(num){
	      case 1:
	         views = [{
	            options  :  mainViewOptions,
	            config   :   CartothequeController.config1()
	         }]
	         break;

	      case 2:
	         views = [{
	            options  :  mainViewOptions,
	            config   :   CartothequeController.config2()
	         }]
	         break;
	         
	   }

      App.maperial.build(views, options)

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

      openDemo1 : function(){ App.CartothequeController.openDemo(1) },
      openDemo2 : function(){ App.CartothequeController.openDemo(2) },
	});

	//==================================================================//

})();

