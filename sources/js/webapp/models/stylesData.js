(function() {
	'use strict';

	var StylesData = Ember.Object.extend({
		selectedStyle: {
			uid:null,
			name:null,
			content:null
		},
		editingStyle: false, // styleEditor | editingStyle = true : edition | editingStyle = false : newStyle 
		map: null // GLMap			
	});
	
	App.stylesData = StylesData.create();
	
})( App);