
function MapView(maperial, options){

   //--------------------------------------------------------------//
   
   console.log("  prepare MapView : " + options.container)
   
   //--------------------------------------------------------------//

   this.maperial           = maperial;
   this.options            = options;
   this.id                 = Utils.generateUID() + "_" + this.options.container
   this.type               = options.type
   
   //--------------------------------------------------------------//

   this.prepareContainer()
   
   //--------------------------------------------------------------//

   this.layers             = [] // array to use push and splice : index is useful here
   this.tiles              = {} // hashmap : tiles[key] = tile
   
   this.context            = new MapContext(this);
   
   this.mapRenderer        = new MapRenderer(this);
   this.layerManager       = new LayerManager(this);

   //--------------------------------------------------------------//
   
   this.shaders            = [Maperial.AlphaClip, Maperial.AlphaBlend, Maperial.MulBlend];

};

//------------------------------------------------------------------//
// Container
//------------------------------------------------------------------//

MapView.prototype.prepareContainer = function ()   {
   
   var canvasId = "Map_"+this.id; 
   var html = "<canvas id=\"Map_"+this.id+"\" class=\"maperial-map canvas-"+this.type+"\"></canvas>";

   $("#"+this.options.container).append(html)
   this.canvas  = $("#"+canvasId);
   this.canvas.css("width", $("#"+this.options.container).width())
   this.canvas.css("height", $("#"+this.options.container).height())
}

//------------------------------------------------------------------//
// API
//------------------------------------------------------------------//

MapView.prototype.addImageLayer = function (sourceId)   {
   this.layerManager.addLayer(Layer.Images, sourceId)
}

//------------------------------------------------------------------//

MapView.prototype.addOSMLayer = function (styleId)   {
   
   if(!styleId)
      styleId = Maperial.DEFAULT_STYLE_UID
      
}

//------------------------------------------------------------------//

MapView.prototype.addDynamicalLayer = function (dynamicalData, options)   {
   
   //-------------------------------------------
   // Checking options
   
   var options = Utils.prepareOptions(options, "style")
   if(!options){
      console.log("Wrong call to addDynamicalLayer. Check the options")
   }
   
   //-------------------------------------------
   // Proceed
   
   console.log("Building DynamicalLayer on " + this.id)
   
}

//------------------------------------------------------------------//

MapView.prototype.addHeatmapLayer     = function (options)   {}
MapView.prototype.addRasterLayer      = function (options)   {}
MapView.prototype.addShadeLayer       = function (options)   {}
MapView.prototype.addWMSLayer         = function (options)   {}
