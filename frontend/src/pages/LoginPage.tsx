import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await axios.post("http://localhost:8000/api/login/", {
      email,
      password,
    });

    const { access, user } = response.data;

    // 🧹 Nettoyer l'ancien utilisateur et token
    localStorage.clear();

    // 🔐 Stocker les nouvelles infos
    localStorage.setItem("access", access); // ⬅️ recommandé d'utiliser 'access' (et pas 'token')
    localStorage.setItem("user", JSON.stringify(user));

    // 🔁 Redirection selon le rôle
    if (user.is_chef || user.is_superuser) {
      navigate("/chef-departement");
    } else {
      navigate("/");
    }
  } catch (error) {
    setMessage("Email ou mot de passe incorrect.");
  }
};

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-green-800 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-80 text-center">
        <img
          src="/logo.png"
          alt="ANSADE"
          className="mx-auto mb-4"
          style={{ height: 50 }}
        />

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-4 py-2"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-4 py-2"
            required
          />

          {message && <div className="text-red-600 text-sm">{message}</div>}

          <button
            type="submit"
            className="w-full bg-green-700 text-white font-semibold py-2 rounded hover:bg-green-500"
          >
            SE CONNECTER
          </button>
        </form>

        <div className="mt-4 space-y-1 text-sm text-green-700">
          <a href="/" className="block hover:underline">
            OPEN DATA
          </a>
          <a href="http://127.0.0.1:8000/admin/" className="block hover:underline">
            ADMIN
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
