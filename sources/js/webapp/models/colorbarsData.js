(function() {
	'use strict';

	var ColorbarsData = Ember.Object.extend({
		selectedColorbar: {
			uid:null,
			name:null,
			content:null
		},
		editingColorbar: false, // colorbarEditor | editingColorbar = true : edition | editingColorbar = false : newColorbar 
		map: null // GLMap			
	});
	
	App.colorbarsData = ColorbarsData.create();
	
})( App);