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
		      
		      Utils.randomRotate("imageNews6")
		      Utils.randomRotate("imageNews7")
		      Utils.randomRotate("imageNews8")
		      Utils.randomRotate("imageNews9")
		   }, 200);
      }
	});
	
})( App);


