import {
  addDoc,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { Switch } from "@headlessui/react";
import { Popover } from "@headlessui/react";

interface HotelInfo {
  name: string;
  acCharge: number;
  nonAcCharge: number;
  gst: number;
  acTables: string;
  nonAcTables: string;
  greeting: string;
}

interface GeneralSettings {
  marathiPrint: boolean;
  acPerItem: boolean;
  darkMode: boolean;
}

export default function Settings() {
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  const [showHotelEditModal, setShowHotelEditModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

  const [hotelInfo, setHotelInfo] = useState<HotelInfo>({
    name: "",
    acCharge: 0,
    nonAcCharge: 0,
    gst: 0,
    acTables: "1-10",
    nonAcTables: "11-20",
    greeting: "",
  });

  const [settings, setSettings] = useState<GeneralSettings>({
    marathiPrint: false,
    acPerItem: false,
    darkMode: false,
  });

  const [staffList, setStaffList] = useState<string[]>([]);
  const [newStaffName, setNewStaffName] = useState("");

  useEffect(() => {
    const fetchHotelInfo = async () => {
      const snapshot = await getDocs(collection(db, "hotelinfo"));
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setHotelInfo(docSnap.data() as HotelInfo);
        setExistingDocId(docSnap.id);
      }
    };

    const fetchSettings = async () => {
      const snap = await getDocs(collection(db, "settings"));
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setSettings({
          marathiPrint: data.marathiPrint || false,
          acPerItem: data.acPerItem || false,
          darkMode: data.darkMode || false,
        });
      } else {
        await addDoc(collection(db, "settings"), settings);
      }
    };

    const fetchStaff = () => {
      onSnapshot(collection(db, "staff"), (snapshot) => {
        const list = snapshot.docs.map((doc) => doc.data().name);
        setStaffList(list);
      });
    };

    fetchHotelInfo();
    fetchSettings();
    fetchStaff();
  }, []);

  const handleHotelInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingDocId) {
      await updateDoc(doc(db, "hotelinfo", existingDocId), hotelInfo as any);
      alert("Hotel info updated successfully.");
      setShowHotelEditModal(false);
    } else {
      const newDocRef = await addDoc(collection(db, "hotelinfo"), hotelInfo);
      setExistingDocId(newDocRef.id);
      alert("Hotel info saved successfully.");
    }
  };

  const handleSettingToggle = async (key: keyof GeneralSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);

    const snap = await getDocs(collection(db, "settings"));
    if (!snap.empty) {
      await updateDoc(doc(db, "settings", snap.docs[0].id), updated);
    } else {
      await addDoc(collection(db, "settings"), updated);
    }
  };

  const addStaff = async () => {
    if (newStaffName.trim()) {
      await addDoc(collection(db, "staff"), { name: newStaffName.trim() });
      setNewStaffName("");
    }
  };

  const deleteStaff = async (nameToDelete: string) => {
    const snap = await getDocs(collection(db, "staff"));
    snap.docs.forEach((docSnap) => {
      if (docSnap.data().name === nameToDelete) {
        deleteDoc(doc(db, "staff", docSnap.id));
      }
    });
  };

  return (
    <div className="p-6 space-y-10 bg-gradient-to-b from-gray-100 to-gray-300 min-h-screen text-gray-800">
      <section className="bg-white shadow-xl rounded-2xl p-6 max-w-2xl mx-auto border border-blue-100">
        <h3 className="text-2xl font-bold mb-4 text-blue-700">🏨 Hotel Info</h3>
        {existingDocId === null ? (
          <form onSubmit={handleHotelInfoSubmit} className="space-y-4">
            {["Hotel Name", "AC Charges", "Non-AC Charges", "GST Percentage", "AC Table Range", "Non-AC Table Range", "Greeting"].map((label, i) => {
              const keys = ["name", "acCharge", "nonAcCharge", "gst", "acTables", "nonAcTables", "greeting"] as (keyof HotelInfo)[];
              return (
                <input
                  key={i}
                  type={label.includes("Charges") || label.includes("GST") ? "number" : "text"}
                  placeholder={label}
                  value={hotelInfo[keys[i]]}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, [keys[i]]: e.target.value })}
                  required
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full shadow-sm focus:ring focus:ring-blue-200"
                />
              );
            })}
            <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200">
              💾 Save Hotel Info
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p><strong>🏨 Name:</strong> {hotelInfo.name}</p>
            <p><strong>❄️ AC Charges:</strong> ₹{hotelInfo.acCharge}</p>
            <p><strong>🔥 Non-AC Charges:</strong> ₹{hotelInfo.nonAcCharge}</p>
            <p><strong>📊 GST:</strong> {hotelInfo.gst}%</p>
            <p><strong>📋 AC Tables:</strong> {hotelInfo.acTables}</p>
            <p><strong>📋 Non-AC Tables:</strong> {hotelInfo.nonAcTables}</p>
            <p><strong>🎉 Greeting:</strong> {hotelInfo.greeting}</p>
            <button
              onClick={() => setShowHotelEditModal(true)}
              className="mt-4 bg-yellow-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-yellow-600"
            >
              ✏️ Edit Hotel Info
            </button>
          </div>
        )}
      </section>

      {/* GENERAL SETTINGS */}
      <section className="bg-white shadow-xl rounded-2xl p-6 max-w-2xl mx-auto border border-green-200">
        <h3 className="text-2xl font-bold text-green-700 mb-6">⚙️ General Settings</h3>

        <div className="space-y-6">
          {[
            { key: "marathiPrint", label: "📝 Marathi Print" },
            { key: "acPerItem", label: "❄️ AC Charges Per Item" },
            { key: "darkMode", label: "🌙 Dark Mode" },
          ].map(({ key, label }) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-lg font-medium">{label}</span>
              <Switch
                checked={settings[key as keyof GeneralSettings]}
                onChange={() => handleSettingToggle(key as keyof GeneralSettings)}
                className={`${settings[key as keyof GeneralSettings] ? "bg-green-500" : "bg-gray-300"} relative inline-flex items-center h-6 rounded-full w-11 transition`}
              >
                <span className="sr-only">{label}</span>
                <span
                  className={`${
                    settings[key as keyof GeneralSettings] ? "translate-x-6" : "translate-x-1"
                  } inline-block w-4 h-4 transform bg-white rounded-full transition`}
                />
              </Switch>
            </div>
          ))}
        </div>

        {/* STAFF POPOVER */}
        {/* STAFF MODAL */}
<div className="mt-10">
  <button
    onClick={() => setShowStaffModal(true)}
    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
  >
    👨‍🍳 Manage Staff
  </button>
</div>

{/* STAFF POPUP MODAL */}
{showStaffModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full relative">
      <button
        onClick={() => setShowStaffModal(false)}
        className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl font-bold"
      >
        &times;
      </button>
      <h2 className="text-xl font-semibold text-indigo-700 mb-4">👥 Staff Management</h2>

      {staffList.length > 0 ? (
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {staffList.map((name, i) => (
            <div key={i} className="flex justify-between items-center border-b pb-1">
              <span>{name}</span>
              <button
                onClick={() => deleteStaff(name)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                ❌ Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No staff members yet.</p>
      )}

      <div className="mt-4 space-y-2">
        <input
          type="text"
          value={newStaffName}
          onChange={(e) => setNewStaffName(e.target.value)}
          placeholder="Enter staff name"
          className="w-full border px-3 py-2 rounded-lg text-sm"
        />
        <button
          onClick={addStaff}
          className="bg-green-600 text-white px-4 py-2 rounded-lg w-full hover:bg-green-700"
        >
          ➕ Add Staff
        </button>
      </div>
    </div>
  </div>
)}

      </section>

      {/* EDIT MODAL */}
      {showHotelEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full relative">
            <button
              onClick={() => setShowHotelEditModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-semibold mb-4 text-blue-600">Edit Hotel Info</h3>

            <form onSubmit={handleHotelInfoSubmit} className="space-y-4">
              {["Hotel Name", "AC Charges", "Non-AC Charges", "GST Percentage", "AC Table Range", "Non-AC Table Range", "Greeting"].map((label, i) => {
                const keys = ["name", "acCharge", "nonAcCharge", "gst", "acTables", "nonAcTables", "greeting"] as (keyof HotelInfo)[];
                return (
                  <input
                    key={i}
                    type={label.includes("Charges") || label.includes("GST") ? "number" : "text"}
                    placeholder={label}
                    value={hotelInfo[keys[i]]}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, [keys[i]]: e.target.value })}
                    required
                    className="border border-gray-300 px-4 py-2 rounded-lg w-full shadow-sm focus:ring focus:ring-blue-200"
                  />
                );
              })}

              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 w-full transition-all"
              >
                ✅ Update Info
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
