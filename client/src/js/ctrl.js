const stop = speedsLR(0,0)

function speedsLR(leftSpeed, rightSpeed) {
    return {
        type: 'speedsLR',
        leftSpeed,
        rightSpeed
    }
}

function isSameInstruction(i1, i2) {
    if (i1.type !== i2.type) {
        return false 
    }

    switch (i1.type) {
        case 'speedsLR': {
            return (i1.leftSpeed === i2.leftSpeed) &&
                   (i1.rightSpeed === i2.rightSpeed)
                
        } 
    }
}

export {
    isSameInstruction,
    speedsLR,
    stop
}
