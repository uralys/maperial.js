
# Main concepts

You'll find here how to use Maperial to create maps and layers,
how to manipulate your data and how to add tools to your maps.

You may want to check some [examples](./examples.md) before anything.

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

There are 5 types of [MapView](http://static.maperial.com/doc/MapView.html) :
- a [Map](#map)
- an [Anchor](#anchor)
- a [Lens](#lens)
- a [Magnifier](#magnifier)
- a [Minifier](#minifier)

If you don't specify layers on a child MapView, it will use the same ones as
the parent MapView.

### Map

A Map is the parent of all other types of MapView.

Use your *maperial* to create maps, then you will be able to attach every other
type of MapView to a Map.

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

Read [more] (http://static.maperial.com/doc/Maperial.html#createMap)...

### Anchor
An Anchor is the exact same thing as a [Map](#map), but instead of attaching it
to a html container, you place it inside a Map.

```
var anchor = map.addAnchor(options);
```

You can add layers to your Anchor exactly as you would do with any MapView.
Read [more](http://static.maperial.com/doc/MapView.html#addAnchor)...

### Lens
A Lens is a view to zoom in your map, centered on where the Lens is placed.
A Lens allows to highlight a part of map using a different zoom.

```
var lens = map.addLens(options);
```

Use options to set it fixed or draggable, its size, position etc...

Read [more](http://static.maperial.com/doc/MapView.html#addLens)...

### Magnifier
A Magnifier is a view to zoom in your map, with the same center.

```
var magnifier = map.addMagnifier(options);
```

Use options to set it fixed or draggable, its size, position etc...

Read [more](http://static.maperial.com/doc/MapView.html#addMagnifier)...

### Minifier
A Minifier is a view to zoom out your map, with the same center.

```
var minifier = map.addMinifier(options);
```

Use options to set it fixed or draggable, its size, position etc...
Read [more](http://static.maperial.com/doc/MapView.html#addMinifier)...

# Layers

- You may add and remove any layers to any [MapView](#mapviews).
- Each Layer may contain either [Images](#image-layers) or [Data](#data-layers).
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
- view.addShade()
- view.addEarthLight()
- view.addAerosol()
- view.addNDVI()
- view.addSRTM()
- view.addSST()
- todo : maperialOSM

#### WMS Layers
- todo : few examples

## Data Layers
Before to add data layers, you need to create your [Data](#data) first.

Then you can attach it to any [MapView](#mapviews) by adding a layer
depending on the data type :
- view.addDynamicalLayer(data, options);
- view.addHeamapLayer(data, options);

## Fusion
Use custom settings to fuse 2 layers
@todo settings panel + doc
- AlphaBlend (param float [0,1])
- AlphaClip  (param float [0,1])
- XBlend

You can allow users to change your settings manually by including the
Fusion Settings [tool](#fusion-settings)

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
maperial.addSimpleZoom(options)
```

##### more
- Read [more] (http://static.maperial.com/doc/Maperial.html#addSimpleZoom)
- Require a [theme](#theme) on your page

#### Slider Zoom
@todo : (1-18 slider and +/- buttons)
  maperial.addSliderZoom([views])

#### Fusion settings
@todo

#### Shade settings
@todo

#### Theme
Most of the tools require a default theme, provided by this css :
```
<link href="http://static.maperial.com/css/maperial.css" rel="stylesheet" type="text/css" />
```