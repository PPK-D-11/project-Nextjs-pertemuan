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
// CREATE TRANSACTION
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

    const type = body.type || body.jenis;
    const amount = Number(body.amount ?? body.nominal);
    const description =
      body.description ?? body.keterangan ?? "";

    if (!type || !amount) {
      return NextResponse.json(
        { message: "Jenis dan nominal wajib diisi" },
        { status: 400 }
      );
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json(
        {
          message:
            "Jenis transaksi harus INCOME atau EXPENSE",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Nominal harus lebih dari 0" },
        { status: 400 }
      );
    }

    // userId berasal dari session
    // sehingga transaksi otomatis milik user yang login
    const transaction =
      await db.orm.public.Transaction.create({
        type,
        amount,
        description,
        userId,
      });

    return NextResponse.json(
      {
        message: "Transaksi berhasil disimpan",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE TRANSACTION ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menyimpan transaksi" },
      { status: 500 }
    );
  }
}

// ===============================
// READ TRANSACTIONS + FILTER AJAX
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
    const type = searchParams.get("type");

    // Hanya menerima INCOME atau EXPENSE sebagai filter
    if (
      type !== null &&
      type !== "INCOME" &&
      type !== "EXPENSE"
    ) {
      return NextResponse.json(
        { message: "Filter transaksi tidak valid" },
        { status: 400 }
      );
    }

    // Tetap hanya mengambil transaksi milik user login
    const userTransactions =
      await db.orm.public.Transaction
        .where((t) => t.userId.eq(userId))
        .orderBy((t) => t.createdAt.desc())
        .all();

    // Filter berdasarkan parameter dari AJAX
    const transactions =
      type === "INCOME" || type === "EXPENSE"
        ? userTransactions.filter(
            (transaction) => transaction.type === type
          )
        : userTransactions;

    return NextResponse.json(
      { transactions },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET TRANSACTIONS ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil transaksi" },
      { status: 500 }
    );
  }
}