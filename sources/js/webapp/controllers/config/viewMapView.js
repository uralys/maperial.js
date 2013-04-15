(function() {
	'use strict';

	var ViewMapView = Ember.View.extend({
		templateName: 'viewMap',
		didInsertElement: function(){
			App.ViewMapController.renderUI();
         App.placeFooter(true);
		},
      willDestroyElement: function(){
         App.ViewMapController.close();
      }
	});
	
	App.ViewMapView = ViewMapView;

})( App);

