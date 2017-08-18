export interface sqlconnection {
    init(config: sqlconfig): Promise<boolean>;
    isReady(): boolean;
    waitForReady(): Promise<boolean>;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    createtransaction(): sqltransaction;
    close(): Promise<boolean>;
    getConfig(): sqlconfig;
}
export interface sqltransaction {
    init(connection: sqlconnection): void;
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>): Promise<sqlresult>;
}
export declare class sqlresult {
    rows: {}[];
    affectedRows: number[];
}
export declare class SQLError extends Error {
    SQLQuery: string;
    SQLValues: any;
    constructor(message: string, sqlquery: string, sqlvalues: any);
    getSQLQuery(): string;
}
export declare enum sqltype {
    SQLITE = 0,
    MSSQL = 1,
    MYSQL = 2,
    POSTGRESQL = 3,
}
export declare class sqlconfig {
    type: sqltype;
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}
export declare class sqlconnector {
    protected pool: {
        [key: string]: sqlconnection;
    };
    initConnection(name: string, config: sqlconfig): Promise<boolean>;
    getConnection(name: string): sqlconnection;
    closeConnection(name: string): Promise<void>;
}
