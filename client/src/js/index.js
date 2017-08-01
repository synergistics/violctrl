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
                console.log(stats.frequency) 
            }
        })
    }
    else if (data.type === 'pair_failed') {
        // do some dom stuff 
    }

    console.log(data)
})

function runThing(pd) {
    pitch = pd.currentPitch()
    // note = PitchDetector.toNote(pitch)
    console.log(pd)
    

    // requestAnimationFrame(() => runThing(pd))
}

let pairButton = document.getElementById('pair')
pairButton.addEventListener('click', function() {
    ruid = document.getElementById('ruid').value
    let key = document.getElementById('key').value
    let pairMsg = JSON.stringify(messaging.pair(tuid, ruid, key))

    socket.send(pairMsg)
})

function handleConnectionError(error) {
    switch (error.type) {
        case 'bad credentials': {
            console.log('couldn\'t pair to device')
            break 
        } 
    } 
}
