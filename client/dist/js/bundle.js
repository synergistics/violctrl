(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.speedsLR = speedsLR;
function speedsLR(leftSpeed, rightSpeed) {
    return {
        type: 'speedsLR',
        leftSpeed: leftSpeed,
        rightSpeed: rightSpeed
    };
}

},{}],2:[function(require,module,exports){
'use strict';

var _pitchSchemes = require('./pitchSchemes');

var _pitchDetection = require('./pitchDetection');

var _notes = require('./util/notes');

var _ctrlCommands = require('./ctrlCommands');

var _messaging = require('./messaging');

var _messaging2 = _interopRequireDefault(_messaging);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tuid = void 0; // TODO: TRY LODASH

var ruid = void 0;
var paired = false;
var socket = new WebSocket('ws://' + location.hostname + ':3000');

socket.addEventListener('open', function (event) {
    // tell server a transmitter is connecting
    var transmitterMsg = JSON.stringify(_messaging2.default.transmitterConnect());
    socket.send(transmitterMsg);
});

socket.addEventListener('close', function () {
    console.log('done boys');
});

// can I keep tuid local and passed around rather than global?
socket.addEventListener('message', function (message) {
    var data = JSON.parse(message.data);

    if (data.type === 'tuid_assigned') {
        tuid = data.tuid;
    } else if (data.type === 'pair_successful') {
        var context = new AudioContext();

        var frequencyElem = document.getElementById('frequency');
        var noteElem = document.getElementById('note');
        var octaveElem = document.getElementById('octave');

        var pd = new _pitchDetection.PitchDetector({
            context: context,
            bufferLength: 1024,
            onDetect: function onDetect(stats) {
                // let prevPitch = stats.prevPitch
                var pitch = stats.pitch;
                if (pitch) {
                    frequencyElem.innerHTML = pitch.frequency;
                    noteElem.innerHTML = pitch.note;
                    octaveElem.innerHTML = pitch.octave;

                    var command = (0, _pitchSchemes.basicChromatic)(pitch);
                    console.log(command);
                    var commandMsg = JSON.stringify(_messaging2.default.command(tuid, ruid, command));
                    socket.send(commandMsg);

                    // if the current note is different from previous 
                    // if (prevPitch && pitch.note !== prevPitch.note) {
                    //     let command = basicChromatic(pitch) 
                    //     console.log(command)
                    //     let commandMsg = JSON.stringify(messaging.command(tuid, ruid, command))
                    //     socket.send(commandMsg)
                    // }
                } else {
                    frequencyElem.innerHTML = 'nil';
                    noteElem.innerHTML = 'nil';

                    var _command = (0, _ctrlCommands.speedsLR)(0, 0);
                    var _commandMsg = JSON.stringify(_messaging2.default.command(tuid, ruid, _command));
                    socket.send(_commandMsg);
                }
            }
        });
    } else if (data.type === 'pair_failed') {
        // do some dom stuff 
    }

    console.log(data);
});

var pairButton = document.getElementById('pair');
pairButton.addEventListener('click', function () {
    ruid = document.getElementById('ruid').value;
    var key = document.getElementById('key').value;
    var pairMsg = JSON.stringify(_messaging2.default.pair(tuid, ruid, key));

    socket.send(pairMsg);
});

},{"./ctrlCommands":1,"./messaging":3,"./pitchDetection":4,"./pitchSchemes":5,"./util/notes":6}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
// Implementation of ViolCtrl Websocket API for transmitter devices
function transmitterConnect() {
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

function command(tuid, ruid, command) {
    return {
        type: 'command',
        tuid: tuid,
        ruid: ruid,
        command: command
    };
}

// TODO: why do i need to export default here?
exports.default = {
    transmitterConnect: transmitterConnect,
    pair: pair,
    command: command
};

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PitchDetector = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* options:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       configish
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - goodCorrelationThreshold
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - rmsThreshold
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       -  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       internal variables
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - onDetect() // what to do when pitch is detected
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - context :: AudioContext
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - sampleRate
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */


var _notes = require('./util/notes');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PitchDetector = exports.PitchDetector = function () {
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
                _this.analyser = _this.context.createScriptProcessor(_this.bufferLength, 1, 0);
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
    }, {
        key: 'autoCorrelate',
        value: function autoCorrelate(audioEvent) {
            if (!this.running) {
                return;
            }

            var prevPitch = this.stats.pitch;
            this.stats = { prevPitch: prevPitch };

            var buffer = audioEvent.inputBuffer.getChannelData(0);
            var bufferLength = this.bufferLength;
            var maxSamples = this.maxSamples;
            var rms = 0;
            var volume = 0;
            var peak = 0;

            // compute root mean sqaure
            for (var i = 0; i < bufferLength; i++) {
                if (buffer[i] > peak) {
                    peak = buffer[i];
                }
                volume += Math.abs(buffer[i]);
                rms += Math.pow(buffer[i], 2);
            }
            volume /= bufferLength;
            rms = Math.sqrt(rms / bufferLength);

            // is there enough signal?
            if (rms < this.rmsThreshold) {
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

                    this.stats.pitch = _notes.Pitch.fromFrequency(frequency);
                    break;
                }
                lastCorrelation = correlation;
            }
        }
    }]);

    return PitchDetector;
}();

// when a pitch is detected, if it matches one of the
// entries in the command map say (437-443 -> forward), 
// send off the command to the server
// so i need a command map. is that passed to this module
// or is it defined here? i think it should be defined here
// because it's not like that main code is changing any time
// soon. for right now, it's not a parametric thing
// it will be later

},{"./util/notes":6}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.basicChromatic = basicChromatic;

var _ctrlCommands = require('./ctrlCommands');

// really obscure pitch scheme specific for viola 
// TODO: generalize
function basicChromatic(pitch) {
    var octave = pitch.octave;
    // note 0 through 11 (C C# ... B) 
    var noteClass = pitch.note % 12;

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

    if (octave === 3) {
        scaleFactor = 0.5;
        return (0, _ctrlCommands.speedsLR)(leftSpeed * scaleFactor, rightSpeed * scaleFactor);
    } else if (octave === 4) {
        scaleFactor = 0.85;
        return (0, _ctrlCommands.speedsLR)(leftSpeed * scaleFactor, rightSpeed * scaleFactor);
    } else if (octave === 5) {
        scaleFactor = 1;
        return (0, _ctrlCommands.speedsLR)(leftSpeed * scaleFactor, rightSpeed * scaleFactor);
    }
} /* Module Description:
   * Functions that map frequencies to commands for the RPi
   */

},{"./ctrlCommands":1}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.frequencyToNote = frequencyToNote;
exports.noteToFrequency = noteToFrequency;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ratio of two notes a half step apart in 12-tone equal temperament
var semitone = exports.semitone = Math.pow(2, 1 / 12);

function frequencyToNote(f) {
    return 69 + Math.round(Math.log(f / 440) / Math.log(semitone));
}

function noteToFrequency(n) {
    return 440 + (n - 69) * semitone;
}

// I think i hate getters and setters

var Pitch = exports.Pitch = function () {
    function Pitch(form) {
        _classCallCheck(this, Pitch);

        if (form.frequency) {
            this._frequency = form.frequency;
        } else if (form.note) {
            this._note = form.note;
        }
    }

    _createClass(Pitch, [{
        key: "frequency",
        get: function get() {
            if (this._frequency) {
                return this._frequency;
            }

            if (this._note) {
                this._frequency = 440 + (this._note - 69) * (Math.pow(2, 1) / 12);
                return this._frequency;
            }
        }
    }, {
        key: "note",
        get: function get() {
            if (this._note) {
                return this._note;
            }

            if (this._frequency) {
                this._note = frequencyToNote(this._frequency);
                return this._note;
            }
        }
    }, {
        key: "octave",
        get: function get() {
            // using getter
            var note = this.note;
            return Math.floor((note - 48) / 12) + 3;
        }

        // probably better to do this on the fly
        // get noteClass() {
        //     if (this._noteClass) {
        //         return this.noteClass 
        //     } 
        //     this._noteClass = note % 11
        //     return this.noteClass 
        // }

    }], [{
        key: "fromFrequency",
        value: function fromFrequency(frequency) {
            return new Pitch({ frequency: frequency });
        }
    }, {
        key: "fromNote",
        value: function fromNote(note) {
            return new Pitch({ note: note });
        }
    }]);

    return Pitch;
}();

},{}]},{},[2]);
