import { addDoc, collection, doc, getDocs, query, updateDoc, where, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuForm from "../components/MenuForm";
import { db } from "../firebase";
import OrderSummary from "../components/OrderSummary";

interface HotelInfo {
  name: string;
  acCharge: number;
  nonAcCharge: number;
  gst: number;
  acTables: string;
  nonAcTables: string;
  greeting: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [hotelInfo, setHotelInfo] = useState<HotelInfo>({
    name: "",
    acCharge:0,
    nonAcCharge:0,
    gst: 0,
    acTables: "1-10",
    nonAcTables: "11-20",
    greeting: ""
  });
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  const [showHotelEditModal, setShowHotelEditModal] = useState(false);

  useEffect(() => {
    const fetchHotelInfo = async () => {
      const snapshot = await getDocs(collection(db, "hotelinfo"));
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setHotelInfo(docSnap.data() as HotelInfo);
        setExistingDocId(docSnap.id);
      }
    };
    fetchHotelInfo();
  }, []);

  const handleHotelInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingDocId) {
      await updateDoc(doc(db, "hotelinfo", existingDocId), hotelInfo as { [key: string]: any });
      alert("Hotel info updated successfully.");
      setShowHotelEditModal(false);
    } else {
      const newDocRef = await addDoc(collection(db, "hotelinfo"), hotelInfo);
      setExistingDocId(newDocRef.id);
      alert("Hotel info saved successfully.");
    }
  };

  const handleAddMenu = async (data: { name: string; price: number; type: string }) => {
    await addDoc(collection(db, "menu"), data);
    setShowAddForm(false);
  };

  return (
    <div className="p-6 space-y-10 bg-gradient-to-b from-gray-100 to-gray-300 min-h-screen">
      <h2 className="text-4xl font-extrabold text-center text-gray-900 tracking-wide">🛠️ Admin Panel</h2>

      {/* HOTEL INFO SECTION */}
      <section className="bg-white shadow-lg rounded-2xl p-6 max-w-2xl mx-auto border border-blue-100">
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">🏨 Hotel Info</h3>

        {existingDocId === null ? (
          <form onSubmit={handleHotelInfoSubmit} className="space-y-4">
            {["Hotel Name", "AC Charges", "Non-AC Charges", "GST Percentage", "AC Table Range", "Non-AC Table Range", "Greeting"].map((label, i) => {
              const keys = ["name", "acCharge", "nonAcCharge", "gst", "acTables", "nonAcTables", "greeting"] as (keyof HotelInfo)[];
              return (
                <input
                  key={i}
                  type={label.includes("Charges") || label.includes("GST") ? "number" : "text"}
                  placeholder={label}
                  value={hotelInfo[keys[i]]}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, [keys[i]]: e.target.value })}
                  required
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full shadow-sm focus:ring focus:ring-blue-200"
                />
              );
            })}
            <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200">
              💾 Save Hotel Info
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-gray-800">
            <div className="grid gap-2 text-base">
              <p><strong>🏨 Name:</strong> {hotelInfo.name}</p>
              <p><strong>❄️ AC Charges:</strong> ₹{hotelInfo.acCharge}</p>
              <p><strong>🔥 Non-AC Charges:</strong> ₹{hotelInfo.nonAcCharge}</p>
              <p><strong>📊 GST:</strong> {hotelInfo.gst}%</p>
              <p><strong>📋 AC Tables:</strong> {hotelInfo.acTables}</p>
              <p><strong>📋 Non-AC Tables:</strong> {hotelInfo.nonAcTables}</p>
              <p><strong>🎉 Greeting:</strong> {hotelInfo.greeting}</p>
            </div>
            <button
              onClick={() => setShowHotelEditModal(true)}
              className="mt-4 bg-yellow-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-yellow-600 transition-all"
            >
              ✏️ Edit Hotel Info
            </button>
          </div>
        )}
      </section>

      {/* MENU MANAGEMENT SECTION */}
      <section className="max-w-2xl mx-auto space-y-4">
        <h3 className="text-2xl font-semibold text-green-700">📋 Menu Management</h3>

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
        </div>

        {showAddForm && (
          <div className="border-2 border-dashed p-6 rounded-xl bg-white shadow-lg mt-4">
            <MenuForm onSubmit={handleAddMenu} />
          </div>
        )}
      </section>

      {/* EDIT MODAL */}
      {showHotelEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full relative">
            <button
              onClick={() => setShowHotelEditModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-semibold mb-4 text-blue-600">Edit Hotel Info</h3>

            <form onSubmit={handleHotelInfoSubmit} className="space-y-4">
              {["Hotel Name", "AC Charges", "Non-AC Charges", "GST Percentage", "AC Table Range", "Non-AC Table Range", "Greeting"].map((label, i) => {
                const keys = ["name", "acCharge", "nonAcCharge", "gst", "acTables", "nonAcTables", "greeting"] as (keyof HotelInfo)[];
                return (
                  <input
                    key={i}
                    type={label.includes("Charges") || label.includes("GST") ? "number" : "text"}
                    placeholder={label}
                    value={hotelInfo[keys[i]]}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, [keys[i]]: e.target.value })}
                    required
                    className="border border-gray-300 px-4 py-2 rounded-lg w-full shadow-sm focus:ring focus:ring-blue-200"
                  />
                );
              })}

              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 w-full transition-all"
              >
                ✅ Update Info
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
