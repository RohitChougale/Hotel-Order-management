import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

interface Order {
  id: string;
  table: string;
  items: { name: string; quantity: number }[];
  status: string;
}

export default function KOTBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const prevOrderIds = useRef<Set<string>>(new Set());
  const bellRef = useRef<HTMLAudioElement | null>(null);
   const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", currentUser!.uid, "orders"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Order, "id">),
      }));

      const filtered = list.filter(
        (order) => order.status !== "prepared" && order.status !== "served"
      );

      const currentIds = new Set(filtered.map((order) => order.id));

      const newOrderIds = [...currentIds].filter((id) => !prevOrderIds.current.has(id));

      if (newOrderIds.length > 0) {
        if (bellRef.current) {
          bellRef.current.play().catch(() => {});
        }

        setHighlightedIds((prev) => new Set([...prev, ...newOrderIds]));

        setTimeout(() => {
          setHighlightedIds((prev) => {
            const updated = new Set(prev);
            newOrderIds.forEach((id) => updated.delete(id));
            return updated;
          });
        }, 5000);
      }

      prevOrderIds.current = currentIds;
      setOrders(filtered);
    });

    return () => unsub();
  }, []);

  const markPrepared = async (id: string) => {
    const orderRef = doc(db, "users", currentUser!.uid, "orders", id);
    await updateDoc(orderRef, { status: "prepared" });
  };

  const grouped = orders.reduce((acc: Record<string, Order[]>, order) => {
    acc[order.table] = acc[order.table] || [];
    acc[order.table].push(order);
    return acc;
  }, {});

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <audio ref={bellRef} src="/assets/new-order.wav" preload="auto" />
      {Object.entries(grouped).map(([table, tableOrders]) => (
        <div key={table} className="border rounded p-4 shadow bg-white">
          <h2 className="text-lg font-bold mb-2">Table {table}</h2>
          {tableOrders.map((order) => (
            <div
              key={order.id}
             className={`mb-3 transition-all duration-500 ${
  highlightedIds.has(order.id)
    ? "animate-pulse bg-yellow-100 border-yellow-400 shadow-md"
    : ""
}`}

            >
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span>x {item.quantity}</span>
                </div>
              ))}
              <button
                onClick={() => markPrepared(order.id)}
                className="mt-2 text-xs text-white bg-green-600 px-2 py-1 rounded"
              >
                Mark as Prepared
              </button>
              <hr className="my-2" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
