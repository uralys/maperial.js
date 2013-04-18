//---------------------------------------------------------------------------------------//

/**
 * data contains the file to upload
 */
Handlebars.registerHelper('email', function(options) {

   var email = "";
   var guymal_enc;
   switch(options.hash.name){

      case "djoul":
         guymal_enc= "lsjoch(diurFkgvctogj(eik";
         break;

      case "chris":
         guymal_enc= "entou(bsahcFkgvctogj(eik";
         break;

      case "maperial":
      default:
         guymal_enc= "eihrgerFkgvctogj(eik";
      break;

   }

   for(guymal_i=0;guymal_i<guymal_enc.length;++guymal_i)
      email += String.fromCharCode(6^guymal_enc.charCodeAt(guymal_i));

   return email;
});

//---------------------------------------------------------------------------------------//

/**
 * HTML doesnt know which static to call.
 * Js does since Renamer.jar replace urls for min.js : so replace here as well
 */
Handlebars.registerHelper('static', function(options) {
   console.log("static",options)
   console.log("http://static.maperial.localhost" + options.hash.path)
   return "http://static.maperial.localhost" + options.hash.path;
});
