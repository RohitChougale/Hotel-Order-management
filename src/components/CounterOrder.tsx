import { useEffect, useState, useRef, useMemo } from "react";
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
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import BackButton from "../elements/BackButton";

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
    logo: string;
  } | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [filteredItems, setFilteredItems] = useState<CounterItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Online">("Cash");
  const [numberOfPrints, setNumberOfPrints] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);

  // Cancel coupon states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelCouponId, setCancelCouponId] = useState("");
  const [couponToCancel, setCouponToCancel] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  // Memoized calculation for the bill preview
  const currentOrderDetails = useMemo(() => {
    const orderItems = items
      .filter((item) => quantities[item.id] > 0)
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: quantities[item.id],
        total: item.price * (quantities[item.id] || 0),
      }));

    const subTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = subTotal; // Can be expanded with taxes/discounts later

    return { orderItems, subTotal, grandTotal };
  }, [items, quantities]);

    useEffect(() => {
    if (!currentUser) return; // Exit if user is not logged in

    const fetchInitialData = async () => {
      // Set up all queries to run in parallel
      const itemsQuery = getDocs(collection(db, "users", currentUser.uid, "counterItems"));
      const hotelInfoQuery = getDoc(doc(db, "users", currentUser.uid, "counterHotelInfo", "info"));
      const printSettingsQuery = getDoc(doc(db, "users", currentUser.uid, "settings", "userSettings"));

      // Wait for all of them to complete
      const [itemsSnapshot, hotelInfoSnap, settingsSnap] = await Promise.all([
        itemsQuery, 
        hotelInfoQuery, 
        printSettingsQuery
      ]);

      // Process Items
      const list = itemsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CounterItem[];
      list.sort((a, b) => Number(a.code) - Number(b.code));
      setItems(list);

      // Process Hotel Info
      if (hotelInfoSnap.exists()) setHotelInfo(hotelInfoSnap.data() as any);

      // Process Print Settings
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data.numberOfPrints) setNumberOfPrints(data.numberOfPrints);
      }
    };

    fetchInitialData().catch(console.error); // Run the function and log any errors
  }, [currentUser]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
     if (event.key.toLowerCase() === "t") {
  event.preventDefault();
  handleOrder("Table");
} else if (event.key.toLowerCase() === "p") {
  event.preventDefault();
  handleOrder("Parcel");
} else if (event.key.toLowerCase() === "s") {
  event.preventDefault();
  handleOrder("Swiggy/Zomato");
}
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [quantities, items, paymentMethod]); // Dependencies updated
// Replace your existing useEffect for search with this updated version:

// Replace your existing useEffect for search with this updated version:

// Replace your existing useEffect for search with this updated version:

useEffect(() => {
  if (searchCode.trim() === "") {
    setFilteredItems([]);
  } else {
    const searchTerms = searchCode
      .split(" ")
      .map((term) => term.trim())
      .filter(Boolean);
    
    const results = items.filter((item) => {
      return searchTerms.some((term) => {
        const termLower = term.toLowerCase();
        
        // Try multiple comparison methods for codes
        const itemCode = item.code;
        
        // Method 1: Direct comparison
        if (itemCode === term) {
          return true;
        }
        
        // Method 2: Case insensitive comparison
        if (itemCode?.toString().toLowerCase() === termLower) {
          return true;
        }
        
        // Method 3: Trimmed comparison (in case of whitespace)
        if (itemCode?.toString().trim() === term.trim()) {
          return true;
        }
        
        // Method 4: Case insensitive trimmed comparison
        if (itemCode?.toString().trim().toLowerCase() === termLower) {
          return true;
        }
        
        // Check for partial name match (case insensitive)
        if (item.name?.toLowerCase().startsWith(termLower)) return true;
        
        // Check for partial Marathi name match (case insensitive)
        if (item.nameMarathi?.toLowerCase().includes(termLower)) {
          return true;
        }
        
        return false;
      });
    });
    
    // Enhanced debug info
    console.log('=== SEARCH DEBUG ===');
    console.log('Search input:', `"${searchCode}"`);
    console.log('Search terms:', searchTerms);
    console.log('Total items:', items.length);
    console.log('All item codes:', items.map(item => `"${item.code}"`).join(', '));
    console.log('Codes that contain your search term:', 
      items.filter(item => 
        searchTerms.some(term => 
          item.code?.toString().includes(term)
        )
      ).map(item => ({ code: `"${item.code}"`, name: item.name }))
    );
    console.log('Filtered results:', results.length);
    console.log('===================');
    
    setFilteredItems(results);
  }
}, [searchCode, items]);

  const handleQuantityChange = (id: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: qty >= 0 ? qty : 0 }));
  };

  const getTodayDate = () => dayjs().format("YYYY-MM-DD");

   const getNextCouponNumber = async () => {
    const metaRef = doc(db, "users", currentUser!.uid, "counterMeta", "couponTracker");
    
    // Use a transaction to safely read and write the coupon number
    const newCouponNumber = await runTransaction(db, async (transaction) => {
      const metaDoc = await transaction.get(metaRef);
      const today = dayjs().format("YYYY-MM-DD");
      let nextCoupon = 1;

      if (metaDoc.exists()) {
        const data = metaDoc.data();
        // Reset counter if it's a new day
        if (data.lastResetDate === today) {
          nextCoupon = data.lastCouponNumber + 1;
        }
      }
      
      // Update the document within the transaction
      transaction.set(metaRef, {
        lastCouponNumber: nextCoupon,
        lastResetDate: today,
      });
      
      return nextCoupon; // Return the new number
    });

    return newCouponNumber;
  };

    const handleOrder = async (orderType: "Table" | "Parcel" | "Swiggy/Zomato") => {
    // 1. Add a guard clause to prevent multiple clicks
    if (isPrinting) {
      console.log("An order is already being processed. Please wait.");
      return;
    }

    const { orderItems, subTotal } = currentOrderDetails;
    if (orderItems.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    
    // 2. Lock the UI immediately
    setIsPrinting(true); 
    setOrderPlaced(true); 

    try {
      const couponNumber = await getNextCouponNumber();
      const couponId = `${String(couponNumber).padStart(2, "0")}`;

      const timestamp = Timestamp.now();
      const orderData = {
        items: orderItems.map(({ id, ...rest }) => rest),
        couponId,
        subTotal,
        timestamp,
        orderType,
        payment: paymentMethod,
      };

      const printPayload = {
        ...orderData,
        hotelName: hotelInfo?.hotelName || "",
        date: dayjs(timestamp.toDate()).format("DD-MM-YYYY HH:mm"),
      };
      
      setPrintData(printPayload);
      
      setTimeout(() => {
        if (window.ReactNativeWebView?.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "print", payload: printPayload }));
        } else {
          for (let i = 0; i < numberOfPrints; i++) {
            setTimeout(() => window.print(), i * 500);
          }
        }
      }, 100);

      const counterOrderPromise = addDoc(collection(db, "users", currentUser!.uid, "counterOrder"), orderData);
      const counterBillPromise = addDoc(collection(db, "users", currentUser!.uid, "counterbill"), orderData);

      await Promise.all([counterOrderPromise, counterBillPromise]);
        
    } catch (error) {
      console.error("Error placing order:", error);
      alert("There was an error placing your order. Please try again.");
      setIsPrinting(false); // Unlock on error
      setOrderPlaced(false);
      setPrintData(null);
      return;
    }

    // --- CLEANUP: Reset UI state after a longer delay ---
    // Make this timeout longer than your expected print time
    setTimeout(() => {
      setQuantities({});
      setOrderPlaced(false);
      setPrintData(null);
      setIsPrinting(false); // 3. Unlock the UI only when everything is done
    }, 5000); // Increased to 3 seconds for safety
  };

  // --- Cancel coupon functions remain unchanged ---
  const searchCoupon = async () => {
    if (!cancelCouponId.trim()) return alert("Please enter a coupon ID");
    setCancelLoading(true);
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
    setCouponToCancel({
      id: orderSnapshot.docs[0].id,
      ...orderSnapshot.docs[0].data(),
    });
    setCancelLoading(false);
  };

  const cancelCoupon = async () => {
    if (
      !couponToCancel ||
      !confirm(
        `Are you sure you want to cancel coupon ${couponToCancel.couponId}?`
      )
    )
      return;
    setCancelLoading(true);
    await deleteDoc(
      doc(db, "users", currentUser!.uid, "counterOrder", couponToCancel.id)
    );
    const billQuery = query(
      collection(db, "users", currentUser!.uid, "counterbill"),
      where("couponId", "==", couponToCancel.couponId)
    );
    const billSnapshot = await getDocs(billQuery);
    if (!billSnapshot.empty) {
      await deleteDoc(
        doc(
          db,
          "users",
          currentUser!.uid,
          "counterbill",
          billSnapshot.docs[0].id
        )
      );
    }
    alert(`Coupon ${couponToCancel.couponId} has been cancelled successfully`);
    closeCancelDialog();
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
        <div className="flex flex-col  sm:flex-row gap-2">
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

      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-sm">
          <p className="text-blue-800">
            <strong>Hotkeys:</strong> Press{" "}
            <kbd className="bg-blue-200 px-1 rounded">T</kbd> for Table,{" "}
            <kbd className="bg-blue-200 px-1 rounded ml-1">P</kbd> for Parcel,{" "} 
            <kbd className="bg-blue-200 px-1 rounded ml-1">S</kbd> for Delivery Partner
          </p>
        </div>
        <div className="flex items-center justify-center gap-6 mb-6">
  <label className="flex items-center gap-3 text-base sm:text-lg font-medium text-gray-800">
    <input
      type="radio"
      name="payment"
      value="Cash"
      checked={paymentMethod === "Cash"}
      onChange={() => setPaymentMethod("Cash")}
      className="accent-green-600 w-5 h-5"
    />
    <span>💵 Cash</span>
  </label>

  <label className="flex items-center gap-3 text-base sm:text-lg font-medium text-gray-800">
    <input
      type="radio"
      name="payment"
      value="Online"
      checked={paymentMethod === "Online"}
      onChange={() => setPaymentMethod("Online")}
      className="accent-blue-600 w-5 h-5"
    />
    <span>📲 Online</span>
  </label>
</div>

        <div className="flex items-center justify-center relative">
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
      </div>

      {/* Available Items */}
      <h2 className="text-2xl font-bold text-orange-800 mb-4 text-center sm:text-left">
        🧺 Available Items
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
  {(filteredItems.length > 0 ? filteredItems : items).map((item) => (
    <div
      key={item.id}
      className="bg-white rounded-xl shadow-md p-4 border relative hover:shadow-lg transition flex flex-col"
    >
      <div className="absolute top-1 right-2 text-orange-800 text-xs font-bold px-1 rounded">
        Code: {item.code}
      </div>

      <div className="flex-grow">
        <h2 className="text-base font-bold text-gray-800 mb-1">{item.name}</h2>
        <p className="text-gray-500 font-medium text-sm mb-2">₹{item.price}</p>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2">
        <button
          onClick={() =>
            handleQuantityChange(item.id, Math.max((quantities[item.id] || 0) - 1, 0))
          }
          className="bg-gray-200 hover:bg-gray-300 text-xl font-bold w-8 h-8 rounded"
        >
          –
        </button>
        <input
          type="number"
          min={0}
          value={quantities[item.id] || ""}
          onChange={(e) =>
            handleQuantityChange(item.id, parseInt(e.target.value) || 0)
          }
          className="w-14 border border-gray-300 px-2 py-1 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="Qty"
        />
        <button
          onClick={() =>
            handleQuantityChange(item.id, (quantities[item.id] || 0) + 1)
          }
          className="bg-gray-200 hover:bg-gray-300 text-xl font-bold w-8 h-8 rounded"
        >
          +
        </button>
      </div>
    </div>
  ))}
</div>


      {/* --- Start of New Bill Preview Section --- */}
      {currentOrderDetails.orderItems.length > 0 && (
        <div className="mt-10 max-w-xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 text-center">
            Bill Preview
          </h2>
          {/* Item List */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {currentOrderDetails.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-sm sm:text-base"
              >
                <div>
                  <p className="font-semibold text-gray-700">{item.name}</p>
                  <p className="text-gray-500">
                    ₹{item.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-gray-800">
                  ₹{item.total.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="mt-4 border-t-2 border-dashed pt-4 space-y-2">
            <div className="flex justify-between font-semibold text-base sm:text-lg">
              <span>Subtotal</span>
              <span>₹{currentOrderDetails.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-xl sm:text-2xl text-orange-700 mt-2">
              <span>Grand Total</span>
              <span>₹{currentOrderDetails.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
      {/* --- End of New Bill Preview Section --- */}

      {/* Order Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 text-center">
        <button
          onClick={() => handleOrder("Table")}
          disabled={isPrinting}
          className="bg-green-600 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-lg shadow hover:bg-green-700 text-lg sm:text-xl font-semibold transition"
        >
          {isPrinting ? "Processing..." : "✅ Table Order & Print"}
        </button>
        <button
          onClick={() => handleOrder("Parcel")}
          disabled={isPrinting}
          className="bg-blue-600 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-lg shadow hover:bg-blue-700 text-lg sm:text-xl font-semibold transition"
        >
          {isPrinting ? "Processing..." : "🛍️ Parcel & Print"}
          
        </button>
        <button
  onClick={() => handleOrder("Swiggy/Zomato")}
  disabled={isPrinting}
  className="bg-purple-600 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-lg shadow hover:bg-purple-700 text-lg sm:text-xl font-semibold transition"
>
  {isPrinting ? "Processing..." : "🛵 Swiggy/Zomato & Print"}
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
                  placeholder="e.g., 01"
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
                <h4 className="font-bold text-lg mb-2">
                  {couponToCancel.couponId}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Order Type: {couponToCancel.orderType}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Date:{" "}
                  {dayjs(couponToCancel.timestamp?.toDate?.()).format(
                    "DD-MM-YYYY HH:mm"
                  )}
                </p>
                <div className="text-sm mb-2">
                  <strong>Items:</strong>
                  <ul className="mt-1">
                    {couponToCancel.items?.map((item: any, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
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
             {hotelInfo?.logo ? (
        <img
          src={hotelInfo.logo}
          alt="Hotel Logo"
          className="w-20 h-20 mx-auto mb-2 object-contain"
        />
      ) : (
        <h2 className="font-bold text-3xl mb-2">
          🍽️ {hotelInfo?.hotelName}
        </h2>
      )}
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
