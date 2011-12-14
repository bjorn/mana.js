var express = require('express');
var app = express.createServer();

app.configure(function() {
    app.get('/version', function(req, res) {
        res.send('0.0.1');
    });
    app.use(express.logger());
    app.use(express.static(__dirname));
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

app.listen(3000);

console.log('TMW.js server listening on port %s', app.address().port);
