import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../src/prisma/db";

async function getCurrentUserId() {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error("SESSION_SECRET belum dikonfigurasi");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(sessionSecret);
    const { payload } = await jwtVerify(token, secret);

    const userId = Number(payload.userId);

    if (!userId || Number.isNaN(userId)) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

// ===============================
// SET MONTHLY BUDGET
// ===============================
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const amount = Number(body.amount);
    const month = Number(body.month);
    const year = Number(body.year);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Budget harus lebih dari 0" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json(
        { message: "Bulan tidak valid" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return NextResponse.json(
        { message: "Tahun tidak valid" },
        { status: 400 }
      );
    }

    const userBudgets = await db.orm.public.Budget
  .where((b) => b.userId.eq(userId))
  .all();

const existingBudget = userBudgets.find(
  (item) =>
    item.month === month &&
    item.year === year
);

let budget;

if (existingBudget) {
  budget = await db.orm.public.Budget
    .where((b) => b.id.eq(existingBudget.id))
    .update({
      amount,
    });
} else {
  budget = await db.orm.public.Budget.create({
    amount,
    month,
    year,
    userId,
  });
}
    return NextResponse.json(
      {
        message: "Budget berhasil disimpan",
        budget,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE BUDGET ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menyimpan budget" },
      { status: 500 }
    );
  }
}


// ===============================
// GET MONTHLY BUDGET
// ===============================
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year)
    ) {
      return NextResponse.json(
        { message: "Bulan atau tahun tidak valid" },
        { status: 400 }
      );
    }

    // Ambil seluruh budget milik user yang sedang login
    const userBudgets = await db.orm.public.Budget
      .where((b) => b.userId.eq(userId))
      .all();

    // Cari budget untuk bulan dan tahun yang dipilih
    const budget =
      userBudgets.find(
        (item) =>
          item.month === month &&
          item.year === year
      ) || null;

      // Ambil transaksi milik user yang sedang login
const userTransactions =
  await db.orm.public.Transaction
    .where((t) => t.userId.eq(userId))
    .all();

// Hitung total pengeluaran pada bulan dan tahun yang dipilih
const totalExpense = userTransactions
  .filter((transaction) => {
    if (transaction.type !== "EXPENSE") {
      return false;
    }

    const transactionDate = new Date(
      transaction.createdAt
    );

    return (
      transactionDate.getMonth() + 1 === month &&
      transactionDate.getFullYear() === year
    );
  })
  .reduce(
    (total, transaction) =>
      total + Number(transaction.amount),
    0
  );

// Hitung sisa budget
const budgetAmount = budget
  ? Number(budget.amount)
  : 0;

const remainingBudget =
  budgetAmount - totalExpense;

    return NextResponse.json(
  {
    budget,
    totalExpense,
    remainingBudget,
  },
  { status: 200 }
);
  } catch (error) {
    console.error("GET BUDGET ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil budget" },
      { status: 500 }
    );
  }
}