//-------------------------------------------//

function ColorbarRainbow() {

   this.DataSize = 256;

   this.colors = new HashMap();   // instanciate data
   this.Clear();              // initialize data
}

//-------------------------------------------//

ColorbarRainbow.prototype.Colors = function(){
   return this.colors;
} 

ColorbarRainbow.prototype.ClearAll = function(){ 
   this.colors.clear();
   //this.SetFirst(new RGBColor("blue"));
   //this.SetLast(new RGBColor("red"));
}

ColorbarRainbow.prototype.Clear = function(){
   this.colors.clear();

   //reset
   this.SetFirst(new RGBColor("blue"));
   this.Add(new RGBColor("green"),128);
   this.SetLast(new RGBColor("red"));
}

ColorbarRainbow.prototype.GetKeys = function(){
   var keys = colors.getAllKeys();
   keys.sort(function(a,b){return a - b});
   return keys;
}

ColorbarRainbow.prototype.Add = function(color,index){  //RGBColor
   if(typeof color === 'undefined'){return;}
   if(typeof index === 'undefined'){return;}

   if ( ! color.ok ){return;}

   if ( index < 0 || index >= this.DataSize)
      return;

   if ( (index != 0) && (index != this.DataSize-1)){  // cannot change 0 and 255 this way ! use setFirst/Last instead
      this.colors.put(index,color);
   }
}

ColorbarRainbow.prototype.SetFirst = function(color){ //RGBColor
   if(typeof color === 'undefined'){return;}
   if ( ! color.ok ){return;}  

   this.colors.put(0,color);
}

ColorbarRainbow.prototype.SetLast = function(color){      //RGBColor
   if(typeof color === 'undefined'){return;}

   if ( ! color.ok ){return;}  
   this.colors.put(this.DataSize-1,color);
}    

ColorbarRainbow.prototype.Remove = function(index){
   if(typeof index === 'undefined'){return;}

   if ( index < 0 || index >= this.DataSize || (! this.colors.containsKey(index)))
      return;

   if ( index != 0 && index != this.DataSize-1){  // cannot remove 0 and 255 at all
      this.colors.removeByKey(index);
   }
}

ColorbarRainbow.prototype.GetNextAndPreviousIndex = function(index){
   if(typeof index === 'undefined'){return -1;}

   var keys = this.colors.getAllKeys();
   keys.sort(function(a,b){return a - b});

   for( var i = 0 ; i < keys.length ; ++i){
      if ( keys[i] > index){
         if ( i > 0){
            return {next: keys[i], previous: keys[i-1]};
         }
         else{
            // should not happend ...
            return {next: keys[0], previous: keys[0]};
         }
      }
   }

   //should not happend ...
   return {next: keys[keys.length-1], previous: keys[keys.length-2]};      // it's ok, there is always at least 2 keys in map !
}   

ColorbarRainbow.prototype.Get = function(index,isInterpolated,withMark,isHsl){
   if(typeof index === 'undefined'){
      var tmp =  new RGBColor("black");
      tmp.setAlpha(0.0);
      return tmp;
   }  

   if(typeof isInterpolated === 'undefined')
      var isInterpolated = true;

   if(typeof withMark === 'undefined')
      var withMark = false;

   if(typeof isHsl === 'undefined')
      var isHsl = true;


   if ( index < 0 || index >= this.DataSize ){
      var tmp =  new RGBColor("black");
      tmp.setAlpha(0.0);
      return tmp;
   }

   if (withMark && this.colors.containsKey(Math.round(index)) ){
      return new RGBColor("black");     ///@todo  this can used to draw contour plots ... think of it !
   }

   var id = this.GetNextAndPreviousIndex(index);
   var idB = id.previous;
   var idT = id.next;

   if ( idB < 0 || idT < 0){
      var tmp =  new RGBColor("black");
      tmp.setAlpha(0.0);
      return tmp;
   }

   if ( ! isInterpolated){
      //return this.colors.get(idB); // stupid basic dummy crappy test
      if ( index >= (idT+idB)*0.5 )
         return this.colors.get(idT);
      else
         return this.colors.get(idB);
   }    

   //interpolated case
   var c = this.Interp(idB,idT,index,isHsl);

   return c;
}

ColorbarRainbow.prototype.Interp = function(bottom,top,index,isHsl){
   if(typeof isHsl === 'undefined')
      var isHsl = true;

   if ( bottom == top )
      return this.colors.get(idT);

   var ic = new RGBColor("white");
   var bottomC = this.colors.get(bottom);
   var topC    = this.colors.get(top);

   if ( ! isHsl ){
      // dont forget to round off float
      ///@todo ensure (r,g,b) in [0,255] !
      ic.r = Math.round(bottomC.r + (topC.r - bottomC.r)/(top-bottom)*(index-bottom));
      ic.g = Math.round(bottomC.g + (topC.g - bottomC.g)/(top-bottom)*(index-bottom));
      ic.b = Math.round(bottomC.b + (topC.b - bottomC.b)/(top-bottom)*(index-bottom));
      ic.a = bottomC.a + (topC.a - bottomC.a)/(top-bottom)*(index-bottom);
   }
   else{
      var hsvB = bottomC.toHsv();
      var hsvT = topC.toHsv();
      var hsvH = hsvB.H + (hsvT.H - hsvB.H)/(top-bottom)*(index-bottom);
      var hsvS = hsvB.S + (hsvT.S - hsvB.S)/(top-bottom)*(index-bottom);
      var hsvV = hsvB.V + (hsvT.V - hsvB.V)/(top-bottom)*(index-bottom);
      var hsv = {H:hsvH,S:hsvS,V:hsvV};
      ic.fromHsv(hsv);      // will apply the rounding needed !
      ic.a = bottomC.a + (topC.a - bottomC.a)/(top-bottom)*(index-bottom);
   }

   return ic;
}
