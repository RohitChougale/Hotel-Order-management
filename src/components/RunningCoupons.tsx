import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import { getAuth } from "firebase/auth";

export default function RunningCoupons() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Real-time listener instead of one-time fetch
    const unsubscribe = onSnapshot(
      collection(db, "users", currentUser.uid, "counterOrder"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  const handleCloseCoupon = async (id: string) => {
    if (confirm("Are you sure you want to close this coupon?")) {
      try {
        await deleteDoc(doc(db, "users", currentUser!.uid, "counterOrder", id));
        // No need to manually refresh - real-time listener will handle it
      } catch (error) {
        console.error("Error closing coupon:", error);
        alert("Failed to close coupon. Please try again.");
      }
    }
  };

  const handlePrintBill = (order: any) => {
    // Create print content formatted for 2-inch thermal printer
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
              <span style="flex: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 25mm;">${item.name}</span>
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

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Bill - ${order.couponId}</title>
          <style>
            @media print {
              body { margin: 0; padding: 2mm; }
              @page { size: 58mm auto; margin: 0; }
            }
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 2mm;
              background: white;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load then print
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
                  COUPON- {order.couponId}
                </h2>
                <span className="text-sm text-gray-500">
                  {dayjs(order.timestamp?.toDate?.()).format("DD-MM-YYYY HH:mm")}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-lx text-black-500">
                  Order Type : {order.orderType}
                </span>
              </div>

              <ul className="text-sm text-gray-800 mb-2">
                {order.items.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.name} × {item.quantity} = ₹{item.total}
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center">
                <p className="font-bold text-lg text-gray-700">
                  Total: ₹{order.subTotal}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrintBill(order)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm font-semibold"
                  >
                    RePrint Bill
                  </button>
                  <button
                    onClick={() => handleCloseCoupon(order.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm font-semibold"
                  >
                    Close Coupon
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}