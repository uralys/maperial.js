//-----------------------------------------------------------------------------------//

function ImageLayer (sourceId, composition) {
   
   this.id              = Utils.generateUID();
   this.type            = Layer.Images;
   this.sourceId        = sourceId;
   this.composition     = composition;
   
}

//-----------------------------------------------------------------------------------//