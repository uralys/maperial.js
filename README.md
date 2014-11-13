
# What you'll be able to draw
- beautiful tile layer
- shade
- heatmap
- anchor
- minifier
- lens
- fusion params
- shade params
[demo](http://jsbin.com/bixatibufogu/10/embed?js,output)

# Let me play !
- Get [started] (#getting-started) with a first map
- Understand the [Maperial]'s concepts (./documentation.md)
- Checkout a whole bunch of jsbin [examples] (./demos.md)
- And when you're ready, explore the complete API
[reference](http://static.maperial.com/doc) to draft your own maps.

# Getting started
First of all, add the js script on your page
```
<script src="http://static.maperial.com/js/maperial.js" type="text/javascript"></script>
```

Now add your html container
```
<div id="map"></div>
```

Call upon Maperial
```
var maperial = new Maperial();
```

Use it to add a view, linked with your html container
```
var map = maperial.createMap({
    container: 'map'
});
```

Now you can add to your map :
- any [Layer] (./documentation.md#layers)
- any other [MapView] (./documentation.md#mapview)
- any [Data] (./documentation.md#data)
- any [Tool] (./documentation.md#tools)

For example, ask for a new layer :
```
map.addMapquest();
```

##### Well, you got your first map !
Check the full example on this [jsbin] (http://jsbin.com/bixatibufogu/10/embed?js,output)
