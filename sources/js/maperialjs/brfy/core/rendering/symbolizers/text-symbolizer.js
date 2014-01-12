
TextSymbolizer.TextTransform           = {}
TextSymbolizer.TextTransform.uppercase = "uppercase"
TextSymbolizer.TextTransform.lowercase = "lowercase"

function TextSymbolizer (fontname,size) {
   this.rt                 = "TextSymbolizer"
   this["face-name"]       = fontname;
   this.size               = size;   
   this.opacity            = 1.0;
   this.dx                 = 0.0
   this.dy                 = 0.0
   this["shield-dx"]       = 0.0
   this["shield-dy"]       = 0.0
   this.fill               = "rgba(0.0,0.0,0.0,1.0)"
   this.collisionThis      = true
   this.collisionOther     = true
   //this["wrap-width"] = 5
   //this.placement == "point"
   var fonts = {}
   fonts[fontname] = 1
   styleManager.LoadFontList (fonts,function(){})
}

TextSymbolizer.prototype.CollisionDetection = function  ( this_, others ) { 
   // this_    => This object try to detect collision with text, and it is not visible if collision is detected with more important text (apparition order). 
   // others   => This object is used by less important text to detect collision, so it can skip other text.
   this.collisionThis      = this_
   this.collisionOther     = others
}

TextSymbolizer.prototype.SetTransform = function  ( tr ) { 
   if ( tr && tr in TextSymbolizer.TextTransform ) {
      this["text-transform"] = tr
   }
   else {
      delete this["text-transform"];
   }
}

TextSymbolizer.prototype.Fill = function  ( color ) { // color null => Without fill
   if (color) 
      this.fill         = color.ToCanvas ();
   else 
      delete this.fill
}

TextSymbolizer.prototype.Halo = function  ( color , radius ) { // color null => Without halo
   if (color) {
      this["halo-fill"]    = color.ToCanvas()
      this["halo-radius"]  = radius
   }
   else {
      delete this["halo-fill"]
      delete this["halo-radius"]
   }
}

TextSymbolizer.prototype.SetCustomFunction = function  (fctCustom, fctInit) {
   if (typeof fctCustom == 'function') {
      this.custom = fctCustom
   }
   if (typeof fctInit == 'function') {
      this._init = fctInit;
      this._init();
   }
}

//------------------------------------------------------------------//

module.exports = TextSymbolizer;