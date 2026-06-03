import OrdersCart from "@/app/guest/orders/orders-cart";

export default function OrdersPage() {
  return (
    <div className="w-full max-w-[400px] px-4 mx-auto space-y-4">
      <h1 className="text-center text-xl font-bold">Orders</h1>
      <OrdersCart />
    </div>
  );
}
