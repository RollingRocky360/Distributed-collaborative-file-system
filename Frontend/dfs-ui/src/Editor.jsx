
import { useRef } from "react";

import Opened from "./Opened";

export default function Editor(props) {
    const { socket, openFiles, setOpenFiles, currOpen } = props
    const textbox = useRef(null);

    function save() {
        const event = {
            type: 'write',
            filename: currOpen,
            data: textbox.current.innerText
        }
        socket.send(JSON.stringify(event));

        setOpenFiles(prev => {
            const next = { ...prev };
            next[currOpen].data = textbox.current.innerText;
            return next;
        })
    }
    
    function handleKeyPress(e) {
        if (currOpen && e.key === 's' && e.ctrlKey) {
            e.preventDefault();
            save();
        }        
    }    

    return (
        <div className="editor">
            <Opened {...props} save={save} />
            <pre 
                ref={textbox}
                name="textarea" 
                id="textarea" 
                className="textarea" 
                contentEditable={
                    (currOpen.length !== 0 && openFiles[currOpen] && openFiles[currOpen].writing)
                }                
                onKeyDown={handleKeyPress} >
                {openFiles[currOpen] && openFiles[currOpen].data}
            </pre>
        </div>
    )
}