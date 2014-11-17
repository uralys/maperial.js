//--------------------------------------------------------------------------

var Context      = require('./context.js'),
    Mouse        = require('./mouse.js'),
    Mover        = require('./mover.js'),
    MapRenderer  = require('../rendering/map-renderer.js'),
    LayerManager = require('../managers/layer-manager.js'),
    Layer        = require('../models/layer.js'),
    Source       = require('../models/source.js'),
    Events       = require('../../libs/events.js'),
    utils        = require('../../../libs/utils.js'),
    _            = require('../../../libs/lodash.js'),
    TWEEN        = require('tween.js');

//--------------------------------------------------------------------------

/**
 * A MapView is the object you get when you create :
 * <ul>
 * <li>a [Map]{@link Maperial#createMap}</li>
 * <li>an [Anchor]{@link #addAnchor}</li>
 * <li>a Minifier</li>
 * <li>a Magnifier</li>
 * <li>a Lens</li>
 * </ul>
 *
 * @constructor
 */
function MapView(maperial, options) {
    this.prepare(maperial, options);
    this.expose();
};

//--------------------------------------------------------------------------
//-     API
//--------------------------------------------------------------------------

MapView.prototype.expose = function () {

    //--------------------------------------------------------------------------
    //      Image Layers
    //--------------------------------------------------------------------------

    /**
     * @function
     */
    this.addOCMTransport = function () {
        return this.addImageLayer(Source.IMAGES_OCM_TRANSPORT);
    }.bind(this);

    /**
     * @function
     */
    this.addOCMLandscape = function () {
        return this.addImageLayer(Source.IMAGES_OCM_LANDSCAPE);
    }.bind(this);

    /**
     * @function
     */
    this.addWatercolor = function () {
        return this.addImageLayer(Source.IMAGES_STAMEN_WATERCOLOR);
    }.bind(this);

    /**
     * @function
     */
    this.addMapquest = function () {
        return this.addImageLayer(Source.IMAGES_MAPQUEST);
    }.bind(this);

    /**
     * @function
     */
    this.addSatellite = function () {
        return this.addImageLayer(Source.IMAGES_MAPQUEST_SATELLITE);
    }.bind(this);

    //--------------------------------------------------------------------------
    //      Maperial layers
    //--------------------------------------------------------------------------

    /**
     * @function
     */
    this.addShade = function () {
        return this.addShadeLayer();
    }.bind(this);

    /**
     * @function
     */
    this.addEarthLight = function () {
        return this.addImageLayer(Source.MAPERIAL_EARTHLIGHT);
    }.bind(this);

    /**
     * @function
     */
    this.addAerosol = function () {
        return this.addImageLayer(Source.MAPERIAL_AEROSOL);
    }.bind(this);

    /**
     * @function
     */
    this.addNDVI = function () {
        return this.addImageLayer(Source.MAPERIAL_NDVI);
    }.bind(this);

    /**
     * @function
     */
    this.addSRTM = function () {
        return this.addImageLayer(Source.MAPERIAL_SRTM);
    }.bind(this);

    /**
     * @function
     */
    this.addSST = function () {
        return this.addImageLayer(Source.MAPERIAL_SST);
    }.bind(this);

    //--------------------------------------------------------------------------
    //      Child MapViews
    //--------------------------------------------------------------------------

    /**
     * @function
     * @param {object} options
     * @param {float} options.width The anchor width, in pixels.
     *                              (Default : map.width/2)
     * @param {float} options.height The anchor height, in pixels.
     *                              (Default : map.height/2)
     * @param {float} options.top The anchor top gap inside the map, in pixels.
     *                              (Default : 0)
     * @param {float} options.left The anchor left gap inside the map, in pixels.
     *                              (Default : 0)
     *
     */
    this.addAnchor = function (options) {
        options = options || {};
        this.prepareChildOptions(options, {
            type : Maperial.ANCHOR
        });

        var width = (options.width || this.width / 2) + 'px';
        var height = (options.height || this.height / 2) + 'px';
        var left = (options.left || 10) + 'px';
        var top = (options.top || 10) + 'px';

        options.container.style.width = width;
        options.container.style.height = height;
        options.container.style.top = top;
        options.container.style.left = left;

        return this.createChild(options);

    }.bind(this);

    /**
     * @function
     * @param {object} options
     * @param {float} options.radius The lens radius, in pixels.
     *                              (Default : map.width * 0.1)
     * @param {float} options.top The lens center from the map top left, in pixels.
     *                              (Default : map.width * 0.5)
     * @param {float} options.left The lens center from the map top left, in pixels.
     *                              (Default : map.width * 0.5)
     *
     */
    this.addLens = function (options) {
        options = options || {};
        this.prepareChildOptions(options, {
            type : Maperial.LENS
        });

        var width = (options.radius * 2 || this.width / 2) + 'px';
        var height = (options.height || this.height / 2) + 'px';
        var left = (options.left || 10) + 'px';
        var top = (options.top || 10) + 'px';

        options.container.style.width = width;
        options.container.style.height = height;
        options.container.style.top = top;
        options.container.style.left = left;

        return this.createChild(options);

    }.bind(this);

    /**
     * @function
     */
    this.addMinifier = function (options) {
        //@todo
    }.bind(this);

    /**
     * @function
     */
    this.addMagnifier = function (options) {
        //@todo
    }.bind(this);

};

//--------------------------------------------------------------------------
//-     VIEW
//--------------------------------------------------------------------------

MapView.prototype.prepare = function (maperial, options) {
    console.log("  prepare MapView : " + options.container.id);

    //-------------------------------------------------------------
    // settings

    this.maperial = maperial;
    this.options = options;
    this.id = utils.generateUID() + "_" + this.options.container.id;
    this.container = options.container;
    this.type = options.type;

    //-------------------------------------------------------------
    // plug mixins in

    Events.call(this);

    //-------------------------------------------------------------
    // prepare the view

    this.prepareView();
    this.prepareCamera();

    //-------------------------------------------------------------
    // plug modules

    new Mouse(this);
    new Mover(this);

    //-------------------------------------------------------------

    // array to use push and splice
    this.layers = [];

    // hashmap : tiles[key] = tile
    this.tiles = {};

    // hashmap : dynamicalRenderers[dynamicalData.id] = dynamicalRenderer
    this.dynamicalRenderers = {};

    this.context = new Context(this);

    this.linkedMapViews = [];

    this.mapRenderer = new MapRenderer(this);
    this.layerManager = new LayerManager(this);

    //-------------------------------------------------------------

    this.shaders = [
        Maperial.AlphaClip,
        Maperial.AlphaBlend,
        Maperial.XBlend
    ];
};

//--------------------------------------------------------------------------
//-     CONTAINER
//--------------------------------------------------------------------------

MapView.prototype.prepareView = function () {
    this.canvas = document.createElement('canvas');
    this.container.classList.add(this.type);
    this.container.appendChild(this.canvas);

    this.refresh();
};

MapView.prototype.refresh = function () {
    this.canvas.width = this.width = this.container.clientWidth;
    this.canvas.height = this.height = this.container.clientHeight;
};

//--------------------------------------------------------------------------
//-     PLUGINS for API
//--------------------------------------------------------------------------

MapView.prototype.addImageLayer = function (sourceId) {
    return this.layerManager.addLayer(Layer.Images, sourceId);
};

//-----------------------------------------------------------------

MapView.prototype.addDynamicalLayer = function (dynamicalData, options) {

    //-------------------------------------------
    // Checking options

    var options = utils.prepareOptions(options, "style");
    if (!options) {
        console.log("Wrong call to addDynamicalLayer. Check the options");
    }

    //-------------------------------------------
    // Proceed

    return this.layerManager.addLayer(Layer.Dynamical, {
        mapView: this,
        dynamicalData: dynamicalData,
        style: options.style
    });

};

//-----------------------------------------------------------------

MapView.prototype.addHeatmapLayer = function (heatmapData, options) {

    options.colorbar = options.colorbar ||
        Maperial.colorbarManager.defaultColorbar(this);

    //-------------------------------------------
    // Proceed

    return this.layerManager.addLayer(Layer.Heat, {
        mapView: this,
        heatmapData: heatmapData,
        colorbar: options.colorbar,
        options: options
    });

};

//-----------------------------------------------------------------

// SHADE AND RASTER SHOULD JSUT BE OPTIONS IN RETILER TYPE LAYER

MapView.prototype.addShadeLayer = function () {
    return this.layerManager.addLayer(Layer.Shade);
};

//-----------------------------------------------------------------

MapView.prototype.addRasterLayer = function (sourceId) {
    return this.layerManager.addLayer(Layer.Raster, sourceId);
};

//-----------------------------------------------------------------

MapView.prototype.addWMSLayer = function (sourceId) {

};

//-----------------------------------------------------------------

MapView.prototype.addOSMLayer = function (styleId) {
    if (!styleId)
        styleId = Maperial.DEFAULT_STYLE_UID;
};

//--------------------------------------------------------------------------
//-     Child tools
//--------------------------------------------------------------------------

MapView.prototype.prepareChildOptions = function (options, settings) {
    _.extend(options, settings);
    options.container = document.createElement('div');
    this.container.appendChild(options.container);
};

MapView.prototype.createChild = function (options) {
    var child = this.maperial.addMapView(options);
    this.link(child);
    return child;
};

// links mapViews so that each Event may change the linkedMapViews
MapView.prototype.link = function (view) {
    this.linkedMapViews.forEach(function (link) {
        view.linkedMapViews.push(link);
        link.linkedMapViews.push(view);

        link.on(Maperial.EVENTS.MAP_MOVED, this.refreshCamera.bind(view));
        view.on(Maperial.EVENTS.MAP_MOVED, this.refreshCamera.bind(link));
    }.bind(this));

    view.linkedMapViews.push(this);
    this.linkedMapViews.push(view);

    this.on(Maperial.EVENTS.MAP_MOVED, this.refreshCamera.bind(view));
    view.on(Maperial.EVENTS.MAP_MOVED, this.refreshCamera.bind(this));
}

//--------------------------------------------------------------------------
//-     Camera
// TODO: create ./camera.js and move the following algo there
//--------------------------------------------------------------------------

MapView.prototype.prepareCamera = function () {
    this.on('zoom-in', function () {
        if ((this.options.zoomMax || 18) > this.context.zoom) {
            this.zoomCanvas(2);
            this.context.zoom++;
        }
    }.bind(this));

    this.on('zoom-out', function () {
        if ((this.options.zoomMin || 2) < this.context.zoom) {
            this.zoomCanvas(0.5);
            this.context.zoom--;
        }
    }.bind(this));
};

//--------------------------------------------------------------------------

MapView.prototype.refreshCamera = function (event) {

    switch (this.type) {
        // case Maperial.MINIFIER:
        //     this.context.centerM = this.maperial.getMainView(this.map).context.centerM
        //     break;

        // case Maperial.MAGNIFIER:
        //     this.context.centerM = this.maperial.getView(viewTriggering).context.mouseM
        //     break;

        case Maperial.MAIN:
        case Maperial.LENS:
        case Maperial.ANCHOR:

            var initiator = event.currentTarget
                                 .container
                                 .getBoundingClientRect();

            var my = this.container.getBoundingClientRect();

            var centerX = my.left + my.width / 2;
            var centerY = my.top + my.height / 2;

            var initiatorCenterX = initiator.left + initiator.width / 2;
            var initiatorCenterY = initiator.top + initiator.height / 2;

            var initiatorCenterP = utils.centerInPixels(initiator.context);
            var newCenterP = new Point(
                initiatorCenterP.x - initiatorCenterX + centerX,
                initiatorCenterP.y + initiatorCenterY - centerY
            );

            this.context.centerM = utils.pointInMeters(
                newCenterP,
                this.context
            );

            break;
    }

}

//--------------------------------------------------------------------------
// TODO: create ./zoomer.js and move the following algo there

MapView.prototype.zoomCanvas = function (scaleTo) {

    var canvas = cloneCanvas(this.canvas),
        div = document.createElement('div'),
        container = this.container;

    div.className = 'maperial-zoomer';
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.overflow = 'hidden';

    div.appendChild(canvas);
    container.appendChild(div);

    var from = {
            scale: 1
        },
        to = {
            scale: scaleTo
        },
        time = 600,
        tween = new TWEEN.Tween(from)
        .to(to, time)
        .easing(TWEEN.Easing.Circular.Out)
        .onUpdate(function () {
            var transform = 'scale(' + this.scale + ')';
            canvas.style.webkitTransform = transform;
            canvas.style.transform = transform;
        })
        .onComplete(function () {
            var from = {
                    alpha: 1
                },
                to = {
                    alpha: 0
                },
                time = 500,
                tween = new TWEEN.Tween(from)
                .to(to, time)
                .easing(TWEEN.Easing.Circular.In)
                .onUpdate(function () {
                    canvas.style.opacity = this.alpha;
                })
                .onComplete(function () {
                    container.removeChild(div);
                })
                .start();
        })
        .start();

}

function cloneCanvas(oldCanvas) {

    //create a new canvas
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    //+ translate3d pour recentrer.
    //chech taille du container VS taille du canvas...?
    newCanvas.style.position = 'relative';

    var dataURL = oldCanvas.toDataURL('image/jpeg', 0.5);
    var imageExported = new Image();

    // load image from data url
    imageExported.onload = function () {
        context.drawImage(this, 0, 0);
    };

    imageExported.src = dataURL;

    //return the new canvas
    return newCanvas;
}

//--------------------------------------------------------------------------

module.exports = MapView;
