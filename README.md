
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

# Technical documentation

Explore the complete API [documentation](http://static.maperial.com/doc)

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
- any [layers] (./documentation.md#layers)
- any [data] (./documentation.md#data)
- any [tools] (./documentation.md#tools)

For example, ask for a new layer :
```
map.addMapquest();
```

##### Well, you got your first map !
Check the full example on this [jsbin] (http://jsbin.com/bixatibufogu/10/embed?js,output)

# I want to know more !
- Start to learn how to play with [Maperial] (./documentation.md)
- Checkout a whole bunch of jsbin [examples] (./demos.md)
- When you're ready, explore the complete API
[documentation](http://static.maperial.com/doc) to draft your own maps.

