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

function App() {
  return (
    <BrowserRouter>
      {/* Header Navigation */}

      {/* Routes */}
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/landingPage" element={<LandingPage/>}/>
          <Route path="/home" element={<Home/>}/>
          <Route path="/admin" element={<Admin />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/kot" element={<KOT />} />
          <Route path="/adminMenu" element={<AdminMenuList />} />
          <Route path="orderSummary" element={<OrderSummary/>}/>
          <Route path="/running-tables" element={<RunningTables />} />
          <Route path="/bills" element={<UnpaidBills/>}/>
          <Route path="/settings" element={<Settings/>}/>
          <Route path="/hotelAnalytics" element={<HotelAnalytics/>}/>
          <Route path="/counterHome" element={<CounterHome/>}/>
          <Route path="/counterAdmin" element={<CounterAdmin/>}/>
          <Route path="/counterItemList" element={<CounterItemList/>}/>
          <Route path="/counterOrder" element={<CounterOrder/>}/>
          <Route path="/runningCoupons" element={<RunningCoupons/>}/>
          <Route path="/counterAnalytics" element={<CounterAnalytics/>}/>
          <Route path="/signup" element={<Signup/>}/>

        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
