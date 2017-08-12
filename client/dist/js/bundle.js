(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var stop = speedsLR(0, 0);

function speedsLR(leftSpeed, rightSpeed) {
    return {
        type: 'speedsLR',
        leftSpeed: leftSpeed,
        rightSpeed: rightSpeed
    };
}

function isSameInstruction(i1, i2) {
    if (i1.type !== i2.type) {
        return false;
    }

    switch (i1.type) {
        case 'speedsLR':
            {
                return i1.leftSpeed === i2.leftSpeed && i1.rightSpeed === i2.rightSpeed;
            }
    }
}

exports.isSameInstruction = isSameInstruction;
exports.speedsLR = speedsLR;
exports.stop = stop;

},{}],2:[function(require,module,exports){
'use strict';

var _colorString = require('color-string');

var _colorString2 = _interopRequireDefault(_colorString);

var _schemes = require('./pitch/schemes');

var _detection = require('./pitch/detection');

var _conversions = require('./pitch/util/conversions');

var _ctrl = require('./ctrl');

var ctrl = _interopRequireWildcard(_ctrl);

var _messages = require('./messages');

var msg = _interopRequireWildcard(_messages);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: TRY LODASH
// TODO: SETUP URL HASHES SO THAT HISTORY NAVIGATION ISN'T Broken
var tuid = void 0,
    ruid = void 0;

var elemContainer = document.querySelector('.page-container');
var pagePair = document.querySelector('.page-pair');
var pageCtrl = document.querySelector('.page-ctrl');
var elemFrequency = document.querySelector('#frequency');
var elemNote = document.querySelector('#note');
var elemError = document.querySelector('#error-pair');
var btnPair = document.querySelector('.btn-pair');
var inRUID = document.querySelector('#in-ruid');
var inKey = document.querySelector('#in-key');

btnPair.addEventListener('click', function () {
    elemError.classList.add('invisible');
    ruid = inRUID.value;
    var key = inKey.value;

    var pair = msg.pair(tuid, ruid, key);
    socket.send(JSON.stringify(pair));
});

var socket = new WebSocket('wss://' + location.hostname);
// const socket = new WebSocket(`ws://${location.hostname}:3000`)
console.log(_colorString2.default);

socket.addEventListener('open', function (event) {
    var connect = msg.connect();
    socket.send(JSON.stringify(connect));
});

socket.addEventListener('close', function () {
    // stop the pitch detector
    console.log('done boys');
});

var hues = [207];
socket.addEventListener('message', function (message) {
    var data = JSON.parse(message.data);

    if (data.type === 'tuid_assigned') {
        tuid = data.tuid;
    } else if (data.type === 'pair_successful') {
        // change to ctrl screen
        // create the pitch detector
        // the yoosj
        // find a better way to do this man
        pagePair.classList.add('invisible');
        pageCtrl.classList.remove('invisible');

        var context = new AudioContext();

        var lastInstruction = ctrl.stop;
        var pd = new _detection.PitchDetector({
            context: context,
            bufferLength: 1024,
            onDetect: function onDetect(stats) {
                if (stats.error === _detection.detectionErrors.NO_ERROR) {
                    var pitch = stats.pitch;
                    elemNote.innerHTML = pitch.noteLetter();
                    elemFrequency.innerHTML = pitch.frequency.toFixed(1) + ' Hz';
                    changeColor(pitch);

                    var instruction = (0, _schemes.basicChromatic)(pitch);
                    if (!ctrl.isSameInstruction(instruction, lastInstruction)) {
                        // console.log(instruction)
                        var instructionMsg = msg.instruction(tuid, ruid, instruction);
                        socket.send(JSON.stringify(instructionMsg));

                        lastInstruction = instruction;
                    }
                } else {
                    // console.log(stats.error)
                    elemFrequency.innerHTML = 'nil';
                    elemNote.innerHTML = 'nil';

                    if (stats.error === _detection.detectionErrors.NOT_ENOUGH_SIGNAL) {
                        if (!ctrl.isSameInstruction(lastInstruction, ctrl.stop)) {
                            var _instruction = ctrl.stop;
                            var _instructionMsg = msg.instruction(tuid, ruid, _instruction);
                            socket.send(JSON.stringify(_instructionMsg));

                            lastInstruction = _instruction;
                        }
                    }
                }
            }
        });
    } else if (data.type === 'pair_failed') {
        elemError.classList.remove('invisible');
        if (data.reason === 0) {
            elemError.innerHTML = 'incorrect credentials';
        } else if (data.reason === 1) {
            elemError.innerHTML = 'internal error, transmitter does not exist';
        } else if (data.reason === 2) {
            elemError.innerHTML = 'receiver ' + ruid + ' is not up';
        }
        inKey.value = '';
    }

    console.log(data);
});

function changeColor(pitch) {
    var h = (230 + pitch.noteClass() * 30) % 360 / 360;
    var s = Math.min(1, (pitch.octave() + 1) / 10);
    var l = 0.6;
    var bgColor = hslToRgb(h, s, l);
    var fgColor = hslToRgb(h, s, l - 0.2);
    // console.log(bgColor, fgColor)
    var bgString = _colorString2.default.to.hex(bgColor);
    var fgString = _colorString2.default.to.hex(fgColor);
    elemContainer.style.background = bgString;
    elemNote.style.color = fgString;
    elemFrequency.style.color = fgString;
}

// stolen from stackoverflow
// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

},{"./ctrl":1,"./messages":3,"./pitch/detection":4,"./pitch/schemes":6,"./pitch/util/conversions":7,"color-string":9}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
// Implementation of ViolCtrl Websocket API for transmitter devices
function connect() {
    return {
        type: 'transmitter_connect'
    };
}

function pair(tuid, ruid, key) {
    return {
        type: 'pair',
        tuid: tuid,
        ruid: ruid,
        key: key
    };
}

function instruction(tuid, ruid, instruction) {
    return {
        type: 'instruction',
        tuid: tuid,
        ruid: ruid,
        instruction: instruction
    };
}

// TODO: why do i need to export default here?
exports.connect = connect;
exports.pair = pair;
exports.instruction = instruction;

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PitchDetector = exports.detectionErrors = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* options:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       configish
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - correlationThreshold
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - rmsThreshold
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       -  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       internal variables
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - onDetect() // what to do when pitch is detected
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - context :: AudioContext
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - sampleRate
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */

var _pitch = require('./pitch');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var detectionErrors = {
    NO_ERROR: 0,
    DETECTOR_STOPPED: 1,
    NOT_ENOUGH_SIGNAL: 2,
    CORRELATION_NOT_FOUND: 3
};

var PitchDetector = function () {
    function PitchDetector(options) {
        var _this = this;

        _classCallCheck(this, PitchDetector);

        this.context = options.context;
        this.input = options.input;

        this.correlationThreshold = 0.9;
        this.rmsThreshold = 0.05;

        this.bufferLength = 1024;
        this.maxSamples = Math.floor(this.bufferLength / 2);
        this.correlations = new Array(this.maxSamples);
        this.sampleRate = this.context.sampleRate;
        this.running = false;

        this.onDetect = options.onDetect;

        this.minPeriod = 2;
        this.maxPeriod = this.maxSamples;

        this.stats = {};

        // binding. shouldn't be an issue
        // an issue would arise if there were some situation where
        // the function should bind to it's calling contexts.
        // for all purposes so far, the only context that matters is
        // the instance of PitchDetector
        this.update = this.update.bind(this);
        this.autoCorrelate = this.autoCorrelate.bind(this);

        if (options.input === undefined) {
            this.getLiveInput(function (err, stream) {
                if (err) {
                    // iDunno() 
                }
                _this.input = _this.context.createMediaStreamSource(stream);
                // maybe more complex analysers can be passed as an option.
                // they can be like decorators for autoCorrelate that can do extra jazz
                // create analyser node with 1 input and 0 outputs
                _this.analyser = _this.context.createScriptProcessor(_this.bufferLength, 1, 1);
                _this.analyser.connect(_this.context.destination);
                _this.analyser.onaudioprocess = _this.autoCorrelate;
                _this.start();
            });
        }
    }

    _createClass(PitchDetector, [{
        key: 'getLiveInput',
        value: function getLiveInput(cb) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
                cb(null, stream);
            }).catch(function (err) {
                console.log('getUserMedia exception');
                cb(err, null);
            });
        }
    }, {
        key: 'start',
        value: function start() {
            this.input.connect(this.analyser);

            if (!this.running) {
                this.running = true;
                requestAnimationFrame(this.update);
            }
        }
    }, {
        key: 'update',
        value: function update() {
            if (this.running) {
                this.onDetect(this.stats);
                requestAnimationFrame(this.update);
            }
        }

        // this function is begging to be made monadic

    }, {
        key: 'autoCorrelate',
        value: function autoCorrelate(audioEvent) {
            // no error
            this.stats = {};

            if (!this.running) {
                this.stats.error = detectionErrors.DETECTOR_STOPPED;
                return;
            }

            var buffer = audioEvent.inputBuffer.getChannelData(0);
            var bufferLength = this.bufferLength;
            var maxSamples = this.maxSamples;
            var rms = 0;
            var peak = 0;

            // compute root mean sqaure
            for (var i = 0; i < bufferLength; i++) {
                if (buffer[i] > peak) {
                    peak = buffer[i];
                }
                rms += Math.pow(buffer[i], 2);
            }
            rms = Math.sqrt(rms / bufferLength);

            // is there enough signal?
            if (rms < this.rmsThreshold) {
                this.stats.error = detectionErrors.NOT_ENOUGH_SIGNAL;
                return;
            }

            var foundPitch = false;
            var bestOffset = -1;
            var lastCorrelation = 1;
            var bestCorrelation = 0;

            for (var offset = this.minPeriod; offset < this.maxPeriod; offset++) {
                var correlation = 0;
                for (var _i = 0; _i < maxSamples; _i++) {
                    // correlation += Math.abs(buffer[j] - buffer[j + i])
                    correlation += Math.pow(buffer[_i] - buffer[_i + offset], 2);
                }
                correlation = 1 - Math.pow(correlation / maxSamples, 0.5);
                // correlation = 1 - Math.sqrt(correlation / maxSamples)
                this.correlations[offset] = correlation;

                if (correlation > lastCorrelation && correlation > this.correlationThreshold) {
                    foundPitch = true;
                    if (correlation > bestCorrelation) {
                        bestCorrelation = correlation;
                        bestOffset = offset;
                    }
                } else if (foundPitch) {
                    var prev = this.correlations[bestOffset - 1];
                    var next = this.correlations[bestOffset + 1];
                    var best = this.correlations[bestOffset];
                    var shift = (next - prev) / best;
                    shift /= 8;

                    var frequency = this.sampleRate / (bestOffset + shift);

                    this.stats.error = detectionErrors.NO_ERROR;
                    this.stats.pitch = _pitch.Pitch.fromFrequency(frequency);
                    break;
                }

                lastCorrelation = correlation;
            }

            if (!foundPitch) {
                this.stats.error = detectionErrors.CORRELATION_NOT_FOUND;
            }
        }
    }]);

    return PitchDetector;
}();

exports.detectionErrors = detectionErrors;
exports.PitchDetector = PitchDetector;

},{"./pitch":5}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.noteLetters = exports.Pitch = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _conversions = require('./util/conversions');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// I think i hate getters and setters
// General rule I'm thinking about here is to only make getters out of properties
// that don't perform any computations beyond saving a value
// Accessing a property and creating it if it doesn't exist is a decent use
// case for a getter under this definition
var noteLetters = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

var Pitch = function () {
    function Pitch(form) {
        _classCallCheck(this, Pitch);

        if (form.frequency) {
            this._frequency = form.frequency;
        } else if (form.note) {
            this._note = form.note;
        }
    }

    _createClass(Pitch, [{
        key: 'octave',
        value: function octave() {
            var note = this.note;
            return Math.floor((note - 48) / 12) + 3;
        }
    }, {
        key: 'noteClass',
        value: function noteClass() {
            return this.note % 12;
        }
    }, {
        key: 'noteLetter',
        value: function noteLetter() {
            return noteLetters[this.note % 12];
        }
    }, {
        key: 'frequency',
        get: function get() {
            if (this._frequency) {
                return this._frequency;
            }

            if (this._note) {
                this._frequency = (0, _conversions.noteToFrequency)(this._note);
                return this._frequency;
            }
        }
    }, {
        key: 'note',
        get: function get() {
            if (this._note) {
                return this._note;
            }

            if (this._frequency) {
                this._note = (0, _conversions.frequencyToNote)(this._frequency);
                return this._note;
            }
        }
    }], [{
        key: 'fromFrequency',
        value: function fromFrequency(frequency) {
            return new Pitch({ frequency: frequency });
        }
    }, {
        key: 'fromNote',
        value: function fromNote(note) {
            return new Pitch({ note: note });
        }
    }]);

    return Pitch;
}();

exports.Pitch = Pitch;
exports.noteLetters = noteLetters;

},{"./util/conversions":7}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.basicChromatic = undefined;

var _ctrl = require('../ctrl');

// really obscure pitch scheme specific for viola 
// TODO: generalize
function basicChromatic(pitch) {
    var octave = pitch.octave();

    // note 0 through 11 (C C# ... B) 
    var noteClass = pitch.noteClass();
    // console.log(noteClass)

    var leftSpeed = void 0;
    var rightSpeed = void 0;
    var scaleFactor = void 0;

    if ([0, 1, 2, 3].includes(noteClass)) {
        leftSpeed = 1;
    } else if ([4, 5, 6, 9].includes(noteClass)) {
        leftSpeed = -1;
    } else if ([8, 11].includes(noteClass)) {
        leftSpeed = 1 / 2;
    } else if ([7, 10].includes(noteClass)) {
        leftSpeed = -1 / 2;
    }

    if ([0, 9, 10, 11].includes(noteClass)) {
        rightSpeed = 1;
    } else if ([3, 6, 7, 8].includes(noteClass)) {
        rightSpeed = -1;
    } else if ([1, 4].includes(noteClass)) {
        rightSpeed = 1 / 2;
    } else if ([2, 5].includes(noteClass)) {
        rightSpeed = -1 / 2;
    }

    // console.log(leftSpeed, rightSpeed)

    if (octave === 3) {
        scaleFactor = 0.5;
        return (0, _ctrl.speedsLR)(leftSpeed * scaleFactor, rightSpeed * scaleFactor);
    } else if (octave === 4) {
        scaleFactor = 0.85;
        return (0, _ctrl.speedsLR)(leftSpeed * scaleFactor, rightSpeed * scaleFactor);
    } else if (octave === 5) {
        scaleFactor = 1;
        return (0, _ctrl.speedsLR)(leftSpeed * scaleFactor, rightSpeed * scaleFactor);
    } else {
        return _ctrl.stop;
    }
} /* Module Description:
   * Functions that map frequencies to commands for the RPi
   */

exports.basicChromatic = basicChromatic;

},{"../ctrl":1}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var semitone = Math.pow(2, 1 / 12);

// Note 69 is A4 is 440Hz is the reference point used here
function frequencyToNote(frequency) {
    return 69 + Math.round(Math.log(frequency / 440) / Math.log(semitone));
}

function noteToFrequency(note) {
    return 440 + (note - 69) * semitone;
}

exports.semitone = semitone;
exports.frequencyToNote = frequencyToNote;
exports.noteToFrequency = noteToFrequency;

},{}],8:[function(require,module,exports){
'use strict'

module.exports = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};

},{}],9:[function(require,module,exports){
/* MIT license */
var colorNames = require('color-name');
var swizzle = require('simple-swizzle');

var reverseNames = {};

// create a list of reverse color names
for (var name in colorNames) {
	if (colorNames.hasOwnProperty(name)) {
		reverseNames[colorNames[name]] = name;
	}
}

var cs = module.exports = {
	to: {}
};

cs.get = function (string) {
	var prefix = string.substring(0, 3).toLowerCase();
	var val;
	var model;
	switch (prefix) {
		case 'hsl':
			val = cs.get.hsl(string);
			model = 'hsl';
			break;
		case 'hwb':
			val = cs.get.hwb(string);
			model = 'hwb';
			break;
		default:
			val = cs.get.rgb(string);
			model = 'rgb';
			break;
	}

	if (!val) {
		return null;
	}

	return {model: model, value: val};
};

cs.get.rgb = function (string) {
	if (!string) {
		return null;
	}

	var abbr = /^#([a-f0-9]{3,4})$/i;
	var hex = /^#([a-f0-9]{6})([a-f0-9]{2})?$/i;
	var rgba = /^rgba?\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/;
	var per = /^rgba?\(\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/;
	var keyword = /(\D+)/;

	var rgb = [0, 0, 0, 1];
	var match;
	var i;
	var hexAlpha;

	if (match = string.match(hex)) {
		hexAlpha = match[2];
		match = match[1];

		for (i = 0; i < 3; i++) {
			// https://jsperf.com/slice-vs-substr-vs-substring-methods-long-string/19
			var i2 = i * 2;
			rgb[i] = parseInt(match.slice(i2, i2 + 2), 16);
		}

		if (hexAlpha) {
			rgb[3] = Math.round((parseInt(hexAlpha, 16) / 255) * 100) / 100;
		}
	} else if (match = string.match(abbr)) {
		match = match[1];
		hexAlpha = match[3];

		for (i = 0; i < 3; i++) {
			rgb[i] = parseInt(match[i] + match[i], 16);
		}

		if (hexAlpha) {
			rgb[3] = Math.round((parseInt(hexAlpha + hexAlpha, 16) / 255) * 100) / 100;
		}
	} else if (match = string.match(rgba)) {
		for (i = 0; i < 3; i++) {
			rgb[i] = parseInt(match[i + 1], 0);
		}

		if (match[4]) {
			rgb[3] = parseFloat(match[4]);
		}
	} else if (match = string.match(per)) {
		for (i = 0; i < 3; i++) {
			rgb[i] = Math.round(parseFloat(match[i + 1]) * 2.55);
		}

		if (match[4]) {
			rgb[3] = parseFloat(match[4]);
		}
	} else if (match = string.match(keyword)) {
		if (match[1] === 'transparent') {
			return [0, 0, 0, 0];
		}

		rgb = colorNames[match[1]];

		if (!rgb) {
			return null;
		}

		rgb[3] = 1;

		return rgb;
	} else {
		return null;
	}

	for (i = 0; i < 3; i++) {
		rgb[i] = clamp(rgb[i], 0, 255);
	}
	rgb[3] = clamp(rgb[3], 0, 1);

	return rgb;
};

cs.get.hsl = function (string) {
	if (!string) {
		return null;
	}

	var hsl = /^hsla?\(\s*([+-]?\d*[\.]?\d+)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/;
	var match = string.match(hsl);

	if (match) {
		var alpha = parseFloat(match[4]);
		var h = ((parseFloat(match[1]) % 360) + 360) % 360;
		var s = clamp(parseFloat(match[2]), 0, 100);
		var l = clamp(parseFloat(match[3]), 0, 100);
		var a = clamp(isNaN(alpha) ? 1 : alpha, 0, 1);

		return [h, s, l, a];
	}

	return null;
};

cs.get.hwb = function (string) {
	if (!string) {
		return null;
	}

	var hwb = /^hwb\(\s*([+-]?\d*[\.]?\d+)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/;
	var match = string.match(hwb);

	if (match) {
		var alpha = parseFloat(match[4]);
		var h = ((parseFloat(match[1]) % 360) + 360) % 360;
		var w = clamp(parseFloat(match[2]), 0, 100);
		var b = clamp(parseFloat(match[3]), 0, 100);
		var a = clamp(isNaN(alpha) ? 1 : alpha, 0, 1);
		return [h, w, b, a];
	}

	return null;
};

cs.to.hex = function () {
	var rgba = swizzle(arguments);

	return (
		'#' +
		hexDouble(rgba[0]) +
		hexDouble(rgba[1]) +
		hexDouble(rgba[2]) +
		(rgba[3] < 1
			? (hexDouble(Math.round(rgba[3] * 255)))
			: '')
	);
};

cs.to.rgb = function () {
	var rgba = swizzle(arguments);

	return rgba.length < 4 || rgba[3] === 1
		? 'rgb(' + Math.round(rgba[0]) + ', ' + Math.round(rgba[1]) + ', ' + Math.round(rgba[2]) + ')'
		: 'rgba(' + Math.round(rgba[0]) + ', ' + Math.round(rgba[1]) + ', ' + Math.round(rgba[2]) + ', ' + rgba[3] + ')';
};

cs.to.rgb.percent = function () {
	var rgba = swizzle(arguments);

	var r = Math.round(rgba[0] / 255 * 100);
	var g = Math.round(rgba[1] / 255 * 100);
	var b = Math.round(rgba[2] / 255 * 100);

	return rgba.length < 4 || rgba[3] === 1
		? 'rgb(' + r + '%, ' + g + '%, ' + b + '%)'
		: 'rgba(' + r + '%, ' + g + '%, ' + b + '%, ' + rgba[3] + ')';
};

cs.to.hsl = function () {
	var hsla = swizzle(arguments);
	return hsla.length < 4 || hsla[3] === 1
		? 'hsl(' + hsla[0] + ', ' + hsla[1] + '%, ' + hsla[2] + '%)'
		: 'hsla(' + hsla[0] + ', ' + hsla[1] + '%, ' + hsla[2] + '%, ' + hsla[3] + ')';
};

// hwb is a bit different than rgb(a) & hsl(a) since there is no alpha specific syntax
// (hwb have alpha optional & 1 is default value)
cs.to.hwb = function () {
	var hwba = swizzle(arguments);

	var a = '';
	if (hwba.length >= 4 && hwba[3] !== 1) {
		a = ', ' + hwba[3];
	}

	return 'hwb(' + hwba[0] + ', ' + hwba[1] + '%, ' + hwba[2] + '%' + a + ')';
};

cs.to.keyword = function (rgb) {
	return reverseNames[rgb.slice(0, 3)];
};

// helpers
function clamp(num, min, max) {
	return Math.min(Math.max(min, num), max);
}

function hexDouble(num) {
	var str = num.toString(16).toUpperCase();
	return (str.length < 2) ? '0' + str : str;
}

},{"color-name":8,"simple-swizzle":11}],10:[function(require,module,exports){
'use strict';

module.exports = function isArrayish(obj) {
	if (!obj || typeof obj === 'string') {
		return false;
	}

	return obj instanceof Array || Array.isArray(obj) ||
		(obj.length >= 0 && (obj.splice instanceof Function ||
			(Object.getOwnPropertyDescriptor(obj, (obj.length - 1)) && obj.constructor.name !== 'String')));
};

},{}],11:[function(require,module,exports){
'use strict';

var isArrayish = require('is-arrayish');

var concat = Array.prototype.concat;
var slice = Array.prototype.slice;

var swizzle = module.exports = function swizzle(args) {
	var results = [];

	for (var i = 0, len = args.length; i < len; i++) {
		var arg = args[i];

		if (isArrayish(arg)) {
			// http://jsperf.com/javascript-array-concat-vs-push/98
			results = concat.call(results, slice.call(arg));
		} else {
			results.push(arg);
		}
	}

	return results;
};

swizzle.wrap = function (fn) {
	return function () {
		return fn(swizzle(arguments));
	};
};

},{"is-arrayish":10}]},{},[2]);
