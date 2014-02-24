
// -------------------------------------------//
//	 	ColorTools
// -------------------------------------------//

this.ColorTools = {};

// -------------------------------------------//

ColorTools.rgbToHex = function(R,G,B) 
{
   return ColorTools.toHex(R) + ColorTools.toHex(G) + ColorTools.toHex(B);
}

ColorTools.toHex = function(n) 
{
   n = parseInt(n,10);
   if (isNaN(n)) return "00";
   n = Math.max(0,Math.min(n,255));
   return "0123456789ABCDEF".charAt((n-n%16)/16)
      + "0123456789ABCDEF".charAt(n%16);
}

ColorTools.RGBAToHex = function(rgbstr)
{
    var r = rgbstr.split('(')[1].split(',')[0];
    var g = rgbstr.split('(')[1].split(',')[1];
    var b = rgbstr.split('(')[1].split(',')[2];
    return "#"+ColorTools.rgbToHex(r,g,b);
}

ColorTools.cutHex = function(h) { return (h.charAt(0)=="#") ? h.substring(1,7) : h}
ColorTools.hexToR = function(h) { return parseInt((ColorTools.cutHex(h)).substring(0,2),16) }
ColorTools.hexToG = function(h) { return parseInt((ColorTools.cutHex(h)).substring(2,4),16) }
ColorTools.hexToB = function(h) { return parseInt((ColorTools.cutHex(h)).substring(4,6),16) }

ColorTools.HexToRGBA = function(hexstr)
{
   var r = ColorTools.hexToR(hexstr);
   var g = ColorTools.hexToG(hexstr);
   var b = ColorTools.hexToB(hexstr);
   var a = 1.0;
   return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
