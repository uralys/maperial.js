//-----------------------------------------------------------------------------------//

function ImageData (sourceId, x, y, z) {
   
   this.sourceId  = sourceId;
   this.x         = x;
   this.y         = y;
   this.z         = z;

   this.content   = null;

   sourceManager.LoadImage(sourceId, x, y, z)
}

//-----------------------------------------------------------------------------------//

ImageData.prototype.tryToFillContent = function(){
   this.content = sourceManager.getData(this.sourceId, this.x, this.y, this.z);
}

ImageData.prototype.release = function(){
   sourceManager.release(this.sourceId, this.x, this.y, this.z);
}