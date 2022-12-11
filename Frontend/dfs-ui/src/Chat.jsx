import './Chat.css'

import { useState } from "react"
import { useRef } from 'react';

export default function Chat(props) {
    const { socket, msgs, setMsgs, msgCounter } = props;

    let [userName, setUserName] = useState("");
    let [chatOpened, setChatOpened] = useState(false);

    const chatText = useRef(null);

    const sendMsg = () => {
        if (chatText.current.value.length < 1) return;

        const text = chatText.current.value;
        
        setMsgs(prev => {
            const skipauthor = ((prev.length > 0) && (prev[0].author === userName));
            const newItem = {
                dir: "outgoing",
                author: userName,
                content: text,
                skipauthor,
                id: msgCounter()
            }
            return [ newItem, ...prev ];
        });

        chatText.current.value = "";

        socket.send(JSON.stringify({
            type: "message",
            author: userName,
            content: text
        }))
    }

    const handleMsg = (e) => {
        if (e.keyCode === 13) sendMsg();
    }

    const handleChange = (e) => {
        if (e.keyCode !== 13 || e.target.value.length < 2) { return; }
        setUserName(e.target.value.toUpperCase());
    }

    const credUI = (
        <div className="cred-box">
            <p className="chat-top">
                <span className='chat-title'>Chat</span>
                <span
                    className="material-symbols-outlined chat-close"
                    onClick={() => setChatOpened(false)}>
                    close
                </span>
            </p>

            <h3>Your Username</h3>
            <input type="text" onKeyDown={handleChange}/>
        </div>
    )

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
                <input type="text" ref={chatText} placeholder="Enter Message" onKeyDown={handleMsg}/>
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
            { chatOpened ? 
                (userName ? chatUI : credUI) : 
                <button id="chat-toggle" className='med-emph' onClick={() => setChatOpened(!chatOpened)}>
                    <span className="material-symbols-outlined">
                        chat
                    </span>
                </button>
            }
        </div>
    )
}