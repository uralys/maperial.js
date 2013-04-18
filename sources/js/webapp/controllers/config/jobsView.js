(function() {
	'use strict';

	var JobsView = Ember.View.extend({
		templateName: 'jobs',
		didInsertElement: function(){
			App.JobsController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.JobsController.cleanUI();
		}
	});
	
	App.JobsView = JobsView;

})( App);