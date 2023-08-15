import './Auth.css'

import { useContext, useState } from "react"
import { UserContext } from "./UserContext";

export default function Auth() {

    // user manager
    const um = useContext(UserContext);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");

    const [registering, setRegistering] = useState(false);

    function handleSubmit(e) {
        e.preventDefault()
        registering ? um.register(email, username, password) : um.login(email, password);
    }

    return (
        <form className="auth" onSubmit={handleSubmit}>
            <h3>Welcome</h3>
            <h5>{registering ? 'Register' : 'Login'} to Continue</h5>

            <label htmlFor="email">Email</label>
            <input type="email" id="email" onChange={e => setEmail(e.target.value)} />

            {registering &&
                <>
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" onChange={e => setUsername(e.target.value)} />
                </>
            }

            <label htmlFor="password">Password</label>
            <input type="password" onChange={e => setPassword(e.target.value)} />

            {registering ?
                <p>Already have an account? <span onClick={() => setRegistering(false)}>Login</span></p> :
                <p>Don't have an account? <span onClick={() => setRegistering(true)}>Register</span></p>
            }

            <button className="high-emph" type="submit">{registering ? 'Register' : 'Login'}</button>
        </form>
    )
}