import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../firebase";

interface Item {
  name: string;
  quantity: number;
  price: number;
}

interface Props {
  table: string;
  items: Item[];
  acCharge: number;
  gstAmount: number;
  onClose: () => void;
}

export default function KOTPreview({
  table,
  items,
  acCharge,
  gstAmount,
  onClose,
}: Props) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const total = Number(subtotal) + Number(acCharge) + Number(gstAmount);

  const [hotelName, setHotelName] = useState("My Hotel");
  const [greeting, setGreeting] = useState("Thank you!");
  const printRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const formattedDate = now.toLocaleString();

  useEffect(() => {
    const fetchHotelInfo = async () => {
      const hotelDoc = await getDoc(doc(db, "hotelinfo", "main")); // 👈 Replace 'main' with your actual doc ID
      if (hotelDoc.exists()) {
        const data = hotelDoc.data();
        setHotelName(data.name || "My Hotel");
        setGreeting(data.greeting || "Thank you!");
      }
    };
    fetchHotelInfo();
  }, []);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>KOT - Table ${table}</title>
            <style>
              @media print {
                body {
                  width: 58mm;
                }
              }
              body {
                font-family: monospace;
                width: 58mm;
                font-size: 14px;
                padding: 0;
                margin: 0;
              }
              h1, h2, p {
                margin: 0;
                text-align: center;
              }
              .header, .footer {
                margin: 4px 0;
              }
              ul {
                padding: 0;
                margin: 4px 0;
                list-style: none;
              }
              li {
                display: flex;
                justify-content: space-between;
              }
              .summary-line {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
              }
              .total {
                border-top: 1px dashed #000;
                margin-top: 4px;
                padding-top: 4px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-[90%] max-w-md">
        <h2 className="text-xl font-bold mb-4">Bill - Table {table}</h2>

        {/* Printable Section */}
        <div ref={printRef}>
          <div className="header text-center mb-4">
            <h1 className="text-lg font-bold">{hotelName}</h1>
            <p className="text-xs ">Order Time: {formattedDate}</p>
            <p className="text-xs ">Table No: {table}</p>
          </div>

          <ul className="mb-4 space-y-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex justify-between text-xs">
                <span>{item.name}</span>
                <span>
                  {item.quantity} × ₹{item.price} = ₹
                  {item.quantity * item.price}
                </span>
              </li>
            ))}
          </ul>

          <div className="text-xs space-y-1">
            <div className="summary-line">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>AC/Non-AC Charge:</span>
              <span>₹{Number(acCharge).toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>GST:</span>
              <span>₹{Number(gstAmount).toFixed(2)}</span>
            </div>
            <div className="summary-line font-bold border-t pt-1 mt-1">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="footer  mt-4 text-xs text-center">
            <p>{greeting}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handlePrint}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
