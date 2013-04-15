/**
 * Listens the switch panel
 */
HUD.prototype.refreshSwitchImagesPanel = function() {

   console.log("     building switch...");
   
   var layersManager = this.maperial.layersManager;
   
   this.element("imagesMapquest").click(function(){
      layersManager.switchImagesTo(Source.IMAGES_MAPQUEST)
   });

   this.element("imagesMapquestSatellite").click(function(){
      layersManager.switchImagesTo(Source.IMAGES_MAPQUEST_SATELLITE)
   });

   this.element("imagesOSM").click(function(){
      layersManager.switchImagesTo(Source.IMAGES_OSM)
   });
}