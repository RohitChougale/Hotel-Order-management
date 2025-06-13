import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-200 to-green-100 flex items-center justify-center overflow-hidden">
      <div className="bg-white shadow-2xl rounded-3xl p-10 space-y-8 w-full max-w-xl text-center">
        <h1 className="text-4xl font-bold text-gray-800">🍽️ Hotel Management</h1>
        <p className="text-gray-600">Choose your preferred billing system</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/home")}
            className="bg-indigo-600 text-white p-5 rounded-xl shadow hover:bg-indigo-700 text-lg font-semibold transition duration-200"
          >
            🪑 Table System
          </button>

          <button
            onClick={() => navigate("/counterHome")}
            className="bg-green-600 text-white p-5 rounded-xl shadow hover:bg-green-700 text-lg font-semibold transition duration-200"
          >
            🎟️ Counter System
          </button>
        </div>
      </div>
    </div>
  );
}
