import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tableRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});
   const auth = getAuth();
  const currentUser = auth.currentUser;

  // Realtime fetch
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users", currentUser!.uid, "runningTables"),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<RunningTable, "id">),
        }));
        setTables(data);
        setLoading(false);
      },
      (error) => {
        console.error("Realtime fetch failed:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  const handleCloseTable = async (table: RunningTable) => {
    try {
      await addDoc(collection(db, "users", currentUser!.uid, "bills"), {
        ...table,
        paid: "no",
        closedAt: new Date(),
      });
      await deleteDoc(doc(db, "users", currentUser!.uid, "runningTables", table.id));
      alert(`Table ${table.table} closed and moved to billing!`);
      setExpandedId(null);
    } catch (err) {
      console.error("Error closing table:", err);
      alert("Failed to close table. Try again.");
    }
  };

  useEffect(() => {
    if (expandedId && tableRefs.current[expandedId]) {
      tableRefs.current[expandedId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [expandedId]);

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="flex h-screen">
      <div className="w-72 bg-gray-100 border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">🧾 Running Tables</h2>
        {tables.length === 0 ? (
          <p className="text-sm">No running tables</p>
        ) : (
          <ul className="space-y-2">
            {tables.map((table) => (
              <li
                key={table.id}
                ref={(el) => (tableRefs.current[table.id] = el)}
                className="transition-all duration-300"
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === table.id ? null : table.id)
                  }
                  className={`w-full text-left px-3 py-2 rounded shadow text-sm font-medium transition-all duration-200 ${
                    expandedId === table.id
                      ? "bg-blue-100 font-semibold"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Table {table.table}
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedId === table.id ? "max-h-96 mt-2" : "max-h-0"
                  }`}
                >
                  {expandedId === table.id && (
                    <div className="bg-white rounded-lg p-3 shadow-inner text-sm space-y-2 border">
                      <ul className="space-y-1">
                        {table.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>₹{item.price * item.quantity}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="text-gray-600 border-t pt-2 text-xs space-y-1">
                        <p>AC Charge: ₹{Number(table.acCharge).toFixed(2)}</p>
                        <p>GST: ₹{Number(table.gstAmount).toFixed(2)}</p>
                        <p className="font-semibold">
                          Total: ₹{Number(table.total).toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCloseTable(table)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-semibold"
                      >
                        Close Table
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
