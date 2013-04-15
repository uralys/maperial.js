
(function() {
	'use strict';

	var ColorbarsController = Ember.ObjectController.extend({});

	//==================================================================//

	ColorbarsController.renderUI = function()
	{

	}

	ColorbarsController.cleanUI = function()
	{
		
	}

	//==================================================================//
	// Controls

	ColorbarsController.openColorbarSelectionWindow = function() 
	{
		$('#selectColorbarWindow').modal();
	}

	//------------------------------------------------//
	
	ColorbarsController.selectColorbar = function(colorbar) 
	{
		App.colorbarsData.set("selectedColorbar", colorbar);
	}

	//------------------------------------------------//
	
	ColorbarsController.cancelSelectedColorbar = function() 
	{
		App.colorbarsData.set("selectedColorbar", undefined);
	}
	
	//------------------------------------------------//
	
	ColorbarsController.editColorbar = function(colorbar) 
	{
		App.colorbarsData.set("selectedColorbar", colorbar);
		App.colorbarsData.set("editingColorbar", true);
		App.get('router').transitionTo('colorbarEditor');
	}
	
	//------------------------------------------------//
	
	ColorbarsController.deleteColorbar = function(colorbar) 
	{
		ColorbarManager.deleteColorbar(colorbar);
	}
	
	//------------------------------------------------//
	
	ColorbarsController.continueColorbarCreation = function() 
	{
		$("#selectColorbarWindow").modal("hide");
		App.colorbarsData.set("editingColorbar", false);
		App.get('router').transitionTo('colorbarEditor');
	}

	//------------------------------------------------//
	
	App.ColorbarsController = ColorbarsController;

	//==================================================================//
	// Routing

	App.ColorbarsRouting = Ember.Route.extend({
		route: '/colorbars',
        
		connectOutlets: function(router) {
			App.Router.openPage(router, "colorbars");
        },

        //--------------------------------------//
        // states
        
        myColorbars: Ember.Route.extend({
        	route: '/',
        	connectOutlets: function(router) {
    			var customParams = [];
    			customParams["colorbars"] = App.user.colorbars;
            customParams["colorbarsData"] = App.colorbarsData;
        		App.Router.openComponent(router, "colorbars", customParams);
        	}
        }),
        
        publicColorbars: Ember.Route.extend({
        	route: '/',
    		connectOutlets: function(router) {
    			var customParams = [];
    			customParams["colorbars"] = App.publicData.colorbars;
    			customParams["colorbarsData"] = App.colorbarsData;
        		App.Router.openComponent(router, "colorbars", customParams);
    		}
        }),

        //--------------------------------------//
        // actions
        
        showPublicColorbars: function(router){
        	ColorbarsController.cancelSelectedColorbar();
        	ColorbarsController.openColorbarSelectionWindow();
        	router.transitionTo('colorbars.publicColorbars');
        },
        
        showMyColorbars: Ember.Route.transitionTo('colorbars.myColorbars'),

        selectColorbar : function(router, event){
			ColorbarsController.selectColorbar(event.context);
		},

		editColorbar : function(router, event){
			ColorbarsController.editColorbar(event.context);
		},

		deleteColorbar : function(router, event){
			ColorbarsController.deleteColorbar(event.context);
        }
	});

	//==================================================================//
	
})();