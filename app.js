// TODO: Switch to https
const http = require('http')
const path = require('path')
const express = require('express')
const WebSocket = require('ws')

const app = express()
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile('index.html')
})

const server = http.createServer(app)
const wss = new WebSocket.Server({server})

server.listen(3000, () => {
    console.log('listening on port 3000')
})

let receivers = {}
let transmitters = {}

wss.on('connection', (ws, req) => {
    ws.on('message', (message) => {
        message = JSON.parse(message) 

        let id = message.id
        ws.metadata = { id }

        switch (message.type) {
            case 'receiver': {
                receivers[id] = {
                    socket: ws,
                    key: message.key,
                    // maybe a set is better? 
                    allowedTransmitters: [] 
                }                 
                
                ws.metadata.type = 'receiver'
                break;
            }

            case 'transmitter': {
                transmitters[id] = {
                    socket: ws
                } 
                
                ws.metadata.type = 'transmitter'
                break;
            }

            case 'pair': {
                // if device is not an established transmitter
                let receiverId = message.receiverId
                // TODO: abstract out this undefined check
                if (transmitters[id] === undefined) {
                    throw new Error(`transmitter ${id} does not exist`)                      
                }
                if (receivers[receiverId] === undefined) {
                    throw new Error(`receiver ${receiverId} does not exist`)                      
                }

                // transmitter supplied correct key
                if (message.key === receivers[message.receiverId].key) {
                    receivers[receiverId].allowedTransmitters.push(id)
                }
                else {
                    throw new Error(`wrong credentials`) 
                }
                break;
            }

            case 'command': {
                let receiverId = message.receiverId
                if (receivers[receiverId] === undefined) {
                    throw new Error(`receiver ${receiverId} does not exist`)                      
                }

                let receiver = receivers[receiverId]
                if (receiver.allowedTransmitters.indexOf(id) > -1) {
                    receiver.socket.send(message.command) 
                }
                break;
            }
        }
    })

    ws.on('close', () => {
        let id = ws.metadata.id

        if (ws.metadata.type === 'receiver') {
            receivers[id] = null
            delete receivers[id] 
        }
        else if (ws.metadata.type === 'transmitter') {
            transmitters[id] = null
            delete transmitters[id]

            for (let receiver in receivers) {
                let index = receiver.allowedTransmitters.indexOf(id)
                if (id > -1) {
                    receiver.allowedTransmitters.splice(index, 1) 
                } 
            }
        }
    })
})
