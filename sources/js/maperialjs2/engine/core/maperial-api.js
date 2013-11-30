//=====================================================================================================//

function MaperialAPI(){}

//=====================================================================================================//

/**
 * options:
 * 
 *    # mandatory ----------
 *       
 *       view : "div.id"  (can be used as only param)
 *       
 *    # others -------------
 *    
 *       type
 *          Maperial.MAIN (default)
 *          Maperial.ANCHOR
 *          Maperial.LENS
 *          Maperial.MINIFIER
 *          Maperial.MAGNIFIER
 *       
 *       defaultZoom
 *          default Maperial.DEFAULT_ZOOM
 *       
 *       latitude 
 *          default Maperial.DEFAULT_LATITUDE
 *
 *       longitude
 *          default Maperial.DEFAULT_LONGITUDE
 *       
 */
MaperialAPI.prototype.createView = function (options) {

   //-------------------------------------------
   // Checking options
   
   var options = Utils.prepareOptions(options, "view")
   if(!options){
      console.log("Wrong call to createView. Check the options")
   }

   //-------------------------------------------
   // Checking view 

   console.log("Creating " + options.view  + "...")
   
   if($("#" + options.view )[0] == null){
      console.log("View " + options.view  + " could not be found")
      return
   }

   //-------------------------------------------
   // Set defaults

   if(options.type === undefined){
      options.type = Maperial.MAIN
   }
   
   if(options.latitude === undefined){
      options.latitude = Maperial.DEFAULT_LATITUDE
   }
   
   if(options.longitude === undefined){
      options.longitude = Maperial.DEFAULT_LONGITUDE
   }

   //-------------------------------------------
   // Proceed
}



//=====================================================================================================//

/**
 * views :  
 *    Each view in the array will have an image layer with the provided source.
 *    
 * options :
 *    source : Source.IMAGES_* (can be used as only param)
 *    
 * # old --------------- 
 *    mainConfig.layers.push(LayersManager.getImagesLayerConfig(Source.Images, Source.IMAGES_OCM_TRANSPORT))
 *    
 */
MaperialAPI.prototype.addImageLayer = function (views, options) {

   //-------------------------------------------
   // Checking options

   if(typeof(views) != "array")
      views = [views]
   
   var options = Utils.prepareOptions(options, "source")
   if(!options){
      console.log("Wrong call to createView. Check the options.")
   }

   //-------------------------------------------
   // Proceed
   
   for(var i = 0; i < views.length; i++){
      console.log("Building ImageLayer " + options.source + " on " + views[i])
   }
   
}



//=====================================================================================================//

/**
 * views :  
 *    Each view in the array will have an OSM layer with the provided options
 * 
 * options :
 *    style : styleUID (can be used as only param)
 *    
 * # old --------------- 
 *       mainConfig.layers.push(LayersManager.getOSMLayerConfig([Maperial.DEFAULT_STYLE_UID]))
 *    
 */
MaperialAPI.prototype.addOSMLayer = function (views, options) {

   //-------------------------------------------
   // Checking options
   
   if(typeof(views) != "array")
      views = [views]
   
   var options = Utils.prepareOptions(options, "style")
   if(!options){
      console.log("Wrong call to addOSMLayer. Check the options.")
   }

   //-------------------------------------------

   for(var i = 0; i < views.length; i++){
      console.log("Building OSMLayer " + options.style + " on " + views[i])
   }
   
}



//=====================================================================================================//

MaperialAPI.prototype.createCustomData = function () {
   return new CustomData ()
}

//=====================================================================================================//
