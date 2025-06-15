import React from 'react'
import { NavLink } from 'react-router-dom'

function TableSystemHeader() {
  return (
    <div><header className="bg-gradient-to-r from-blue-600 to-green-500 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-white font-bold text-xl">Restaurant Dashboard</h1>

          <nav className="space-x-3">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-blue-600"
                    : "text-white hover:bg-white hover:text-blue-600"
                }`
              }
            >
              Admin
            </NavLink>

            <NavLink
              to="/bills"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-green-600"
                    : "text-white hover:bg-white hover:text-green-600"
                }`
              }
            >
              Bill
            </NavLink>

            <NavLink
              to="/staff"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-green-600"
                    : "text-white hover:bg-white hover:text-green-600"
                }`
              }
            >
              Order
            </NavLink>

            <NavLink
              to="/kot"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-green-600"
                    : "text-white hover:bg-white hover:text-green-600"
                }`
              }
            >
              KOT
            </NavLink>
          </nav>
        </div>
      </header></div>
  )
}

export default TableSystemHeader