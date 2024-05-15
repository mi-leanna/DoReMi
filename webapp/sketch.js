// Do Re Mi: A music controller inspired by MIDI controllers and DJ controllers. 
// Do Re Mi - Web App uses web serial communications to process the serial data 
// sent from the controller. The data is then translated into sounds and visuals 
// displayed on the web app. This code is preloaded with chords and tracks of "Nangs" 
// by Tame Impala.
//
// ======================= Acknowledgments =================================
// - The drum samples located in audio/ are from the “Lo-fi Psych Drums!” 
//   pack by PastToFutureSamples.
//   * [PastToFutureSamples Lo-fi Psych Drums!](https://pasttofuturesamples.gumroad.com/l/jxlln?layout=profile)
//
// - The "Nangs" backing track located in audio/ is from Reverbmachine’s blog, 
//   which deconstructed both the synth sounds and the production techniques of 
//   "Nangs" by Tame Impala.
//   * [Reverbmachine's Tame Impala Synth Sounds](https://reverbmachine.com/blog/tame-impala-synth-sounds/)
//
// - The drawBezierCurves() function is inspired by Patt Vira’s p5.js Coding 
//   Tutorial on Bezier Curves and Perlin Noise.
//   * [Patt Vira's Bezier Curves and Perlin Noise Tutorial](https://youtu.be/uctX1P3H3xM?feature=shared)
//
// - The draw3DShapes(), createSliders(), vShape(), and perturbation() functions
//   are adapted from and inspired by Kazuki Umeda’s YouTube video on how to 
//   create 3D Flowers in p5.js.
//   * [Kazuki Umeda's 3D Flowers in p5.js Tutorial](https://youtu.be/8fgJ6i96fTY?feature=shared)
//
// - The serial functionality and related serial functions -- onSerialDataReceived(),
//   onSerialErrorOccurred(), onSerialConnectionOpened(), and 
//   onSerialConnectionClosed() -- are adapted from the interactive Physical 
//   Computing textbook examples by Jon E. Froehlich.
//   * [Jon E. Froehlich's Physical Computing Textbook](https://makeabilitylab.github.io/physcomp/communication/p5js-serial.html#add-in-web-serial-object-and-callback-functions)
//
// - Artificial Intelligence (Google Gemini and ChatGPT 3.5) was utilized for 
//   code modularization and debugging assistance. It was also used to familiarize 
//   with p5.js syntax.


// Slider variables
let thetaSlider;
let phiSlider;
let ASlider;
let BSlider;

// Camera variables
let zoomFactor = 1;
let defaultSize = 50;
let initialRotationX = 0;
let initialRotationY = 0;
let initialRotationZ = 0;

// Point variables
let x1, y1, x2, y2, x3, y3, x4, y4;
let offset = 0;

// Oscillator arrays
let oscAm9, oscDmG, oscCmaj7, oscEbmaj7, oscAbmaj7;
let oscBass;

// Track variables
let track1, track2, track3, track4;
let hihat, kick, snare;
let fft, fft2;

// Default wave type
let default_wave = 'sine';

// Serial communication
let serial;
let serialOptions = {
    baudRate: 115200
};
let serialMessage;
let synthMsg;


function preload() {
    // Load audio files
    track1 = loadSound('audio/track1.wav');
    track2 = loadSound('audio/track2.wav');
    track3 = loadSound('audio/track3.wav');
    track4 = loadSound('audio/track4.wav');
    hihat = loadSound('audio/drum_hihat.wav');
    kick = loadSound('audio/drum_kick.wav');
    snare = loadSound('audio/drum_snare.wav');
}

function setup() {
    // Canvas setup
    createCanvas(windowWidth, windowHeight, WEBGL); // Set canvas dimensions to match window
    camera(0, 0, 1500); // Pre-set camera position (adjust z as needed)

    // Environment setup
    angleMode(DEGREES);
    colorMode(HSB);
    strokeWeight(4);

    // Oscillator setup
    osc1 = new p5.Oscillator();
    osc1.setType('sawtooth'); // Set oscillator type
    osc1.amp(0); // Start with no sound

    oscBass = new p5.Oscillator();
    oscBass.setType('sine');
    oscBass.amp(0); // Set initial amplitude to 0

    // Reverb setup
    reverb = new p5.Reverb();
    reverb.set(0.5); // Set the decay time (in seconds) of the reverb
    osc1.disconnect(); // Disconnect the oscillator from the master output
    osc1.connect(reverb); // Connect the oscillator to the reverb
    reverb.connect(); // Connect the reverb to the master output

    // Tracks setup
    track1.setVolume(0.0);
    track1.loop();
    track2.setVolume(0.0);
    track2.loop();
    track3.setVolume(0.0);
    track3.loop();
    track4.setVolume(0.0);
    track4.loop();

    // FFT setup
    fft = new p5.FFT();
    fft2 = new p5.FFT();

    // Web Serial setup
    serial = new Serial();
    serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
    serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
    serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
    serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);
    serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions); // Attempt to connect with previously approved ports

    // UI setup
    createSliders();
    createMessageElements();
    hideMessages();

    // Chord oscillators setup
    oscAm9 = createChordOscillator([220, 261.63, 329.63, 392, 493.88], 0); // A minor 9th
    oscDmG = createChordOscillator([98, 196, 293.66, 349.23, 523.25], 0); // D minor over G
    oscCmaj7 = createChordOscillator([65.41, 130.81, 261.63, 329.63, 392, 493.88], 0); // C major 7th
    oscEbmaj7 = createChordOscillator([77.78, 155.56, 233.08, 311.13, 392], 0); // E flat major 7th
    oscAbmaj7 = createChordOscillator([103.83, 207.65, 311.13, 392], 0); // A flat major 7th

    // Start oscillators
    osc1.start();
    oscBass.start();

    // Show the message if the serial connection is not open
    showSerialMessage();
}

function resetCanvas() {
    clear();
    offset = 0;
}

function draw() {
    drawBezierCurves();
    draw3DShapes();
    drawWaveform();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mouseClicked() {
    if (!serial.isOpen()) {
        serial.connectAndOpen(null, serialOptions);
    }
}

// Helper functions relating the the Web App's audio output
function createChordOscillator(freqs, pan) {
    let oscs = [];
    for (let i = 0; i < freqs.length; i++) {
        let osc = new p5.Oscillator();
        osc.setType('sawtooth');
        osc.freq(freqs[i]);
        osc.pan(pan);
        osc.amp(0);
        osc.start();
        oscs.push(osc);
    }
    return oscs;
}

function playNote(this_osc, frq, amplitude) {
    this_osc.freq(frq);
    this_osc.amp(amplitude);
}

function playChord(oscs) {
    for (let i = 0; i < oscs.length; i++) {
        oscs[i].amp(0.1);
    }
}

function stopChords() {
    for (let i = 0; i < oscAm9.length; i++) {
        oscAm9[i].amp(0);
    }
    for (let i = 0; i < oscDmG.length; i++) {
        oscDmG[i].amp(0);
    }
    for (let i = 0; i < oscCmaj7.length; i++) {
        oscCmaj7[i].amp(0);
    }
    for (let i = 0; i < oscEbmaj7.length; i++) {
        oscEbmaj7[i].amp(0);
    }
    for (let i = 0; i < oscAbmaj7.length; i++) {
        oscAbmaj7[i].amp(0);
    }
}

///////////////////////////////////////////////////////////////////
// - As mentioned above in my Acknowledgments section, these are
//   the functions adapted from the interactive Physical Computing 
//   textbook examples by Jon E. Froehlich.
///////////////////////////////////////////////////////////////////
function onSerialDataReceived(eventSender, newData) {
    let dataArray = newData.slice(1, -1).split(",");
    let buttonStates = dataArray.slice(0, 3); // Extract button states
    let potValue = parseInt(dataArray[3]); // Extract potentiometer value
    a_x = parseInt(dataArray[4]); // Extract potentiometer value
    a_y = parseInt(dataArray[5]); // Extract potentiometer value
    let potVolValue = parseFloat(dataArray[7]); // Extract potentiometer value
    let potZoomWave = parseInt(dataArray[6]); // Extract potentiometer value
    let drumsOrBass = parseInt(dataArray[8]); // Extract potentiometer value

    zoomFactor = potZoomWave;
    // Map accelerometer data to rotation angles
    initialRotationX = map(a_y, -200, 200, -PI, PI);
    initialRotationY = map(a_x, -200, 200, -PI, PI);

    rotateX(initialRotationX);
    rotateY(initialRotationY);

    thetaSlider.value(potValue);
    // console.log(potValue);

    let mappedValue = int(map(potValue, 40, 80, 0, 4));
    // console.log("mapped:" + mappedValue);

    if (mappedValue == 0) {
        drawBezierCurves();
        draw3DShapes();
        drawWaveform();

        track1.setVolume(0.0);
        track2.setVolume(0.0);
        track3.setVolume(0.0);
        track4.setVolume(0.0);
        synthMsg.hide();
        stringsMsg.hide();
        lead1Msg.hide();
        lead2Msg.hide();
    } else if (mappedValue == 1) {
        fft.setInput(track2);
        track1.setVolume(0.0);
        track2.setVolume(0.5);
        synthMsg.show();
        track3.setVolume(0.0);
        track4.setVolume(0.0);
        stringsMsg.hide();
        lead1Msg.hide();
        lead2Msg.hide();
    } else if (mappedValue == 2) {
        fft.setInput(track4);
        track1.setVolume(0.0);
        track2.setVolume(0.5);
        synthMsg.show();
        track3.setVolume(0.0);
        track4.setVolume(0.5);
        stringsMsg.show();
        lead1Msg.hide();
        lead2Msg.hide();
    } else if (mappedValue == 3) {
        fft.setInput(track3);
        track1.setVolume(0.0);
        track2.setVolume(0.5);
        track3.setVolume(0.5);
        track4.setVolume(0.5);
        synthMsg.show();
        stringsMsg.show();
        lead1Msg.show();
        lead2Msg.hide();
    } else if (mappedValue == 4) {
        fft.setInput(track1);
        track1.setVolume(0.5);
        track2.setVolume(0.5);
        track3.setVolume(0.5);
        track4.setVolume(0.5);
        synthMsg.show();
        stringsMsg.show();
        lead1Msg.show();
        lead2Msg.show();
    } else {
        synthMsg.hide();
        stringsMsg.hide();
        lead1Msg.hide();
        lead2Msg.hide();
    }

    phiSlider.value(10 - (potVolValue * 10));

    if (potZoomWave === 1) {
        stopChords();
    } else if (potZoomWave === 2) {
        stopChords();
        playChord(oscAm9);
    } else if (potZoomWave === 3) {
        stopChords();
        playChord(oscDmG);
    } else if (potZoomWave === 4) {
        stopChords();
        playChord(oscCmaj7);
    } else if (potZoomWave === 5) {
        stopChords();
        playChord(oscEbmaj7);
    } else if (potZoomWave === 6) {
        stopChords();
        playChord(oscAbmaj7);
    } else if (potZoomWave === 7) {
        stopChords();
    }

    if (buttonStates[0] === '1' && buttonStates[1] === '1' && buttonStates[2] === '1') {
        resetCanvas();
        snareMsg.hide();
        kickMsg.hide();
        hihatMsg.hide();
        bassMsg.hide();
    } else if (drumsOrBass == 1) {
        // Play chords based on button states
        if (buttonStates[0] === '1') {
            fft.setInput(hihat);
            hihatMsg.show();
            hihat.setVolume(potVolValue);
            hihat.play();
        } else if (buttonStates[1] === '1') {
            fft.setInput(kick);
            kickMsg.show();
            kick.setVolume(potVolValue);
            kick.play();
        } else if (buttonStates[2] === '1') {
            fft.setInput(snare);
            snareMsg.show();
            snare.setVolume(potVolValue);
            snare.play();
        } else {
            snareMsg.hide();
            kickMsg.hide();
            hihatMsg.hide();
            osc1.amp(0);
        }
    } else if (drumsOrBass == 2 || drumsOrBass == 3) {

        bassMsg.show();
        fft.setInput(oscBass);
        // Play chords based on button states
        if (buttonStates[0] === '1') {
            oscBass.freq(82.41);
            oscBass.amp(potVolValue, 0.03);

        } else if (buttonStates[1] === '1') {
            oscBass.freq(98.00);
            oscBass.amp(potVolValue, 0.03);
        } else if (buttonStates[2] === '1') {
            oscBass.freq(110.00);
            oscBass.amp(potVolValue, 0.03);
        } else {
            oscBass.amp(0, 0.05);
            bassMsg.hide();
        }
    }

}

function onSerialErrorOccurred(eventSender, error) {
    console.log("onSerialErrorOccurred", error);
}

function onSerialConnectionOpened(eventSender) {
    console.log("onSerialConnectionOpened");
    serialMessage.hide();
}

function onSerialConnectionClosed(eventSender) {
    console.log("onSerialConnectionClosed");
    showSerialMessage();
}

///////////////////////////////////////////////////////////////////
// - As mentioned above in my Acknowledgments section, this is
//   the function inspired by Patt Vira’s p5.js Coding 
//   Tutorial on Bezier Curves and Perlin Noise.
///////////////////////////////////////////////////////////////////
function drawBezierCurves() {
    noFill();
    strokeWeight(0.25); // Adjust as needed
    stroke(0, 50);

    // Center of the canvas
    let centerX = 0;
    let centerY = 0;

    for (let i = 0; i < 10; i++) {
        let x1 = map(noise(offset * 1.05), 0, 1, centerX - 200, centerX + 200);
        let y1 = map(noise(offset * 2.1 + 0.1), 0, 1, centerY - 200, centerY + 200);
        let x2 = map(noise(offset * 3.25 + 0.2), 0, 1, centerX - 200, centerX + 200);
        let y2 = map(noise(offset * 1.35 + 0.3), 0, 1, centerY - 200, centerY + 200);
        let x3 = map(noise(offset * 3.45 + 0.4), 0, 1, centerX - 200, centerX + 200);
        let y3 = map(noise(offset * 4.55 + 0.5), 0, 1, centerY - 200, centerY + 200);
        let x4 = map(noise(offset * 5.65 + 0.6), 0, 1, centerX - 200, centerX + 200);
        let y4 = map(noise(offset * 8.75 + 0.7), 0, 1, centerY - 200, centerY + 200);

        bezier(x1, y1, x2, y2, x3, y3, x4, y4);
    }

    offset += 0.0021;
}

///////////////////////////////////////////////////////////////////
// - As mentioned above in my Acknowledgments section, these are the
//   functions inspired by Kazuki Umeda’s YouTube video on how to 
//   create 3D Flowers in p5.js.
///////////////////////////////////////////////////////////////////
function createSliders() {
    thetaSlider = createSlider(40, 80, 50, 1);
    phiSlider = createSlider(2, 10, 2, 1);
    ASlider = createSlider(0, 100, 70, 1);
    BSlider = createSlider(0, 1, 0.8, 0.01);
}

function vShape(A, r, b, c) {
    return A * pow(Math.E, -b * pow(abs(r), 1.5)) * pow(abs(r), c);
}

function perturbation(A, r, angle) {
    return 1 + A * pow(r, 2) * sin(angle);
}

function draw3DShapes() {
    scale(zoomFactor);
    orbitControl(4, 4);
    rotateX(initialRotationX);
    rotateY(initialRotationY);
    rotateZ(initialRotationZ);

    let thetaMax = thetaSlider.value();
    let phiStep = phiSlider.value();
    let A = ASlider.value();
    let B = BSlider.value();

    for (let theta = 0; theta < thetaMax; theta += 1) {
        beginShape(POINTS);
        for (let phi = 0; phi < 360; phi += phiStep) {
            let r = (A * pow(abs(sin(phi * 3)), 1) + 225) * theta / 60;
            let x = r * cos(phi);
            let y = r * sin(phi);
            let z = vShape(350, r / 100, B, 0.15) - 200 +
                perturbation(1.5, r / 100, phi);
            vertex(x, y, z);
        }
        endShape();
    }
}

// Helper function to draw the audo reactive waveform 
function drawWaveform() {
    let waveform = fft.waveform();
    noFill();
    beginShape();

    let halfWidth = width / 2;
    let amplitude = 150;

    for (let i = 0; i < waveform.length; i++) {
        let x = map(i, 0, waveform.length, -halfWidth, halfWidth);
        let y = map(waveform[i], -1, 0, height / 2 - amplitude / 2, height / 2 + amplitude / 2);
        vertex(x, y);
    }
    endShape();
}

// Helper functions to display and hide messages to the user
function hideMessages() {
    synthMsg.hide();
    stringsMsg.hide();
    lead1Msg.hide();
    lead2Msg.hide();
    bassMsg.hide();
}

function showSerialMessage() {
    if (!serial.isOpen()) {
        serialMessage.show();
    } else {
        serialMessage.hide(); // Hide the message if the connection is already open
    }
}

function createMessageElements() {
    serialMessage = createP("Click anywhere on this page to open the serial connection dialog");
    serialMessage.style('font-size', '31px');
    serialMessage.style('position', 'absolute');
    serialMessage.style('top', '20%');
    serialMessage.style('left', '50%');
    serialMessage.style('transform', 'translate(-50%, -50%)');

    synthMsg = createP("Synth");
    synthMsg.style('font-size', '24px');
    synthMsg.style('position', 'absolute');
    synthMsg.style('top', '3%');
    synthMsg.style('left', '50%');
    synthMsg.style('transform', 'translate(-50%, -50%)');

    stringsMsg = createP("Strings");
    stringsMsg.style('font-size', '24px');
    stringsMsg.style('position', 'absolute');
    stringsMsg.style('top', '8%');
    stringsMsg.style('left', '50%');
    stringsMsg.style('transform', 'translate(-50%, -50%)');

    lead1Msg = createP("Lead 1");
    lead1Msg.style('font-size', '24px');
    lead1Msg.style('position', 'absolute');
    lead1Msg.style('top', '13%');
    lead1Msg.style('left', '50%');
    lead1Msg.style('transform', 'translate(-50%, -50%)');

    lead2Msg = createP("Lead 2");
    lead2Msg.style('font-size', '24px');
    lead2Msg.style('position', 'absolute');
    lead2Msg.style('top', '18%');
    lead2Msg.style('left', '50%');
    lead2Msg.style('transform', 'translate(-50%, -50%)');

    hihatMsg = createP("Hi-Hat");
    hihatMsg.style('font-size', '24px');
    hihatMsg.style('position', 'absolute');
    hihatMsg.style('top', '67%');
    hihatMsg.style('left', '70%');
    hihatMsg.style('transform', 'translate(-50%, -50%)');

    bassMsg = createP("Bass");
    bassMsg.style('font-size', '24px');
    bassMsg.style('position', 'absolute');
    bassMsg.style('top', '67%');
    bassMsg.style('left', '50%');
    bassMsg.style('transform', 'translate(-50%, -50%)');

    snareMsg = createP("Snare");
    snareMsg.style('font-size', '24px');
    snareMsg.style('position', 'absolute');
    snareMsg.style('top', '67%');
    snareMsg.style('left', '30%');
    snareMsg.style('transform', 'translate(-50%, -50%)');

    kickMsg = createP("Kick");
    kickMsg.style('font-size', '24px');
    kickMsg.style('position', 'absolute');
    kickMsg.style('top', '67%');
    kickMsg.style('left', '50%');
    kickMsg.style('transform', 'translate(-50%, -50%)');
}
