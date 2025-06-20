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
  const [form, setForm] = useState({ name: "", nameMarathi: "", price: "" });
   const auth = getAuth();
  const currentUser = auth.currentUser;

  const fetchItems = async () => {
    const snapshot = await getDocs(collection(db, "users", currentUser!.uid, "counterItems"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setItems(data as any);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      nameMarathi: item.nameMarathi,
      price: item.price,
    });
  };

  const handleUpdate = async () => {
    if (editId) {
      await updateDoc(doc(db, "users", currentUser!.uid, "counterItems", editId), {
        ...form,
        price: parseFloat(form.price),
      });
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
        📋 Counter Items List
      </h2>

      <div className="overflow-x-auto max-w-4xl mx-auto">
        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-orange-100 text-orange-800">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Marathi</th>
              <th className="py-3 px-4 text-left">Price</th>
              <th className="py-3 px-4">Actions</th>
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
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
