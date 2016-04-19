const gameWidth=800,gameHeight=600,fps=60;
var gameDisplayWindow, playing, turn, defaultTimestep, turnTime, turnFrame, turnLength, playbackSpeed,
	entities, entityList, entityChangeNums, gameStates, gameInitializer, turns
    defaultValues = ['visible', 'initX', 'initY', 'initWidth', 'initHeight', 'flipped', 'value'],
    defaultReplace = ['visible', 'x', 'y', 'width', 'height', 'flipped', 'value'],
    textProperties = ['font', 'fontStyle', 'fontWeight', 'fontSize', 'backgroundColor', 'fill'],
    textDefaults = ['bold 20pt Arial', 'bold', 'bold', '20pt', null, '#00FF00']
    spriteActions = ['walk', 'fall', 'attack', 'defend'];

function preload() {
    // Load graphical assets
    gameDisplayWindow.load.spritesheet('spriteRabbit', 'assets/images/spriteBunny.png', 800, 800);
    gameDisplayWindow.load.spritesheet('spriteChicken', 'assets/images/spriteChicken.png', 800, 800);
    //gameDisplayWindow.load.spritesheet('spriteZombie', 'assets/images/spriteZombie.png', 800, 800);
    //gameDisplayWindow.load.spritesheet('spriteAlien', 'assets/images/spriteAlien.png', 800, 800);
    gameDisplayWindow.load.image('background', gameInitializer.background);
    // Set default timestep
    defaultTimestep = gameInitializer.defaultTimestep;
    // Set initial variables
    entities = [];
    entityList = [];
    playbackSpeed = 1;
    gameStates = [];
    turn = 0;
    // Generate game
    createEnts();                           // Create entity objects
    generateTurnChanges();                  // Set initial values for all turn changes
    generateGameStates();                   // Save game states
    generateRows(gameInitializer, turns);   // Generate rows for the status table
    loadObjectImages();                     // Get and preload all object images
}

function createEnts(){
    // Create all the entity objects
    gameStates.push({});
    var e = gameInitializer.entity;
    for (var i = 0; i < e.length; i++)
        addEnt(e[i]);
}

function addEnt(e) {
    // Create an entity object and add its initial game state
    var gs = {
        action: 'create',
        start: 0,
        end: 1,
        visible: e.visible,
        initX: e.initX,
        initY: e.initY,
        initRotation: e.rotation,
        flipped: e.flipped,
        anim: {frames: [0], speed: 0}
    };
    if (e.type == 'text') {
        gs.value = e.value;
        for (var i = 0; i < textProperties.length; i++) {
            var p = textProperties[i];
            if (p in e)
                gs[p] = e[p];
            else
                gs[p] = textDefaults[i];
        }
    }
    else {
        gs.initWidth = e.width;
        gs.initHeight = e.height;
        if (e.type == 'object')
            gs.value = e.value;
    }
    gameStates[0][e.id] = gs;
    var ent = new Entity(e);
    entities[ent.id] = ent;
    entityList.push(ent);
}

function generateTurnChanges() {
    // Set the initial values for all turn changes (initX, initY, etc)
    // This enables us to fully restore the state of an entity by playing an animation
    var prevChange = {};
    for (var i = 0; i < entityList.length; i++) {
        var id = entityList[i].id;
        prevChange[id] = gameStates[0][id];
    }
    for (var i = 0; i < turns.length; i++) {
        var turnChanges = turns[i].turnChanges;
        for (var j = 0; j < turnChanges.length; j++) {
            var changes = turnChanges[j].changes, id = turnChanges[j].id;
            for (var k = 0; k < changes.length; k++) {
                var c = changes[k];
                addDefaultValues(id, c, prevChange[id]);
                prevChange[id] = c;
            }
        }
    }
}

function addDefaultValues(id, change, prevChange) {
    // Add default values to an individual change
    for (var i = 0; i < defaultValues.length; i++) {
        var value = defaultValues[i], replace = defaultReplace[i];
        if (!(value in change)) {
            if (replace in prevChange)
                change[value] = prevChange[replace];
            else if (value in prevChange)
                change[value] = prevChange[value];
        }
    }
    if (!('initRotation' in change)) {
        var initRotation = prevChange.initRotation;
        if ('rotation' in prevChange)
            initRotation += prevChange.rotation;
        change.initRotation = initRotation;
    }
    if (!(anim in change)) {
        var anim = entities[id].getAnimation(change);
        if (anim == null)
            anim = {frames: [prevChange.anim.frames[0]], speed: 0};
        change.anim = anim;
    }
    if (entities[id].type == 'text') {
        for (var i = 0; i < textProperties.length; i++) {
            var c = textProperties[i];
            if ((c in prevChange) && !(c in change))
                change[c] = prevChange[c];
        }
    }
}

function generateGameStates() {
    // Generate game states using the most recent change of every entity so we can restore them later
    for (var i = 0; i < turns.length; i++) {
        var gs = {}, tc = turns[i].turnChanges;
        for (var j = 0; j < tc.length; j++) {
            var c = tc[j];
            gs[c.id] = c.changes[c.changes.length - 1];
            entities[c.id].finalTurn = i + 1;
        }
        gameStates.push(gs);
    }
}

function loadObjectImages() {
    var loadedImages = {}, ents = gameInitializer.entity;
    for (var i = 0; i < ents.length; i++) {
        if ('value' in ents[i])
            loadImage(ents[i].value, loadedImages);
    }
    for (var i = 0; i < turns.length; i++) {
        var turnChanges = turns[i].turnChanges;
        for (var j = 0; j < turnChanges.length; j++) {
            var changes = turnChanges[j].changes, id = turnChanges[j].id;
            if (entities[id].type == 'object') {
                for (var k = 0; k < changes.length; k++) {
                    if ('value' in changes[k])
                        loadImage(changes[k].value, loadedImages);
                }
            }
        }
    }
}

function loadImage(img,loadedImages) {
    if (!(img in loadedImages)) {
        gameDisplayWindow.load.image(img, img);
        loadedImages[img] = true;
    }
}

function create() {
    gameDisplayWindow = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, 'div_gameCanvas',
        {preload: preload, create: create2, update: drawTurn})
}

function create2() {
    // Set background
    var bkg = gameDisplayWindow.add.image(0, 0, 'background');
    bkg.width = gameWidth;
    bkg.height = gameHeight;
    for (var i = 0; i < entityList.length; i++)
        entityList[i].instantiate();
    // Set first turn
    restoreGameState(0);
    ready = false;
    console.log("The GDM create method has now run");
    console.log(JSON.stringify(gameInitializer, null, 2));
    console.log(JSON.stringify(turns, null, 2));
}

function drawTurn() {
    // Draw the state of the game every frame
    if (!playing) return;
    // Go to next turn if current turn has ended
    if (turnTime > 1)
        startTurn(turn + 1, false);
    // Stop if we've reached the end
    if (!playing) return;
    // Get current turn changes
    var tc = turns[turn].turnChanges;
    // Iterate through the turn changes
    for (var i = 0; i < tc.length; i++) {
        // Get the change to execute for this entity
        var c = tc[i], e = entities[c.id];
        if (!(e.id in entityChangeNums))
            entityChangeNums[e.id] = 0;
        var cn = entityChangeNums[e.id];
        var changes = c.changes;
        while (cn < changes.length - 1 && changes[cn + 1].start <= turnTime) {
            entityChangeNums[e.id]++;
            cn = entityChangeNums[e.id];
        }
        // Execute change
        if (cn < changes.length) {
            var c2 = changes[cn];
            if (turnTime >= c2.start && (!('end' in c2) || turnTime <= c2.end))
                e.action(c2, turnTime);
        }
    }
    // Increase turn time
    turnFrame++;
    turnTime = (turnFrame * playbackSpeed) / (fps * turnLength);
}

function restoreGameState(turnNum) {
    // Load the beginning of a turn
    if (turnNum < 0)
        turnNum = 0;
    for (var i = 0; i < entityList.length; i++) {
        var ent = entityList[i], j = Math.min(turnNum,ent.finalTurn), entId = ent.id;
        while (!(entId in gameStates[j]))
            j--;
        ent.action(gameStates[j][entId], 1);
    }
    startTurn(turnNum, false);
    playing = false;
}

function startTurn(tn,tm) {
    // Set the beginning variables of a turn
    if (tn < 0)
        tn = 0;
    if (tn >= turns.length) {
        playing = false;
        turnTime = Infinity;
        turn = turns.length;
        showRows(turn);
        return;
    }
    turn = tn;
    showRows(turn);
    if (tm)
        turnTime = 1;
    else
        turnTime = 0;
    turnLength = defaultTimestep * turns[turn].timeScale;
    turnFrame = 0;
    entityChangeNums = {};
}

//I believe this should be all thats necessary to call when we recieve a new set of turns
function setNewTestingArenaTurn() {
    generateTurnChanges();
    generateGameStates();
    generateRows(gameInitializer, turns);
    // Set turn
    restoreGameState(turn+1);
}

function Entity(e) {
    this.initMessage = e;               // Initialization of this entity
    this.id = this.initMessage.id;      // Unique numerical id
    this.type = this.initMessage.type;  // The type of entity: 'object', 'text', or a type of sprite
    this.finalTurn = 0;                 // The last turn on which this entity executes a change
    if (this.type == 'object' || this.type == 'text')
        this.isAnimated = false;
    else {
        this.isAnimated = true;
        this.animations = animationList[this.type];
    }
    // Create the sprite or text object
    this.instantiate = function() {
        if (this.type == 'object') {
            this.obj = gameDisplayWindow.add.sprite(0, 0, this.initMessage.value);
            this.obj.name = this.initMessage.value;
            this.obj.anchor.setTo(0.5, 0.5);
        }
        else if (this.type == 'text')
            this.obj = gameDisplayWindow.add.text(0, 0, this.initMessage.value);
        else {
            this.obj = gameDisplayWindow.add.sprite(0, 0, this.initMessage.type);
            this.obj.anchor.setTo(0.5, 0.5);
        }
    };
    // Code to execute when performing a change
    this.action = function (f, t) {
        // Object/Text value
        if(this.type == 'object') {
            if(this.obj.name != f.value) {
                this.obj.destroy();
                this.obj = gameDisplayWindow.add.sprite(0, 0, f.value);
                this.obj.name = f.value;
                this.obj.anchor.setTo(0.5, 0.5);
            }
        }
        else if(this.type == 'text') {
            this.obj.text = f.value;
            for(var i=0;i<textProperties.length;i++){
                var c=textProperties[i];
                if(c in f)
                    this.obj[c]=f[c];
            }
        }

        // Visibility
        if (!f.visible) {
            this.obj.visible = false;
            return;
        }
        this.obj.visible = true;

        // Movement
        var m = 1 / (f.end - f.start),
            t1 = (f.end - t) * m, t2 = (t - f.start) * m,
            time = t - f.start, scaledTime = time * m;
        if ('x' in f)
            this.obj.x = (f.initX * t1 + f.x * t2);
        else
            this.obj.x = f.initX;
        if ('y' in f)
            this.obj.y = (f.initY * t1 + f.y * t2);
        else
            this.obj.y = f.initY;

        // Sprite/text properties
        if (this.type != 'text') {
            if ('width' in f)
                this.obj.width = f.initWidth * t1 + f.width * t2;
            else
                this.obj.width = f.initWidth;
            if ('height' in f)
                this.obj.height = f.initHeight * t1 + f.height * t2;
            else
                this.obj.height = f.initHeight;
        }
        if ('rotation' in f)
            this.obj.angle = scaledTime * f.rotation + f.initRotation;
        else
            this.obj.angle = f.initRotation;
        if (f.flipped)
            this.obj.width *= -1;

        // Animation
        if (this.isAnimated) {
            var anim = f.anim;
            this.obj.frame = anim.frames[Math.floor(time * anim.speed) % anim.frames.length];
        }
    };
    // For default values
    this.getAnimation = function (f) {
        if (!('action' in f) || spriteActions.indexOf(f.action) < 0)
            return null;
        return this.animations[f.action];
    };
}

var animationList = {
    spriteRabbit: {
        walk: {frames: [0,1,2,3,4,5,6,7,8,9], speed: 15},
        fall: {frames: [13,14], speed: 15},
        attack: {frames: [15,16,17,18,19], speed: 15},
        defend: {frames: [10,11,12,12,12,12,12,11], speed: 15}
    },
    spriteChicken: {
        walk: {frames: [0,1,2,3,4,5], speed: 15},
        fall: {frames: [11], speed: 15},
        attack: {frames: [6,7,8], speed: 15},
        defend: {frames: [10,10,9], speed: 15}
    }
    
    //TODO: Josiah other 2 sprites animations list.
};