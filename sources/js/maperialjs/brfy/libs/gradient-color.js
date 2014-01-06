//------------------------------------------------------------------//

var RGBAColor = require('./rgba-color.js');

//------------------------------------------------------------------//

function GradiantColor( r,g,b,a ) {
    if (typeof (a) == "undefined")
        a = 1.0;
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
}

GradiantColor.prototype.GetWith  = function( inC , inT ){
    var r = ((this.r - inC.r) * inT) + inC.r;
    var g = ((this.g - inC.g) * inT) + inC.g;
    var b = ((this.b - inC.b) * inT) + inC.b;
    var a = ((this.a - inC.a) * inT) + inC.a;
    return new RGBAColor(r,g,b,a);
}

//------------------------------------------------------------------//

module.exports = GradiantColor;
