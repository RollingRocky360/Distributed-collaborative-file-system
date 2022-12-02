
import './App.css';
import { useState, useEffect } from 'react';

import Editor from './Editor';
import Sidebar from './Sidebar';

let socket;

export default function App() {
    
    let [files, setFiles] = useState([]);
    let [openFiles, setOpenFiles] = useState({});
    let [lockedFiles, setLockedFiles] = useState([]);
    let [currOpen, setCurrOpen] = useState("");
    
    useEffect(() => {
        socket = new WebSocket('ws://localhost:8000');
        socket.onopen = () => {
            socket.send('{"type": "init"}');
        }
        socket.onmessage = ({ data }) => {
            
            const event = JSON.parse(data);
            console.log(event.type);
            
            switch (event.type) {
                
                case 'init': {
                    setFiles(event.files);
                    break;
                }
                
                case 'create': {
                    setFiles(prev => {
                        const next = prev.concat(event.filename);
                        next.sort();
                        return next;
                    });
                    setLockedFiles(prev => {
                        return prev.concat(event.filename);
                    });
                    break;
                }
                
                case 'read': {
                    setOpenFiles(prev => {
                        const next = {...prev};
                        next[event.filename] = {
                            writing: false,
                            data: event.payload
                        };
                        return next
                    });
                    setCurrOpen(event.filename);
                    break;
                }

                case 'update': {
                    setOpenFiles(prev => {
                        const next = {...prev};
                        next[event.filename].data = event.payload;
                        return next;
                    });
                    break;
                }
                
                case 'delete': {
                    setFiles((prev) => {
                        return prev.filter(item => item !== event.filename);
                    });

                    if (openFiles[event.filename] != null) {
                        setOpenFiles((prev) => {
                            delete prev[event.filename];
                            return { ...prev };
                        });
                    }
                    
                    if (lockedFiles.includes(event.filename)) {
                        setLockedFiles((prev) => {
                            return prev.filter(item => item !== event.filename);
                        });
                    }
                    
                    break;
                }

                case 'lock': {
                    setLockedFiles(prev => {
                        const next = prev.concat(event.filename);
                        next.sort();
                        return next;
                    });
                    break;
                }

                case 'unlock': {
                    setLockedFiles((prev) => {
                        return prev.filter(item => item !== event.filename);
                    });
                    break;
                }

                default: {
                    break;
                }
            }
        }

        return () => {
            socket.close()
        }
    }, [])

    return (
        <div className="App">
            {files && <Sidebar 
                socket={socket}
                openFiles={openFiles} 
                setOpenFiles={setOpenFiles} 
                files={files}
                setFiles={setFiles}
                lockedFiles={lockedFiles}
                setLockedFiles={setLockedFiles} 
                setCurrOpen={setCurrOpen} />}

            <Editor 
                socket={socket}
                openFiles={openFiles}
                setOpenFiles={setOpenFiles}
                files={files}
                setFiles={setFiles}
                lockedFiles={lockedFiles}
                setLockedFiles={setLockedFiles}
                currOpen={currOpen}
                setCurrOpen={setCurrOpen} />
        </div>
    );
}
