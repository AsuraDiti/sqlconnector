import { sqlconnection, sqlconfig, sqlresult, sqltransaction } from '../index'

declare function require(path: string) : any;
const mysql = require('mysql2');


export class mysqltransaction implements sqltransaction
{
    protected _connection: mysqlconnection;
    protected _transaction: any;
    protected _begin: boolean = false;
    protected _finished: boolean = false;


    init(connection: sqlconnection): void
    {
        if(connection instanceof mysqlconnection)
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
                st._connection._dbObject.getConnection(function(err:any, connection:any) {
                    if(err) { reject(new Error(err)); }

                    connection.beginTransaction(function(err2:any) {
                        if (err2) { reject(new Error(err2)); }
                        st._transaction = connection;

                        resolve();
                    });
                });

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
                st._transaction.commit(function(err:any) {
                    if (err) {
                      return st._transaction.rollback(function() {
                        reject(err);
                      });
                    }
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
                st._transaction.rollback(function() {
                    resolve();
                });
            });
    }
    query(queryString: string, values: object | Array<any>): Promise<sqlresult>
    {
        if(!this._begin || this._finished)
            throw new Error("The transaction is not active.");

        let sc = this._connection;
        let st = this;
        return new Promise<sqlresult>(
            async function(resolve, reject)
            {
                st._transaction.query(queryString, values, function (error:any, results:any, fields:any) {

                    if(error){ reject(new Error(error)); }

                    let queryResult = new sqlresult();
                    if(results.affectedRows != undefined)
                        queryResult.affectedRows = [results.affectedRows];
                    if(Array.isArray(results))
                        queryResult.rows = results;

                    resolve(queryResult);
                });
            }
        );
    }
    execute(queryString: string, values: object | Array<any>) : Promise<sqlresult>
    {
        return this.query(queryString, values);
    }
}

export class mysqlconnection implements sqlconnection
{
    protected _initPromise : Promise<boolean> = undefined;
    protected _isReady : boolean = false;

    public _dbObject : any;

    init(config: sqlconfig) : Promise<boolean>
    {
        let sc : mysqlconnection = this;
        this._initPromise = new Promise<boolean>( function(resolve, reject){
            sc._dbObject  = mysql.createPool({
              connectionLimit : 10,
              host            : config.host,
              user            : config.user,
              password        : config.password,
              database        : config.database,
              port            : config.port
            });

            sc._dbObject.getConnection(function(err:any, connection:any) {
                if(connection)
                    connection.release();
                if(err) { return reject(new Error(err)); }
                resolve(true);
            });
        });


        this._initPromise.then( function(result){ sc._isReady = result; } );

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
        let result =  new mysqltransaction();
        result.init(this);
        return result;
    }



    query(queryString: string, values: object | Array<any>): Promise<sqlresult>
    {
        let sc : mysqlconnection = this;
        return new Promise<sqlresult>(
            async function(resolve, reject)
            {
                sc._dbObject.getConnection(function(err:any, connection:any) {
                    if(err) { connection.release(); return reject(new Error(err)); }

                        connection.query(queryString, values, function (error:any, results:any, fields:any) {
                            connection.release();

                            if(error){ reject(new Error(error)); }

                            let queryResult = new sqlresult();
                            if(results.affectedRows != undefined)
                                queryResult.affectedRows = [results.affectedRows];
                            if(Array.isArray(results))
                                queryResult.rows = results;

                            resolve(queryResult);
                        });

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
        let sc : mysqlconnection = this;
        this._isReady = false;
        return new Promise<boolean>(
            function(resolve, reject)
            {
                sc._dbObject.end(function(err: any)
                {
                    if(err){ return reject(new Error(err));}
                    resolve(true);
                });
            }
        );

    }
}
