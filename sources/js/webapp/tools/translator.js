//---------------------------------------------------------------------//

function Translator(storeMessagesHere){
   
   this.storeMessagesHere = storeMessagesHere;
   this.lang = 'en';
   this.defaultLang = 'en';
   this.cookievalid = 1000*60*60*24;
   this.messages = null;
   
   var me = this;
   
   this.initLang();
}

//---------------------------------------------------------------------//

Translator.LANG_CHANGED = "Translator.CHANGED_LANG";
Translator.messages = null;

//---------------------------------------------------------------------//

Translator.prototype.extractLang = function(urlParameters){
   
   var lang = null;
   for (var i = 0; i<urlParameters.length; i++) {
      var param = urlParameters[i].split('=');
      if (param[0]==='lang'){
         lang = param[1];
      }
   }
   
   return lang;
}

Translator.prototype.getUrlLang = function() {
   if (window.location.search.length<2)
      return undefined;
   return this.extractLang(window.location.search.substring(1).split('&'));
}

Translator.prototype.getCookieLang = function() {
   return this.extractLang(document.cookie.split('; '));
}

//---------------------------------------------------------------------//

Translator.prototype.initLang = function() {
   var lang = this.getUrlLang();
   if(!lang){
      lang = this.getCookieLang();
      if(!lang){
         lang = navigator.language;
         if(!lang){
            lang = navigator.userLanguage;
            if(!lang){
               lang = this.defaultLang;
            }
         }
      }
   }
     
   this.setLang(lang);
}

//---------------------------------------------------------------------//

Translator.prototype.setLang = function(lang, dontStoreCookie) {
   
   this.lang = lang.charAt(0) + lang.charAt(1);
   
   if (!dontStoreCookie) {
      var location = window.location.hostname;
      var now = new Date();
      var time = now.getTime();
      time += this.cookievalid;
      now.setTime(time);
      
      document.cookie = 'lang='+lang+';domain='+location+';expires='+now.toGMTString();
   }
   
   this.load();
}

//---------------------------------------------------------------------//

Translator.prototype.load = function() {
   var me = this;
   $.getJSON('http://maperial.com/assets/translations/'+this.lang, function(data) {
      if(me.storeMessagesHere){
         Translator.messages = data;
         $(window).trigger(Translator.LANG_CHANGED);
      }
      else{
         $(window).trigger(Translator.LANG_CHANGED, [data]);
      }
      
   });
}
