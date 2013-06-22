//
////==================================================================//
//
//HUD.prototype.buildLens = function() {
//
//   console.log("     building lens...");
//
//   //-----------------------------------------------------//
//
//   this.element(HUD.LENS).empty();
//   this.element(HUD.LENS).removeClass("hide"); 
//   
//   //-----------------------------------------------------//
//
//   var options = {
//      type  : Maperial.LENS,
//      parent: this.maperial,
//      name : HUD.LENS+this.maperial.name, 
//      width : 250,
//      height: 250
//   }
//   
//   this.lens = new Maperial(options)
//   var config = this.lens.emptyConfig();
//   config.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_STAMEN_TONER))
//   
//   this.lens.apply(config)
//
//   //-----------------------------------------------------//
//   
//   var me = this
//   this.panel(HUD.LENS).draggable({ 
//      snap: false,   
//      start: function(event) {
//         me.moveLensInterval = setInterval( Utils.apply ( me, "moveLens" ) , 0.1 );
//      },
//      stop: function(event) {
//         clearInterval(me.moveLensInterval);
//         me.moveLensInterval = null
//      }
//   });
//   
//}
//
////==================================================================//
//
//HUD.prototype.moveLens = function (event) {
//   
//   var offset = this.panel(HUD.LENS).offset();
//
//   if(this.lensStartCenterP == null){
//      this.lensStartCenterP = new Point(offset.left , offset.top);
//   }
//
//   var centerP = this.context.coordS.MetersToPixels(this.context.centerM.x, this.context.centerM.y, this.context.zoom);
//   var lensCenterP = new Point( centerP.x + offset.left - this.lensStartCenterP.x , centerP.y - offset.top + this.lensStartCenterP.y);
//
//   this.lens.context.centerM = this.lens.context.coordS.PixelsToMeters ( lensCenterP.x, lensCenterP.y, this.lens.context.zoom );
//   this.lens.mapRenderer.DrawScene()
//
//}
