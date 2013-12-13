//-----------------------------------------------------------------------------------//

function VectorialData (sourceId, x, y, z) {
   
   this.sourceId  = sourceId;
   this.x         = x;
   this.y         = y;
   this.z         = z;

   this.content   = null;

   sourceManager.LoadVectorial(sourceId, x, y, z)
}

//-----------------------------------------------------------------------------------//

VectorialData.prototype.tryToFillContent = function(){
   this.content = sourceManager.getData(this.sourceId, this.x, this.y, this.z);
}