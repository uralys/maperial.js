
# Start playing with Maperial

You'll find here how to use Maperial to create maps and layers,
how to manipulate your data and how to add tools to your maps.

You may want to check some [examples](./demos.md) before anything.

Once you're ready to go further, explore the complete
API [documentation](http://static.maperial.com/doc).

Ok let's go !

# Maperial

Instanciate and use **one** single Maperial to build every map on your web page.
```
var maperial = new Maperial();
```
##### With your maperial you can now :
- Draw [Maps](#maps)
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
is a [MapView](http://static.maperial.com/doc/MapView.html),
just the same as a Lens, or an Anchor which are equally MapViews.

You may play with Layers on any MapView, so on the following chapter all layers
are attached to a **view** rather than a *map*.

Stick with this map for now, called **view** for now on,
and we'll play with the other MapViews later.

# Layers

- You may add any layers to a MapView, containing either [images](#image-layers)
or [data](#data).
- Use [Fusion](#fusion) to merge your layers with custom settings
and draw unique maps.

## Image Layers
- todo : thumbnails + links to /doc

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

### WMS Layers
- todo : few examples

### Custom Layers
- view.addShade()
- view.addSRTM()
- todo : maperialOSM

## Data Layers
Before to add data layers, you need to create your [Data](#data) first.

Then you can attach it to any [MapView](#mapviews) by adding a layer
depending on the data type :
- view.addDynamicalLayer(data, options);
- view.addHeamapLayer(data, options);

## Fusion
Use custom settings to fuse 2 layers
- AlphaBlend (param float [0,1])
- AlphaClip  (param float [0,1])
- XBlend

# Data
A Data may be shared by many layers. For instance, you may create
one DynamicalData, and apply it on two different layers on two different maps.

Then, adding one point on this DynamicalData would add the point on the two
layers.

There are 2 kinds of Data
- DynamicalData
- HeatmapData

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

