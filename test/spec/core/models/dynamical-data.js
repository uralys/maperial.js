'use strict';
var chai          = require('chai');
var sinon         = require('sinon');
var expect        = chai.expect;
var DynamicalData = require('../../../../src/js/core/models/data/dynamical-data');

var dummyCollection = require('../../../dummy-content/zepfrance.json');
var dummyPoint      = require('../../../dummy-content/point.json');

before(function() {
    this.server = sinon.fakeServer.create();
});

after(function() {
    this.server.restore();
});

describe('DynamicalData', function() {
    describe('addPoint', function() {
        it('should increment data.points', function() {
            var data = new DynamicalData();
            expect(data.points.length).to.equal(0);
            data.addPoint(dummyPoint);
            expect(data.points.length).to.equal(1);
        });
    });

    // describe('import URL', function() {
    //     it('should import a collection', function() {
    //         this.server.respondWith("GET", "/dummy-collection.json",
    //         [200, {"Content-Type": "application/json"}, JSON.stringify(dummyCollection)]);

    //         var data = new DynamicalData();
    //         console.log(JSON.stringify(dummyCollection));

    //         sinon.spy();
    //         data.import('/dummy-collection.json');
    //         this.server.respond();

    //         expect(data.points.length).to.equal(4);
    //     });
    // });

    describe('import collection', function() {
        it('should import a collection', function() {
            var data = new DynamicalData();
            data.import(dummyCollection);
            expect(data.points.length).to.equal(4);
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
