import React from 'react';

function Shapes({setElementType}){
    return(
    <>
        <div onClick={()=>setElementType('line')}>Line</div>
        <div onClick={()=>setElementType('circle')}>Circle</div>
        <div onClick={()=>setElementType('triangle')}>Trojuholink</div>
        <div onClick={()=>setElementType('rectangle')}>Rectangle</div>
    </>
    )
}

export default Shapes;