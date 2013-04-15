(function() {
	'use strict';

	var StylesView = Ember.View.extend({
		templateName: 'styles',
		didInsertElement: function(){
			App.StylesController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.StylesController.cleanUI();
		}
	});
	
	App.StylesView = StylesView;

})( App);

