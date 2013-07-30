(function() {
	'use strict';
	
	var Router = Ember.Router.extend({
		enableLogging: true,
		root: Ember.Route.extend({
			
			//-------------------------------------------------------//
			// Common actions to all views

			openHome       : Ember.Route.transitionTo('home'),
			openTeam       : Ember.Route.transitionTo('team'),
			openCredits    : Ember.Route.transitionTo('credits'),
			openJobs       : Ember.Route.transitionTo('jobs'),
			openBlog       : Ember.Route.transitionTo('blog'),
			openFeatures   : Ember.Route.transitionTo('features'),
			openPresentation: Ember.Route.transitionTo('presentation'),
			openPrices     : Ember.Route.transitionTo('prices'),
			openDemos      : Ember.Route.transitionTo('cartotheque'),
	      openScreenshots: Ember.Route.transitionTo('screenshots'),
	      openAllNews    : Ember.Route.transitionTo('allNews'),
			openDashboard  : Ember.Route.transitionTo('dashboard'),

			translateEn    : function(){ App.translator.setLang('en') },
			translateFr    : function(){ App.translator.setLang('fr') },

			openTryscreen  : function(){ App.finishLoadings("tryscreen") },
			signin         : function(){

			   $("#loginWindow").reveal({
			      animation: 'fade',
			      animationspeed: 100, 
			   });
			   
			},
	      maperialLogin  : function(){MaperialAuth.authorize()},
			
			//-------------------------------------------------------//
			// Routes used when calling Ember.Route.transitionTo
			//-------------------//
			
			home           : App.HomeRouting,
			more           : App.MoreRouting,
			usechrome      : App.UsechromeRouting,
			team           : App.TeamRouting,
			credits        : App.CreditsRouting,
			jobs           : App.JobsRouting,
			blog           : App.BlogRouting,
			features       : App.FeaturesRouting,
			presentation   : App.PresentationRouting,
			prices         : App.PricesRouting,
			screenshots    : App.ScreenshotsRouting,
			allNews        : App.AllNewsRouting,
			cartotheque    : App.CartothequeRouting,
			
			tryscreen      : App.TryscreenRouting,
			dashboard      : App.DashboardRouting,
			
			styles         : App.StylesRouting,
			styleEditor    : App.StyleEditorRouting,
			
			colorbars      : App.ColorbarsRouting,
			colorbarEditor : App.ColorbarEditorRouting,

			datasets       : App.DatasetsRouting,
			fonts          : App.FontsRouting,
			icons          : App.IconsRouting,

			viewMap        : App.ViewMapRouting,
			mapCreation    : App.MapCreationRouting
		})
	})
	
	//-----------------------------------------------------------------------------------------//
	
	/**
	 * the main purpose of Router.openPage is to check if user.isLoggedIn
	 * the second purpose is to create a full context, adding the customContext to everything else
	 * 
	 * context : may contain additional models required for the view
	 * exemple 
	 * connectOutlets: function(router){
         var customContext = new Object();
         customContext["datasetsData"] = App.datasetsData;
         App.Router.openPage(router, "dashboard", customContext);
      }, 
      
      the custom context is added to the glabal context containing
       - user
       - publicData
       - viewData
       - currentView
	 */
	Router.openPage = function (router, page, customContext)
	{
	   var webappPage = Router.isWebappPage(page);
	   
      console.log("openPage " + page);
		if(webappPage
	   && (page != "mapCreation" && page != "styleEditor" && !App.Globals.isTryscreen) 
		&& !App.user.loggedIn)
		{
			console.log("Not connected ! Redirected to the home page");
			router.transitionTo('home');
		}
		else{

         if(webappPage  
            && navigator.appName == "Microsoft Internet Explorer"){
            App.get('router').transitionTo('usechrome');
            return;
         }
         
		   if(webappPage  
	      && !App.Globals.APP_READY){
		      console.log("Not loaded properly ! Redirected to the home page");
		      window.location.href="/"
		   }
		   else{
            var context = Router.buildGlobalContext(customContext, page);
            App.Globals.set("currentPage", page);
            App.Globals.set("currentView", page);
            App.Globals.set("parentView", "root");
            
            router.get('applicationController').connectOutlet(page, context);
		   }
		}
	}

	//-----------------------------------------------------------------------------------------//

   /**
    * Load a component with the parentController as context
    * context : alike Router.openPage
    */
   Router.openComponent = function (router, parentView, customContext)
   {
      var view = router.currentState.name;
      var context = Router.buildGlobalContext(customContext, view);

      context["currentView"] = view;
      App.Globals.set("currentView", view);
      App.Globals.set("parentView", parentView);
      
      router.get(parentView+"Controller").connectOutlet(view, context);
   }

   //-----------------------------------------------------------------------------------------//

   Router.buildGlobalContext = function (customContext, view){

      var context;
    
      if(customContext == undefined)
         context = new Object();
      else
         context = customContext;

      context["user"] = App.user;
      context["publicData"] = App.publicData;

      // binding controller's data
      context[view+"Data"] = App[view+"Data"];  
      
      return context;
   }

   //-----------------------------------------------------------------------------------------//

   Router.isWebappPage = function(page){
      return (page != "home" && 
            page != "more" && 
            page != "team" && 
            page != "credits" && 
            page != "jobs" && 
            page != "blog" && 
            page != "features" && 
            page != "presentation" && 
            page != "prices" && 
            page != "screenshots" && 
            page != "allNews" && 
            page != "cartotheque" && 
            page != "usechrome");
   }
   
   //-----------------------------------------------------------------------------------------//

	App.Router = Router;

	//-----------------------------------------------------------------------------------------//
	
})();
