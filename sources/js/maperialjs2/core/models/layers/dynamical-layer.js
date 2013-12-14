//-----------------------------------------------------------------------------------//

function DynamicalLayer (params) {
   
   this.id              = Utils.generateUID();
   this.type            = Layer.Dynamical;
   this.dynamicalData   = params.dynamicalData;
   this.style           = params.style;
   
}

//-----------------------------------------------------------------------------------//