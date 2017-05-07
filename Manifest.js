
var db = require('./db');
function Manifest(opt) {
    this.manifest = {};
    if (opt) {
        this.manifest = opt;
    }

    this.get = function (data, callback) {

        var sql = "SELECT * FROM manifest";
        db(sql, null, function (error, result) {
            return callback(error, result);
        });
    }

    this.save = function (data, callback) {
        var sql = "INSERT INTO manifest (data) VALUES ('" + JSON.stringify(this.manifest) + "')";
        db(sql, function (error, result) {
            return callback(error, result);
        });
    };
}

module.exports = Manifest;