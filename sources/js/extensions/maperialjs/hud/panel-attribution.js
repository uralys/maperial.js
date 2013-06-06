
//==================================================================//

HUD.prototype.refreshAttribution = function(){
   
   this.buildAttributions(false)
   
   //------------------------------------------------------------//
   
   var mapWidth = this.context.mapCanvas[0].offsetWidth
   
   if(this.element("attribution").width() > mapWidth){
      this.buildAttributions(true)
   }
   else{
      this.element("attribution").css("max-width", "1500px")      
      this.element("attribution").css("width", this.element("attribution").width() + 2)
      this.placeElementAt(this.element("attribution"), -2, "bottom")
      this.placeElementAt(this.element("attribution"), 0, "right")
   }
   
}

//==================================================================//

HUD.prototype.buildAttributions = function(isSmall){
   
   this.element("attribution").empty();

   if(isSmall){
      this.element("attribution").css("max-width", "250px")
      this.element("attribution").css("font-size", "10px")
   }

   var attributionEnding = "";
   if(isSmall)
      attributionEnding = "<br/>";

   var tilesAttribution             = "";
   var dataAttribution              = "";
   var maperialAttribution          = "by <a class=\"link\" target=\"_blank\" href=\"http://www.maperial.com\">__Maperial</a>."+attributionEnding;
   var requireMaperialAttribution   = false;
   var requireOSMAttribution        = false;

   if(this.maperial.config.layers.length > 1){
      maperialAttribution = "Fusion " + maperialAttribution;
      requireMaperialAttribution = true;
   }

   for(var i = 0; i < this.maperial.config.layers.length; i++){
      switch(this.maperial.config.layers[i].source.type){

         case Source.MaperialOSM : 
            
            maperialAttribution        = "Styled tiles" + (requireMaperialAttribution ? ", " : " ") + maperialAttribution
            requireOSMAttribution      = true
            requireMaperialAttribution = true
            break;

         case Source.SRTM : 
         case Source.Shade : 
            
            maperialAttribution        = "SRTM tiles" + (requireMaperialAttribution ? ", " : " ") + maperialAttribution
            requireMaperialAttribution = true
            break;
            
         case Source.Images :
            
            switch(this.maperial.config.layers[i].source.params.src){
               case Source.IMAGES_MAPQUEST:
               case Source.IMAGES_MAPQUEST_SATELLITE:
                  tilesAttribution += " Basemap tiles by <a class=\"link\" target=\"_blank\" href=\"http://www.mapquest.com\">MapQuest</a>."+attributionEnding;
                  requireOSMAttribution = true;
                  break;

               case Source.IMAGES_OSM:
                  tilesAttribution += " Basemap tiles by <a class=\"link\" target=\"_blank\" href=\"http://openstreetmap.org\">© OpenStreetMap contributors</a>."+attributionEnding;
                  requireOSMAttribution = true;
                  break;

               case Source.IMAGES_OCM_CYCLE:
               case Source.IMAGES_OCM_TRANSPORT:
               case Source.IMAGES_OCM_LANDSCAPE:
                  tilesAttribution += " Basemap tiles by <a class=\"link\" target=\"_blank\" href=\"www.thunderforest.com\">OpenCycleMap</a>."+attributionEnding;
                  requireOSMAttribution = true;
                  break;

               case Source.IMAGES_STAMEN_WATERCOLOR:
               case Source.IMAGES_STAMEN_TERRAIN:
               case Source.IMAGES_STAMEN_TONER:
               case Source.IMAGES_STAMEN_TONER_BG:
                  tilesAttribution += " Basemap tiles by <a class=\"link\" target=\"_blank\" href=\"http://maps.stamen.com\">Stamen Design</a>."+attributionEnding;
                  requireOSMAttribution = true;
                  break;

            }
            
            break;
            
         case Source.WMS :

            switch(this.maperial.config.layers[i].source.params.src){
               case Source.WMS_BRETAGNECANTONS:
                  dataAttribution += " WMS data by <a class=\"link\" target=\"_blank\" href=\"http://cms.geobretagne.fr/\">GeoBretagne</a>."+attributionEnding;
                  break;
                  
               case Source.WMS_FRANCECOURSDEAU:
                  dataAttribution += " WMS data by <a class=\"link\" target=\"_blank\" href=\"http://geowww.agrocampus-ouest.fr/\">GeoSAS</a>."+attributionEnding;
                  break;
                  
               case Source.WMS_CORINE_LAND_COVER:
                  dataAttribution += " WMS data by <a class=\"link\" target=\"_blank\" href=\"http://www.eea.europa.eu/\">EEA</a>."+attributionEnding;
                  break;
            }
            
            break;
      }
      
   }

   var html = "";
   
   if(requireMaperialAttribution)
      html += maperialAttribution
   
   html += tilesAttribution
   html += dataAttribution
   
   if(requireOSMAttribution)
      html += " Map data by <a class=\"link\" target=\"_blank\" href=\"http://openstreetmap.org\">© OpenStreetMap contributors</a>.";

   this.element("attribution").append(html);
   
   if(isSmall){
      this.placeElementAt(this.element("attribution"), -2, "bottom")
      this.placeElementAt(this.element("attribution"), 0, "right")  
   }
}


//==================================================================//
//
//HUD.prototype.smallMapAttribution = function(){
//
// this.element("attribution").empty();
// this.element("attribution").css("max-width", "250px")
// this.element("attribution").css("font-size", "10px")
//   
//   var maperialAttribution = this.maperial.config.layers.length > 1 ? "Fusion by <a class=\"link\" target=\"_blank\" href=\"http://www.maperial.com\">__Maperial</a>.<br/>" : "";
//   var tilesAttribution    = "";
//   var requireOSMAttribution     = false;
//
//   for(var i = 0; i < this.maperial.config.layers.length; i++){
//      if(this.maperial.config.layers[i].source.type == Source.MaperialOSM){
//         maperialAttribution = "Styled tiles and fusion by <a class=\"link\" target=\"_blank\" href=\"http://www.maperial.com\">__Maperial</a>.<br/>"
//         requireOSMAttribution = true
//      }
//      else if(this.maperial.config.layers[i].source.type == Source.Images){
//         switch(this.maperial.config.layers[i].source.params.src){
//            case Source.IMAGES_MAPQUEST:
//            case Source.IMAGES_MAPQUEST_SATELLITE:
//               tilesAttribution += " Basemap tiles by <a class=\"link\" target=\"_blank\" href=\"http://www.mapquest.com\">MapQuest</a>.<br/>"
//               requireOSMAttribution = true
//               break;
//
//            case Source.IMAGES_OSM:
//               tilesAttribution += " Basemap tiles by <a class=\"link\" target=\"_blank\" href=\"http://openstreetmap.org\">© OpenStreetMap contributors</a>.<br/>"
//               requireOSMAttribution = true
//               break;
//
//            case Source.IMAGES_OCM_CYCLE:
//            case Source.IMAGES_OCM_TRANSPORT:
//            case Source.IMAGES_OCM_LANDSCAPE:
//               tilesAttribution += " Basemap tiles by <a class=\"link\" target=\"_blank\" href=\"www.thunderforest.com\">OpenCycleMap</a>.<br/>"
//               requireOSMAttribution = true
//               break;
//               
//            case Source.IMAGES_STAMEN_WATERCOLOR:
//            case Source.IMAGES_STAMEN_TERRAIN:
//            case Source.IMAGES_STAMEN_TONER:
//            case Source.IMAGES_STAMEN_TONER_BG:
//               tilesAttribution += " Basemap tiles by <a class=\"link\" target=\"_blank\" href=\"http://maps.stamen.com\">Stamen Design</a>.<br/>"
//               requireOSMAttribution = true
//               break;
//
//         }
//      }
//   }
//   
//   var html = "";
//   html += maperialAttribution
//   html += tilesAttribution
//   
//   if(requireOSMAttribution)
//      html += " Data by <a class=\"link\" target=\"_blank\" href=\"http://openstreetmap.org\">© OpenStreetMap contributors</a>."
//
//   this.element("attribution").append(html);
//
//   this.placeElementAt(this.element("attribution"), -2, "bottom")
//   this.placeElementAt(this.element("attribution"), 0, "right")  
//}