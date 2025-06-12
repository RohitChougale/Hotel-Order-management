import {
  addDoc,
  collection,
} from "firebase/firestore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuForm from "../components/MenuForm";
import { db } from "../firebase";
import OrderSummary from "../components/OrderSummary";
import HotelAnalytics from "../components/HotelAnalytics";

export default function Admin() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddMenu = async (data: {
    name: string;
    acPrice: number;
    nonAcPrice: number;
    nameMarathi: string;
    type: string;
  }) => {
    await addDoc(collection(db, "menu"), data);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
          🛠️ Admin Dashboard
        </h1>

        {/* Hotel Analytics */}
        <div className="mb-12">
          <HotelAnalytics />
        </div>

        {/* Menu Management Section */}
        <section className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📋 Menu Management
          </h2>

          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition"
            >
              ➕ Add Menu Item
            </button>
            <button
              onClick={() => navigate("/adminMenu")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition"
            >
              📄 View Menu List
            </button>
            <button
              onClick={() => navigate("/orderSummary")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition"
            >
              📊 Order Summary
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition"
            >
              ⚙️ Settings
            </button>
          </div>

          {showAddForm && (
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 shadow-inner">
              <MenuForm onSubmit={handleAddMenu} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
