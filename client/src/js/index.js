// TODO: TRY LODASH
// TODO: SETUP URL HASHES SO THAT HISTORY NAVIGATION ISN'T Broken
import colorString from 'color-string'
import { basicChromatic } from './pitch/schemes'
import { PitchDetector, detectionErrors } from './pitch/detection'
import { frequencyToNote } from './pitch/util/conversions'
import * as ctrl from './ctrl'
import * as msg from './messages'

let tuid, ruid

let elemContainer = document.querySelector('.page-container')
let pagePair = document.querySelector('.page-pair')
let pageCtrl = document.querySelector('.page-ctrl')
let elemFrequency = document.querySelector('#frequency')
let elemNote = document.querySelector('#note')
let elemError = document.querySelector('#error-pair')
let btnPair = document.querySelector('.btn-pair')
let inRUID = document.querySelector('#in-ruid')
let inKey = document.querySelector('#in-key')

btnPair.addEventListener('click', function() {
    elemError.classList.add('invisible')
    ruid = inRUID.value
    let key = inKey.value

    let pair = msg.pair(tuid, ruid, key)
    socket.send(JSON.stringify(pair))
})

const socket = new WebSocket(`wss://${location.hostname}`)
// const socket = new WebSocket(`ws://${location.hostname}:3000`)
console.log(colorString)

socket.addEventListener('open', (event) => {
    let connect = msg.connect()
    socket.send(JSON.stringify(connect))
})

socket.addEventListener('close', () => {
    // stop the pitch detector
    console.log('done boys')
})

let hues = [
    207,
]
socket.addEventListener('message', (message) => {
    let data = JSON.parse(message.data)

    if (data.type === 'tuid_assigned') {
        tuid = data.tuid     
    }
    else if (data.type === 'pair_successful') {
        // change to ctrl screen
        // create the pitch detector
        // the yoosj
        // find a better way to do this man
        pagePair.classList.add('invisible')
        pageCtrl.classList.remove('invisible')

        let context = new AudioContext()

        let lastInstruction = ctrl.stop
        let pd = new PitchDetector({
            context,
            bufferLength: 1024,
            onDetect: (stats) => {
                if (stats.error === detectionErrors.NO_ERROR) {
                    let pitch = stats.pitch
                    elemNote.innerHTML = pitch.noteLetter()
                    elemFrequency.innerHTML = `${pitch.frequency.toFixed(1)} Hz`
                    changeColor(pitch)
                     
                    let instruction = basicChromatic(pitch)
                    if (!ctrl.isSameInstruction(instruction, lastInstruction)) {
                        // console.log(instruction)
                        let instructionMsg = msg.instruction(tuid, ruid, instruction) 
                        socket.send(JSON.stringify(instructionMsg))

                        lastInstruction = instruction 
                    }
                }
                else {
                    // console.log(stats.error)
                    elemFrequency.innerHTML = 'nil'
                    elemNote.innerHTML = 'nil'
                    changeColor(null)
                    if (stats.error === detectionErrors.NOT_ENOUGH_SIGNAL) {
                        if (!ctrl.isSameInstruction(lastInstruction, ctrl.stop)) {
                            let instruction = ctrl.stop
                            let instructionMsg = msg.instruction(tuid, ruid, instruction)
                            socket.send(JSON.stringify(instructionMsg))

                            lastInstruction = instruction
                        }
                    }
                }
            }
        })
    }
    else if (data.type === 'pair_failed') {
        elemError.classList.remove('invisible')
        if (data.reason === 0) {
            elemError.innerHTML = 'incorrect credentials' 
        }
        else if (data.reason === 1) {
            elemError.innerHTML = 'internal error, transmitter does not exist' 
        }
        else if (data.reason === 2) {
            elemError.innerHTML = `receiver ${ruid} is not up` 
        }
        inKey.value = ''

    }

    console.log(data)
})


function changeColor(pitch) {
    if (pitch === null) {
        elemContainer.style.background = '#FFFFFF' 
        elemNote.style.color = '#000000' 
        elemFrequency.style.color = '#000000' 
        return
    }
    let h = ((230 + pitch.noteClass()*30) % 360) / 360
    let s = Math.min(1, (pitch.octave() + 1) / 10)
    let l = 0.6
    let bgColor = hslToRgb(h,s,l)
    let fgColor = hslToRgb(h,s,l-0.2)
    // console.log(bgColor, fgColor)
    let bgString = colorString.to.hex(bgColor)
    let fgString = colorString.to.hex(fgColor)
    elemContainer.style.background = bgString
    elemNote.style.color = fgString
    elemFrequency.style.color = fgString
}

// stolen from stackoverflow
// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
