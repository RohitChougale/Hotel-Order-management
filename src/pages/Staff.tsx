import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import OrderForm from "../components/OrderForm";
import RunningTables from "../components/RunningTables"; // ✅ Import running tables component
import { Menu } from "lucide-react"; // Optional: for 3-dot icon

interface Order {
  id: string;
  table: string;
  items: { name: string; quantity: number }[];
  status: string;
}

function Staff() {
  const [preparedOrders, setPreparedOrders] = useState<Order[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const newPrepared: Order[] = [];
      const allPrepared: Order[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === "prepared") {
          const orderData = {
            id: doc.id,
            ...(data as Omit<Order, "id">),
          };
          allPrepared.push(orderData);
        }
      });

      snapshot.docChanges().forEach((change) => {
        if (
          change.type === "modified" &&
          change.doc.data().status === "prepared"
        ) {
          const orderData = {
            id: change.doc.id,
            ...(change.doc.data() as Omit<Order, "id">),
          };

          const alreadyExists = preparedOrders.some((o) => o.id === orderData.id);
          if (!alreadyExists) {
            newPrepared.push(orderData);
          }
        }
      });

      setPreparedOrders(allPrepared);

      if (newPrepared.length > 0) {
        setShowNotif(true);
        setTimeout(() => setShowNotif(false), 5000);
      }
    });

    return () => unsub();
  }, []);

  const handleServed = async (id: string) => {
    const orderRef = doc(db, "orders", id);
    await updateDoc(orderRef, { status: "served" });
    setPreparedOrders((prev) => prev.filter((order) => order.id !== id));
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`bg-gray-100 w-64 p-4 border-r z-40 transform transition-transform duration-300
          md:translate-x-0 md:relative md:block
          ${showSidebar ? "translate-x-0 fixed top-0 left-0 h-full shadow-lg" : "-translate-x-full fixed top-0 left-0 h-full"}
        `}
      >
        <div className="flex justify-between items-center mb-4 md:hidden">
          <h2 className="text-xl font-semibold">Running Tables</h2>
          <button onClick={() => setShowSidebar(false)} className="text-gray-600 text-lg">
            ✖
          </button>
        </div>
        <RunningTables />
      </aside>
<div className="md:hidden flex justify-start items-start h-12 px-0">
  <button
    onClick={() => setShowSidebar(true)}
    className="p-2 rounded-full bg-gray-200 text-gray-800"
  >
    <Menu size={20} />
  </button>
</div>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-5xl mx-auto">
        {/* Mobile toggle button */}
        

        <h2 className="text-3xl font-bold mb-6 text-gray-800">Staff Panel</h2>

        {showNotif && (
          <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-6 shadow transition-opacity duration-300">
            🛎️ New order(s) marked as <strong>Prepared</strong>!
          </div>
        )}

        {preparedOrders.length > 0 && (
          <div className="mt-6">
            <h3 className="text-2xl font-semibold mb-4 text-gray-700">Prepared Orders</h3>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {preparedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-lg font-bold text-gray-800">🪑 Table {order.table}</p>
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Prepared
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1 border-t pt-2">
                    {order.items.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-medium">× {item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="text-right text-xs text-gray-500 italic">
                        + {order.items.length - 4} more
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleServed(order.id)}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl font-semibold shadow transition"
                  >
                    ✅ Mark as Served
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <h3 className="text-2xl font-semibold mb-4 text-gray-700">Take New Order</h3>
          <OrderForm />
        </div>
      </main>
    </div>
  );
}

export default Staff;
