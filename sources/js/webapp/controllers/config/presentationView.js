(function() {
	'use strict';

	var PresentationView = Ember.View.extend({
		templateName: 'presentation',
		didInsertElement: function(){
			App.PresentationController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.PresentationController.cleanUI();
		}
	});
	
	App.PresentationView = PresentationView;

})( App);