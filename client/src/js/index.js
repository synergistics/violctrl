// TODO: TRY LODASH
import { basicChromatic } from './pitch/schemes'
import { PitchDetector, detectionErrors } from './pitch/detection'
import { frequencyToNote } from './pitch/util/conversions'
import * as ctrl from './ctrl'
import * as msg from './messages'

let tuid
let ruid
let paired = false

const socket = new WebSocket(`wss://${location.hostname}:3000`)

socket.addEventListener('open', (event) => {
    // tell server a transmitter is connecting
    let connect = msg.connect()
    socket.send(JSON.stringify(connect))
})

socket.addEventListener('close', () => {
    console.log('done boys')
})

// can I keep tuid local and passed around rather than global?
socket.addEventListener('message', (message) => {
    let data = JSON.parse(message.data)

    if (data.type === 'tuid_assigned') {
        tuid = data.tuid     
    }
    else if (data.type === 'pair_successful') {
        let context = new AudioContext()

        let frequencyElem = document.getElementById('frequency')
        let noteElem = document.getElementById('note')
        let octaveElem = document.getElementById('octave')

        let lastInstruction = ctrl.stop
        let pd = new PitchDetector({
            context,
            bufferLength: 1024,
            onDetect: (stats) => {
                if (stats.error === detectionErrors.NO_ERROR) {
                    let pitch = stats.pitch
                    frequencyElem.innerHTML = pitch.frequency
                    noteElem.innerHTML = pitch.note
                    octaveElem.innerHTML = pitch.octave()

                    let instruction = basicChromatic(pitch)
                    if (!ctrl.isSameInstruction(instruction, lastInstruction)) {
                        // console.log(instruction)
                        let instructionMsg = msg.instruction(tuid, ruid, instruction) 
                        socket.send(JSON.stringify(instructionMsg))

                        lastInstruction = instruction 
                    }
                }
                else {
                    console.log(stats.error)
                    frequencyElem.innerHTML = 'nil'
                    noteElem.innerHTML = 'nil'

                    if (stats.error === detectionErrors.NOT_ENOUGH_SIGNAL) {
                        if (!ctrl.isSameInstruction(lastInstruction, ctrl.stop)) {
                            frequencyElem.innerHTML = 'nil'
                            noteElem.innerHTML = 'nil'

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
        // do some dom stuff 
    }

    console.log(data)
})

let pairButton = document.getElementById('pair')
pairButton.addEventListener('click', function() {
    ruid = document.getElementById('ruid').value
    let key = document.getElementById('key').value

    let pair = msg.pair(tuid, ruid, key)
    socket.send(JSON.stringify(pair))
})
