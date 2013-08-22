
(function() {
	'use strict';

	var DashboardController = Ember.ObjectController.extend({});

	//==================================================================//
	
	DashboardController.renderUI = function()
	{ 
      //------------------------------------------------------//
      // gather epsg list

      $.get(App.Globals.ASSETS_URL + '/epsg.txt', function(data){
         var lines = data.split("\n");
         for(var i=0; i< lines.length; i++){
            if(lines[i][0] == "#")
               App.Globals.epsg.push(lines[i].substr(2, lines[i].length-2));
         }
      });

	}

	DashboardController.cleanUI = function()
	{
		
	}

	//==================================================================//
	
	DashboardController.refreshExportSlider = function()
	{
	   DashboardController.selectedExportZoom = App.user.selectedMap.config.map.defaultZoom ? App.user.selectedMap.config.map.defaultZoom : 12;
      
      $("#zoomSelector").slider({
         range: "min",
         min: 1,
         max: 18,
         value: DashboardController.selectedExportZoom,
         slide: function( event, ui ) {
            $("#zoomSelector a").html(ui.value);
         },
         change: function( event, ui ) {
            DashboardController.selectedExportZoom = parseInt(ui.value);
         }
       });
      
      $("#zoomSelector a").html(DashboardController.selectedExportZoom);
      Utils.buildSliderStyle("zoomSelector");	   
	}

	//==================================================================//
	// Controls
	
	DashboardController.createMap = function()
	{
	   App.mapManager.createNewMap();
      App.get('router').transitionTo('mapCreation');
	}
	
	DashboardController.viewMap = function(map)
	{
	   App.user.set("selectedMap", map);
	   App.get('router').transitionTo('viewMap');
	}

	DashboardController.editMap = function(map)
	{
	   App.user.set("selectedMap", map);
	   App.get('router').transitionTo('mapCreation');
	}

	DashboardController.deleteMap = function(map)
	{
	   App.mapManager.deleteMap(map);
	}
	
	DashboardController.deleteExport = function(_export)
	{
	   App.mapManager.deleteExport(_export, App.user.selectedMap);
	}

	//----------------------//

	DashboardController.openExportWindow = function(map){

      App.user.set("selectedMap", map);
      App.user.set("isExportingAMap", true);
      DashboardController.refreshExportSlider();
      
      if(!map.currentExport)
         App.mapManager.enableNewExport(map);
      else
         App.mapManager.disableNewExport(map.currentExport, map);
      
      if(!map.config.map.latMin)
         $("#exportArea").addClass("hide")
      else
         $("#exportArea").removeClass("hide")
         
      $("#exportMapWindow").reveal({
         animation: 'fade',
         animationspeed: 100, 
      });
      
      $("#exportMapWindow").off("reveal:hidden");
      $("#exportMapWindow").on("reveal:hidden", function(){
         App.user.set("selectedMap", null);
         App.user.set("isExportingAMap", false);
      });
	}
	
	DashboardController.exportMap = function()
	{
	   App.mapManager.exportMap(DashboardController.selectedExportZoom);
	}
	
	//----------------------//
	
	App.DashboardController = DashboardController;

	//==================================================================//
	// Routing

	App.DashboardRouting = App.Page.extend({
		route: '/dashboard',
		
		connectOutlets: function(router){
		   var customContext = new Object();
		   customContext["datasetsData"] = App.datasetsData;
			App.Router.openPage(router, "dashboard", customContext);
		},
		
		//------------------------------------------//
		// actions

		createMap: function(){
		   DashboardController.createMap();
      },
      
      viewMap: function(router, event){
         var map = event.context;
         DashboardController.viewMap(map);
      },

      editMap: function(router, event){
         var map = event.context;
         DashboardController.editMap(map);
      },
      
      exportMap: function(){
         DashboardController.exportMap();
      },
      
      openExportWindow: function(router, event){
         var map = event.context;
         DashboardController.openExportWindow(map);
      },
      
      deleteMap: function(router, event){
         var map = event.context;
         DashboardController.deleteMap(map);
      },
      
      deleteExport: function(router, event){
         var _export = event.context;
         DashboardController.deleteExport(_export);
      },

      openExport: function(router, event){
         var _export = event.context;
         App.mapManager.openExport(_export);
      },
      
		styles: Ember.Route.transitionTo('styles'),
		colorbars: Ember.Route.transitionTo('colorbars'),
		datasets: Ember.Route.transitionTo('datasets'),
		icons: Ember.Route.transitionTo('icons'),
		fonts: Ember.Route.transitionTo('fonts')
	});

	//==================================================================//

})();