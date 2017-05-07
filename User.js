const bcrypt = require('bcrypt')
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
        console.log("user.create got data: ", data);
        var sql = "INSERT INTO public.user (data, password, email, last_login_date, created_on, updated_on) VALUES " +
            " ($1, $2, $3, $4, $4, $4) RETURNING id"
        console.log("calling hash");

        bcrypt.hash(data.password, 10, function (err, encryptedPassword) {
            console.log("encryptedPassword: ", encryptedPassword);
            var values = [{ timezone: data.timezone, ip_address: data.ip }, encryptedPassword, data.email, isoDateNow()]
            console.log("values: ", values);
            db(sql, values, function (error, result) {
                console.log("returning error ", error);
                console.log("retturning result ", result);
                return callback(error, result)
            });
        })
    };
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