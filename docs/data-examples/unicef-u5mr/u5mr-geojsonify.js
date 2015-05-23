var countries = require('./u5mr-median');
var source = countries[0];
var animation = [];

var diameterRatio = 5000;
var scaleRatio = 300;

var createFeatureCollection = function(year){
  var collection = {
    "type": "FeatureCollection",
    "properties": {
      "year": year
    },
    "features": []
  };

  countries.forEach(function(country){
    collection.features.push({
      "geometry": {
        "type": "Point",
        "coordinates": [
          country.lon,
          country.lat
        ]
      },
      "type": "Feature",
      "properties": {
          "diameter": country[year] * diameterRatio,
          "scale": country[year]/scaleRatio,
          "iso": country.iso,
          "name": country.name
      }
    });
  });

  return collection;
};

for (var key in source) {
  if(!isNaN(parseInt(key[0]))){
    var year = key;
    animation.push(createFeatureCollection(year));
  }
}

console.log(JSON.stringify(animation));

