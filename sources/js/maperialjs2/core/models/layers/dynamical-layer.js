//-----------------------------------------------------------------------------------//

function DynamicalLayer (params) {
   this.id                 = Utils.generateUID();
   this.type               = Layer.Dynamical;
   this.mapView            = params.mapView;
   this.dynamicalData      = params.dynamicalData;
   
   this.styleUID           = styleManager.createCustomStyle(params.style);
   
   this.dynamicalRenderer  = dataManager.addDynamicalRenderer(this.mapView, this.dynamicalData, this.styleUID);
}

//-----------------------------------------------------------------------------------//