"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BudgetPage() {
  const router = useRouter();

  const today = new Date();
  const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
  const currentYear = today.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(
    `${currentYear}-${currentMonth}`
  );
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState<number | null>(null);
const [totalExpense, setTotalExpense] = useState(0);
const [remainingBudget, setRemainingBudget] = useState(0);
const usagePercentage =
  budget && budget > 0
    ? Math.round((totalExpense / budget) * 100)
    : 0;

let budgetStatus = "Aman";

if (usagePercentage > 100) {
  budgetStatus = "Melebihi Budget";
} else if (usagePercentage >= 80) {
  budgetStatus = "Hampir Habis";
} else if (usagePercentage >= 50) {
  budgetStatus = "Waspada";
}

async function getBudgetSummary(monthValue: string) {
  try {
    const [year, month] = monthValue.split("-").map(Number);

    const response = await fetch(
      `/api/budget?month=${month}&year=${year}`
    );

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      throw new Error("Gagal mengambil budget");
    }

    const data = await response.json();

    setBudget(
      data.budget ? Number(data.budget.amount) : null
    );
    setTotalExpense(Number(data.totalExpense || 0));
    setRemainingBudget(Number(data.remainingBudget || 0));
  } catch (error) {
    console.error("GET BUDGET SUMMARY ERROR:", error);

    setBudget(null);
    setTotalExpense(0);
    setRemainingBudget(0);
  }
}

useEffect(() => {
  getBudgetSummary(selectedMonth);
}, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const [year, month] = selectedMonth.split("-").map(Number);

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/budget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          month,
          year,
        }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Gagal menyimpan budget");
        return;
      }

      setMessage("Budget berhasil disimpan");
      setAmount("");
    } catch (error) {
      console.error("SET BUDGET ERROR:", error);
      setMessage("Terjadi kesalahan saat menyimpan budget");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Monthly Budget</h1>

      <p>
        Atur batas pengeluaran bulanan agar keuangan lebih mudah
        dipantau.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="month">Bulan</label>
        <br />

        <input
  id="month"
  type="month"
  value={selectedMonth}
  onChange={(e) => {
    const newMonth = e.target.value;

    setSelectedMonth(newMonth);
    getBudgetSummary(newMonth);
  }}
  required
/>

        <br />
        <br />

        <label htmlFor="amount">Budget Bulanan</label>
        <br />

        <input
          id="amount"
          type="number"
          min="1"
          placeholder="Contoh: 5000000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <br />
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Budget"}
        </button>
      </form>

      {message && <p>{message}</p>}

    {budget !== null && (
  <section>
    <h2>Budget Summary</h2>

    <p>
      <strong>Total Budget:</strong>{" "}
      Rp {budget.toLocaleString("id-ID")}
    </p>

    <p>
      <strong>Total Pengeluaran:</strong>{" "}
      Rp {totalExpense.toLocaleString("id-ID")}
    </p>

    <p>
      <strong>Sisa Budget:</strong>{" "}
      Rp {remainingBudget.toLocaleString("id-ID")}
    </p>

    <p>
  <strong>Penggunaan Budget:</strong>{" "}
  {usagePercentage}%
</p>

<p>
  <strong>Status:</strong>{" "}
  {budgetStatus}
</p>

<progress
  value={Math.min(usagePercentage, 100)}
  max="100"
  style={{
    width: "100%",
    height: "20px",
  }}
/>
  </section>
)}
      <br />

      <button onClick={() => router.push("/dashboard")}>
        Kembali ke Dashboard
      </button>
    </main>
  );
}

