import { sqlconnection, sqlconfig, sqlresult, sqltransaction } from '../index';
export declare class sqlitetransaction implements sqltransaction {
    protected _connection: sqlconnection;
    protected _begin: boolean;
    protected _finished: boolean;
    init(connection: sqlconnection): void;
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>): Promise<any>;
}
export declare class sqliteconnection implements sqlconnection {
    protected _initPromise: Promise<boolean>;
    protected _isReady: boolean;
    protected _dbObject: any;
    init(config: sqlconfig): Promise<boolean>;
    isReady(): boolean;
    waitForReady(): Promise<boolean>;
    createtransaction(): sqltransaction;
    getQueryResult(obj: any): sqlresult;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    close(): Promise<boolean>;
}
