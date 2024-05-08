import '../css/Chat.css'

import { useContext, useState } from "react"
import { useRef } from 'react';
import { WebSocketContext } from '../contexts/WebSocketContext';
import { UserContext } from '../contexts/UserContext';


const msgCounter = (() => {
    let count = 0;
    return () => {
        count++;
        return count;
    }
})();

export default function Chat({ setOpenedWorkspace }) {

    const socket = useContext(WebSocketContext);

    socket.addEventListener('message', ({ data }) => {
        const event = JSON.parse(data);

        switch (event.type) {
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
    })

    const [chatOpened, setChatOpened] = useState(false);
    const [msgs, setMsgs] = useState([]);

    const { username } = useContext(UserContext);
    
    const chatText = useRef(null);

    const sendMsg = () => {
        if (chatText.current.value.length < 1) return;

        const text = chatText.current.value;
        
        setMsgs(prev => {
            const skipauthor = ((prev.length > 0) && (prev[0].author === username));
            const newItem = {
                dir: "outgoing",
                author: username,
                content: text,
                skipauthor,
                id: msgCounter()
            }
            return [ newItem, ...prev ];
        });

        chatText.current.value = "";

        socket.send(JSON.stringify({
            type: "message",
            author: username,
            content: text
        }))
    }

    const handleMsg = (e) => {
        if (e.keyCode === 13) sendMsg();
    }

    const chatUI = (
        <div id="chat-box">
            <p className="chat-top">
                <span className='chat-title'>Chat</span>
                <span 
                    className="material-symbols-outlined chat-close" 
                    onClick={() => setChatOpened(false)}>
                        close
                </span>
            </p>

            <div id="chat-content">
                {
                    msgs.map(msg => {
                        return (
                            <div 
                            key={msg.id}
                            className={`msgBox ${ msg.dir }`} 
                            style={{marginTop: msg.skipauthor ? "0" : ".4rem" }}>
                                { msg.skipauthor ? null : <p className="chat-author">{ msg.author }</p> }
                                <p className="chat-msg-content">
                                    { msg.content }
                                </p>
                            </div>
                        )
                    })
                }
            </div>
            
            <div className="end-shadow shadow-top"></div>
            <div className="end-shadow shadow-btm"></div>
            
            <div id="chat-bottom">
                <input type="text" ref={chatText} placeholder="Enter Message" onKeyDown={handleMsg} autoFocus/>
                <button id="chat-send" className='low-emph' onClick={sendMsg}>
                    <span id="chat-send-text" className="material-symbols-outlined">
                        send
                    </span>
                </button>
            </div>

        </div>
    )  

    return (
        <div className="chat-area">
            <button className="med-emph" id="back" onClick={() => setOpenedWorkspace(null)}>
                <span class="material-symbols-outlined">exit_to_app</span>
            </button>
            { chatOpened ? 
                chatUI : 
                <button id="chat-toggle" className='med-emph' onClick={() => setChatOpened(!chatOpened)}>
                    <span className="material-symbols-outlined">
                        chat
                    </span>
                </button>
            }
        </div>
    )
}