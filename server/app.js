// TODO: Switch to https
const http = require('http')
const path = require('path')
const express = require('express')
const WebSocket = require('ws')

const clientDir = path.join(__dirname, '..', 'client')

const app = express()
// again stupid
app.use('/js', express.static(path.join(clientDir, 'dist', 'js')))
app.use('/css', express.static(path.join(clientDir, 'dist', 'css')))

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(clientDir, 'dist') })
})

const server = http.createServer(app)
const wss = new WebSocket.Server({server})

server.listen(process.env.PORT || 3000, () => {
    console.log('listening on port 3000')
})

let receivers = {
    // we love jessica
    'jessica': {
        socket: {
            send: console.log
        },
        key: 'hotlicks',
        allowedTransmitters: new Set() 
    }
}
let transmitters = {}

wss.on('connection', (ws, req) => {
    ws.metadata = {}

    ws.on('message', (data) => {
        data = JSON.parse(data) 

        if (data.type === 'receiver_connect') {
            // receiver provides their id 
            console.log(ws.metadata)
            let ruid = data.ruid
            ws.metadata.ruid = ruid
            ws.metadata.type = 'receiver'

            receivers[ruid] = {
                socket: ws,
                key: data.key,
                // maybe a set is better? 
                allowedTransmitters: new Set()
            }                 
        }

        else if (data.type === 'transmitter_connect') {
            // transmitter assigned their id
            let tuid = generateTUID()
            ws.metadata.tuid = tuid
            ws.metadata.type = 'transmitter'

            transmitters[tuid] = {
                socket: ws
            } 

            ws.send(JSON.stringify({
                type: 'tuid_assigned',
                tuid
            }))
        }
        else if (data.type === 'pair') {
            // if device is not an established transmitter
            console.log(ws.metadata)
            let tuid = data.tuid
            let ruid = data.ruid

            if (transmitters[tuid] === undefined) {
                console.log(`transmitter ${tuid} does not exist`)
                // define some factory thing to replace this
                ws.send(JSON.stringify({
                    type: 'pair_failed',
                    reason: 1   
                }))
            }
            if (receivers[ruid] === undefined) {
                console.log(`receiver ${ruid} does not exist`)
                ws.send(JSON.stringify({
                    type: 'pair_failed',
                    reason: 2
                }))
            }

            // transmitter supplied correct key
            // TODO: should I protect against pairing correctly more than once,
            // say if someone spams the pair button?
            if (data.key === receivers[data.ruid].key) {
                receivers[ruid].allowedTransmitters.add(tuid)
                ws.send(JSON.stringify({
                    type: 'pair_successful'
                }))
            }
            else {
                ws.send(JSON.stringify({
                    type: 'pair_failed',
                    reason: 0
                }))
            }
        }
        else if (data.type === 'instruction') {
            let tuid = data.tuid
            let ruid = data.ruid
            console.log(data.instruction)
            
            // this check shouldn't be necessary, right?
            // if (receivers[ruid] === undefined) {
            //     console.log(`receiver ${ruid} does not exist`)
            // }

            let receiver = receivers[ruid]
            if (receiver.allowedTransmitters.has(tuid)) {
                receiver.socket.send(data.instruction) 
            }
        }
    })

    ws.on('close', () => {
        // socket closed before the first message was sent 

        if (ws.metadata.type === 'receiver') {
            let ruid = ws.metadata.ruid

            receivers[ruid] = null
            delete receivers[ruid] 
        }
        else if (ws.metadata.type === 'transmitter') {
            let tuid = ws.metadata.tuid

            transmitters[tuid] = null
            delete transmitters[tuid]

            // Remove the transmitter from allowed lists 
            // TODO: is this necessary?
            for (let ruid in receivers) {
                receivers[ruid].allowedTransmitters.delete(tuid)
            }
        }
    })
})

function generateTUID() {
    let part1 = (Math.random() * 46656) | 0
    let part2 = (Math.random() * 46656) | 0
    
    // padding for generated parts are not long enough
    part1 = ('000' + part1.toString(36)).slice(-3)
    part2 = ('000' + part2.toString(36)).slice(-3)

    return part1 + part2
}

