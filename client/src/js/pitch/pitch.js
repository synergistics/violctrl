import { frequencyToNote, noteToFrequency } from './util/conversions'

// I think i hate getters and setters
class Pitch {
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
            this._frequency = noteToFrequency(this._note) 
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

export {
    Pitch
}
