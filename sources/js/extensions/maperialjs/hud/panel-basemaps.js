HUD.prototype.buildBasemapsPanel = function(params, callBack) {

   console.log("     building Basemaps Panel...");

   //-----------------------------------------------------//

   this.element(HUD.BASEMAPS).empty();
   HUD["selectedBasemap"+this.mapView.name] = callBack;

   //-----------------------------------------------------//
   
   this.element(HUD.BASEMAPS).append("");
   this.element(HUD.BASEMAPS).append("" +
   		"<div class='row-fluid' onclick='HUD.selectedBasemap"+this.mapView.name+"()'> "+
         "   <div class='span6 offset1' }}>" +
         "      <p class=\"compositionSettingsTitle\">__Maperial customisable basemaps</p>" +
         "   </div>"+
         "   <div class='span1 offset4 touchable' }}>"+
         "      <i class='icon-remove icon-white'></i>"+
         "   </div>"+
         "<div class='row-fluid'>");

   //-----------------------------------------------------//

   var html = ""

   //-----------------------------------------------------//
   
   switch(params){
      case HUD.ALL_BASEMAPS:
         html += "" +
         	"<div class='row-fluid marginbottom'>" +
         	"   <div class='span3 basemap' title='__Maperial classic' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.MaperialOSM, Source.MAPERIAL_CLASSIC)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.mapView.classic.png' class='bigbutton'></img>" +
         	"   </div>" +
         	"   <div class='span3 basemap' title='__Maperial brownie' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.MaperialOSM, Source.MAPERIAL_BROWNIE)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.mapView.brownie.png' class='bigbutton'></img>" +
         	"   </div>" +
         	"   <div class='span3 basemap' title='__Maperial light' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.MaperialOSM, Source.MAPERIAL_LIGHT)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.mapView.light.png' class='bigbutton'></img>" +
         	"   </div>" +
         	"   <div class='span3 basemap' title='__Maperial yellow' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.MaperialOSM, Source.MAPERIAL_YELLOW)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.mapView.yellow.png' class='bigbutton'></img>" +
         	"   </div>" +
         	"</div>" 

      	html += "" +
         	"<div class='row-fluid marginbottom'>" +
         	"   <div class='span3 basemap' title='__Maperial green' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.MaperialOSM, Source.MAPERIAL_GREEN)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.mapView.green.png' class='bigbutton'></img>" +
         	"   </div>" +
         	"   <div class='span3 basemap' title='__Maperial pink' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.MaperialOSM, Source.MAPERIAL_PINK)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.mapView.pink.png' class='bigbutton'></img>" +
         	"   </div>" +
         	//"   <div class='span3 basemap' title='SRTM' onclick='HUD.selectedBasemap"+this.mapView.name+"(LayersManager.SRTM)'>" +
         	//"      <img src='http://static.maperial.localhost/images/buttons/sources/button.srtm.png' class='bigbutton'></img>" +
         	//"   </div>" +
         	"   <div class='span3 basemap' title='Shade' onclick='HUD.selectedBasemap"+this.mapView.name+"(LayersManager.Shade)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.shade.png' class='bigbutton'></img>" +
         	"   </div>" +
         	"</div>" 
      
      case HUD.IMAGE_BASEMAPS:
         html += ""+
            "<div class='row-fluid marginbottom'>" +
            "   <div class='span6' }}>" +
            "      <p class=\"compositionSettingsTitle\">Classic external tiles</p>" +
            "   </div>"+
            "</div>"+
            "<div class='row-fluid marginbottom'>" +
            "   <div class='span3 basemap' title='Mapquest' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_MAPQUEST)'>" +
            "     <img src='http://static.maperial.localhost/images/buttons/sources/button.images.mapquest.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Satellite' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_MAPQUEST_SATELLITE)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.mapquest.satellite.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='OSM' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_OSM)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.osm.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='OpenCycleMap' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_OCM_CYCLE)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.ocm.cycle.png' class='bigbutton'></img>" +
            "   </div>" +
            "</div>"
            
         html += ""+
            "<div class='row-fluid marginbottom'>" +
            "   <div class='span3 basemap' title='Watercolor' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_STAMEN_WATERCOLOR)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.stamen.watercolor.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Terrain' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_STAMEN_TERRAIN)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.stamen.terrain.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Toner' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_STAMEN_TONER)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.stamen.toner.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Toner BG' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_STAMEN_TONER_BG)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.stamen.toner-background.png' class='bigbutton'></img>" +
            "   </div>" +
            "</div>"
            
         html += ""+
            "<div class='row-fluid marginbottom'>" +
            "  <div class='span3 basemap' title='Transport' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_OCM_TRANSPORT)'>" +
            "     <img src='http://static.maperial.localhost/images/buttons/sources/button.images.ocm.transport.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Landscape' onclick='HUD.selectedBasemap"+this.mapView.name+"(Source.Images, Source.IMAGES_OCM_LANDSCAPE)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.ocm.landscape.png' class='bigbutton'></img>" +
            "   </div>" +
            "</div>"
   }

   //-----------------------------------------------------//
   
   this.element(HUD.BASEMAPS).append(html)
   
   $(".basemap").tooltip()
}


//====================================================================================//

HUD.prototype.openBasemaps = function(){
   this.buildBasemapsPanel(HUD.ALL_BASEMAPS, this.mapView.maperial.layersCreation.addBasemap);
   this.openPanel(HUD.BASEMAPS)
}

//-------------------------------------------------//

HUD.prototype.closeBasemaps = function(params, callBack){
   this.closePanel(params, callBack, HUD.BASEMAPS)
}

//====================================================================================//

HUD.prototype.closeData = function(params, callBack){
   this.closePanel(params, callBack, HUD.DATA)
}

//-------------------------------------------------//

HUD.prototype.openData = function(params){
   this.buildDataPanel(params, this.mapView.layersCreation.addData);
   this.openPanel(callBack, HUD.DATA)
}

//====================================================================================//

HUD.prototype.closePanel = function(panel){

   var mapWidth = this.mapView.context.mapCanvas[0].offsetWidth;
   var mapLeft = this.mapView.context.mapCanvas[0].offsetLeft;
   var margin = this.getMargin("right");

   var value = mapLeft + mapWidth + 550;
   value -= this.panel(panel).width();
   value -= margin;
   value -= 10;

   this.panel(panel).animate({
      left: value,
      duration: 200,
   });

}

//-------------------------------------------------//

HUD.prototype.openPanel = function(panel){

   var mapWidth = this.mapView.context.mapCanvas[0].offsetWidth;
   var mapLeft = this.mapView.context.mapCanvas[0].offsetLeft;
   var margin = this.getMargin("right");

   var value = mapLeft + mapWidth - 220;
   value -= this.panel(panel).width();
   value -= margin;
   value -= 10;

   this.panel(panel).animate({
      left: value, 
      duration: 200,
   });

}