import { useState, useEffect, useRef } from "react"; // Added useEffect and useRef
import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import BackButton from "../elements/BackButton";

export default function CounterAdmin() {
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [errorMsg, setErrorMsg] = useState("");
  const [highestCode, setHighestCode] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  // States for existing modals
  const [showModal, setShowModal] = useState(false);
  const [item, setItem] = useState({
    name: "",
    nameMarathi: "",
    price: "",
    code: "",
  });
  const [hotelModal, setHotelModal] = useState(false);
  const [hotelInfo, setHotelInfo] = useState({
    hotelName: "",
    gstNumber: "",
    gstPercentage: "",
  });
  const [isEditingHotelInfo, setIsEditingHotelInfo] = useState(false);

  // --- Start of New Code: Settings Functionality ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({
    isDarkMode: false,
    numberOfPrints: 1,
    saprateTracking: false,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to prevent the save effect from running on initial component mount
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (!currentUser) return;

    const fetchItems = async () => {
      const snapshot = await getDocs(
        collection(db, "users", currentUser.uid, "counterItems")
      );
      const itemList = snapshot.docs.map((doc) => doc.data());

      const codes = itemList
        .map((item) => parseInt(item.code, 10))
        .filter((code) => !isNaN(code));

      const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
      setHighestCode(maxCode.toString().padStart(2, "0"));
    };

    fetchItems();
  }, [currentUser, showModal]);

  // Function to open the settings modal and fetch existing settings
  // Function to open the settings modal and fetch existing settings
  const openSettingsModal = async () => {
    if (!currentUser) return;

    // Reset the loaded flag
    setSettingsLoaded(false);

    try {
      const settingsRef = doc(
        db,
        "users",
        currentUser.uid,
        "settings",
        "userSettings"
      );
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        const fetchedSettings = docSnap.data();
        setSettings({
          isDarkMode: fetchedSettings.isDarkMode ?? false,
          numberOfPrints: fetchedSettings.numberOfPrints ?? 1,
          saprateTracking: fetchedSettings.saprateTracking ?? false,
        });
      } else {
        // Set default values if no settings exist
        setSettings({
          isDarkMode: false,
          numberOfPrints: 1,
          saprateTracking: false,
        });
      }
      const itemsSnapshot = await getDocs(
        collection(db, "users", currentUser.uid, "counterItems")
      );
      const itemList = itemsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemList);
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Set default values on error
      setSettings({
        isDarkMode: false,
        numberOfPrints: 1,
        saprateTracking: false,
      });
    }

    // Mark settings as loaded AFTER setting the state
    setSettingsLoaded(true);
    setShowSettingsModal(true);
    setLoadingItems(false);
  };
  const handleToggleAvailability = async (
    itemId: string,
    currentValue: boolean | undefined
  ) => {
    try {
      const itemRef = doc(
        db,
        "users",
        currentUser!.uid,
        "counterItems",
        itemId
      );
      await setDoc(itemRef, { show: !currentValue }, { merge: true });

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, show: !currentValue } : item
        )
      );
    } catch (error) {
      console.error("Error updating item availability:", error);
    }
  };
  // useEffect to automatically save settings when they change
  useEffect(() => {
    // Don't save if settings haven't been loaded yet or user is not authenticated
    if (!settingsLoaded || !currentUser) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce function to prevent rapid writes
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log("Saving settings:", settings);
        const settingsRef = doc(
          db,
          "users",
          currentUser.uid,
          "settings",
          "userSettings"
        );
        await setDoc(settingsRef, settings);
        console.log("Settings saved successfully");
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    }, 500); // Save 500ms after the last change

    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [settings, settingsLoaded, currentUser]);
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  // Handler for settings changes
  const handleSettingsChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };
  const closeSettingsModal = () => {
    setShowSettingsModal(false);
    setSettingsLoaded(false);
  };
  // --- End of New Code ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItem((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!item.name || !item.nameMarathi || !item.price) {
      alert("Please fill all fields");
      return;
    }

    try {
      // Check for duplicate item code
      const q = query(
        collection(db, "users", currentUser!.uid, "counterItems"),
        where("code", "==", item.code)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setErrorMsg("❗ Item code already exists. Please use a unique code.");
        return;
      }

      // Add new item
      await addDoc(collection(db, "users", currentUser!.uid, "counterItems"), {
        ...item,
        price: parseFloat(item.price),
        show: true
      });

      alert("Item added successfully!");
      setItem({ name: "", nameMarathi: "", price: "", code: "" });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleHotelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHotelInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openHotelModal = async () => {
    const docRef = doc(
      db,
      "users",
      currentUser!.uid,
      "counterHotelInfo",
      "info"
    );
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setHotelInfo(docSnap.data() as any);
      setIsEditingHotelInfo(true);
    } else {
      setHotelInfo({ hotelName: "", gstNumber: "", gstPercentage: "" });
      setIsEditingHotelInfo(false);
    }
    setHotelModal(true);
  };

  const saveHotelInfo = async () => {
    await setDoc(
      doc(db, "users", currentUser!.uid, "counterHotelInfo", "info"),
      {
        ...hotelInfo,
        gstPercentage: hotelInfo.gstPercentage
          ? parseFloat(hotelInfo.gstPercentage)
          : 0,
      }
    );
    alert("Hotel info saved!");
    setHotelModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-orange-200 p-6 flex flex-col items-center justify-center">
      <BackButton />
      <h1 className="text-5xl font-extrabold text-orange-800 mb-10 tracking-wide text-center">
        🍽️ Counter Admin Panel
      </h1>

      <div className="flex flex-wrap gap-6 justify-center">
        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-4 bg-orange-600 text-white text-lg rounded-xl hover:bg-orange-700 transition-all duration-300 font-semibold shadow-lg"
        >
          ➕ Add Item
        </button>
        <button
          onClick={() => navigate("/counterItemList")}
          className="px-8 py-4 bg-teal-600 text-white text-lg rounded-xl hover:bg-teal-700 transition-all duration-300 font-semibold shadow-lg"
        >
          📋 View Items
        </button>
        <button
          onClick={() => navigate("/counterAnalytics")}
          className="px-8 py-4 bg-teal-600 text-white text-lg rounded-xl hover:bg-teal-700 transition-all duration-300 font-semibold shadow-lg"
        >
          📊 Analytics
        </button>
        <button
          onClick={openHotelModal}
          className="px-8 py-4 bg-indigo-600 text-white text-lg rounded-xl hover:bg-indigo-700 transition-all duration-300 font-semibold shadow-lg"
        >
          🏨 Hotel Info
        </button>
        {/* --- Start of New Code: Settings Button --- */}
        <button
          onClick={openSettingsModal}
          className="px-8 py-4 bg-gray-600 text-white text-lg rounded-xl hover:bg-gray-700 transition-all duration-300 font-semibold shadow-lg"
        >
          ⚙️ Settings
        </button>
        {/* --- End of New Code --- */}
      </div>

      {/* --- Start of New Code: Settings Modal --- */}
     {showSettingsModal && (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-700">Settings</h2>
        <button
          onClick={closeSettingsModal}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        
        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Dark Mode</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.isDarkMode}
              onChange={(e) => handleSettingsChange("isDarkMode", e.target.checked)}
            />
            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-gray-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
          </label>
        </div>

        {/* Running Coupons Order-Type wise */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Running Coupons Order-Type wise</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.saprateTracking}
              onChange={(e) => handleSettingsChange("saprateTracking", e.target.checked)}
            />
            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-gray-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
          </label>
        </div>

        {/* Number of Prints */}
        <div>
          <label htmlFor="numberOfPrints" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Prints
          </label>
          <input
            type="number"
            id="numberOfPrints"
            min="1"
            value={settings.numberOfPrints}
            onChange={(e) =>
              handleSettingsChange("numberOfPrints", parseInt(e.target.value) || 1)
            }
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <p className="text-xs text-gray-500 mt-1">Number of copies to print for each order.</p>
        </div>

        {/* ✅ Manage Item Availability */}
        <div className="border-t pt-3">
          <h3 className="text-md font-semibold text-gray-800 mb-2">
            Manage Item Availability
          </h3>
          {loadingItems ? (
            <p className="text-gray-500 text-sm">Loading items...</p>
          ) : (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-2 bg-gray-50">
              {items.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No items found.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-700 truncate w-2/3">
                        {item.name}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={item.show !== false} // Default true if undefined
                          onChange={() => handleToggleAvailability(item.id, item.show)}
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-4">
        <button
          onClick={closeSettingsModal}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-all"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* --- End of New Code --- */}

      {/* Existing Hotel Modal */}
      {hotelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700 text-center">
              {isEditingHotelInfo ? "Edit" : "Add"} Hotel Info
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hotel Name
                </label>
                <input
                  type="text"
                  name="hotelName"
                  placeholder="Enter hotel name"
                  value={hotelInfo.hotelName}
                  onChange={handleHotelChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  placeholder="Enter GST number"
                  value={hotelInfo.gstNumber}
                  onChange={handleHotelChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Percentage (%)
                </label>
                <input
                  type="number"
                  name="gstPercentage"
                  placeholder="Enter GST %"
                  value={hotelInfo.gstPercentage}
                  onChange={handleHotelChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 gap-4">
              <button
                onClick={() => setHotelModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveHotelInfo}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-orange-700 text-center">
              Add New Counter Item
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="itemName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Item Name
                </label>
                <input
                  id="itemName"
                  type="text"
                  name="name"
                  placeholder="Item Name"
                  value={item.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label
                  htmlFor="itemNameMarathi"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Item Name (Marathi)
                </label>
                <input
                  id="itemNameMarathi"
                  type="text"
                  name="nameMarathi"
                  placeholder="Item Name (Marathi)"
                  value={item.nameMarathi}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Code{" "}
                  {highestCode && (
                    <span className="text-xs text-red-500 ml-2">
                      (Last Code: {highestCode})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="code"
                  placeholder={`Next code e.g., ${
                    highestCode
                      ? (parseInt(highestCode) + 1).toString().padStart(2, "0")
                      : ""
                  }`}
                  value={item.code}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errorMsg && (
                  <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="itemPrice"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price
                </label>
                <input
                  id="itemPrice"
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={item.price}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-all"
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
