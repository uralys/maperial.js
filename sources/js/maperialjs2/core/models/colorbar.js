//-----------------------------------------------------------------------------------//

function Colorbar (options) {
   this.uid                = Utils.generateUID();
   this.data               = options.data               ||  {};
   this.beginAlphaAtZero   = options.beginAlphaAtZero   || false;
}

//-----------------------------------------------------------------------------------//

Colorbar.prototype.IsValid = function (  ) {
   var rTmp = Object.keys(this.data);
   return rTmp.length >= 2
}

Colorbar.prototype.FromJson = function ( inJson ) {
   this.data = {} // reset ...
   for (var i in inJson) {
      // Constant or GradiantColor ???
      this.Set ( i , new GradiantColor (inJson[i].r , inJson[i].g , inJson[i].b , inJson[i].a) )
   }
}

Colorbar.prototype.ToJson = function  (  ) {
   var r = {}
   for (var i in this.data){
      // Constant or GradiantColor ???
      r[i] = {"r":this.data[i].r,"g":this.data[i].g,"b":this.data[i].b,"a":this.data[i].a}
   }
   return r;
}

Colorbar.prototype.SetMin  = function( inV , inC ){
   if (typeof (inV) == "undefined")
      return 
   if (typeof (inC) == "undefined")
      return 
   //var k = Object.keys(this.data)
   toRemove = []
   for ( var i in this.data ) {
      if ( parseFloat(i) <= parseFloat(inV) ) {
         toRemove.push(i)
      }
   }
   for (var i = 0 ; i < toRemove.lenght ; i++) {
      delete this.data[toRemove[i]]
   }
   
   this.data[inV] = inC
}

Colorbar.prototype.SetMax  = function( inV , inC ){
   if (typeof (inV) == "undefined")
      return 
   if (typeof (inC) == "undefined")
      return 
   for ( var i in this.data ) {
      if ( parseFloat(i) >= parseFloat(inV) ) {
         toRemove.push(i)
      }
   }
   for (var i = 0 ; i < toRemove.lenght ; i++) {
      delete this.data[toRemove[i]]
   }
   this.data[inV] = inC
}

Colorbar.prototype.Set     = function( inV , inC ){
   if (typeof (inV) == "undefined")
      return 
   if (typeof (inC) == "undefined")
      return 
   this.data[inV] = inC
}

Colorbar.prototype.Indexes = function(  ){
   var rTmp = Object.keys(this.data);
   var r    = []
   for (var i = 0 ; i < rTmp.length ; ++i) {
      r.push ( parseFloat( rTmp[i] ) ) 
   }
   return r
}

Colorbar.prototype.Remove  = function( inV ){
   if ( inV in this.data)
      delete this.data[inV]
      
}

Colorbar.prototype.Move    = function( inVOld, inVNew ){
   if ( inV in this.data) {
      var c = this.data[inVOld]
      delete this.data[inVOld]
      this.data[inVNew] = c
   }
}

Colorbar.prototype.GetByKey    = function( inV ){ 
   if ( inV in this.data )
      return this.data[inV]
   return null
}

Colorbar.prototype.GetBounds     = function(  ){
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

Colorbar.prototype.Get     = function( inT ){ //[0.0,1.0]
   var k = Object.keys(this.data); 

   if (k.length < 2)
      return null //Invalid

   for (var i = 0 ; i < k.length ; ++ i ){
      k[i] = parseFloat(k[i]);
   }
   k.sort()
   
   var min = k[0];
   var max = k[k.length-1];
   var v   = (max - min) * inT + min;
   if (v < min) v = min
   if (v > max) v = max
   if ( v in this.data )
      if ( v == min && this.beginAlphaAtZero ){
         return new RGBAColor ( this.data[v].r ,  this.data[v].g , this.data[v].b , 0 )
      }
      else {
         return new RGBAColor ( this.data[v].r ,  this.data[v].g , this.data[v].b , this.data[v].a )
      }
   
   var supI = 0
   for ( var i = 1 ; i < k.length ; i++ ) {
      if ( v < k[i] ) {
         supI = i
         break;
      }
   }   
   if ( supI == 0) 
      return null //Error
      
   var v0 =  k[supI -1] 
   var v1 =  k[supI   ] 
   
   var c0 = this.data[v0]
   var c1 = this.data[v1]
   
   var t = (v - v0) / (v1 - v0);
   
   return c1.GetWith(c0,t);
}