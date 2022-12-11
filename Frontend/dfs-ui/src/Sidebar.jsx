
import { useState } from "react";

export default function Sidebar(props) {
    const { socket, files, currOpen, setCurrOpen, lockedFiles, openFiles, setOpenFiles, setFiles } = props;
    let [addingNew, setAddingNew] = useState(false);

    const openFile = (name) => {

        setCurrOpen(name);
        if (openFiles[name] != null) { return; }
        socket.send(JSON.stringify({
            type: 'read',
            filename: name
        }));
    }

    const deleteFile = (name) => {
        if (lockedFiles.includes(name)) return; 

        console.log(name, currOpen, name === currOpen);
        if (currOpen === name) {
            setCurrOpen("");
        }

        setFiles((prev) => {
            return prev.filter(item => item !== name);
        });

        if (openFiles[name] != null) {
            setOpenFiles((prev) => {
                delete prev[name];
                return { ...prev };
            });
        }


        socket.send(JSON.stringify({
            type: 'delete',
            filename: name
        }));
    }

    const handleKeyPress = (e) => {
        if (e.keyCode !== 13 || files.includes(e.target.value + '.txt')) { return; }

        const newFile = e.target.value + '.txt';

        setAddingNew(false);
        setFiles(prev => {
            prev = prev.concat(newFile);
            prev.sort();
            return prev;
        });

        const event = {
            type: 'create',
            filename: newFile
        }
        socket.send(JSON.stringify(event));

        setOpenFiles(prev => {
            const next = {...prev};
            next[newFile] = {
                writing: true,
                data: ""
            };
            return next;
        })

        setCurrOpen(newFile);
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
                        <span className="material-symbols-outlined">add</span>
                        <span className="btn-text">Add</span>
                    </button> 
                }
            </li>

            { files.map( file => (
                <li className="fileitem" key={file}>
                    <span className="material-symbols-outlined">
                        description
                    </span>
                    <span className="filename" onClick={() => openFile(file)}>{file}</span>
                    {lockedFiles.includes(file) ? <span className="material-symbols-outlined">
                        lock
                    </span> : null}
                    <span className="material-symbols-outlined delete" onClick={() => deleteFile(file)}>
                        delete
                    </span>
                </li>
            )) }

            { !addingNew ? null : <li className="input-item">
                <span className="material-symbols-outlined">
                    description
                </span>
                <input type="text" name="newfile" id="newfilename" onKeyUp={handleKeyPress} autoComplete="off" />.txt
            </li> }
        </ul>
    )
}