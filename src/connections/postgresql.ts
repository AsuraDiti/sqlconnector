import { sqlconnection, sqlconfig, sqlresult, sqltransaction } from '../index'

declare function require(path: string) : any;
const pg = require('pg');


export class postgresqltransaction implements sqltransaction
{
    protected _connection: postgresqlconnection;
    protected _transaction: any;
    protected _begin: boolean = false;
    protected _finished: boolean = false;


    init(connection: sqlconnection): void
    {
        if(connection instanceof postgresqlconnection)
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
                st._connection._dbObject.connect().then( (client:any) => {
                    st._transaction = client;
                    st._begin = true;
                    st.query("BEGIN", []).then((result:sqlresult) => {
                        resolve();
                        st._begin = true;
                    }).catch((error:any) => {
                        client.release();
                        reject(new Error(error));
                    })

                }).catch((error: any) => {
                    reject(new Error(error));
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
        return new Promise<void>((resolve, reject) => {
            st.query("COMMIT", []).then((result:sqlresult) => {
                st._transaction.release();
                this._finished = true;
                resolve();
            }).catch((error:any) => {
                st._transaction.release();
                this._finished = true;
                reject(new Error(error));
            })
        });
    }
    rollback() : Promise<void>
    {
        if(!this._begin)
            throw new Error("Transaction has not begun. Make sure to call begin()");
        if(this._finished)
            throw new Error("The Transaction has already ended create a new transaction.");


        var st = this;
        return new Promise<void>((resolve, reject) => {
            st.query("ROLLBACK", []).then((result:sqlresult) => {
                st._transaction.release();
                this._finished = true;
                resolve();
            }).catch((error:any) => {
                st._transaction.release();
                this._finished = true;
                reject(new Error(error));
            })
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
                st._transaction.query(queryString, values).then( (results:any) => {
                    let queryResult = new sqlresult();
                    if(results.rowCount != undefined && !isNaN(results.rowCount))
                        queryResult.affectedRows = [results.rowCount];
                    if(results.rows != undefined && (results.rows.length != 0 || results.fields.length != 0))
                        queryResult.rows = results.rows;

                    resolve(queryResult);
                }).catch((error:any) => {
                    reject(new Error(error));
                });
            }
        );
    }
    execute(queryString: string, values: object | Array<any>) : Promise<sqlresult>
    {
        return this.query(queryString, values);
    }
}

export class postgresqlconnection implements sqlconnection
{
    protected _initPromise : Promise<boolean> = undefined;
    protected _isReady : boolean = false;

    public _dbObject : any;

    init(config: sqlconfig) : Promise<boolean>
    {
        let sc : postgresqlconnection = this;
        this._initPromise = new Promise<boolean>( function(resolve, reject){
            sc._dbObject  = new pg.Pool({
              connectionLimit : 10,
              host            : config.host,
              user            : config.user,
              password        : config.password,
              database        : config.database,
              port            : config.port
            });

            sc._dbObject.connect().then((client:any) => {
                client.release();
                resolve(true);
            }).catch((error:any) => {
                reject(new Error(error));
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
        let result =  new postgresqltransaction();
        result.init(this);
        return result;
    }



    query(queryString: string, values: object | Array<any>): Promise<sqlresult>
    {
        let sc : postgresqlconnection = this;
        return new Promise<sqlresult>(
            async function(resolve, reject)
            {
                sc._dbObject.connect().then( (client:any) => {



                        client.query(queryString, values).then((results:any) => {

                            let queryResult = new sqlresult();
                            if(results.rowCount != undefined && !isNaN(results.rowCount))
                                queryResult.affectedRows = [results.rowCount];
                            if(results.rows != undefined && (results.rows.length != 0 || results.fields.length != 0))
                                queryResult.rows = results.rows;

                            client.release();
                            resolve(queryResult);
                        }).catch((error:any) => {
                            client.release();
                            return reject(new Error(error));
                        });

                }).catch((error:any) => {
                    return reject(new Error(error));
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
        let sc : postgresqlconnection = this;
        this._isReady = false;
        return new Promise<boolean>(
            function(resolve, reject)
            {
                return sc._dbObject.end((err: any) => {
                    if(err){ return reject(new Error(err)); }
                    resolve(true);
                })
            }
        );

    }
}
