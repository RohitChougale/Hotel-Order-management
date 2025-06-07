import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import { db } from "../firebase";

interface Item {
  name: string;
  price: number;
  quantity: number;
}

interface RunningTable {
  id: string;
  table: string;
  items: Item[];
  acCharge: number;
  gstAmount: number;
  total: number;
}

export default function RunningTables() {
  const [tables, setTables] = useState<RunningTable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRunningTables = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "runningTables"));
    const data = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<RunningTable, "id">),
    }));
    setTables(data);
    setLoading(false);
  };

  const handleCloseTable = async (table: RunningTable) => {
    try {
      // 1. Add to "bills" collection
      await addDoc(collection(db, "bills"), {
        ...table,
        paid: "no",
        closedAt: new Date(),
      });

      // 2. Remove from "runningTables"
      await deleteDoc(doc(db, "runningTables", table.id));

      alert(`Table ${table.table} closed and moved to billing!`);

      // 3. Refresh list
      fetchRunningTables();
    } catch (err) {
      console.error("Error closing table:", err);
      alert("Failed to close table. Try again.");
    }
  };

  useEffect(() => {
    fetchRunningTables();
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🧾 Running Tables</h2>

      {tables.length === 0 ? (
        <p>No running tables right now.</p>
      ) : (
        <div className="space-y-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="border p-4 rounded shadow bg-white"
            >
              <h3 className="text-lg font-semibold mb-2">
                Table: {table.table}
              </h3>
              <ul className="text-sm mb-2">
                {table.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{item.quantity * item.price}</span>
                  </li>
                ))}
              </ul>

              <div className="text-sm text-gray-600 mb-2">
  <p>AC Charge: ₹{Number(table.acCharge).toFixed(2)}</p>
  <p>GST: ₹{Number(table.gstAmount).toFixed(2)}</p>
  <p className="font-semibold">Total: ₹{Number(table.total).toFixed(2)}</p>
</div>


              <button
                onClick={() => handleCloseTable(table)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Close Table
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
