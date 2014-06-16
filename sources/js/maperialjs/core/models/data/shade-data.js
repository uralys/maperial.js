
var Source      = require('../source.js');

//-----------------------------------------------------------------------------

function ShadeData (x, y, z) {

   this.x         = x;
   this.y         = y;
   this.z         = z;

   this.content   = null;

   sourceManager.loadShade(x, y, z);
}

//-----------------------------------------------------------------------------

ShadeData.prototype.tryToFillContent = function(){
   this.content = sourceManager.getData(Source.Shade, this.x, this.y, this.z);
};

ShadeData.prototype.release = function(){
   sourceManager.release(Source.Shade, this.x, this.y, this.z);
};

//-----------------------------------------------------------------------------

module.exports = ShadeData;