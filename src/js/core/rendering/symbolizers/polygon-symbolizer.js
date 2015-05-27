function PolygonSymbolizer(color) {
    this.rt = "PolygonSymbolizer";
    this.fill = color.ToCanvas()
    this.alpha = 1.0;
}

PolygonSymbolizer.prototype.SetCustomFunction = function (fctCustom, fctInit) {
    if (typeof fctCustom == 'function') {
        this.custom = fctCustom
    }
    if (typeof fctInit == 'function') {
        this._init = fctInit;
        this._init();
    }
}

// ------------------------------------------------------------------//

module.exports = PolygonSymbolizer;
