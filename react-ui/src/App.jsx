import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import CreateUser from './components/CreateUser';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<><Navbar /><UserDashboard /></>} />
          <Route path="/create-user" element={<><Navbar /><CreateUser /></>} />
          <Route path="/chat" element={<><Navbar /><Chat /></>} />
          <Route path="/profile" element={<><Navbar /><Profile /></>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
