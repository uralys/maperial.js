
HUD.prototype.buildControls = function(){

   var me = this;
   
   this.element("control-zoom").slider({
      orientation: "vertical",
      range: "min",
      min: 1,
      max: 18,
      value: this.context.zoom,
      slide: function( event, ui ) {
         me.controlZoomCursor().html(ui.value);
      },
      change: function( event, ui ) {
         me.context.zoom = parseInt(ui.value);
         me.refreshZoom(true);
      }
    });
   
   this.element("control-up")    .click( function(){ me.maperial.context.mapCanvas.trigger(MaperialEvents.CONTROL_UP);     } );
   this.element("control-down")  .click( function(){ me.maperial.context.mapCanvas.trigger(MaperialEvents.CONTROL_DOWN);   } );
   this.element("control-left")  .click( function(){ me.maperial.context.mapCanvas.trigger(MaperialEvents.CONTROL_LEFT);   } );
   this.element("control-right") .click( function(){ me.maperial.context.mapCanvas.trigger(MaperialEvents.CONTROL_RIGHT);  } );
   
   Utils.buildSliderStyle("control-zoom"+this.maperial.name);

   this.refreshZoom();
}