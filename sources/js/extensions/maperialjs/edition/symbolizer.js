
//-------------------------------------------//
//Symbolizer
//-------------------------------------------//

this.Symbolizer = {};

//-------------------------------------------//
//Sym / param list

Symbolizer.params = {
      "PolygonSymbolizer" : [ "fill", "alpha" ],
      "LineSymbolizer" : [ "width", "stroke", "dasharray", "alpha" , "linejoin" , "linecap" ],
      "PolygonPatternSymbolizer" : [ "file" ],
      "PointSymbolizer" : [ "file" , "opacity" ],
};

/*
Symbolizer.params2 = {
    "poly" : [ "fill", "alpha" ,
               "border_width", "border_stroke", "border_dasharray", "border_alpha" , "border_linejoin" , "border_linecap"
    ],
    "line" : [ "width", "stroke", "dasharray", "alpha" , "linejoin" , "linecap", 
               "casing_width", "casing_stroke", "casing_dasharray", "casing_alpha" , "casing_linejoin" , "casing_linecap",
               "center_width", "center_stroke", "center_dasharray", "center_alpha" , "center_linejoin" , "center_linecap"
    ]
};
 */

Symbolizer.combos = {
      "linejoin"  : [ "miter" , "round" , "bevel" ],
      "linecap"   : [ "butt" , "round" , "square" ],
      "width"     : [ "xsmall" , "small" , "standard" , "large" , "xlarge" ],
};

Symbolizer.defaultValues = {
      fill : "rgba(0,0,0,0)",
      stroke : "rgba(0,0,0,0)",
      width : "0",
      alpha : "1.0",
      dasharray : "",
      linejoin : "round",
      linecap : "round",
      /*
   casing_stroke : "rgba(0,0,0,0)",
   casing_width : "0",
   casing_alpha : "1.0",
   casing_dasharray : "",
   casing_linejoin : "round",
   casing_linecap : "round",
   center_stroke : "rgba(0,0,0,0)",
   center_width : "0",
   center_alpha : "1.0",
   center_dasharray : "",
   center_linejoin : "round",
   center_linecap : "round",
   border_stroke : "rgba(0,0,0,0)",
   border_width : "0",
   border_alpha : "1.0",
   border_dasharray : "",
   border_linejoin : "round",
   border_linecap : "round" 
       */  
};

//-------------------------------------------//

Symbolizer.getParamName = function(symb,id){
   return Symbolizer.params[symb][id];
}

