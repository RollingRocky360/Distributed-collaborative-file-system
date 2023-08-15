
import { useContext, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { FileManagerContext } from "./FileManagerContext";

export default function Sidebar({ workspace }) {
    const socket = useContext(WebSocketContext)
    const fm = useContext(FileManagerContext)

    const folder = workspace + '/'

    let [addingNew, setAddingNew] = useState(false);

    const openFile = (name) => {

        fm.setCurrOpen(name);
        if (fm.openFiles[name] != null) { return; }
        socket.send(JSON.stringify({
            type: 'read',
            filename: folder + name
        }));
    }

    const deleteFile = (name) => {
        if (fm.lockedFiles.includes(name)) return; 

        if (fm.currOpen === name) {
            fm.setCurrOpen("");
        }

        fm.setFiles((prev) => {
            return prev.filter(item => item !== name);
        });

        if (fm.openFiles[name] != null) {
            fm.setOpenFiles((prev) => {
                delete prev[name];
                return { ...prev };
            });
        }


        socket.send(JSON.stringify({
            type: 'delete',
            filename: folder + name
        }));
    }

    const handleKeyPress = (e) => {
        if (e.keyCode !== 13 || fm.files.includes(e.target.value + '.txt')) { return; }

        const newFile = e.target.value + '.txt';

        setAddingNew(false);
        fm.setFiles(prev => {
            prev = prev.concat(newFile);
            prev.sort();
            return prev;
        });

        const event = {
            type: 'create',
            filename: folder + newFile
        }
        socket.send(JSON.stringify(event));

        fm.setOpenFiles(prev => {
            const next = {...prev};
            next[newFile] = {
                writing: true,
                data: ""
            };
            return next;
        })

        fm.setCurrOpen(newFile);
    }

    return (
        <ul className="sidebar">
            <li className="sidebar-title">
                <h3>Files</h3>
                { addingNew ? 
                    <button className="creation-btn low-emph" onClick={() => setAddingNew(false)}>
                        <span className="material-symbols-outlined">close</span>
                        <span className="btn-text">Cancel</span>
                    </button> : 
                    <button className="creation-btn low-emph" onClick={() => setAddingNew(true)}>
                        <span className="material-symbols-outlined">note_add</span>
                        <span className="btn-text">Add</span>
                    </button> 
                }
            </li>

            { fm.files.length > 0 && fm.files.map( file => (
                <li className="fileitem" key={file}>
                    <span className="material-symbols-outlined">
                        description
                    </span>
                    <span className="filename" onClick={() => openFile(file)}>{file}</span>
                    {fm.lockedFiles.includes(file) ? <span className="material-symbols-outlined">
                        lock
                    </span> : null}
                    <span className="material-symbols-outlined delete" onClick={() => deleteFile(file)}>
                        delete
                    </span>
                </li>
            )) }

            { !addingNew ? 
                null : 
                <li className="input-item">
                    <span className="material-symbols-outlined">
                        description
                    </span>
                    <input type="text" name="newfile" id="newfilename" onKeyUp={handleKeyPress} autoComplete="off" autoFocus/>.txt
                </li> }
        </ul>
    )
}