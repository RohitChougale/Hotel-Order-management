import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Admin from "./pages/Admin";
import Staff from "./pages/Staff";
import KOT from "./pages/KOT";
import AdminMenuList from "./components/MenuList";
import Home from "./pages/home";
import OrderSummary from "./components/OrderSummary";
import RunningTables from "./components/RunningTables";
import UnpaidBills from "./components/Bills";
import Settings from "./components/Settings";
import HotelAnalytics from "./components/HotelAnalytics";
import LandingPage from "./pages/LandingPage";
import CounterHome from "./pages/CounterHome";
import CounterAdmin from "./components/CounterAdmin";
import CounterItemList from "./components/CounterItemList";
import CounterOrder from "./components/CounterOrder";
import RunningCoupons from "./components/RunningCoupons";
import CounterAnalytics from "./components/CounterAnalytics";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from "./components/ProtectedRoute";
import CounterDisplay from "./components/counterDisplay";

function App() {
  return (
    <BrowserRouter>
      {/* Header Navigation */}
<Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      {/* Routes */}
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Login/>}/>
          <Route path="/landingPage" element={<ProtectedRoute><LandingPage/></ProtectedRoute>}/>
          <Route path="/home" element={<ProtectedRoute><Home/></ProtectedRoute>}/>
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><Staff/></ProtectedRoute>} />
          <Route path="/kot" element={<ProtectedRoute><KOT/></ProtectedRoute>} />
          <Route path="/adminMenu" element={<ProtectedRoute><AdminMenuList/></ProtectedRoute>} />
          <Route path="orderSummary" element={<ProtectedRoute><OrderSummary/></ProtectedRoute>}/>
          <Route path="/running-tables" element={<ProtectedRoute><RunningTables /></ProtectedRoute>} />
          <Route path="/bills" element={<ProtectedRoute><UnpaidBills/></ProtectedRoute>}/>
          <Route path="/settings" element={<ProtectedRoute><Settings/></ProtectedRoute>}/>
          <Route path="/hotelAnalytics" element={<ProtectedRoute><HotelAnalytics/></ProtectedRoute>}/>
          <Route path="/counterHome" element={<ProtectedRoute><CounterHome/></ProtectedRoute>}/>
          <Route path="/counterAdmin" element={<ProtectedRoute><CounterAdmin/></ProtectedRoute>}/>
          <Route path="/counterItemList" element={<ProtectedRoute><CounterItemList/></ProtectedRoute>}/>
          <Route path="/counterOrder" element={<ProtectedRoute><CounterOrder/></ProtectedRoute>}/>
          <Route path="/runningCoupons" element={<ProtectedRoute><RunningCoupons/></ProtectedRoute>}/>
          <Route path="/counterAnalytics" element={<ProtectedRoute><CounterAnalytics/></ProtectedRoute>}/>
          <Route path="/counterDisplay" element={<ProtectedRoute><CounterDisplay/></ProtectedRoute>}/>
          <Route path="/signup" element={<Signup/>}/>

        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
