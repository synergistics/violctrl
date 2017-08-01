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
        
        this.goodCorrelationThreshold = 0.9 
        this.minRMS = 0.01
        this.bufferLength = 1024
        this.maxSamples = Math.floor(this.bufferLength / 2)
        this.correlations = new Array(this.maxSamples)
        this.sampleRate = this.context.sampleRate
        this.running = false

        this.minPeriod = 2
        this.maxPeriod = this.maxSamples 

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
        requestAnimationFrame(this.update)
    }

    autoCorrelate(audioEvent) {
        if (!this.running) { return }

        let buffer = audioEvent.inputBuffer.getChannelData(0)
        let bufferLength = this.bufferLength
        let maxSamples = this.maxSamples 
        let rms = 0
        // let peak = 0
        let period = 0

        // compute root mean sqaure
        for (let i = 0; i < bufferLength; i++) {
            rms += buffer[i]**2
        }
        rms /= bufferLength

        // is there enough signal?
        if (rms < this.rmsThreshold) {
            return -1 
        }

        let correlation = 0
        for (let i = this.minPeriod; i < this.maxPeriod; i++) {
            for (let j = 0; j < maxSamples; j++) {
                correlation += (buffer[j] - buffer[j + i])**2
            } 
            // console.log(`run ${i}: correlation: ${correlation}`)
        }

        // 2. autocorrelate that shit
        // 3. call onDetect with the computed stats
        // this.onDetect(pitch)
    }
}



// when a pitch is detected, if it matches one of the
// entries in the command map say (437-443 -> forward), 
// send off the command to the server
// so i need a command map. is that passed to this module
// or is it defined here? i think it should be defined here
// because it's not like that main code is changing any time
// soon. for right now, it's not a parametric thing
// it will be later
