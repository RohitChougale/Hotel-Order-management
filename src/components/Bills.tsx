import { useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import TableSystemHeader from "./TableSystemHeader";
import { getAuth } from "firebase/auth";

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
  const [printing, setPrinting] = useState<string | null>(null);
  const [printerStatus, setPrinterStatus] = useState<string>('disconnected');
  const printRef = useRef<HTMLDivElement>(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Check if running in React Native WebView
  const isReactNative = !!customWindow.ReactNativeWebView;

  useEffect(() => {
    const fetchHotelInfo = async () => {
      if (currentUser) {
        const snapshot = await getDocs(
          collection(db, "users", currentUser.uid, "hotelinfo")
        );
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setHotelInfo(doc.data() as HotelInfo);
        }
      }
    };
    fetchHotelInfo();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users", currentUser!.uid, "bills"), where("paid", "==", "no"));
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
        
        switch (data.type) {
          case 'PRINT_SUCCESS':
            setPrinting(null);
            updateBillStatus(data.billId);
            alert('✅ Bill printed successfully!');
            break;
            
          case 'PRINT_ERROR':
            setPrinting(null);
            alert('❌ Print failed: ' + (data.message || 'Unknown error'));
            break;
            
          case 'PRINTER_STATUS':
            setPrinterStatus(data.status);
            break;
            
          case 'PRINTER_CONNECTED':
            setPrinterStatus('connected');
            alert('✅ Printer connected successfully!');
            break;
            
          case 'PRINTER_DISCONNECTED':
            setPrinterStatus('disconnected');
            alert('📱 Printer disconnected');
            break;
            
          case 'PRINTER_CONNECTION_ERROR':
            setPrinterStatus('error');
            alert('❌ Printer connection failed: ' + (data.message || 'Unknown error'));
            break;
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
      await updateDoc(doc(db, "users", currentUser!.uid, "bills", billId), { paid: "yes" });
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
      // Check printer status first
      if (printerStatus !== 'connected') {
        alert('❌ Printer not connected. Please connect to a printer first.');
        setPrinting(null);
        return;
      }

      // Mobile thermal printer printing
      const receiptData = generateThermalReceiptData(bill);
      
      const payload = {
        type: "PRINT_THERMAL_BILL",
        billId: bill.id,
        receiptData,
        timestamp: new Date().toISOString()
      };
      
      customWindow.ReactNativeWebView!.postMessage(JSON.stringify(payload));
    } else {
      // Desktop browser printing (fallback)
      handleDesktopPrint(bill);
    }
  };

  const handlePrinterConnect = () => {
    if (isReactNative) {
      const payload = {
        type: "CONNECT_PRINTER",
        timestamp: new Date().toISOString()
      };
      customWindow.ReactNativeWebView!.postMessage(JSON.stringify(payload));
    } else {
      alert('Printer connection is only available in the mobile app');
    }
  };

  const handlePrinterDisconnect = () => {
    if (isReactNative) {
      const payload = {
        type: "DISCONNECT_PRINTER",
        timestamp: new Date().toISOString()
      };
      customWindow.ReactNativeWebView!.postMessage(JSON.stringify(payload));
    }
  };

  const checkPrinterStatus = () => {
    if (isReactNative) {
      const payload = {
        type: "CHECK_PRINTER_STATUS",
        timestamp: new Date().toISOString()
      };
      customWindow.ReactNativeWebView!.postMessage(JSON.stringify(payload));
    }
  };

  const generateThermalReceiptData = (bill: Bill) => {
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString();
    const timeStr = currentDate.toLocaleTimeString();

    return {
      header: `${hotelInfo?.name?.toUpperCase() || "HOTEL NAME"}\n${hotelInfo?.greeting || "Thank you! Visit Again"}`,
      
      items: [
        { name: `Date: ${dateStr}`, price: '' },
        { name: `Time: ${timeStr}`, price: '' },
        { name: `Table: ${bill.table}`, price: '' },
        { name: '--------------------------------', price: '' },
        ...bill.items.map(item => ({
          name: `${item.name} x${item.quantity}`,
          price: `₹${(item.price * item.quantity).toFixed(2)}`
        })),
        { name: '--------------------------------', price: '' },
        { name: 'AC Charge', price: `₹${bill.acCharge.toFixed(2)}` },
        { name: 'GST', price: `₹${bill.gstAmount.toFixed(2)}` },
        { name: '--------------------------------', price: '' },
      ],
      
      total: `₹${bill.total.toFixed(2)}`,
      
      footer: `Thank you for your visit!\n\nBill ID: ${bill.id}\nPrinted: ${dateStr} ${timeStr}`
    };
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
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString();
    const timeStr = currentDate.toLocaleTimeString();

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
            .footer-info {
              text-align: center;
              font-size: 11px;
              margin-top: 8px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${hotelInfo?.logo ? `<img class="logo" src="${hotelInfo.logo}" alt="Logo" />` : ''}
          <h2>${hotelInfo?.name?.toUpperCase() || "HOTEL NAME"}</h2>
          <div class="greeting">${hotelInfo?.greeting || "Thank you! Visit Again"}</div>
          <hr />
          <div class="section-title">Date: ${dateStr}</div>
          <div class="section-title">Time: ${timeStr}</div>
          <div class="section-title">🧾 Table: ${bill.table}</div>
          <hr />
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
          <div class="footer-info">
            Bill ID: ${bill.id}<br>
            Printed: ${dateStr} ${timeStr}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
  };

  const getPrinterStatusIcon = () => {
    switch (printerStatus) {
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  const getPrinterStatusText = () => {
    switch (printerStatus) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div>
      <TableSystemHeader/>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">🧾 Unpaid Bills</h2>
        
        {/* Platform and Printer Status */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">
              Platform: {isReactNative ? '📱 Mobile App' : '💻 Desktop Browser'}
            </div>
            {isReactNative && (
              <div className="text-sm">
                Printer: {getPrinterStatusIcon()} {getPrinterStatusText()}
              </div>
            )}
          </div>
          
          {isReactNative && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handlePrinterConnect}
                disabled={printerStatus === 'connected'}
                className={`px-3 py-1 text-xs rounded ${
                  printerStatus === 'connected' 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                🔌 Connect Printer
              </button>
              
              <button
                onClick={handlePrinterDisconnect}
                disabled={printerStatus !== 'connected'}
                className={`px-3 py-1 text-xs rounded ${
                  printerStatus !== 'connected' 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                🔌 Disconnect
              </button>
              
              <button
                onClick={checkPrinterStatus}
                className="px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600"
              >
                🔄 Check Status
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">Loading bills...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">✅ No unpaid bills found</p>
            <p className="text-sm">All bills have been paid!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="border p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    🏪 Table: {bill.table}
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    ID: {bill.id.slice(-6)}
                  </span>
                </div>
                
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Items:</h4>
                  <ul className="text-sm space-y-1">
                    {bill.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-700">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium text-gray-800">
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-sm space-y-1 mb-4 p-2 bg-gray-50 rounded">
                  <div className="flex justify-between">
                    <span className="text-gray-600">AC Charge:</span>
                    <span>₹{bill.acCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST:</span>
                    <span>₹{bill.gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-1">
                    <span>Total:</span>
                    <span className="text-green-600">₹{bill.total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePrint(bill)}
                  disabled={printing === bill.id || (isReactNative && printerStatus !== 'connected')}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    printing === bill.id 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : isReactNative && printerStatus !== 'connected'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                  }`}
                >
                  {printing === bill.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Printing...
                    </span>
                  ) : (
                    <span>
                      🖨️ {isReactNative ? 'Print to Thermal Printer' : 'Print Bill'}
                    </span>
                  )}
                </button>
                
                {isReactNative && printerStatus !== 'connected' && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    ⚠️ Connect to printer first
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}