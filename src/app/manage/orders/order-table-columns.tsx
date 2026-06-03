"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GetOrdersResType } from "@/schemas/order.schema";
import { useContext } from "react";
import {
  formatCurrency,
  formatDateTimeToLocaleString,
  getVietnameseOrderStatus,
  simpleMatchText,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";import { Role } from '@/constants/type'
import { useAppContext } from '@/components/app-provider'
type OrderStatusType = (typeof OrderStatusValues)[number];

const getStatusPillClass = (status: OrderStatusType) => {
  switch (status) {
    case OrderStatus.Pending:
      return "bg-yellow-100 text-yellow-800 border-yellow-100";
    case OrderStatus.Processing:
      return "bg-sky-100 text-sky-800 border-sky-100";
    case OrderStatus.Delivered:
      return "bg-emerald-100 text-emerald-800 border-emerald-100";
    case OrderStatus.Paid:
      return "bg-violet-100 text-violet-800 border-violet-100";
    case OrderStatus.Rejected:
      return "bg-red-100 text-red-800 border-red-100";
    default:
      return "bg-slate-100 text-slate-800 border-slate-100";
  }
};
import { OrderStatus, OrderStatusValues } from "@/constants/type";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OrderTableContext } from "@/app/manage/orders/order-table";
import OrderGuestDetail from "@/app/manage/orders/order-guest-detail";

type OrderItem = GetOrdersResType["data"][0];
const orderTableColumns: ColumnDef<OrderItem>[] = [
  {
    accessorKey: "tableNumber",
    header: () => <div className="font-semibold">Table</div>,
    cell: ({ row }) => {
      const tableNumber = row.getValue("tableNumber") as number | null | undefined;
      return <div>{tableNumber === null || tableNumber === undefined || tableNumber === 0 ? "None" : tableNumber}</div>;
    },
    filterFn: (row, columnId, filterValue: string) => {
      if (filterValue === undefined) return true;
      return simpleMatchText(
        String(row.getValue(columnId)),
        String(filterValue)
      );
    },
  },
  {
    id: "location",
    header: () => <div className="font-semibold">Location</div>,
    cell: ({ row }) => {
      return <div>{row.original.servingPlace?.name ?? "None"}</div>;
    },
    filterFn: (row, columnId, filterValue: string) => {
      if (filterValue === undefined) return true;
      return simpleMatchText(
        row.original.servingPlace?.name ?? "None",
        String(filterValue)
      );
    },
  },
  {
    id: "guestName",
    header: () => <div className="font-semibold">Customer</div>,
    cell: function Cell({ row }) {
      const { orderObjectByGuestId } = useContext(OrderTableContext);
      const guest = row.original.guest;
      return (
        <div>
          {!guest && (
            <div>
              <span>Deleted</span>
            </div>
          )}
          {guest && (
            <Popover>
              <PopoverTrigger>
                <div>
                  <span>{guest.name}</span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] sm:w-[440px]">
                <OrderGuestDetail
                  guest={guest}
                  orders={orderObjectByGuestId[guest.id]}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      );
    },
    filterFn: (row, columnId, filterValue: string) => {
      if (filterValue === undefined) return true;
        return simpleMatchText(
          row.original.guest?.name ?? "Deleted",
          String(filterValue)
        );
    },
  },
  {
    id: "dishName",
    header: () => <div className="font-semibold">Dish</div>,
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span>{row.original.dishSnapshot.name}</span>
          <Badge className="px-1" variant={"secondary"}>
            x{row.original.quantity}
          </Badge>
        </div>
        <span className="italic">
          {formatCurrency(
            row.original.dishSnapshot.price * row.original.quantity
          )}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="font-semibold">Status</div>,
    cell: function Cell({ row }) {
      const { changeStatus, updatingOrderId } = useContext(OrderTableContext);
      const { role } = useAppContext();
      const isEmployeeOrWaiter = role === Role.Employee || role === Role.Waiter;
      const isLoading = updatingOrderId === row.original.id;
      const changeOrderStatus = async (
        status: (typeof OrderStatusValues)[number]
      ) => {
        changeStatus({
          orderId: row.original.id,
          dishId: row.original.dishSnapshot.dishId!,
          status: status,
          quantity: row.original.quantity,
        });
      };
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={getStatusPillClass(row.original.status)}>
            {getVietnameseOrderStatus(row.original.status)}
          </Badge>
          {!isEmployeeOrWaiter && (
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(value: (typeof OrderStatusValues)[number]) => {
                  changeOrderStatus(value);
                }}
                defaultValue={OrderStatus.Pending}
                value={row.getValue("status")}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {OrderStatusValues.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getVietnameseOrderStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoading && (
                <div className="h-4 w-4 rounded-full border border-current border-t-transparent animate-spin" />
              )}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "orderHandlerName",
    header: () => <div className="font-semibold">Handler</div>,
    cell: ({ row }) => <div>{row.original.orderHandler?.name ?? ""}</div>,
  },
  {
    accessorKey: "createdAt",
    header: () => <div>Created/Updated</div>,
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      const updatedAt = row.original.updatedAt as unknown as string;
      const createdText = formatDateTimeToLocaleString(createdAt);
      const updatedText = formatDateTimeToLocaleString(updatedAt);
      const sameTimestamp = createdText === updatedText;
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-4">{createdText}</div>
          {!sameTimestamp && (
            <div className="flex items-center space-x-4">{updatedText}</div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: function Actions({ row }) {
      const { setOrderIdEdit, deleteOrder } = useContext(OrderTableContext);
      const { role } = useAppContext();
      const isEmployeeOrWaiter = role === Role.Employee || role === Role.Waiter;
      const openEditOrder = () => {
        setOrderIdEdit(row.original.id);
      };
      const openDeleteOrderDialog = () => {
        deleteOrder(row.original.id);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openEditOrder}>Sửa</DropdownMenuItem>
            {!isEmployeeOrWaiter && (
              <DropdownMenuItem onClick={openDeleteOrderDialog} className="text-destructive">
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default orderTableColumns;
