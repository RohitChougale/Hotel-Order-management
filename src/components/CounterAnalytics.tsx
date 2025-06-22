import { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import Papa from "papaparse";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


export default function CounterAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>(["all"]);
  const [startDate, setStartDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [orderType, setOrderType] = useState<"table" | "takeaway" | "all">("table");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchItems = async () => {
      const snap = await getDocs(collection(db, "users", currentUser!.uid, "counterItems"));
      const list = snap.docs.map((doc) => doc.data().name);
      setItems(list);
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    const fetchData = async () => {
      let q = query(
        collection(db, "users", currentUser!.uid, "counterbill"),
        where("timestamp", ">=", Timestamp.fromDate(new Date(startDate))),
        where("timestamp", "<=", Timestamp.fromDate(new Date(endDate + "T23:59:59")))
      );

      if (orderType !== "all") {
        q = query(
          collection(db, "users", currentUser!.uid, "counterbill"),
          where("timestamp", ">=", Timestamp.fromDate(new Date(startDate))),
          where("timestamp", "<=", Timestamp.fromDate(new Date(endDate + "T23:59:59"))),
          where("orderType", "==", orderType)
        );
      }

      const snap = await getDocs(q);
      const all: any[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        if (Array.isArray(d.items)) {
          all.push(...d.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            subtotal: item.total,
          })));
        }
      });

      const grouped: { [key: string]: { quantity: number; subtotal: number } } = {};
      all.forEach((item) => {
        if (!grouped[item.name]) {
          grouped[item.name] = { quantity: 0, subtotal: 0 };
        }
        grouped[item.name].quantity += item.quantity;
        grouped[item.name].subtotal += item.subtotal;
      });

      const result = Object.entries(grouped).map(([name, values]) => ({
        name,
        quantity: values.quantity,
        subtotal: values.subtotal,
      }));

      setData(result);
    };
    fetchData();
  }, [startDate, endDate, orderType]);

  useEffect(() => {
    if (selectedItems.includes("all")) {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter((item) => selectedItems.includes(item.name)));
    }
  }, [data, selectedItems]);

  const handleItemChange = (itemName: string) => {
    if (itemName === "all") {
      setSelectedItems(["all"]);
    } else {
      let updated = [...selectedItems];
      if (updated.includes("all")) updated = [];

      if (updated.includes(itemName)) {
        updated = updated.filter((i) => i !== itemName);
      } else {
        updated.push(itemName);
      }

      if (updated.length === 0) updated.push("all");
      setSelectedItems(updated);
    }
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "counter_analytics.csv";
    link.click();
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Counter Item Analytics", 14, 16);
    doc.autoTable({
  startY: 20,
  head: [["Item", "Quantity", "Subtotal ₹"]],
  body: filteredData.map((item) => [
    item.name,
    item.quantity,
    item.subtotal.toFixed(2),
  ]),
});

    doc.save("counter_analytics.pdf");
  };

  const totalRevenue = filteredData.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="p-4 bg-white min-h-screen max-w-full">
      <h1 className="text-2xl font-bold text-orange-600 mb-4">
        📊 Counter Item Analytics
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="font-semibold text-gray-700 block mb-1">📅 Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-3 py-2 rounded-md shadow-sm w-full"
          />
        </div>
        <div>
          <label className="font-semibold text-gray-700 block mb-1">📅 End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-3 py-2 rounded-md shadow-sm w-full"
          />
        </div>
        <div>
          <label className="font-semibold text-gray-700 block mb-1">📦 Order Type:</label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as any)}
            className="border px-3 py-2 rounded-md shadow-sm w-full"
          >
            <option value="all">All</option>
            <option value="table">Table</option>
            <option value="takeaway">Takeaway</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64" ref={dropdownRef}>
          <label className="font-semibold text-gray-700 block mb-1">🧺 Select Items:</label>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full border rounded px-3 py-2 text-left bg-gray-50 shadow-sm"
          >
            {selectedItems.includes("all") ? "All Items" : selectedItems.join(", ") || "Select Items"}
          </button>
          {dropdownOpen && (
            <div className="absolute z-10 bg-white border rounded shadow max-h-48 overflow-y-auto w-full mt-1">
              <label className="block px-3 py-2 hover:bg-orange-100">
                <input
                  type="checkbox"
                  checked={selectedItems.includes("all")}
                  onChange={() => handleItemChange("all")}
                  className="mr-2"
                />
                All Items
              </label>
              {items.map((item) => (
                <label key={item} className="block px-3 py-2 hover:bg-orange-100">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={() => handleItemChange(item)}
                    className="mr-2"
                  />
                  {item}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Total Summary */}
      <div className="mb-6 text-xl font-semibold text-green-700">
        💰 Total Revenue: ₹{totalRevenue.toFixed(2)}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={downloadCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
        >
          ⬇️ Download CSV
        </button>
        <button
          onClick={downloadPDF}
          className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
        >
          ⬇️ Download PDF
        </button>
      </div>
      {/* Line Chart */}
<div className="h-72 bg-white rounded shadow p-2 mb-6 w-full overflow-x-auto">
  <h2 className="text-lg font-semibold text-gray-700 mb-2">📈 Revenue & Quantity Graph</h2>
  {filteredData.length > 0 ? (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="subtotal" stroke="#f97316" name="Revenue ₹" />
          <Line type="monotone" dataKey="quantity" stroke="#10b981" name="Qty Sold" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <p className="text-gray-500 text-center py-4">No data to display in chart.</p>
  )}
</div>


      {/* Table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-orange-600 text-white">
            <tr>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-left">Quantity</th>
              <th className="px-3 py-2 text-left">Subtotal ₹</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  No data found.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.name} className="border-t hover:bg-orange-50">
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2">₹{item.subtotal.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
