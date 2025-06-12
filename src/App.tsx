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

function App() {
  return (
    <BrowserRouter>
      {/* Header Navigation */}
      <header className="bg-gradient-to-r from-blue-600 to-green-500 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-white font-bold text-xl">Restaurant Dashboard</h1>

          <nav className="space-x-3">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-blue-600"
                    : "text-white hover:bg-white hover:text-blue-600"
                }`
              }
            >
              Admin
            </NavLink>

           <NavLink
              to="/bills"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-green-600"
                    : "text-white hover:bg-white hover:text-green-600"
                }`
              }
            >
              Bill
            </NavLink>

            <NavLink
              to="/staff"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-green-600"
                    : "text-white hover:bg-white hover:text-green-600"
                }`
              }
            >
              Staff
            </NavLink>
            
            <NavLink
              to="/kot"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-green-600"
                    : "text-white hover:bg-white hover:text-green-600"
                }`
              }
            >
              KOT
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Routes */}
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/admin" element={<Admin />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/kot" element={<KOT />} />
          <Route path="/adminMenu" element={<AdminMenuList />} />
          <Route path="orderSummary" element={<OrderSummary/>}/>
          <Route path="/running-tables" element={<RunningTables />} />
          <Route path="/bills" element={<UnpaidBills/>}/>
          <Route path="/settings" element={<Settings/>}/>
          <Route path="/hotelAnalytics" element={<HotelAnalytics/>}/>

        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
