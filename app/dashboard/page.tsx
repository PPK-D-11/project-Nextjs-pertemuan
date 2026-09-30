"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string | null;
  email: string;
};

type Transaction = {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("IDR");
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [userResponse, transactionResponse] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/transactions"),
        ]);

        if (
          userResponse.status === 401 ||
          transactionResponse.status === 401
        ) {
          router.push("/login");
          return;
        }

        if (!userResponse.ok || !transactionResponse.ok) {
          throw new Error("Gagal mengambil data dashboard");
        }

        const userData = await userResponse.json();
        const transactionData = await transactionResponse.json();

        setUser(userData.user);
        setTransactions(transactionData.transactions || []);
      } catch (error) {
        console.error("DASHBOARD ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  useEffect(() => {
  const cookies = document.cookie.split("; ");

  const currencyCookie = cookies.find((cookie) =>
    cookie.startsWith("currency=")
  );

  if (currencyCookie) {
    const savedCurrency = currencyCookie.split("=")[1];

    if (savedCurrency === "IDR" || savedCurrency === "USD") {
      setCurrency(savedCurrency);
    }
  }
}, []);

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  function formatRupiah(value: number) {
  if (currency === "USD") {
    const exchangeRate = 17919;
    const usdValue = value / exchangeRate;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(usdValue);
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const balance = totalIncome - totalExpense;

  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return (
      <div className="cute-loading">
        <div className="loading-star">✦</div>
        <p>Menyiapkan keuanganmu...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <span className="moon">☾</span>

            <div>
              <strong>Expense</strong>
              <span>Tracker</span>
            </div>

            <span className="tiny-star">✦</span>
          </div>

          <nav className="sidebar-menu">
            <button className="nav-active">
              <span>⌂</span>
              Dashboard
            </button>

            <button onClick={() => router.push("/transactions")}>
              <span>＋</span>
              Tambah Transaksi
            </button>

            <button onClick={() => router.push("/history")}>
              <span>☆</span>
              History Transaksi
            </button>

            <button onClick={() => router.push("/limit")}>
              <span>♡</span>
              Atur Limit
            </button>
<button onClick={() => router.push("/budget")}>
  <span>◇</span>
  Monthly Budget
</button>

            <button onClick={() => router.push("/preference")}>
              <span>⚙</span>
              Preferensi
            </button>
          </nav>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <span>↪</span>
          Logout
        </button>

        <div className="sidebar-stars">
          ✦　⋆　☾
        </div>
      </aside>

      {/* MAIN DASHBOARD */}
      <section className="dashboard-content">

        {/* HERO */}
        <div className="dashboard-hero">
          <div className="hero-stars star-one">✦</div>
          <div className="hero-stars star-two">⋆</div>
          <div className="hero-stars star-three">✧</div>

          <div className="hero-copy">
            <div className="hero-label">
              ✦ YOUR MONEY SPACE ✦
            </div>

            <h1>Expense Tracker</h1>

            <h2>
              Welcome back,{" "}
              <strong>{user?.name || user?.email}</strong>! ✨
            </h2>

            <p>
              Let&apos;s manage your money today ♡
            </p>
          </div>

          <div className="hero-moon">
            <span>☾</span>
            <small>⋆ ✦ ⋆</small>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="summary-grid">

          <div className="summary-card balance-card">
            <div className="summary-icon">✦</div>

            <div>
              <span>Saldo</span>
              <strong>{formatRupiah(balance)}</strong>
              <small>Total uangmu saat ini</small>
            </div>

            <span className="card-decoration">☆</span>
          </div>

          <div className="summary-card income-card">
            <div className="summary-icon">↑</div>

            <div>
              <span>Total Pemasukan</span>
              <strong>{formatRupiah(totalIncome)}</strong>
              <small>Money coming in ✨</small>
            </div>

            <span className="card-decoration">🌱</span>
          </div>

          <div className="summary-card expense-card">
            <div className="summary-icon">↓</div>

            <div>
              <span>Total Pengeluaran</span>
              <strong>{formatRupiah(totalExpense)}</strong>
              <small>Money going out ♡</small>
            </div>

            <span className="card-decoration">🌸</span>
          </div>

        </div>

        {/* RECENT TRANSACTIONS */}
        <section className="recent-card">

          <div className="section-heading">
            <div>
              <span className="section-star">☆</span>
              <h3>Transaksi Terbaru</h3>
            </div>

            <button onClick={() => router.push("/history")}>
              Lihat semua →
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-cloud">
                ☁
                <span>✦</span>
              </div>

              <strong>Belum ada transaksi.</strong>

              <p>
                Mulai catat pemasukan atau pengeluaran pertamamu!
              </p>

              <button onClick={() => router.push("/transactions")}>
                ＋ Tambah transaksi pertama
              </button>
            </div>
          ) : (
            <div className="transaction-list">
              {recentTransactions.map((transaction) => (
                <div
                  className="transaction-item"
                  key={transaction.id}
                >
                  <div
                    className={
                      transaction.type === "INCOME"
                        ? "transaction-symbol income-symbol"
                        : "transaction-symbol expense-symbol"
                    }
                  >
                    {transaction.type === "INCOME" ? "↑" : "↓"}
                  </div>

                  <div className="transaction-info">
                    <strong>
                      {transaction.type === "INCOME"
                        ? "Pemasukan"
                        : "Pengeluaran"}
                    </strong>

                    <span>
                      {transaction.description || "Tanpa keterangan"}
                    </span>
                  </div>

                  <strong
                    className={
                      transaction.type === "INCOME"
                        ? "amount-income"
                        : "amount-expense"
                    }
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}{" "}
                    {formatRupiah(transaction.amount)}
                  </strong>
                </div>
              ))}
            </div>
          )}

        </section>

        {/* QUICK ACTIONS */}
        <section className="quick-actions">

          <button
            className="action-card action-pink"
            onClick={() => router.push("/transactions")}
          >
            <div className="action-icon">＋</div>

            <div>
              <strong>Tambah Transaksi</strong>
              <span>Catat pemasukan atau pengeluaran</span>
            </div>

            <span className="action-decoration">✎</span>
          </button>

          <button
            className="action-card action-blue"
            onClick={() => router.push("/history")}
          >
            <div className="action-icon">☆</div>

            <div>
              <strong>History Transaksi</strong>
              <span>Lihat dan kelola semua transaksi</span>
            </div>

            <span className="action-decoration">✦</span>
          </button>

          <button
            className="action-card action-yellow"
            onClick={() => router.push("/preference")}
          >
            <div className="action-icon">⚙</div>

            <div>
              <strong>Preferensi</strong>
              <span>Atur tampilan sesuai keinginanmu</span>
            </div>

            <span className="action-decoration">☾</span>
          </button>

          <button
            className="action-card action-purple"
            onClick={() => router.push("/limit")}
          >
            <div className="action-icon">♡</div>

            <div>
              <strong>Atur Limit</strong>
              <span>Kelola batas pengeluaran</span>
            </div>

            <span className="action-decoration">✧</span>
          </button>

        </section>

        <footer className="cute-footer">
          ✦ small steps, brighter financial days ✦
        </footer>

        <div className="walking-cat" aria-hidden="true">
  <span className="cat-heart">♡</span>
  <span className="cat-body">🐈</span>
</div>


      </section>
    </div>
  );

}



