"use client";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OrdersCart;
var badge_1 = require("@/components/ui/badge");
var type_1 = require("@/constants/type");
var socket_1 = require("@/lib/socket");
var utils_1 = require("@/lib/utils");
var useGuest_1 = require("@/queries/useGuest");
var image_1 = require("next/image");
var react_1 = require("react");
var sonner_1 = require("sonner");
function OrdersCart() {
    var _a = (0, useGuest_1.useGuestGetOrderListMutation)(), refetch = _a.refetch, data = _a.data;
    var orders = (0, react_1.useMemo)(function () { var _a; return (_a = data === null || data === void 0 ? void 0 : data.payload.data) !== null && _a !== void 0 ? _a : []; }, [data]);
    var _b = (0, react_1.useMemo)(function () {
        return orders.reduce(function (result, order) {
            if (order.status === type_1.OrderStatus.Delivered ||
                order.status === type_1.OrderStatus.Processing ||
                order.status === type_1.OrderStatus.Pending) {
                return __assign(__assign({}, result), { waitingForPaying: {
                        price: result.waitingForPaying.price +
                            order.dishSnapshot.price * order.quantity,
                        quantity: result.waitingForPaying.quantity + order.quantity,
                    } });
            }
            if (order.status === type_1.OrderStatus.Paid) {
                return __assign(__assign({}, result), { paid: {
                        price: result.paid.price + order.dishSnapshot.price * order.quantity,
                        quantity: result.paid.quantity + order.quantity,
                    } });
            }
            return result;
        }, {
            waitingForPaying: {
                price: 0,
                quantity: 0,
            },
            paid: {
                price: 0,
                quantity: 0,
            },
        });
    }, [orders]), waitingForPaying = _b.waitingForPaying, paid = _b.paid;
    (0, react_1.useEffect)(function () {
        if (socket_1.default.connected) {
            onConnect();
        }
        function onConnect() {
            console.log(socket_1.default.id);
        }
        function onDisconnect() {
            console.log("disconnect");
        }
        function onUpdateOrder(data) {
            console.log("update-order", data);
            var name = data.dishSnapshot.name, quantity = data.quantity;
            (0, sonner_1.toast)("Dish ".concat(name, " (Qty: ").concat(quantity, ") was updated to status \"").concat((0, utils_1.getVietnameseOrderStatus)(data.status), "\""));
            refetch();
        }
        function onPayment(data) {
            var guest = data[0].guest;
            (0, sonner_1.toast)("".concat(guest === null || guest === void 0 ? void 0 : guest.name, " at table ").concat(guest === null || guest === void 0 ? void 0 : guest.tableNumber, " paid ").concat(data.length, " orders successfully"));
            refetch();
        }
        socket_1.default.on("update-order", onUpdateOrder);
        socket_1.default.on("payment", onPayment);
        socket_1.default.on("connect", onConnect);
        socket_1.default.on("disconnect", onDisconnect);
        return function () {
            socket_1.default.off("connect", onConnect);
            socket_1.default.off("disconnect", onDisconnect);
            socket_1.default.off("update-order", onUpdateOrder);
            socket_1.default.off("payment", onPayment);
        };
    }, [refetch]);
    return (<div>
      {orders.map(function (order) { return (<div key={order.dishSnapshot.id} className="flex gap-4 mt-8">
          <div className="flex-shrink-0 relative">
            <span className="absolute inset-0 flex items-center justify-center text-md font-bold">
              {order.dishSnapshot.status === "Unavailable" ? "Out of stock" : ""}
            </span>
            <image_1.default src={order.dishSnapshot.image} alt={order.dishSnapshot.name} height={100} width={100} quality={100} className={"object-cover w-[80px] h-[80px] rounded-md ".concat(order.dishSnapshot.status === "Unavailable" ? "opacity-40" : "")}/>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm">{order.dishSnapshot.name}</h3>
            <div className="text-xs font-semibold">
              {(0, utils_1.formatCurrency)(order.dishSnapshot.price)} x
              <badge_1.Badge className="px-1.5 ml-2"> {order.quantity}</badge_1.Badge>
            </div>
          </div>
          <div className="flex-shrink-0 ml-auto flex justify-center items-center">
            <badge_1.Badge variant={"outline"}>
              {(0, utils_1.getVietnameseOrderStatus)(order.status)}
            </badge_1.Badge>
          </div>
        </div>); })}

      {paid.quantity !== 0 && (<div className="sticky bottom-0 mt-8">
          <div className="w-full flex justify-between space-x-4 text-lg font-semibold">
            <span>Paid · {paid.quantity} items</span>
            <span>{(0, utils_1.formatCurrency)(paid.price)}</span>
          </div>
        </div>)}
      <div className="sticky bottom-0 mt-4">
        <div className="w-full flex space-x-4 justify-between text-lg font-semibold">
          <span>Unpaid · {waitingForPaying.quantity} items</span>
          <span>{(0, utils_1.formatCurrency)(waitingForPaying.price)}</span>
        </div>
      </div>
    </div>);
}
