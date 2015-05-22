function Symbolizercomposer(inZMin, inZMax) {
    this.zmin = inZMin;
    this.zmax = inZMax;
    this.symbs = [];
}

Symbolizercomposer.prototype.Add = function (inSymb) {
    this.symbs.push(inSymb);
}

//------------------------------------------------------------------//

module.exports = Symbolizercomposer;
