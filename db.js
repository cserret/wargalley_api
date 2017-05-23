var pg = require('pg')
var fs = require('fs')
var Pool = require('pg').Pool

// get credentials
var paramsString = fs.readFileSync('../../database/config.txt', 'utf-8')
var params = paramsString.split(':')

// apply credentials to config object for the pg.pool object
var config = {
    port: parseInt(params[0]),
    user: params[1],
    password: params[2],
    database: params[3],
    ssl: (params[4].toLowerCase() === 'true'),
    max: parseInt(params[5]),
    min: parseInt(params[6]),
    idleTimeoutMillis: parseInt(params[7])
};

// in case something breaks when trying to connect
process.on('unhandledRejection', function (e) {
    console.log(e.message, e.stack)
})

var pool = new Pool(config)

module.exports =
    async function db(sql, values = null, cb) {
        try {
            var client = await pool.connect()
            try {
                var res = await client.query(sql, values)
                if (res.hasOwnProperty("rows")) {
                    cb(null, res.rows)
                }
                else {
                    cb(null, res)
                }
            } catch (err) {
                cb(err, null)
            }
            client.release()
        } catch (err) {
            cb(err, null)
        }

    }

