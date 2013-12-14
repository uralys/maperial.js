//------------------------------------------------------------------//

function MaperialAPI(){}

//------------------------------------------------------------------//

MaperialAPI.prototype.createMaperial = function (options) { 
   return new Maperial (options) 
}

//------------------------------------------------------------------//

/**
 * 
 * 
 */
MaperialAPI.prototype.createDynamicalData = function () {
   return new DynamicalData()
}

//------------------------------------------------------------------//

/**
 * 
 * 
 */
MaperialAPI.prototype.createHeatmapData = function () {
   return new HeatmapData()
}

//------------------------------------------------------------------//

/**
 * 
 * 
 */
MaperialAPI.prototype.createStyle = function (options) {
   return new VectorialStyle(options)
}

//------------------------------------------------------------------//

/**
 * 
 * 
 */
MaperialAPI.prototype.createColorbar = function () {
   return new Colorbar()
}



//------------------------------------------------------------------//

window.maperialAPI = new MaperialAPI()
