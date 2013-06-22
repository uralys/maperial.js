//=================================================================================//
//MaperialBuilder
//------------------------------------------------------------//

function MaperialBuilder(){}

//------------------------------------------------------------//

MaperialBuilder.prototype.loadTags = function(){

   var tags = $("maperial");

   for(var s=0; s < tags.length; s++){

      var map = {};
      for(a in tags[s].attributes)
         map[tags[s].attributes[a].nodeName] = tags[s].attributes[a].nodeValue;

      map.name = "_" + map.uid + "_" + s;

      try{
         map.width = tags[s].attributes["width"].nodeValue;
         map.height = tags[s].attributes["height"].nodeValue;
      }
      catch(e){}

      $("#"+tags[s].parentElement.id).append("<div id=\"" + map.name + "\"></div")

      this.build(map);
   }
}

//------------------------------------------------------------//

MaperialBuilder.prototype.build = function(map){
   var builder = this;
   $.ajax({
      url : "http://api.maperial.com/api/map/"+map.uid,
      dataType : 'json',

      success : function(config) {
         builder[map.name] = new Maperial(map.name, map.width, map.height).apply(config);
      },
   });
}

//=================================================================================//

document.write('<' + 'link href="http://static.maperial.localhost/css/maperial-js.min.localhost.css" type="text/css" rel="stylesheet"><' + '/>');

//=================================================================================//

window.scriptLoader.getScripts([
     "//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js",
     "http://code.jquery.com/ui/1.9.2/jquery-ui.js",
     "http://static.maperial.localhost/js/maperial-js.min.localhost.js",
     "https://maps.googleapis.com/maps/api/js?key=AIzaSyATwlkawyHykpfJF24jcPgL_b8kK8zO2Bc&sensor=false&libraries=places,panoramio",
     ], 
     function(){
       window.maperialBuilder = window.maperialBuilder || new MaperialBuilder();
       window.maperialBuilder.loadTags();
});