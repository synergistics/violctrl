// TODO: TRY LODASH
import { basicChromatic } from './pitch/schemes'
import { PitchDetector, detectionErrors } from './pitch/detection'
import { frequencyToNote } from './pitch/util/conversions'
import * as ctrl from './ctrl'
import * as msg from './messages'

let tuid, ruid

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

socket.addEventListener('open', (event) => {
    let connect = msg.connect()
    socket.send(JSON.stringify(connect))
})

socket.addEventListener('close', () => {
    // stop the pitch detector
    console.log('done boys')
})

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
                    elemFrequency.innerHTML = pitch.frequency
                    elemNote.innerHTML = pitch.note

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
