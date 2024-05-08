import { createContext, useContext, useEffect, useState } from "react";
import { FileManagerContext } from "./FileManagerContext";

export const WebSocketContext = createContext(undefined);
let socket;

export function WebSocketContextProvider({ workspace, children }) {
    const [connected, setConnected] = useState(false)
    const fm = useContext(FileManagerContext);
    
    useEffect(() => {
        socket = new WebSocket('wss://colabo-api.onrender.com/ws');

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: "init",
                workspace
            }));
            setConnected(true);
        }

        socket.addEventListener('message', ({ data }) => {

            const event = JSON.parse(data);

            switch (event.type) {

                case 'init': {
                    fm.setFiles(event.files);
                    break;
                }

                case 'create': {
                    fm.setFiles(prev => {
                        const next = prev.concat(event.filename);
                        next.sort();
                        return next;
                    });
                    fm.setLockedFiles(prev => {
                        return prev.concat(event.filename);
                    });
                    break;
                }

                case 'read': {
                    fm.setOpenFiles(prev => {
                        const next = { ...prev };
                        next[event.filename] = {
                            writing: false,
                            data: event.payload
                        };
                        return next
                    });
                    fm.setCurrOpen(event.filename);
                    break;
                }

                case 'update': {
                    fm.setOpenFiles(prev => {
                        const next = { ...prev };
                        next[event.filename].data = event.payload;
                        return next;
                    });
                    break;
                }

                case 'delete': {
                    fm.setFiles((prev) => {
                        return prev.filter(item => item !== event.filename);
                    });

                    if (fm.openFiles[event.filename] != null) {
                        fm.setOpenFiles((prev) => {
                            delete prev[event.filename];
                            return { ...prev };
                        });
                    }

                    if (fm.lockedFiles.includes(event.filename)) {
                        fm.setLockedFiles((prev) => {
                            return prev.filter(item => item !== event.filename);
                        });
                    }

                    break;
                }

                case 'lock': {
                    fm.setLockedFiles(prev => {
                        const next = prev.concat(event.filename);
                        next.sort();
                        return next;
                    });
                    break;
                }

                case 'unlock': {
                    fm.setLockedFiles((prev) => {
                        return prev.filter(item => item !== event.filename);
                    });
                    break;
                }
            }
        })

        return () => {
            socket.close()
        }
    }, [])

    return (
        <>
           {connected &&
            <WebSocketContext.Provider value={socket}>
                {children}
            </WebSocketContext.Provider>
            } 
        </>
    )
}