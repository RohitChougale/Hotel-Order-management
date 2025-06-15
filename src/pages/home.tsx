import { NavLink } from "react-router-dom";
import TableSystemHeader from "../components/TableSystemHeader";

export default function Home() {
  return (
    <div>
  <TableSystemHeader/>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex items-center justify-center p-6">
        <div className="bg-white/60 backdrop-blur-lg shadow-xl rounded-3xl p-10 max-w-3xl w-full text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-800 mb-4 animate-fade-in">
            🍽️ Welcome to{" "}
            <span className="text-blue-600">Restaurant Dashboard</span>
          </h1>

          <p className="text-lg text-gray-600 mb-8 animate-fade-in delay-100">
            A smart way to manage your orders, kitchen, and menu – all in one
            place!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-200">
            <a
              href="/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow transition duration-300 hover:scale-105"
            >
              🔧 Admin Panel
            </a>
            <a
              href="/staff"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow transition duration-300 hover:scale-105"
            >
              🧾 Staff Orders
            </a>
            <a
              href="/kot"
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold shadow transition duration-300 hover:scale-105"
            >
              👨‍🍳 KOT Display
            </a>
          </div>

          <div className="mt-10 text-sm text-gray-500">
            Made by{" "}
            <span className="font-medium text-gray-700">Pulses Technology</span>
          </div>
        </div>
      </div>
    </div>
  );
}
