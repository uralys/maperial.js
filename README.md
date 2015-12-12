# Maperial.js [![Analytics](https://ga-beacon.appspot.com/UA-40162385-2/maperial.js/readme?pixel)](https://github.com/maperial/maperial.js)

[ ![Codeship Status](https://img.shields.io/codeship/6fc738c0-e418-0132-19f9-16773c71d38d/master.svg)](https://codeship.com/projects/81785)
<!-- [![Coverage Status](https://coveralls.io/repos/maperial/maperial.js/badge.svg)](https://coveralls.io/r/maperial/maperial.js) -->

## A new way to create maps

Maperial is a free javascript API to create *dynamical* WebGL maps.

Configure your own set of layers and parameters to share, visualize and understand your data.

Check some [examples](http://codepen.io/chrisdugne/) on Codepen.

## Features

- Layer fusion
- Dynamical data
- Heatmaps
- GeoJSON
- WMS
- Animated Shaded Relief
- Use any external Basemap

## Getting started

#### HTML
First of all, add the js script on your page
```html
<script src="http://static.maperial.com/js/maperial-0.1.4.min.js" type="text/javascript"></script>
```

And add your html container
```html
<div id="map"></div>
```

#### JS
Call upon Maperial
```js
var maperial = new Maperial();
```

Use it to add a view, linked with your html container
```js
var map = maperial.createMap({
    container: 'map'
});
```

Add a layer :
```js
map.addMapquest();
```

## Main concepts

Instanciate and use **one** single Maperial to build every map on your web page.
```js
var maperial = new Maperial();
```

With your `maperial` you can now :

- Draw [MapViews](#mapviews) with [Layers](#layers)
- Share [Data](#data)
- Attach [Tools](#tools)



### MapViews

A MapView can be either :

- a [Map](#map)
- an [Anchor](#anchor)
- a [Lens](#lens)
- a [Minifier](#minifier)

If you don't specify layers on a child MapView, it will use the same ones as
the parent MapView.


#### Map

A Map is the parent of all other types of MapView.

Each Map is linked with an html container :
```js
var map = maperial.createMap({
    container: 'map1'
});
```

Therefore, you will need an html tag for every `map` in your web page. Here is the container for the previous `map`.

```html
<div id="map1"></div>
```

#### Anchor
An Anchor is the exact same thing as a [Map](#map), but instead of attaching it to an html container, you place it inside a [MapView](#mapviews).

```js
var anchor = map.addAnchor(options);
```
See the example on [Codepen](http://codepen.io/chrisdugne/pen/myemdv/)


#### Lens
A Lens allows to highlight an area using a greater zoom.

```js
var lens = map.addLens(options);
```

Use options to set it fixed or draggable, customize the size, position etc...

See the example on [Codepen](http://codepen.io/chrisdugne/pen/EaVoVV/)


#### Minifier
A Minifier is a view to zoom out your map, with the same center.
It allows to understand where is situated the area using a lower zoom.

```js
var minifier = map.addMinifier(options);
```

Use options to set it fixed or draggable, its size, position etc...

See the example on [Codepen](http://codepen.io/chrisdugne/pen/pvjpgB/)


### Layers

- You may add and remove any layers to any [MapView](#mapviews).
- Each Layer may contain either [Images](#image-layers) or [Data](#data-layers).
- Use [Fusion](#fusion) to merge your layers with custom settings
and draw unique maps.


#### Image Layers

Maperial provide our own unhackneyed tiles but you may use an evergrowing collection of external tiles.

- [Maperial Tiles](http://www.maperial.com/concepts/#maperial-tiles)
- Tiles from [Open Street Map](http://www.maperial.com/concepts/#open-street-map)
- Tiles from [Thunderforest](http://www.maperial.com/concepts/#thunderforest)
- Tiles from [Stamen](http://www.maperial.com/concepts/#stamen)
- Tiles from [Mapquest](http://www.maperial.com/concepts/#mapquest)
- Tiles from numerous [WMS](http://www.maperial.com/concepts/#wms)


#### Data Layers
Before to add data layers, you need to create a Data type first.

##### Types of Data
- [DynamicalData](http://www.maperial.com//documentation/DynamicalData.html) allows to add/remove points with custom properties.
- [HeatmapData](http://www.maperial.com/documentation/HeatmapData.html) allows to draw heatmaps with custom colorbars.
  ([Codepen example](http://codepen.io/chrisdugne/pen/Wbbggr?editors=101))

```js
var url = 'http://static.maperial.com/geojson/heatmap.geojson.json';
var data = maperial.createHeatmapData(url);
```

##### Attach your Data
Then you can attach it to any [MapView](#mapviews) by adding a layer
depending on the data type :
```js
view.addDynamicalLayer(data, options);
view.addHeamapLayer(data, options);
```

## More !
- Understand all other [Maperial](http://maperial.github.io/concepts/)'s concepts
- Explore the complete API [reference](http://maperial.github.io/documentation/) to draft your own maps.

## BSD License
You may use Maperial.js in a free or commercial project, providing you follow the [BSD](http://www.linfo.org/bsdlicense.html) crediting requirements, provided in the project [LICENSE](https://github.com/maperial/maperial.js/blob/master/LICENSE)

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/maperial/maperial.js/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

