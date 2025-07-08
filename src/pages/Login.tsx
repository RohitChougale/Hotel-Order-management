import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [appVersion, setAppVersion] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchAppInfo = async () => {
      try {
        const docRef = doc(db, "appInfo", "version");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAppVersion(data.version);
        } else {
          setAppVersion("1.1.0");
        }
      } catch (error) {
        console.error("Error fetching app version:", error);
        setAppVersion("1.1.0");
      }
    };

    fetchAppInfo();
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCredential.user.uid;
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) throw new Error("User document not found");

      const userData = userDoc.data();
      const systemType = userData.systemType;

      if (systemType === "counter") {
        navigate("/counterHome");
      } else if (systemType === "table") {
        navigate("/home");
      } else {
        throw new Error("Invalid system type in user document");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Login failed");
    }
  };

  return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-200 to-green-100 flex items-center justify-center overflow-hidden">

      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-sm border border-orange-200">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-orange-600">Welcome</h2>
          <p className="text-sm text-gray-500 mt-1">Please login to continue</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded mb-4 border border-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📧 Email
            </label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-orange-300 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔒 Password
            </label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-orange-300 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition duration-150"
          >
            🔓 Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          © {new Date().getFullYear()} Hotel Manager {appVersion}
        </p>
        <p className="text-center text-sm text-gray-400 mt-1">
          Made by PulsesTechnology with ❤️
        </p>
      </div>
    </div>
  );
}
