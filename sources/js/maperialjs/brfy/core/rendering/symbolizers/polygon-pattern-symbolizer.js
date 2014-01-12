
function PolygonPatternSymbolizer (symbName,opacity) {
   this.rt        = "PolygonPatternSymbolizer";
   this.file      = symbName;
   //this.alpha   = typeof opacity !== 'undefined' ? opacity : 1.0;
   var symbs = {}
   symbs[symbName] = 1
   styleManager.LoadSymbList (symbs,function(){})
}

PolygonPatternSymbolizer.prototype.SetCustomFunction = function  (fctCustom, fctInit) {
   if (typeof fctCustom == 'function') {
      this.custom = fctCustom
   }
   if (typeof fctInit == 'function') {
      this._init = fctInit;
      this._init();
   }
}

//------------------------------------------------------------------//

module.exports = PolygonPatternSymbolizer;