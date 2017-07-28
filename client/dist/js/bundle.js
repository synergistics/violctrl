(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _pitchDetection = require('./pitchDetection');

var _pitchDetection2 = _interopRequireDefault(_pitchDetection);

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

// can I keep tuid local and passed around rather than global?
socket.addEventListener('message', function (message) {
    var data = JSON.parse(message.data);

    if (data.type === 'tuid_assigned') {
        tuid = data.tuid;
    } else if (data.type === 'pair_successful') {
        // change screens, change connection state to paired
        // this way the code controlling pitch messages can run properly 
        // how imma share that shit between files? pass the socket as an
        // argument?
        // not gonna worry about screen changes yet


        // start the pitch detection
        // pitchDetection.init({
        //     socket,
        //     tuid,
        //     ruid
        // })
        // start pitch detection (ask for mic and jazz first of course)
        // start transmitting commands based on the note
    } else if (data.type === 'pair_failed') {
        // do some dom stuff 
    }

    console.log(data);
});

socket.addEventListener('close', function () {
    console.log('done boys');
});

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
// Implementation of ViolCtrl Websocket API for transmitters
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
        ruid: ruid
    };
}

// TODO: why do i need to export default here?
exports.default = {
    transmitterConnect: transmitterConnect,
    pair: pair,
    command: command
};

},{}],3:[function(require,module,exports){
"use strict";

var socket = void 0;
var tuid = void 0;
var ruid = void 0;

var pitchMap = {};

// function init(options) {
//     {socket, tuid, ruid} = options
// }

// when a pitch is detected, if it matches one of the
// entries in the command map say (437-443 -> forward), 
// send off the command to the server
// so i need a command map. is that passed to this module
// or is it defined here? i think it should be defined here
// because it's not like that main code is changing any time
// soon. for right now, it's not a parametric thing
// it will be later

},{}]},{},[1]);
