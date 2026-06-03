"use client";
import { forwardRef } from "react";
import { formatCurrency } from "@/lib/utils";

interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderReceiptData {
  id: number;
  waiterName: string;
  servingPlace: string;
  customerName: string;
  tableNumber?: number;
  items: ReceiptItem[];
  total: number;
  createdAt: Date;
}

interface OrderReceiptProps {
  data: OrderReceiptData;
}

const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(
  ({ data }, ref) => {
    const formatDateTime = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date);
    };

    return (
      <div
        ref={ref}
        className="receipt-content p-6 bg-white text-black font-mono text-sm"
        style={{
          width: "80mm",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div className="text-center border-b border-black pb-3 mb-3">
          <h1 className="text-base font-bold">SMART BEACH</h1>
          <p className="text-xs uppercase tracking-[0.24em]">Restaurant Order</p>
          <p className="text-xs">Receipt #{data.id}</p>
          <p className="text-xs">{formatDateTime(data.createdAt)}</p>
        </div>

        {/* Order Details */}
        <div className="border-b border-black pb-3 mb-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Waiter:</span>
            <span className="font-bold">{data.waiterName}</span>
          </div>
          <div className="flex justify-between">
            <span>Location:</span>
            <span className="font-bold">{data.servingPlace}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="font-bold">{data.customerName}</span>
          </div>
          {data.tableNumber && (
            <div className="flex justify-between">
              <span>Table:</span>
              <span className="font-bold">#{data.tableNumber}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-3">
          <div className="border-b border-black pb-2 mb-2">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span>Item</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Total</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {data.items.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <span className="flex-1">{item.name}</span>
                  <span className="w-8 text-right">{item.quantity}</span>
                  <span className="w-16 text-right">
                    {formatCurrency(item.price)}
                  </span>
                  <span className="w-16 text-right font-bold">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-b border-black py-2 mb-3">
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs space-y-1">
          <p>Thank you for your order!</p>
          <p>Please keep this receipt</p>
          <div className="mt-4 flex justify-center gap-1">
            <span>★</span>
            <span>★</span>
            <span>★</span>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .receipt-content {
              width: 80mm;
              margin: 0;
              padding: 10mm;
              box-shadow: none;
            }
            * {
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

OrderReceipt.displayName = "OrderReceipt";

export default OrderReceipt;
