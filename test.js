
var jasmine = require('jasmine');
var finishTestcase = require('jasmine-supertest');
var supertest = require('supertest').agent('https://localhost:8198');


describe('jasmine-supertest test suite', function () {
    it('calls done without any params and finishes the test case is fine', function (done) {
        var app = supertest(server);
        app.get('/incorrect-url').expect(404).end(finishTestcase(doneMock));
    });
});