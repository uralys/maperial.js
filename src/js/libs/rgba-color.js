//------------------------------------------------------------------//

function RGBAColor(r, g, b, a) {
    if (typeof (a) == "undefined") {
        a = 1.0;
    }

    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
}

//------------------------------------------------------------------//

RGBAColor.prototype.GetWith = function (inC, inT) {
    return new RGBAColor(this.r, this.g, this.b, this.a);
}

RGBAColor.prototype.RGBA = function () {
    return [this.r, this.g, this.b, this.a];
}

RGBAColor.prototype.RGBAi = function () {
    return [this.Ri(), this.Gi(), this.Bi(), this.Ai()];
}

RGBAColor.prototype.Ri = function () {
    return Math.round(Math.min(Math.max(this.r, 0.0), 1.0) * 255);
}

RGBAColor.prototype.Gi = function () {
    return Math.round(Math.min(Math.max(this.g, 0.0), 1.0) * 255);
}

RGBAColor.prototype.Bi = function () {
    return Math.round(Math.min(Math.max(this.b, 0.0), 1.0) * 255);
}

RGBAColor.prototype.Ai = function () {
    return Math.round(Math.min(Math.max(this.a, 0.0), 1.0) * 255);
}

RGBAColor.prototype.ToCanvas = function () {
    var r = Math.max(Math.min(Math.round(this.r * 255), 255), 0);
    var g = Math.max(Math.min(Math.round(this.g * 255), 255), 0);
    var b = Math.max(Math.min(Math.round(this.b * 255), 255), 0);
    var a = Math.max(Math.min(this.a, 1.0), 0.0);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

//------------------------------------------------------------------//

module.exports = RGBAColor;
