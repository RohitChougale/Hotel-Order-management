import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [systemType, setSystemType] = useState('counter');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleSignup = async () => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    await setDoc(doc(db, 'users', userId), {
      email,
      systemType,
      createdAt: serverTimestamp(),
      adminUsername: adminUsername || null,
      adminPassword: adminPassword || null,
    });

    alert('User created successfully');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        className="border w-full mb-2 p-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border w-full mb-2 p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select
        className="border w-full mb-2 p-2 rounded"
        value={systemType}
        onChange={(e) => setSystemType(e.target.value)}
      >
        <option value="counter">Counter System</option>
        <option value="table">Table System</option>
      </select>

      <input
        type="text"
        placeholder="Admin Username (optional)"
        className="border w-full mb-2 p-2 rounded"
        value={adminUsername}
        onChange={(e) => setAdminUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Admin Password (optional)"
        className="border w-full mb-4 p-2 rounded"
        value={adminPassword}
        onChange={(e) => setAdminPassword(e.target.value)}
      />

      <button
        className="bg-orange-600 text-white w-full py-2 rounded"
        onClick={handleSignup}
      >
        Create Account
      </button>
    </div>
  );
}
