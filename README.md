
# What you'll be able to draw
- beautiful tile layer
- heatmap
- anchor
- magnifier
- fusion params
[demo](http://jsbin.com/bixatibufogu/10/embed?js,output)

# Getting started
First of all, add the js + css scripts on your page :

    <link href="http://static.maperial.com/css/maperial.css" rel="stylesheet" type="text/css" />
    <script src="http://static.maperial.com/js/maperial.js" type="text/javascript"></script>

### Your first map
Add your html container

```
<div id="map" class="fullscreen-map"></div>
```

Call upon Maperial

```
var maperial = new Maperial();
```

Use it to add a view : this is your map !
remember to provide your container id
```
var map = maperial.createView({
    container: 'map'
});
```

Ask for a new layer on your map from the available [layers] (./documentation.md#layers)
```
map.addMapquest();
```


[demo](http://jsbin.com/bixatibufogu/10/embed?js,output)

### Adding a layer
- simple classic tile layer
- shade
[demo](http://jsbin.com/bixatibufogu/10/embed?js,output)

### Adding points
- simple classic tile layer
- dynamicalData + 3 geojson points
[demo](http://jsbin.com/bixatibufogu/10/embed?js,output)

### Heatmap
- simple classic tile layer
- heatmapData + heatmap geojson url
[demo](http://jsbin.com/bixatibufogu/10/embed?js,output)

## More [demos] (./demos.md)
## [Documentation] (./documentation.md)

