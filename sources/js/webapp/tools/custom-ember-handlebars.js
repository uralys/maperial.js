
/**
 * data contains the file to upload
 */
Ember.Handlebars.registerHelper('date', function(options) {
   var date = options.hash.value.split("-");
   var year = date[0];
   var month = date[1];
   var day = date[2];

   switch (App.translator.lang) {
      case "fr":
         return day + "/" + month + "/" + year;

      case "en":
      default:
         return year + "." + month + "." + day;
      
   }
});

//---------------------------------------------------------------------------------------//

/**
 * data contains the file to upload
 */
Ember.Handlebars.registerBoundHelper('fileName', function(data, options) {
   return data.files[0].name;
});


//---------------------------------------------------------------------------------------//

/**
 * defines a progressBar
 */
Ember.Handlebars.registerBoundHelper('progressBar', function(percentage, options) {
   var customclass = "";

   if(options.hash.class)
      customclass += " " + options.hash.class;
   else
      customclass += " progress";

   if(options.hash.span)
      customclass += " " + options.hash.span;

   return new Handlebars.SafeString("<div class=\""+customclass+"\"><div class=\"bar\" style=\"width: "+percentage+"%;\"></div></div>");
});

//---------------------------------------------------------------------------------------//

/**
 * transform 40303 ==> 40.30 KB
 */
Ember.Handlebars.registerBoundHelper('fileSize', function(size, options) {
   return Utils.formatFileSize(size);
});

//---------------------------------------------------------------------------------------//

/**
 * transform 1356095267229 ==> 21/12/2012
 */
Ember.Handlebars.registerBoundHelper('formatDate', function(uploadTime, options) {
   return Utils.formatDate(uploadTime);
});

//---------------------------------------------------------------------------------------//

/**
 * Display a specific html template whether data == value
 * Static version : need a view refresh but may use Ember {{action}} in templates
 * 
 * note using registerBoundHelper instead of registerHelper so that the data is not a string
 */
Ember.Handlebars.registerBoundHelper('equals', function(data, options) {
   if(data == options.hash.value)
      return options.fn(this);
   else
      return options.inverse(this);
});

/**
 * Display a specific html template whether data == value
 * Bound version : no need to refresh but CANNOT use Ember {{action}} in templates
 * See isset below for specific actions
 */
Ember.Handlebars.registerBoundHelper('bound_equals', 
      function(data, options) 
      {
   if(data == options.hash.value){
      return new Handlebars.SafeString(Utils.toHtml(options.hash.yes));
   }
   else{
      return new Handlebars.SafeString(Utils.toHtml(options.hash.no));
   }
      }
);

//---------------------------------------------------------------------------------------//

Ember.Handlebars.registerBoundHelper('textInput', 
      function(defaultValue, options) 
      {
   return new Handlebars.SafeString("<input id=\""+options.hash.id+"\" name=\""+options.hash.id+"\" class=\""+options.hash.class+"\" type=\"text\" value=\""+defaultValue+"\"/>");
      }
);

//---------------------------------------------------------------------------------------//

/**
 * Display a style thumb from its styleUID 
 */ 
Ember.Handlebars.registerBoundHelper('stylethumb', 
      function(styleUID, options) 
      {
   return new Handlebars.SafeString("<img class=\"selectable\" src=\""+Utils.styleThumbURL(styleUID)+"\"></img>");
      }
);

/**
 * Display a style thumb from its styleUID 
 */ 
Ember.Handlebars.registerBoundHelper('ministylethumb', 
      function(styleUID, options) 
      {
   return new Handlebars.SafeString("<img class=\"selectable\" src=\""+Utils.styleThumbURL(styleUID)+"\" width=\"60\"></img>");
      }
);


/**
 * Display a colorbar thumb from its colorbarUID 
 */ 
Ember.Handlebars.registerBoundHelper('colorbarthumb', 
      function(colorbarUID, options) 
      {
   return new Handlebars.SafeString("<img class=\"selectable\" src=\""+Utils.colorbarThumbURL(colorbarUID)+"\"></img>");
      }
);

/**
 * Display a colorbar thumb from its colorbarUID 
 */ 
Ember.Handlebars.registerBoundHelper('minicolorbarthumb', 
      function(colorbarUID, options) 
      {
   return new Handlebars.SafeString("<img src=\""+Utils.colorbarThumbURL(colorbarUID)+"\" width=\"60\"></img>");
      }
);


/**
 * Display a map thumb from its config.layers.source.types 
 */ 
Ember.Handlebars.registerBoundHelper('mapthumb', 
      function(layers, options) 
      {
   var images = "";

   for (var i =0; i< layers.length; i++)
      images += "<div class=\"span1 mapthumb "+(i>0?"top":"")+"\"><img class=\"minithumb\" "+Utils.getSourceThumb(layers[i])+"></img></div>";

   return new Handlebars.SafeString(images);
      }
);

//---------------------------------------------------------------------------------------//

/**
 * Display a specific html template whether the data is set or not 
 * This helper can evaluate Javascript functions. Use {function(params)}.
 * 
 * Examples : 
    {{isset container.data
      yes='<div>OK</div>'
      no='<div>Null</div>'}}

    {{isset controllerData.style
      yes='<div><img src="{Utils.thumbURL(App.controllerData.style)}"></img></div>'
      no='<div>select the sytle !</div>'}}

      http://map.x-ray.fr/wiki/display/IDEES/Custom+Handlebars?focusedCommentId=1736712#comment-1736712
 */
Ember.Handlebars.registerBoundHelper('isset', 
      function(data, options) 
      {
   if(data != undefined && data != null){
      return new Handlebars.SafeString(Utils.toHtml(options.hash.yes));
   }
   else{
      return new Handlebars.SafeString(Utils.toHtml(options.hash.no));
   }
      }
);

//---------------------------------------------------------------------------------------//

/**
 *
 */
Ember.Handlebars.registerBoundHelper('maperialtag', 
      function(mapUID, options) {
   return new Handlebars.SafeString("<textarea id=\"maperialTag\"><maperial uid=\""+mapUID+"\"/></textarea>");
}
);