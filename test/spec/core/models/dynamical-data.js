'use strict';
var chai = require('chai');
var expect = chai.expect;
var DynamicalData = require('../../../../src/js/core/models/data/dynamical-data');

var dummyPoint = {
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
};

describe('DynamicalData', function() {
    describe('addPoint', function() {
        it('should increment data.points', function() {
            var data = new DynamicalData();
            expect(data.points.length).to.equal(0);
            data.addPoint(dummyPoint);
            expect(data.points.length).to.equal(1);
        });
    });

    describe('removePoint', function() {
        it('should decrement data.points', function() {
            var data = new DynamicalData();
            var point = data.addPoint(dummyPoint);
            data.removePoint(point);
            expect(data.points.length).to.equal(0);
        });
    });

    describe('removeAll', function() {
        it('should reset data.points', function() {
            var data = new DynamicalData();
            data.addPoint(dummyPoint);
            data.addPoint(dummyPoint);
            data.addPoint(dummyPoint);
            data.addPoint(dummyPoint);
            data.addPoint(dummyPoint);

            expect(data.points.length).to.equal(5);
            data.removeAll();
            expect(data.points.length).to.equal(0);
        });
    });
});
