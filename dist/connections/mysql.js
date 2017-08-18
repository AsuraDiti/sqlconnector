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
var mysql = require('mysql2');
var mysqltransaction = (function () {
    function mysqltransaction() {
        this._begin = false;
        this._finished = false;
    }
    mysqltransaction.prototype.init = function (connection) {
        if (connection instanceof mysqlconnection)
            this._connection = connection;
    };
    mysqltransaction.prototype.begin = function () {
        if (this._begin)
            throw new Error('The function "begin" was already called. Create a new transaction');
        this._begin = true;
        var st = this;
        return new Promise(function (resolve, reject) {
            st._connection._dbObject.getConnection(function (err, connection) {
                if (err) {
                    return reject(new Error(err));
                }
                connection.beginTransaction(function (err2) {
                    if (err2) {
                        return reject(new Error(err2));
                    }
                    st._transaction = connection;
                    resolve();
                });
            });
        });
    };
    mysqltransaction.prototype.commit = function () {
        if (!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if (this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");
        this._finished = true;
        var st = this;
        return new Promise(function (resolve, reject) {
            st._transaction.commit(function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    };
    mysqltransaction.prototype.rollback = function () {
        if (!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if (this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");
        this._finished = true;
        var st = this;
        return new Promise(function (resolve, reject) {
            st._transaction.rollback(function () {
                resolve();
            });
        });
    };
    mysqltransaction.prototype.query = function (queryString, values) {
        if (!this._begin || this._finished)
            throw new Error("The transaction is not active.");
        var sc = this._connection;
        var st = this;
        return new Promise(function (resolve, reject) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    st._transaction.query(queryString, values, function (error, results, fields) {
                        if (error) {
                            return reject(new index_1.SQLError(error, queryString, values));
                        }
                        var queryResult = new index_1.sqlresult();
                        if (results == undefined) {
                            return resolve(queryResult);
                        }
                        if (results.affectedRows != undefined)
                            queryResult.affectedRows = [results.affectedRows];
                        if (Array.isArray(results))
                            queryResult.rows = results;
                        resolve(queryResult);
                    });
                    return [2 /*return*/];
                });
            });
        });
    };
    mysqltransaction.prototype.execute = function (queryString, values) {
        return this.query(queryString, values);
    };
    return mysqltransaction;
}());
exports.mysqltransaction = mysqltransaction;
var mysqlconnection = (function () {
    function mysqlconnection() {
        this._initPromise = undefined;
        this._isReady = false;
    }
    mysqlconnection.prototype.init = function (config) {
        this.Config = config;
        var sc = this;
        this._initPromise = new Promise(function (resolve, reject) {
            sc._dbObject = mysql.createPool({
                connectionLimit: 10,
                host: config.host,
                user: config.user,
                password: config.password,
                database: config.database,
                port: config.port,
                namedPlaceholders: true
            });
            sc._dbObject.getConnection(function (err, connection) {
                if (connection)
                    connection.release();
                if (err) {
                    return reject(new Error(err));
                }
                resolve(true);
            });
        });
        this._initPromise.then(function (result) { sc._isReady = result; }).catch(function (error) { });
        return this._initPromise;
    };
    mysqlconnection.prototype.getConfig = function () {
        return this.Config;
    };
    mysqlconnection.prototype.isReady = function () {
        return this._isReady;
    };
    mysqlconnection.prototype.waitForReady = function () {
        return this._initPromise;
    };
    mysqlconnection.prototype.createtransaction = function () {
        var result = new mysqltransaction();
        result.init(this);
        return result;
    };
    mysqlconnection.prototype.query = function (queryString, values) {
        var sc = this;
        return new Promise(function (resolve, reject) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    sc._dbObject.getConnection(function (err, connection) {
                        if (err) {
                            connection.release();
                            return reject(new Error(err));
                        }
                        connection.query(queryString, values, function (error, results, fields) {
                            connection.release();
                            if (error) {
                                return reject(new index_1.SQLError(error, queryString, values));
                            }
                            var queryResult = new index_1.sqlresult();
                            if (results == undefined) {
                                return resolve(queryResult);
                            }
                            if (results.affectedRows != undefined)
                                queryResult.affectedRows = [results.affectedRows];
                            if (Array.isArray(results))
                                queryResult.rows = results;
                            resolve(queryResult);
                        });
                    });
                    return [2 /*return*/];
                });
            });
        });
    };
    mysqlconnection.prototype.execute = function (queryString, values) {
        return this.query(queryString, values);
    };
    mysqlconnection.prototype.close = function () {
        var sc = this;
        this._isReady = false;
        return new Promise(function (resolve, reject) {
            sc._dbObject.end(function (err) {
                if (err) {
                    return reject(new Error(err));
                }
                resolve(true);
            });
        });
    };
    return mysqlconnection;
}());
exports.mysqlconnection = mysqlconnection;
//# sourceMappingURL=mysql.js.map