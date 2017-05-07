module.exports =
    function isoDateNow() {
        var unixtime = Math.floor(new Date() / 1000);
        var d = new Date();
        return d.toISOString();
    }