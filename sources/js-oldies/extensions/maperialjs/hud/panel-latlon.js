
//==================================================================//

HUD.prototype.updateLatLon = function(){
   var mouseLatLon = this.mapView.context.coordS.MetersToLatLon(this.mapView.context.mouseM.x, this.mapView.context.mouseM.y); 
   try {
      this.element("longitude").empty();
      this.element("latitude").empty();
      this.element("longitude").append(mouseLatLon.x);
      this.element("latitude").append(mouseLatLon.y);
   }
   catch(e){}         
}

//==================================================================//