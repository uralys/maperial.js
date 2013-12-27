//-----------------------------------------------------------------------------------//

function DynamicalLayer (params, composition) {
   this.id                 = Utils.generateUID();
   this.type               = Layer.Dynamical;
   this.mapView            = params.mapView;
   this.dynamicalData      = params.dynamicalData;
   
   this.style              = styleManager.createCustomStyle(params.style);
   this.composition        = composition;
   
   this.dynamicalRenderer  = dataManager.addDynamicalRenderer(this.mapView, this.dynamicalData, this.style);
}

//-----------------------------------------------------------------------------------//