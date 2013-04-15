(function() {
	'use strict';

	var IconsView = Ember.View.extend({
		templateName: 'icons',
		didInsertElement: function(){
			App.IconsController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.IconsController.cleanUI();
		}
	});
	
	App.IconsView = IconsView;

})( App);