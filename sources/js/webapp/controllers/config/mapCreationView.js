(function() {
	'use strict';

	var MapCreationView = Ember.View.extend({
		templateName: 'mapCreation',
		didInsertElement: function(){
			App.MapCreationController.init();
         App.placeFooter(true);
		},
		willDestroyElement: function(){
			App.MapCreationController.terminate();
		}
	});
	
	App.MapCreationView = MapCreationView;

})( App);

