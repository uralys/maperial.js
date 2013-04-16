(function() {
	'use strict';

	var MoreView = Ember.View.extend({
		templateName: 'more',
		didInsertElement: function(){
			App.MoreController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.MoreController.cleanUI();
		}
	});
	
	App.MoreView = MoreView;

})( App);