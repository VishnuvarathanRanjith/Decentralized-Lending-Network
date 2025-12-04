
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Navbar from './Navbar';
import Home from './Home';
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Borrow from './Borrow';
import Owner from './Owner';
import Repay from './Repay';
import Footer from './Footer';

function App() {
  return (
    <>
    <BrowserRouter>
    <Navbar/>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/borrow' element={<Borrow/>}/>
      <Route path='/approve' element={<Owner/>}/>
      <Route path='/repay' element={<Repay/>}/>
      
    </Routes>
    <Footer/>
    </BrowserRouter>
    
    </>
  );
}

export default App;
