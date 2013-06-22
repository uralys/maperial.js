/****************************************************************************************************************** 
 *  This is a Drawer
 *  - this.draw() : the MapMover calls this method to refresh the drawings
 *  - this.resize(width, height) : the MapMover calls this method to resize the drawBoard
 *  - this.pointsToMove : the MapMover updates these points within the current move before to call drawer.draw()
 *
 ******************************************************************************************************************/ 
function BoundingBoxDrawer(maperial){

   console.log("  building BoundingBoxDrawer...");
   
   this.maperial = maperial;
   this.context = maperial.context;

   // -> Drawer
   this.drawBoard = null;

   // -> states
   this.selecting = false;
   this.drawingEnabled = false;

   // -> objects
   this.currentBox = null;

   // -> lat/lon to center the box
   this.centerLat = null;
   this.centerLon = null;
   this.latMin = null;
   this.lonMin = null;
   this.latMax = null;
   this.lonMax = null;

   // -> start lat/lon to use to cancel the changes 
   this.initLatMin = null;
   this.initLonMin = null;
   this.initLatMax = null;
   this.initLonMax = null;

   // -> to store the bestZoom
   this.zoomToFit = null;

   // -> to convert selection to boundingbox
   this.topLeftPoint = null;
   this.bottomRightPoint = null;
   this.startPoint = null;
   this.endPoint = null;

   // -> used by mapMover.moveDrawers
   this.pointsToMove = []; 

   // -> parameters
   this.minSelectionSize = 60;
};

//----------------------------------------------------------------------//

/**
 * private : 
 * if this is a new drawBoard, setBoundings() will throw an error : init required to put on listeners
 * if not, just redraw the previous bounding box, and DO NOT add other listeners, the previous ones are well enough
 */
BoundingBoxDrawer.prototype.tryToRefresh = function(){

   try{
      this.draw();
   } 
   catch(e){
      return false;
   }

   return true;

}

//----------------------------------------------------------------------//

/**
 * Init Fabric on the canvas + set mouse listeners
 */
BoundingBoxDrawer.prototype.init = function(boundingBox){
   
   console.log("  building BoundingBoxDrawer...");
   this.zoomToFit = null;
   this.drawingEnabled = false;
   
   //------- if this is still the same drawBoard, just draw again and do not add listeners !!

   if(this.tryToRefresh())
      return;

   //------- init Fabric

   this.drawBoard = new fabric.Canvas("drawBoard"+this.maperial.name);
   this.drawBoard.setHeight(this.context.mapCanvas.height());
   this.drawBoard.setWidth(this.context.mapCanvas.width());

   //------- startBox

   if($.isEmptyObject(boundingBox)){
      this.newStartBox();
   }
   else{
      this.forceLatLon(boundingBox.latMin, boundingBox.lonMin, boundingBox.latMax, boundingBox.lonMax)
   }

   //------- placing mouse listeners on this = drawer

   var drawer = this;
   this.maperial.mapMover.addDrawer(drawer);

   this.drawBoard.on('mouse:down', function(options) {

      if(drawer.drawBoard.selection){
         if (! options.target) {
            drawer.selecting = true;
            drawer.startPoint = new Point(options.e.x, options.e.y);
         }
      }
      else{
         drawer.maperial.mapMouse.down(options.e);
      }

   });


   this.drawBoard.on('mouse:up', function(options) {

      if(drawer.drawBoard.selection){
         if(drawer.selecting){
            drawer.endPoint = new Point(options.e.x, options.e.y);
            drawer.drawNewBoundingBox();
         }
         drawer.selecting = false;
      }
      else{
         drawer.maperial.mapMouse.up(options.e);
      }

   });


   this.drawBoard.on('mouse:move', function(options) {
      drawer.maperial.mapMouse.move(options.e);
   });

   // -> object:modified happens at the end of dragging and at the end of scaling
   this.drawBoard.on('object:modified', function(options) {
      drawer.updateBoundingsFromCurrentBox();
      drawer.draw();
   });

   $("#drawBoardContainer"+this.maperial.name).bind('mousewheel', function(event, delta) {
      drawer.maperial.mapMouse.wheel(event, delta);
      drawer.setBoundingsForZoom(drawer.context.zoom, false);
   });
}

//----------------------------------------------------------------------//

BoundingBoxDrawer.prototype.newStartBox = function(){

   //---------------------//
   // creating a simple boundingBox on the current center of the screen

   var startBoxWidth = 400;
   var startBoxHeight = 400;

   //---------------------//

   this.topLeftPoint = new Point(this.drawBoard.getWidth()/2 - startBoxWidth/2, this.drawBoard.getHeight()/2 - startBoxHeight/2) ;
   this.bottomRightPoint = new Point(this.drawBoard.getWidth()/2 + startBoxWidth/2, this.drawBoard.getHeight()/2 + startBoxHeight/2) ;
   this.boundingsHaveChanged();
   this.setInitLatLon();

   //---------------------//

   this.draw();
}

//----------------------------------------------------------------------//

BoundingBoxDrawer.prototype.cancelEdition = function(){
   this.setLatLon(this.initLatMin, this.initLonMin, this.initLatMax, this.initLonMax);
   this.zoomToFit = null;
   this.center();
}

BoundingBoxDrawer.prototype.setInitLatLon = function(){
   this.initLatMin = this.latMin;
   this.initLatMax = this.latMax;
   this.initLonMin = this.lonMin;
   this.initLonMax = this.lonMax;
   
   $(window).trigger(MaperialEvents.NEW_BOUNDING_BOX, [this.latMin, this.lonMin, this.latMax, this.lonMax]);
}

BoundingBoxDrawer.prototype.setLatLon = function(latMin, lonMin, latMax, lonMax){
   this.latMin = latMin;
   this.latMax = latMax;
   this.lonMin = lonMin;
   this.lonMax = lonMax;
   
   this.centerLat = (this.latMin + this.latMax)/2;
   this.centerLon = (this.lonMin + this.lonMax)/2;

   $(window).trigger(MaperialEvents.NEW_BOUNDING_BOX, [latMin, lonMin, latMax, lonMax]);
}

BoundingBoxDrawer.prototype.forceLatLon = function(latMin, lonMin, latMax, lonMax){
   this.setLatLon(latMin, lonMin, latMax, lonMax);
   this.setInitLatLon();
   this.zoomToFit = null;
   this.center();
}

BoundingBoxDrawer.prototype.resize = function(width, height){
   this.drawBoard.setHeight(height + App.Globals.HEADER_HEIGHT);
   this.drawBoard.setWidth(width);
   this.draw();
}

//----------------------------------------------------------------------//

/**
 * Update topLeftPoint and bottomRightPoint from the currentBox 
 * -> to have to right selection for the next draw()
 */
BoundingBoxDrawer.prototype.updateBoundingsFromCurrentBox = function () {
   // fabric top/left is at the box's center
   this.topLeftPoint.x = this.currentBox.left - this.currentBox.width*this.currentBox.scaleX/2;
   this.topLeftPoint.y = this.currentBox.top - this.currentBox.height*this.currentBox.scaleY/2;

   this.bottomRightPoint.x = this.currentBox.left + this.currentBox.width*this.currentBox.scaleX/2;
   this.bottomRightPoint.y = this.currentBox.top + this.currentBox.height*this.currentBox.scaleY/2;

   this.boundingsHaveChanged();
}

//----------------------------------------------------------------------//

BoundingBoxDrawer.prototype.drawNewBoundingBox = function () {

   if(Math.abs(this.endPoint.x - this.startPoint.x) < this.minSelectionSize 
         || Math.abs(this.endPoint.y - this.startPoint.y) < this.minSelectionSize ){

      // Tiny selection -> do not erase the currentBox ! And set the box active again
      this.drawBoard.setActiveObject(this.currentBox);

   }
   else{

      // new Selection = new Box 
      this.setBoundings();
      this.draw();
      
      // the best zoom is to be recalculated
      this.zoomToFit = null;
   }
}

//----------------------------------------------------------------------//

/**
 * Set the topLeftPoint and the bottomRightPoint of the new Boundingbox
 */
BoundingBoxDrawer.prototype.setBoundings = function () {

   // drag vers la droite
   if(this.startPoint.x < this.endPoint.x){

      // drag vers le bas
      if(this.startPoint.y < this.endPoint.y){

         this.topLeftPoint = new Point(this.startPoint.x, this.startPoint.y);
         this.bottomRightPoint = new Point(this.endPoint.x, this.endPoint.y);

         // drag vers le haut
      }else{

         this.topLeftPoint = new Point(this.startPoint.x, this.endPoint.y);
         this.bottomRightPoint = new Point(this.endPoint.x, this.startPoint.y);

      }

      // drag vers la gauche
   }else{

      // drag vers le bas
      if(this.startPoint.y < this.endPoint.y){

         this.topLeftPoint = new Point(this.endPoint.x, this.startPoint.y);
         this.bottomRightPoint = new Point(this.startPoint.x, this.endPoint.y);

         // drag vers le haut
      }else{

         this.topLeftPoint = new Point(this.endPoint.x, this.endPoint.y);
         this.bottomRightPoint = new Point(this.startPoint.x, this.startPoint.y);

      }
   }

   this.boundingsHaveChanged();

   console.log("box from [" + this.topLeftPoint.x + " | " + this.topLeftPoint.y + "] to [" + this.bottomRightPoint.x + " | " + this.bottomRightPoint.y + "]");   
}

//----------------------------------------------------------------------//

/**
 * Draw the new Bounding Box using topLeftPoint and bottomRightPoint
 * Note Rect.top/left offset : origin du repere de fabric est au centre des objets : (pour faciliter les calculs de pivots)
 */
BoundingBoxDrawer.prototype.draw = function () {

   // --------------------------------------------//

   this.drawBoard.clear();

   // --------------------------------------------//

   var w = this.bottomRightPoint.x - this.topLeftPoint.x;
   var h = this.bottomRightPoint.y - this.topLeftPoint.y;

   // --------------------------------------------//

   var rect = new fabric.Rect({
      width: w,
      height: h,
      top: this.topLeftPoint.y + h/2,
      left: this.topLeftPoint.x + w/2,
      fill: 'rgba(0,0,0,0)'
   });

   // --------------------------------------------//

   var rectTop = new fabric.Rect({
      width: this.drawBoard.getWidth(),
      height: this.topLeftPoint.y,
      top: this.topLeftPoint.y/2,
      left: this.drawBoard.getWidth()/2,
      fill: 'rgba(0,0,0,0.7)',
      selectable: false,
      hasControls: false
   });

   var rectBottomHeight = this.drawBoard.getHeight() - this.topLeftPoint.y - h;
   var rectBottom = new fabric.Rect({
      width: this.drawBoard.getWidth(),
      height: rectBottomHeight,
      top: this.drawBoard.getHeight() - rectBottomHeight/2,
      left: this.drawBoard.getWidth()/2,
      fill: 'rgba(0,0,0,0.7)',
      selectable: false,
      hasControls: false
   });

   var rectLeft = new fabric.Rect({
      width: this.topLeftPoint.x,
      height: h,
      top: this.topLeftPoint.y + h/2,
      left: this.topLeftPoint.x/2,
      fill: 'rgba(0,0,0,0.7)',
      selectable: false,
      hasControls: false
   });

   var rectRightWidth = this.drawBoard.getWidth() - this.topLeftPoint.x - w;
   var rectRight = new fabric.Rect({
      width: rectRightWidth,
      height: h,
      top: this.topLeftPoint.y + h/2,
      left: this.drawBoard.getWidth() - rectRightWidth/2,
      fill: 'rgba(0,0,0,0.7)',
      selectable: false,
      hasControls: false
   });

   this.drawBoard.add(rectLeft);
   this.drawBoard.add(rectRight);
   this.drawBoard.add(rectTop);
   this.drawBoard.add(rectBottom);
   this.drawBoard.add(rect);

   // --------------------------------------------//

   this.currentBox = this.drawBoard.item(4);

   this.currentBox.lockRotation = true;
   this.currentBox.hasRotatingPoint = false;
   this.currentBox.set({
      borderColor: 'black',
      cornerColor: 'black',
      cornersize: 5
   });


   // --------------------------------------------//

   this.drawBoard.selection = this.drawingEnabled;
   this.currentBox.selectable = this.drawingEnabled;
   this.currentBox.hasControls = this.drawingEnabled;

   if(this.drawingEnabled)
      this.drawBoard.setActiveObject(this.currentBox);

}

//----------------------------------------------------------------------//

BoundingBoxDrawer.prototype.boundingsHaveChanged = function () {
   this.refreshLatLon();
   this.pointsToMove = [this.topLeftPoint, this.bottomRightPoint];
}

/**
 * refresh all lat/lon data from topLeftPoint and bottomRightPoint
 */
BoundingBoxDrawer.prototype.refreshLatLon = function(){

   // Attention ! pour shiftTop et shiftBottom, le repere a ordonnees vers le bas ici
   var centerP = this.context.coordS.MetersToPixels(this.context.centerM.x, this.context.centerM.y, this.context.zoom);
   var shiftLeft = this.drawBoard.getWidth()/2 - this.topLeftPoint.x;
   var shiftTop = this.drawBoard.getHeight()/2 - this.topLeftPoint.y;
   var shiftRight = this.bottomRightPoint.x - this.drawBoard.getWidth()/2;
   var shiftBottom = this.bottomRightPoint.y - this.drawBoard.getHeight()/2;

   // Attention ! pour shiftTop et shiftBottom, le repere en metres a les ordonnees vers le haut
   var topLeftMeters = this.context.coordS.PixelsToMeters(centerP.x - shiftLeft, centerP.y + shiftTop, this.context.zoom);
   var bottomRightMeters = this.context.coordS.PixelsToMeters(centerP.x + shiftRight, centerP.y - shiftBottom, this.context.zoom);

   var topLeftLatLon = this.context.coordS.MetersToLatLon(topLeftMeters.x, topLeftMeters.y);
   var bottomRightLatLon = this.context.coordS.MetersToLatLon(bottomRightMeters.x, bottomRightMeters.y);

   var latMin = bottomRightLatLon.y;
   var latMax = topLeftLatLon.y;
   var lonMin = topLeftLatLon.x;
   var lonMax = bottomRightLatLon.x;
   
   this.setLatLon(latMin, lonMin, latMax, lonMax);
}

//----------------------------------------------------------------------//

BoundingBoxDrawer.prototype.center = function () {

   this.maperial.SetCenter(this.centerLat, this.centerLon);

   if(this.zoomToFit)
      this.setBoundingsForZoom(this.zoomToFit, false);
   else
      this.setBoundingsForZoom(16, true);
}

BoundingBoxDrawer.prototype.setBoundingsForZoom = function (zoom, fitToScreen) {
   // pour fitToScreen, on teste un nouveau zoom : necessaire de recentrer la carte pour le test
   if(fitToScreen)
      this.maperial.SetCenter(this.centerLat, this.centerLon);
   
   var centerP = this.context.coordS.MetersToPixels(this.context.centerM.x, this.context.centerM.y, zoom);
   var topLeftMeters = this.context.coordS.LatLonToMeters(this.latMax, this.lonMin); 
   var bottomRightMeters = this.context.coordS.LatLonToMeters(this.latMin, this.lonMax);

   var topLeftP = this.context.coordS.MetersToPixels(topLeftMeters.x, topLeftMeters.y, zoom);
   var bottomRightP = this.context.coordS.MetersToPixels(bottomRightMeters.x, bottomRightMeters.y, zoom);

   // Attention ! pour shiftTop et shiftBottom, le repere a les ordonnees vers le haut ici
   var shiftLeft = centerP.x - topLeftP.x;
   var shiftTop = topLeftP.y - centerP.y;
   var shiftRight = bottomRightP.x - centerP.x;
   var shiftBottom = centerP.y - bottomRightP.y;

   this.topLeftPoint = new Point(this.drawBoard.getWidth()/2 - shiftLeft, this.drawBoard.getHeight()/2 - shiftTop) ;
   this.bottomRightPoint = new Point(this.drawBoard.getWidth()/2 + shiftRight, this.drawBoard.getHeight()/2 + shiftBottom) ;

   if(fitToScreen
         && (this.topLeftPoint.x < 0 
               || this.bottomRightPoint.x > this.drawBoard.getWidth()
               || this.topLeftPoint.y < 0
               || this.bottomRightPoint.y > this.drawBoard.getHeight())){
      this.setBoundingsForZoom(zoom - 1, true);
   }
   else{
      if(fitToScreen)
         this.zoomToFit = zoom;
      
      this.maperial.SetZoom(zoom);
      this.boundingsHaveChanged();
      this.draw();
   }
}

//----------------------------------------------------------------------//

BoundingBoxDrawer.prototype.deactivateDrawing = function () {
   try{
      this.drawingEnabled = false;
      this.draw();
   }
   catch(e){}
}

BoundingBoxDrawer.prototype.activateDrawing = function () {
   try{
      this.drawingEnabled = true;
      this.draw();
   }
   catch(e){}
}
//----------------------------------------------------------------------//
