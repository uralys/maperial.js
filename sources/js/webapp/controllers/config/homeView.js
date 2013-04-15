(function() {
	'use strict';

	var HomeView = Ember.View.extend({
		templateName: 'home',
		didInsertElement: function(){
			App.HomeController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.HomeController.cleanUI();
		}
	});
	
	App.HomeView = HomeView;

})( App);