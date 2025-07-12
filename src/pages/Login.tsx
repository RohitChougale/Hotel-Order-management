import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Eye icons as SVG components for better reusability and cleaner code
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.115-2.115m0 0l-5.858-.908" />
  </svg>
);


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  // const [appVersion, setAppVersion] = useState("");
  const navigate = useNavigate();
  const appVersion= "1.1.1"

  // useEffect(() => {
  //   const fetchAppInfo = async () => {
  //     try {
  //       const docRef = doc(db, "appInfo", "version");
  //       const docSnap = await getDoc(docRef);
  //       setAppVersion(docSnap.exists() ? docSnap.data().version : "1.1.0");
  //     } catch (error) {
  //       console.error("Error fetching app version:", error);
  //       setAppVersion("1.1.0");
  //     }
  //   };
  //   fetchAppInfo();
  // }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (!userDoc.exists()) {
        throw new Error("User data not found. Please contact support.");
      }

      const { systemType } = userDoc.data();
      if (systemType === "counter") navigate("/counterHome");
      else if (systemType === "table") navigate("/home");
      else throw new Error("Invalid system type configured for your account.");
      
    } catch (err: any) {
      console.error("Login failed:", err);
      // Provide user-friendly error messages
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError("Invalid email or password. Please try again.");
          break;
        case 'auth/too-many-requests':
          setError("Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.");
          break;
        default:
          setError(err.message || "An unknown error occurred during login.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 lg:grid lg:grid-cols-2">
      {/* Left Branding Panel (Visible on Desktop) */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-yellow-400 p-12 text-white text-center shadow-lg">
        <div className="transform transition-all hover:scale-105 duration-300">
          <h1 className="text-5xl font-extrabold tracking-tight">Hotel Manager</h1>
          <p className="mt-4 text-lg opacity-90 max-w-sm mx-auto">
            Your all-in-one solution for seamless and efficient hotel management.
          </p>
        </div>
      </div>

      {/* Right Form Panel (Full screen on mobile, right half on desktop) */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Please sign in to your account
            </p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-800 text-sm font-medium px-4 py-3 rounded-lg mb-6 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-150 transform hover:-translate-y-0.5"
            >
              Sign In
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Hotel Manager | v{appVersion}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Made by PulsesTechnology with ❤️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}