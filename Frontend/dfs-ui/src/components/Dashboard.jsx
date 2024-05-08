import '../css/Dashboard.css'

import { useEffect, useState } from 'react';

import { WebSocketContextProvider } from '../contexts/WebSocketContext'
import { FileManagerContextProvider } from '../contexts/FileManagerContext'

import Editor from './Editor';
import Sidebar from './Sidebar';
import Chat from './Chat';

const BASE_URL = 'http://localhost:5000';

export default function Dashboard() {
    const [workspaces, setWorkspaces] = useState([]);
    const [openedWorkspace, setOpenedWorkspace] = useState(null);

    const [creatingWorkspace, setCreatingWorkspace] = useState(undefined);

    useEffect(() => {
        fetch(BASE_URL + '/workspace', {
            headers: {
                'Authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        .then(resp => resp.json())
        .then(wspaces => setWorkspaces(wspaces))
    }, [])

    async function handleKeypress(e) {
        if (e.key !== 'Enter' || e.target.value.length <= 2) return;

        const workspaceCreateResp = await fetch(BASE_URL + '/workspace', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Authorization': 'BEARER ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                name: e.target.value
            })
        })

        if (workspaceCreateResp.ok) {
            const wspaces = await workspaceCreateResp.json();
            setWorkspaces(wspaces)
            setCreatingWorkspace(undefined)
        }
        
    }

    return (
        <>
        { openedWorkspace ?

            <FileManagerContextProvider>
                <WebSocketContextProvider workspace={openedWorkspace}>
                    <Sidebar workspace={openedWorkspace}/>
                    <Editor />
                    <Chat setOpenedWorkspace={setOpenedWorkspace} />
                </WebSocketContextProvider >
            </FileManagerContextProvider >   :

            <div id="dashboard">
                <h1>Your Workspaces</h1>
                <ul id="workspaces">
                    {workspaces.map(workspace => {
                        return (
                            <li onClick={() => setOpenedWorkspace(workspace)} key={workspace}>
                                <span class="material-symbols-outlined" style={{marginRight: ".7rem", fontSize: "1.4rem"}}>
                                    workspaces
                                </span>
                                {workspace}
                            </li>
                        )
                    })}
                </ul>

                <div id="actions">
                { creatingWorkspace === undefined ?
                        <><button id="create" className='high-emph' onClick={() => setCreatingWorkspace(true)}>
                            <span class="material-symbols-outlined">
                                add_circle
                            </span>
                            New Workspace
                        </button>
                        <button id="join" className="med-emph" onClick={() => setCreatingWorkspace(false)}>
                            <span class="material-symbols-outlined">
                                login
                            </span>
                            Join a Workspace
                        </button></> :
                        <>
                        <label htmlFor="workspace-name">Workspace Name</label>
                        <input type="text" autoFocus onKeyUp={handleKeypress}/>
                        <button id="cancel" className="low-emph" onClick={() => setCreatingWorkspace(undefined)}
                            style={{width: "30%", height: "2rem"}}>
                            <span class="material-symbols-outlined">
                                close
                            </span>
                            Cancel
                        </button>
                        </>
                }
                </div> 
            </div>
        }
        </>
    )
}