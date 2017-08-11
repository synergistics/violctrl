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

var _schemes = require('./pitch/schemes');

var _detection = require('./pitch/detection');

var _conversions = require('./pitch/util/conversions');

var _ctrl = require('./ctrl');

var ctrl = _interopRequireWildcard(_ctrl);

var _messages = require('./messages');

var msg = _interopRequireWildcard(_messages);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var tuid = void 0,
    ruid = void 0; // TODO: TRY LODASH


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

socket.addEventListener('open', function (event) {
    var connect = msg.connect();
    socket.send(JSON.stringify(connect));
});

socket.addEventListener('close', function () {
    // stop the pitch detector
    console.log('done boys');
});

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
                    elemFrequency.innerHTML = pitch.frequency;
                    elemNote.innerHTML = pitch.note;

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

},{"./ctrl":1,"./messages":3,"./pitch/detection":4,"./pitch/schemes":6,"./pitch/util/conversions":7}],3:[function(require,module,exports){
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
exports.Pitch = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _conversions = require('./util/conversions');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// I think i hate getters and setters
// General rule I'm thinking about here is to only make getters out of properties
// that don't perform any computations beyond saving a value
// Accessing a property and creating it if it doesn't exist is a decent use
// case for a getter under this definition
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
            // using getter
            var note = this.note;
            return Math.floor((note - 48) / 12) + 3;
        }
    }, {
        key: 'noteClass',
        value: function noteClass() {
            return this.note % 12;
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

},{}]},{},[2]);
