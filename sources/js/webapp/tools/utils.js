//----------------------------//
//Utils
//----------------------------//

this.Utils = {};

//----------------------------//

//Utils.blackScrollTrack = function(){
//var rules = document.styleSheets[0].cssRules;
//for(var i=0; i < rules.length; i++) {
//if(rules[i].type != 1)
//console.log(rules[i]);
//}

//document.styleSheets[0].addRule("::-webkit-scrollbar-track", "background: rgba(0,0,0,0);");
//} 

/*
 * zeroPad(5, 2) 	--> "05"
   zeroPad(1234, 2) --> "1234"
 */
Utils.zeroPad = function(num, places) 
{
   var zero = places - num.toString().length + 1;
   return Array(+(zero > 0 && zero)).join("0") + num;
}

/*
 * now as YYYY-MM-DD
 */
Utils.dateTime = function()
{
   var now = new Date();
   return now.getFullYear() + "-" 
   + Utils.zeroPad(now.getMonth()+1, 2) + "-" 
   + Utils.zeroPad(now.getDate(), 2);
}

//----------------------------------------------------------------------------------------//

Utils.alert = function (area, type, title, message) {
   $("#" + area).append($("<div class='alert-message alert-" + type + " fade in' data-alert><a class=\"btn btn-rounded btn-icon-only btn-dark closer\" data-dismiss=\"alert\"> <i class=\"icon icon-ex-white-outline\"></i></a><h4 class=\"alert-heading\">"+title+"</h4> " + message + " </div>"));
   //$(".alert-message").delay(2000).fadeOut("slow", function () { $(this).remove(); });
}

//----------------------------------------------------------------------------------------//

/*
 * helpers for html encoding and decoding
 */
Utils.htmlEncode = function (value){
   return $('<div/>').text(value).html();
}

Utils.htmlDecode = function(value){
   return $('<div/>').html(value).text();
}

//----------------------------------------------------------------------------------------//

/*
 */
Utils.replaceAll = function(chain, value, replacement)
{
   return chain.replace(new RegExp(value, 'g'), replacement);
}

//----------------------------------------------------------------------------------------//

Utils.rgbToHex = function (r, g, b) {
   if (r > 255 || g > 255 || b > 255)
      throw "Invalid color component";
   return ((r << 16) | (g << 8) | b).toString(16);
}

//----------------------------------------------------------------------------------------//

/***
 * bytes = 36550
 * return 36.55 KB
 */
Utils.formatFileSize = function (bytes) 
{
   if (typeof bytes !== 'number') {
      return '';
   }
   if (bytes >= 1000000000) {
      return (bytes / 1000000000).toFixed(2) + ' GB';
   }
   if (bytes >= 1000000) {
      return (bytes / 1000000).toFixed(2) + ' MB';
   }
   return (bytes / 1000).toFixed(2) + ' KB';
}
//----------------------------------------------------------------------------------------//

/***
 * timestamp = 1355342389711
 * return 12/12/2012
 * 
 * timestamp = undefined => use today.
 * 
 * @Improve #MAP-12
 */
Utils.formatDate = function(timestamp) 
{
   var now = timestamp == undefined ? new Date() : new Date(timestamp);
   var day = Utils.zeroPad(now.getDate(), 2);
   var month = Utils.zeroPad(now.getMonth() + 1, 2); //Months are zero based
   var year = now.getFullYear();

   return day + "/" + month + "/" + year;
}

//----------------------------------------------------------------------------------------//

Utils.generateGuid = function() 
{
   var result, i, j;
   result = '';
   for(j=0; j<32; j++) {
      if( j == 8 || j == 12|| j == 16|| j == 20)
         result = result + '_';
      i = Math.floor(Math.random()*16).toString(16).toUpperCase();
      result = result + i;
   }
   return result;
}

//return 1->i
Utils.random = function(i){
   return Math.floor(Math.random()*i) + 1;
}

//----------------------------------------------------------------------------------------//

Utils.popup = function(url, title, width, height) 
{
   var left = (screen.width/2)-(width/2);
   var top = (screen.height/2)-(height/2);
   return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+width+', height='+height+', top='+top+', left='+left);
}

//----------------------------------------------------------------------------------------//

/**
 * custom mustache evaluation : )
 * data is used for the functions-in-customMustache parameters 
 * 
 * http://map.x-ray.fr/wiki/display/IDEES/Custom+Mustaches
 */
Utils.toHtml = function(template)
{
   while(template.indexOf("{") != -1)
   {
      var customMustache = template.substring(template.indexOf("{"), template.indexOf("}")+1);

      var html = eval(customMustache);
      template = template.replace(customMustache, html);
   }

   return template;
}

//----------------------------------------------------------------------------------------//

Utils.isObject = function(stuff) 
{
   return Object.prototype.toString.call( stuff ) === '[object Object]' ;
}

/**
 * Ember : edition + binding of objects contained in an array : thanks to ObjectProxy
 */
Utils.editObjectInArray = function(object, property, value)
{
   var proxy = Ember.ObjectProxy.create({
      content: object
   });

   try{
      proxy.set(property, value);
   }
   catch(e){}
}

//----------------------------------------------------------------------------------------//

Utils.styleThumbURL = function(styleUID) 
{
   return Utils.thumbURL(styleUID, "style")
}

Utils.colorbarThumbURL = function(colorbarUID) 
{
   return Utils.thumbURL(colorbarUID, "colorbar")
}

//----------------------------------------------------------------------------------------//

Utils.thumbURL = function(uid, type) 
{
   if(uid == undefined || uid == null)
      return "";

   var end = uid.substring(uid.length-4);
   var folders = end.split("");

   var url = "//maperial.com/thumbs" + type;
   folders.forEach(function(folder) {
      url += "/" + folder;
   });

   return url + "/" + uid + ".png";
}

//----------------------------------------------------------------------------------------//

Utils.getSourceThumb = function(layer) {

   switch(layer.source.type){
   
      case Source.MaperialOSM:
         return " src=\""+Utils.styleThumbURL(layer.params.styles[layer.params.selectedStyle])+"\"";
   
      case Source.Vector:
      case Source.Images:
         return " src=\"http://resources.maperial.localhost/images/icons/layer."+layer.source.params.src+".png\"";
         
      case Source.Raster:
      default:
         return " src=\"http://resources.maperial.localhost/images/icons/layer.raster.png\""; // TODO : thumb du raster

   }
}

//----------------------------------------------------------------------------------------//

//ui-slider-handle ui-state-default ui-corner-all
Utils.buildSliderStyle = function (id){

   $("#" + id + " a").css({color:"#000"});
   $("#" + id + " a").css({textDecoration:"none"});
   $("#" + id + " a").css({textAlign:"center"});
   $("#" + id + " a").css({width:"20px"});
   $("#" + id + " a").css({height:"20px"});
   $("#" + id + " a").css({borderTopLeftRadius:"30px"});
   $("#" + id + " a").css({borderTopRightRadius:"30px"});
   $("#" + id + " a").css({borderBottomLeftRadius:"30px"});
   $("#" + id + " a").css({borderBottomRightRadius:"30px"});
   $("#" + id + " a").css({outline:"none"});

}

//----------------------------------------------------------------------------------------//

Utils.apply = function (toObject, methodName){
   return (function(param1, param2, param3, param4, param5, param6){toObject[methodName](param1, param2, param3, param4, param5, param6)});
}

Utils.getPoint = function (event) {
   var x = event.clientX - $(event.target).offset().left;
   var y = event.clientY - $(event.target).offset().top;

   return new Point(x,y);
}

//----------------------------------------------------------------------------------------//

Utils.cloneJsonObject = function (jsonObject) {
   return $.parseJSON(JSON.stringify(jsonObject));
}

//----------------------------------------------------------------------------------------//

function odump(o){
   console.log(Utils.cloneJsonObject(o));
}

//----------------------------------------------------------------------------------------//

//upgrade Object prototype
Object.size = function(obj) {
   var size = 0, key;
   for (key in obj) {
       if (obj.hasOwnProperty(key)) size++;
   }
   return size;
 };
