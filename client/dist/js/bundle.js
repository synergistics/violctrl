(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _pitchDetection = require('./pitchDetection');

var _messaging = require('./messaging');

var _messaging2 = _interopRequireDefault(_messaging);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tuid = void 0;
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
        var pd = new _pitchDetection.PitchDetector({
            context: context,
            bufferLength: 1024
        });
    } else if (data.type === 'pair_failed') {
        // do some dom stuff 
    }

    console.log(data);
});

function runThing(pd) {
    pitch = pd.currentPitch();
    // note = PitchDetector.toNote(pitch)
    console.log(pd);

    // requestAnimationFrame(() => runThing(pd))
}

var pairButton = document.getElementById('pair');
pairButton.addEventListener('click', function () {
    ruid = document.getElementById('ruid').value;
    var key = document.getElementById('key').value;
    var pairMsg = JSON.stringify(_messaging2.default.pair(tuid, ruid, key));

    socket.send(pairMsg);
});

function handleConnectionError(error) {
    switch (error.type) {
        case 'bad credentials':
            {
                console.log('couldn\'t pair to device');
                break;
            }
    }
}

},{"./messaging":2,"./pitchDetection":3}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* options:
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

var PitchDetector = exports.PitchDetector = function () {
    function PitchDetector(options) {
        var _this = this;

        _classCallCheck(this, PitchDetector);

        this.context = options.context;
        this.input = options.input;

        this.goodCorrelationThreshold = 0.9;
        this.minRMS = 0.01;
        this.bufferLength = 1024;
        this.maxSamples = Math.floor(this.bufferLength / 2);
        this.correlations = new Array(this.maxSamples);
        this.sampleRate = this.context.sampleRate;
        this.running = false;

        this.minPeriod = 2;
        this.maxPeriod = this.maxSamples;

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
            requestAnimationFrame(this.update);
        }
    }, {
        key: 'autoCorrelate',
        value: function autoCorrelate(audioEvent) {
            if (!this.running) {
                return;
            }

            var buffer = audioEvent.inputBuffer.getChannelData(0);
            var bufferLength = this.bufferLength;
            var maxSamples = this.maxSamples;
            var rms = 0;
            // let peak = 0
            var period = 0;

            // compute root mean sqaure
            for (var i = 0; i < bufferLength; i++) {
                rms += Math.pow(buffer[i], 2);
            }
            rms /= bufferLength;

            // is there enough signal?
            if (rms < this.rmsThreshold) {
                return -1;
            }

            var correlation = 0;
            for (var _i = this.minPeriod; _i < this.maxPeriod; _i++) {
                for (var j = 0; j < maxSamples; j++) {
                    correlation += Math.pow(buffer[j] - buffer[j + _i], 2);
                }
                // console.log(`run ${i}: correlation: ${correlation}`)
            }

            // 2. autocorrelate that shit
            // 3. call onDetect with the computed stats
            // this.onDetect(pitch)
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

},{}]},{},[1]);
