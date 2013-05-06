(function() {
	'use strict';

	var PricesView = Ember.View.extend({
		templateName: 'prices',
		didInsertElement: function(){
			App.PricesController.renderUI();
         App.placeFooter();
		},
		willDestroyElement: function(){
			App.PricesController.cleanUI();
		}
	});
	
	App.PricesView = PricesView;

})( App);