import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { useState } from "react";
import { db } from "../firebase";

export default function OrderSummary(){
     const [selectedDate, setSelectedDate] = useState<string>("");
      const [orderSummary, setOrderSummary] = useState<Record<string, number>>({});
        const [isLoadingOrders, setIsLoadingOrders] = useState(false);
        const fetchOrdersByDate = async () => {
    if (!selectedDate) return;
    setIsLoadingOrders(true);

    const start = new Date(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<", Timestamp.fromDate(end))
    );

    const snapshot = await getDocs(q);
    const summary: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      data.items.forEach((item: { name: string; quantity: number }) => {
        summary[item.name] = (summary[item.name] || 0) + item.quantity;
      });
    });

    setOrderSummary(summary);
    setIsLoadingOrders(false);
  };

        return(
            <div>
                <section className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md space-y-4">
        <h3 className="text-xl font-semibold text-purple-600">📊 Orders Summary by Date</h3>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border px-3 py-2 rounded w-full md:w-auto"
          />
          <button
            onClick={fetchOrdersByDate}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            🔍 Fetch Orders
          </button>
        </div>

        {isLoadingOrders ? (
          <p className="text-gray-600">Loading...</p>
        ) : Object.keys(orderSummary).length > 0 ? (
          <div className="border-t pt-4 space-y-2 text-sm">
            {Object.entries(orderSummary).map(([item, count], idx) => (
              <div key={idx} className="flex justify-between border-b pb-1">
                <span className="font-medium">{item}</span>
                <span className="text-gray-800">× {count}</span>
              </div>
            ))}
          </div>
        ) : (
          selectedDate && <p className="text-gray-500 italic">No orders found for selected date.</p>
        )}
      </section>
            </div>
        )
      
}