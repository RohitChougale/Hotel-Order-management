import { useState, useEffect } from "react";

interface Props {
  onSubmit: (data: {
    name: string;
    nameMarathi: string;
    nonAcPrice: number;
    acPrice: number;
    type: string;
  }) => void;
  initialData?: {
    name: string;
    nameMarathi?: string;
    nonAcPrice?: number;
    acPrice?: number;
    type: string;
  };
}

export default function MenuForm({ onSubmit, initialData }: Props) {
  const [name, setName] = useState("");
  const [nameMarathi, setNameMarathi] = useState("");
  const [nonAcPrice, setNonAcPrice] = useState("");
  const [acPrice, setAcPrice] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setNameMarathi(initialData.nameMarathi || "");
      setNonAcPrice(String(initialData.nonAcPrice ?? ""));
      setAcPrice(String(initialData.acPrice ?? ""));
      setType(initialData.type || "");
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      nameMarathi,
      nonAcPrice: parseFloat(nonAcPrice),
      acPrice: parseFloat(acPrice),
      type,
    });

    setName("");
    setNameMarathi("");
    setNonAcPrice("");
    setAcPrice("");
    setType("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h3 className="text-xl font-bold mb-2">
        {initialData ? "Edit" : "Add"} Menu Item
      </h3>

      <div>
        <label className="block mb-1 font-medium">Item Name (English)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Eg: Paneer Masala"
          className="border p-2 w-full rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Item Name (Marathi)</label>
        <input
          type="text"
          value={nameMarathi}
          onChange={(e) => setNameMarathi(e.target.value)}
          placeholder="Eg: पनीर मसाला"
          className="border p-2 w-full rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Non-AC Price</label>
        <input
          type="number"
          value={nonAcPrice}
          onChange={(e) => setNonAcPrice(e.target.value)}
          placeholder="Eg: 150"
          className="border p-2 w-full rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">AC Price</label>
        <input
          type="number"
          value={acPrice}
          onChange={(e) => setAcPrice(e.target.value)}
          placeholder="Eg: 170"
          className="border p-2 w-full rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Food Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border p-2 w-full rounded"
          required
        >
          <option value="">Select Type</option>
          <option value="breakfast">Breakfast</option>
          <option value="meal">Meal</option>
          <option value="drink">Drink</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all"
      >
        {initialData ? "Update" : "Add"} Item
      </button>
    </form>
  );
}
