import pitchDetection from './pitchDetection'
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

// can I keep tuid local and passed around rather than global?
socket.addEventListener('message', (message) => {
    let data = JSON.parse(message.data)

    if (data.type === 'tuid_assigned') {
        tuid = data.tuid     
    }
    else if (data.type === 'pair_successful') {
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
    }
    else if (data.type === 'pair_failed') {
        // do some dom stuff 
    }

    console.log(data)
})

socket.addEventListener('close', () => {
    console.log('done boys')
})

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
