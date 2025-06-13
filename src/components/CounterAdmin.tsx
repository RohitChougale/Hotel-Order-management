import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CounterAdmin() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [item, setItem] = useState({
    name: "",
    nameMarathi: "",
    price: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItem((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!item.name || !item.nameMarathi || !item.price) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "counterItems"), {
      ...item,
      price: parseFloat(item.price),
    });

    alert("Item added successfully!");
    setItem({ name: "", nameMarathi: "", price: "" });
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-orange-200 p-6 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-extrabold text-orange-800 mb-10 tracking-wide text-center">
        🍽️ Counter Admin Panel
      </h1>

      <div className="flex flex-wrap gap-6 justify-center">
        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-4 bg-orange-600 text-white text-lg rounded-xl hover:bg-orange-700 transition-all duration-300 font-semibold shadow-lg"
        >
          ➕ Add Item
        </button>

        <button
          onClick={() => navigate("/counterItemList")}
          className="px-8 py-4 bg-teal-600 text-white text-lg rounded-xl hover:bg-teal-700 transition-all duration-300 font-semibold shadow-lg"
        >
          📋 View Items
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-orange-700 text-center">
              Add New Counter Item
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Item Name"
                value={item.name}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />

              <input
                type="text"
                name="nameMarathi"
                placeholder="Item Name (Marathi)"
                value={item.nameMarathi}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />

              <input
                type="number"
                name="price"
                placeholder="Price"
                value={item.price}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="flex justify-end mt-6 gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

