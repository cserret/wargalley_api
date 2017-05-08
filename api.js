var restify = require('restify')
var fs = require('fs')
var jwt = require('jsonwebtoken')
var db = require('./db');

var Manifest = require('./Manifest')
var manifest = new Manifest();
var User = require('./User')
var user = new User();

// sign with RSA SHA256
var cert = fs.readFileSync('/etc/letsencrypt/live/wargalley.com/privkey.pem');  // get private key

// sign asynchronously
var token = jwt.sign(
    { foo: 'bar' },
    cert,
    { algorithm: 'RS256', expiresIn: '1h' },
    function (err, token) {
        // console.log(token);
    }
);

var https_options = {
    key: fs.readFileSync('/etc/letsencrypt/live/wargalley.com/privkey.pem'),
    certificate: fs.readFileSync('/etc/letsencrypt/live/wargalley.com/fullchain.pem')
}
restify.pre.sanitizePath()

// doesn't work
//restify.defaultResponseHeaders = function(data) {
//	  this.header('Server', 'helloworld');
//};

var server = restify.createServer({
    certificate: https_options.certificate,
    key: https_options.key,
    name: 'app'
})

server.use(restify.fullResponse()) // this command for some reason, enables cors (allows connections from outside, cross-domain stuff)
server.use(restify.bodyParser()); // req.params
server.use(restify.queryParser()); // req.query
server.use(function (req, res, next) {
    res.setHeader('content-type', 'application/json')
    res.setHeader('Server', 'wargalley api')
    next()
})

var setup_server = function (app) {
    function respond(req, res, next) {
        res.send('I see you ' + req.params.name);
    }

    // Routes
    app.get('/manifest/:name', respond) // curl -is https://wargalley.com:8198/test/sam

    app.get('/manifest', (req, res, next) => {
        manifest.get(null, (err, result) => {
            if (err !== null) {
                res.send(400, { status: "fail", params: req.params, error: err });
            }
            else {
                res.send(200, { status: "ok", info: "no parameter", params: req.params, result: result });
            }
            next();
        });
    });

    app.get('/user', (req, res, next) => {
        user.get(null, (err, result) => {
            if (err !== null) {
                res.send(400, { status: "fail", params: req.params, error: err });
            }
            else {
                res.send(200, { status: "ok", info: "no parameter", params: req.params, result: result });
            }
            next();
        });
    });

    // app.get('/manifest/:id', (req, res, next) => {
    //     res.send(200, { "status": "ok", info: "has parameters", params: req.params });
    //     next();
    // });

    //  app.get('/manifest', function

    app.post('/user', function create(req, res, next) {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        ip = ip.split(":");
        ip = ip[ip.length - 1];
        user.create({ timezone: req.params.timezone, ip: ip, email: req.params.email, password: req.params.password }, function (err, result) {
            if (err !== null) {
                res.send(500, { "error": err });
            }
            else {
                res.send(201, { "id": result[0].id })
            }
            return next();
        });
    })

    app.put('/user', function create(req, res, next) {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        ip = ip.split(":");
        ip = ip[ip.length - 1];
        console.log("calling user.authenticate");
        user.authenticate({ timezone: req.params.timezone, ip: ip, email: req.params.email, password: req.params.password }, function (err, result) {
            if (err !== null) {
                res.send(401, { status: "fail", "error": err });
            }
            else {
                console.log("api put user got result ", result)
                if (result.status === "fail") {
                    res.send(401, result)
                }
                else {
                    res.send(200, result)
                }
            }
            return next();
        });
    })

}

setup_server(server);

server.listen(8198, function () {
    console.log('%s listening at %s', server.name, server.url)
    // Manifest.get()
})

module.exports = server;


