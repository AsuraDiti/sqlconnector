"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var mssql = require('mssql');
var mssqltransaction = (function () {
    function mssqltransaction() {
        this._begin = false;
        this._finished = false;
    }
    mssqltransaction.prototype.init = function (connection) {
        if (connection instanceof mssqlconnection)
            this._connection = connection;
    };
    mssqltransaction.prototype.getConfig = function () {
        return this._connection.getConfig();
    };
    mssqltransaction.prototype.begin = function () {
        if (this._begin)
            throw new Error('The function "begin" was already called. Create a new transaction');
        this._begin = true;
        var st = this;
        return new Promise(function (resolve, reject) {
            st._transaction = new mssql.Transaction(st._connection._dbObject);
            st._transaction.begin(function (err) {
                if (err) {
                    return reject(new Error(err));
                }
                resolve();
            });
        });
    };
    mssqltransaction.prototype.commit = function () {
        if (!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if (this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");
        this._finished = true;
        var st = this;
        return new Promise(function (resolve, reject) {
            st._transaction.commit(function (err) {
                if (err) {
                    return reject(new Error(err));
                }
                resolve();
            });
        });
    };
    mssqltransaction.prototype.rollback = function () {
        if (!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if (this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");
        this._finished = true;
        var st = this;
        return new Promise(function (resolve, reject) {
            st._transaction.rollback(function (err) {
                if (err) {
                    return reject(new Error(err));
                }
                resolve();
            });
        });
    };
    mssqltransaction.prototype.query = function (queryString, values) {
        if (!this._begin || this._finished)
            throw new Error("The transaction is not active.");
        var sc = this._connection;
        var st = this;
        return new Promise(function (resolve, reject) {
            return __awaiter(this, void 0, void 0, function () {
                var poolConnection;
                return __generator(this, function (_a) {
                    poolConnection = new mssql.Request(st._transaction);
                    sc.queryPool(poolConnection, queryString, values).then(function (queryResult) {
                        resolve(queryResult);
                    }).catch(function (error) {
                        reject(error);
                    });
                    return [2 /*return*/];
                });
            });
        });
    };
    mssqltransaction.prototype.execute = function (queryString, values) {
        return this.query(queryString, values);
    };
    return mssqltransaction;
}());
exports.mssqltransaction = mssqltransaction;
var mssqlconnection = (function () {
    function mssqlconnection() {
        this._initPromise = undefined;
        this._isReady = false;
    }
    mssqlconnection.prototype.init = function (config) {
        this.Config = config;
        var sc = this;
        this._initPromise = new Promise(function (resolve, reject) {
            sc._dbObject = new mssql.ConnectionPool({ user: config.user, password: config.password, server: config.host, database: config.database }, function (err) {
                if (err) {
                    return reject(new Error(err));
                }
                resolve(true);
            });
        });
        this._initPromise.then(function (result) { sc._isReady = result; }).catch(function (error) { });
        return this._initPromise;
    };
    mssqlconnection.prototype.getConfig = function () {
        return this.Config;
    };
    mssqlconnection.prototype.isReady = function () {
        return this._isReady;
    };
    mssqlconnection.prototype.waitForReady = function () {
        return this._initPromise;
    };
    mssqlconnection.prototype.createtransaction = function () {
        var result = new mssqltransaction();
        result.init(this);
        return result;
    };
    mssqlconnection.prototype.queryPool = function (poolConnection, queryString, values) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (values != undefined && !Array.isArray(values)) {
                            for (var _i = 0, _a = Object.keys(values); _i < _a.length; _i++) {
                                var key = _a[_i];
                                poolConnection.input(key, values[key]);
                            }
                        }
                        poolConnection.query(queryString).then(function (result) {
                            var queryResult = new index_1.sqlresult();
                            if (result.recordset)
                                queryResult.rows = result.recordset;
                            if (result.rowsAffected && result.rowsAffected.length != 0)
                                queryResult.affectedRows = result.rowsAffected;
                            resolve(queryResult);
                        }).catch(function (error) {
                            reject(new index_1.SQLError(error, queryString, values));
                        });
                    })];
            });
        });
    };
    mssqlconnection.prototype.query = function (queryString, values) {
        var sc = this;
        return new Promise(function (resolve, reject) {
            var poolConnection = new mssql.Request(sc._dbObject);
            sc.queryPool(poolConnection, queryString, values).then(function (queryResult) {
                resolve(queryResult);
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    mssqlconnection.prototype.execute = function (queryString, values) {
        return this.query(queryString, values);
    };
    mssqlconnection.prototype.close = function () {
        var sc = this;
        this._isReady = false;
        return new Promise(function (resolve, reject) {
            sc._dbObject.close();
            resolve(true);
        });
    };
    return mssqlconnection;
}());
exports.mssqlconnection = mssqlconnection;
//# sourceMappingURL=mssql.js.map