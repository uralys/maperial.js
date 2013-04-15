
var FontFamily = function () {
   var styles = {}, mapping = {
      oblique: 'italic',
      italic: 'oblique'
   };
   this.add = function(font) {
      (styles[font.style] || (styles[font.style] = {}))[font.weight] = font;
   };
   this.get = function(style, weight) {
      if(typeof(style)==='undefined')  style  = 'normal';
      if(typeof(weight)==='undefined') weight = 'normal';
      var weights = styles[style] || styles[mapping[style]]
         || styles.normal || styles.italic || styles.oblique;
      if (!weights) return null;
      // we don't have to worry about "bolder" and "lighter"
      // because IE's currentStyle returns a numeric value for it,
      // and other browsers use the computed value anyway
      weight = {
         normal: 400,
         bold: 700
      }[weight] || parseInt(weight, 10);
      if (weights[weight]) return weights[weight];
      // http://www.w3.org/TR/CSS21/fonts.html#propdef-font-weight
      // Gecko uses x99/x01 for lighter/bolder
      var up = {
         1: 1,
         99: 0
      }[weight % 100], alts = [], min, max;
      if (up === undefined) up = weight > 400;
      if (weight == 500) weight = 400;
      for (var alt in weights) {
         if (!hasOwnProperty(weights, alt)) continue;
         alt = parseInt(alt, 10);
         if (!min || alt < min) min = alt;
         if (!max || alt > max) max = alt;
         alts.push(alt);
      }
      if (weight < min) weight = min;
      if (weight > max) weight = max;
      alts.sort(function(a, b) {
         return (up
            ? (a >= weight && b >= weight) ? a < b : a > b
            : (a <= weight && b <= weight) ? a > b : a < b) ? -1 : 1;
      });
      return weights[alts[0]];
   };
}

var globalFonts = function () {
   var __gf = {};
   __gf.d   = {};
   __gf.Add = function ( data ) {
      if (!data) return api;
		var font = new Font(data)
      var family = font.family;
		if (!__gf.d[family]) __gf.d[family] = new FontFamily();
		__gf.d[family].add(font);
		return __gf;
   }
   
   __gf.Get = function ( name, style, weight ) {
      if ( ! __gf.d[name] ) 
         return null
      return __gf.d[name].get ( style, weight)
   }
   
   return __gf;
}();

function FollowLine (l) {
   if (l.length < 4) {
      console.log ("Invalid line");
      return;
   }
   this.l     = l;
   this.acc   = 0;
   this.pi    = 0;
}

FollowLine.prototype.IsValid = function ( cs ) {
   return ! (this.l === undefined);
}

FollowLine.prototype.Advance = function ( cs ) {
   if ( this.pi + 3 >= this.l.length )
      return null;
         
   var p       = [ this.l[this.pi]     , this.l[this.pi + 1] ];
   var pnext   = [ this.l[this.pi + 2] , this.l[this.pi + 3] ];
   var v       = [ pnext[0] - p[0]     , pnext[1] - p[1] ]
   var n       = Math.sqrt ( v[0] * v[0] + v[1] * v[1] ) 
   var vn      = [ v[0] / n , v[1] / n ]
   var Von     = [ vn[1]    , -vn[0]   ]
   var nacc    = this.acc + cs;        // next
   var macc    = this.acc + cs / 2.0 ; // middle
   var p0      = [ p[0] + vn[0] * this.acc , p[1] + vn[1] * this.acc]
   var pm      = [ p[0] + vn[0] * macc     , p[1] + vn[1] * macc]
   var shift   = [0,0]
   
   intPoints   = []
   if ( nacc > n ) {
      while (nacc > n) {
         this.pi  = this.pi + 2
         if ( this.pi + 3 < this.l.length ) {
            nacc        = nacc - n;
            p           = [ this.l[this.pi]     , this.l[this.pi + 1] ];
            pnext       = [ this.l[this.pi + 2] , this.l[this.pi + 3] ];
            v           = [ pnext[0] - p[0]     , pnext[1] - p[1] ]
            n           = Math.sqrt ( v[0] * v[0] + v[1] * v[1] ) 
            intPoints.push ( p[0] )
            intPoints.push ( p[1] )
         }
         else return null;
      }
      vn          = [ v[0] / n , v[1] / n ]
      var p1      = [ p[0] + vn[0] * nacc  , p[1] + vn[1] * nacc]
      var vtmp    = [ p1[0] - p0[0] , p1[1] - p0[1] ]
      var ntmp    = Math.sqrt ( vtmp[0] * vtmp[0] + vtmp[1] * vtmp[1] )
      var vntmp   = [ vtmp[0] / ntmp , vtmp[1] / ntmp ]
      Von         = [ vntmp[1]    , -vntmp[0] ]
      /* Test shift with distance between Real middle point (pm2) , and base middle point (pm)
      var pm2        = [ p0[0] + vtmp[0]/2.0 , p0[1] + vtmp[1]/2.0 ]
      var vtmp2      = [ pm[0] - pm2[0] , pm[1] - pm2[1] ]
      var ntmp2      = Math.sqrt ( vtmp2[0] * vtmp2[0] + vtmp2[1] * vtmp2[1] )
      var vntmp2     = [ vtmp2[0] / ntmp2 , vtmp2[1] / ntmp2 ]
      var stmp       = ( vntmp2[0] * Von[0] + vntmp2[1] * Von[1] ) * ntmp2;
      shift          = [ Von[0] * stmp , Von[1] * stmp ];
      */
      var pm2        = [ p0[0] + vtmp[0]/2.0 , p0[1] + vtmp[1]/2.0 ]
      var sacc       = 0
      for ( var j = 0 ; j < intPoints.length ; j+=2) {
         var vtmp2      = [ intPoints[j] - pm2[0] , intPoints[j+1] - pm2[1] ]
         var ntmp2      = Math.sqrt ( vtmp2[0] * vtmp2[0] + vtmp2[1] * vtmp2[1] )
         var vntmp2     = [ vtmp2[0] / ntmp2 , vtmp2[1] / ntmp2 ]
         sacc           += ( vntmp2[0] * Von[0] + vntmp2[1] * Von[1] ) * ntmp2;
      }
      sacc              /= (intPoints.length / 2.0) + 2.0;
      shift             = [ Von[0] * sacc , Von[1] * sacc ];
   }
   
   this.acc = nacc
   var a    = Math.acos(-Von[1]);
   if ( Von[0] < 0 ) a = -a 
   //if ( Von[1] > 0 ) { a = a + Math.PI }
   
   return [p0[0]+shift[0],p0[1]+shift[1],a]
}

function TextOnLine ( ctx, l, txt , fill) {
   var fl = new FollowLine (l)
   if ( ! fl.IsValid())
      return
      
   ctx.beginPath();
   
   for (i in txt) {
      var c  = txt[i];
      var cs = ctx.measureText(c).width
      var tr = fl.Advance ( cs )
      if (!tr) return
      ctx.save( )
      ctx.translate ( tr[0] , tr[1] );
      ctx.rotate(tr[2]);
      if (fill)
         ctx.fillText(c,0,0);
      else
         ctx.strokeText(c,0,0);
      ctx.restore()
   }
}

function hasOwnProperty(obj, property) {
   return obj.hasOwnProperty(property);
}

var FontSize = function(value, base) {
   this.value = parseFloat(value);
   this.unit = String(value).match(/[a-z%]*$/)[0] || 'px';

   this.convert = function(value) {
      return value / base * this.value;
   };

   this.convertFrom = function(value) {
      return value / this.value * base;
   };

   this.toString = function() {
      return this.value + this.unit;
   };
}

var Font = function (data) {
   var face = this.face = data.face, ligatureCache = [], wordSeparators = {
      '\u0020': 1,
      '\u00a0': 1,
      '\u3000': 1
   };
   this.glyphs = (function(glyphs) {
      var key, fallbacks = {
         '\u2011': '\u002d',
         '\u00ad': '\u2011'
      };
      for (key in fallbacks) {
         if (!hasOwnProperty(fallbacks, key)) continue;
         if (!glyphs[key]) glyphs[key] = glyphs[fallbacks[key]];
      }
      return glyphs;
   })(data.glyphs);

   this.w = data.w;
   this.baseSize = parseInt(face['units-per-em'], 10);

   this.family = face['font-family'].toLowerCase();
   this.weight = face['font-weight'];
   this.style = face['font-style'] || 'normal';

   this.viewBox = (function () {
      var parts = face.bbox.split(/\s+/);
      var box = {
         minX: parseInt(parts[0], 10),
         minY: parseInt(parts[1], 10),
         maxX: parseInt(parts[2], 10),
         maxY: parseInt(parts[3], 10)
      };
      box.width = box.maxX - box.minX;
      box.height = box.maxY - box.minY;
      box.toString = function() {
         return [ this.minX, this.minY, this.width, this.height ].join(' ');
      };
      return box;
   })();

   this.ascent = -parseInt(face.ascent, 10);
   this.descent = -parseInt(face.descent, 10);

   this.height = -this.ascent + this.descent;

   this.spacing = function(chars, letterSpacing, wordSpacing) {
      var glyphs = this.glyphs, glyph,
         kerning, k,
         jumps = [],
         width = 0, w,
         i = -1, j = -1, chr;
      while (chr = chars[++i]) {
         glyph = glyphs[chr] || this.missingGlyph;
         if (!glyph) continue;
         if (kerning) {
            width -= k = kerning[chr] || 0;
            jumps[j] -= k;
         }
         w = glyph.w;
         if (isNaN(w)) w = +this.w; // may have been a String in old fonts
         if (w > 0) {
            w += letterSpacing;
            if (wordSeparators[chr]) w += wordSpacing;
         }
         width += jumps[++j] = ~~w; // get rid of decimals
         kerning = glyph.k;
      }
      jumps.total = width;
      return jumps;
   };

   this.applyLigatures = function(text, ligatures) {
      // find cached ligature configuration for this font
      for (var i=0, ligatureConfig; i<ligatureCache.length && !ligatureConfig; i++)
         if (ligatureCache[i].ligatures === ligatures)
            ligatureConfig = ligatureCache[i];

      // if there is none, it needs to be created and cached
      if (!ligatureConfig) {
         // identify letter groups to prepare regular expression that matches these
         var letterGroups = [];
         for (var letterGroup in ligatures) {
            if (this.glyphs[ligatures[letterGroup]]) {
               letterGroups.push(letterGroup);
            }
         }

         // sort by longer groups first, then alphabetically (to aid caching by this key)
         var regexpText = letterGroups.sort(function(a, b) {
            return b.length - a.length || a > b;
         }).join('|');

         ligatureCache.push(ligatureConfig = {
            ligatures: ligatures,
            // create regular expression for matching desired ligatures that are present in the font
            regexp: regexpText.length > 0 
               ? regexpCache[regexpText] || (regexpCache[regexpText] = new RegExp(regexpText, 'g'))
               : null
         });
      }

      // return applied ligatures or original text if none exist for given configuration
      return ligatureConfig.regexp
         ? text.replace(ligatureConfig.regexp, function(match) {
            return ligatures[match] || match;
         })
         : text;
   };
}

function RenderTextCufon (text,font, size, ctx ,l ,fill) {
	function generateFromVML(path, context) {
		var atX = 0, atY = 0;
		var code = [], re = /([mrvxe])([^a-z]*)/g, match;
		generate: for (var i = 0; match = re.exec(path); ++i) {
			var c = match[2].split(',');
			switch (match[1]) {
				case 'v':
					code[i] = { m: 'bezierCurveTo', a: [ atX + ~~c[0], atY + ~~c[1], atX + ~~c[2], atY + ~~c[3], atX += ~~c[4], atY += ~~c[5] ] };
					break;
				case 'r':
					code[i] = { m: 'lineTo', a: [ atX += ~~c[0], atY += ~~c[1] ] };
					break;
				case 'm':
					code[i] = { m: 'moveTo', a: [ atX = ~~c[0], atY = ~~c[1] ] };
					break;
				case 'x':
					code[i] = { m: 'closePath' };
					break;
				case 'e':
					break generate;
			}
			context[code[i].m].apply(context, code[i].a);
		}
		return code;
	}

	function interpret(code, context) {
		for (var i = 0, l = code.length; i < l; ++i) {
			var line = code[i];
			context[line.m].apply(context, line.a);
		}
	}
   
   var fl = new FollowLine (l)
   if ( ! fl.IsValid())
      return
      
   // Shift ==> Render at middle line and not at baseline !
   var shift      = parseInt(font.face["x-height"]) /100 * size.value 
   var viewBox    = font.viewBox;
   var expandTop  = 0, expandRight = 0, expandBottom = 0, expandLeft = 0;

   //var chars = Cufon.CSS.textTransform(options.ligatures ? font.applyLigatures(text, options.ligatures) : text, style).split(''); // ligature ?? UpperCase ?? lowerCase ?? Capitalize ?? Interesting !      
   var chars = text.split('')
   var jumps = font.spacing(chars,
      ~~size.convertFrom(0), // letter spacing
      ~~size.convertFrom(0)  // word spacing
   );
   
   if (!jumps.length) return null; // there's nothing to render

   var width    = jumps.total;
   expandRight += viewBox.width - jumps[jumps.length - 1];
   expandLeft  += viewBox.minX;

   var height = size.convert(viewBox.height);
   var roundedHeight = Math.ceil(height);
   var roundingFactor = roundedHeight / height;
   var stretchedWidth = width * roundingFactor;

   // minY has no part in canvas.height
   expandTop += viewBox.minY;

   var g = ctx
   var scale = height / viewBox.height;
   // var pixelRatio = window.devicePixelRatio || 1;
   // if (pixelRatio != 1) {
      // canvas.width = canvasWidth * pixelRatio;
      // canvas.height = canvasHeight * pixelRatio;
      // g.scale(pixelRatio, pixelRatio);
   // }

   /*
   // proper horizontal scaling is performed later
   g.translate ( 0,shift);
   //g.scale(scale, scale * roundingFactor);
   g.scale(scale, scale );
   //g.translate(-expandLeft, -expandTop);
   g.save();

   function renderText() {
      var glyphs = font.glyphs, glyph, i = -1, j = -1, chr;
      //g.scale(roundingFactor, 1);
      while (chr = chars[++i]) {
         g.save()                                  // new
         var tr = fl.Advance ( jumps[(j+1)] * scale )                // new
         //g.translate ( tr[0] /scale, tr[1] /scale);            // new
         //g.rotate(tr[2]);                          // new
      
         var glyph = glyphs[chars[i]] || font.missingGlyph;
         if (!glyph) {continue;g.resore();}
         if (glyph.d) {
            g.beginPath();
            // the following moveTo is for Opera 9.2. if we don't
            // do this, it won't forget the previous path which
            // results in garbled text.
            g.moveTo(0, 0);
            if (glyph.code) interpret(glyph.code, g);
            else glyph.code = generateFromVML('m' + glyph.d, g);
            g.fill();
         }
         g.restore(); // new
         g.translate(jumps[++j], 0);
      }
   }
   g.fillStyle="rgba(0,0,0,1.0)";
   renderText();
   g.restore();
   */

   // proper horizontal scaling is performed later
   
   //g.scale(scale, scale * roundingFactor);
   
   //g.translate(-expandLeft, -expandTop);
   g.save();
   if (!fill) {
      ctx.lineWidth    = ctx.lineWidth / scale;
   }
   function renderText() {
      var glyphs = font.glyphs, glyph, i = -1, j = -1, chr;
      //g.scale(roundingFactor, 1);
      var accJ = 0;
      while (chr = chars[++i]) {
         var tr = fl.Advance ( jumps[(j+1)] * scale )                // new
         if ( !tr) return;
         g.save()                                  // new
         g.translate ( tr[0] , tr[1] );            // new
         g.rotate(tr[2]);                          // new
         g.translate ( 0,shift);
         g.scale(scale, scale );
         //g.translate(accJ, 0);
         var glyph = glyphs[chars[i]] || font.missingGlyph;
         if (!glyph) {g.restore();continue;}
         if (glyph.d) {
            g.beginPath();
            // the following moveTo is for Opera 9.2. if we don't
            // do this, it won't forget the previous path which
            // results in garbled text.
            g.moveTo(0, 0);
            if (glyph.code) interpret(glyph.code, g);
            else glyph.code = generateFromVML('m' + glyph.d, g);
            if ( fill ) {
               g.fill();
            }
            else { 
               g.stroke();
            }
         }
         accJ += jumps[++j];
         g.restore(); // new
      }
   }
   renderText();
   g.restore();
};

function ExtendCanvasContext ( ctx ) {
   Object.getPrototypeOf(ctx).fillTextOnLine = function ( txt , l ) {
      ctx.save()
      ctx.textBaseline="middle";
      TextOnLine ( this, l, txt, true );
      ctx.restore()
   }
   Object.getPrototypeOf(ctx).strokeTextOnLine = function ( txt , l ) {
      ctx.save()
      ctx.textBaseline="middle";
      TextOnLine ( this, l, txt, false );
      ctx.restore()
   }
   Object.getPrototypeOf(ctx).fillTextOnLine2 = function ( txt , l ) {
      ctx.save()
      var fname = this.fontParams["family"].replace ( /(^["' \t])|(["' \t]$)/g, "" ).toLowerCase();
      var _font = globalFonts.Get(fname,this.fontParams["style"],this.fontParams["weight"]);
      if (!_font) {
         console.error ("fillTextOnLine2 : font error 2");
         return ;
      }
      var _size = new FontSize ( this.fontParams["size"] , _font.baseSize );
      RenderTextCufon ( txt , _font, _size , this , l, true);
      ctx.restore()
      
   }
   Object.getPrototypeOf(ctx).strokeTextOnLine2 = function ( txt , l ) {
      ctx.save()
      var fname = this.fontParams["family"].replace ( /(^["' \t])|(["' \t]$)/g, "" ).toLowerCase();
      var _font = globalFonts.Get(fname,this.fontParams["style"],this.fontParams["weight"]);
      if (!_font) {
         console.error ("fillTextOnLine2 : font error 2");
         return ;
      }
      var _size = new FontSize ( this.fontParams["size"] , _font.baseSize );
      RenderTextCufon ( txt , _font, _size , this , l, false);
      ctx.restore()
   }
   
   Object.getPrototypeOf(ctx).SetFont = function ( cssfont ) {
      this.font   = cssfont;
      var $test   = $('<span />').appendTo('body');
      $test.css('font', cssfont);
      //console.log($test.css('fontWeight'));console.log($test.css('fontStyle'));console.log($test.css('fontVariant'));console.log($test.css('fontSize'));console.log($test.css('lineHeight'));console.log($test.css('fontFamily'));
      var family = $test.css('fontFamily');
      var size   = parseInt ( $test.css('fontSize') );
      var weight = $test.css('fontWeight');
      var style  = $test.css('fontStyle');      
      this.fontParams = { "family":family, "size":size, "weight":weight, "style":style };
      $test.remove();
   }
   
}

