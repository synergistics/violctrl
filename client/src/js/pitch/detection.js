/* options:
  configish
  - correlationThreshold
  - rmsThreshold
  -  

  internal variables
  - onDetect() // what to do when pitch is detected
  - context :: AudioContext
  - sampleRate
  - 
*/

import { Pitch } from './pitch'

class PitchDetector {
    constructor(options) {
        this.context = options.context
        this.input = options.input
        
        this.correlationThreshold = 0.9
        this.rmsThreshold = 0.05

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
                // create analyser node with 1 input and 0 outputs
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

        // let prevPitch = this.stats.pitch
        // this.stats = { prevPitch }
        this.stats = {}

        let buffer = audioEvent.inputBuffer.getChannelData(0)
        let bufferLength = this.bufferLength
        let maxSamples = this.maxSamples 
        let rms = 0
        let peak = 0

        // compute root mean sqaure
        for (let i = 0; i < bufferLength; i++) {
            if (buffer[i] > peak) {
                peak = buffer[i] 
            }
            rms += buffer[i]**2
        }
        rms = Math.sqrt(rms/bufferLength) 

        // is there enough signal?
        if (rms < this.rmsThreshold) {
            return;
        }

        let foundPitch = false
        let bestOffset = -1 
        let lastCorrelation = 1
        let bestCorrelation = 0

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
                foundPitch = true
                if (correlation > bestCorrelation) {
                    bestCorrelation = correlation
                    bestOffset = offset
                }
            }
            else if (foundPitch) {
                let prev = this.correlations[bestOffset - 1]
                let next = this.correlations[bestOffset + 1]
                let best = this.correlations[bestOffset]
                let shift = (next - prev) / best 
                shift /= 8

                let frequency = this.sampleRate / (bestOffset + shift)
                
                this.stats.pitch = Pitch.fromFrequency(frequency)
                break
            }
            lastCorrelation = correlation
        }
    }
}

export {
    PitchDetector
}
