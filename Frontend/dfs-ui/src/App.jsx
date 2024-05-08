import './App.css';

import Auth from './components/Auth';
import { useContext, useEffect } from 'react';
import { UserContext } from './contexts/UserContext';
import Dashboard from './components/Dashboard';

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
