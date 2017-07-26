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
var sqlite_1 = require("./connections/sqlite");
var mssql_1 = require("./connections/mssql");
var mysql_1 = require("./connections/mysql");
var postgresql_1 = require("./connections/postgresql");
var sqlresult = (function () {
    function sqlresult() {
        this.rows = [];
        this.affectedRows = [0];
    }
    return sqlresult;
}());
exports.sqlresult = sqlresult;
var sqltype;
(function (sqltype) {
    sqltype[sqltype["SQLITE"] = 0] = "SQLITE";
    sqltype[sqltype["MSSQL"] = 1] = "MSSQL";
    sqltype[sqltype["MYSQL"] = 2] = "MYSQL";
    sqltype[sqltype["POSTGRESQL"] = 3] = "POSTGRESQL";
})(sqltype = exports.sqltype || (exports.sqltype = {}));
var sqlconfig = (function () {
    function sqlconfig() {
        this.type = sqltype.SQLITE;
    }
    return sqlconfig;
}());
exports.sqlconfig = sqlconfig;
var sqlconnector = (function () {
    function sqlconnector() {
        this.pool = {};
    }
    sqlconnector.prototype.initConnection = function (name, config) {
        var createdConnection = undefined;
        if (config.type == sqltype.SQLITE) {
            createdConnection = new sqlite_1.sqliteconnection();
        }
        else if (config.type == sqltype.MSSQL) {
            createdConnection = new mssql_1.mssqlconnection();
        }
        else if (config.type == sqltype.MYSQL) {
            createdConnection = new mysql_1.mysqlconnection();
        }
        else if (config.type == sqltype.POSTGRESQL) {
            createdConnection = new postgresql_1.postgresqlconnection();
        }
        else {
            throw "SQL-Type was not found";
        }
        this.pool[name.trim().toLowerCase()] = createdConnection;
        return this.pool[name.trim().toLowerCase()].init(config);
    };
    sqlconnector.prototype.getConnection = function (name) {
        var validName = name.trim().toLowerCase();
        if (!(validName in this.pool)) {
            throw "The connection was not found. Please use initConnection before";
        }
        if (this.pool[validName].isReady()) {
            return this.pool[validName];
        }
        return this.pool[validName];
    };
    sqlconnector.prototype.closeConnection = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var validName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validName = name.trim().toLowerCase();
                        if (!(validName in this.pool)) {
                            throw "The connection was not found. Please use initConnection before";
                        }
                        return [4 /*yield*/, this.pool[validName].waitForReady()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.pool[validName].close()];
                    case 2:
                        _a.sent();
                        this.pool[validName] = undefined;
                        return [2 /*return*/];
                }
            });
        });
    };
    return sqlconnector;
}());
exports.sqlconnector = sqlconnector;
//# sourceMappingURL=index.js.map