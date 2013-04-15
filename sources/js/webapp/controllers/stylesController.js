
(function() {
	'use strict';

	var StylesController = Ember.ObjectController.extend({});

	//==================================================================//

	StylesController.renderUI = function()
	{

	}

	StylesController.cleanUI = function()
	{
		
	}

	//==================================================================//
	// Controls

	StylesController.openStyleSelectionWindow = function() 
	{
		$('#selectStyleWindow').modal();
	}

	//------------------------------------------------//
	
	StylesController.selectStyle = function(style) 
	{
		App.stylesData.set("selectedStyle", style);
	}

	//------------------------------------------------//
	
	StylesController.cancelSelectedStyle = function() 
	{
		App.stylesData.set("selectedStyle", undefined);
	}
	
	//------------------------------------------------//
	
	StylesController.editStyle = function(style) 
	{
		App.stylesData.set("selectedStyle", style);
		App.stylesData.set("editingStyle", true);
		App.get('router').transitionTo('styleEditor');
	}
	
	//------------------------------------------------//
	
	StylesController.deleteStyle = function(style) 
	{
		App.styleManager.deleteStyle(style);
	}
	
	//------------------------------------------------//
	
	/**
	 * Component StyleList : 
	 *   whether the currentPage is "styles" or "mapCreation", the continue is different
	 */
	StylesController.changeStyle = function() 
	{
	   if(App.Globals.currentPage == "styles")
	      StylesController.openStyleEditor();

	   else if(App.Globals.currentPage == "mapCreation")
	      App.MapCreationController.changeStyle();
	}
	
	/**
	 * Reach from selectStyleWindow = new style being created
	 */
	StylesController.openStyleEditor = function() 
	{
	   $("#selectStyleWindow").modal("hide");
	   App.stylesData.set("editingStyle", false);
	   App.get('router').transitionTo('styleEditor');
	}

	//------------------------------------------------//
	
	App.StylesController = StylesController;

	//==================================================================//
	// Routing

	App.StylesRouting = Ember.Route.extend({
		route: '/styles',
        
		connectOutlets: function(router) {
		   App.Router.openPage(router, "styles");
		},

		//--------------------------------------//
		// states

		myStyles: Ember.Route.extend({
		   route: '/',
		   connectOutlets: function(router) {
		      var customParams = [];
		      customParams["styles"] = App.user.styles;
            customParams["stylesData"] = App.stylesData;
		      App.Router.openComponent(router, "styles", customParams);
		   }
		}),

		publicStyles: Ember.Route.extend({
		   route: '/',
		   connectOutlets: function(router) {
		      var customParams = [];
		      customParams["styles"] = App.publicData.styles;
            customParams["stylesData"] = App.stylesData;
		      App.Router.openComponent(router, "styles", customParams);
		   }
		}),

		//--------------------------------------//
		// actions

		showPublicStyles: function(router){
		   StylesController.cancelSelectedStyle();
		   StylesController.openStyleSelectionWindow();
		   router.transitionTo('styles.publicStyles');
		},

		showMyStyles: Ember.Route.transitionTo('styles.myStyles'),

		selectStyle : function(router, event){
		   StylesController.selectStyle(event.context);
		},

		editStyle : function(router, event){
		   StylesController.editStyle(event.context);
		},

		deleteStyle : function(router, event){
		   StylesController.deleteStyle(event.context);
		}
	});

	//==================================================================//
	
})();

