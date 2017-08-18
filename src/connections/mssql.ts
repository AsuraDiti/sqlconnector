import { sqlconnection, sqlconfig, sqlresult, sqltransaction, SQLError } from '../index'

declare function require(path: string) : any;
const mssql = require('mssql');


export class mssqltransaction implements sqltransaction
{
    protected _connection: mssqlconnection;
    protected _transaction: any;
    protected _begin: boolean = false;
    protected _finished: boolean = false;
    init(connection: sqlconnection): void
    {
        if(connection instanceof mssqlconnection)
            this._connection = connection;
    }

    begin() : Promise<void>
    {
        if(this._begin)
            throw new Error('The function "begin" was already called. Create a new transaction');
        this._begin = true;

        var st = this;
        return new Promise<void>(function(resolve, reject)
            {
                st._transaction = new mssql.Transaction(st._connection._dbObject);
                st._transaction.begin((err:any) => {
                    if(err){ return reject(new Error(err)); }
                    resolve();
                })

            });

    }
    commit() : Promise<void>
    {
        if(!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if(this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");

        this._finished = true;
        var st = this;
        return new Promise<void>(function(resolve, reject)
            {
                st._transaction.commit((err:any) => {
                    if(err){ return reject(new Error(err)); }
                    resolve();
                });
            });
    }
    rollback() : Promise<void>
    {
        if(!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if(this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");

        this._finished = true;
        var st = this;
        return new Promise<void>(function(resolve, reject)
            {
                st._transaction.rollback((err:any) => {
                    if(err){ return reject(new Error(err)); }
                    resolve();
                });
            });
    }
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>
    {
        if(!this._begin || this._finished)
            throw new Error("The transaction is not active.")

        let sc = this._connection;
        let st = this;
        return new Promise<sqlresult>(
            async function(resolve, reject)
            {

                let poolConnection = new mssql.Request(st._transaction);
                sc.queryPool(poolConnection, queryString, values).then((queryResult:any) => {
                    resolve(queryResult);
                }).catch((error:any) => {
                    reject(error);
                })



            }
        );
    }
    execute(queryString: string, values: object | Array<any>) : Promise<sqlresult>
    {
        return this.query(queryString, values);
    }
}

export class mssqlconnection implements sqlconnection
{
    protected _initPromise : Promise<boolean> = undefined;
    protected _isReady : boolean = false;

    public _dbObject : any;

    init(config: sqlconfig) : Promise<boolean>
    {
        let sc : mssqlconnection = this;
        this._initPromise = new Promise<boolean>( function(resolve, reject){
            sc._dbObject = new mssql.ConnectionPool( { user: config.user, password: config.password, server: config.host, database: config.database }, (err:any) => {
                if(err) { return reject(new Error(err)); }

                resolve(true);
            });
        });


        this._initPromise.then( function(result){ sc._isReady = result; } ).catch((error) => {});

        return this._initPromise;
    }

    isReady(): boolean
    {
        return this._isReady;
    }

    waitForReady(): Promise<boolean>
    {
        return this._initPromise;
    }

    createtransaction() : sqltransaction
    {
        let result =  new mssqltransaction();
        result.init(this);
        return result;
    }

    async queryPool(poolConnection: any, queryString: string, values: object | Array<any>) : Promise<sqlresult>
    {
        return new Promise<sqlresult>((resolve, reject) =>{

            if( values != undefined && !Array.isArray(values))
            {
                for(let key of Object.keys(values))
                {
                    poolConnection.input(key, values[key]);
                }
            }

            poolConnection.query(queryString).then((result:any) => {
                let queryResult = new sqlresult();
                if(result.recordset)
                    queryResult.rows = result.recordset;
                if(result.rowsAffected && result.rowsAffected.length != 0)
                    queryResult.affectedRows = result.rowsAffected;

                resolve(queryResult);
            }).catch((error:any) => {
                reject(new SQLError(error, queryString));
            })

        });

    }


    query(queryString: string, values: object | Array<any>): Promise<sqlresult>
    {
        let sc : mssqlconnection = this;
        return new Promise<sqlresult>(
            function(resolve, reject)
            {
                let poolConnection = new mssql.Request(sc._dbObject);

                sc.queryPool(poolConnection, queryString, values).then((queryResult:sqlresult) => {
                    resolve(queryResult);
                }).catch((error:any) => {
                    reject(error);
                });
            }
        );
    }
    execute(queryString: string, values: object | Array<any>) : Promise<sqlresult>
    {
        return this.query(queryString, values);
    }

    close() : Promise<boolean>
    {
        let sc : mssqlconnection = this;
        this._isReady = false;
        return new Promise<boolean>(
            function(resolve, reject)
            {
                sc._dbObject.close();
                resolve(true);
            }
        );

    }
}
