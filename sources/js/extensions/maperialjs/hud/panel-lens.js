
//==================================================================//

HUD.prototype.buildLens = function() {

   console.log("     building lens...");

   //-----------------------------------------------------//

   this.element(HUD.LENS).empty();
   this.element(HUD.LENS).removeClass("hide"); 
   
   //-----------------------------------------------------//

   var options = {
      type  : Maperial.LENS,
      parent: this.maperial,
      tagId : HUD.LENS+this.maperial.tagId, 
      width : 250,
      height: 250
   }
   
   this.lens = new Maperial(options)
   var config = this.lens.emptyConfig();
//   config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_OCM_TRANSPORT))
   config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_STAMEN_TONER))
   
   this.lens.apply(config)

   //-----------------------------------------------------//
   
   this.panel(HUD.LENS).draggable({ 
      snap: false,   
   });
   
   //-----------------------------------------------------//
   
//   var me = this
//   var panelWidth    =  this.panel(HUD.LENS).width()/2
//   var panelHeight   =  this.panel(HUD.LENS).height()/2
//   
//   this.panel(HUD.LENS).draggable({ 
//      snap: false,
//      drag: function(event) {
//          
//         var offset = $(this).offset();
//         var newX = offset.left  + panelWidth 
//         var newY = offset.top   + panelHeight
//
//         var deltaX = me.lensCenterX - newX
//         var deltaY = me.lensCenterY - newY
//         me.lensCenterX = newX
//         me.lensCenterY = newY;
//         
//         me.lens.mapMover.moveMap(deltaX, deltaY);
//         me.maperial.mapRenderer.DrawScene(true, true)
//      }
//   });
   
   //-----------------------------------------------------//
}

//==================================================================//