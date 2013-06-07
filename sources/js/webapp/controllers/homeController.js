
(function() {
	'use strict';

	var HomeController = Ember.ObjectController.extend({});

	//==================================================================//

	HomeController.renderUI = function(){
	    App.get('router').transitionTo('home.news');
	    setTimeout( HomeController.loadTopImage, 300)
	}

	HomeController.cleanUI = function()	{

	}

	HomeController.loadTopImage = function () {
	   
	   var img = new Image()
	   
	   img.onload = function () {      
	      var position = document.getElementById('homeImage').style.backgroundPosition
	      document.getElementById('homeImage').style.background = "url('http://static.maperial.localhost/images/home/top.maperial.png') " + position ;
	   };

	   img.src = "http://static.maperial.localhost/images/home/top.maperial.png"
	}
	
	//==================================================================//
	// Controls

	HomeController.openLoginWindow = function() 
	{
		$('#loginWindow').modal();
	}
	
	HomeController.openVideoWindow = function() 
	{
	   window.youtubeManager.openVideoWindow();
	}

	//----------------------------------------------------//

	App.HomeController = HomeController;

	//==================================================================//
	// Routing

	App.HomeRouting = App.Page.extend({
		route: '/',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "home");
		},
		
		//--------------------------------------//
      // states

      news: Ember.Route.extend({
         route: '/',
         connectOutlets: function(router) {
            App.Router.openComponent(router, "home");
         }
      }),
		
		//-----------------------------------//
		// actions
		
		openMore           : Ember.Route.transitionTo('more'),
		openScreenshots    : Ember.Route.transitionTo('screenshots'),
		openAllNews        : Ember.Route.transitionTo('allNews'),
		openLoginWindow    : function(){App.HomeController.openLoginWindow()},
		showVideo          : function(){App.HomeController.openVideoWindow()},
		
	});

	//==================================================================//

})();

