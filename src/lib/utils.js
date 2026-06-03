"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatusIcon = exports.formatDateTimeToTimeString = exports.formatDateTimeToLocaleString = exports.simpleMatchText = exports.decodeToken = exports.getTableLink = exports.getVietnameseTableStatus = exports.getVietnameseOrderStatus = exports.getVietnameseDishStatus = exports.formatCurrency = exports.checkAndRefreshToken = exports.removeTokensFromLocalStorage = exports.setRefreshTokenToLocalStorage = exports.setAccessTokenToLocalStorage = exports.getRefreshTokenFromLocalStorage = exports.getAccessTokenFromLocalStorage = exports.handleErrorApi = void 0;
exports.cn = cn;
exports.removeAccents = removeAccents;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
var http_1 = require("./http");
var sonner_1 = require("sonner");
var jsonwebtoken_1 = require("jsonwebtoken");
var auth_1 = require("@/apis/auth");
var type_1 = require("@/constants/type");
var config_1 = require("@/config");
var guest_1 = require("@/apis/guest");
var date_fns_1 = require("date-fns");
var lucide_react_1 = require("lucide-react");
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
var handleErrorApi = function (_a) {
    var _b, _c;
    var error = _a.error, setError = _a.setError;
    if (error instanceof http_1.EntityError && setError) {
        error.payload.errors.forEach(function (item) {
            setError(item.field, {
                type: "server",
                message: item.message,
            });
        });
    }
    else {
        (0, sonner_1.toast)((_c = (_b = error === null || error === void 0 ? void 0 : error.payload) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Error is not known");
    }
};
exports.handleErrorApi = handleErrorApi;
var isBrowser = typeof window !== "undefined";
var getAccessTokenFromLocalStorage = function () {
    return isBrowser ? localStorage.getItem("accessToken") : null;
};
exports.getAccessTokenFromLocalStorage = getAccessTokenFromLocalStorage;
var getRefreshTokenFromLocalStorage = function () {
    return isBrowser ? localStorage.getItem("refreshToken") : null;
};
exports.getRefreshTokenFromLocalStorage = getRefreshTokenFromLocalStorage;
var setAccessTokenToLocalStorage = function (value) {
    return isBrowser ? localStorage.setItem("accessToken", value) : null;
};
exports.setAccessTokenToLocalStorage = setAccessTokenToLocalStorage;
var setRefreshTokenToLocalStorage = function (value) {
    return isBrowser ? localStorage.setItem("refreshToken", value) : null;
};
exports.setRefreshTokenToLocalStorage = setRefreshTokenToLocalStorage;
var removeTokensFromLocalStorage = function () {
    isBrowser && localStorage.removeItem("accessToken");
    isBrowser && localStorage.removeItem("refreshToken");
};
exports.removeTokensFromLocalStorage = removeTokensFromLocalStorage;
var checkAndRefreshToken = function (param) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, refreshToken, decodeAccessToken, decodeRefreshToken, now, role, result, _a, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                accessToken = (0, exports.getAccessTokenFromLocalStorage)();
                refreshToken = (0, exports.getRefreshTokenFromLocalStorage)();
                if (!accessToken || !refreshToken)
                    return [2 /*return*/];
                decodeAccessToken = (0, exports.decodeToken)(accessToken);
                decodeRefreshToken = (0, exports.decodeToken)(refreshToken);
                now = new Date().getTime() / 1000 - 1;
                //refreshToken is expire then logout
                if (decodeRefreshToken.exp <= now) {
                    (0, exports.removeTokensFromLocalStorage)();
                    return [2 /*return*/, (param === null || param === void 0 ? void 0 : param.onError) && param.onError()];
                }
                if (!(decodeAccessToken.exp - now <
                    (decodeAccessToken.exp - decodeAccessToken.iat) / 3)) return [3 /*break*/, 7];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 6, , 7]);
                role = decodeRefreshToken.role;
                if (!(role === type_1.Role.Guest)) return [3 /*break*/, 3];
                return [4 /*yield*/, guest_1.default.refreshToken()];
            case 2:
                _a = _b.sent();
                return [3 /*break*/, 5];
            case 3: return [4 /*yield*/, auth_1.default.refreshToken()];
            case 4:
                _a = _b.sent();
                _b.label = 5;
            case 5:
                result = _a;
                // console.log("####", result.payload.data.accessToken);
                (0, exports.setAccessTokenToLocalStorage)(result.payload.data.accessToken);
                (0, exports.setRefreshTokenToLocalStorage)(result.payload.data.refreshToken);
                (param === null || param === void 0 ? void 0 : param.onSuccess) && param.onSuccess();
                return [3 /*break*/, 7];
            case 6:
                error_1 = _b.sent();
                (param === null || param === void 0 ? void 0 : param.onError) && param.onError();
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.checkAndRefreshToken = checkAndRefreshToken;
var formatCurrency = function (number) {
    return new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
    }).format(number);
};
exports.formatCurrency = formatCurrency;
var getVietnameseDishStatus = function (status) {
    switch (status) {
        case type_1.DishStatus.Available:
            return "Available";
        case type_1.DishStatus.Unavailable:
            return "Unavailable";
        default:
            return "Hidden";
    }
};
exports.getVietnameseDishStatus = getVietnameseDishStatus;
var getVietnameseOrderStatus = function (status) {
    switch (status) {
        case type_1.OrderStatus.Delivered:
            return "Delivered";
        case type_1.OrderStatus.Paid:
            return "Paid";
        case type_1.OrderStatus.Pending:
            return "Pending";
        case type_1.OrderStatus.Processing:
            return "Processing";
        default:
            return "Rejected";
    }
};
exports.getVietnameseOrderStatus = getVietnameseOrderStatus;
var getVietnameseTableStatus = function (status) {
    switch (status) {
        case type_1.TableStatus.Available:
            return "Available";
        case type_1.TableStatus.Reserved:
            return "Reserved";
        default:
            return "Hidden";
    }
};
exports.getVietnameseTableStatus = getVietnameseTableStatus;
var getTableLink = function (_a) {
    var token = _a.token, tableNumber = _a.tableNumber;
    return (config_1.default.NEXT_PUBLIC_URL + "/tables/" + tableNumber + "?token=" + token);
};
exports.getTableLink = getTableLink;
var decodeToken = function (token) {
    return jsonwebtoken_1.default.decode(token);
};
exports.decodeToken = decodeToken;
function removeAccents(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}
var simpleMatchText = function (fullText, matchText) {
    return removeAccents(fullText.toLowerCase()).includes(removeAccents(matchText.trim().toLowerCase()));
};
exports.simpleMatchText = simpleMatchText;
var formatDateTimeToLocaleString = function (date) {
    return (0, date_fns_1.format)(date instanceof Date ? date : new Date(date), "HH:mm:ss dd/MM/yyyy");
};
exports.formatDateTimeToLocaleString = formatDateTimeToLocaleString;
var formatDateTimeToTimeString = function (date) {
    return (0, date_fns_1.format)(date instanceof Date ? date : new Date(date), "HH:mm:ss");
};
exports.formatDateTimeToTimeString = formatDateTimeToTimeString;
exports.OrderStatusIcon = (_a = {},
    _a[type_1.OrderStatus.Pending] = lucide_react_1.Loader,
    _a[type_1.OrderStatus.Processing] = lucide_react_1.CookingPot,
    _a[type_1.OrderStatus.Rejected] = lucide_react_1.BookX,
    _a[type_1.OrderStatus.Delivered] = lucide_react_1.Truck,
    _a[type_1.OrderStatus.Paid] = lucide_react_1.HandCoins,
    _a);
