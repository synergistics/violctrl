const semitone = 2**(1/12)

// Note 69 is A4 is 440Hz is the reference point used here
function frequencyToNote(frequency) {
    return 69 + Math.round(Math.log(frequency/440)/Math.log(semitone))
}

function noteToFrequency(note) {
    return 440 + (note-69)*semitone
}

export {
    semitone,
    frequencyToNote,
    noteToFrequency,
}
