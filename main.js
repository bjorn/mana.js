/*!
 *
 *   TMW.js - An experimental web-based 2D MMORPG
 *   http://manasource.org/tmwjs
 *
 */

var socket
var timeout
var player
var otherPlayers = {}

function addPlayer(player) {
    me.ObjectSettings.spritewidth = 64;
    me.ObjectSettings.spriteheight = 64;
    me.ObjectSettings.image = "player_male_base";

    otherPlayers[player.id] = new Character(player.x, player.y, me.ObjectSettings);
    otherPlayers[player.id].z = 3;
    me.game.add(otherPlayers[player.id]);
    me.game.sort();
}

function localPlayerCreated(playerEntity) {
    player = playerEntity
    socket = io.connect();




    socket.on('connect', function() {
        socket.emit('logon', player.pos);
    });

    socket.on('players', function(players) {
        console.log("Players: " + players);

        players.forEach(addPlayer);

        function sendPosition() {
            socket.emit('move', player.pos);
            timeout = setTimeout(sendPosition, 200);
        }

        // We're connected and have sent out initial position, start sending out updates
        timeout = setTimeout(sendPosition, 200);
    });

    socket.on('moved', function(player) {
        //console.log("Moved: " + player.id + " " + player.x + "," + player.y);
        var character = otherPlayers[player.id]
        if (character) {
            character.destinationX = player.x;
            character.destinationY = player.y;
        }
    });

    socket.on('connected', function(player) {
        console.log("Connected: " + player);
        addPlayer(player);
    });

    socket.on('disconnected', function(player) {
        console.log("Disconnected: " + player);
        // TODO: Figure out how to remove characters from the map
        var character = otherPlayers[player.id];
        me.game.remove(character);
        delete otherPlayers[player.id];
    });
}


var g_resources= [
    { name: "desert1",          type: "image", src: "data/desert1.png" },
    { name: "desert",           type: "tmx",   src: "data/desert.tmx" },
    { name: "player_male_base", type: "image", src: "data/player_male_base.png" },
    { name: "fog",              type: "image", src: "data/fog.png" }
];

var jsApp = {

    onload: function() {
        if (!me.video.init('jsapp', 640, 384, false, 1.0))
        {
            alert("Sorry but your browser does not support html 5 canvas.");
            return;
        }

        // initialize the "audio"
        me.audio.init("mp3,ogg");

        // set all resources to be loaded
        me.loader.onload = this.loaded.bind(this);

        // set all resources to be loaded
        me.loader.preload(g_resources);

        // load everything & display a loading screen
        me.state.change(me.state.LOADING);
    },

    loaded: function() {
        // set the "Play/Ingame" Screen Object
        me.state.set(me.state.PLAY, new PlayScreen());

        // add our player entity in the entity pool
        me.entityPool.add("mainPlayer", PlayerEntity);

        // enable the keyboard
        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.UP,    "up");
        me.input.bindKey(me.input.KEY.DOWN,  "down");

        //me.debug.renderHitBox = true;

        // start the game
        me.state.change(me.state.PLAY);
    }

};

/* the in game stuff*/
var PlayScreen = me.ScreenObject.extend({

    onResetEvent: function() {
        // stuff to reset on state change
        me.levelDirector.loadLevel("desert");
    },

    onDestroyEvent: function() {
    }

});

var Character = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        // call the parent constructor
        this.parent(x, y, settings);

        // set the walking speed
        this.setVelocity(2.5, 2.5);

        this.setFriction(0.2, 0.2);

        // adjust the bounding box
        this.updateColRect(20,24, 44, 16);

        // disable gravity
        this.gravity = 0;

        this.firstUpdates = 2;
        this.direction = 'down';
        this.destinationX = x;
        this.destinationY = y;

        this.addAnimation("stand-down", [0]);
        this.addAnimation("stand-left", [7]);
        this.addAnimation("stand-up", [14]);
        this.addAnimation("stand-right", [21]);
        this.addAnimation("down", [1,2,3,4,5,6]);
        this.addAnimation("left", [8,9,10,11,12,13]);
        this.addAnimation("up", [15,16,17,18,19,20]);
        this.addAnimation("right", [22,23,24,25,26,27]);
    },

    update: function() {
        hadSpeed = this.vel.y !== 0 || this.vel.x !== 0;

        this.handleInput();

        // check & update player movement
        updated = this.updateMovement();

        if (this.vel.y === 0 && this.vel.x === 0)
        {
            this.setCurrentAnimation('stand-' + this.direction)
            if (hadSpeed) {
                updated = true;
            }
        }

        // update animation
        if (updated)
        {
            // update object animation
            this.parent(this);
        }
        return updated;
    },

    handleInput: function() {
        if (this.destinationX < this.pos.x - 10)
        {
            this.vel.x -= this.accel.x * me.timer.tick;
            this.setCurrentAnimation('left');
            this.direction = 'left';
        }
        else if (this.destinationX > this.pos.x + 10)
        {
            this.vel.x += this.accel.x * me.timer.tick;
            this.setCurrentAnimation('right');
            this.direction = 'right';
        }

        if (this.destinationY < this.pos.y - 10)
        {
            this.vel.y = -this.accel.y * me.timer.tick;
            this.setCurrentAnimation('up');
            this.direction = 'up';
        }
        else if (this.destinationY > this.pos.y + 10)
        {
            this.vel.y = this.accel.y * me.timer.tick;
            this.setCurrentAnimation('down');
            this.direction = 'down';
        }
    }
})


var PlayerEntity = Character.extend({

    init: function(x, y, settings) {
        // call the parent constructor
        this.parent(x, y, settings);

        // set the display to follow our position on both axis
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);

        localPlayerCreated(this);
    },

    handleInput: function() {
        if (me.input.isKeyPressed('left'))
        {
            this.vel.x -= this.accel.x * me.timer.tick;
            this.setCurrentAnimation('left');
            this.direction = 'left';
        }
        else if (me.input.isKeyPressed('right'))
        {
            this.vel.x += this.accel.x * me.timer.tick;
            this.setCurrentAnimation('right');
            this.direction = 'right';
        }

        if (me.input.isKeyPressed('up'))
        {
            this.vel.y = -this.accel.y * me.timer.tick;
            this.setCurrentAnimation('up');
            this.direction = 'up';
        }
        else if (me.input.isKeyPressed('down'))
        {
            this.vel.y = this.accel.y * me.timer.tick;
            this.setCurrentAnimation('down');
            this.direction = 'down';
        }
    }

});

window.onReady(function() {
    jsApp.onload();
});
