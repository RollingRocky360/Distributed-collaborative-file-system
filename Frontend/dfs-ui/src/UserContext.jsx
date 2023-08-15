import { createContext, useState } from "react";

export const UserContext = createContext(undefined);

export function UserContextProvider({ children }) {
    const [user, setUser] = useState(undefined);

    async function fetchUser() {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            return;
        }

        const fetchUserResp = await fetch('http://localhost:8000/auth', {
            headers: {
                'Authorization': 'BEARER ' + token
            }
        })
        const u = await fetchUserResp.json();
        setUser(u);
    }

    async function login(email, password) {
        const loginResp = await fetch('http://localhost:8000/user', {
            headers: {
                'Authorization': 'BASIC ' + `${email}:${password}`
            }
        })
        const { token, ...u } = await loginResp.json();
        localStorage.setItem('token', token);
        setUser(u);
    }

    async function register(email, username, password) {
        const registerResp = await fetch('http://localhost:8000/user', {
            method: 'POST',
            headers: {
                'Content-type': 'Application/json'
            },
            body: JSON.stringify({ email, username, password })
        })
        const { token, ...u } = await registerResp.json();
        localStorage.setItem('token', token);
        setUser(u);
    }

    function logout() {
        localStorage.removeItem('token');
    }

    return (
        <UserContext.Provider value={{ user, fetchUser, login, register, logout }}>
            { children }
        </UserContext.Provider>
    )
}