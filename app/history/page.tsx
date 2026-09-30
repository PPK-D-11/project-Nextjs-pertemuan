"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt?: string;
};

type Filter = "ALL" | "INCOME" | "EXPENSE";

export default function HistoryPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState("EXPENSE");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function getTransactions(selectedFilter: Filter = filter) {
  try {
    setLoading(true);

    let url = "/api/transactions";

    if (selectedFilter === "INCOME") {
      url = "/api/transactions?type=INCOME";
    }

    if (selectedFilter === "EXPENSE") {
      url = "/api/transactions?type=EXPENSE";
    }

    const response = await fetch(url);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      throw new Error("Gagal mengambil transaksi");
    }

    const data = await response.json();

    setTransactions(data.transactions || []);
  } catch (error) {
    console.error("Gagal mengambil transaksi:", error);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    getTransactions();
  }, []);

  function startEdit(transaction: Transaction) {
    setEditingId(transaction.id);
    setEditType(transaction.type);
    setEditAmount(String(transaction.amount));
    setEditDescription(transaction.description || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    const response = await fetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: editType,
        amount: Number(editAmount),
        description: editDescription,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Gagal mengubah transaksi");
      return;
    }

    setEditingId(null);
    await getTransactions();
  }

  async function deleteTransaction(id: number) {
    const confirmed = window.confirm(
      "Yakin ingin menghapus transaksi ini?"
    );

    if (!confirmed) return;

    const response = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Gagal menghapus transaksi");
      return;
    }

    await getTransactions();
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "ALL") return true;

    return transaction.type === filter;
  });

  return (
    <main>
      <h1>History Transaksi</h1>

      <div>
  <button
    onClick={() => {
      setFilter("ALL");
      getTransactions("ALL");
    }}
  >
    Semua
  </button>{" "}

  <button
    onClick={() => {
      setFilter("INCOME");
      getTransactions("INCOME");
    }}
  >
    Pemasukan
  </button>{" "}

  <button
    onClick={() => {
      setFilter("EXPENSE");
      getTransactions("EXPENSE");
    }}
  >
    Pengeluaran
  </button>
</div>

      <hr />

      {loading && <p>Memuat transaksi...</p>}

      {!loading && filteredTransactions.length === 0 && (
        <p>Belum ada transaksi.</p>
      )}

      {filteredTransactions.map((transaction) => (
        <div key={transaction.id}>

          {editingId === transaction.id ? (
            <>
              <h3>Edit Transaksi</h3>

              <label>Jenis</label>
              <br />

              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
              >
                <option value="INCOME">Pemasukan</option>
                <option value="EXPENSE">Pengeluaran</option>
              </select>

              <br />
              <br />

              <label>Nominal</label>
              <br />

              <input
                type="number"
                min="1"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />

              <br />
              <br />

              <label>Keterangan</label>
              <br />

              <input
                type="text"
                value={editDescription}
                onChange={(e) =>
                  setEditDescription(e.target.value)
                }
              />

              <br />
              <br />

              <button onClick={() => saveEdit(transaction.id)}>
                Simpan
              </button>{" "}

              <button onClick={cancelEdit}>
                Batal
              </button>
            </>
          ) : (
            <>
              <h3>
                {transaction.type === "INCOME"
                  ? "Pemasukan"
                  : "Pengeluaran"}
              </h3>

              <p>
                Rp{" "}
                {Number(transaction.amount).toLocaleString(
                  "id-ID"
                )}
              </p>

              <p>
                {transaction.description || "-"}
              </p>

              {transaction.createdAt && (
  <p>
    📅{" "}
    {new Date(transaction.createdAt).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}
  </p>
)}

              <button onClick={() => startEdit(transaction)}>
                Edit
              </button>{" "}

              <button
                onClick={() =>
                  deleteTransaction(transaction.id)
                }
              >
                Hapus
              </button>
            </>
          )}

          <hr />
        </div>
      ))}

      <button onClick={() => router.push("/transactions")}>
        Tambah Transaksi
      </button>{" "}

      <button onClick={() => router.push("/dashboard")}>
        Kembali ke Dashboard
      </button>
    </main>
  );
}