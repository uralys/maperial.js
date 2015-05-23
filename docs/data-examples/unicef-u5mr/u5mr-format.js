var json = require('./U5MR_mortality_rate_39_39');
var countries = require('./countries.json');

var plugLatLon = function(data){
  countries.data.forEach(function(country){
    if(country[10] === data.iso){
      data["lat"] = country[12];
      data["lon"] = country[13];
      return;
    }
  });

  if(!data.lat){
    console.log(data.iso + ' --> no lat/lon');
    // throw(new Error('lat/lon not found for' + data.iso));
  }
};

var filtered = json.filter(function(data){
  if(data['uncertainty'] === 'Median'){
    plugLatLon(data);
    return data;
  }
});

console.log(JSON.stringify(filtered));
