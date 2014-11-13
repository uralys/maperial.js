
# Main concepts

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
- Draw [MapViews](#mapviews)
- Share [Data](#data)
- Attach [Tools](#tools)

# MapViews

Just a word about MapViews before to continue : the map created just above
is a
just the same as a Lens, or an Anchor which are equally MapViews.

A [MapView](http://static.maperial.com/doc/MapView.html) may be
- a [Map](#map)
- an [Anchor](#anchor)
- a [Lens](#lens)
- a [Magnifier](#magnifier)
- a [Minifier](#minifier)

### Map

A Map is the 'mother' of all other MapView.

Use your *maperial* to create maps, then you'll use each map to create the other
attached MapViews.

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

##### [API reference] (http://static.maperial.com/doc/Maperial.html#createMap)

### Anchor
An Anchor the exact same thing as a [Map](#map), but you don't attach it
to a container but place it inside a Map instead.

#####[API reference](http://static.maperial.com/doc/MapView.html#createAnchor)

### Lens
#####[API reference](http://static.maperial.com/doc/MapView.html#createLens)

### Magnifier
#####[API reference](http://static.maperial.com/doc/MapView.html#createMagnifier)

### Minifier
#####[API reference](http://static.maperial.com/doc/MapView.html#createMinifier)

# Layers

- You may add any layers to a [MapView](#mapviews), containing either
[Images](#image-layers)
or [Data](#data-layers).
- Use [Fusion](#fusion) to merge your layers with custom settings
and draw unique maps.

## Image Layers
- todo : thumbnails + links to /doc

#### External layers
- view.addOCMTransport()
- view.addOCMLandscape()
- view.addWatercolor()
- view.addMapquest()
- view.addSatellite()

#### Maperial layers
- view.addEarthLight()
- view.addAerosol()
- view.addNDVI()
- view.addSRTM()
- view.addSST()

#### WMS Layers
- todo : few examples

#### Custom Layers
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
A Data may be shared by many [data layers](#data-layers).

#### Sharable
For instance, you may create one DynamicalData,
and apply it on two different layers on two different maps.

Then, adding one point on this DynamicalData would add the point on the two
layers.

#### GeoJson
Use <a href="http://geojson.org">GeoJson</a> to represent your Data.

Check the different types of data below to set your
Feature Collections accordingly.

#### Types
- [DynamicalData](http://static.maperial.com/doc/DynamicalData.html)
allows to add/remove points with custom properties.
- [HeatmapData](http://static.maperial.com/doc/HeatmapData.html)
allows to draw heatmaps with custom colorbars.

# Tools

#### Simple Zoom
You can add +/- buttons in a container, and attach this tool
to a set of MapViews
```
maperial.addSimpleZoom([views])
```

##### more
- [API reference] (http://static.maperial.com/doc/Maperial.html#addSimpleZoom)
- Require a [theme](#theme) on your page

#### Slider Zoom
todo : (1-18 slider and +/- buttons)
  maperial.addSliderZoom([views])

#### Fusion settings
todo

#### Shade settings
todo

#### Theme
Most of the tools require a default theme, provided by this css :
```
<link href="http://static.maperial.com/css/maperial.css" rel="stylesheet" type="text/css" />
```