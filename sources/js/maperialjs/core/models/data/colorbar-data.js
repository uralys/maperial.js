
var utils       = require('../../../../tools/utils.js'),
    RGBAColor   = require('../../../libs/rgba-color.js');
    
//-----------------------------------------------------------------------------------//

function ColorbarData (options) {
   this.uid                = utils.generateUID();
   this.version            = 0;
   
   this.data               = options.data               ||  {};
   this.beginAlphaAtZero   = options.beginAlphaAtZero   || false;
}

//-----------------------------------------------------------------------------------//

ColorbarData.prototype.IsValid = function (  ) {
   var rTmp = Object.keys(this.data);
   return rTmp.length >= 2
}

ColorbarData.prototype.FromJson = function ( inJson ) {
   this.data = {} // reset ...
   for (var i in inJson) {
      // Constant or GradiantColor ???
      this.Set ( i , new GradiantColor (inJson[i].r , inJson[i].g , inJson[i].b , inJson[i].a) )
   }
}

ColorbarData.prototype.ToJson = function  (  ) {
   var r = {}
   for (var i in this.data){
      // Constant or GradiantColor ???
      r[i] = {"r":this.data[i].r,"g":this.data[i].g,"b":this.data[i].b,"a":this.data[i].a}
   }
   return r;
}

ColorbarData.prototype.SetMin  = function( inV , inC ){
   if (typeof (inV) == "undefined")
      return;
   if (typeof (inC) == "undefined")
      return;
   //var k = Object.keys(this.data)
   toRemove = [];
   for ( var i in this.data ) {
      if ( parseFloat(i) <= parseFloat(inV) ) {
         toRemove.push(i);
      }
   }
   for (var i = 0 ; i < toRemove.lenght ; i++) {
      delete this.data[toRemove[i]];
   }
   
   this.data[inV] = inC;

   this.version ++;
}

ColorbarData.prototype.SetMax  = function( inV , inC ){

   if (typeof (inV) == "undefined")
      return ;

   if (typeof (inC) == "undefined")
      return; 

   for ( var i in this.data ) {
      if ( parseFloat(i) >= parseFloat(inV) ) {
         toRemove.push(i)
      }
   }

   for (var i = 0 ; i < toRemove.lenght ; i++) {
      delete this.data[toRemove[i]]
   }

   this.data[inV] = inC;

   this.version ++;
}

ColorbarData.prototype.Set     = function( inV , inC ){
   if (typeof (inV) == "undefined")
      return;
   if (typeof (inC) == "undefined")
      return;
   this.data[inV] = inC;

   this.version ++;
}

ColorbarData.prototype.Indexes = function(  ){
   var rTmp = Object.keys(this.data);
   var r    = []
   for (var i = 0 ; i < rTmp.length ; ++i) {
      r.push ( parseFloat( rTmp[i] ) ) 
   }
   return r;
}

ColorbarData.prototype.Remove  = function( inV ){
   if ( inV in this.data){
      delete this.data[inV]
      this.version ++;
   }

}

ColorbarData.prototype.Move    = function( inVOld, inVNew ){
   if ( inV in this.data) {
      var c = this.data[inVOld]
      delete this.data[inVOld]
      this.data[inVNew] = c
   }
}

ColorbarData.prototype.GetByKey    = function( inV ){ 
   if ( inV in this.data )
      return this.data[inV]
   return null
}

ColorbarData.prototype.GetBounds     = function(  ){
   var k = Object.keys(this.data); 
   
   if (k.length < 2)
      return [0.0,0.0]; //Invalid

   for (var i = 0 ; i < k.length ; ++ i ){
      k[i] = parseFloat(k[i]);
   }
   k.sort()
   
   var min = k[0];
   var max = k[k.length-1];
   return [min,max];
}

ColorbarData.prototype.Get     = function( inT ){ //[0.0,1.0]

   var k = Object.keys(this.data); 

   if (k.length < 2)
      return null; //Invalid
   
   var min = parseFloat(k[0]);
   var max = parseFloat(k[k.length-1]);
   var v   = (max - min) * inT + min;
   if (v < min) v = min;
   if (v > max) v = max;
   
   var isStep = false;
   for(var key in this.data){
      if(parseFloat(key) == v){
         isStep   = true;
         v        = key;
         break;
      }
   }
   
   if ( isStep ){
      if ( parseFloat(v) == min && this.beginAlphaAtZero ){
         return new RGBAColor ( this.data[v].r ,  this.data[v].g , this.data[v].b , 0 )
      }
      else {
         return new RGBAColor ( this.data[v].r ,  this.data[v].g , this.data[v].b , this.data[v].a )
      }
   }
   else{
      var keyUp, keyDown;
      
      for ( var i = 1 ; i < k.length ; i++ ) {
         if ( v < k[i] ) {
            keyUp    = k[i] 
            keyDown  = k[i-1] 
            break;
         }
      }   
      if (!keyUp) 
         return null //Error
         
      var c0 = this.data[keyDown];
      var c1 = this.data[keyUp];
      
      var v0 = parseFloat(keyDown);
      var v1 = parseFloat(keyUp);
      
      var t = (v - v0) / (v1 - v0);
      
      return c1.GetWith(c0,t);
   }
   
}

//------------------------------------------------------------------//

module.exports = ColorbarData;