const express = require('express');
const morgan = require('morgan');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

var players = [];
var nextId = 0;

// Game server part

io.on('connection', function(socket) {
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

app.get('/version', function(req, res) {
    res.send('0.0.1');
});
app.use(morgan('combined'))
app.use(express.static(__dirname));

server.listen(() => {
    console.log('Mana.js server listening on', server.address());
});

