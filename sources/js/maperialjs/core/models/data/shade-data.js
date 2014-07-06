
var Source      = require('../source.js');

//-----------------------------------------------------------------------------

function ShadeData (x, y, z) {

   this.x         = x;
   this.y         = y;
   this.z         = z;

   this.content   = null;

   Maperial.sourceManager.loadShade(x, y, z);
}

//-----------------------------------------------------------------------------

ShadeData.prototype.tryToFillContent = function(){
   this.content = Maperial.sourceManager.getData(Source.Shade, this.x, this.y, this.z);
};

ShadeData.prototype.release = function(){
   Maperial.sourceManager.release(Source.Shade, this.x, this.y, this.z);
};

//-----------------------------------------------------------------------------

module.exports = ShadeData;