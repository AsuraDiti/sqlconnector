import { sqlconnection, sqlconfig, sqlresult, sqltransaction } from '../index';
export declare class mysqltransaction implements sqltransaction {
    protected _connection: mysqlconnection;
    protected _transaction: any;
    protected _begin: boolean;
    protected _finished: boolean;
    init(connection: sqlconnection): void;
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>): Promise<sqlresult>;
}
export declare class mysqlconnection implements sqlconnection {
    protected Config: sqlconfig;
    protected _initPromise: Promise<boolean>;
    protected _isReady: boolean;
    _dbObject: any;
    init(config: sqlconfig): Promise<boolean>;
    getConfig(): sqlconfig;
    isReady(): boolean;
    waitForReady(): Promise<boolean>;
    createtransaction(): sqltransaction;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    close(): Promise<boolean>;
}
