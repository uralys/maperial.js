(function() {
	'use strict';

	App.MyStylesController = Ember.ObjectController.extend({});
	App.MyStylesView = Ember.View.extend({
		templateName: 'styleList'
	});
	
	App.PublicStylesController = Ember.ObjectController.extend({});
	App.PublicStylesView = Ember.View.extend({
		templateName: 'styleList'
	});

})( App);
