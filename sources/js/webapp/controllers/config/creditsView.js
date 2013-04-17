(function() {
	'use strict';

	var CreditsView = Ember.View.extend({
		templateName: 'credits',
		didInsertElement: function(){
			App.CreditsController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.CreditsController.cleanUI();
		}
	});
	
	App.CreditsView = CreditsView;

})( App);