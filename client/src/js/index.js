import { basicChromatic } from './pitchSchemes'
import { PitchDetector } from './pitchDetection'
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
        let pd = new PitchDetector({
            context,
            bufferLength: 1024,
            onDetect: (stats) => {
                // do DOM stuff
                // convert pitches to commands
                // do socket stuff

                let pitchElem = document.getElementById('pitch')
                let rmsElem = document.getElementById('rms')
                let volumeElem = document.getElementById('volume')
                rmsElem.innerHTML = stats.rms
                volumeElem.innerHTML = stats.peak
                let frequency = stats.frequency
                pitchElem.innerHTML = frequency
                if (frequency) {
                    // let command = commands.schemes.basicChromatic(frequency) 
                } else {
                    // pitchElem.innerHTML = 'nil' 
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
