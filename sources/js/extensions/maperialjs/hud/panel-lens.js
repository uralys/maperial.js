
//==================================================================//

HUD.prototype.buildLens = function() {

   console.log("     building lens...");

   //-----------------------------------------------------//

   this.element(HUD.LENS).empty();
   this.element(HUD.LENS).removeClass("hide"); 
   
   //-----------------------------------------------------//

   var options = {
      type  : Maperial.LENS,
      tagId : HUD.LENS+this.maperial.tagId, 
      width : 250,
      height: 250
   }
   
   var maperialLens = new Maperial(options)
   var config = maperialLens.emptyConfig();
   config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_OCM_TRANSPORT))
   
   maperialLens.apply(config)

   //-----------------------------------------------------//
   
   var me = this
   this.panel(HUD.LENS).draggable({ 
      snap: false,
      drag: function() {
         var offset = me.panel(HUD.LENS).offset()
         var newX = offset.left + me.panel(HUD.LENS).width()/2 
         var newY = offset.top + me.panel(HUD.LENS).height()/2

         var deltaX = me.lensCenterX - newX
         var deltaY = me.lensCenterY - newY
         me.lensCenterX = newX
         me.lensCenterY = newY;
         
         maperialLens.mapMover.moveMap(deltaX, deltaY);
      },   
   });
   
   //-----------------------------------------------------//
}

//==================================================================//