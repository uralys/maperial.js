//-----------------------------------------------------------------------------

function ShadeData (x, y, z) {
   
   this.x         = x;
   this.y         = y;
   this.z         = z;

   this.content   = null;

   sourceManager.LoadShade(x, y, z)
}

//-----------------------------------------------------------------------------

ShadeData.prototype.tryToFillContent = function(){
   this.content = sourceManager.getData(this.sourceId, this.x, this.y, this.z);
}

ShadeData.prototype.release = function(){
   sourceManager.release(this.sourceId, this.x, this.y, this.z);
}

//-----------------------------------------------------------------------------

module.exports = ShadeData;