
import './App.css';
import { useState, useEffect } from 'react';

import Editor from './Editor';
import Sidebar from './Sidebar';
import Chat from './Chat';

let socket;

const msgCounter = (() => {
    let count=0;
    return () => {
        count++;
        return count;
    }
})();

export default function App() {
    
    let [files, setFiles] = useState([]);
    let [openFiles, setOpenFiles] = useState({});
    let [lockedFiles, setLockedFiles] = useState([]);
    let [currOpen, setCurrOpen] = useState("");
    let [msgs, setMsgs] = useState([]);

    const props = {
        socket, 
        openFiles, setOpenFiles,
        files, setFiles,
        lockedFiles, setLockedFiles,
        currOpen, setCurrOpen,
        msgs, setMsgs,
        msgCounter
    }
    
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

                case 'message': {
                    let { author, content } = event;
                    
                    setMsgs(prev => {
                        let skipauthor = ((prev.length > 0) && (prev[0].author === author));
                        if (prev.length > 0) {
                            console.log(prev[0].author, author, prev[0].author === author);
                        }
                        let newItem = {
                            dir: "incoming",
                            author,
                            content,
                            skipauthor,
                            id: msgCounter()
                        }
                        return [newItem, ...prev];
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
            {files && <Sidebar {...props} />}
            <Editor {...props}/>
            <Chat {...props} />
        </div>
    );
}
