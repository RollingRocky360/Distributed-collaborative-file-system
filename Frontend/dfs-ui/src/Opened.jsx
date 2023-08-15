import { useContext } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { FileManagerContext } from "./FileManagerContext";

export default function Opened({ save }) {
    const socket = useContext(WebSocketContext);
    const fm = useContext(FileManagerContext);

    function close(name) {
        const event = {
            type: 'close',
            filename: name
        }
        fm.setCurrOpen('');
        socket.send(JSON.stringify(event));
        fm.setOpenFiles(prev => {
            delete prev[name];
            return { ...prev }
        })
    }

    function lock() {
        fm.setOpenFiles(prev => {
            const next = {...prev};
            next[fm.currOpen].writing = true;
            return next;
        })
        socket.send(JSON.stringify({
            type: 'lock',
            filename: fm.currOpen
        }));
    }

    function unlock() {
        fm.setOpenFiles(prev => {
            const next = { ...prev };
            next[fm.currOpen].writing = false;
            return next;
        })
        socket.send(JSON.stringify({
            type: 'unlock',
            filename: fm.currOpen
        }));
    }

    return (
        <div className="top-bar">
            <ul className="opened">
                {Object.keys(fm.openFiles).map(name => {
                    return (
                        <li className={`opened-file-item ${fm.currOpen === name ? "curr-edit" : ""}`} key={name}>
                            <span className="opened-file-name" onClick={() => fm.setCurrOpen(name)}>{name}</span>
                            <span style={{ fontSize: ".8rem" }} className="material-symbols-outlined close" onClick={() => close(name)}>
                                close
                            </span>
                        </li>
                    )
                })}
            </ul>
            
            {fm.currOpen && !fm.lockedFiles.includes(fm.currOpen) &&
                <div className="op-btns">
                    { fm.openFiles[fm.currOpen] && fm.openFiles[fm.currOpen].writing ?
                        <button id="edit" className="med-emph" onClick={unlock}>
                            <span class="material-symbols-outlined">
                            lock_open
                            </span>
                            <span className="btn-text">Unlock</span>
                        </button> :
                        <button id="edit" className="med-emph" onClick={lock}>
                            <span class="material-symbols-outlined">
                                edit_document
                            </span>
                            <span className="btn-text">Edit</span>
                        </button> 
                    }   
                    <button id="save" className="high-emph" onClick={save}>
                        <span class="material-symbols-outlined">
                            save
                        </span>
                        <span className="btn-text">Save</span>
                    </button>
                </div>
            }
        </div>
    )
}