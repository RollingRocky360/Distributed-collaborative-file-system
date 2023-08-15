
import { useContext, useRef } from "react";

import Opened from "./Opened";
import { FileManagerContext } from "./FileManagerContext";
import { WebSocketContext } from "./WebSocketContext";

export default function Editor() {
    const fm = useContext(FileManagerContext);
    const socket = useContext(WebSocketContext)
    const textbox = useRef(null);

    function save() {
        const event = {
            type: 'write',
            filename: fm.currOpen,
            data: textbox.current.innerHTML
        }
        socket.send(JSON.stringify(event));

        fm.setOpenFiles(prev => {
            const next = { ...prev };
            next[fm.currOpen].data = textbox.current.innerText;
            return next;
        })
    }
    
    function handleKeyPress(e) {
        if (fm.currOpen && e.key === 's' && e.ctrlKey) {
            e.preventDefault();
            save();
        }        
    }    

    return (
        <div className="editor">
            <Opened save={save} />
            <pre 
                spellCheck="false"
                ref={textbox}
                name="textarea" 
                id="textarea"
                className="textarea" 
                contentEditable={
                    (fm.currOpen.length !== 0 && fm.openFiles[fm.currOpen] && fm.openFiles[fm.currOpen].writing)
                }                
                onKeyDown={handleKeyPress} >
                {fm.openFiles[fm.currOpen] && fm.openFiles[fm.currOpen].data}
            </pre>
        </div>
    )
}