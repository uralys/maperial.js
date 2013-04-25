(function() {
	'use strict';

	App.NewsController = Ember.ObjectController.extend({});
	App.NewsView = Ember.View.extend({
		templateName: 'news',
		didInsertElement: function(){
		   setTimeout(function(){
		      $('#news').codaSlider({
		         dynamicArrowsGraphical:true,
		         container : $("#newsContainer"),
		         autoHeight : false,
		         autoSlide : true
		      });
		   }, 200);
      }
	});
	
})( App);


