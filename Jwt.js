var jwt = require('jsonwebtoken')
var fs = require('fs')

function Jwt() {

    this.cert = fs.readFileSync('/etc/letsencrypt/live/wargalley.com/privkey.pem', 'utf8');

    this.createToken = (email, callback) => {
        // sign asynchronously
        var token = jwt.sign(
            { email: email },
            this.cert,
            { expiresIn: '1h' },
            function (err, token) {
                if (err !== null) {
                    callback(err, null)
                }
                else {
                    callback(null, token);
                }
            }
        );
    }

    this.verifyToken = (token, callback) => {
        jwt.verify(token, this.cert, function (err, decoded) {
            if (err !== null) {
                return callback(err, null)
            }
            else {
                callback(null, decoded);
            }
        })

    }

}

module.exports = Jwt
