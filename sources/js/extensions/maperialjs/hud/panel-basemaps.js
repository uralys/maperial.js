HUD.prototype.buildBasemapsPanel = function(params, callBack) {

   console.log("     building Basemaps Panel...");

   //-----------------------------------------------------//

   this.element(HUD.BASEMAPS).empty();
   HUD["selectedBasemap"+this.maperial.tagId] = callBack;

   //-----------------------------------------------------//
   
   this.element(HUD.BASEMAPS).append("");
   this.element(HUD.BASEMAPS).append("" +
   		"<div class='row-fluid' onclick='HUD.selectedBasemap"+this.maperial.tagId+"()'> "+
         "   <div class='span6 offset2' }}>" +
         "      <p class=\"compositionSettingsTitle\">Basemaps</p>" +
         "   </div>"+
         "   <div class='span1 offset3 btn-small btn-primary' }}>"+
         "      <i class='icon-arrow-right icon-white'></i>"+
         "   </div>"+
         "<div class='row-fluid'>");

   //-----------------------------------------------------//

   var html = ""

   //-----------------------------------------------------//
   
   switch(params){
      case HUD.ALL_BASEMAPS:
         html += "" +
         	"<div class='row-fluid marginbottom'>" +
         	"   <div class='span3 basemap' title='__Maperial styles' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.MaperialOSM, Source.MAPERIAL_CLASSIC)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.maperial.classic.png' class='bigbutton'></img>" +
         	"   </div>" +
         	"   <div class='span3 basemap' title='SRTM' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(LayersManager.SRTM)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.srtm.png' class='bigbutton'></img>" +
         	"   </div>" +
         	"   <div class='span3 basemap' title='Shade' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(LayersManager.Shade)'>" +
         	"      <img src='http://static.maperial.localhost/images/buttons/sources/button.shade.png' class='bigbutton'></img>" +
         	"   </div>" +
         	"</div>" 
      
      case HUD.IMAGE_BASEMAPS:
         html += ""+
            "<div class='row-fluid marginbottom'>" +
            "   <div class='span3 basemap' title='Mapquest' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_MAPQUEST)'>" +
            "     <img src='http://static.maperial.localhost/images/buttons/sources/button.images.mapquest.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Satellite' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_MAPQUEST_SATELLITE)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.mapquest.satellite.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='OSM' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_OSM)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.osm.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='OpenCycleMap' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_OCM_CYCLE)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.ocm.cycle.png' class='bigbutton'></img>" +
            "   </div>" +
            "</div>"
            
         html += ""+
            "<div class='row-fluid marginbottom'>" +
            "   <div class='span3 basemap' title='Watercolor' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_STAMEN_WATERCOLOR)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.stamen.watercolor.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Terrain' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_STAMEN_TERRAIN)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.stamen.terrain.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Toner' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_STAMEN_TONER)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.stamen.toner.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Toner BG' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_STAMEN_TONER_BG)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.stamen.toner-background.png' class='bigbutton'></img>" +
            "   </div>" +
            "</div>"
            
         html += ""+
            "<div class='row-fluid marginbottom'>" +
            "  <div class='span3 basemap' title='Transport' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_OCM_TRANSPORT)'>" +
            "     <img src='http://static.maperial.localhost/images/buttons/sources/button.images.ocm.transport.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 basemap' title='Landscape' onclick='HUD.selectedBasemap"+this.maperial.tagId+"(Source.Images, Source.IMAGES_OCM_LANDSCAPE)'>" +
            "      <img src='http://static.maperial.localhost/images/buttons/sources/button.images.ocm.landscape.png' class='bigbutton'></img>" +
            "   </div>" +
            "</div>"
   }

   //-----------------------------------------------------//
   
   this.element(HUD.BASEMAPS).append(html)
   
   $(".basemap").tooltip()
}