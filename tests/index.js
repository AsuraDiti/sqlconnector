'use strict';

var sqlconnector = require('../dist');
var expect = require('chai').expect;

var jsonSqlLib = require('json-sql');



function test(dbname, dbconfig)
{
    describe(dbname, function() {
        let useDialect = 'base';
        if(dbconfig.type == sqlconnector.sqltype.MSSQL)
            useDialect = 'mssql';
        else if(dbconfig.type == sqlconnector.sqltype.SQLITE)
            useDialect = 'sqlite';
        else if(dbconfig.type == sqlconnector.sqltype.MYSQL)
            useDialect = 'mysql';
        else if(dbconfig.type == sqlconnector.sqltype.POSTGRESQL)
            useDialect = 'postgresql';


        let jsonSql = jsonSqlLib({
            dialect: useDialect,
            separatedValues: true,
            namedValues: true,
            wrappedIdentifiers: true,
            indexedValues: true
        });

        let sqldb = new sqlconnector.sqlconnector();;

        it('init', async function() {
            await sqldb.initConnection("default", dbconfig);
    	});

        it('execute "create table" should work', async function() {
            let result = await sqldb.getConnection("default").execute(jsonSql.build({type: "create", table:"a", columnlist: { name: 'id', type: 'int' }}).query, []);

            expect(result).to.be.eql({affectedRows: [ 0 ], rows:[] });
    	});

        it('execute "create table" with "primary key" should work', async function() {

            let result = await sqldb.getConnection("default").execute(jsonSql.build({type: "create", table:"pk", columnlist: { name: 'id', type: 'int', autoincrement: true, primary: true }}).query, []);
            await sqldb.getConnection("default").execute(jsonSql.build({type: "drop", table:"pk"}).query, []);
            expect(result).to.be.eql({affectedRows: [ 0 ], rows:[] });
    	});

        it('execute "create table" with "unique" should work', async function() {

            let result = await sqldb.getConnection("default").execute(jsonSql.build({type: "create", table:"pk", columnlist: { name: 'id', type: 'int', unique: true }}).query, []);
            await sqldb.getConnection("default").execute(jsonSql.build({type: "drop", table:"pk"}).query, []);
            expect(result).to.be.eql({affectedRows: [ 0 ], rows:[] });
    	});

        it('execute "create table" with "not null" should work', async function() {

            let result = await sqldb.getConnection("default").execute(jsonSql.build({type: "create", table:"pk", columnlist: { name: 'id', type: 'int', unique: true, allownull: false }}).query, []);
            await sqldb.getConnection("default").execute(jsonSql.build({type: "drop", table:"pk"}).query, []);
            expect(result).to.be.eql({affectedRows: [ 0 ], rows:[] });
    	});



        it('execute "insert" should work', async function() {
            let result = await sqldb.getConnection("default").execute(jsonSql.build({type: "insert", table:'a', values: [{id: 1},{id: 2}, {id: 3}, {id: 4}, {id: 5}]}).query, []);

            expect(result).to.be.eql({affectedRows: [5], rows:[]});
    	});

        it('query "select" should work', async function() {
            let result = await sqldb.getConnection("default").query(jsonSql.build({type: "select", table:"a"}).query, []);
            expect(result.rows).to.be.eql( [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}] );
    	});

        it('transaction "commit" should work', async function() {
            let sqltransaction = sqldb.getConnection("default").createtransaction();
            await sqltransaction.begin();
            await sqltransaction.execute(jsonSql.build({type: "insert", table:'a', values: [{id: 6},{id: 7}, {id: 8}]}).query, []);
            await sqltransaction.commit();

            let result = await sqldb.getConnection("default").query(jsonSql.build({type: "select", table:"a"}).query, []);

            expect(result.rows).to.be.eql( [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}] );
    	});

        it('transaction "rollback" should work', async function() {

            let sqltransaction = sqldb.getConnection("default").createtransaction();
            await sqltransaction.begin();
            await sqltransaction.execute(jsonSql.build({type: "insert", table:'a', values: [{id: 6},{id: 7}, {id: 8}]}).query, []);
            await sqltransaction.rollback();

            let result = await sqldb.getConnection("default").query(jsonSql.build({type: "select", table:"a"}).query, []);
            expect(result.rows).to.be.eql( [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}] );

    	});


        it('execute "drop table" should work', async function() {
            let result = await sqldb.getConnection("default").execute(jsonSql.build({type: "drop", table:"a"}).query, []);

            expect(result).to.be.eql({affectedRows: [ 0 ], rows:[]});
    	});

        it('close', async function() {
            await sqldb.closeConnection("default");
    	});
    });


}


test('SQLITE', {host:':memory:', type: sqlconnector.sqltype.SQLITE});
test('MSSQL', {host:'localhost\\SQLEXPRESS', user:"test", password:"test", database: 'TestDB', type: sqlconnector.sqltype.MSSQL});
test('MYSQL', {host:'localhost', port:3306, user:"test", password:"test", database: 'TestDB', type: sqlconnector.sqltype.MYSQL});
test('POSTGRES', {host:'localhost', port:5432, user:"test", password:"test", database: 'TestDB', type: sqlconnector.sqltype.POSTGRESQL});
