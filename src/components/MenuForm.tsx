import { useState, useEffect } from "react";

interface Props {
  onSubmit: (data: { name: string; price: number; type: string }) => void;
  initialData?: { name: string; price: number; type: string };
}

export default function MenuForm({ onSubmit, initialData }: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrice(String(initialData.price));
      setType(initialData.type || "");
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, price: parseFloat(price), type });
    setName("");
    setPrice("");
    setType("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h3 className="text-xl font-bold mb-2">
        {initialData ? "Edit" : "Add"} Menu Item
      </h3>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item Name"
        className="border p-2 w-full"
        required
      />

      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        className="border p-2 w-full"
        required
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border p-2 w-full"
        required
      >
        <option value="">Select Food Type</option>
        <option value="breakfast">Breakfast</option>
        <option value="meal">Meal</option>
        <option value="drink">Drink</option>
      </select>

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        type="submit"
      >
        {initialData ? "Update" : "Add"} Item
      </button>
    </form>
  );
}
