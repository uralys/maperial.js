
# Documentation

You'll find here how to use Maperial to create mapsand layers,
how to manipulate your data and how to add tools to your maps.

To start with your first maps checkout these [examples](./demos.md)

Explore the complete API [documentation](http://static.maperial.com/doc)

# Maperial

**Instanciate** one Maperial to build every maps on your web page.
```
var maperial = new Maperial();
```
##### With your Maperial you can now :
- Draw [Map](#maps)
- Create [DynamicalData](#dynamicaldata)
- Create [HeatmapData](#heatmapdata)
- Attach [Tools](#tools)

# Maps

Each Map is linked with an html container :
```
var map = maperial.createMap({
    container: 'map1'
});
```

Therefore, you will need an html tag for every map in your web page. Here is
the container for the previous map.
```
<div id="map1"></div>
```

# MapViews

Just a word about MapViews before to continue : the map created just above
is a MapView, just the same as a Lens, or an Anchor which are MapViews.

You may play with Layers on any MapView, so on the following chapter all layers
are attached to a **view** rather than a *map*.

Stick with the map for now, called **view** for now on,
and we'll play with the other MapViews later.

# Layers

- You may add any layers to your view, containing either images or data.
- Use Fusion to merge your layers with custom settings and draw unique maps.

## Image Layers

### External layers
- view.addOCMTransport()
- view.addOCMLandscape()
- view.addWatercolor()
- view.addMapquest()
- view.addSatellite()

### Maperial layers
- view.addEarthLight()
- view.addAerosol()
- view.addNDVI()
- view.addSRTM()
- view.addSST()

### Custom Layers
- view.addShade()
- WMS

## Data Layers
Once your Data is created you can attach it to many maps
- view.addDynamicalLayer(data, options);
- view.addHeamapLayer(data, options);

## Fusion

Todo : tell about fusion settings

# Data
## DynamicalData
## HeatmapData


# Tools
You would need this css to use Tools :
```
<link href="http://static.maperial.com/css/maperial.css" rel="stylesheet" type="text/css" />
```
- Zoom
- Fusion settings
- Shade settings
- Anchors
- Lens
- Minifier
- Magnifier

