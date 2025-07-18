import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // const [appVersion, setAppVersion] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const appVersion='1.1.4'

  // useEffect(() => {
  //   const fetchAppInfo = async () => {
  //     try {
  //       const docRef = doc(db, "appInfo", "version");
  //       const docSnap = await getDoc(docRef);

  //       if (docSnap.exists()) {
  //         const data = docSnap.data();
  //         setAppVersion(data.version);
  //       } else {
  //         setAppVersion("1.1.3");
  //       }
  //     } catch (error) {
  //       console.error("Error fetching app version:", error);
  //       setAppVersion("1.1.3");
  //     }
  //   };

  //   fetchAppInfo();
  // }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
    } finally {
      setIsLoading(false);
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

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔒 Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-orange-300 focus:outline-none pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute top-[35px] right-3 text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 ${
              isLoading ? "bg-orange-300" : "bg-orange-500 hover:bg-orange-600"
            } text-white font-medium rounded-md transition duration-150`}
          >
            {isLoading ? "Logging in..." : "🔓 Login"}
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
