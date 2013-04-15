//---------------------------------------------------------------------------------------//

/**
 * data contains the file to upload
 */
Handlebars.registerHelper('email', 
      function(data, options) {
         var email = "";
         var guymal_enc= "eihrgerFkgvctogj(eik";
         for(guymal_i=0;guymal_i<guymal_enc.length;++guymal_i)
             email += String.fromCharCode(6^guymal_enc.charCodeAt(guymal_i));
         
         return email;
      }
);

//---------------------------------------------------------------------------------------//

Handlebars.registerHelper('T', function(key) {
   try{
      return Translator.messages[key]; 
   }
   catch(e){
      if(!Translator.messages)
         console.log("Translator missconfig");
      else
         console.log("key not found : " + key);
      return key; 
   }
});
