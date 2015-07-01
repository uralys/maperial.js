'use strict';
var chai = require('chai')
var DynamicalData = require('../../../../src/js/core/models/data/dynamical-data');

var expect = chai.expect;

describe('DynamicalData', function() {
    describe('addPoint', function() {
        it('should increment data.points', function() {
            var data = new DynamicalData();
            expect(data.points.length).to.equal(0);

            data.addPoint({
                type: 'Feature',
                properties: {
                    Name: 'AIX-MARSEILLE',
                    Description: 'desc',
                    type: 1,
                    diameter: 40,
                    scale: 0.54
                },
                geometry: {
                    type: 'Point',
                    coordinates: [
                    5.776548,
                    43.825454
                    ]
                }
            });

            expect(data.points.length).to.equal(1);
        });
    });

    describe('removePoint', function() {
        it('should decrement data.points', function() {
            var data = new DynamicalData();
            expect(data.points.length).to.equal(0);

            var point = data.addPoint({
                type: 'Feature',
                properties: {
                    Name: 'AIX-MARSEILLE',
                    Description: 'desc',
                    type: 1,
                    diameter: 40,
                    scale: 0.54
                },
                geometry: {
                    type: 'Point',
                    coordinates: [
                    5.776548,
                    43.825454
                    ]
                }
            });

            expect(data.points.length).to.equal(1);
            data.removePoint(point);
            expect(data.points.length).to.equal(0);
        });
    });
});
