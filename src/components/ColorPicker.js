import React from 'react'

function ColorPicker({setColor}){
  return(
    <div>
      <input
        type="color"
        className="picker"
        // value="#e66465"
        onChange={e=>{setColor(e.target.value)}}

        />
    </div>
  ) 
}

 
export default ColorPicker