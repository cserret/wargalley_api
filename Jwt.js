var jwt = require('jsonwebtoken')
var fs = require('fs')

function Jwt() {

    this.cert = fs.readFileSync('/etc/letsencrypt/live/wargalley.com/privkey.pem');

    this.createToken = (email, callback) => {
        console.log('createToken got ', email)
        // sign asynchronously
        var token = jwt.sign(
            { email: email },
            this.cert,
            { algorithm: 'RS256', expiresIn: '1h' },
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
        console.log('verifyToken got ", token')
        jwt.verify(token, this.cert, function (err, decoded) {
            console.log("jwt.verify: ", decoded);
        })
    }

}

module.exports = Jwt