

//color Bar object
//offsets are "in canvas" offset. They are provided because **** YOU MUST NOT USE CSS PADDING *** for canvas !!!!!!    

function Colorbar (mainDiv, colorbar, width, height, offsetX, offsetY, doInterpo, minVal, maxVal){

   this.ExportDataSize = 256; // SHOULD **NOT** BE > rainbow.DataSize !!!!!
   this.globalUID = Utils.generateGuid(); // allow multiple colorBar ;-)

   //settings default params (private variables)

   this.canvasId         = "cb_canvas_"+this.globalUID;
   this.colorPickerId    = "colorpicker_colorBar_"+this.globalUID;

   this.mainDiv =  mainDiv;
   this.colorbar =  colorbar;

   this.width = width;
   this.height = height;
   this.minVal = minVal;
   this.maxVal = maxVal;
   this.offsetX = offsetX;
   this.offsetY = offsetY;
   this.doInterpo = doInterpo;

   this.fontsize = null;
   this.canvasW = null;
   this.canvasH = null;

   this.isHsl = false;

   // the rainbow of colors :-)  
   this.rainbow = new ColorbarRainbow(); 

   //canvas context
   this.context = null;

   //this will be a color picker object reference
   this.colorPicker = null;

   //used in callbacks for mouse event
   this.oldPos     = -1;
   this.lastAdded  = -1;
   this.clicked    = false;
   this._color     = null;  

   this.Reset(width, height, mainDiv, offsetX, offsetY, doInterpo, minVal, maxVal);
   this.Import();
   
   ///test
// this.AutoAdd(6);
// var jsonExportTest = {};
// this.Export(jsonExportTest);
// this.Import(jsonExportTest);
}

/////////////////////////
//View thing depends on colorBar width and height ... So need to Reset everything sometimes !
/////////////////////////
Colorbar.prototype.Reset = function(in_width,in_height,in_mainDiv,in_offsetX,in_offsetY,in_doInterpo,in_minVal,in_maxVal){
   this.InitValues(in_width,in_height,in_mainDiv,in_offsetX,in_offsetY,in_doInterpo,in_minVal,in_maxVal);
   this.InitView();
// this.AutoAdd();
   this.Render();
}

/////////////////////////
//settings default params
/////////////////////////
Colorbar.prototype.InitValues = function (in_width,in_height,in_mainDiv,in_offsetX,in_offsetY,in_doInterpo,in_minVal,in_maxVal){

   this.width           = in_width || 75;
   this.height          = in_height || 600;
   ///@todo setters !!!!!
   this.minVal          = in_minVal || 0;
   this.maxVal          = in_maxVal || 100;

   this.offsetX         = in_offsetX || 20;
   this.offsetY         = in_offsetY || 20;
   this.doInterpo       = in_doInterpo;  
   this.fontsize        = this.height / 35;

   this.canvasW         = in_width + 2 * this.offsetX + 10 * this.fontsize;
   this.canvasH         = in_height + 2 * this.offsetY;  
}

/////////////////////////
//get call back for colorpicker (ensure colorPickerId is fine)
/////////////////////////
Colorbar.prototype.GetColorPickerCallBack = function(){
   var me = this;
   return function (hsb, hex, rgb) {
      $("#" + me.colorPickerId + " div").css('backgroundColor', '#' + hex);   // update picker view
      me.ColorCallBack(hex);  // update bar
   }  
}

/////////////////////////
//Init view thing 
/////////////////////////
Colorbar.prototype.InitView = function(){

   var me = this;
   this.mainDiv.empty(); // clear container

   this.mainDiv.css('width', this.canvasW + 20);

   // add an inner div of class maperialColorBarDiv (allow css tuning)
   var maperialColorBarDiv = $("<div class=\"maperialColorBarDiv\"></div>");
   maperialColorBarDiv.appendTo(this.mainDiv);

   //add the canvas for colorBar
   $("<canvas class=\"cb_canvas\" id=\"" + this.canvasId + "\" width=\"" + this.canvasW +"\" height=\"" + this.canvasH + "\"></canvas>").appendTo(maperialColorBarDiv);

   //add the dirty color param div  // let say this is just temporary stuff ... :-S
   var tmp = ''                                                                          +
   '<div class="cb_colorpickerWrap">'                                                + 
   '  <div class="cb_pikerLegend">'                                                  +
   '      Change last color :'                                                       +
   '  </div>'                                                                        +
   '  <div class="cb_colorpicker" id="cb_colorpicker_' + this.globalUID + '">'            +
   '  </div>'                                                                        +
   '  <form>'                                                                        +
   '  <input type="checkbox" class="cb_Interp" id="cb_Interp_' + this.globalUID + '" value="interp" checked> interp <br/>'       +
   '  <input type="checkbox" class="cb_Hsl"    id="cb_Hsl_'    + this.globalUID + '" value="hsl" checked> hsl/rbg <br/>'         +
   '  <input type="button"   class="cl_Clear"  id="cb_Clear_'  + this.globalUID + '" value="Reset" checked> <br/>'               +
   '  </form>'                                                                       +
   '</div>'                                                                          +
   '';
   $(tmp).appendTo(maperialColorBarDiv);

   // register the button callbacks 
   $('#cb_Interp_'+ this.globalUID).click(function()    { me.toggleInterp(); });
   $('#cb_Hsl_'   + this.globalUID).click(function()    { me.toggleHsl();    });
   $('#cb_Clear_' + this.globalUID).click(function()    { me.Clear();        });

   // add colorPicker (new version with jquery)
   $("<div class=\"colorSelector\" id=\"" + this.colorPickerId + "\"><div style=\"background-color:" + ColorTools.RGBAToHex("rgba(30,50,80,1.0)") + "\"></div></div>").appendTo($("#cb_colorpicker_"+this.globalUID));

   $("#"+this.colorPickerId).ColorPicker({
      color: ColorTools.RGBAToHex("rgba(30,50,80,1.0)"),
      //flat : true,
      onShow: function (colpkr) {
         $(colpkr).fadeIn(500);
         return false;
      },
      onHide: function (colpkr) {
         $(colpkr).fadeOut(500);
         return false;
      },
      onChange: this.GetColorPickerCallBack()
   });

   this.colorPicker = $('#'+this.colorPickerId);  
   // end tmp

   // register mouse event callbacks in canvas
   $('#'+this.canvasId).mousedown   ( function(event) { me.onMouseDown  (event) } );
   $('#'+this.canvasId).mouseup     ( function(event) { me.onMouseUp    (event) } );
   $('#'+this.canvasId).mousemove   ( function(event) { me.onMouseDrag  (event) } );    

   //configure the colorBar "window"
   /* 
    this.mainDiv.dialog({
       title: "The color Bar :-)",
       position: "right",
       width:'auto',
       height : 850,
       maxHeight : 850,
       resizable: false,
       closeOnEscape: false,
       open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); }       
    });
    */

// this.mainDiv.animate({left:"800"},1000);
// this.mainDiv.animate({top:"90"},1000);
// this.mainDiv.css('position','absolute');
// this.mainDiv.css('right','400');
// this.mainDiv.css('top','0');


}

/////////////////////////
//Some get/set-ers
/////////////////////////
Colorbar.prototype.setWidth = function(w){
   this.Reset(w, this.height, this.mainDiv, this.offsetX, this.offsetY, this.doInterpo, this.minVal, this.maxVal);
}

Colorbar.prototype.setHeight = function(h){
   this.Reset(this.width, h, this.mainDiv, this.offsetX, this.offsetY, this.doInterpo, this.minVal, this.maxVal);
}

Colorbar.prototype.setMinVal = function(min){
   this.Reset(this.width, this.height, this.mainDiv, this.offsetX, this.offsetY, this.doInterpo, min, this.maxVal);
}

Colorbar.prototype.setMaxVal = function(max){
   this.Reset(this.width, this.height, this.mainDiv, this.offsetX, this.offsetY, this.doInterpo, this.minVal, max);
}

Colorbar.prototype.setInterp = function(b){
   this.doInterpo = b;
}

Colorbar.prototype.getInterp = function(){
   return this.doInterpo;
}

Colorbar.prototype.toggleInterp = function(){
   this.setInterp(!this.getInterp());
   this.Render();
}

Colorbar.prototype.setHsl = function(b){
   this.isHsl = b;
}

Colorbar.prototype.getHsl = function(){
   return this.isHsl;
}

Colorbar.prototype.toggleHsl = function(){
   this.setHsl(!this.getHsl());
   this.Render();
}  

/////////////////////////
//private drawing functions
/////////////////////////
Colorbar.prototype.DrawMainRect = function(){
   /* 
    //Title
    context.beginPath();
    context.lineWidth    = "2";   
    context.strokeStyle  = "#000";
    context.fillStyle    = "#000";
    context.font         = fontsize*1.35 + 'px sans-serif';

    context.fillText     ("ColorScale with Canvas POC",offsetX/4,offsetY*2/6 + 0.85*fontsize);
    context.fill();
    */
   //Color bar border
   this.context.beginPath();
   this.context.lineWidth    = "2";   
   this.context.strokeStyle  = "#000";
   this.context.fillStyle    = "#000";

   this.context.rect (this.offsetX-1, this.offsetY-1, this.width+2, this.height+2);
   this.context.stroke();
}

Colorbar.prototype.DrawTick = function (j,curIndex,color){
   //Arrow
   this.context.lineWidth="1";   
   this.context.strokeStyle  = color.toHex();
   this.context.fillStyle    = color.toHex();

   CanvasUtilities.drawArrow (
         this.context, 
         this.width + this.offsetX + 7*this.fontsize/2,
         j + this.offsetY, 
         this.width + this.offsetX + this.fontsize/3, 
         j + this.offsetY
   );

   //Box
   this.context.strokeStyle  = "#000";
   this.context.fillStyle    = "#000";
   this.context.roundedRect  (
         this.width + this.offsetX + 8*this.fontsize/2, 
         j - this.fontsize/1.5 + this.offsetY, 
         this.fontsize*6.5, 
         this.fontsize*1.5, 
         this.fontsize*0.5
         /*,false,true*/
   );

   //Label
   this.context.font = this.fontsize + 'px sans-serif';
   var curVal        = this.minVal + (this.maxVal - this.minVal)/(this.rainbow.DataSize-1)*curIndex;

   this.context.fillText     (
         curIndex + ' (' + Math.round(curVal*100)/100 + ')',
         this.width + this.offsetX+9*this.fontsize/2,
         j + this.offsetY + this.fontsize/2.5
   );

   this.context.stroke();
}

/////////////////////////
//render is public  ... but you should probably not use it much...
/////////////////////////
Colorbar.prototype.Render = function(){
   
   this.context = document.getElementById(this.canvasId).getContext("2d");
   
   //clear canvas !
   this.context.clear();

   this.DrawMainRect();

   var tickMark = new HashMap();

   for(var j = 0 ; j < this.height ; ++j){
      var curIndex = Math.round((this.height-1-j)*(this.rainbow.DataSize-1)/(this.height-1));
      var color = this.rainbow.Get(curIndex, this.doInterpo, true, this.isHsl);
      var realColor = this.rainbow.Get(curIndex, this.doInterpo, false, this.isHsl);

      if ( ! color.ok ){
         var tmp =  new RGBColor("black");
         tmp.setAlpha(0.0);
         return tmp;
      }    

      if ( this.rainbow.Colors().containsKey(curIndex) ){
         if (! tickMark.containsKey(curIndex)){
            this.DrawTick(j, curIndex, realColor);
            tickMark.put(curIndex, true);
         }
      }

      // line by line ...
      this.context.lineWidth = 1;
      this.context.strokeStyle  = color.toRGBA();
      this.context.fillStyle    = color.toRGBA();
      //context.strokeStyle  = color.toRGB();
      //context.fillStyle    = color.toRGB();
      this.context.beginPath();
      this.context.moveTo(this.offsetX , this.offsetY + j);
      this.context.lineTo(this.offsetX + this.width , this.offsetY + j);
      this.context.stroke()      
   }

}

/////////////////////////
//Now, some bridge to Rainbow get/set-ers
/////////////////////////
Colorbar.prototype.Add = function(color,index){
   this.rainbow.Add(color,index);
}

Colorbar.prototype.AddFirst = function(color){
   this.rainbow.SetFirst(color);
}

Colorbar.prototype.AddLast = function(color){
   this.rainbow.SetLast(color);
}     

Colorbar.prototype.GetIndex = function(value){
   return Math.round(0. + (this.rainbow.DataSize - 1 - 0.)/(this.maxVal - this.minVal)*(value - this.minVal));
}

Colorbar.prototype.GetColor = function(index){
   return this.rainbow.Get(index, this.doInterpo, false, this.isHsl);
}

Colorbar.prototype.Clear = function(){
   this.rainbow.Clear();
   this.Render();
}

///@todo be able to get color from some predefined colormap
//and not this static HSV example
Colorbar.prototype.AutoAdd = function(nstep,mini,maxi){
   
   this.rainbow.ClearAll();     

   if ( mini === undefined )
      mini = this.minVal;     
   if ( maxi === undefined )
      maxi = this.maxVal;
   if ( nstep === undefined )
      nstep = 10;

   var step = (maxi-mini)/(nstep-1);
   console.log("step is " + step);
   for(var k = 0 ; k < nstep ; k++ ){
      var color = new RGBColor("white");
      var index = this.GetIndex(mini + k * step);
      console.log(1. + 3./(nstep-1)*(nstep-k-1));
      var hsv = { H:1.+3./(nstep-1)*(nstep-k-1),S:1,V:1};
      color.fromHsv(hsv);      
      //var color = this.GetColor(index);
      console.log("adding tick at " + (mini + k * step) + " " + index + " " + color);
      if ( index == 0 ){
         this.rainbow.SetFirst(color);
      }
      else if ( index == rainbow.DataSize -1 ){
         this.rainbow.SetLast(color);
      }
      else{
         this.rainbow.Add(color,index);
      }
   }

   this.Render();
}

/////////////////////////
//This is call on mouse click and by ColorCallBack
/////////////////////////
Colorbar.prototype.Change = function(oldIndex,newIndex,color){
   if ( newIndex < 0 ){
      return;
   }
   if ( oldIndex > -1 ){
      var mid = Math.min(oldIndex,newIndex);
      var Mid = Math.max(oldIndex,newIndex);
      for(var k = mid ; k <= Mid ; ++k){
         this.rainbow.Remove(k);
      }
   }
   
   this.rainbow.Remove(newIndex);
   this.rainbow.Add(color,newIndex);

   //update colorpicker current value !
   //console.log(color.toHex().replace("#",""));
   this.colorPicker.ColorPickerSetColor(color.toHex().replace("#","")); // jquery version
   $("#" + this.colorPickerId + " div").css('backgroundColor', color.toHex());   // update picker view

}

/////////////////////////
//the colorPiker call back ! 
//what to do when user change color params ?
//see above for instatiation of the picker itseft 
//and link with this callback
/////////////////////////
Colorbar.prototype.ColorCallBack = function(color){     // note that "color" here must be a string understandable by RGBColor !!!
   if ( this.lastAdded == 0)
      this.AddFirst(new RGBColor(color));
   else if (this.lastAdded == this.rainbow.DataSize -1 )
      this.AddLast(new RGBColor(color));
   else
      this.Change(this.lastAdded, this.lastAdded, new RGBColor(color));

   this.Render();
}

/////////////////////////
/// private tools
/////////////////////////
Colorbar.prototype.getCursorX = function(canvas, event) {
   var x;
   var canoffset = $(canvas).offset();
   x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - Math.floor(canoffset.left) + 1;
   return x;
}  

Colorbar.prototype.getCursorY = function(canvas, event) {
   var y;
   var canoffset = $(canvas).offset();
   y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - Math.floor(canoffset.top) + 1;
   return y;
}  

/////////////////////////   
/// mouse event callbacks   
/////////////////////////                           
Colorbar.prototype.onMouseDown = function(evt){

   var curX = this.getCursorX(document.getElementById(this.canvasId),evt);
   var curY = this.getCursorY(document.getElementById(this.canvasId),evt);

   var curPos = Math.round((this.height - 1 - curY + this.offsetY ) * ( this.rainbow.DataSize - 1) / ( this.height - 1 ));   ///@todo check offset
   var curPos2 = curPos;

   var id = this.rainbow.GetNextAndPreviousIndex(curPos);
   var nearestLowerIndex = id.previous;
   var nearestUpperIndex = id.next;

   if ( ! this.clicked ){
      if ( Math.abs(nearestLowerIndex-curPos) < this.height/40 ){
         curPos2 = nearestLowerIndex;
         this._color = this.rainbow.Get(nearestLowerIndex,false,false);
         this.clicked = true;
      }
      else{
         if ( Math.abs(nearestUpperIndex-curPos) < this.height/40 ){
            curPos2 = nearestUpperIndex;
            this._color = this.rainbow.Get(nearestUpperIndex,false,false);
            this.clicked = true;
         }
      }      
   }

   if ( ! this.clicked ){
      // test random RGB
      //var randR = Math.floor(Math.random()*256);
      //var randG = Math.floor(Math.random()*256);
      //var randB = Math.floor(Math.random()*256);
      // test random HSV
      //var hslH = Math.random()*6;
      //var hslS = 1;
      //var hslV = 1;
      //this._color = new RGBColor("white");
      //this._color.fromHsv({H:hslH,S:hslS,V:hslV});
      // interpolated value
      this._color = this.rainbow.Interp(nearestLowerIndex,nearestUpperIndex,curPos,this.isHsl);

      if ( ! this._color.ok){   // something went wrong ...
         this._color = new RGBColor("black");
         this._color.setAlpha(0.0);
      }

   }

   this.lastAdded = curPos2;

   this.Change(this.oldPos,curPos2,this._color);
   this.oldPos = curPos2;
   this.Render();
   this.clicked = true;
}

Colorbar.prototype.onMouseUp = function(evt){
   this.clicked = false;  
   this.oldPos = -1;
}

Colorbar.prototype.onMouseDrag = function(evt){
   if ( this.clicked )
      this.onMouseDown(evt);
}        

Colorbar.prototype.Export = function(){
   /*
     for( var k = 0 ; k < this.ExportDataSize ; k++){
        var color =  this.GetColor(k*(rainbow.DataSize-1)/(this.ExportDataSize-1));
        this.colorbar.content[k] = {"r" : color.r , "g" : color.g , "b" : color.b , "a" : color.a};
        console.log(k,this.colorbar.content[k]);
     }
    */
   var keys = this.rainbow.GetKeys();

   for( var i = 0 ; i < keys.length ; ++i){
      var color = this.GetColor(keys[i]);
      this.colorbar.content[keys[i]] = {"r" : color.r , "g" : color.g , "b" : color.b , "a" : color.a};
   }
   
   console.log(this.colorbar.content);
}

Colorbar.prototype.Import = function(){
   this.rainbow.ClearAll();
   var n = Object.size(this.colorbar.content);
   if ( n > this.rainbow.DataSize ){
      console.log("Too much data to import"); 
      return;
   }
   if ( n < 2 ){
      this.rainbow.Clear();
   }
   for(var key in this.colorbar.content){
      this.colorbar.content.hasOwnProperty(key);
      
      var color = new RGBColor("black");
      color.r = this.colorbar.content[key].r;
      color.g = this.colorbar.content[key].g;
      color.b = this.colorbar.content[key].b;  
      
      if ( key == 0 ){
         this.AddFirst(color);
      }
      else if ( key == this.rainbow.DataSize-1 ){
         this.AddLast(color);
      }
      else{
         this.Add(color,key);
      } 
   }
   
   this.Render();
}