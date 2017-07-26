import {sqliteconnection} from './connections/sqlite';
import {mssqlconnection} from './connections/mssql';
import {mysqlconnection} from './connections/mysql';
import {postgresqlconnection} from './connections/postgresql';

export interface sqlconnection
{
    init(config: sqlconfig) : Promise<boolean>;
    isReady(): boolean;
    waitForReady(): Promise<boolean>;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>) : Promise<sqlresult>;
    createtransaction() : sqltransaction;
    close() : Promise<boolean>;
}

export interface sqltransaction
{
    init(connection: sqlconnection): void;
    begin() : Promise<void>;
    commit() : Promise<void>;
    rollback() : Promise<void>;
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>;
    execute(queryString: string, values: object | Array<any>) : Promise<sqlresult>;
}

export class sqlresult
{
    rows: {}[] = [];
    affectedRows: number[] = [0];
}

export enum sqltype
{
    SQLITE,
    MSSQL,
    MYSQL,
    POSTGRESQL
}

export class sqlconfig
{
    public type:sqltype = sqltype.SQLITE;
    public host:string;
    public port:number;
    public user:string;
    public password:string;
    public database:string;
}

export class sqlconnector
{
    protected pool: {[key: string]: sqlconnection} = {};

    public initConnection(name : string, config : sqlconfig) : Promise<boolean>
    {
        let createdConnection: sqlconnection = undefined;
        if(config.type == sqltype.SQLITE)
        {
            createdConnection = new sqliteconnection();
        }else if(config.type == sqltype.MSSQL)
        {
            createdConnection = new mssqlconnection();
        }else if(config.type == sqltype.MYSQL)
        {
            createdConnection = new mysqlconnection();
        }else if(config.type == sqltype.POSTGRESQL)
        {
            createdConnection = new postgresqlconnection();
        }else
        {
            throw "SQL-Type was not found";
        }


        this.pool[name.trim().toLowerCase()] = createdConnection;
        return this.pool[name.trim().toLowerCase()].init(config);
    }
    public getConnection(name: string) : sqlconnection
    {
        let validName = name.trim().toLowerCase();
        if(!(validName in this.pool))
        {
            throw "The connection was not found. Please use initConnection before";
        }

        if(this.pool[validName].isReady())
        {
            return this.pool[validName];
        }

        return this.pool[validName];
    }

    public async closeConnection(name: string)
    {
        let validName = name.trim().toLowerCase();
        if(!(validName in this.pool))
        {
            throw "The connection was not found. Please use initConnection before";
        }

        await this.pool[validName].waitForReady();
        await this.pool[validName].close();

        this.pool[validName] = undefined;
    }


}
