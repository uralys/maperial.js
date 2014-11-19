//---------------------------------------------------------------------------//
// events here : https://github.com/EightMedia/hammer.js/wiki/Getting-Started
var Hammer = require('../../libs/hammer.js');

//---------------------------------------------------------------------------//

function MouseListener(mapView) {

    console.log('  listening mouse');

    this.mapView = mapView;
    this.lastWheelMillis = new Date().getTime();
    this.initListeners();
}

//---------------------------------------------------------------------------//

MouseListener.prototype.initListeners = function () {

    var mouse = this;

    switch (this.mapView.type) {

    case Maperial.MAIN:
    case Maperial.ANCHOR:

        /* prepare the hammer listening on the canvas */
        var hammertime = new Hammer(this.mapView.canvas);
        hammertime.on('panstart', this.panstart.bind(this));
        hammertime.on('panmove',  this.panmove.bind(this));
        hammertime.on('panend',   this.panend.bind(this));

        /* link every function on the listener to be able to
         * call 'off' on them*/

        // this.hammer.drag = this.drag.bind(this);
        // this.hammer.dragstart = this.dragstart.bind(this);
        // this.hammer.dragend = this.dragend.bind(this);
        // this.hammer.tap = this.tap.bind(this);

        /* turn the hammer listening on */
        // this.hammer.on('tap', this.hammer.tap);
        // this.hammer.on('panmove', this.hammer.drag);
        // this.hammer.on('panstart', this.hammer.dragstart);
        // this.hammer.on('panend', this.hammer.dragend);

        //this.mapView.canvas.addEventListener('click', this.down        .bind(this));

        //          .mouseup    ( this.up          .bind(this) )
        //          .mouseleave ( this.leave       .bind(this))
        //          .mousemove  ( Utils.apply ( this , 'move' ))
        //          .dblclick   ( Utils.apply ( this , 'doubleClick' ))
        //          .bind('mousewheel', Utils.apply ( this , 'wheel'))
        break;

        //        case Maperial.LENS:
        //        case Maperial.MINIFIER:
        //        case Maperial.MAGNIFIER:
        //            this.context.mapCanvas
        //            .dblclick   ( Utils.apply ( this , 'doubleClick' ))
        //            .bind('mousewheel', Utils.apply ( this , 'wheelOnZoomer'))
        //            break;
    }

}

//---------------------------------------------------------------------------//

MouseListener.prototype.removeListeners = function () {

    // this.hammer.off('tap', this.hammer.tap);
    // this.hammer.off('dragstart', this.hammer.dragstart);
    // this.hammer.off('drag', this.hammer.drag);
    // this.hammer.off('dragend', this.hammer.dragend);

    //  this.context.mapCanvas.off('mousedown');
    //  this.context.mapCanvas.off('mouseup');
    //  this.context.mapCanvas.off('mousemove');
    //  this.context.mapCanvas.off('mouseleave');
    //  this.context.mapCanvas.unbind('dblclick');
    //  this.context.mapCanvas.unbind('mousewheel');
    //  this.context.mapCanvas.unbind('wheelOnZoomer');
}

//---------------------------------------------------------------------------//

MouseListener.prototype.panmove = function (event) {
    this.mapView.trigger('panmove', event);
}

MouseListener.prototype.panstart = function (event) {
    this.mapView.trigger('panstart', event);
}

MouseListener.prototype.panend = function (event) {
    this.mapView.trigger('panend', event);
}

MouseListener.prototype.tap = function (event) {
    this.mapView.trigger('tap', event);
}

//---------------------------------------------------------------------------//
// oldies

//
//MouseListener.prototype.down = function (event) {
//
//    event.preventDefault();
//
//    this.context.mapCanvas.trigger(MaperialEvents.MOUSE_DOWN);
//}

//MouseListener.prototype.leave = function (event) {
//    if(this.mouseDown)
//        this.up(event);
//}
//
//MouseListener.prototype.up = function (event) {
//    this.mouseDown = false;
//    this.context.mapCanvas.trigger(MaperialEvents.MOUSE_UP);
//    this.mapView.trigger("drag", event);
//}

MouseListener.prototype.doubleClick = function (event) {

    if (!this.mapView.zoomable)
        return;

    this.context.zoom = Math.min(18, this.context.zoom + 1);
    this.context.centerM = this.convertCanvasPointToMeters(this.context.mouseP);

    // refresh mouse
    this.context.mouseP = Utils.getPoint(event);
    this.context.mouseM = this.convertCanvasPointToMeters(this.context.mouseP);

    this.mapView.refreshCurrentLatLon();

    $(window).trigger(MaperialEvents.ZOOM_TO_REFRESH, [this.mapView.map, this.mapView.name, this.mapView.type, this.context.zoom]);

}

//---------------------------------------------------------------------------//

MouseListener.prototype.wheel = function (event, delta) {

    if (!this.mapView.zoomable)
        return

    event.preventDefault();

    if (this.hasJustWheeled())
        return;

    var previousZoom = this.context.zoom

    if (delta > 0) {
        this.context.zoom = Math.min(18, this.context.zoom + 1);
        this.context.centerM = this.convertCanvasPointToMeters(this.context.mouseP);
    } else if (delta < 0) {

        var centerP = this.context.coordS.MetersToPixels(this.context.centerM.x, this.context.centerM.y, this.context.zoom);
        var oldShiftP = new Point(this.context.mapCanvas.width() / 2 - this.context.mouseP.x, this.context.mapCanvas.height() / 2 - this.context.mouseP.y);

        this.context.zoom = Math.max(0, this.context.zoom - 1);

        var r = this.context.coordS.Resolution(this.context.zoom);
        var newShiftM = new Point(oldShiftP.x * r, oldShiftP.y * r);
        this.context.centerM = new Point(this.context.mouseM.x + newShiftM.x, this.context.mouseM.y - newShiftM.y);
    }

    // refresh mouse
    this.context.mouseP = Utils.getPoint(event);
    this.context.mouseM = this.convertCanvasPointToMeters(this.context.mouseP);

    this.mapView.refreshCurrentLatLon();

    $(window).trigger(MaperialEvents.ZOOM_TO_REFRESH, [this.mapView.map, this.mapView.name, this.mapView.type, this.context.zoom]);
}

//---------------------------------------------------------------------------//

MouseListener.prototype.wheelOnZoomer = function (event, delta) {

    if (!this.mapView.zoomable)
        return

    event.preventDefault();

    if (this.hasJustWheeled() || delta == 0)
        return;

    this.context.zoom = Math.min(18, this.context.zoom + 1 * delta / Math.abs(delta));
    var mainZoom = this.mapView.maperial.getZoom(this.mapView.map)

    switch (this.mapView.type) {
    case Maperial.LENS:
    case Maperial.MAGNIFIER:
        if (this.context.zoom < mainZoom)
            this.context.zoom = mainZoom
        break;

    case Maperial.MINIFIER:
        if (this.context.zoom > mainZoom)
            this.context.zoom = mainZoom
        break;
    }

    this.mapView.deltaZoom = this.context.zoom - mainZoom

    $(window).trigger(MaperialEvents.ZOOM_TO_REFRESH, [this.mapView.map,
        this.mapView.name,
        this.mapView.type,
        this.context.zoom
    ]);
}

//---------------------------------------------------------------------------//
//Utils

MouseListener.prototype.hasJustWheeled = function () {
    var hasJustWheeled = new Date().getTime() - this.lastWheelMillis < 300;
    this.lastWheelMillis = new Date().getTime();

    return hasJustWheeled;
}

//---------------------------------------------------------------------------//

module.exports = MouseListener;
