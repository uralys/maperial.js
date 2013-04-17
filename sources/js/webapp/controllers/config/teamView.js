(function() {
	'use strict';

	var TeamView = Ember.View.extend({
		templateName: 'team',
		didInsertElement: function(){
			App.TeamController.renderUI();
         App.placeFooter(true);
		},
		willDestroyElement: function(){
			App.TeamController.cleanUI();
		}
	});
	
	App.TeamView = TeamView;

})( App);