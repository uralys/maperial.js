(function() {
	'use strict';

	var DatasetsView = Ember.View.extend({
		templateName: 'datasets',
		didInsertElement: function(){
			App.DatasetsController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.DatasetsController.cleanUI();
		}
	});
	
	App.DatasetsView = DatasetsView;

})( App);