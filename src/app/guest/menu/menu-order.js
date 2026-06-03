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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MenuOrder;
var image_1 = require("next/image");
var button_1 = require("@/components/ui/button");
var useDish_1 = require("@/queries/useDish");
var quantity_1 = require("./quantity");
var react_1 = require("react");
var useGuest_1 = require("@/queries/useGuest");
var navigation_1 = require("next/navigation");
var utils_1 = require("@/lib/utils");
function MenuOrder() {
    var _this = this;
    var _a;
    var listData = (0, useDish_1.useDishListQuery)().data;
    var dishes = ((_a = listData === null || listData === void 0 ? void 0 : listData.payload.data) !== null && _a !== void 0 ? _a : []);
    var mutateAsync = (0, useGuest_1.useGuestOrderMutation)().mutateAsync;
    var _b = (0, react_1.useState)([]), orders = _b[0], setOrders = _b[1];
    var totalPrice = dishes.reduce(function (result, dish) {
        var order = orders.find(function (order) { return order.dishId === dish.id; });
        if (!order)
            return result;
        return result + order.quantity * dish.price;
    }, 0);
    var router = (0, navigation_1.useRouter)();
    var handleQuantityChange = function (dishId, quantity) {
        setOrders(function (prev) {
            if (quantity === 0) {
                return prev.filter(function (order) { return order.dishId !== dishId; });
            }
            var index = prev.findIndex(function (order) { return order.dishId === dishId; });
            if (index === -1) {
                return __spreadArray(__spreadArray([], prev, true), [{ dishId: dishId, quantity: quantity }], false);
            }
            var newOrders = __spreadArray([], prev, true);
            newOrders[index] = __assign(__assign({}, newOrders[index]), { quantity: quantity });
            return newOrders;
        });
    };
    var handleOrder = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, mutateAsync(orders)];
                case 1:
                    _a.sent();
                    router.push("/guest/orders");
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    (0, utils_1.handleErrorApi)({
                        error: error_1,
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (<>
      {dishes
            .filter(function (item) { return item.status !== "Hidden"; })
            .map(function (dish) {
            var _a, _b;
            return (<div key={dish.id} className={"flex gap-4 ".concat(dish.status === "Unavailable"
                    ? "pointer-events-none opacity-80"
                    : "")}>
            <div className="flex-shrink-0 relative">
              <span className="absolute inset-0 flex items-center justify-center text-md font-bold">
                {dish.status === "Unavailable" ? "Out of stock" : ""}
              </span>
              <image_1.default src={dish.image} alt={dish.name} height={100} width={100} quality={100} className={"object-cover w-[80px] h-[80px] rounded-md ".concat(dish.status === "Unavailable" ? "opacity-40" : "")}/>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm">{dish.name}</h3>
              <p className="text-xs">{dish.description}</p>
              <p className="text-xs font-semibold">
                {(0, utils_1.formatCurrency)(dish.price)}
              </p>
            </div>
            <div className="flex-shrink-0 ml-auto flex justify-center items-center">
              <quantity_1.default onChange={function (value) { return handleQuantityChange(dish.id, value); }} value={(_b = (_a = orders.find(function (order) { return order.dishId === dish.id; })) === null || _a === void 0 ? void 0 : _a.quantity) !== null && _b !== void 0 ? _b : 0}/>
            </div>
          </div>);
        })}
      <div className="sticky bottom-0">
        <button_1.Button className="w-full justify-between" onClick={handleOrder} disabled={orders.length === 0}>
          <span>Place order · {orders.length} items</span>
          <span>{totalPrice && (0, utils_1.formatCurrency)(totalPrice)}</span>
        </button_1.Button>
      </div>
    </>);
}
