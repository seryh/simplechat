(function (global) {

    var _extend = function(obj1, obj2) {
        for(var i in obj2) obj1[i] = obj2[i];
        return obj1;
    };

    var _protocol = {
        isValidProtocol : function (data) {
            return (data &&
            Object.prototype.toString.call( data ) === '[object Array]' &&
            (data.length === 2 || data.length === 3))
        },
        parseData : function(dataArray) {
            if( !this.isValidProtocol(dataArray) ) return false;
            return {
                event : dataArray[0],
                data : dataArray[1],
                uuid : dataArray[2] || null
            }
        }
    };

    var chatApp = function (opt) {
        var self = this;

        self.options = _extend({
            debug: false,
            reconTimeout: 3000,
            onConnect: function() {},
            onClose: function() {}
        }, opt);

        self.socket = null;
        self._protocol = _protocol;
        self.UUIDhistory = [];

        self.wsOpen();
    };

    chatApp.prototype.emit = function(event, data, callback) {
        data = (data === undefined) ? null : data;
        callback = callback || function() {};

        var self = this,
            uuid = self.generateUUID(),
            req = [event, data, uuid];

        self.UUIDhistory[uuid] = {
            callback: callback,
            req: req,
            status: null,
            date: Math.floor(new Date().getTime() / 1000)
        };

        return self.socket.send(JSON.stringify(req));
    };

    chatApp.prototype.Events = {
        'response': function(resp) {
            var self = this;

            for (var uuid in self.UUIDhistory) {

                if ( !self.UUIDhistory.hasOwnProperty(uuid) ) {
                    return false;
                }

                var item = self.UUIDhistory[uuid];
                item.status = 200;

                if (uuid === resp.uuid) {
                    item.callback(resp.data);
                    delete self.UUIDhistory[uuid];
                }
            }
        },
        'error': function(req) {
            alert('WS error:' + req.data + ' uuid:' + req.uuid);
        },
        'join': function(nick) {
            console.info('в чат вошел ', nick);
        }
    };

    chatApp.prototype.sendNick = function (nick, cb) {
        cb = cb || function() {};
        var self = this;
        if (self.socket.readyState !== 1) return false;
        self.emit('setNick', nick, cb);
    };


    chatApp.prototype.wsOpen = function () {
        var self = this;
        self.socket = new WebSocket('ws://'+location.hostname+(location.port ? ':'+location.port: ''), ['wamp']);

        var _timeout = setTimeout(function() {
            if (!self.socket.readyState) self.socket.close();
        }, self.options.reconTimeout);

        self.socket.onopen = function() {
            if (self.options.debug)
                console.info('chatApp.ws:onopen');
            clearTimeout(_timeout);
            self.emit('ping');
            self.options.onConnect(self.socket);
        };

        self.socket.onclose = function(event) {
            clearTimeout(_timeout);
            if (self.options.debug)
                console.debug('chatApp.ws:onclose','code: ' + event.code + ' reason: ' + event.reason);
            self.options.onClose();
            self.wsOpen();
        };

        self.socket.onmessage = function(event) {
            if (self.options.debug)
                console.debug('chatApp.ws:onmessage',event.data);
            var dataArray;
            try {
                dataArray = JSON.parse(event.data);
                if( _protocol.isValidProtocol(dataArray) ) {
                    var req =_protocol.parseData(dataArray);

                    if ( !Boolean(self.Events[req.event]) ) return false;

                    self.Events[req.event].call(self, req);
                } else {
                    return false;
                }
            } catch (error) {
                if (self.options.debug)
                    console.error('chatApp.ws:onerror', error.message);
            }
        };

        self.socket.onerror = function(error) {
            if (self.options.debug)
                console.error('chatApp.ws:onerror', error.message);
        };
    };

    chatApp.prototype.generateUUID = function () {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });

        if (this.UUIDhistory.indexOf(uuid) !== -1) {
            uuid = this.generateUUID();
        } else {
            this.UUIDhistory.push(uuid);
            if (this.UUIDhistory.length > 100) this.UUIDhistory.splice(0,1); //max 100 element in history
        }
        return uuid;
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = chatApp;
    } else
    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return chatApp;
        });
    }
    // included directly via <script> tag
    else {
        global.chatApp = chatApp;
    }

}(this));