"use client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChefHat } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { DishListResType } from "@/schemas/dish.schema";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateOrdersBodyType } from "@/schemas/order.schema";
import Quantity from "@/app/guest/menu/quantity";
import { cn, formatCurrency, handleErrorApi } from "@/lib/utils";
import { DishStatus } from "@/constants/type";
import { useDishListQuery } from "@/queries/useDish";
import { DishesDialog } from "@/app/manage/orders/dishes-dialog";
import { useCreateOrderMutation } from "@/queries/useOrder";
import { useServingPlacesQuery } from "@/queries/useServingPlaces";
import { useAccountProfile, useCreateGuestMutation } from "@/queries/useAccount";
import { toast } from "sonner";
import OrderReceipt from "@/app/manage/orders/order-receipt";

// Form schema for make order
const MakeOrderSchema = z.object({
  customerName: z.string().trim().optional(),
  servingPlaceId: z.string().min(1, "Serving place is required"),
  tableNumber: z.coerce.number().int().positive().optional(),
});

type MakeOrderFormType = z.TypeOf<typeof MakeOrderSchema>;

interface OrderToReceipt {
  id: number;
  waiterName: string;
  servingPlace: string;
  customerName: string;
  tableNumber?: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
  createdAt: Date;
}

export default function MakeOrder() {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<CreateOrdersBodyType["orders"]>([]);
  const [orderToReceipt, setOrderToReceipt] = useState<OrderToReceipt | null>(
    null
  );
  const receiptRef = useRef<any>(null);

  // Fetch data
  const { data: accountData } = useAccountProfile();
  const { data: dishData } = useDishListQuery();
  const { data: servingPlacesData } = useServingPlacesQuery();

  const dishes = useMemo(
    () => (dishData?.payload.data ?? []) as DishListResType["data"],
    [dishData]
  );

  const waiterName = useMemo(
    () => accountData?.payload.data.name ?? "Unknown",
    [accountData]
  );

  const servingPlaces = useMemo(() => servingPlacesData ?? [], [servingPlacesData]);

  const totalPrice = useMemo(() => {
    return dishes.reduce((result, dish) => {
      const order = orders.find((order) => order.dishId === dish.id);
      if (!order) return result;
      return result + order.quantity * dish.price;
    }, 0);
  }, [dishes, orders]);

  const createOrderMutation = useCreateOrderMutation();
  const createGuestMutation = useCreateGuestMutation();

  const form = useForm<MakeOrderFormType>({
    resolver: zodResolver(MakeOrderSchema),
    defaultValues: {
      customerName: "",
      servingPlaceId: "",
      tableNumber: undefined,
    },
  });

  const customerName = form.watch("customerName");
  const servingPlaceId = form.watch("servingPlaceId");

  const handleQuantityChange = (dishId: number, quantity: number) => {
    setOrders((prevOrders) => {
      if (quantity === 0) {
        return prevOrders.filter((order) => order.dishId !== dishId);
      }
      const index = prevOrders.findIndex((order) => order.dishId === dishId);
      if (index === -1) {
        return [...prevOrders, { dishId, quantity }];
      }
      const newOrders = [...prevOrders];
      newOrders[index] = { ...newOrders[index], quantity };
      return newOrders;
    });
  };

  const handleAddDish = (dish: DishListResType["data"][0]) => {
    if (!dish) return;
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.dishId === dish.id);
      if (idx === -1) return [...prev, { dishId: dish.id, quantity: 1 }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
      return copy;
    });
  };

  const handleOrder = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid || orders.length === 0) {
      if (orders.length === 0) {
        toast.error("Please select at least one dish");
      }
      return;
    }

    try {
      const tableNumber = form.getValues("tableNumber");
      
      // Create guest for the order (use default name if not provided)
      const nameToUse =
        customerName && customerName.trim().length >= 2
          ? customerName.trim()
          : "Guest";
      const guestRes = await createGuestMutation.mutateAsync({
        name: nameToUse,
        tableNumber: tableNumber ?? null,
      });
      
      const guestId = guestRes.payload.data.id;

      // Create order
      const orderRes = await createOrderMutation.mutateAsync({
        guestId,
        servingPlaceId: servingPlaceId ? Number(servingPlaceId) : undefined,
        orders,
      });

      // Prepare receipt data
      const selectedPlace = servingPlaces.find(
        (p) => p.id === Number(servingPlaceId)
      );

      const receiptData: OrderToReceipt = {
        id: orderRes.payload.data[0]?.id || 0,
        waiterName,
        servingPlace: selectedPlace?.name || "Unknown",
        customerName: customerName || "Guest",
        tableNumber: tableNumber,
        items: orders
          .map((order) => {
            const dish = dishes.find((d) => d.id === order.dishId);
            return {
              name: dish?.name || "Unknown",
              price: dish?.price || 0,
              quantity: order.quantity,
              subtotal: (dish?.price || 0) * order.quantity,
            };
          })
          .filter((item) => item.name !== "Unknown"),
        total: totalPrice,
        createdAt: new Date(),
      };

      setOrderToReceipt(receiptData);
      
      // Show success toast
      toast.success("Order created successfully! Receipt ready for printing.");
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      });
    }
  };

  const reset = () => {
    form.reset();
    setOrders([]);
    setOrderToReceipt(null);
    setOpen(false);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (orderToReceipt) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-screen overflow-auto">
          <DialogHeader>
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <OrderReceipt ref={receiptRef} data={orderToReceipt} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => reset()}>
              Close
            </Button>
            <Button onClick={handlePrint}>Print Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      onOpenChange={(value) => {
        if (!value) {
          reset();
        }
        setOpen(value);
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1">
          <ChefHat className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Make order
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-screen overflow-auto">
        <DialogHeader>
          <DialogTitle>Make Order</DialogTitle>
        </DialogHeader>

        {/* Waiter Info */}
        <div className="grid grid-cols-4 items-center justify-items-start gap-4">
          <Label>Waiter</Label>
          <div className="col-span-3 w-full text-sm font-medium">
            {waiterName}
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            noValidate
            className="grid auto-rows-max items-start gap-4"
            id="make-order-form"
          >
            <FormField
              control={form.control}
              name="servingPlaceId"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                    <Label htmlFor="servingPlaceId">Location</Label>
                    <div className="col-span-3 w-full space-y-2">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="servingPlaceId">
                          <SelectValue placeholder="Select serving place" />
                        </SelectTrigger>
                        <SelectContent>
                          {servingPlaces.map((place) => (
                            <SelectItem key={place.id} value={place.id.toString()}>
                              {place.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <div className="col-span-3 w-full space-y-2">
                      <Input
                        id="customerName"
                        className="w-full"
                        placeholder="Enter customer name"
                        {...field}
                      />
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tableNumber"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                    <Label htmlFor="tableNumber">Table Number (Optional)</Label>
                    <div className="col-span-3 w-full space-y-2">
                      <Input
                        id="tableNumber"
                        className="w-full"
                        type="number"
                        placeholder="Enter table number"
                        {...field}
                      />
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* Dishes */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-4">Select Dishes</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            <div className="flex items-center gap-4">
              <DishesDialog onChoose={handleAddDish} triggerLabel="Select Dishes" />
              <div className="text-sm text-muted-foreground">{orders.length} items selected</div>
            </div>

            <div className="space-y-3 mt-4">
              {orders.map((order) => {
                const dish = dishes.find((d) => d.id === order.dishId);
                if (!dish) return null;
                return (
                  <div key={order.dishId} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{dish.name}</div>
                        <div className="text-sm font-semibold">{formatCurrency(dish.price)}</div>
                      </div>
                      <div className="mt-1 flex items-center gap-4">
                        <Quantity value={order.quantity} onChange={(v) => handleQuantityChange(order.dishId, v)} />
                        <Button variant="ghost" size="sm" onClick={() => handleQuantityChange(order.dishId, 0)}>Remove</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full justify-between"
            onClick={handleOrder}
            disabled={orders.length === 0}
          >
            <span>Create Order · {orders.length} items</span>
            <span>{formatCurrency(totalPrice)}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
