"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      router.push("/panel");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError("Usuario o contraseña incorrectos.");
        return;
      }

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      router.push("/panel");
    } catch {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="loginPage">
        <section className="loginWrap">
          <div className="loginCard">
            <p className="loginKicker">PORTAL</p>
            <h1 className="loginTitle">Iniciar sesión</h1>
            <p className="loginText">
              Accede al sistema de auditoría y gestión documental de CC Contadores.
            </p>

            <form onSubmit={handleSubmit} className="loginForm">
              <div className="loginField">
                <label htmlFor="username">Usuario</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="loginField">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="loginError">{error}</p>}

              <button type="submit" className="loginButton" disabled={loading}>
                {loading ? "Ingresando..." : "Entrar al sistema"}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}