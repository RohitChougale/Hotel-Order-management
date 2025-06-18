import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";

export default function RunningCoupons() {
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = async () => {
    const snapshot = await getDocs(collection(db, "counterOrder"));
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOrders(list);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCloseCoupon = async (id: string) => {
    if (confirm("Are you sure you want to close this coupon?")) {
      await deleteDoc(doc(db, "counterOrder", id));
      fetchOrders(); // Refresh the list
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <h1 className="text-3xl font-extrabold text-orange-700 text-center mb-6">
        🔖 Running Coupons
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">No running coupons.</p>
      ) : (
        <div className="grid gap-4 max-w-4xl mx-auto">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white shadow-md rounded-lg p-4 border"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-orange-800">
                  Coupon: {order.couponId}
                </h2>
                <span className="text-sm text-gray-500">
                  {dayjs(order.timestamp?.toDate?.()).format("DD-MM-YYYY HH:mm")}
                </span>
              </div>

              <ul className="text-sm text-gray-800 mb-2">
                {order.items.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.nameMarathi} × {item.quantity} = ₹{item.total}
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center">
                <p className="font-bold text-lg text-gray-700">
                  Total: ₹{order.subTotal}
                </p>
                <button
                  onClick={() => handleCloseCoupon(order.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm font-semibold"
                >
                  Close Coupon
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
