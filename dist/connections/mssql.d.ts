import { sqlconnection, sqlconfig, sqlresult, sqltransaction } from '../index';
export declare class mssqltransaction implements sqltransaction {
    protected _connection: mssqlconnection;
    protected _transaction: any;
    protected _begin: boolean;
    protected _finished: boolean;
    init(connection: sqlconnection): void;
    getConfig(): sqlconfig;
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>): Promise<sqlresult>;
}
export declare class mssqlconnection implements sqlconnection {
    protected Config: sqlconfig;
    protected _initPromise: Promise<boolean>;
    protected _isReady: boolean;
    _dbObject: any;
    init(config: sqlconfig): Promise<boolean>;
    getConfig(): sqlconfig;
    isReady(): boolean;
    waitForReady(): Promise<boolean>;
    createtransaction(): sqltransaction;
    queryPool(poolConnection: any, queryString: string, values: object | Array<any>): Promise<sqlresult>;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    close(): Promise<boolean>;
}
