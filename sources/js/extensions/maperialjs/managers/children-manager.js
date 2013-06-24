//-------------------------------------------//
//- ChildrenManager 
//-------------------------------------------//

function ChildrenManager(mapView){
   this.mapView = mapView;
}

//-------------------------------------------//

ChildrenManager.prototype.resetAllChildren = function(){
   for(var i = 0; i < this.mapView.children.length; i++)
      this.mapView.children[i].reset()
}

//-------------------------------------------//

ChildrenManager.prototype.add = function(options){

   //------------------------//

   options.parent          = this.mapView
   options.type            = options.type ? (options.type == Maperial.LENS || options.type == Maperial.MINIFIER || options.type == Maperial.MAGNIFIER ? options.type : Maperial.LENS) : Maperial.LENS
   options.width           = options.width            || 150
   options.height          = options.height           || 150
   options.position        = options.position         || { left  : "50%", top      : "50%" }
   options.opacity         = options.opacity          || 1
   options.padding         = options.padding          || 0
   options.borderRadius    = options.borderRadius     || 0

   //------------------------//

   var child = new MapView(options)
   child.apply(options.config)

   //------------------------//

   var panel = $("#panel"+child.name)

   if(options.draggable){
      var me = this
      panel.draggable({ 
         snap: false,   
         start: function(event) {
            if(child.type == Maperial.LENS)
               me.moveChildInterval = setInterval( function(){ me.moveChild(child.name) } , 0.01 );
         },
         stop: function(event) {
            clearInterval(me.moveChildInterval);
            me.moveChildInterval = null
         }
      });
   }
   else{
      panel.draggable("disable") 
   }
   
   //------------------------//

   this.mapView.children.push(child)
   this.mapView.hud.placeChild(options)
   
   //------------------------//
   
   var parentCanvas    = this.mapView.context.mapCanvas
   var parentOffset  = parentCanvas.offset();
   var centerParent  = new Point(parentCanvas.width()/2 + parentOffset.left, parentCanvas.height()/2 + parentOffset.top)

   child.startPosition = new Point(centerParent.x - panel.width()/2, centerParent.y - panel.height()/2);
   
   this.refreshChild(child)
}

//==================================================================//

ChildrenManager.prototype.getChild = function (name) {
   for(var i = 0; i < this.mapView.children.length; i++){
      if(this.mapView.children[i].name == name)
         return this.mapView.children[i]
   }
}

//==================================================================//

ChildrenManager.prototype.moveChild = function (name) {
   var child = this.getChild(name);
   this.refreshChild(child)
}

//==================================================================//

ChildrenManager.prototype.refreshChild = function (child) {
   switch(child.type){
      case Maperial.MINIFIER : 
         child.context.centerM = this.mapView.context.centerM
         break;

      case Maperial.MAGNIFIER : 
         child.context.zoom    = this.mapView.context.zoom + 1
         child.context.centerM = this.mapView.context.mouseM
         break;

      case Maperial.LENS :
         var childPosition = $("#panel"+child.name).offset();

         var centerP = this.mapView.context.coordS.MetersToPixels(this.mapView.context.centerM.x, this.mapView.context.centerM.y, this.mapView.context.zoom);
         var lensCenterP = new Point( centerP.x - (child.startPosition.x - childPosition.left) , centerP.y + (child.startPosition.y - childPosition.top));

         child.context.centerM = child.context.coordS.PixelsToMeters ( lensCenterP.x, lensCenterP.y, this.mapView.context.zoom );
         child.mapRenderer.DrawScene()
         break;
   }
   
}
