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
                let pitchElem = document.getElementById('pitch')
                let frequency = stats.frequency
                if (frequency) {
                    pitchElem.innerHTML = frequency
                } else {
                    pitchElem.innerHTML = 'nil' 
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
