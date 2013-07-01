
/**
 * Draw the HUD settings panel
 */
HUD.prototype.refreshSettingsPanel = function() {

   console.log("------->  refreshSettingsPanel")
   
   
   this.element(HUD.SETTINGS).empty(); 
   var panelHeight = 0;
   var configHUD = this.mapView.config.hud;
   var hud = this;

   for (name in configHUD.elements) {
      console.log("-------> ",name, this.element(HUD.SETTINGS))

      // ----- checking config options
      if(configHUD.elements[name].disableHide){ 
         continue;
      }  
      
      var nameInTag = name + this.mapView.name; 

      // ----- appending div
      var div = "<div class=\"row-fluid marginbottom\">" +
      "<div class=\"span5 offset1\">" + configHUD.elements[name].label + "</div>" +
      "<div class=\"slider-frame offset6\">" +
      "   <span class=\"slider-button\" id=\"toggle"+nameInTag+"\"></span>" +
      "</div>" +
      "</div>";

      this.element(HUD.SETTINGS).append(div); 
      panelHeight += 50;

      // ----- toggle listeners

      $('#toggle'+nameInTag).click((function(name){
         return function(){
            if($(this).hasClass('on')){
               $(this).removeClass('on');
               hud.element(configHUD.elements[name].type+name).addClass("hide");

               if(configHUD.elements[name].type == HUD.TRIGGER)
                  hud.hideTrigger(name);
            }
            else{
               $(this).addClass('on');
               hud.element(configHUD.elements[name].type+name).removeClass("hide");
               hud.showTrigger(name);
            }
         }
      })(name));

      if(configHUD.elements[name].show){
         $("#toggle"+nameInTag).addClass("on");
      }
   }

   this.panel(HUD.SETTINGS).css("height", panelHeight+"px");
}