// Implementation of ViolCtrl Websocket API for transmitter devices
function transmitterConnect() {
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

function command(tuid, ruid, command) {
    return {
        type: 'command',
        tuid,
        ruid,
        command
    }
}

// TODO: why do i need to export default here?
export default {
    transmitterConnect,
    pair,
    command
}
