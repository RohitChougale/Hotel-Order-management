import { useEffect, useState,useRef } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAuth } from "firebase/auth";

export default function CounterAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>(["all"]);
  const [startDate, setStartDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
      const q = query(
        collection(db, "users", currentUser!.uid, "counterbill"),
        where("timestamp", ">=", Timestamp.fromDate(new Date(startDate)))
      );
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
  }, [startDate]);

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

  return (
    <div className="p-4 bg-white min-h-screen max-w-full">
      <h1 className="text-2xl font-bold text-orange-600 mb-4">
        📊 Counter Item Analytics
      </h1>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-end">
        <div>
          <label className="font-semibold text-gray-700 block mb-1">
            📅 Start Date:
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-3 py-2 rounded-md shadow-sm w-full"
          />
        </div>

        <div className="relative w-full sm:w-64" ref={dropdownRef}>
          <label className="font-semibold text-gray-700 block mb-1">
            🧺 Select Items:
          </label>
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

      {/* Line Chart */}
      <div className="h-72 bg-white rounded shadow p-2 mb-6 w-full overflow-x-auto">
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
