(function() {
	'use strict';

	App.MyColorbarsController = Ember.ObjectController.extend({});
	App.MyColorbarsView = Ember.View.extend({
		templateName: 'colorbarList'
	});
	
	App.PublicColorbarsController = Ember.ObjectController.extend({});
	App.PublicColorbarsView = Ember.View.extend({
		templateName: 'colorbarList'
	});

})( App);
