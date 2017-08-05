// ratio of two notes a half step apart in 12-tone equal temperament
export const semitone = 2**(1/12)

export function frequencyToNote(f) {
    return 69 + Math.round(Math.log(f/440) / Math.log(semitone))
}

export function noteToFrequency(n) {
    return 440 + (n - 69)*semitone
}

// I think i hate getters and setters
export class Pitch {
    constructor(form) {
        if (form.frequency) {
            this._frequency = form.frequency
        }
        else if (form.note) {
            this._note = form.note 
        }
    }

    static fromFrequency(frequency) {
        return new Pitch({ frequency }) 
    }

    static fromNote(note) {
        return new Pitch({ note }) 
    }

    get frequency() {
        if (this._frequency) {
            return this._frequency 
        }

        if (this._note) {
            this._frequency = 440 + (this._note - 69)*(2**1/12)
            return this._frequency
        }
    }

    get note() {
        if (this._note) {
            return this._note 
        }

        if (this._frequency) {
            this._note = frequencyToNote(this._frequency) 
            return this._note
        }
    }

    get octave() {
        // using getter
        let note = this.note 
        return Math.floor((note - 48) / 12) + 3 
    }

    // probably better to do this on the fly
    // get noteClass() {
    //     if (this._noteClass) {
    //         return this.noteClass 
    //     } 
    //     this._noteClass = note % 11
    //     return this.noteClass 
    // }
}
