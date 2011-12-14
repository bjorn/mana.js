/*!
 *
 *   TMW.js - An experimental web-based 2D MMORPG
 *   http://manasource.org/tmwjs
 *
 */

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

    loaded: function () {
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


var PlayerEntity = me.ObjectEntity.extend({

    init:function (x, y, settings) {
        // call the constructor
        this.parent(x, y , settings);

        // set the walking speed
        this.setVelocity(2.5, 2.5);

        this.setFriction(0.2, 0.2);

        // adjust the bounding box
        this.updateColRect(20,24, 44, 16);

        // disable gravity
        this.gravity = 0;

        this.firstUpdates = 2;
        this.direction = 'down';

        // set the display to follow our position on both axis
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);

        this.addAnimation("stand-down", [0]);
        this.addAnimation("stand-left", [7]);
        this.addAnimation("stand-up", [14]);
        this.addAnimation("stand-right", [21]);
        this.addAnimation("down", [1,2,3,4,5,6]);
        this.addAnimation("left", [8,9,10,11,12,13]);
        this.addAnimation("up", [15,16,17,18,19,20]);
        this.addAnimation("right", [22,23,24,25,26,27]);
     },

    update: function () {
        hadSpeed = this.vel.y !== 0 || this.vel.x !== 0;

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

        // check & update player movement
        updated = this.updateMovement();

        if (this.vel.y == 0 && this.vel.x == 0)
        {
            this.setCurrentAnimation('stand-' + this.direction)
            if (hadSpeed) {
                updated = true;
            }
        }

        // update animation
        if (updated)
        {
            // update objet animation
            this.parent(this);
        }
        return updated;
    }

});

window.onReady(function() {
   jsApp.onload();
});
