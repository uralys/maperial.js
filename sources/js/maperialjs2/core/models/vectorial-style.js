//-----------------------------------------------------------------------------------//

function VectorialStyle (options) {
   
   this.id                 = Utils.generateUID();
   
   this.symbol             = options.symbol;
   this.horizontalAlign    = options.horizontalAlign  || "center";
   this.verticalAlign      = options.verticalAlign    || "bottom";
   
}

//-----------------------------------------------------------------------------------//