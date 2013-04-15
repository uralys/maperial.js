(function() {
	'use strict';

	var StyleEditorView = Ember.View.extend({
		templateName: 'styleEditor',
		didInsertElement: function(){
			App.StyleEditorController.renderUI();
         App.placeFooter(true);
		},
		willDestroyElement: function(){
			App.StyleEditorController.cleanUI();
		}
	});
	
	App.StyleEditorView = StyleEditorView;

})( App);

