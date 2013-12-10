//-----------------------------------------------------------------------------------//

function Colorbar (options) {
   
   this.id                 = Utils.generateUID();
   
   this.data               = options.data;
   this.beginAlphaAtZero   = options.beginAlphaAtZero || false;
   
}

//-----------------------------------------------------------------------------------//