
export default function Opened(props) {
    const { socket, openFiles, setOpenFiles, currOpen, setCurrOpen, save, lockedFiles } = props;

    function close(name) {
        const event = {
            type: 'close',
            filename: name
        }
        setCurrOpen('');
        socket.send(JSON.stringify(event));
        setOpenFiles(prev => {
            delete prev[name];
            return { ...prev }
        })
    }

    function lock() {
        setOpenFiles(prev => {
            const next = {...prev};
            next[currOpen].writing = true;
            return next;
        })
        socket.send(JSON.stringify({
            type: 'lock',
            filename: currOpen
        }));
    }

    function unlock() {
        setOpenFiles(prev => {
            const next = { ...prev };
            next[currOpen].writing = false;
            return next;
        })
        socket.send(JSON.stringify({
            type: 'unlock',
            filename: currOpen
        }));
    }

    return (
        <div className="top-bar">
            <ul className="opened">
                {Object.keys(openFiles).map(name => {
                    return (
                        <li className={`opened-file-item ${currOpen === name ? "curr-edit" : ""}`} key={name}>
                            <span className="opened-file-name" onClick={() => setCurrOpen(name)}>{name}</span>
                            <span style={{ fontSize: ".8rem" }} className="material-symbols-outlined close" onClick={() => close(name)}>
                                close
                            </span>
                        </li>
                    )
                })}
            </ul>
            
            {currOpen && !lockedFiles.includes(currOpen) &&
                <div className="op-btns">
                    { openFiles[currOpen] && openFiles[currOpen].writing ?
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