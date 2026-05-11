import './App.scss'
import { Route, Routes } from 'react-router-dom';

import MainNav from './components/MainNav';
import Clubs from './routes/Clubs';
import Home from './routes/Home';
import ClubDetails from './pages/ClubDetails';

function App() {
  

  return (
    <div>
      <MainNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vereine" element={<Clubs />} />
        <Route path="/vereine/:id" element={<ClubDetails />} />
      </Routes>

      
    </div>
  );
}

export default App;