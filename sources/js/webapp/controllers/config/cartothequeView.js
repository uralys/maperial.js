(function() {
	'use strict';

	var CartothequeView = Ember.View.extend({
		templateName: 'cartotheque',
		didInsertElement: function(){
			App.CartothequeController.renderUI();
         App.placeFooter(false);
		},
		willDestroyElement: function(){
			App.CartothequeController.cleanUI();
		}
	});
	
	App.CartothequeView = CartothequeView;

})( App);