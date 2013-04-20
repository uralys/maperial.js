(function() {
	'use strict';

	var AllNewsView = Ember.View.extend({
		templateName: 'allNews',
		didInsertElement: function(){
			App.AllNewsController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.AllNewsController.cleanUI();
		}
	});
	
	App.AllNewsView = AllNewsView;

})( App);