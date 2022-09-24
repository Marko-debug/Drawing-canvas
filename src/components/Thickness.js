import React from 'react'

function Thickness({setThickness}){

    return(
     <>
        <div 
        onClick={() => setThickness(1)}
        ><hr style={{border: `3px solid`, margin: `25px 0px 25px 0px`}}/></div>
        <div 
        onClick={() => setThickness(3)}
        ><hr style={{border: `4px solid`, margin: `25px 0px 25px 0px`}}/></div>
        <div 
        onClick={() => setThickness(5)}
        ><hr style={{border: `5px solid`, margin: `25px 0px 25px 0px`}}/></div>
        <div 
        onClick={() => setThickness(7)}
        ><hr style={{border: `6px solid`, margin: `25px 0px 25px 0px`}}/></div>
        <div 
        onClick={() => setThickness(9)}
        ><hr style={{border: `7px solid`, margin: `25px 0px 25px 0px`}}/></div>
     </>
    )
}

export default Thickness;