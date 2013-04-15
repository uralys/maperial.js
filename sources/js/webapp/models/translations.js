(function() {
   'use strict';

   var Translations = Ember.Object.extend({
      messages: []
   });

   //------------------------------------------------------//

   App.translations = Translations.create();
   App.translator = new Translator();

   $(window).on(Translator.LANG_CHANGED, App.changedTranslations);
   
   //------------------------------------------------------//
})( App);
