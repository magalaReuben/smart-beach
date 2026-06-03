"use client";

import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/constants/type";
import socket from "@/lib/socket";
import { formatCurrency, getVietnameseOrderStatus } from "@/lib/utils";
import { useGuestGetOrderListMutation } from "@/queries/useGuest";
import {
  PayGuestOrdersResType,
  UpdateOrderResType,
  GetOrdersResType,
} from "@/schemas/order.schema";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

export default function OrdersCart() {
  const { refetch, data } = useGuestGetOrderListMutation();
  const orders = useMemo<NonNullable<GetOrdersResType["data"]>>(
    () => data?.payload.data ?? [],
    [data]
  );

  const { waitingForPaying, paid } = useMemo(() => {
    return orders.reduce(
      (result, order) => {
        if (
          order.status === OrderStatus.Delivered ||
          order.status === OrderStatus.Processing ||
          order.status === OrderStatus.Pending
        ) {
          return {
            ...result,
            waitingForPaying: {
              price:
                result.waitingForPaying.price +
                order.dishSnapshot.price * order.quantity,
              quantity: result.waitingForPaying.quantity + order.quantity,
            },
          };
        }
        if (order.status === OrderStatus.Paid) {
          return {
            ...result,
            paid: {
              price:
                result.paid.price + order.dishSnapshot.price * order.quantity,
              quantity: result.paid.quantity + order.quantity,
            },
          };
        }
        return result;
      },
      {
        waitingForPaying: {
          price: 0,
          quantity: 0,
        },
        paid: {
          price: 0,
          quantity: 0,
        },
      } as {
        waitingForPaying: { price: number; quantity: number };
        paid: { price: number; quantity: number };
      }
    );
  }, [orders]);

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      console.log(socket.id);
    }

    function onDisconnect() {
      console.log("disconnect");
    }

    function onUpdateOrder(data: UpdateOrderResType["data"]) {
      console.log("update-order", data);
      const {
        dishSnapshot: { name },
        quantity,
      } = data;
      toast(
        `Dish ${name} (Qty: ${quantity}) was updated to status "${getVietnameseOrderStatus(
          data.status
        )}"`
      );
      refetch();
    }

    function onPayment(data: PayGuestOrdersResType["data"]) {
      const { guest } = data[0];
      toast(
        `${guest?.name} at table ${guest?.tableNumber} paid ${data.length} orders successfully`
      );
      refetch();
    }

    socket.on("update-order", onUpdateOrder);
    socket.on("payment", onPayment);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("update-order", onUpdateOrder);
      socket.off("payment", onPayment);
    };
  }, [refetch]);
  return (
    <div>
      {orders.map((order) => (
        <div key={order.dishSnapshot.id} className="flex gap-4 mt-8">
          <div className="flex-shrink-0 relative">
            <span className="absolute inset-0 flex items-center justify-center text-md font-bold">
              {order.dishSnapshot.status === "Unavailable" ? "Out of stock" : ""}
            </span>
            <Image
              src={order.dishSnapshot.image}
              alt={order.dishSnapshot.name}
              height={100}
              width={100}
              quality={100}
              className={`object-cover w-[80px] h-[80px] rounded-md ${
                order.dishSnapshot.status === "Unavailable" ? "opacity-40" : ""
              }`}
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm">{order.dishSnapshot.name}</h3>
            <div className="text-xs font-semibold">
              {formatCurrency(order.dishSnapshot.price)} x
              <Badge className="px-1.5 ml-2"> {order.quantity}</Badge>
            </div>
          </div>
          <div className="flex-shrink-0 ml-auto flex justify-center items-center">
            <Badge variant={"outline"}>
              {getVietnameseOrderStatus(order.status)}
            </Badge>
          </div>
        </div>
      ))}

      {paid.quantity !== 0 && (
        <div className="sticky bottom-0 mt-8">
          <div className="w-full flex justify-between space-x-4 text-lg font-semibold">
            <span>Paid · {paid.quantity} items</span>
            <span>{formatCurrency(paid.price)}</span>
          </div>
        </div>
      )}
      <div className="sticky bottom-0 mt-4">
        <div className="w-full flex space-x-4 justify-between text-lg font-semibold">
          <span>Unpaid · {waitingForPaying.quantity} items</span>
          <span>{formatCurrency(waitingForPaying.price)}</span>
        </div>
      </div>
    </div>
  );
}
