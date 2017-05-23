
var db = require('./db');
var Jwt = require('./Jwt')
var jwt = new Jwt()

function Manifest(opt) {
    this.manifest = {};
    if (opt) {
        this.manifest = opt;
    }

    this.get = function (data, callback) {
        let access_token = data.access_token;
        let decoded = jwt.verifyToken(access_token, (error, result) => {
            let email = result.email;
            var sql = "SELECT * FROM manifest WHERE email = $1";
            db(sql, [email], function (error, result) {
                return callback(error, result);
            });
        })
    }

    this.save = function (data, callback) {
        var sql = "INSERT INTO manifest (data) VALUES ('" + JSON.stringify(this.manifest) + "')";
        db(sql, function (error, result) {
            return callback(error, result);
        });
    };
}

module.exports = Manifest;