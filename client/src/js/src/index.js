let tuid;
let paired = false
const socket = new WebSocket(`ws://${location.hostname}:3000`)

socket.addEventListener('open', (event) => {
    socket.send(JSON.stringify({ 
        type: 'transmitter_connect',
    }))
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
        // startAudio()
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
    let ruid = document.getElementById('ruid').value
    let key = document.getElementById('key').value

    socket.send(JSON.stringify({
        type: 'pair',
        tuid,
        ruid,
        key
    }))
})

function handleConnectionError(error) {
    switch (error.type) {
        case 'bad credentials': {
            console.log('couldn\'t pair to device')
            break 
        } 
    } 
}

let connected = false

function pair(receiverId, key) {
    socket.send(JSON.stringify({
        receiverId,
        key
    }))
}
