//------------------------------------------------------------------//

var Style               = require('./style.js'),
    PointSymbolizer     = require('./style.js'),;

//-----------------------------------------------------------------------------------//

function VectorialStyle (options) {   
   this.uid                = Utils.generateUID();
   
   this.type               = options.type;
   this.symbol             = options.symbol;
   this.horizontalAlign    = options.horizontalAlign  || "center";
   this.verticalAlign      = options.verticalAlign    || "bottom";

   this.content            = {};
   this.curId              = 0;

   var ps = new PointSymbolizer(this.symbol);
   ps.Alignement(this.horizontalAlign, this.verticalAlign);

   this.symbId = this.AddSymbolizer ( ps , 18 , 0  );
   
   // register 
   window.maperialStyles[this.uid] = this
}

//-----------------------------------------------------------------------------------//

VectorialStyle.prototype.AddSymbolizer = function( inSymb , inZMin, inZMax , inId ) {
   // only apply on custom style !
   if ( this.type != Style.Custom )
      return null;
      
   if (typeof inId === "undefined") {   
      var idStr            = "" + this.curId;
      idStr                = new Array(3 - idStr.length + 1).join('0') + idStr;
      this.curId           = this.curId + 1;
      
      //var tmp              = jQuery.extend({}, inSymb);
      this.content[idStr]  = {
         visible  : true,
         layer    : "back",
         s        : [
            {
               zmin  : inZMin,
               zmax  : inZMax,
               s     : [inSymb],
            }
         ]
      }
      return idStr;
   }
   else {
      if ( ! ( inId in this.content ) )
         return null;
      this.content[inId].s.push (
         {
            zmin  : inZMin,
            zmax  : inZMax,
            s     : [inSymb],
         }
      )
   }
}

VectorialStyle.prototype.AddSymbsComposer = function( inSymbComp,inId) {
   // only apply on custom style !
   if ( this.type != Style.Custom )
      return null;

   if (typeof inId === "undefined") {   
      var idStr            = "" + this.curId;
      idStr                = new Array(3 - idStr.length + 1).join('0') + idStr;
      this.curId           = this.curId + 1;
      this.content[idStr]  = {
         visible  : true,
         layer    : "back",
         s        : [
            {
               zmin  : inSymbComp.zmin,
               zmax  : inSymbComp.zmax,
               s     : inSymbComp.symbs,
            }
         ]
      }
      return idStr;
   }
   else {
      if ( ! ( inId in this.content ) )
         return null;
      this.content[inId].s.push (
         {
            zmin  : inSymbComp.zmin,
            zmax  : inSymbComp.zmax,
            s     : inSymbComp.symbs,
         }
      )
   }
}

VectorialStyle.prototype.SetVisible = function( inId , visible) {
   if ( ! ( inId in this.content ) )
      return false;
   this.content[inId].visible = visible;
}

//------------------------------------------------------------------//

module.exports = VectorialStyle;
