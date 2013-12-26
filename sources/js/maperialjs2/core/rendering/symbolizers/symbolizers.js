
TextSymbolizer.TextTransform           = {}
TextSymbolizer.TextTransform.uppercase = "uppercase"
TextSymbolizer.TextTransform.lowercase = "lowercase"

LineSymbolizer.LineCap                 = {}
LineSymbolizer.LineCap.butt            = 'butt'
LineSymbolizer.LineCap.round           = 'round'
LineSymbolizer.LineCap.square          = 'square'

LineSymbolizer.LineJoin                = {}
LineSymbolizer.LineJoin.bevel          = 'bevel'
LineSymbolizer.LineJoin.round          = 'round'
LineSymbolizer.LineJoin.miter          = 'miter'

function LineSymbolizer (color,width)  {   
   this.rt        = "LineSymbolizer";
   this.width     = typeof width !== 'undefined' ? width : 1.0;
   this.stroke    = color.ToCanvas();
   this.linejoin  = "round" ;
   this.alpha     = 1.0;   
}

LineSymbolizer.prototype.SetLineCap = function (lineCap) {
   if ( lineCap in LineSymbolizer.LineCap )
      this.linecap = lineCap;
}

LineSymbolizer.prototype.SetLineJoin = function  (lineJoin) {
   if ( lineJoin in LineSymbolizer.LineJoin )
      this.linejoin = lineJoin;
}

LineSymbolizer.prototype.SetDasharray = function  (array) {
   this.dasharray = array.join(',')
}

LineSymbolizer.prototype.SetCustomFunction = function  (fctCustom, fctInit) {
   if (typeof fctCustom == 'function') {
      this.custom = fctCustom
   }
   if (typeof fctInit == 'function') {
      this._init = fctInit;
      this._init();
   }
}

function PolygonSymbolizer (color) {
   this.rt     = "PolygonSymbolizer";
   this.fill   = color.ToCanvas()
   this.alpha  = 1.0;   
}

PolygonSymbolizer.prototype.SetCustomFunction = function  (fctCustom, fctInit) {
   if (typeof fctCustom == 'function') {
      this.custom = fctCustom
   }
   if (typeof fctInit == 'function') {
      this._init = fctInit;
      this._init();
   }
}

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

function PointSymbolizer (symbName,opacity) {
   this.rt        = "PointSymbolizer";
   this.file      = symbName;
   this.opacity   = typeof opacity !== 'undefined' ? opacity : 1.0;
   this.Load ([symbName])
}

PointSymbolizer.prototype.Load = function  (symblist) {
   var symbs = {}
   for ( var i = 0 ; i < symblist.length ; i++) {
      symbs[symblist[i]] = 1
   }
   styleManager.LoadSymbList (symbs,function(){})
}

PointSymbolizer.prototype.Translate = function  ( trX, trY ) {
   this.trX = trX
   this.trY = trY
}

PointSymbolizer.prototype.Alignement = function  ( xAlign, yAlign ) { // top, bottom, left,right , center (default)
   this.centerX = xAlign
   this.centerY = yAlign
}

PointSymbolizer.prototype.SetCustomFunction = function  (fctCustom, fctInit) {
   if (typeof fctCustom == 'function') {
      this.custom = fctCustom
   }
   if (typeof fctInit == 'function') {
      this._init = fctInit;
      this._init();
   }
}

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

function ShieldSymbolizer () {

}

function MarkersSymbolizer () {

}

function SymbolizerComposer (inZMin, inZMax) {
   this.zmin = inZMin;
   this.zmax = inZMax;
   this.symbs= [];
}

SymbolizerComposer.prototype.Add = function( inSymb ) {
   this.symbs.push ( inSymb );
}
