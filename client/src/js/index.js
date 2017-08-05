// TODO: TRY LODASH
import { basicChromatic } from './pitch/schemes'
import { PitchDetector } from './pitch/detection'
import { frequencyToNote } from './pitch/util/conversions'
import { speedsLR } from './ctrl'
// maybe turn transmitter into a class?
import * as msg from './messages'

let tuid
let ruid
let paired = false
const socket = new WebSocket(`ws://${location.hostname}:3000`)

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

        let pd = new PitchDetector({
            context,
            bufferLength: 1024,
            onDetect: (stats) => {
                // let prevPitch = stats.prevPitch
                let pitch = stats.pitch
                if (pitch) {
                    frequencyElem.innerHTML = pitch.frequency
                    noteElem.innerHTML = pitch.note
                    octaveElem.innerHTML = pitch.octave

                    let command = basicChromatic(pitch) 
                    console.log(command)
                    let instruction = msg.instruction(tuid, ruid, command)
                    socket.send(JSON.stringify(instruction))
                }
                else {
                    frequencyElem.innerHTML = 'nil'
                    noteElem.innerHTML = 'nil'

                    let instruction = msg.instruction(tuid, ruid, speedsLR(0,0))
                    socket.send(JSON.stringify(instruction))
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
