
import './App.css';

import Auth from './Auth';
import { useContext, useEffect } from 'react';
import { UserContext } from './UserContext';
import Dashboard from './Dashboard';

export default function App() {
    const { user, fetchUser } = useContext(UserContext);

    useEffect(() => {
        fetchUser(); 
    }, [])

    return (
        <div className="App">
            {   !user ? 
                <Auth /> :
                <Dashboard />
            }
        </div>
    );
}
