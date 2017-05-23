var validator = require('validator')
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

    this.renewToken = function (data, callback) {
        let token = jwt.createToken(data.email, function (err, token) {
            callback(null, { status: "success", token: token })
        })
    }

    this.lastToken = (email, callback) => {
        if (validator.isEmail(email) === false) {
            let sql = "SELECT last_token FROM public.user WHERE email = $1";
            let values = [email];
            db(sql, values, function (error, result) {
                if (error !== null) {
                    return callback(error, null);
                }
                else {
                    return callback(null, result.rows[0].last_token);
                }
            })
        }
    }

    this.create = function (data, callback) {
        function checkPassword(str) {
            // at least one number, one lowercase and one uppercase letter
            // at least six characters
            var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
            return re.test(str);
        }
        // ensure email is an email, and password meets min specs
        let email = data.email;
        let password = data.password;
        if (validator.isEmail(email) === false) {
            return callback({ message: "invalid email" }, null)
        }
        if (checkPassword(password) === false) {
            return callback({ message: "Invalid password" }, null);
        }
        // check if email already exists
        let sql = "SELECT id FROM public.user WHERE email = $1";
        db(sql, null, function (error, result) {
            if (error !== null) {
                return callback({ message: error }, null);
            }
            if (result.rows.length > 0) {
                return callback({ message: "email already exists" }, null);
            }


            sql = "INSERT INTO public.user (data, password, email, last_login_date, created_on, updated_on) VALUES " +
                " ($1, $2, $3, $4, $4, $4) RETURNING id"

            bcrypt.hash(data.password, 10, function (err, encryptedPassword) {
                var values = [{ timezone: data.timezone, ip_address: data.ip }, encryptedPassword, data.email, isoDateNow()]
                db(sql, values, function (error, result) {
                    return callback(error, result)
                });
            })
        });
    };

    this.logout = function (data, callback) {
        if (data.params.hasOwnProperty("access_token") === false || data.params.access_token === null) {
            return callback(null, "ok");
        }
        let access_token = data.params.access_token;
        let decoded = jwt.verifyToken(access_token, (error, result) => {
            let email = result.email;
            let sql = "UPDATE public.user SET last_token = $1 WHERE email = $2";
            let values = [access_token, email];
            db(sql, values, function (error, result) {
                if (error !== null) {
                    return callback(error, null);
                }
                else {
                    return callback(null, result);
                }
            });
        });
    }


    this.authorized = function (access_token, callback) {
        let verifiedJwt = jwt.verifyToken(access_token, function (error, result) {
            if (error !== null) {
                return callback(error, null);
            }
            this.user.lastToken(result.email, function (error, last_token) {
                if (error !== null) {
                    return callback(error, null);
                }
                if (last_token === access_token) {
                    return callback({ message: "token invalid" }, null);
                }
                return callback(null, result);
            });
        })
    }

    this.refresh = function (access_token, callback) {
        // first decode the token.
        // Then put that token into the last_token field for the user (se we ensure its not valid anymore)
        // The create a new token with the email extracted from the first token.
        jwt.verifyToken(access_token, function (error, result) {
            if (error !== null) {
                return callback(error, null);
            }
            if (result.hasOwnProperty("email") === false) {
                return callback({ message: "no email extracted" }, null);
            }
            let email = result.email;
            sql = "UPDATE public.user SET last_token = $1 WHERE email = $2";
            let values = [access_token, email];
            db(sql, values, function (error, result) {
                if (error !== null) {
                    callback(error, null)
                }
                else {
                    jwt.createToken(email, function (err, access_token) {
                        callback(null, { status: "success", email: email, access_token: access_token })
                    })
                }
            })
        })
    }

    this.authenticate = function (data, callback) {
        let sql = "SELECT id, password FROM public.user WHERE email = $1";
        let values = [data.email];
        db(sql, values, function (error, result) {
            if (error !== null) {
                callback(error, null)
            }
            else {
                let id = result[0].id
                let encryptedPassword = result[0].password;
                bcrypt.compare(data.password, encryptedPassword, function (err, result) {
                    if (result === false) {
                        callback(null, { status: "fail", message: "invalid login" })
                    }
                    else {
                        sql = "UPDATE public.user SET last_login_date = $1 WHERE id = $2";
                        values = [isoDateNow(), id]
                        db(sql, values, function (error, result) {
                            if (error !== null) {
                                callback(error, null)
                            }
                            else {
                                jwt.createToken(data.email, function (err, token) {
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
