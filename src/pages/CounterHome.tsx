import { useNavigate } from "react-router-dom";

export default function CounterHome() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-yellow-100 to-pink-100 flex items-center justify-center overflow-hidden">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center space-y-6 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-800">🎟️ Counter System</h1>
        <p className="text-lg italic text-gray-600">
          “Smart counter billing — because every second counts in service.”
        </p>

        <div className="flex justify-center gap-6 pt-4">
          <button
            onClick={() => navigate("/counterAdmin")}
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
    </div>
  );
}
