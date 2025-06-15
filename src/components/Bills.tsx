import { useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import TableSystemHeader from "./TableSystemHeader";

interface CustomWindow extends Window {
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
}
const customWindow = window as CustomWindow;

interface Item {
  name: string;
  price: number;
  quantity: number;
}

interface HotelInfo {
  name: string;
  greeting: string;
  logo?: string;
}

interface Bill {
  id: string;
  table: string;
  items: Item[];
  acCharge: number;
  gstAmount: number;
  total: number;
  paid: boolean;
}

export default function UnpaidBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelInfo, setHotelInfo] = useState<HotelInfo | null>(null);
  const [printing, setPrinting] = useState<string | null>(null); // Store bill ID being printed
  const printRef = useRef<HTMLDivElement>(null);

  // Check if running in React Native WebView
  const isReactNative = !!customWindow.ReactNativeWebView;

  useEffect(() => {
    const fetchHotelInfo = async () => {
      const snapshot = await getDocs(collection(db, "hotelinfo"));
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setHotelInfo(doc.data() as HotelInfo);
      }
    };
    fetchHotelInfo();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "bills"), where("paid", "==", "no"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data();
        return {
          id: docSnap.id,
          table: raw.table,
          items: raw.items,
          acCharge: Number(raw.acCharge),
          gstAmount: Number(raw.gstAmount),
          total: Number(raw.total),
          paid: raw.paid,
        };
      });
      setBills(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for messages from React Native
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PRINT_SUCCESS' || data.type === 'PRINT_ERROR') {
          setPrinting(null);
          if (data.type === 'PRINT_SUCCESS') {
            // Mark bill as paid after successful print
            updateBillStatus(data.billId);
          } else {
            alert('Print failed: ' + (data.message || 'Unknown error'));
          }
        }
      } catch (error) {
        console.log('Message handling error:', error);
      }
    };

    if (isReactNative) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  const updateBillStatus = async (billId: string) => {
    try {
      await updateDoc(doc(db, "bills", billId), { paid: "yes" });
    } catch (error) {
      console.error('Error updating bill status:', error);
    }
  };

  const handlePrint = async (bill: Bill) => {
    if (printing) {
      alert('Please wait, another bill is being printed...');
      return;
    }

    setPrinting(bill.id);

    if (isReactNative) {
      // Mobile React Native printing
      const payload = {
        type: "PRINT_BILL",
        billId: bill.id,
        bill: {
          ...bill,
          items: bill.items.map(item => ({
            ...item,
            total: item.price * item.quantity
          }))
        },
        hotelInfo,
        timestamp: new Date().toISOString()
      };
      
      customWindow.ReactNativeWebView!.postMessage(JSON.stringify(payload));
    } else {
      // Desktop browser printing
      handleDesktopPrint(bill);
    }
  };

  const handleDesktopPrint = (bill: Bill) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert("Popup blocked! Please allow popups for this site.");
      setPrinting(null);
      return;
    }

    const billHTML = generateBillHTML(bill);
    printWindow.document.write(billHTML);
    printWindow.document.close();

    // Handle print completion for desktop
    printWindow.onafterprint = () => {
      updateBillStatus(bill.id);
      setPrinting(null);
      printWindow.close();
    };

    // Fallback if onafterprint doesn't work
    setTimeout(() => {
      if (!printWindow.closed) {
        updateBillStatus(bill.id);
        setPrinting(null);
        printWindow.close();
      }
    }, 3000);
  };

  const generateBillHTML = (bill: Bill) => {
    return `
      <html>
        <head>
          <style>
            body {
              width: 250px;
              font-family: 'Courier New', monospace;
              font-size: 15px;
              padding: 12px;
              margin: 0;
              background: #fff;
              color: #000;
            }
            h2 {
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 4px;
            }
            .greeting {
              font-size: 14px;
              text-align: center;
              margin-bottom: 8px;
              font-weight: 600;
            }
            .logo {
              display: block;
              margin: 0 auto 8px;
              max-width: 80px;
            }
            hr {
              border: none;
              border-top: 1px dashed black;
              margin: 10px 0;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              margin: 6px 0;
            }
            .line-item {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
            }
            .totals {
              font-weight: bold;
              margin-top: 8px;
              font-size: 16px;
            }
            .thankyou {
              text-align: center;
              font-size: 13px;
              font-weight: bold;
              margin-top: 12px;
            }
          </style>
        </head>
        <body>
          ${hotelInfo?.logo ? `<img class="logo" src="${hotelInfo.logo}" alt="Logo" />` : ''}
          <h2>${hotelInfo?.name?.toUpperCase() || "HOTEL NAME"}</h2>
          <div class="greeting">${hotelInfo?.greeting || "Thank you! Visit Again"}</div>
          <hr />
          <div class="section-title">🧾 Table: ${bill.table}</div>
          ${bill.items.map(item => `
            <div class="line-item">
              <span>${item.name} x${item.quantity}</span>
              <span>₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <hr />
          <div class="line-item">
            <span>AC Charge</span>
            <span>₹${bill.acCharge.toFixed(2)}</span>
          </div>
          <div class="line-item">
            <span>GST</span>
            <span>₹${bill.gstAmount.toFixed(2)}</span>
          </div>
          <div class="line-item totals">
            <span>Total</span>
            <span>₹${bill.total.toFixed(2)}</span>
          </div>
          <hr />
          <div class="thankyou">🙏 Thanks for your visit!</div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
  };

  return (
    <div>
      <TableSystemHeader/>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">🧾 Unpaid Bills</h2>
        
        {/* Show platform indicator */}
        <div className="mb-4 text-sm text-gray-600">
          Platform: {isReactNative ? 'Mobile App' : 'Desktop Browser'}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : bills.length === 0 ? (
          <p>No unpaid bills.</p>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="border p-4 rounded shadow bg-white">
                <h3 className="text-lg font-semibold mb-2">Table: {bill.table}</h3>
                <ul className="text-sm mb-2">
                  {bill.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{item.quantity * item.price}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-sm text-gray-600 mb-2">
                  <p>AC Charge: ₹{bill.acCharge.toFixed(2)}</p>
                  <p>GST: ₹{bill.gstAmount.toFixed(2)}</p>
                  <p className="font-semibold">Total: ₹{bill.total.toFixed(2)}</p>
                </div>

                <button
                  onClick={() => handlePrint(bill)}
                  disabled={printing === bill.id}
                  className={`px-4 py-2 rounded text-white ${
                    printing === bill.id 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {printing === bill.id ? '🔄 Printing...' : '🖨️ Print Bill'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}