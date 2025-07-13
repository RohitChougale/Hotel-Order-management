import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import { getAuth } from "firebase/auth";
import BackButton from "../elements/BackButton";

export default function RunningCoupons() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topItems, setTopItems] = useState<string[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [allItemNames, setAllItemNames] = useState<string[]>([]);
  const formatDate = (date: Date) => dayjs(date).format("YYYY-MM-DD");


  const auth = getAuth();
  const currentUser = auth.currentUser;

  // 🔹 Fetch top items from Firestore on mount
  useEffect(() => {
    if (!currentUser) return;

    const fetchTopItems = async () => {
      try {
        const topDoc = await getDoc(doc(db, "users", currentUser.uid, "settings", "topItems"));
        if (topDoc.exists()) {
          const data = topDoc.data();
          setTopItems(data.items || []);
        } else {
          setShowItemSelector(true);
        }
      } catch (err) {
        console.error("Error fetching top items", err);
      }
    };

    fetchTopItems();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", currentUser.uid, "counterOrder"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        const sortedList = list.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.()?.getTime?.() || 0;
          const timeB = b.timestamp?.toDate?.()?.getTime?.() || 0;
          return timeB - timeA;
        });
        setOrders(sortedList);
        setLoading(false);

        // 🔹 Extract unique item names
        const allNames = new Set<string>();
        sortedList.forEach((order) => {
          order.items.forEach((item: any) => allNames.add(item.name));
        });
        setAllItemNames(Array.from(allNames));
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleCloseCoupon = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", currentUser!.uid, "counterOrder", id));
    } catch (error) {
      console.error("Error closing coupon:", error);
      alert("Failed to close coupon. Please try again.");
    }
  };

  const isReactNative = () => {
    return window.ReactNativeWebView !== undefined;
  };

  const postMessageToReactNative = (data: any) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  };

  const handlePrintBill = (order: any) => {
    if (isReactNative()) {
      const printData = {
        type: 'print',
        payload: {
          hotelName:'Reprinted',
          couponId: order.couponId,
          orderType: order.orderType,
          date: dayjs(order.timestamp?.toDate?.()).format("DD-MM-YYYY"),
          time: dayjs(order.timestamp?.toDate?.()).format("HH:mm"),
          items: order.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            total: item.total
          })),
          subTotal: order.subTotal,
          timestamp: order.timestamp
        }
      };
      postMessageToReactNative(printData);
      return;
    }

    // Web printing fallback
    const printContent = `
      <div style="width: 58mm; font-family: monospace; font-size: 10px; line-height: 1.2;">
        <div style="text-align: center; margin-bottom: 8px;">
          <div style="font-size: 12px; font-weight: bold;">BILL RECEIPT</div>
          <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
        </div>
        <div style="margin-bottom: 8px;">
          <div><strong>Coupon: ${order.couponId}</strong></div>
          <div>Type: ${order.orderType}</div>
          <div>Date: ${dayjs(order.timestamp?.toDate?.()).format("DD-MM-YYYY")}</div>
          <div>Time: ${dayjs(order.timestamp?.toDate?.()).format("HH:mm")}</div>
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 2px;">
            <span>ITEM</span>
            <span>QTY</span>
            <span>AMT</span>
          </div>
          ${order.items.map((item: any) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 1px; font-size: 9px;">
              <span style="flex: 1;">${item.name}</span>
              <span style="width: 15mm; text-align: center;">${item.quantity}</span>
              <span style="width: 15mm; text-align: right;">₹${item.total}</span>
            </div>
          `).join('')}
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; margin-bottom: 8px;">
          <span>TOTAL:</span>
          <span>₹${order.subTotal}</span>
        </div>
        <div style="text-align: center; font-size: 8px; margin-top: 8px;">
          <div>Thank You!</div>
          <div style="margin-top: 4px;">------- END OF RECEIPT -------</div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html><head><title>Print Bill</title>
        <style>
          @media print {
            body { margin: 0; padding: 2mm; }
            @page { size: 58mm auto; margin: 0; }
          }
        </style></head><body>${printContent}</body></html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    } else {
      alert("Pop-up blocked. Please allow pop-ups for this site to print bills.");
    }
  };
  useEffect(() => {
  if (!currentUser) return;

  const runDailyCleanup = async () => {
    try {
      const today = formatDate(new Date());
      const clearRef = doc(db, "users", currentUser.uid, "settings", "lastCouponClear");
      const clearSnap = await getDoc(clearRef);

      const lastClear = clearSnap.exists() ? clearSnap.data()?.date : null;

      if (lastClear !== today) {
        // Delete all running coupons
        const snapshot = await getDocs(collection(db, "users", currentUser.uid, "counterOrder"));
        const batch = snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, "users", currentUser.uid, "counterOrder", docSnap.id))
        );
        await Promise.all(batch);

        // Save today's date as last cleared
        await setDoc(clearRef, { date: today });
        console.log("Daily coupon cleanup completed.");
      }
    } catch (err) {
      console.error("Daily cleanup failed:", err);
    }
  };

  runDailyCleanup();
}, [currentUser]);

  const topItemSummary = topItems.map((itemName) => {
    let totalQty = 0;
    orders.forEach((order) => {
      order.items.forEach((item: any) => {
        if (item.name === itemName) {
          totalQty += item.quantity;
        }
      });
    });
    return { name: itemName, quantity: totalQty };
  });

  const saveTopItemsToFirestore = async () => {
    if (!currentUser) return;
    await setDoc(doc(db, "users", currentUser.uid, "settings", "topItems"), {
      items: topItems,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-700 mx-auto mb-4"></div>
          <p className="text-orange-700 font-medium">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <BackButton />
      <h1 className="text-3xl mt-5 font-extrabold text-orange-700 text-center mb-4">
        🔖 Running Coupons
      </h1>

      {/* 🔹 Top items summary */}
      {topItems.length > 0 && (
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-700">Top Items Summary</h3>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {topItemSummary.map((item) => (
              <div key={item.name} className="bg-white px-4 py-2 rounded-lg shadow border text-sm text-gray-800">
                {item.name}: <span className="font-bold">{item.quantity}</span>
              </div>
            ))}
          </div>
          <button
            className="mt-3 text-xs text-blue-600 underline"
            onClick={() => setShowItemSelector(true)}
          >
            ✏️ Edit Top Items
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">No running coupons.</p>
      ) : (
        <div className="grid gap-4 max-w-4xl mx-auto">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow-md rounded-lg p-4 border">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-orange-800">COUPON- {order.couponId}</h2>
                <span className="text-sm text-gray-500">
                  {dayjs(order.timestamp?.toDate?.()).format("DD-MM-YYYY HH:mm")}
                </span>
              </div>
              <div className="mb-2 text-sm text-gray-800">Order Type: {order.orderType}</div>
              <ul className="text-sm text-gray-800 mb-2">
                {order.items.map((item: any, idx: number) => (
                  <li key={idx}>{item.name} × {item.quantity} = ₹{item.total}</li>
                ))}
              </ul>
              <div className="flex justify-between items-center">
                <p className="font-bold text-lg text-gray-700">Total: ₹{order.subTotal}</p>
                <div className="flex gap-2">
                  <button onClick={() => handlePrintBill(order)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm font-semibold">RePrint Bill</button>
                  <button onClick={() => handleCloseCoupon(order.id)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm font-semibold">Close Coupon</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔹 Item Selector Modal */}
      {showItemSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-4 text-center text-orange-700">
              Select 3 Items to Track
            </h2>
            <div className="space-y-3">
              {[0, 1, 2].map((idx) => (
                <select
                  key={idx}
                  className="w-full border p-2 rounded-md"
                  value={topItems[idx] || ""}
                  onChange={(e) => {
                    const newItems = [...topItems];
                    newItems[idx] = e.target.value;
                    setTopItems(newItems);
                  }}
                >
                  <option value="">-- Select Item --</option>
                  {allItemNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowItemSelector(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (topItems.filter(Boolean).length === 3) {
                    saveTopItemsToFirestore();
                    setShowItemSelector(false);
                  } else {
                    alert("Please select 3 items.");
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
