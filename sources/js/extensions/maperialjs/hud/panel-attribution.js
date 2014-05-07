
//==================================================================//

HUD.prototype.refreshAttribution = function(){
   
   this.buildAttributions(false)
   
   //------------------------------------------------------------//
   
   var mapWidth = this.mapView.context.mapCanvas[0].offsetWidth
   console.log("refreshAttribution", mapWidth)
   
   if(this.element("attribution").width() > mapWidth){
      console.log("refreshAttribution SMALL")
      this.buildAttributions(true)
   }
   else{
      console.log( this.element("attribution"))
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
   var maperialAttribution          = "by <a class=\"link\" target=\"_blank\" href=\"http://www.mapView.com\">__Maperial</a>."+attributionEnding;
   var requireMaperialAttribution   = false;
   var requireOSMAttribution        = false;

   // aggregation d'attribution pour le meme server 
   var geoSASAttribution            = false;

   if(this.mapView.config.layers.length > 1){
      maperialAttribution = "Fusion " + maperialAttribution;
      requireMaperialAttribution = true;
   }

   for(var i = 0; i < this.mapView.config.layers.length; i++){
      switch(this.mapView.config.layers[i].source.type){

         case Source.MaperialOSM : 
            
            maperialAttribution        = "Styled tiles" + (requireMaperialAttribution ? ", " : " ") + maperialAttribution
            requireOSMAttribution      = true
            requireMaperialAttribution = true
            break;

         case Source.SRTM : 
            
            maperialAttribution        = "SRTM tiles" + (requireMaperialAttribution ? ", " : " ") + maperialAttribution
            requireMaperialAttribution = true
            break;
            
         case Source.Images :
            
            switch(this.mapView.config.layers[i].source.params.src){
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

            switch(this.mapView.config.layers[i].source.params.src){
               case Source.WMS_BRETAGNECANTONS:
                  dataAttribution += " WMS data by <a class=\"link\" target=\"_blank\" href=\"http://cms.geobretagne.fr/\">GeoBretagne</a>."+attributionEnding;
                  break;
                  
               case Source.WMS_FRANCECOURSDEAU:
               case Source.WMS_SOLS_ILEETVILAINE:
                  if(!geoSASAttribution){
                     dataAttribution += " WMS data by <a class=\"link\" target=\"_blank\" href=\"http://geowww.agrocampus-ouest.fr/\">GeoSAS</a>."+attributionEnding;
                     geoSASAttribution = true;
                  }
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
