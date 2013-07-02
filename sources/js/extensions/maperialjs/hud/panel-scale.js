

HUD.ZOOM_METERS = { 
    "1" : "15500000",
    "2" : "4000000",
    "3" : "2000000",
    "4" : "1000000",
    "5" : "500000",
    "6" : "250000",
    "7" : "125000",
    "8" : "60000",
    "9" : "30000",
    "10" : "15000",
    "11" : "8000",
    "12" : "4000",
    "13" : "2000",
    "14" : "1000",
    "15" : "500",
    "16" : "250",
    "17" : "100",
    "18" : "50"
};

HUD.prototype.updateScale = function(){

   var pointM = new Point(this.mapView.context.centerM.x + parseInt(HUD.ZOOM_METERS[this.mapView.context.zoom]) , this.mapView.context.centerM.y ); 
   var centerP = this.mapView.context.coordS.MetersToPixelsAccurate(this.mapView.context.centerM.x, this.mapView.context.centerM.y, this.mapView.context.zoom); 
   var pointP = this.mapView.context.coordS.MetersToPixelsAccurate(pointM.x, pointM.y, this.mapView.context.zoom); 

   var nbPixelsForMeters = pointP.x - centerP.x;
   var nbPixelsForMiles = nbPixelsForMeters * 0.62137;

   // ft = m * 3.2808
   // mi = km * 0.62137
   // For miles, divide km by 1.609344
   
   var meters = HUD.ZOOM_METERS[this.mapView.context.zoom];
   var miles = HUD.ZOOM_METERS[this.mapView.context.zoom] * 0.00062137;
   
   try {
      this.element("metersContainer").empty();
      this.element("milesContainer").empty();
      
      this.element("metersContainer").append(meters + "m");  
      this.element("milesContainer").append(miles + "mi");  

      this.element("metersContainer").width(nbPixelsForMeters+"px");  
      this.element("milesContainer").width(nbPixelsForMiles+"px");  
   }
   catch(e){}
   
}
