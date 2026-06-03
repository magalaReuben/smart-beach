import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import sqlite from "@/lib/sqlite";

async function authenticate() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) {
    const authHeader = (await headers()).get("authorization");
    accessToken = authHeader?.split(" ")[1];
  }

  if (!accessToken) {
    const error: any = new Error("Not authenticated");
    error.status = 401;
    throw error;
  }

  const secret = process.env.JWT_SECRET || "dev-secret";
  try {
    return jwt.verify(accessToken, secret) as any;
  } catch (err) {
    const error: any = new Error("Invalid token");
    error.status = 401;
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    let body: any = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch (parseErr) {
      console.warn("Failed to parse JSON body for /api/orders/pay", parseErr);
    }

    await authenticate();
    await sqlite.initDatabase();

    const guestId = body?.guestId ? Number(body.guestId) : null;
    if (!guestId) {
      return Response.json({ message: "guestId is required" }, { status: 400 });
    }

    const result = sqlite.payGuestOrders(guestId);
    return Response.json({ data: result, message: "Paid" });
  } catch (err) {
    console.error("POST /api/orders/pay error", err);
    const status = (err as any)?.status || 500;
    const message = (err as any)?.message || "Internal error";
    return Response.json({ message }, { status });
  }
}
