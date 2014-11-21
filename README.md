
# Maperial : a new way to create maps

Maperial is a free javascript API to create maps for your web
applications.

For now we stick on enhancing this API and hope to see a community
gathering around, which would mean we are on the right path to provide a new
map tool.

Enjoy drafting and sharing your maps, and don't forget
to let us know your feedback !

# Let me play !
- Get [started] (#getting-started) with a first map
- Understand [Maperial](./concepts.md)'s concepts
- Check out a whole bunch of Codepen [examples] (http://codepen.io/chrisdugne/)
- Explore the complete API [reference](http://static.maperial.com/doc)
to draft your own maps.

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
- any [Layer] (./concepts.md#layers)
- any other [MapView] (./concepts.md#mapview)
- any [Data] (./concepts.md#data)
- any [Tool] (./concepts.md#tools)

For example, ask for a new layer :
```
map.addMapquest();
```

##### Well, you got your first map !
Check the full example on this
[codepen] (http://codepen.io/chrisdugne/pen/yyyYVr?editors=101)
