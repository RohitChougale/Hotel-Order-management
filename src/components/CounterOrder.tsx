import { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}


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
  const [hotelInfo, setHotelInfo] = useState<{ hotelName: string; gstNumber?: string; gstPercentage?: number } | null>(null);

  const navigate = useNavigate();

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

     const fetchHotelInfo = async () => {
    const docRef = doc(db, "counterHotelInfo", "info");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setHotelInfo(docSnap.data() as any);
    }
  };
  fetchHotelInfo();
  }, []);



  const handleQuantityChange = (id: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: qty }));
  };

  const getTodayDate = () => dayjs().format("YYYY-MM-DD");

  const getNextCouponNumber = async () => {
    const metaRef = doc(db, "counterMeta", "couponTracker");
    const metaSnap = await getDoc(metaRef);
    const today = getTodayDate();

    let newCouponNumber = 1;

    if (metaSnap.exists()) {
      const data = metaSnap.data();
      if (data.lastResetDate === today) {
        newCouponNumber = data.lastCouponNumber + 1;
        if (newCouponNumber > 100) newCouponNumber = 1;
      }
    }

    await setDoc(metaRef, {
      lastCouponNumber: newCouponNumber,
      lastResetDate: today,
    });

    return newCouponNumber;
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
  const couponNumber = await getNextCouponNumber();
  const couponId = `COUPON-${String(couponNumber).padStart(3, "0")}`;
  const subTotal = filteredItems.reduce((sum, item) => sum + item.total, 0);

  const orderData = {
    items: filteredItems,
    couponId,
    subTotal,
    timestamp,
  };

  await addDoc(collection(db, "counterOrder"), orderData);
  await addDoc(collection(db, "counterbill"), orderData);

  const printPayload = {
    ...orderData,
    hotelName: hotelInfo?.hotelName || '',
    date: dayjs().format("DD-MM-YYYY HH:mm"),
  };

  setPrintData(printPayload);
  setOrderPlaced(true);

  // 👉 Send data to React Native app if inside WebView
  if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "print", payload: printPayload }));
  } else {
    // fallback: browser print
    setTimeout(() => {
      window.print();
    }, 300);
  }

  setTimeout(() => {
    setQuantities({});
    setOrderPlaced(false);
    setPrintData(null);
  }, 1000);
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-700">
          🧾 Counter Order
        </h1>
        <button
          onClick={() => navigate("/runningCoupons")}
          className="bg-green-600 text-white px-5 py-2 rounded-lg shadow hover:bg-orange-700 font-semibold transition"
        >
          🔖 Running Coupons
        </button>
      </div>

      {/* Items Grid */}
      <h2 className="text-2xl font-bold text-orange-800 mb-4">
        🧺 Available Items
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-md p-5 border flex flex-col justify-between hover:shadow-lg transition"
          >
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                {item.name}
              </h2>
              <p className="text-gray-500 font-medium text-sm mb-2">
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
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Quantity"
            />
          </div>
        ))}
      </div>

      {/* Order Button */}
      <div className="mt-10 text-center">
        <button
          onClick={handleOrder}
          className="bg-green-600 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-lg shadow hover:bg-orange-700 text-lg sm:text-xl font-semibold transition"
        >
          ✅ Place Order & Print
        </button>
      </div>

      {/* Printable Bill */}
      {orderPlaced && printData && (
        <div className="print-only p-2 mt-10" ref={printRef}>
          <div className="text-center text-sm border p-2 w-60 mx-auto bg-white rounded shadow">
            <h2 className="font-bold text-3xl mb-2">🍽️ {hotelInfo?.hotelName}</h2>
            <p className="text-2xl font-bold mb-1">{printData.couponId}</p>
            <p className="text-lx mb-1">Date: {printData.date}</p>
            <hr className="my-2" />
            {printData.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xl mb-1">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>₹{item.total.toFixed(2)}</span>
              </div>
            ))}
            <hr className="my-2" />
            <p className="font-bold text-xl">
              Total: ₹{printData.subTotal.toFixed(2)}
            </p>
            <p className="text-base mt-2">🙏 Thank you! Visit Again</p>
          </div>
        </div>
      )}
    </div>
  );
}
