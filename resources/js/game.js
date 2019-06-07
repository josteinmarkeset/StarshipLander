// ==========GLOBALS StART ===========
let enableDebugging = false;
let startNudge = true;

// Nudge settings
let maxNudgeVelocityX = 20
let maxNudgeVelocityY = 20
let maxNudgeAngle = Math.PI / 2
let maxNudgeAngularVelocity = 1/2;

// Rocket settings
var rocketMass = 85000; // Mass of Starship from: https://en.wikipedia.org/wiki/Starship_(rocket)
var rocketMassMin = 0;
var rocketMassMax = 1000000;

var maxLandingAngle = 20;
var maxLandingDelta = 20;
var maxLandingSpeed = 10;

var thrustForce = 1993000; // Thrust force of a raptor engine: https://en.wikipedia.org/wiki/Raptor_(rocket_engine_family)
var thrustForceMin = 0;
var thrustForceMax = 5000000;

// World settings
var worldGravity = 9.81;
var worldGravityMax = 20;
var worldGravityStep = 0.1;

// Misc settings
let terrainSmoothing = 0.8; // Range is 0-1
let fontSize = 18;
// ========== GLOBALS END ============

// To be assigned
let gui;
let font;
let world;
let earthTexture;
let starshipImage;
let backgroundImage;
let engineLoopSound;
let coldGasSound;

// Delta-time
let lastFrameTime = window.performance.now();

// Application does not run until these are loaded
function preload() {
    earthTexture = loadImage('resources/img/earth.jpg');
    starshipImage = loadImage('resources/img/starship.png');
    backgroundImage = loadImage('resources/img/bg.jpg');
    font = loadFont('resources/font/SourceSansPro-Regular.ttf');

    engineLoopSound = new Audio('resources/audio/engine_loop.wav');
    coldGasSound = new Audio('resources/audio/cold_gas.wav');
}

// Initialize application
function setup() {
    createCanvas(windowWidth, windowHeight);
    world = new World("Earth", 9.81);

    gui = createGui('Settings');
    gui.addGlobals('rocketMass', 'thrustForce', 'worldGravity');

    textFont(font);
    textSize(fontSize);
    textAlign(LEFT, CENTER);

    userStartAudio().then(function () {

    });
}

// Called every frame
function draw() {
    background(135, 206, 250);
    window.debug = enableDebugging;
    world.update();
    // Update delta-time
    lastFrameTime = window.performance.now();
}

function enableDebug(shouldEnable = true) {
    enableDebugging = shouldEnable;

    console.log(shouldEnable ? "Debugging mode enabled." : "Debugging mode disabled.");
}

function keyPressed() {
    if(keyCode === 88) {
        reset();
    }
}

// Restart
function reset() {
    world.reset();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    reset();
}

// https://github.com/processing/p5.js/issues/2180
function getDeltaTime() {
    const t = Math.max(1, window.performance.now() - lastFrameTime);
    return t / 1000;
}

// ================================================================================================
// https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
function sqr(x) { return x * x }

function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }

function distToSegmentSquared(p, v, w) {
    let l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    });
}

function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

function distToSegmentSigned(p, v, w) {
    d = (p.x - v.x) * (w.y - v.y) - (p.y - v.y) * (w.x - v.x);
    return distToSegment(p, v, w) * Math.sign(d);
}
// ================================================================================================

// https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}