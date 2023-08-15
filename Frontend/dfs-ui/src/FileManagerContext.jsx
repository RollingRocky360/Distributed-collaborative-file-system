import { createContext, useContext, useState, useEffect } from "react";
import { WebSocketContext } from "./WebSocketContext";

export const FileManagerContext = createContext({});

export function FileManagerContextProvider({ children }) {

    let [files, setFiles] = useState([]);
    let [openFiles, setOpenFiles] = useState({});
    let [lockedFiles, setLockedFiles] = useState([]);
    let [currOpen, setCurrOpen] = useState("");

    return (
        <FileManagerContext.Provider value={{
            files, setFiles,
            openFiles, setOpenFiles,
            lockedFiles, setLockedFiles,
            currOpen, setCurrOpen,
        }}>
            { children }
        </FileManagerContext.Provider>
    )
}