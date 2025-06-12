import { useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";

interface Item {
  name: string;
  price: number;
  quantity: number;
}

interface HotelInfo {
  name: string;
  greeting: string;
  logo?: string; // optional logo URL
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
  const [printBillId, setPrintBillId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (printing && printBillId && !bills.find((b) => b.id === printBillId)) {
      // Bill has been removed
      setTimeout(() => {
        if (printRef.current) {
          const originalContents = document.body.innerHTML;
          const printContents = printRef.current.innerHTML;

          document.body.innerHTML = printContents;
          window.print();
          document.body.innerHTML = originalContents;
          window.location.reload(); // Ensure app reinitializes if needed
        }

        setPrintBillId(null);
        setPrinting(false);
      }, 100);
    }
  }, [bills, printing, printBillId]);

  const handlePrint = async (bill: Bill) => {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) {
    alert("Popup blocked! Please allow popups for this site.");
    return;
  }

  const billHTML = `
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
            window.onafterprint = function() {
              window.close();
            };
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(billHTML);
  printWindow.document.close();

  // Update bill status after print triggers
  setTimeout(async () => {
    await updateDoc(doc(db, "bills", bill.id), { paid: "yes" });
  }, 500);
};



  const getPrintableBill = () => bills.find((b) => b.id === printBillId);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🧾 Unpaid Bills</h2>

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
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                🖨️ Print Bill
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden 2-inch print format */}
      <div style={{ position: "absolute", left: "-10000px", top: 0 }}>
        <div
          ref={printRef}
          style={{
            width: "250px",
            padding: "10px",
            fontFamily: "'Courier New', monospace",
            fontSize: "14px",
            background: "#fff",
          }}
        >
          {getPrintableBill() && (
            <>
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                {hotelInfo?.logo && (
                  <img
                    src={hotelInfo.logo}
                    alt="Hotel Logo"
                    style={{ width: "80px", marginBottom: "6px" }}
                  />
                )}
                <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {hotelInfo?.name?.toUpperCase() || "HOTEL NAME"}
                </h2>
                <p style={{ fontWeight: "bold", fontSize: "14px" }}>
                  {hotelInfo?.greeting || "Thank you! Visit Again"}
                </p>
              </div>
              <hr style={{ borderTop: "1px dashed black", marginBottom: 6 }} />
              <p><strong>Table:</strong> {getPrintableBill()?.table}</p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {getPrintableBill()?.items.map((item, idx) => (
                  <li key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <hr style={{ borderTop: "1px dashed black", margin: "6px 0" }} />
              <div style={{ fontWeight: "bold" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>AC:</span><span>₹{getPrintableBill()?.acCharge.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>GST:</span><span>₹{getPrintableBill()?.gstAmount.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "16px",
                    marginTop: "6px",
                  }}
                >
                  <span>Total:</span><span>₹{getPrintableBill()?.total.toFixed(2)}</span>
                </div>
              </div>
              <hr style={{ borderTop: "1px dashed black", margin: "6px 0" }} />
              <p style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px" }}>
                Thanks for your visit!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
