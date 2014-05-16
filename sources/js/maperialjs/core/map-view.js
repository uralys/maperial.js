//------------------------------------------------------------------//

var MapContext              = require('./map-context.js'),
    MouseListener           = require('./mouse-listener.js'),
    MapRenderer             = require('./rendering/map-renderer.js'),
    LayerManager            = require('./managers/layer-manager.js'),
    Layer                   = require('./models/layer.js'),
    Hint                    = require('../libs/hint.js'),
    utils                   = require('../../libs/utils.js');

//------------------------------------------------------------------//

function MapView(maperial, options){

   //--------------------------------------------------------------//
   
   console.log("  prepare MapView : " + options.container.id);
   
   //--------------------------------------------------------------//

   this.maperial           = maperial;
   this.options            = options;
   this.id                 = utils.generateUID() + "_" + this.options.container.id;
   this.type               = options.type;
   
   //--------------------------------------------------------------//

   this.prepareContainer();
   new MouseListener(this);
   
   Hint.call(this);
   
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
   
   this.canvas = document.createElement('canvas');
   this.canvas.className = this.type;
   this.options.container.appendChild(this.canvas); 

   this.width       = this.options.container.clientWidth;
   this.height      = this.options.container.clientHeight;
   
   this.setCanvasSize();
}

MapView.prototype.setCanvasSize = function() {
    this.canvas.width = this.width;   
    this.canvas.height = this.height;   
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
