import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import MenuForm from "./MenuForm";

interface MenuItem {
  id: string;
  name: string;
  nameMarathi: string;
  nonAcPrice: number;
  acPrice: number;
  type: string;
}

const typeBadgeClasses: Record<string, string> = {
  breakfast: "bg-yellow-100 text-yellow-800",
  meal: "bg-green-100 text-green-800",
  drink: "bg-blue-100 text-blue-800",
  default: "bg-gray-100 text-gray-800",
};

export default function AdminMenuList() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedType, setSelectedType] = useState("all");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      const snapshot = await getDocs(collection(db, "menu"));
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuItem, "id">),
      }));
      setMenu(items);
    };
    fetchMenu();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "menu", id));
    setMenu((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdate = async (
    data: {
      name: string;
      nameMarathi: string;
      nonAcPrice: number;
      acPrice: number;
      type: string;
    },
    id?: string
  ) => {
    if (!id) return;
    await updateDoc(doc(db, "menu", id), data);
    setMenu((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    setEditingItem(null);
  };

  const filteredMenu = menu
    .filter((item) => selectedType === "all" || item.type === selectedType)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Menu Items</h2>

      {/* ───── Filter by Type ───── */}
      <div className="w-full sm:max-w-xs">
        <label
          htmlFor="typeFilter"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Filter by Food Type
        </label>
        <select
          id="typeFilter"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="all">All Types</option>
          <option value="breakfast">Breakfast</option>
          <option value="meal">Meal</option>
          <option value="drink">Drink</option>
        </select>
      </div>

      {/* ───── Menu Items ───── */}
      <div className="space-y-2">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center border p-3 rounded bg-white"
          >
            <div className="space-y-1">
              <p className="font-semibold text-lg">{item.name}</p>
              <p className="text-sm text-gray-600 italic">{item.nameMarathi}</p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Non-AC:</span> ₹{item.nonAcPrice}{" "}
                | <span className="font-medium">AC:</span> ₹{item.acPrice}
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                  typeBadgeClasses[item.type] || typeBadgeClasses.default
                }`}
              >
                {item.type}
              </span>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setEditingItem(item)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ───── Edit Modal ───── */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md relative">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-2">Edit Menu Item</h3>
            <MenuForm
              initialData={editingItem}
              onSubmit={(data) => handleUpdate(data, editingItem.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
