import { frequencyToNote, noteToFrequency } from './util/conversions'

// I think i hate getters and setters
// General rule I'm thinking about here is to only make getters out of properties
// that don't perform any computations beyond saving a value
// Accessing a property and creating it if it doesn't exist is a decent use
// case for a getter under this definition
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

    octave() {
        // using getter
        let note = this.note 
        return Math.floor((note - 48) / 12) + 3 
    }

    noteClass() {
        return this.note % 12
    }
}

export {
    Pitch
}
