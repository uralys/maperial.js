(function() {
	'use strict';

	var BlogView = Ember.View.extend({
		templateName: 'blog',
		didInsertElement: function(){
			App.BlogController.renderUI();
		},
		willDestroyElement: function(){
			App.BlogController.cleanUI();
		}
	});
	
	App.BlogView = BlogView;

})( App);