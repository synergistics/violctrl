// Implementation of ViolCtrl Websocket API for transmitter devices
function connect() {
    return {
        type: 'transmitter_connect'
    } 
}

function pair(tuid, ruid, key) {
    return {
        type: 'pair',
        tuid,
        ruid,
        key
    } 
}

function instruction(tuid, ruid, instruction) {
    return {
        type: 'command',
        tuid,
        ruid,
        instruction
    }
}

// TODO: why do i need to export default here?
export {
    connect,
    pair,
    instruction
}
