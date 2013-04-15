(function() {
   'use strict';

   App.DatasetSelectionController = Ember.ObjectController.extend({});
   App.DatasetSelectionView = Ember.View.extend({
      templateName: 'datasetSelection'
   });

   App.MapEditionController = Ember.ObjectController.extend({});
   App.MapEditionView = Ember.View.extend({
      templateName: 'mapEdition',
      didInsertElement: function(){
         App.MapCreationController.renderStyleAndColorbarUI();
      },
      willDestroyElement: function(){
         App.MapCreationController.cleanStyleAndColorbarUI();
      }
   });


})( App);
