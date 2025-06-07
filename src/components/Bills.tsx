import { useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import * as htmlToImage from "html-to-image";

interface Item {
  name: string;
  price: number;
  quantity: number;
}

interface HotelInfo {
  name: string;
  greeting: string;
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
  const [billImage, setBillImage] = useState<string | null>(null);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
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

  const printBill = async (bill: Bill) => {
    setCurrentBill(bill);
    await new Promise((res) => setTimeout(res, 100)); // ensure DOM is updated

    if (!printRef.current) return alert("Bill layout not ready.");

    try {
      const dataUrl = await htmlToImage.toPng(printRef.current);
      setBillImage(dataUrl);

      setTimeout(() => {
        window.print();
      }, 500);

      await updateDoc(doc(db, "bills", bill.id), { paid: "yes" });
    } catch (err) {
      console.error("Image generation error:", err);
      alert("Could not prepare bill for printing.");
    }
  };

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
                onClick={() => printBill(bill)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                🖨️ Print Bill
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden Printable Content */}
      <div style={{ position: "absolute", left: "-10000px", top: 0 }}>
        <div
          ref={printRef}
          style={{
            width: "250px",
            padding: "10px",
            fontFamily: "monospace",
            fontSize: "12px",
            background: "#fff",
          }}
        >
          {currentBill && (
            <>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: "4px 0" }}>
                  {hotelInfo?.name?.toUpperCase() || "HOTEL NAME"}
                </h2>
                <p style={{ fontWeight: "bold", fontSize: "13px", margin: "2px 0" }}>
                  {hotelInfo?.greeting || "Thank you! Visit Again"}
                </p>
              </div>
              <hr style={{ borderTop: "1px dashed black", margin: "6px 0" }} />
              <div style={{ marginBottom: "6px" }}>
                <strong>🧾 Table: {currentBill.table}</strong>
              </div>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "6px" }}>
                {currentBill.items.map((item, i) => (
                  <li key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <hr style={{ borderTop: "1px dashed black", margin: "6px 0" }} />
              <div style={{ fontWeight: "bold" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>AC Charge:</span><span>₹{currentBill.acCharge.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>GST:</span><span>₹{currentBill.gstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginTop: "6px" }}>
                  <span>TOTAL:</span><span>₹{currentBill.total.toFixed(2)}</span>
                </div>
              </div>
              <hr style={{ borderTop: "1px dashed black", margin: "8px 0" }} />
              <p style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold" }}>
                Thanks for your visit!
              </p>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Preview of Bill Image */}
      {billImage && (
        <div
          onClick={() => setBillImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "#fff",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Tap anywhere to close</p>
          <img src={billImage} alt="Printable Bill" style={{ maxWidth: "100%", maxHeight: "100%" }} />
        </div>
      )}
    </div>
  );
}
