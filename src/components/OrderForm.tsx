import { useEffect, useState } from "react";
import { collection, getDocs, query, where, addDoc, updateDoc, doc,arrayUnion, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  acPrice?: number;
  nonAcPrice?: number;
  type: string;
  nameMarathi:string;
}

interface HotelInfo {
  hotelName: string;
  acCharge: number;
  nonAcCharge: number;
  gst: number;
  acTables: string;
  nonAcTables: string;
}

interface Settings {
  acPerItem: boolean;
}

export default function OrderForm() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [order, setOrder] = useState<{ [id: string]: number }>({});
  const [table, setTable] = useState("");
  const [splitOption, setSplitOption] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [hotelInfo, setHotelInfo] = useState<HotelInfo | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      const snapshot = await getDocs(collection(db, "menu"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuItem, "id">),
      }));
      setMenu(list);
    };

    const fetchHotelInfo = async () => {
      const snapshot = await getDocs(collection(db, "hotelinfo"));
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setHotelInfo(doc.data() as HotelInfo);
      }
    };

    const unsubscribeSettings = onSnapshot(
      collection(db, "settings"),
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setSettings(doc.data() as Settings);
          console.log("Settings updated:", doc.data()); // Optional: for debugging
        }
      },
      (error) => {
        console.error("Error listening to settings:", error);
      }
    );

    fetchMenu();
    fetchHotelInfo();

    // Cleanup function to unsubscribe from the listener
    return () => {
      unsubscribeSettings();
    };
  }, []);

  const handleQuantityChange = (id: string, qty: number) => {
    setOrder((prev) => ({ ...prev, [id]: qty }));
  };

  const isAcTable = (tableNum: number): boolean => {
    if (!hotelInfo) return false;
    const [acStart, acEnd] = hotelInfo.acTables.split("-").map(Number);
    return tableNum >= acStart && tableNum <= acEnd;
  };

  const getItemPrice = (item: MenuItem): number => {
    if (settings?.acPerItem) {
      
      return item.acPrice || item.price;
    } else {
      return item.nonAcPrice || item.price;
    }
  };

  const handleSubmit = async () => {
    const items = Object.entries(order)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = menu.find((m) => m.id === id);
        const itemPrice = item ? getItemPrice(item) : 0;
        return {
          name: item?.name || "",
          price: itemPrice,
          quantity: qty,
          marathiName:item?.nameMarathi
        };
      });

    if (!table || items.length === 0) {
      alert("Select a table and at least one item");
      return;
    }

    const tableNumber = parseInt(table);
    if (isNaN(tableNumber)) {
      alert("Table number must be a valid number");
      return;
    }

    const finalTable = splitOption ? `${table}-${splitOption}` : table;
    const isAc = isAcTable(tableNumber);
    const acCharge = isAc ? hotelInfo?.acCharge || 0 : hotelInfo?.nonAcCharge || 0;

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const gstAmount = hotelInfo ? (subtotal * hotelInfo.gst) / 100 : 0;
    const total = parseFloat((subtotal + acCharge + gstAmount).toFixed(2));

    // Check if table already exists
    const q = query(collection(db, "runningTables"), where("table", "==", finalTable));
    const existing = await getDocs(q);

    if (!existing.empty) {
      const docRef = existing.docs[0].ref;
      const existingData = existing.docs[0].data();
      const existingItems = existingData.items || [];

      const updatedItems = [...existingItems];

      // Merge quantities if item exists
      items.forEach((newItem) => {
        const existingIndex = updatedItems.findIndex((item: any) => item.name === newItem.name);
        if (existingIndex > -1) {
          updatedItems[existingIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }
      });

      const newSubtotal = updatedItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
      const newGstAmount = (newSubtotal * hotelInfo!.gst) / 100;
      const newTotal = newSubtotal + acCharge + newGstAmount;

      await updateDoc(docRef, {
        items: updatedItems,
        total: newTotal,
        gstAmount: newGstAmount,
        acCharge: acCharge,
        updatedAt: Timestamp.now(),
      });
    } else {
      await addDoc(collection(db, "runningTables"), {
        table: finalTable,
        items,
        acCharge,
        gstAmount,
        total,
        createdAt: Timestamp.now(),
      });
    }

// 🔁 Save to 'orders' collection (one document per table)
const kotRefQuery = query(collection(db, "orders"), where("table", "==", finalTable));
const existingKot = await getDocs(kotRefQuery);

const kotItems = items.map((item) => ({
  name: item.name,
  quantity: item.quantity,
  timestamp: Timestamp.now(),
  marathiName: item.marathiName,
}));

if (!existingKot.empty) {
  const kotDocRef = existingKot.docs[0].ref;
  const existingData = existingKot.docs[0].data();
  const existingItems = existingData.items || [];

  // Merge items by name
  kotItems.forEach((newItem) => {
    const index = existingItems.findIndex(
      (it: any) => it.name === newItem.name
    );
    if (index > -1) {
      existingItems[index].quantity += newItem.quantity;
    } else {
      existingItems.push(newItem);
    }
  });

  await updateDoc(kotDocRef, {
    items: existingItems,
    updatedAt: Timestamp.now(),
  });
} else {
  await addDoc(collection(db, "orders"), {
    table: finalTable,
    items: kotItems,
    createdAt: Timestamp.now(),
  });
}



    alert("✅ Order sent to kitchen and added to running tables!");

    setOrder({});
    setTable("");
    setSplitOption("");
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "meal":
        return "bg-yellow-100 text-yellow-800";
      case "drink":
        return "bg-blue-100 text-blue-800";
      case "breakfast":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Filter menu items based on search term and selected type
  const filteredMenu = menu.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">🍽️ Take Order</h3>

      <div className="grid gap-4 md:grid-cols-3">
        <input
          value={table}
          onChange={(e) => setTable(e.target.value)}
          placeholder="Table Number"
          className="border p-2 rounded w-full"
        />

        <select
          value={splitOption}
          onChange={(e) => setSplitOption(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">No Split</option>
          <option value="1">Split - 1</option>
          <option value="2">Split - 2</option>
          <option value="3">Split - 3</option>
          <option value="4">Split - 4</option>
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="all">All Types</option>
          <option value="breakfast">Breakfast</option>
          <option value="meal">Meal</option>
          <option value="drink">Drink</option>
        </select>
      </div>

      {/* Search Box */}
      <div className="w-full">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Search items..."
          className="border p-3 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-3 hover:shadow-md transition flex flex-col justify-between h-full"
          >
            <div>
              <div className="font-medium text-gray-800 text-sm truncate">{item.name}</div>
              <div className="text-xs text-gray-500">
                ₹{getItemPrice(item)}{" "}
                <span
                  className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded ${getBadgeColor(item.type)}`}
                >
                  {item.type}
                </span>
              </div>
            </div>
            <input
              type="number"
              min="0"
              value={order[item.id] || ""}
              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
              className="border mt-2 text-center rounded p-1 text-sm w-full"
            />
          </div>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No items found matching your search criteria</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow"
      >
        ✅ Submit Order to KOT
      </button>
    </div>
  );
}