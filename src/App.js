import React, { useRef, useEffect, useState, Fragment, useLayoutEffect} from 'react';
import Bar from './components/Bar';
import rough from "roughjs/bundled/rough.esm";
import getStroke from "perfect-freehand";

const generator = rough.generator();

const createElement = (id, x1, y1, x2, y2, type, thickness, color) => {
    switch(type){
      case'line':
      case 'rectangle':
        const roughElement = 
          type === 'line'
            ? generator.line(x1, y1, x2, y2, {strokeWidth: thickness, stroke: color})
            : generator.rectangle(x1, y1, x2 - x1, y2 - y1, {strokeWidth: thickness, stroke: color, fill: color});  
        return { id, x1, y1, x2, y2, type, roughElement}; 
      case'eraser':
        return {id, type, points: [{x: x1, y: y1}]}
      case 'pencil':
        return {id, type, points: [{x: x1, y: y1}], size: thickness};
      case 'text':
        return {id, type, x1, y1, x2, y2 ,text: '' }
      default:
        throw new Error(`Type not recognised: ${type}`)
  }
}

function nearPoint(x, y, x1, y1, name){
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
}

const onLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x, y};
  const offset = distance(a, b) - (distance(a, c) + distance(b, c));
  return Math.abs(offset) < maxDistance ? 'inside' : null;
}

const cursorForPosition = position => {
  switch (position){
    case 'tl':
    case 'br':
    case 'start':
    case 'end':
      return 'nwse-resize';
    case 'tr':
    case 'bl':
      return 'nesw-resize';
    default:
      return 'move';
  }
}

const resizedCoordinates = (clientX, clientY, position, coordinates) => {
  const {x1, y1, x2, y2} = coordinates;
  switch(position) {
    case 'tl':
    case 'start':
      return {x1: clientX, y1: clientY, x2, y2};
    case 'tr':
      return {x1, y1: clientY, x2:clientX, y2};
    case 'bl':
      return {x1: clientX, y1, x2, y2: clientY};
    case 'br':
    case 'end':
      return {x1, y1, x2:clientX, y2:clientY };
    default:
      return null; //should not really get here...
  }
}

const positionWithinElement = (x, y, element) => {
  const {type, x1, x2, y1, y2 } = element;
  
  switch(type){
    case 'line':
      const on = onLine(x1, x2, y1, y2, x, y);
      const start = nearPoint(x, y, x1, y1, 'start');
      const end = nearPoint(x, y, x2, y2, 'end');
      return start || end || on;
    case 'rectangle':
      const topLeft = nearPoint(x, y, x1, y1, 'tl')
      const topRight = nearPoint(x, y, x2, y1, 'tr')
      const bottomLeft = nearPoint(x, y, x1, y2, 'bl')
      const bottomRight = nearPoint(x, y, x2, y2, 'br')
      const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? 'inside' : null;
      return topLeft || topRight || bottomLeft || bottomRight || inside; 
    case 'pencil':
      const betweenAnyPoint = element.points.some((point, index)=>{
        const nextPoint = element.points[index + 1];
        if(!nextPoint) return false;
        return onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null;
      });
      return betweenAnyPoint ? 'inside' : null;
    case 'text':
       return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? 'inside' : null;
    default:
      throw new Error(`Type not recognised: ${type}`)
  }
};

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getElementAtPosition = (x, y, elements)=>{
  return elements
    .map(element => ({...element, position: positionWithinElement(x, y, element)}))
    .find(element => element.position !== null);
}

const adjustElementCoordinates = element => {
  const {type, x1, y1, x2, y2} = element;
  if(type === 'rectangle'){
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return {x1:minX, y1:minY, x2: maxX, y2: maxY };
  }else{
    if(x1 < x2 || (x1 === x2 && y1 < y2)){
      return {x1, y1, x2, y2};
    }else{
      return {x1:x2, y1:y2, x2: x1, y2: y1};
    }
  }
}

const useHistory = (initialState) => {
  const [index, setIndex] = useState(0)
  const [history, setHistory] = useState([initialState]); 

  const setState = (action, overwrite = false) => {
    const newState = typeof action === 'function' ? action(history[index]) : action;
    if(overwrite){
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    }else{
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, newState]);
      setIndex(prevState => prevState + 1); 
    }
  }

  const undo = () => {index > 0 && setIndex(prevState => prevState - 1);}
  const redo = () => {index < history.length - 1 && setIndex(prevState => prevState + 1)}

  return [history[index], setState, undo, redo];
}

const getSvgPathFromStroke = stroke => {
  if(!stroke.length) return ''

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  )

  d.push('Z');
  return d.join(' ');
};

const drawElement = (roughCanvas, context, element, thickness)=>{
  switch(element.type){
    case 'line':
    case 'rectangle':
      roughCanvas.draw(element.roughElement)
      break;
    case 'pencil':
      const stroke = getSvgPathFromStroke(getStroke(element.points))
      context.fill(new Path2D(stroke))
      break;
    case 'eraser':
      eraser(element, context)
      break;
    case 'text':
      context.textBaseLine = 'top';
      context.font = '24px sans-serif';
      context.fillText(element.text, element.x1, element.y1);
      break;
    default: 
      throw new Error(`Type not recognised: ${element.type}`)
  }
}

const eraser = (element, context) => {

  const points = element.points;
  points.forEach(point => {

    context.clearRect(point.x, point.y, 20, 20);
  })
  //canvasRef.current.globalCompositeOperation = 'destinvation-over';
}

const alertButton = () => {alert("I am not still working");}

const adjustmentRequired = type => ['line', 'rectangle', 'eraser'].includes(type);

function App() {
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const textAreaRef = useRef();
  
  const [color, setColor] = useState(`#ff0000`);
  const [thickness, setThickness] = useState(5);
  
  const [elements, setElements, undo, redo] = useHistory([])
  const [action, setAction] = useState('none')
  const [elementType, setElementType] = useState('pencil')
  const [selectedElement, setSelectedElement] = useState(null)
  
  useEffect(() => { 
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    
    const context = canvas.getContext("2d")
    context.scale(2,2);
    context.lineCap = "round"
    
    context.lineWidth = 5; 
    contextRef.current = context;
  }, [])

  
  /*useEffect(() => {
    if(canvasRef.current == null) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d")
    
    context.strokeStyle = color;
  }, [color])
  
  
  useEffect(() => {
    if(canvasRef.current == null) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d")
    
    context.lineWidth = thickness; 
    
  }, [thickness])
  */
 

 useLayoutEffect(()=>{
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    const roughCanvas = rough.canvas(canvas);
    
    elements.forEach(element => {
      if(action === 'writing' && selectedElement.id === element.id) return;
      drawElement(roughCanvas, context, element)
    });
  }, [elements, action, selectedElement, thickness, color])

  
  useEffect(()=>{
    const undoRedoFunction = event => {
      if((event.metaKey || event.ctrlKey) && event.key === 'z'){
        if(event.shiftKey){
          redo();
        }else{
          undo();
        }
      }
    }
    document.addEventListener('keydown', undoRedoFunction);
    return () => {
      document.removeEventListener('keydown', undoRedoFunction);
    }
  }, [undo, redo])

  useEffect(() => {
    const textArea = textAreaRef.current;
    if(action === 'writing') {
      textArea.focus();
      textArea.value = selectedElement.text;
    }
  }, [action, selectedElement])
  
  const updateElement = (id, x1, y1, x2, y2, type, options) => {
    const elementsCopy = [...elements];

    switch(type){
      case 'line':
        case 'rectangle':
          console.log(id)
          console.log(x1)
          elementsCopy[id] = createElement(id, x1, y1, x2, y2, type, thickness, color);
          break;
      case 'pencil':
        elementsCopy[id].points = [...elementsCopy[id].points, {x:x2, y: y2}]
        break;
      case 'eraser':
        elementsCopy[id].points = [...elementsCopy[id].points, {x:x2, y: y2}]
        break;
      case 'text':
        const textWidth = document.getElementById('canvas').getContext('2d').measureText(options.text).width;
        const textHeight = 24;
        elementsCopy[id] = {...createElement(id, x1, y1, x1 + textWidth , y1 + textHeight, type), text: options.text};
        break;
        default:
          throw new Error(`Type not recognised: ${type}`)
      }
      setElements(elementsCopy, true);
  } 
  
  
  const startDrawing = (event) => {
    if(action === 'writing')return; 

    const {clientX, clientY} = event;

    if(elementType === 'selection'){
      const element = getElementAtPosition(clientX, clientY, elements)
      if(element){
        if(element.type === 'pencil'){
          const xOffsets = element.points.map(point => clientX - point.x);
          const yOffsets = element.points.map(point => clientY - point.y);
          setSelectedElement({...element, xOffsets, yOffsets});
        }else{
          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;
          setSelectedElement({...element, offsetX, offsetY});
        }
        setElements(prevState => prevState);
        
        if(element.position === 'inside'){
          setAction('moving')
        }
        else{
          setAction('resizing');
        }
      }
    }
    else if(elementType === 'eraser'){
      
      const id = elements.length;
      const element = createElement(id, clientX, clientY, clientX, clientY, elementType)
      setElements(prevState => [...prevState, element]);
      setSelectedElement(element);

      setAction('erasing')

    }else{
      /*contextRef.current.beginPath()
      contextRef.current.moveTo(clientX, clientY)*/
      const id = elements.length;
      const element = createElement(id, clientX, clientY, clientX, clientY, elementType, thickness, color); 
      setElements(prevState => [...prevState, element]);
      setSelectedElement(element)

      setAction(elementType === 'text' ? 'writing' : 'drawing');
    }
  }
  
  const finishDrawing = (event) => {
    const {clientX, clientY} = event;
    if(selectedElement){
      if(selectedElement.type === 'text' &&
        clientX - selectedElement.offsetX === selectedElement.x1 && 
        clientY - selectedElement.offsetY === selectedElement.y1
        ) {
        setAction('writing');
        return;
      }

      const index = selectedElement.id;
      const {id, type} = elements[index];

      if((action === 'drawing' || action === 'resizing' || action === 'erasing') && adjustmentRequired(type)){
        const {x1, y1, x2, y2} = adjustElementCoordinates(elements[index]);
        updateElement(id, x1, y1, x2, y2, type);
      }
    }
    
    
    if(action === 'writing') return;


    setAction('none');
    setSelectedElement(null);
  }

  
  const draw = (event) => {
    const {clientX, clientY} = event; 

    if (elementType === 'selection'){
      const element = getElementAtPosition(clientX, clientY, elements)
      event.target.style.cursor = element ? cursorForPosition(element.position) : 'default';
    }
    
    if(action === 'drawing'){

      /*contextRef.current.lineTo(clientX, clientY)
      contextRef.current.stroke();
    */
      const index = elements.length - 1;
      const {x1, y1} = elements[index];
      updateElement(index, x1, y1, clientX, clientY, elementType);

    }else if(action === 'erasing'){

      const index = elements.length -1;
      const {x1, y1} = elements[index];
      updateElement(index, x1, y1, clientX, clientY, elementType);

    }else if(action === 'moving'){
      if(selectedElement.type === 'pencil'){
        const newPoints = selectedElement.points.map((_, index) => ({
          x: clientX - selectedElement.xOffsets[index],
          y: clientY - selectedElement.yOffsets[index],
        }))
        const elementsCopy = [...elements];
        elementsCopy[selectedElement.id] = {...elementsCopy[selectedElement.id], points: newPoints,}
        setElements(elementsCopy, true)
      }else{
        const {id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
        const width = x2 - x1;
        const height = y2 - y1;
        const nexX1 = clientX - offsetX;
        const nexY1 = clientY - offsetY;
        const options = type === 'text' ? {text: selectedElement.text}: {};
        updateElement(id, nexX1, nexY1, nexX1 + width, nexY1 + height, type, options);
      }
    }else if(action === 'resizing'){
      const {id, type, position, ...coordinates } = selectedElement;
      const {x1, y1, x2, y2} = resizedCoordinates(clientX, clientY, position, coordinates);
      updateElement(id, x1, y1, x2, y2, type);
    }
  }                                             

  /*function changeName(){
    const btn = document.querySelector('.btn-openr');
    if(btn == null) return
    
    btn.addEventListener('click', ()=>{
      
      const initialText = 'Open';
      if(btn.textContent.toLowerCase().includes(initialText.toLowerCase()))
        btn.textContent = 'X';d
      else{
        btn.textContent = initialText;
      }
    })
  }*/

  const handleBlur = (event) => {
    const {id, x1, y1, type} = selectedElement;
    setAction('none');
    setSelectedElement(null);
    updateElement(id, x1, y1, null, null, type, { text: event.target.value});   
  }

  return (
    <Fragment>

      <Bar setColor={setColor} setThickness={setThickness} setElementType={setElementType} undo={undo} redo={redo} alertButton={alertButton}/>

      {action === "writing" ? (
        <textarea
          ref={textAreaRef}
          onBlur={handleBlur}
          style={{
            position: "fixed",
            top: selectedElement.y1 - 2,
            left: selectedElement.x1,
            font: "24px sans-serif",
            margin: 0,
            padding: 0,
            border: 0,
            outline: 0,
            resize: "auto",
            overflow: "hidden",
            whiteSpace: "pre",
            background: "transparent",
          }}
        />
      ) : null}

      <canvas
        id = "canvas"
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        ref={canvasRef}
        />
    </Fragment>
  );
}

export default App;