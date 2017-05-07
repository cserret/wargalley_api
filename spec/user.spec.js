var request = require("request");
var base_url = "https://wargalley.com:8198/"

describe("user", function () {
    describe("GET /", function () {
        it("returns status code 200", function (done) {
            request.get(base_url + "user", function (error, response, body) {
                expect(response.statusCode).toBe(200);
                done();
            });
        });
    });
});