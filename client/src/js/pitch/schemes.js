/* Module Description:
 * Functions that map frequencies to commands for the RPi
 */

import { speedsLR } from '../ctrl'


// really obscure pitch scheme specific for viola 
// TODO: generalize
function basicChromatic(pitch) { 
    let octave = pitch.octave
    // note 0 through 11 (C C# ... B) 
    let noteClass = pitch.note % 12
    // console.log(noteClass)

    let leftSpeed
    let rightSpeed
    let scaleFactor

    if ([0,1,2,3].includes(noteClass)) {
        leftSpeed = 1 
    }
    else if ([4,5,6,9].includes(noteClass)) {
        leftSpeed = -1 
    }
    else if ([8,11].includes(noteClass)) {
        leftSpeed = 1/2 
    }
    else if ([7,10].includes(noteClass)) {
        leftSpeed = -1/2 
    }

    if ([0,9,10,11].includes(noteClass)) {
        rightSpeed = 1 
    }
    else if ([3,6,7,8].includes(noteClass)) {
        rightSpeed = -1 
    }
    else if ([1,4].includes(noteClass)) {
        rightSpeed = 1/2 
    }
    else if ([2,5].includes(noteClass)) {
        rightSpeed = -1/2 
    }

    // console.log(leftSpeed, rightSpeed)

    if (octave === 3) {
        scaleFactor = 0.5    
        return speedsLR(leftSpeed*scaleFactor, rightSpeed*scaleFactor)
    }
    else if (octave === 4) {
        scaleFactor = 0.85    
        return speedsLR(leftSpeed*scaleFactor, rightSpeed*scaleFactor)
    }
    else if (octave === 5) {
        scaleFactor = 1
        return speedsLR(leftSpeed*scaleFactor, rightSpeed*scaleFactor)
    }

}

export {
    basicChromatic    
}
