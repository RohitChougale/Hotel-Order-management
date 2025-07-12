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
    logo: "",
  });
  const [isEditingHotelInfo, setIsEditingHotelInfo] = useState(false);

  // --- Start of New Code: Settings Functionality ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({
    isDarkMode: false,
    numberOfPrints: 1,
  });
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
  const openSettingsModal = async () => {
    if (!currentUser) return;
    const settingsRef = doc(
      db,
      "users",
      currentUser.uid,
      "settings",
      "userSettings"
    );
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
      setSettings(docSnap.data() as any);
    }
    // Set initial mount to true here so the useEffect doesn't save on first open
    isInitialMount.current = true;
    setShowSettingsModal(true);
  };

  // useEffect to automatically save settings when they change
  useEffect(() => {
    // Guard clause: If it's the initial render/fetch, don't save.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Debounce function to prevent rapid writes, especially for the number input
    const handler = setTimeout(async () => {
      if (!currentUser) return;
      console.log("Saving settings:", settings);
      const settingsRef = doc(
        db,
        "users",
        currentUser.uid,
        "settings",
        "userSettings"
      );
      await setDoc(settingsRef, settings);
    }, 500); // Save 500ms after the last change

    // Cleanup function to clear the timeout if settings change again quickly
    return () => {
      clearTimeout(handler);
    };
  }, [settings, currentUser]);

  // Handler for settings changes
  const handleSettingsChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
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
      setHotelInfo({ hotelName: "", gstNumber: "", gstPercentage: "", logo:"" });
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
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // File size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }
    
    // File type validation
    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file");
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setHotelInfo((prev) => ({ ...prev, logo: base64String }));
    };
    reader.readAsDataURL(file);
  }
};
  const removeLogo = () => {
  setHotelInfo((prev) => ({ ...prev, logo: "" }));
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-orange-200 p-6 flex flex-col items-center justify-center">
      <BackButton/>
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
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-700">Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <label
                  htmlFor="darkModeToggle"
                  className="text-gray-700 font-medium"
                >
                  Dark Mode
                </label>
                <label
                  htmlFor="darkModeToggle"
                  className="relative inline-flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id="darkModeToggle"
                    className="sr-only peer"
                    checked={settings.isDarkMode}
                    onChange={(e) =>
                      handleSettingsChange("isDarkMode", e.target.checked)
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                </label>
              </div>

              {/* Number of Prints */}
              <div>
                <label
                  htmlFor="numberOfPrints"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Number of Prints
                </label>
                <input
                  type="number"
                  id="numberOfPrints"
                  name="numberOfPrints"
                  min="1"
                  value={settings.numberOfPrints}
                  onChange={(e) =>
                    handleSettingsChange(
                      "numberOfPrints",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of copies to print for each order.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setShowSettingsModal(false)}
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
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
    <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-md sm:max-w-lg md:max-w-xl animate-fade-in overflow-y-auto max-h-[90vh]">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-indigo-700 text-center">
        {isEditingHotelInfo ? "Edit" : "Add"} Hotel Info
      </h2>

      <div className="space-y-4">
        {/* Hotel Name */}
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

        {/* GST Number */}
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

        {/* GST Percentage */}
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

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hotel Logo
          </label>
          <div className="mt-1 flex justify-center px-4 sm:px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
            <div className="space-y-2 text-center w-full">
              {hotelInfo.logo ? (
                <div className="space-y-2">
                  <img
                    src={hotelInfo.logo}
                    alt="Hotel Logo"
                    className="mx-auto h-20 w-20 object-contain rounded-lg"
                  />
                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      className="text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-xs text-red-600 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="logo-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a logo</span>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
              <input
                id="logo-upload"
                name="logo-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 gap-4 flex-wrap">
        <button
          onClick={() => setHotelModal(false)}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all w-full sm:w-auto"
        >
          Cancel
        </button>
        <button
          onClick={saveHotelInfo}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-all w-full sm:w-auto"
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
