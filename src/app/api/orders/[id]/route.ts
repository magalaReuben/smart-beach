import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import sqlite from "@/lib/sqlite";
import { UpdateOrderBody } from "@/schemas/order.schema";

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticate();
    await sqlite.initDatabase();

    const { id } = await params;
    const orderId = Number(id);
    if (!orderId) {
      return Response.json({ message: "Invalid order id" }, { status: 400 });
    }

    const order = sqlite.getOrderById(orderId);
    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    return Response.json({ data: order, message: "OK" });
  } catch (err) {
    console.error("GET /api/orders/[id] error", err);
    const status = (err as any)?.status || 500;
    const message = (err as any)?.message || "Internal error";
    return Response.json({ message }, { status });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    let body: any = null;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.warn("Failed to parse JSON body for /api/orders/[id]", parseErr);
    }

    const user = await authenticate();
    await sqlite.initDatabase();

    const { id } = await params;
    const orderId = Number(id);
    if (!orderId) {
      return Response.json({ message: "Invalid order id" }, { status: 400 });
    }

    const parsed = UpdateOrderBody.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Invalid request body", errors: parsed.error.flatten() }, { status: 400 });
    }

    const updated = sqlite.updateOrder(orderId, parsed.data);
    if (!updated) {
      return Response.json({ message: "Unable to update order" }, { status: 500 });
    }

    return Response.json({ data: updated, message: "Updated" });
  } catch (err) {
    console.error("PUT /api/orders/[id] error", err);
    const status = (err as any)?.status || 500;
    const message = (err as any)?.message || "Internal error";
    return Response.json({ message }, { status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticate();
    await sqlite.initDatabase();

    const { id } = await params;
    const orderId = Number(id);
    if (!orderId) {
      return Response.json({ message: "Invalid order id" }, { status: 400 });
    }

    const deleted = sqlite.deleteOrder(orderId);
    if (!deleted) {
      return Response.json({ message: "Unable to delete order" }, { status: 500 });
    }

    return Response.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/orders/[id] error", err);
    const status = (err as any)?.status || 500;
    const message = (err as any)?.message || "Internal error";
    return Response.json({ message }, { status });
  }
}
