
# Maperial
Instanciate one Maperial to build every maps on your web page.
```
var maperial = new Maperial();
```
With your Maperial you can now draw Maps and share Data between them.

 - maperial.createMap
  returns a [Map](/#Maps)
 - maperial.createDynamicalData
 - maperial.createHeatmapData

# Maps

Each Map is linked with an html container :
```
var map = maperial.createMap({
    container: 'map1'
});
```

Therefore, you will need an html tag for every map in your web page. Here is
the container for the previous MapView.
```
<div id="map1"></div>
```

## Tile Layers

### External layers
- map.addOCMTransport()
- map.addOCMLandscape()
- map.addWatercolor()
- map.addMapquest()
- map.addSatellite()

### Maperial layers
- map.addShade()
- map.addEarthLight()
- map.addAerosol()
- map.addNDVI()
- map.addSRTM()
- map.addSST()

## Data Layers
Once your Data is created you can attach it to many maps
- map.addDynamicalLayer(data, options);
- map.addHeamapLayer(data, options);

### Tools
You would need this css to use Tools :
```
<link href="http://static.maperial.com/css/maperial.css" rel="stylesheet" type="text/css" />
```
- map.addSimpleZoom()
- map.addMagnifier(magnifier)


# Data
## DynamicalData
## HeatmapData
