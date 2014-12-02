//-------------------------------------------------------------------------

var utils = require('../../../libs/utils.js');

//-------------------------------------------------------------------------

function Mover(mapView) {

    console.log("  building mover");

    this.mapView = mapView;

    this.lastMouseX = null;
    this.lastMouseY = null;
    this.autoMoving = false;
    this.mouseData = [];
    this.drawers = [];

    this.defaultMoveDistance = 300;
    this.defaultMoveMillis = 150;

    this.initListeners();
}

//-------------------------------------------------------------------------

Mover.prototype.initListeners = function (event) {

    switch(this.mapView.type){

        case Maperial.MAIN:
        case Maperial.ANCHOR:
            this.plugMapListening(event);

            break;

        case Maperial.MINIFIER:
        case Maperial.MAGNIFIER:
        case Maperial.LENS:
            this.plugToolListening(event);

            break;

    };
};

Mover.prototype.plugMapListening = function (event) {
    this.mapView.on("panstart", function (event) {
        this.reset(event);
    }.bind(this));

    this.mapView.on("panmove", function (event) {
        this.dragMap(event);
    }.bind(this));

    this.mapView.on("panend", function (event) {
        this.panend(event);
    }.bind(this));

    this.mapView.on("tap", function (event) {

        this.mapView.context.mouseP = utils.getPoint(event);
        this.mapView.context.mouseM = utils.converToMeters(
            this.mapView.canvas,
            this.mapView.context,
            this.mapView.context.mouseP
        );

    }.bind(this));

    // pour le zoom reutiliser ces moveXXX
    //  this.context.mapCanvas.on(MaperialEvents.CONTROL_RIGHT, function(){
    //  mover.moveRight();
    //  });

    //  this.context.mapCanvas.on(MaperialEvents.CONTROL_LEFT, function(){
    //  mover.moveLeft();
    //  });
};

Mover.prototype.plugToolListening = function (event) {
    this.mapView.on("panmove", function (event) {
        this.dragTool(event);
    }.bind(this));
};

//--------------------------------------------------------------------

Mover.prototype.removeListeners = function () {

};

//-------------------------------------------------------------------------

Mover.prototype.reset = function (event) {
    this.mapView.context.mouseP = utils.getPoint(event);

    this.mouseData = [];
    this.autoMoving = false;

    this.lastMouseX = this.mapView.context.mouseP.x;
    this.lastMouseY = this.mapView.context.mouseP.y;
};

//-------------------------------------------------------------------------

Mover.prototype.dragMap = function (event) {

    this.mapView.context.mouseP = utils.getPoint(event);
    this.mapView.context.mouseM = utils.converToMeters(
        this.mapView.canvas,
        this.mapView.context,
        this.mapView.context.mouseP
    );

    var newX = this.mapView.context.mouseP.x,
        newY = this.mapView.context.mouseP.y,
        deltaX = newX - this.lastMouseX,
        deltaY = newY - this.lastMouseY;

    this.lastMouseX = newX;
    this.lastMouseY = newY;

    this.registerMouseData(newX, newY);

    this.moveMap(deltaX, deltaY);
    this.moveDrawers(deltaX, deltaY);

};

//-------------------------------------------------------------------------

Mover.prototype.dragTool = function (event) {
    var left = parseFloat(this.mapView.container.style.left.split('px')[0]);
    var top  = parseFloat(this.mapView.container.style.top.split('px')[0]);

    var newLeft = Math.max(0, Math.min(
        left + event.srcEvent.movementX,
        this.mapView.parent.width - this.mapView.width
    ));

    var newTop = Math.max(0, Math.min(
        top + event.srcEvent.movementY,
        this.mapView.parent.height - this.mapView.height
    ));

    this.mapView.container.style.left = newLeft + 'px';
    this.mapView.container.style.top  = newTop  + 'px';
};

//-------------------------------------------------------------------------
//Auto Move workflow

Mover.prototype.panend = function () {
    if (this.requireAutoMove()) {
        this.prepareAutoMove();
    }
};

//-------------------------------------------------------------------------

Mover.prototype.moveMap = function (dx, dy) {
    var r = this.mapView.context.coordS.Resolution(this.mapView.context.zoom);

    this.mapView.context.centerM.x -= dx * r;
    this.mapView.context.centerM.y += dy * r;

    this.mapView.trigger(Maperial.EVENTS.MAP_MOVED);
};

//-------------------------------------------------------------------------

Mover.prototype.requireAutoMove = function () {

    // on arrive dans des cas chelous qui petent tout parfois..
    if (this.mouseData.length < 3)
        return false;

    // recup des derniers moves de la souris
    var endPoint = this.mouseData.pop(),
        now = new Date().getTime();

    // verif si la souris n'a pas été statique à la fin = no automove
    return (now - endPoint.time <= 120);
};

Mover.prototype.prepareAutoMove = function () {

    var startPoint = this.mouseData[0],
        endPoint = this.mouseData.pop(),

        deltaX = endPoint.x - startPoint.x,
        deltaY = endPoint.y - startPoint.y,

        deltaTime = endPoint.time - startPoint.time;

    this.move(deltaX, deltaY, deltaTime);
};

//-------------------------------------------------------------------------

Mover.prototype.move = function (deltaX, deltaY, deltaTime) {

    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY),

        speed = (distance * 1000 / deltaTime) / Maperial.refreshRate,

        speedX = (speed * deltaX / distance) * Maperial.autoMoveSpeedRate,
        speedY = (speed * deltaY / distance) * Maperial.autoMoveSpeedRate;

    this.autoMoving = true;

    this.moveScene(Maperial.autoMoveMillis, speedX, speedY, 0);
};

//-------------------------------------------------------------------------
//Controls

Mover.prototype.moveUp = function () {
    this.move(0, this.defaultMoveDistance, this.defaultMoveMillis);
};

Mover.prototype.moveDown = function () {
    this.move(0, -this.defaultMoveDistance, this.defaultMoveMillis);
};

Mover.prototype.moveRight = function () {
    this.move(-this.defaultMoveDistance, 0, this.defaultMoveMillis);
};

Mover.prototype.moveLeft = function () {
    this.move(this.defaultMoveDistance, 0, this.defaultMoveMillis);
};

//-------------------------------------------------------------------------

Mover.prototype.moveScene = function (timeRemaining, speedX, speedY, nbAutoMove) {

    if (timeRemaining < 0 || !this.autoMoving)
        return;

    if (isNaN(speedX)) {
        return;
    }

    this.moveMap(speedX, speedY);
    this.moveDrawers(speedX, speedY);

    var rate = 0.99 - nbAutoMove * Maperial.autoMoveDeceleration;

    var mover = this;
    requestAnimationFrame(function () {
        mover.moveScene(
            timeRemaining - Maperial.refreshRate,
            speedX * rate,
            speedY * rate,
            nbAutoMove + 1
        );
    });
};

Mover.prototype.registerMouseData = function (x, y) {

    if (this.mouseData.length >= Maperial.autoMoveAnalyseSize)
        this.mouseData.shift();

    var data = new Object();
    data.x = x;
    data.y = y;
    data.time = new Date().getTime();

    this.mouseData.push(data);

};

//-------------------------------------------------------------------------
//Drawers To Move

Mover.prototype.addDrawer = function (drawer) {
    this.drawers.push(drawer);
};

Mover.prototype.removeDrawer = function (drawer) {

    for (var i = 0; i < this.drawers.length; i++) {
        if (this.drawers[i] === drawer) {
            break;
        }
    }

    this.drawers.splice(i, 1);
};

Mover.prototype.resizeDrawers = function () {

    for (var i = 0; i < this.drawers.length; i++) {
        this.drawers[i].resize(this.config.width, this.config.height);
    }

};

Mover.prototype.moveDrawers = function (dx, dy) {
    for (var i = 0; i < this.drawers.length; i++) {
        var drawer = this.drawers[i];

        for (var j = 0; j < drawer.pointsToMove.length; j++) {
            var point = drawer.pointsToMove[j];
            point.x += dx;
            point.y += dy;
        }

        drawer.draw();
    }
};

//----------------------------------------------------------------

module.exports = Mover;
