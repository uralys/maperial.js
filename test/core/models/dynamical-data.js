var DynamicalData = require('../../../src/js/core/models/data/dynamical-data');

var assert = require('assert');
describe('DynamicalData', function() {
  describe('addPoint', function() {
    it('should increment data.points', function() {
      var data = new DynamicalData();
      assert.equal(0, data.points.length);

      data.addPoint({
        'type': 'Feature',
        'properties': {
            'Name': 'AIX-MARSEILLE',
            'Description': 'desc',
            'type': 1,
            'diameter': 40,
            'scale': 0.54
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [
                5.776548,
                43.825454
            ]
        }
      });

      assert.equal(1, data.points.length);
    });
  });
});
