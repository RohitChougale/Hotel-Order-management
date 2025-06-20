import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { getAuth } from "firebase/auth";

// Type for each chart entry
interface ChartEntry {
  day: string;
  total: number;
}

const HotelAnalytics = () => {
  const [data, setData] = useState<ChartEntry[]>([]);
  const [month, setMonth] = useState<number>(dayjs().month() + 1); // dayjs is 0-indexed, so +1
  const [year, setYear] = useState<number>(dayjs().year());
   const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "users", currentUser!.uid, "bills"));

      const list = snapshot.docs
        .map((doc) => doc.data())
        .filter((bill) => bill.paid === "yes" && bill.createdAt)
        .map((bill) => ({
          date: bill.createdAt.toDate(),
          total: bill.total,
        }))
        .filter(
          (bill) =>
            dayjs(bill.date).month() + 1 === Number(month) &&
            dayjs(bill.date).year() === Number(year)
        );

      const dailyTotals: Record<string, number> = {};

      list.forEach(({ date, total }) => {
        const day = dayjs(date).format("YYYY-MM-DD");
        dailyTotals[day] = (dailyTotals[day] || 0) + total;
      });

      const chartData: ChartEntry[] = Object.entries(dailyTotals).map(
        ([day, total]) => ({
          day,
          total: parseFloat(total.toFixed(2)),
        })
      );

      setData(chartData);
    };

    fetchData();
  }, [month, year]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearOptions = [2024, 2025];

  return (
    <div className="p-6 bg-white shadow rounded-xl w-full">
      <h2 className="text-2xl font-bold mb-4">📊 Hotel Revenue Analytics</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {dayjs(`${m}`, "M").format("MMMM")}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500">No data available for the selected month.</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `₹${value}`} />
            <Tooltip
              formatter={(value) => `₹${value}`}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line type="monotone" dataKey="total" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default HotelAnalytics;
