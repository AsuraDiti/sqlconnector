import { sqlconnection, sqlconfig, sqlresult, sqltransaction, SQLError } from '../index'

declare function require(path: string) : any;
var sqlite3 = require('sqlite3').verbose();

export class sqlitetransaction implements sqltransaction
{
    protected _connection: sqlconnection;
    protected _begin: boolean = false;
    protected _finished: boolean = false;
    init(connection: sqlconnection): void
    {
        this._connection = connection;
    }

    begin() : Promise<void>
    {
        if(this._begin)
            throw new Error('The function "begin" was already called. Create a new transaction');

        var st = this;
        return new Promise<void>(function(resolve, reject)
            {
                st._connection.execute("BEGIN TRANSACTION;", []).then(function(result : any)
                    {
                        st._begin = true;
                        resolve();
                    }).catch(function(error: any)
                    {
                        reject(error);
                    });
            });

    }
    commit() : Promise<void>
    {
        if(!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if(this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");
        var st = this;
        return new Promise<void>(function(resolve, reject)
            {
                st._connection.execute("COMMIT;", []).then(function(result : any)
                    {

                        st._finished = true;
                        resolve();
                    }).catch(function(error: any)
                    {
                        reject(error);
                    });
            });
    }
    rollback() : Promise<void>
    {
        if(!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if(this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");
        var st = this;
        return new Promise<void>(function(resolve, reject)
            {
                st._connection.execute("ROLLBACK;", []).then(function(result : any)
                    {
                        st._finished = true;
                        resolve();
                    }).catch(function(error: any)
                    {
                        reject(error);
                    });
            });
    }
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>
    {
        if(!this._begin || this._finished)
            throw new Error("The transaction is not active.");
        return this._connection.query(queryString, values);
    }
    execute(queryString: string, values: object | Array<any>) : Promise<any>
    {
        if(!this._begin || this._finished)
            throw new Error("The transaction is not active.");
        return this._connection.execute(queryString, values);
    }
}

export class sqliteconnection implements sqlconnection
{
    protected Config: sqlconfig;
    protected _initPromise : Promise<boolean> = undefined;
    protected _isReady : boolean = false;

    protected _dbObject : any;

    init(config: sqlconfig) : Promise<boolean>
    {
        this.Config = config;
        let sc : sqliteconnection = this;
        this._initPromise = new Promise<boolean>( function(resolve, reject){
            sc._dbObject = new sqlite3.cached.Database(config.host, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function(error: any)
                {
                    if(error){ return reject(new Error(error)); }
                    resolve(true);
                });
        });


        this._initPromise.then( function(result){ sc._isReady = result; } ).catch((error) => {});


        return this._initPromise;
    }

    getConfig(): sqlconfig{
        return this.Config;
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
        let result =  new sqlitetransaction();
        result.init(this);
        return result;
    }

    getQueryResult(obj: any) : sqlresult
    {
        let queryResult = new sqlresult();

        if(obj == undefined)
            return queryResult;

        if(Array.isArray(obj))
        {
            queryResult.rows = obj;
            return queryResult;
        }

        var changedRowsRegex = /update|delete/i;
        var lastIDRowsRegex = /insert/i;
        let testRegex = null;

        testRegex = obj.sql.match(changedRowsRegex);
        if(testRegex == null)
        {
            testRegex = obj.sql.match(lastIDRowsRegex);
            if(testRegex != null)
            {
                queryResult.affectedRows = [obj.lastID];
            }else{
                queryResult.affectedRows = [0];
            }
        }else{
            queryResult.affectedRows = [obj.changes];
        }

        return queryResult;
    }

    query(queryString: string, values: object | Array<any>): Promise<sqlresult>
    {
        let sc : sqliteconnection = this;
        return new Promise<sqlresult>(
            function(resolve, reject)
            {
                let queryResult = new sqlresult();
                sc._dbObject.all(queryString, values, function(error: any, result: any)
                {
                    if(error){ return reject(new SQLError(error, queryString, values)); }

                    queryResult.rows = result;
                    resolve(queryResult);


                });
            }
        );
    }
    execute(queryString: string, values: object | Array<any>) : Promise<sqlresult>
    {
        let sc : sqliteconnection = this;
        return new Promise<sqlresult>(
            function(resolve, reject)
            {
                let queryResult = new sqlresult();
                sc._dbObject.run(queryString, values, function(error: any)
                {
                    if(error){ return reject(new Error(error)); }

                    queryResult = sc.getQueryResult(this)


                    resolve(queryResult);



                });
            }
        );
    }

    close() : Promise<boolean>
    {
        let sc : sqliteconnection = this;
        this._isReady = false;
        return new Promise<boolean>(
            function(resolve, reject)
            {
                sc._dbObject.close(function(error: any){
                    if(error){ return reject(new Error(error)); }
                    resolve(true);
                });
            }
        );

    }
}
