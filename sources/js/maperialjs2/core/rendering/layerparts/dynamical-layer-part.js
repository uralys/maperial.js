
function DynamicalLayerPart ( layer, tile ) {
   
   this.layer     = layer;
   this.tile      = tile;
   this.x         = tile.x;
   this.y         = tile.y;
   this.z         = tile.z;

   this.version   = null;
   this.tex       = null;
   
   this.renderer  = layer.renderer;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.IsUpToDate = function ( ) {
   var isUpTodate = this.renderer.isSync() && this.tex != null;
   
   if(!isUpTodate)
       this.Reset();
   
   return isUpTodate;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.DataReady = function(){

   if(this.renderer.IsUpToDate()){
      return true;
   }
   else{
       this.renderer.Update();
   }
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.GetType = function ( ) {
   return this.layer.type;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.prepare = function () {

}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.Reset = function (  ) {
   this.tex = null;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.Release = function (  ) {
   this.tex = null;
}

//-----------------------------------------------------------------------------------//

DynamicalLayerPart.prototype.Update = function () {
    if (this.tex == null ) {   
        this.tex = this.renderer.GetTex(this.x,this.y)
    }
    return 0;
}