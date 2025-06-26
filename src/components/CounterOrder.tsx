import { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

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
    code: string;
  };

  const [items, setItems] = useState<CounterItem[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [hotelInfo, setHotelInfo] = useState<{
    hotelName: string;
    gstNumber?: string;
    gstPercentage?: number;
  } | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [filteredItems, setFilteredItems] = useState<CounterItem[]>([]);
  
  // Cancel coupon states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelCouponId, setCancelCouponId] = useState("");
  const [couponToCancel, setCouponToCancel] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      const snapshot = await getDocs(
        collection(db, "users", currentUser!.uid, "counterItems")
      );
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CounterItem[];
      setItems(list);
    };
    fetchItems();

    const fetchHotelInfo = async () => {
      const docRef = doc(
        db,
        "users",
        currentUser!.uid,
        "counterHotelInfo",
        "info"
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setHotelInfo(docSnap.data() as any);
      }
    };
    fetchHotelInfo();
  }, []);

  // Hotkey functionality
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if not typing in an input field
      if (event.target instanceof HTMLInputElement) return;
      
      if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        handleOrder("table");
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        handleOrder("Parcel");
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [quantities, items]);

  useEffect(() => {
    if (searchCode.trim() === "") {
      setFilteredItems([]);
    } else {
      const codes = searchCode
        .split(" ")
        .map((code) => code.trim().toLowerCase())
        .filter((code) => code);
      const results = items.filter((item) =>
        codes.some((code) => item.code?.toLowerCase().includes(code))
      );
      setFilteredItems(results);
    }
  }, [searchCode, items]);

  const handleQuantityChange = (id: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: qty }));
  };

  const getTodayDate = () => dayjs().format("YYYY-MM-DD");

  const getNextCouponNumber = async () => {
    const metaRef = doc(
      db,
      "users",
      currentUser!.uid,
      "counterMeta",
      "couponTracker"
    );
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

  const handleOrder = async (orderType: "table" | "Parcel") => {
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
    const couponId = `${String(couponNumber).padStart(3, "0")}`;
    const subTotal = filteredItems.reduce((sum, item) => sum + item.total, 0);

    const orderData = {
      items: filteredItems,
      couponId,
      subTotal,
      timestamp,
      orderType,
    };

    await addDoc(collection(db, "users", currentUser!.uid, "counterOrder"), orderData);
    await addDoc(collection(db, "users", currentUser!.uid, "counterbill"), orderData);

    const printPayload = {
      ...orderData,
      hotelName: hotelInfo?.hotelName || "",
      date: dayjs().format("DD-MM-YYYY HH:mm"),
    };

    setPrintData(printPayload);
    setOrderPlaced(true);

    if (
      window.ReactNativeWebView &&
      typeof window.ReactNativeWebView.postMessage === "function"
    ) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: "print", payload: printPayload })
      );
    } else {
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

  // Cancel coupon functionality
  const searchCoupon = async () => {
    if (!cancelCouponId.trim()) {
      alert("Please enter a coupon ID");
      return;
    }

    setCancelLoading(true);
    try {
      // Search in counterOrder collection
      const orderQuery = query(
        collection(db, "users", currentUser!.uid, "counterOrder"),
        where("couponId", "==", cancelCouponId.trim())
      );
      const orderSnapshot = await getDocs(orderQuery);

      if (orderSnapshot.empty) {
        alert("Coupon not found or already closed");
        setCancelLoading(false);
        return;
      }

      const couponData = {
        id: orderSnapshot.docs[0].id,
        ...orderSnapshot.docs[0].data(),
      };
      setCouponToCancel(couponData);
    } catch (error) {
      console.error("Error searching coupon:", error);
      alert("Error searching coupon. Please try again.");
    }
    setCancelLoading(false);
  };

  const cancelCoupon = async () => {
    if (!couponToCancel) return;

    if (!confirm(`Are you sure you want to cancel coupon ${couponToCancel.couponId}?`)) {
      return;
    }

    setCancelLoading(true);
    try {
      // Delete from counterOrder
      await deleteDoc(doc(db, "users", currentUser!.uid, "counterOrder", couponToCancel.id));

      // Delete from counterbill
      const billQuery = query(
        collection(db, "users", currentUser!.uid, "counterbill"),
        where("couponId", "==", couponToCancel.couponId)
      );
      const billSnapshot = await getDocs(billQuery);
      
      if (!billSnapshot.empty) {
        await deleteDoc(doc(db, "users", currentUser!.uid, "counterbill", billSnapshot.docs[0].id));
      }

      alert(`Coupon ${couponToCancel.couponId} has been cancelled successfully`);
      
      // Reset states and close dialog
      setCancelCouponId("");
      setCouponToCancel(null);
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error cancelling coupon:", error);
      alert("Error cancelling coupon. Please try again.");
    }
    setCancelLoading(false);
  };

  const closeCancelDialog = () => {
    setShowCancelDialog(false);
    setCancelCouponId("");
    setCouponToCancel(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-700">
          🧾 Counter Order
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowCancelDialog(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 font-semibold transition text-sm sm:text-base"
          >
            ❌ Cancel Coupon
          </button>
          <button
            onClick={() => navigate("/runningCoupons")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 font-semibold transition text-sm sm:text-base"
          >
            🔖 Running Coupons
          </button>
        </div>
      </div>

      {/* Hotkey Instructions */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-sm">
        <p className="text-blue-800">
          <strong>Hotkeys:</strong> Press <kbd className="bg-blue-200 px-1 rounded">T</kbd> for Table Order, 
          <kbd className="bg-blue-200 px-1 rounded ml-1">P</kbd> for Parcel Order
        </p>
      </div>

      {/* Search Code Input */}
      <div className="flex items-center justify-center mb-4 relative">
        <input
          type="text"
          placeholder="Search by Item Code"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {searchCode && (
          <button
            onClick={() => setSearchCode("")}
            className="ml-2 hover:text-black-600 font-bold text-xl bg-red-600 text-white px-3 py-1 rounded-lg border border-white-300"
          >
            ×
          </button>
        )}
      </div>

      {/* Items Grid */}
      <h2 className="text-2xl font-bold text-orange-800 mb-4">
        🧺 Available Items
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(filteredItems.length > 0 ? filteredItems : items).map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-md p-5 border relative hover:shadow-lg transition"
          >
            <div className="absolute top-2 right-2 bg-orange-200 text-orange-800 text-xl font-bold px-2 py-1 rounded">
              Code: {item.code}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">{item.name}</h2>
              <p className="text-gray-500 font-medium text-sm mb-2">₹{item.price}</p>
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

      {/* Order Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 text-center">
        <button
          onClick={() => handleOrder("table")}
          className="bg-green-600 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-lg shadow hover:bg-green-700 text-lg sm:text-xl font-semibold transition"
        >
          ✅ Table Order & Print <kbd className="ml-2 bg-green-500 px-2 py-1 rounded text-sm">(T)</kbd>
        </button>

        <button
          onClick={() => handleOrder("Parcel")}
          className="bg-blue-600 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-lg shadow hover:bg-blue-700 text-lg sm:text-xl font-semibold transition"
        >
          🛍️ Parcel & Print <kbd className="ml-2 bg-blue-500 px-2 py-1 rounded text-sm">(P)</kbd>
        </button>
      </div>

      {/* Cancel Coupon Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-700">Cancel Coupon</h3>
              <button
                onClick={closeCancelDialog}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Coupon ID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cancelCouponId}
                  onChange={(e) => setCancelCouponId(e.target.value)}
                  placeholder="e.g., COUPON-001"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <button
                  onClick={searchCoupon}
                  disabled={cancelLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {cancelLoading ? "..." : "Search"}
                </button>
              </div>
            </div>

            {couponToCancel && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                <h4 className="font-bold text-lg mb-2">{couponToCancel.couponId}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Order Type: {couponToCancel.orderType}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Date: {dayjs(couponToCancel.timestamp?.toDate?.()).format("DD-MM-YYYY HH:mm")}
                </p>
                <div className="text-sm mb-2">
                  <strong>Items:</strong>
                  <ul className="mt-1">
                    {couponToCancel.items?.map((item: any, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item.name} × {item.quantity}</span>
                        <span>₹{item.total}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="font-bold">Total: ₹{couponToCancel.subTotal}</p>
                
                <button
                  onClick={cancelCoupon}
                  disabled={cancelLoading}
                  className="w-full mt-3 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelLoading ? "Cancelling..." : "Cancel This Coupon"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Bill */}
      {orderPlaced && printData && (
        <div className="print-only p-2 mt-10" ref={printRef}>
          <div className="text-center text-sm border p-2 w-60 mx-auto bg-white rounded shadow">
            <h2 className="font-bold text-3xl mb-2">
              🍽️ {hotelInfo?.hotelName}
            </h2>
            <p className="text-2xl font-bold mb-1">{printData.couponId}</p>
            <p className="text-lx mb-1">Date: {printData.date}</p>
            <p className="text-lx mb-1">Order Type: {printData.orderType}</p>
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