(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var tuid = void 0;
var paired = false;
var socket = new WebSocket('ws://' + location.hostname + ':3000');

socket.addEventListener('open', function (event) {
    socket.send(JSON.stringify({
        type: 'transmitter_connect'
    }));
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
        // startAudio()
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
    var ruid = document.getElementById('ruid').value;
    var key = document.getElementById('key').value;

    socket.send(JSON.stringify({
        type: 'pair',
        tuid: tuid,
        ruid: ruid,
        key: key
    }));
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

var connected = false;

function pair(receiverId, key) {
    socket.send(JSON.stringify({
        receiverId: receiverId,
        key: key
    }));
}

},{}]},{},[1]);
