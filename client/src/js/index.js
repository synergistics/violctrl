// TODO: TRY LODASH
import { basicChromatic } from './pitchSchemes'
import { PitchDetector } from './pitchDetection'
import { frequencyToNote } from './util/notes'
import { speedsLR } from './ctrlCommands'
import messaging from './messaging'

let tuid
let ruid
let paired = false
const socket = new WebSocket(`ws://${location.hostname}:3000`)

socket.addEventListener('open', (event) => {
    // tell server a transmitter is connecting
    let transmitterMsg = JSON.stringify(messaging.transmitterConnect())
    socket.send(transmitterMsg)
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
                    let commandMsg = JSON.stringify(messaging.command(tuid, ruid, command))
                    socket.send(commandMsg)
                    
                    // if the current note is different from previous 
                    // if (prevPitch && pitch.note !== prevPitch.note) {
                    //     let command = basicChromatic(pitch) 
                    //     console.log(command)
                    //     let commandMsg = JSON.stringify(messaging.command(tuid, ruid, command))
                    //     socket.send(commandMsg)
                    // }
                }
                else {
                    frequencyElem.innerHTML = 'nil'
                    noteElem.innerHTML = 'nil'

                    let command = speedsLR(0, 0)
                    let commandMsg = JSON.stringify(messaging.command(tuid, ruid, command))
                    socket.send(commandMsg)
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
    let pairMsg = JSON.stringify(messaging.pair(tuid, ruid, key))

    socket.send(pairMsg)
})
