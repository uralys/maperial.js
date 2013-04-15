
//==================================================================//

HUD.prototype.updateLatLon = function(){
   var mouseLatLon = this.context.coordS.MetersToLatLon(this.context.mouseM.x, this.context.mouseM.y); 
   try {
      this.element("longitude").empty();
      this.element("latitude").empty();
      this.element("longitude").append(mouseLatLon.x);
      this.element("latitude").append(mouseLatLon.y);
   }
   catch(e){}         
}

//==================================================================//