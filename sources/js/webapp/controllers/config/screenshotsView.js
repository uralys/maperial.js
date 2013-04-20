(function() {
	'use strict';

	var ScreenshotsView = Ember.View.extend({
		templateName: 'screenshots',
		didInsertElement: function(){
			App.ScreenshotsController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.ScreenshotsController.cleanUI();
		}
	});
	
	App.ScreenshotsView = ScreenshotsView;

})( App);