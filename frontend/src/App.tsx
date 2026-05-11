import './App.scss'
import { Route, Routes } from 'react-router-dom';

import MainNavigation from './components/clubs/MainNavigation';
import Clubs from './routes/Clubs';
import Home from './routes/Home';

function App() {
  

  return (
    <div>
      <MainNavigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vereine" element={<Clubs />} />
      </Routes>

      
    </div>
  );
}

export default App;