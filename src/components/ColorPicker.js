import React from 'react'

function ColorPicker({setColor}){
  return(
    <div>
      <input
        type="color"
        className="picker"
        // value="#e66465"
        onChange={e=>{console.log("change");setColor(e.target.value); console.log(e.target.value)}}

        />
    </div>
  ) 
}

 
export default ColorPicker