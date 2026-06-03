"use client";
import { Button } from "@/components/ui/button";
import Quantity from "./quantity";
import { useState } from "react";
import { GuestCreateOrdersBodyType } from "@/schemas/guest.schema";
import { useGuestOrderMutation } from "@/queries/useGuest";
import { useRouter } from "next/navigation";
import { formatCurrency, handleErrorApi } from "@/lib/utils";
import MENU_ITEMS from '@/data/menu-items'

type MenuItem = {
  id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  status?: "Available" | "Unavailable" | "Hidden";
};

const MENU: MenuItem[] = MENU_ITEMS.map((i) => ({
  id: i.id,
  category: i.category,
  name: i.name,
  description: i.description,
  price: i.price,
  status: 'Available'
}))

const categories = ["All", ...Array.from(new Set(MENU.map((item) => item.category)))];

export default function MenuOrder() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { mutateAsync } = useGuestOrderMutation();
  const [orders, setOrders] = useState<GuestCreateOrdersBodyType>([]);
  const router = useRouter();

  const filteredItems = MENU.filter(
    (item) =>
      item.status !== "Hidden" &&
      (selectedCategory === "All" || item.category === selectedCategory)
  );

  const totalPrice = filteredItems.reduce((result, dish) => {
    const order = orders.find((order) => order.dishId === dish.id);
    if (!order) return result;
    return result + order.quantity * dish.price;
  }, 0);

  const handleQuantityChange = (dishId: number, quantity: number) => {
    setOrders((prev) => {
      if (quantity === 0) {
        return prev.filter((order) => order.dishId !== dishId);
      }
      const index = prev.findIndex((order) => order.dishId === dishId);
      if (index === -1) {
        return [...prev, { dishId, quantity }];
      }
      const newOrders = [...prev];
      newOrders[index] = { ...newOrders[index], quantity };
      return newOrders;
    });
  };

  const handleOrder = async () => {
    try {
      await mutateAsync(orders);
      router.push(`/guest/orders`);
    } catch (error) {
      handleErrorApi({
        error,
      });
    }
  };

  return (
    <>
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm font-medium">Categories</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? "secondary" : "outline"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground shadow-sm dark:bg-slate-900">
          No menu items found for this category.
        </div>
      ) : (
        filteredItems.map((dish) => (
          <div
            key={dish.id}
            className={`flex gap-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${
              dish.status === "Unavailable" ? "pointer-events-none opacity-80" : ""
            }`}
          >
            <div className="flex-shrink-0 flex h-[80px] w-[80px] items-center justify-center rounded-md bg-slate-100 text-center text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {dish.category}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold">{dish.name}</h3>
                  <p className="text-xs text-muted-foreground">{dish.category}</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(dish.price)}</p>
              </div>
              <p className="text-sm text-muted-foreground">{dish.description}</p>
            </div>
            <div className="flex-shrink-0 self-center">
              <Quantity
                onChange={(value) => handleQuantityChange(dish.id, value)}
                value={orders.find((order) => order.dishId === dish.id)?.quantity ?? 0}
              />
            </div>
          </div>
        ))
      )}

      <div className="sticky bottom-0 mt-4">
        <Button
          className="w-full justify-between"
          onClick={handleOrder}
          disabled={orders.length === 0}
        >
          <span>Place order · {orders.length} items</span>
          <span>{totalPrice && formatCurrency(totalPrice)}</span>
        </Button>
      </div>
    </>
  );
}
