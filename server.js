var express = require('express');

var app = express.createServer();
var io = require('socket.io').listen(app);

var players = [];
var nextId = 0;

// Game server part

io.sockets.on('connection', function(socket) {
    var player

    socket.on('logon', function(pos) {
        // Create the player
        player = { id: nextId++, x: pos.x, y: pos.y };

        // Send existing players to client
        socket.emit('players', players);

        // Send the new player to other clients
        socket.broadcast.emit('connected', player)

        // Add client to list of players
        players.push(player);
    })

    socket.on('move', function(data) {
        if (player) {
            player.x = data.x;
            player.y = data.y;

            // Broadcast position change to all other clients
            socket.broadcast.emit('moved', player)
        }
    });

    socket.on('disconnect', function() {
        players.splice(players.indexOf(player), 1);
        io.sockets.emit('disconnected', player);
    });
});


// HTTP server part

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


app.listen(80);

console.log('Mana.js server listening on port %s', app.address().port);
