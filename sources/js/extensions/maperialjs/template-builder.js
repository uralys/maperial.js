
//==================================================================//

function TemplateBuilder(){}

//==================================================================//

TemplateBuilder.prototype.build = function(mapView){

   this.mapView  = mapView;
   this.config   = mapView.config;
   this.name     = mapView.name;
   
   this.container = $("#"+this.name);
   this.container.empty();
   this.container.addClass(this.mapView.type);

   console.log("drawing template "+this.name+"...");
   
   this.buildMap();
   this.buildHUD();
   
   this.prepareChildren();
}

//==================================================================//

TemplateBuilder.prototype.buildMap = function(){
   
   var html = "";
   html += "<canvas id=\"Map_"+this.name+"\" class=\"maperial-map canvas-"+this.mapView.type+"\"></canvas>";
   html += "<canvas id=\"fakeCanvas\" class=\"hide\"></canvas>";
   
   if(this.config.map.requireBoundingBoxDrawer){
      html += "<div id=\"drawBoardContainer"+this.name+"\" class=\"hide\">";
      html += "   <canvas id=\"drawBoard"+this.name+"\"></canvas>";
      html += "</div>";
   }
   
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildHUD = function(){
   
   switch(this.mapView.type){
      case Maperial.LENS : 
         break;

      case Maperial.COMPLETE : 
         this.buildHUDSettings();
         this.buildSwitchImages();
         this.buildCompositions();
         this.buildLayerSettings();
         this.buildLatLon();
         this.buildScale();
         this.buildMapKey();
         this.buildControls();
         this.buildGeoloc();
         this.buildDetailsMenu();
         this.buildQuickEdit();
         this.buildZooms();
         this.buildColorbar();
         this.buildBasemapsPanel();
         this.buildDataPanel();
         
         this.prepareAttribution();
         break;
   }
}

//==================================================================//

TemplateBuilder.prototype.buildPanel = function(name, show){
   
   var html = "";
   html += "<div class=\"panel panel"+name+" snapper "+(show ? "" : "hide")+"\" id=\"panel"+this.mapView.getFullName(name)+"\" >";
   html += "    <div id=\""+this.mapView.getFullName(name)+"\"></div>";
   html += "</div>";
   
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildHUDSettings = function(){

   var html = "";
   html += "<a class=\"trigger snapper trigger"+this.mapView.getFullName(HUD.SETTINGS)+" hide\" id=\"trigger"+this.mapView.getFullName(HUD.SETTINGS)+"\" href=\"#\"><i id=\"icon"+this.mapView.getFullName(HUD.SETTINGS)+"\" class=\"icon-cog icon-white\"></i></a>";
   html += "<div class=\"panel snapper panel"+this.mapView.getFullName(HUD.SETTINGS)+" hide\" id=\"panel"+this.mapView.getFullName(HUD.SETTINGS)+"\" >";
   html += "    <div id=\"HUDSettings"+this.name+"\"></div>";
   html += "</div>";
      
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildSwitchImages = function(){

   var html = "";
   html += "<div class=\"panel panel"+this.mapView.getFullName(HUD.SWITCH_IMAGES)+" snapper hide\" id=\"panel"+this.mapView.getFullName(HUD.SWITCH_IMAGES)+"\" >";
   html += "    <div id=\""+this.mapView.getFullName(HUD.SWITCH_IMAGES)+"\">";
   html += "         <img id=\"imagesMapquest"+this.name+"\" class=\"sourceThumb touchable\" src=\"http://static.maperial.localhost/images/icons/layer.images.mapquest.png\"></img>";
   html += "         <img id=\"imagesMapquestSatellite"+this.name+"\" class=\"sourceThumb touchable\" src=\"http://static.maperial.localhost/images/icons/layer.images.mapquest.satellite.png\"></img>";
   html += "         <img id=\"imagesOSM"+this.name+"\" class=\"sourceThumb touchable\" src=\"http://static.maperial.localhost/images/icons/layer.images.osm.png\"></img>";
   html += "    </div>";
   html += "</div>";
   
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildCompositions = function(){
   this.buildPanel(HUD.COMPOSITIONS);
}

//==================================================================//

TemplateBuilder.prototype.buildLayerSettings = function(){
   this.buildPanel(HUD.LAYER_SETTINGS);
}

//==================================================================//

TemplateBuilder.prototype.buildLatLon = function(){
   
   var html = "";
   html += "<div class=\"panel panel"+HUD.LATLON+" snapper hide\" id=\"panel"+this.mapView.getFullName(HUD.LATLON)+"\"  >";
   html += "    <div id=\""+this.mapView.getFullName(HUD.LATLON)+"\" class=\"row-fluid latlon\">";
   html += "         <div id=\"latitude_"+this.name+"\" class=\"span6\"></div>";
   html += "         <div id=\"longitude_"+this.name+"\" class=\"span6\"></div>";
   html += "    </div>";
   html += "</div>";
   
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildScale = function(){

   var html = "";
   html += "<div class=\"panel panelScale snapper hide\" id=\"panelScale_"+this.name+"\" >";
   html += "    <div id=\"Scale_"+this.name+"\" class=\"scale\">";
   html += "         <div id=\"metersContainer_"+this.name+"\" class=\"scaleContainer\"></div>";
   html += "         <div id=\"milesContainer_"+this.name+"\" class=\"scaleContainer\"></div>";
   html += "    </div>";
   html += "</div>";
   
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildMapKey = function(){
   
   var html = "";
   html += "<div class=\"panel panelMapKey snapper hide\" id=\"panelMapKey_"+this.name+"\" >";
   html += "    <div id=\"MapKey_"+this.name+"\">";
   html += "         <img src=\"http://static.maperial.localhost/images/global/dummy.legend.png\"></div>";
   html += "    </div>";
   html += "</div>";
   
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildControls = function(){
   
   var html = "";
   html += "<div class=\"panel panelControls snapper hide\" id=\"panelControls_"+this.name+"\" >";
   html += "    <div id=\"control-up_"+this.name+"\" title=\"Up\" class=\"control-up\"></div>";
   html += "    <div id=\"control-down_"+this.name+"\" title=\"Down\" class=\"control-down\"></div>";
   html += "    <div id=\"control-left_"+this.name+"\" title=\"Left\" class=\"control-left\"></div>";
   html += "    <div id=\"control-right_"+this.name+"\" title=\"Right\" class=\"control-right\"></div>";
   html += "    <div id=\"control-zoom_"+this.name+"\" class=\"control-zoom\"></div>";
   html += "</div>";
   
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildGeoloc = function(){

   var html = "";
   html += "<div class=\"panel panelGeoloc snapper hide\" id=\"panelGeoloc_"+this.name+"\" >";
   html += "   <div id=\"geoloc_"+this.name+"\" class=\"row-fluid\">";
   html += "      <div class=\"span9\">";
   html += "         <input type=\"text\" id=\"GeoLoc_"+this.name+"\" name=\"GeotLoc_"+this.name+"\" class=\"inputGeoloc\">";
   html += "      </div>";
   html += "      <div class=\"span2 offset1\">";
   html += "         <div id=\"GeoLocGo_"+this.name+"\" class=\"btn-small btn-primary\"><i class=\"icon-arrow-right icon-white\"></i></div>";
   html += "      </div>";
   html += "   </div>";
   html += "</div>";
   
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildDetailsMenu = function(){
   this.buildPanel(HUD.DETAILS_MENU);
}

//==================================================================//

TemplateBuilder.prototype.buildQuickEdit = function(){
   this.buildPanel(HUD.QUICK_EDIT);
}

//==================================================================//

TemplateBuilder.prototype.buildZooms = function(){
   this.buildPanel(HUD.ZOOMS);
}

//==================================================================//

//TemplateBuilder.prototype.buildMagnifier = function(){
//   
//   var html = "";
//   html += "<div class=\"panel panelMagnifier snapper hide\" id=\"panelMagnifier_"+this.name+"\" >";
//   html += "    <canvas id=\"Magnifier_"+this.name+"\" class=\"maperial-magnifier\" width=\"200\" height=\"200\"></canvas>";
//   html += "</div>";
//   
//   this.container.append(html);
//}

//==================================================================//

TemplateBuilder.prototype.buildColorbar = function(){
   this.buildPanel(HUD.COLORBAR);
}

//==================================================================//

TemplateBuilder.prototype.prepareAttribution = function(){
   
   var html = "";
   html += "<p id=\"attribution_"+this.name+"\" class=\"attribution\">"
   html += "</p>"
   
   this.container.append(html);
}

//==================================================================//

TemplateBuilder.prototype.buildBasemapsPanel = function() {
   this.buildPanel(HUD.BASEMAPS);
}

//==================================================================//

TemplateBuilder.prototype.buildDataPanel = function() {
   this.buildPanel(HUD.DATA);
}

//==================================================================//

TemplateBuilder.prototype.prepareChildren = function() {

   for(var i = 0; i < this.config.children.length; i++){
      var child = this.config.children[i]
      this.buildPanel(child.name, true);
   }
}