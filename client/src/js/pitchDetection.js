/* options:
  configish
  - goodCorrelationThreshold
  - rmsThreshold
  -  

  internal variables
  - onDetect() // what to do when pitch is detected
  - context :: AudioContext
  - sampleRate
  - 
*/

export class PitchDetector {
    constructor(options) {
        this.context = options.context
        this.input = options.input
        
        this.correlationThreshold = 0.9
        this.rmsThreshold = 0.01

        this.bufferLength = 1024
        this.maxSamples = Math.floor(this.bufferLength/2)
        this.correlations = new Array(this.maxSamples)
        this.sampleRate = this.context.sampleRate
        this.running = false

        this.onDetect = options.onDetect

        this.minPeriod = 2
        this.maxPeriod = this.maxSamples 

        this.stats = {}

        // binding. shouldn't be an issue
        // an issue would arise if there were some situation where
        // the function should bind to it's calling contexts.
        // for all purposes so far, the only context that matters is
        // the instance of PitchDetector
        this.update = this.update.bind(this)
        this.autoCorrelate = this.autoCorrelate.bind(this)

        if (options.input === undefined) {
            this.getLiveInput((err, stream) => {
                if (err) {
                    // iDunno() 
                } 
                this.input = this.context.createMediaStreamSource(stream)
                // maybe more complex analysers can be passed as an option.
                // they can be like decorators for autoCorrelate that can do extra jazz
                this.analyser = this.context.createScriptProcessor(this.bufferLength, 1, 0)
                this.analyser.onaudioprocess = this.autoCorrelate
                this.start()        
            })
        }

    } 

    getLiveInput(cb) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                cb(null, stream)
            })
            .catch((err) => {
                console.log('getUserMedia exception')
                cb(err, null)
            })
    }

    start() {
        this.input.connect(this.analyser) 

        if (!this.running) {
            this.running = true
            requestAnimationFrame(this.update)
        }
    }

    update() {
        if (this.running) {
            this.onDetect(this.stats)
            requestAnimationFrame(this.update)
        }
    }

    autoCorrelate(audioEvent) {
        if (!this.running) { return }

        let buffer = audioEvent.inputBuffer.getChannelData(0)
        let bufferLength = this.bufferLength
        let maxSamples = this.maxSamples 
        let rms = 0

        // compute root mean sqaure
        for (let i = 0; i < bufferLength; i++) {
            rms += buffer[i]**2
        }
        rms /= bufferLength

        // is there enough signal?
        if (rms < this.rmsThreshold) {
            this.stats.frequency = null 
            return;
        }

        let foundPitch = false
        let bestOffset = -1 
        let lastCorrelation = 0
        let bestCorrelation = 0
        // let closestMatches = [] 
        for (let offset = this.minPeriod; offset < this.maxPeriod; offset++) {
            let correlation = 0
            for (let i = 0; i < maxSamples; i++) {
                // correlation += Math.abs(buffer[j] - buffer[j + i])
                correlation += (buffer[i] - buffer[i + offset])**2
            } 
            correlation = 1 - (correlation / maxSamples)**0.5
            // correlation = 1 - Math.sqrt(correlation / maxSamples)
            this.correlations[offset] = correlation

            if (correlation > lastCorrelation &&
                correlation > this.correlationThreshold) {
                if (correlation > bestCorrelation) {
                    foundPitch = true
                    bestCorrelation = correlation
                    bestOffset = offset
                }

                // closestMatches.push({
                //     period: offset,
                //     correlation
                // })
                    // console.log(correlation, lastCorrelation)
                    // foundPitch = true
            }

            else if (foundPitch) {
                break
            }

            lastCorrelation = correlation
        }

        // if (closestMatches.length > 0) {
        //     let closestMatch = closestMatches.reduce((a,b) => {
        //         return a.correlation > b.correlation ? a : b 
        //     })
        //     console.log(closestMatch)
        // }

        this.stats = { rms }
        if (foundPitch) {

            let prev = this.correlations[bestOffset - 1]
            let next = this.correlations[bestOffset + 1]
            let shift = (next - prev) / this.correlations[bestOffset]
            shift /= 8

            if (Number.isNaN(shift)) {
                this.stats.frequency = null
                return
            }

            this.stats.frequency = this.sampleRate / (bestOffset + shift)
        }
        else {
            this.stats.frequency = null 
        }
    }
}

function pitchToNote() {
    
}


// when a pitch is detected, if it matches one of the
// entries in the command map say (437-443 -> forward), 
// send off the command to the server
// so i need a command map. is that passed to this module
// or is it defined here? i think it should be defined here
// because it's not like that main code is changing any time
// soon. for right now, it's not a parametric thing
// it will be later
