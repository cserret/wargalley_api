var request = require("request");
var base_url = "https://wargalley.com:8198/"

describe("Hello World Test", function(){
    describe("GET /", function() {
	it("returns status code 200", function(done) {
            request.get(base_url + "manifest", function(error, response, body) {
               expect(response.statusCode).toBe(200);
               done();
	    });
        });
    });
});
