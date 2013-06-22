
HUD.prototype.buildTriggers = function(){

   //--------------------------------------------------------//

   var hud = this;

   //--------------------------------------------------------//
   // Init Triggers

   this.allPanels().click(function(){
      var element = $(this).context.id.replace("panel","").replace(hud.maperial.name,"");
      hud.putOnTop(element);
   });

   this.allTriggers().click(function(){
      hud.clickOnTrigger($(this));
      return false;
   });

   //--------------------------------------------------------//
   // Dragging

   //-----------------
   // snapping

   this.allPanels().draggable({ snap: ".snapper", containment: "#Map"+this.maperial.name, scroll: false });
   this.allTriggers().draggable({ snap: ".snapper", containment: "#Map"+this.maperial.name, scroll: false });

   //------------------
   // disable dragging

   for (element in this.maperial.config.hud.elements) {
      if(this.maperial.config.hud.elements[element].disableDrag){
         this.panel(element).draggable( 'disable' );
         this.trigger(element).draggable( 'disable' );
      }
   }

   //---------------
   // panels

   this.allPanels().bind('dragstart',function( event ){

      var id = $(this).context.id;
      var element = id.replace("panel","").replace(hud.maperial.name,"");

      hud.putOnTop(element);

      // hide the close button
      hud.trigger(element).css({
         opacity : 0
      });
   });


   // --  preventing dragstart when scrolling the detailsMenu using scrollBar
   // note : bug when scrolling then trying immediately to drag..the user must dragstart twice
   $( "#panelDetailsMenu" ).bind('dragstart',function( event ){
      if(event.srcElement.id == "panelDetailsMenu"){

         // show the close button
         $("#triggerDetailsMenu").css({
            opacity : 1
         });

         return false;
      }   
   });

   this.allPanels().bind('dragstop',function( event ){
      var id = $(this).context.id;
      var element = id.replace("panel","").replace(hud.maperial.name,"");
      var newTop = $("#"+id).css("top");
      var newLeft = $("#"+id).css("left");

      hud.trigger(element).css({
         top: newTop,
         left: newLeft,
         opacity : 1
      });

   });

   //---------------
   // triggers

   this.allTriggers().bind('dragstart',function( event ){
      $(this).addClass('beingdrag');
      $(this).css('right', 'auto');
      $(this).css('bottom', 'auto');

      var element = $(this).context.id.replace("trigger","").replace(hud.maperial.name,"");
      hud.putOnTop(element);
   });

   this.allTriggers().bind('dragstop',function( event ){
      var id = $(this).context.id;
      var element = id.replace("trigger","").replace(hud.maperial.name,"");

      var newTop = $("#"+id).css("top");
      var newLeft = $("#"+id).css("left");
      this.panel(element).css({
         top: newTop,
         left: newLeft
      });

   });

}

//------------------------------------------------//

HUD.prototype.showTrigger = function(element){
   this.icon(element).show("fast");
   this.trigger(element).removeClass("active");
}

//------------------------------------------------//

HUD.prototype.hideTrigger = function(element){
   this.icon(element).hide("fast");
   this.panel(element).hide("fast");
   this.trigger(element).addClass("active");
}

//------------------------------------------------//

HUD.prototype.clickOnTrigger = function(trigger){
   var element = trigger[0].id.replace("trigger","").replace(this.maperial.name,"");
   this.putOnTop(element);

   if (trigger.hasClass('beingdrag')) {
      trigger.removeClass('beingdrag');
   }
   else {

      if (trigger.hasClass('active') && !this.maperial.config.hud.elements[element].disableDrag) {
         trigger.draggable("enable");
      }
      else{
         trigger.draggable("disable");
      }

      this.icon(element).toggle("fast");
      this.panel(element).toggle("fast");
      trigger.toggleClass("active");
   }
}
