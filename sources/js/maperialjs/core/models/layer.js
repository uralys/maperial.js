//-----------------------------------------------------------------------------------//

function Layer(){}

//------------------------------------------------------------------//
//Layer Types

Layer.Dynamical   = 1;
Layer.Heat        = 2;
Layer.Vectorial   = 3;
Layer.Raster      = 4;
Layer.Images      = 5;
Layer.Shade       = 6; // fuse with ReTiler
//Layer.WMS         = 7;
//Layer.ReTiler   = 8;

//------------------------------------------------------------------//

module.exports = Layer;
