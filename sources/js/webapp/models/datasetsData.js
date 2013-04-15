(function() {
	'use strict';

	var DatasetsData = Ember.Object.extend({
	   filesToUpload: Ember.A([]),
	   filesUploading: Ember.A([]),
	   selectedDataset : null,
	   nbfilesCurrentlyUploading : 0,
	   rasterBeingConfigured : null
	});
	
	App.datasetsData = DatasetsData.create();
	
})( App);