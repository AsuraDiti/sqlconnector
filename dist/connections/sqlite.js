"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var sqlite3 = require('sqlite3').verbose();
var sqlitetransaction = (function () {
    function sqlitetransaction() {
        this._begin = false;
        this._finished = false;
    }
    sqlitetransaction.prototype.init = function (connection) {
        this._connection = connection;
    };
    sqlitetransaction.prototype.begin = function () {
        if (this._begin)
            throw new Error('The function "begin" was already called. Create a new transaction');
        var st = this;
        return new Promise(function (resolve, reject) {
            st._connection.execute("BEGIN TRANSACTION;", []).then(function (result) {
                st._begin = true;
                resolve();
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    sqlitetransaction.prototype.commit = function () {
        if (!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if (this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");
        var st = this;
        return new Promise(function (resolve, reject) {
            st._connection.execute("COMMIT;", []).then(function (result) {
                st._finished = true;
                resolve();
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    sqlitetransaction.prototype.rollback = function () {
        if (!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if (this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");
        var st = this;
        return new Promise(function (resolve, reject) {
            st._connection.execute("ROLLBACK;", []).then(function (result) {
                st._finished = true;
                resolve();
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    sqlitetransaction.prototype.query = function (queryString, values) {
        if (!this._begin || this._finished)
            throw new Error("The transaction is not active.");
        return this._connection.query(queryString, values);
    };
    sqlitetransaction.prototype.execute = function (queryString, values) {
        if (!this._begin || this._finished)
            throw new Error("The transaction is not active.");
        return this._connection.execute(queryString, values);
    };
    return sqlitetransaction;
}());
exports.sqlitetransaction = sqlitetransaction;
var sqliteconnection = (function () {
    function sqliteconnection() {
        this._initPromise = undefined;
        this._isReady = false;
    }
    sqliteconnection.prototype.init = function (config) {
        var sc = this;
        this._initPromise = new Promise(function (resolve, reject) {
            sc._dbObject = new sqlite3.cached.Database(config.host, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (error) {
                if (error) {
                    return reject(new Error(error));
                }
                resolve(true);
            });
        });
        this._initPromise.then(function (result) { sc._isReady = result; });
        return this._initPromise;
    };
    sqliteconnection.prototype.isReady = function () {
        return this._isReady;
    };
    sqliteconnection.prototype.waitForReady = function () {
        return this._initPromise;
    };
    sqliteconnection.prototype.createtransaction = function () {
        var result = new sqlitetransaction();
        result.init(this);
        return result;
    };
    sqliteconnection.prototype.getQueryResult = function (obj) {
        var queryResult = new index_1.sqlresult();
        if (obj == undefined)
            return queryResult;
        if (Array.isArray(obj)) {
            queryResult.rows = obj;
            return queryResult;
        }
        var changedRowsRegex = /update|delete/i;
        var lastIDRowsRegex = /insert/i;
        var testRegex = null;
        testRegex = obj.sql.match(changedRowsRegex);
        if (testRegex == null) {
            testRegex = obj.sql.match(lastIDRowsRegex);
            if (testRegex != null) {
                queryResult.affectedRows = [obj.lastID];
            }
            else {
                queryResult.affectedRows = [0];
            }
        }
        else {
            queryResult.affectedRows = [obj.changes];
        }
        return queryResult;
    };
    sqliteconnection.prototype.query = function (queryString, values) {
        var sc = this;
        return new Promise(function (resolve, reject) {
            var queryResult = new index_1.sqlresult();
            sc._dbObject.all(queryString, values, function (error, result) {
                if (error) {
                    return reject(new Error(error));
                }
                queryResult.rows = result;
                resolve(queryResult);
            });
        });
    };
    sqliteconnection.prototype.execute = function (queryString, values) {
        var sc = this;
        return new Promise(function (resolve, reject) {
            var queryResult = new index_1.sqlresult();
            sc._dbObject.run(queryString, values, function (error) {
                if (error) {
                    return reject(new Error(error));
                }
                queryResult = sc.getQueryResult(this);
                resolve(queryResult);
            });
        });
    };
    sqliteconnection.prototype.close = function () {
        var sc = this;
        this._isReady = false;
        return new Promise(function (resolve, reject) {
            sc._dbObject.close(function (error) {
                if (error) {
                    return reject(new Error(error));
                }
                resolve(true);
            });
        });
    };
    return sqliteconnection;
}());
exports.sqliteconnection = sqliteconnection;
//# sourceMappingURL=sqlite.js.map