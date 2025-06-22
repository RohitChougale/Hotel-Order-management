import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function CounterItemList() {
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    nameMarathi: "",
    price: "",
    code: "",
  });
  const [showMobileEditModal, setShowMobileEditModal] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const fetchItems = async () => {
    const snapshot = await getDocs(
      collection(db, "users", currentUser!.uid, "counterItems")
    );
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setItems(data as any);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: any, isMobile = false) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      nameMarathi: item.nameMarathi,
      price: item.price,
      code: item.code || "",
    });

    if (isMobile) {
      setShowMobileEditModal(true);
    }
  };

  const handleUpdate = async () => {
    if (editId) {
      await updateDoc(
        doc(db, "users", currentUser!.uid, "counterItems", editId),
        {
          ...form,
          price: parseFloat(form.price),
        }
      );
      setEditId(null);
      fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteDoc(doc(db, "users", currentUser!.uid, "counterItems", id));
      fetchItems();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        📋 Counter Items
      </h2>

      <div className="w-full max-w-4xl mx-auto">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow overflow-hidden">
            <thead className="bg-orange-100 text-orange-800">
              <tr>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Marathi</th>
                <th className="py-3 px-4 text-left">Code</th>
                <th className="py-3 px-4 text-left">Price</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-t">
                  <td className="py-2 px-4">
                    {editId === item.id ? (
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {editId === item.id ? (
                      <input
                        name="nameMarathi"
                        value={form.nameMarathi}
                        onChange={handleChange}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      item.nameMarathi
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {editId === item.id ? (
                      <input
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      item.code || "-"
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {editId === item.id ? (
                      <input
                        name="price"
                        type="number"
                        value={form.price}
                        onChange={handleChange}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      `₹${item.price}`
                    )}
                  </td>
                  <td className="py-2 px-4 flex gap-2 justify-center">
                    {editId === item.id ? (
                      <>
                        <button
                          onClick={handleUpdate}
                          className="bg-green-500 text-white px-3 py-1 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-blue-500 text-white px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow p-4 space-y-2 text-sm"
            >
              <div>
                <strong>Name:</strong> {item.name}
              </div>
              <div>
                <strong>Marathi:</strong> {item.nameMarathi}
              </div>
              <div>
                <strong>Code:</strong> {item.code || "-"}
              </div>
              <div>
                <strong>Price:</strong> ₹{item.price}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(item, true)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-gray-500">No items found.</div>
          )}
        </div>
      </div>
      {showMobileEditModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 shadow-lg">
            <h2 className="text-xl font-bold text-center text-blue-600">
              Edit Item
            </h2>

            <input
              type="text"
              name="name"
              placeholder="Item Name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 rounded"
            />
            <input
              type="text"
              name="nameMarathi"
              placeholder="Item Name (Marathi)"
              value={form.nameMarathi}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 rounded"
            />
            <input
              type="text"
              name="code"
              placeholder="Item Code"
              value={form.code}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 rounded"
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 rounded"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setEditId(null);
                  setShowMobileEditModal(false);
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleUpdate();
                  setShowMobileEditModal(false);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded"
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
