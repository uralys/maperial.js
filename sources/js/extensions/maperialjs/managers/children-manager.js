//-------------------------------------------//
//- ChildrenManager 
//-------------------------------------------//

function ChildrenManager(maperial){
   this.maperial = maperial;
}

//-------------------------------------------//

ChildrenManager.prototype.resetAllChildren = function(){
   for(var i = 0; i < this.maperial.children.length; i++)
      this.maperial.children[i].reset()
}

//-------------------------------------------//

ChildrenManager.prototype.add = function(options){

   //------------------------//

   options.parent          = this.maperial
   options.type            = options.type ? (options.type == Maperial.LENS || options.type == Maperial.MINIFIER ? options.type : Maperial.LENS) : Maperial.LENS
   options.width           = options.width            || 150
   options.height          = options.height           || 150
   options.position        = options.position         || { left  : "50%", top      : "50%" }
   options.opacity         = options.opacity          || 1
   options.padding         = options.padding          || 0
   options.borderRadius    = options.borderRadius     || 0

   //------------------------//

   var child = new Maperial(options)
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

   this.maperial.children.push(child)
   this.maperial.hud.placeChild(options)
   
   //------------------------//
   
   var offset = panel.offset();
   child.startCenterP = new Point(offset.left , offset.top);
}

//==================================================================//

ChildrenManager.prototype.getChild = function (name) {
   for(var i = 0; i < this.maperial.children.length; i++){
      if(this.maperial.children[i].name == name)
         return this.maperial.children[i]
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
         child.context.centerM = this.maperial.context.centerM
         break;

      case Maperial.LENS :
         var offset = $("#panel"+child.name).offset();

         var centerP = this.maperial.context.coordS.MetersToPixels(this.maperial.context.centerM.x, this.maperial.context.centerM.y, this.maperial.context.zoom);
         var lensCenterP = new Point( centerP.x + offset.left - child.startCenterP.x , centerP.y - offset.top + child.startCenterP.y);

         child.context.centerM = child.context.coordS.PixelsToMeters ( lensCenterP.x, lensCenterP.y, this.maperial.context.zoom );
         child.mapRenderer.DrawScene()
         break;
   }
   
}
