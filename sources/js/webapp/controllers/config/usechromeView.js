(function() {
	'use strict';

	var UsechromeView = Ember.View.extend({
		templateName: 'usechrome',
		didInsertElement: function(){
			App.UsechromeController.renderUI();
         App.placeFooter(true);
		},
		willDestroyElement: function(){
			App.UsechromeController.cleanUI();
		}
	});
	
	App.UsechromeView = UsechromeView;

})( App);