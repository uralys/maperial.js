(function() {
	'use strict';

	var FeaturesView = Ember.View.extend({
		templateName: 'features',
		didInsertElement: function(){
			App.FeaturesController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.FeaturesController.cleanUI();
		}
	});
	
	App.FeaturesView = FeaturesView;

})( App);