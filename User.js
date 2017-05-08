const bcrypt = require('bcrypt')
var Jwt = require('./Jwt')
var jwt = new Jwt()
var db = require('./db')
var isoDateNow = require('./isoDateNow')
function User(opt) {
    this.user = {}
    if (opt) {
        this.user = opt
    }

    this.get = function (data, callback) {
        var sql = "SELECT * FROM public.user"; // public schema needed since there is a postgres user db.
        db(sql, null, function (error, result) {
            return callback(error, result)
        });
    }

    this.create = function (data, callback) {
        var sql = "INSERT INTO public.user (data, password, email, last_login_date, created_on, updated_on) VALUES " +
            " ($1, $2, $3, $4, $4, $4) RETURNING id"

        bcrypt.hash(data.password, 10, function (err, encryptedPassword) {
            var values = [{ timezone: data.timezone, ip_address: data.ip }, encryptedPassword, data.email, isoDateNow()]
            db(sql, values, function (error, result) {
                return callback(error, result)
            });
        })
    };

    this.authenticate = function (data, callback) {
        console.log("User authenticate got data ", data);
        let sql = "SELECT id, password FROM public.user WHERE email = $1";
        let values = [data.email];
        db(sql, values, function (error, result) {
            if (error !== null) {
                callback(error, null)
            }
            else {
                console.log('got password result ', result)
                let id = result[0].id
                let encryptedPassword = result[0].password;
                console.log('got saved password: ', encryptedPassword);
                bcrypt.compare(data.password, encryptedPassword, function (err, result) {
                    if (result === false) {
                        callback(null, { status: "fail", message: "invalid login" })
                    }
                    else {
                        console.log('success, updating last_login_date');
                        sql = "UPDATE public.user SET last_login_date = $1 WHERE id = $2";
                        console.log(sql + " with id " + id);
                        console.log("and isoDateNow: ", isoDateNow())
                        values = [isoDateNow(), id]
                        db(sql, values, function (error, result) {
                            if (error !== null) {
                                console.log("error: ", error);
                                callback(error, null)
                            }
                            else {
                                console.log("ok generating token")
                                let token = jwt.createToken(data.email, function (err, token) {
                                    console.log("generated token for " + data.email + " : " + token);
                                    callback(null, { status: "success", token: token })
                                })
                            }

                        })
                    }
                })
            }
        })
    }
}


module.exports = User

/*
  id integer NOT NULL DEFAULT nextval('user_id_seq'::regclass),
  data json,
  last_token character varying(255),
  password character varying(128),
  email character varying(128),
  last_login_date date,
  created_on date,
  updated_on date
*/