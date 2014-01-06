//------------------------------------------------------------------//

var MapContext              = require('./map-context.js'),
    MapRenderer             = require('./rendering/map-renderer.js'),
    LayerManager            = require('./managers/layer-manager.js'),
    utils                   = require('../../../tools/utils.js');

//------------------------------------------------------------------//

function MapView(maperial, options){

   //--------------------------------------------------------------//
   
   console.log("  prepare MapView : " + options.container);
   
   //--------------------------------------------------------------//

   this.maperial           = maperial;
   this.options            = options;
   this.id                 = utils.generateUID() + "_" + this.options.container;
   this.type               = options.type;
   
   //--------------------------------------------------------------//

   this.prepareContainer();
   
   //--------------------------------------------------------------//

   this.layers             = [] // array to use push and splice : index is useful here
   this.tiles              = {} // hashmap : tiles[key] = tile
   this.dynamicalRenderers = {} // hashmap : dynamicalRenderers[dynamicalData.id] = dynamicalRenderer
   
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
   this.canvas    = $("#"+canvasId);
   this.width     = $("#"+this.options.container).width()
   this.height     = $("#"+this.options.container).height()
   
   this.setCanvasSize();
}

MapView.prototype.setCanvasSize = function() {

   var w = this.width;
   var h = this.height;
   
   this.canvas.css("width", w);
   this.canvas.css("height", h);
   this.canvas[0].width = w;
   this.canvas[0].height = h;
   
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
   
   var options = utils.prepareOptions(options, "style");
   if(!options){
      console.log("Wrong call to addDynamicalLayer. Check the options");
   }
   
   //-------------------------------------------
   // Proceed

   this.layerManager.addLayer(Layer.Dynamical, {
      mapView           : this, 
      dynamicalData     : dynamicalData, 
      style             : options.style
   });

}

//------------------------------------------------------------------//

MapView.prototype.addHeatmapLayer = function (heatmapData, options)   {
    
    //-------------------------------------------
    // Checking options
    
    var options = utils.prepareOptions(options, "colorbar");
    if(!options){
        console.log("Wrong call to addHeatmapLayer. Check the options");
    }
    
    //-------------------------------------------
    // Proceed
    
    this.layerManager.addLayer(Layer.Heat, {
        mapView        : this, 
        heatmapData    : heatmapData, 
        colorbar       : options.colorbar,
        options        : options
    });
    
}

//------------------------------------------------------------------//

MapView.prototype.addRasterLayer      = function (options)   {}
MapView.prototype.addShadeLayer       = function (options)   {}
MapView.prototype.addWMSLayer         = function (options)   {}

//------------------------------------------------------------------//

module.exports = MapView;
