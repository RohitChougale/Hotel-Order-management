import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuForm from "../components/MenuForm";
import { db } from "../firebase";
import OrderSummary from "../components/OrderSummary";

export default function Admin() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddMenu = async (data: {
    name: string;
    acPrice: number;
    nonAcPrice: number;
    nameMarathi:string;
    type: string;
  }) => {
    await addDoc(collection(db, "menu"), data);
    setShowAddForm(false);
  };

  return (
    <div className="p-6 space-y-10 bg-gradient-to-b from-gray-100 to-gray-300 min-h-screen">
      <h2 className="text-4xl font-extrabold text-center text-gray-900 tracking-wide">
        🛠️ Admin Panel
      </h2>

      {/* MENU MANAGEMENT SECTION */}
      <section className="max-w-2xl mx-auto space-y-4">
        <h3 className="text-2xl font-semibold text-green-700">
          📋 Menu Management
        </h3>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-semibold shadow"
          >
            ➕ Add Menu Item
          </button>
          <button
            onClick={() => navigate("/adminMenu")}
            className="bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-gray-900 font-semibold shadow"
          >
            📄 View Menu List
          </button>
          <button
            onClick={() => navigate("/orderSummary")}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 font-semibold shadow"
          >
            📊 Order Summary
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 font-semibold shadow"
          >
            Settings
          </button>
        </div>

        {showAddForm && (
          <div className="border-2 border-dashed p-6 rounded-xl bg-white shadow-lg mt-4">
            <MenuForm onSubmit={handleAddMenu} />
          </div>
        )}
      </section>
    </div>
  );
}
