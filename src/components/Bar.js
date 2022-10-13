import React, {Fragment, useState} from 'react'
import styled from 'styled-components'
import Thickness from './Thickness'
import ColorPicker from './ColorPicker'
import Shapes from './Shapes'
import '../App.css';

export const Button = styled.button`
  font-size: 20px;
  padding: 5px;
  border: none;
  border-radius: 5px; 
  margin: 0px 2px 0px 2px;
  font-family: Bodoni MT, Times New Roman;
  background: white;
  position: fixed;

  &:hover{
    background: rgba(226, 224, 224, 1);
    text-decoration: none;
    cursor: pointer;
  }
`
export const ButtonRoller = styled.button`
  font-size: 20px;
  padding: 5px;
  border: none;
  border-radius: 5px; 
  margin: 0px 2px 0px 2px;
  font-family: Bodoni MT, Times New Roman;
  background: white;
  position: fixed;
  z-index: 1;
  &:hover{
    background: rgba(226, 224, 224, 1);
    text-decoration: none;
    cursor: pointer;
  }
`

function Bar({setColor, setThickness, setElementType, undo, redo, alertButton, setAction}){    

    const [isOpenColor, setIsOpenColor] = useState(false)
    const [isOpenThickness, setIsOpenThickness] = useState(false)
    const [isOpenShape, setIsOpenShape] = useState(false)

    return(
        <Fragment>
                <div
                    className = "sidebar"
                >
                    <ButtonRoller
                    className="color"
                    onClick={()=>setIsOpenColor(!isOpenColor)}
                    style={{top: '55px', left: '38px'}}
                    >
                        Color
                    <ColorPicker setColor={setColor}/> 
                    </ButtonRoller>

                    <ButtonRoller
                    className="thickness"
                    onClick={()=>setIsOpenThickness(!isOpenThickness)}
                    style={{top: '55px', left: '110px'}}
                    >
                        Thickness
                    { isOpenThickness ? <Thickness setThickness={setThickness}/> : null }
                    </ButtonRoller>

                    <ButtonRoller
                        className="shapes"
                        onClick={()=>setIsOpenShape(!isOpenShape)}
                        style={{top: '55px', left: '210px'}}
                        >
                        Shapes
                    { isOpenShape ? <Shapes setElementType={setElementType}/> : null }
                    </ButtonRoller>

                    <Button
                        style={{top: '55px', left: '286px'}}
                        onClick={()=>setElementType('selection')}
                        >
                        Selection
                    </Button>



                    <div 
                        className="vl"
                        style={{top: '28px', left: '380px'}}
                        >
                    </div>

                    <Button
                        style={{top: '55px', left: '410px'}}
                        onClick={()=>setElementType('pencil')}
                        >
                        Pencil
                    </Button>

                    <Button
                        onClick={()=>{setAction('filling')}}
                        style={{top: '55px', left: '477px'}}>
                        Filling
                    </Button>

                    <Button
                        onClick={()=>setElementType('eraser')}
                        style={{top: '55px', left: '550px'}}>
                        Eraser
                    </Button>

                    <div 
                        className="vl"
                        style={{top: '28px', left: '625px'}}
                        >
                    </div>

                    <Button
                        onClick={()=>alertButton()}
                        style={{top: '55px', left: '655px'}}>
                        Clipping off
                    </Button>

                    <input 
                        type="file"
                        className="insert-file-input"
                        hidden = 'hidden'
                        />
                    <button
                        style={{top: '55px', left: '780px'}}
                        className='insert-button'
                        >
                        Insert image
                    </button>

                    <div className="vl"
                        style={{top: '28px', left: '930px'}}
                        >
                    </div>

                    <Button
                        style={{top: '55px', left: '960px'}}
                        onClick = {()=>setElementType('text')}>
                        Text
                    </Button>

                    <Button
                        style={{top: '55px', left: '1015px'}}
                        >
                        Basket
                    </Button>



                    <button
                        className = 'undo-button'
                        style={{top: '17px', left: '24px'}}
                        onClick = {undo}
                    >
                        Undo
                    </button>

                    <button
                        className = 'redo-button'
                        style={{top: '17px', left: '80px'}}
                        onClick = {redo}
                        >Redo
                    </button>

                </div>
        </Fragment>
    )
}
export default Bar;