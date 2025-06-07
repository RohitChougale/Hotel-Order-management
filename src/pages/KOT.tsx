// src/pages/KOT.tsx
import KOTBoard from "../components/KOTBoard";

export default function KOT() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kitchen Orders (KOT)</h1>
      <KOTBoard />
    </div>
  );
}
