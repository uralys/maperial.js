
(function() {
	'use strict';

	var TryscreenController = Ember.ObjectController.extend({});

	//==================================================================//

	TryscreenController.renderUI = function()
	{
      App.stylesData.set("selectedStyle", App.publicData.styles[0]);
      App.maperial.apply(TryscreenController.maperialConfig());
	}
	
	TryscreenController.cleanUI = function()
   {
	   App.maperial.reset();
   }
	
   //-----------------------------------------------------------------//

	TryscreenController.maperialConfig = function(){

      var config = App.maperial.emptyConfig();
      
      //----
      config.map.edition = true;
      
      // maperial hud
      config.hud.elements[HUD.SETTINGS]      = {show : true,  type : HUD.TRIGGER,  disableHide : true, disableDrag : true };
      config.hud.elements[HUD.CONTROLS]      = {show : true, type : HUD.PANEL,    label : "Controls", disableDrag : true };
      config.hud.elements[HUD.SCALE]         = {show : true,  type : HUD.PANEL,    label : "Scale",    position : { right: "10", bottom: "10"} };
      config.hud.elements[HUD.GEOLOC]        = {show : true, type : HUD.PANEL,    label : "Location" };
      config.hud.elements[HUD.QUICK_EDIT]    = {show : true,  type : HUD.PANEL,    label : "Style Edition", position : { right: "0", top: "0"}, disableDrag : true  };
      config.hud.elements[HUD.MAGNIFIER]     = {show : true,  type : HUD.PANEL,    label : "Magnifier" };
      
      App.addMargins(config);

      return config;
	}

	//==================================================================//
	// Controls

	App.TryscreenController = TryscreenController;

	//==================================================================//
	// Routing

	App.TryscreenRouting = App.Page.extend({
		route: '/try',
		connectOutlets: function(router){
		   App.finishLoadings("tryscreen") 
		},
      signin: function(){window.location.href="/?login"},
	});

	//==================================================================//

})();