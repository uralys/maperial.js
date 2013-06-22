

HUD.prototype.buildDataPanel = function(params, callBack) {

   console.log("     building Data Panel...");

   //-----------------------------------------------------//

   this.element(HUD.DATA).empty();
   HUD["selectedData"+this.maperial.name] = callBack;

   //-----------------------------------------------------//
   
   this.element(HUD.DATA).append("");
   this.element(HUD.DATA).append("" +
   		"<div class='row-fluid' onclick='HUD.selectedData"+this.maperial.name+"()'> "+
         "   <div class='span6 offset2' }}>" +
         "      <p class=\"compositionSettingsTitle\">Data</p>" +
         "   </div>"+
         "   <div class='span1 offset3 touchable' }}>"+
         "      <i class='icon-remove icon-white'></i>"+
         "   </div>"+
         "<div class='row-fluid'>");

   //-----------------------------------------------------//

   var html = ""

   //-----------------------------------------------------//
   
   switch(params){
      case HUD.WMS_DATA:
         html += "" +
            "<div class='row-fluid marginbottom'>" +
            "   <div class='span3 wms' title='Cantons de Bretagne' onclick='HUD.selectedData"+this.maperial.name+"(Source.WMS, Source.WMS_BRETAGNECANTONS)'>" +
            "     <img src='http://static.maperial.localhost/images/buttons/sources/button.wms.bretagnecantons.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 wms' title='Cours d eau en France' onclick='HUD.selectedData"+this.maperial.name+"(Source.WMS, Source.WMS_FRANCECOURSDEAU)'>" +
            "     <img src='http://static.maperial.localhost/images/buttons/sources/button.wms.francecoursdeau.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 wms' title='Ille et Vilaine : Unités Cartographiques de Sol' onclick='HUD.selectedData"+this.maperial.name+"(Source.WMS, Source.WMS_SOLS_ILEETVILAINE)'>" +
            "     <img src='http://static.maperial.localhost/images/buttons/sources/button.wms.sols_ileetvilaine.png' class='bigbutton'></img>" +
            "   </div>" +
            "   <div class='span3 wms' title='France : Occupation des sols' onclick='HUD.selectedData"+this.maperial.name+"(Source.WMS, Source.WMS_CORINE_LAND_COVER)'>" +
            "     <img src='http://static.maperial.localhost/images/buttons/sources/button.wms.corine_land_cover.png' class='bigbutton'></img>" +
            "   </div>" +
            "</div>"
            
   }

   //-----------------------------------------------------//
   
   this.element(HUD.DATA).append(html)
   $(".wms").tooltip()
}