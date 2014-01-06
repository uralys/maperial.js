//-----------------------------------------------------------------------------------//

function DynamicalLayer (params, composition) {
   this.id                 = Utils.generateUID();
   this.type               = Layer.Dynamical;
   this.mapView            = params.mapView;
   this.dynamicalData      = params.dynamicalData;

   this.style              = styleManager.createCustomStyle(params.style);
   this.composition        = composition;

   this.renderer           = this.mapView.mapRenderer.addDynamicalRenderer(this.dynamicalData, this.style);
}

//-----------------------------------------------------------------------------------//