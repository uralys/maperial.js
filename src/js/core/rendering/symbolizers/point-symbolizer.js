function PointSymbolizer(symbName, opacity) {
    this.rt = "PointSymbolizer";
    this.file = symbName;
    this.opacity = typeof opacity !== 'undefined' ? opacity : 1.0;
    this.Load([symbName])
}

PointSymbolizer.prototype.Load = function (symblist) {
    var symbs = {}
    for (var i = 0; i < symblist.length; i++) {
        symbs[symblist[i]] = 1
    }
    Maperial.styleManager.LoadSymbList(symbs, function () {})
}

PointSymbolizer.prototype.Translate = function (trX, trY) {
    this.trX = trX
    this.trY = trY
}

PointSymbolizer.prototype.Alignement = function (xAlign, yAlign) { // top, bottom, left,right , center (default)
    this.centerX = xAlign
    this.centerY = yAlign
}

PointSymbolizer.prototype.SetCustomFunction = function (fctCustom, fctInit) {
    if (typeof fctCustom == 'function') {
        this.custom = fctCustom
    }
    if (typeof fctInit == 'function') {
        this._init = fctInit;
        this._init();
    }
}

// ------------------------------------------------------------------//

module.exports = PointSymbolizer;
