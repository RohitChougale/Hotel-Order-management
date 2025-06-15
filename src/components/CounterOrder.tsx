import { useEffect, useState, useRef } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";

export default function CounterOrder() {
  type CounterItem = {
    id: string;
    name: string;
    nameMarathi: string;
    price: number;
  };

  const [items, setItems] = useState<CounterItem[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchItems = async () => {
      const snapshot = await getDocs(collection(db, "counterItems"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CounterItem[];
      setItems(list);
    };
    fetchItems();
  }, []);

  const handleQuantityChange = (id: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: qty }));
  };

  const generateCouponId = () => {
    return `COUPON-${Math.floor(10000 + Math.random() * 90000)}`;
  };

  const handleOrder = async () => {
    const filteredItems = items
      .filter((item) => quantities[item.id] > 0)
      .map((item) => ({
        name: item.name,
        nameMarathi: item.nameMarathi,
        price: item.price,
        quantity: quantities[item.id],
        total: item.price * quantities[item.id],
      }));

    if (filteredItems.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    const timestamp = Timestamp.now();
    const couponId = generateCouponId();
    const subTotal = filteredItems.reduce((sum, item) => sum + item.total, 0);

    const orderData = {
      items: filteredItems,
      couponId,
      subTotal,
      timestamp,
    };

    await addDoc(collection(db, "counterOrder"), orderData);

    const printPayload = {
      ...orderData,
      date: dayjs().format("DD-MM-YYYY HH:mm"),
    };

    setPrintData(printPayload);
    setOrderPlaced(true);

    setTimeout(() => {
      window.print();
    }, 300);

    // Clear after print
    setTimeout(() => {
      setQuantities({});
      setOrderPlaced(false);
      setPrintData(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4 sm:p-6">
      <h1 className="text-4xl font-extrabold text-center text-orange-700 mb-6">
        🧾 Counter Order
      </h1>

      <div className="flex justify-center">
        <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md p-5 border flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {item.nameMarathi}
                </h2>
                <p className="text-gray-500 font-medium text-sm">
                  ₹{item.price}
                </p>
              </div>
              <input
                type="number"
                min={0}
                value={quantities[item.id] || ""}
                onChange={(e) =>
                  handleQuantityChange(item.id, parseInt(e.target.value) || 0)
                }
                className="mt-3 w-full border border-gray-300 px-3 py-2 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Quantity"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleOrder}
          className="bg-orange-600 text-white px-8 py-3 rounded-lg shadow hover:bg-orange-700 text-lg font-semibold transition"
        >
          🧾 Place Order & Print
        </button>
      </div>

      {/* Printable Bill */}
      {orderPlaced && printData && (
        <div className="print-only p-4 mt-10" ref={printRef}>
          <div className="text-center text-sm border p-4 w-72 mx-auto bg-white rounded shadow">
            <h2 className="font-bold text-3xl mb-2">🍽️ Your Order</h2>
            <p className="text-2xl mb-1">Date: {printData.date}</p>
            <p className="text-2xl mb-1">Coupon: {printData.couponId}</p>
            <hr className="my-2" />
            {printData.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-2xl mb-1">
                <span>
                  {item.nameMarathi} × {item.quantity}
                </span>
                <span>₹{item.total.toFixed(2)}</span>
              </div>
            ))}
            <hr className="my-2" />
            <p className="font-bold text-2xl">Total: ₹{printData.subTotal.toFixed(2)}</p>
            <p className="text-lg mt-2">🙏 Thank you! Visit Again</p>
          </div>
        </div>
      )}
    </div>
  );
}
