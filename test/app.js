var assert = require('assert');
var wsObserver = require('../modules/wsObserver');
var chatApp = require('../public/js/app.js');

var ChApp = new chatApp();
var Observer = new wsObserver();

var protocolExmplData = ['result', true, 'UUID'];

describe('App', function() {

    describe('client<=>server protocol test', function () {
        it('client<=>server', function () {
            assert.equal(ChApp._protocol.isValidProtocol(protocolExmplData),
                         Observer._protocol.isValidProtocol(protocolExmplData));

            assert.equal( JSON.stringify(ChApp._protocol.parseData(protocolExmplData)) ,
                          JSON.stringify({  event : 'result',
                                            data : true,
                                            uuid : 'UUID'}));

            assert.equal( JSON.stringify(Observer._protocol.parseData(protocolExmplData)) ,
                          JSON.stringify({  event : 'result',
                                            data : true,
                                            uuid : 'UUID',
                                            user: null}));

        });
    });

    describe('Observer', function () {
        it('countUsers()', function () {
            assert.equal(Observer.countUsers(), 0);
        });
        it('listener()', function () {
            assert.equal((typeof Observer.listener()), 'function');
        });
    });



    describe('chatApp', function () {
        it('generateUUID()', function () {
            assert.equal((typeof ChApp.generateUUID()), 'string');
        });
    });
});