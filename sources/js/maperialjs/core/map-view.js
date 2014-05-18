//---------------------------------------------------------------------------//

var MapContext              = require('./map-context.js'),
MouseListener           = require('./mouse-listener.js'),
MapRenderer             = require('./rendering/map-renderer.js'),
LayerManager            = require('./managers/layer-manager.js'),
Layer                   = require('./models/layer.js'),
Hint                    = require('../libs/hint.js'),
utils                   = require('../../libs/utils.js');

//---------------------------------------------------------------------------//

function MapView(maperial, options){

    console.log("  prepare MapView : " + options.container.id);

    //--------------------------------------------------------------//

    this.maperial       = maperial;
    this.options        = options;
    this.id             = utils.generateUID() + "_" + this.options.container.id;
    this.type           = options.type;

    //--------------------------------------------------------------//

    this.prepareContainer();

    //--------------------------------------------------------------//

    new MouseListener(this);
    Hint.call(this);

    this.on("drag", this.refreshCoordinates.bind(this));

    //--------------------------------------------------------------//

    // array to use push and splice
    this.layers             = []

    // hashmap : tiles[key] = tile
    this.tiles              = {}

    // hashmap : dynamicalRenderers[dynamicalData.id] = dynamicalRenderer
    this.dynamicalRenderers = {} 

    this.context            = new MapContext(this);

    this.mapRenderer        = new MapRenderer(this);
    this.layerManager       = new LayerManager(this);

    //--------------------------------------------------------------//

    this.shaders            = [
                               Maperial.AlphaClip, 
                               Maperial.AlphaBlend, 
                               Maperial.MulBlend
                               ];

};

//---------------------------------------------------------------------------//
//Container
//---------------------------------------------------------------------------//

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

//---------------------------------------------------------------------------//
//API
//---------------------------------------------------------------------------//

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

//---------------------------------------------------------------------------//
//Camera
//---------------------------------------------------------------------------//

MapView.prototype.refreshCoordinates = function (event)   {

    var previousMouseP = this.context.mouseP;
    this.context.mouseP = utils.getPoint(event);
    var deltaPx = this.context.mouseP.x - previousMouseP.x,
        deltaPy = this.context.mouseP.y - previousMouseP.y,
        delta = {
            x : deltaPx,
            y : deltaPy
    };

    
    var deltaM = utils.converToMeters ( this.canvas, this.context, delta );
    this.context.centerM.x -= deltaM.x;
    this.context.centerM.y -= deltaM.y;
    
    console.log(this.context.centerM);

//    this.context.mouseM = utils.converToMeters ( this.canvas, this.context, this.context.mouseP );

    switch(this.type){

        case Maperial.MINIFIER : 
//          this.context.centerM = this.maperial.getMainView(this.map).context.centerM
            break;

        case Maperial.MAGNIFIER :
//          this.context.centerM = this.maperial.getView(viewTriggering).context.mouseM
            break;

        case Maperial.LENS :
//            var panel = $("#panel"+this.name)
//            var panelTriggering = $("#panel"+viewTriggering)
//            
//            var panelTriggeringPosition = panelTriggering.position();
//            var viewPosition = panel.position();
//            
//            var viewCenterX = viewPosition.left + panel.width()/2
//            var viewCenterY = viewPosition.top + panel.height()/2
//            
//            var panelTriggeringCenterX = panelTriggeringPosition.left + panelTriggering.width()/2
//            var panelTriggeringCenterY = panelTriggeringPosition.top + panelTriggering.height()/2
//            
//            var viewTriggeringCenterP = this.maperial.getCenterP(viewTriggering)
//            var lensCenterP = new Point( viewTriggeringCenterP.x - panelTriggeringCenterX + viewCenterX , viewTriggeringCenterP.y + panelTriggeringCenterY - viewCenterY);
//            
//            this.context.centerM = this.context.coordS.PixelsToMeters ( lensCenterP.x, lensCenterP.y, this.maperial.getZoom(this.map) );
            
        case Maperial.MAIN : 
        case Maperial.ANCHOR :
            
//            this.context.centerM = this.context.mouseM;

            break;
    }

    console.log("refreshCoordinates");
}

//---------------------------------------------------------------------------//

module.exports = MapView;
