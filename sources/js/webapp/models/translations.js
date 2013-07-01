(function() {
   'use strict';

   var Translations = Ember.Object.extend({
      messages: []
   });

   //------------------------------------------------------//

   $(window).on(Translator.LANG_CHANGED, App.changedTranslations);

   App.translations = Translations.create();
   App.translator = new Translator();
   
   //------------------------------------------------------//
})( App);
