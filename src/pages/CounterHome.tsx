import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function CounterHome() {
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Clear form & error on modal close
    if (!showAdminLogin) {
      setAdminUsername("");
      setAdminPassword("");
      setError("");
    }
  }, [showAdminLogin]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("adminAuthenticated"); // clear on logout
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAdminButtonClick = () => {
    const alreadyAuthed = sessionStorage.getItem("adminAuthenticated");
    if (alreadyAuthed === "true") {
      navigate("/counterAdmin");
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleAdminAccess = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (
        adminUsername === data.adminUsername &&
        adminPassword === data.adminPassword
      ) {
        sessionStorage.setItem("adminAuthenticated", "true");
        setShowAdminLogin(false);
        navigate("/counterAdmin");
      } else {
        setError("Invalid credentials");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-yellow-100 to-pink-100 flex items-center justify-center overflow-hidden">
      <button
        onClick={handleLogout}
        className="fixed top-5 right-5 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition"
      >
        🚪 Logout
      </button>

      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl text-center space-y-6 w-full max-w-2xl mx-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">🎟️ Counter System</h1>
        <p className="text-md sm:text-lg italic text-gray-600">
          “Smart counter billing — because every second counts in service.”
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-4">
          <button
            onClick={handleAdminButtonClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow transition"
          >
            ⚙️ Admin
          </button>

          <button
            onClick={() => navigate("/counterOrder")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow transition"
          >
            🧾 Take Order
          </button>
        </div>
      </div>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4 relative">
            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl"
              onClick={() => setShowAdminLogin(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-semibold text-center text-gray-800">Admin Login</h2>
          <label className="block text-sm font-medium text-gray-700 mb-1">
                  UserName
                </label>
            <input
              type="text"
              placeholder="Username"
              className="border w-full px-3 py-2 rounded focus:outline-none"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">
                 Password
                </label>
            <input
              type="password"
              placeholder="Password"
              className="border w-full px-3 py-2 rounded focus:outline-none"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <button
              onClick={handleAdminAccess}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
