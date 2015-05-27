LineSymbolizer.LineCap = {}
LineSymbolizer.LineCap.butt = 'butt'
LineSymbolizer.LineCap.round = 'round'
LineSymbolizer.LineCap.square = 'square'

LineSymbolizer.LineJoin = {}
LineSymbolizer.LineJoin.bevel = 'bevel'
LineSymbolizer.LineJoin.round = 'round'
LineSymbolizer.LineJoin.miter = 'miter'

function LineSymbolizer(color, width) {
    this.rt = "LineSymbolizer";
    this.width = typeof width !== 'undefined' ? width : 1.0;
    this.stroke = color.ToCanvas();
    this.linejoin = "round";
    this.alpha = 1.0;
}

LineSymbolizer.prototype.SetLineCap = function (lineCap) {
    if (lineCap in LineSymbolizer.LineCap)
        this.linecap = lineCap;
}

LineSymbolizer.prototype.SetLineJoin = function (lineJoin) {
    if (lineJoin in LineSymbolizer.LineJoin)
        this.linejoin = lineJoin;
}

LineSymbolizer.prototype.SetDasharray = function (array) {
    this.dasharray = array.join(',')
}

LineSymbolizer.prototype.SetCustomFunction = function (fctCustom, fctInit) {
    if (typeof fctCustom == 'function') {
        this.custom = fctCustom
    }
    if (typeof fctInit == 'function') {
        this._init = fctInit;
        this._init();
    }
}

// ------------------------------------------------------------------//

module.exports = LineSymbolizer;
