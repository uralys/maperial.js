
function SymbolizerComposer (inZMin, inZMax) {
   this.zmin = inZMin;
   this.zmax = inZMax;
   this.symbs= [];
}

SymbolizerComposer.prototype.Add = function( inSymb ) {
   this.symbs.push ( inSymb );
}

//------------------------------------------------------------------//

module.exports = SymbolizerComposer;