//-----------------------------------------------------------------------------------//

function DynamicalLayer (params) {
   this.id                 = Utils.generateUID();
   this.type               = Layer.Dynamical;
   this.mapView            = params.mapView;
   this.dynamicalData      = params.dynamicalData;
   this.style              = params.style;
   
   this.dynamicalRenderer  = dataManager.addDynamicalRenderer(this.mapView, this.dynamicalData)
}

//-----------------------------------------------------------------------------------//