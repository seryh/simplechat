(function () {
    var root = this;

    var _extend = function(obj1, obj2) {
        for(var i in obj2) obj1[i] = obj2[i];
        return obj1;
    };

    var chatApp = function (opt) {
        var self = this;

        self.options = _extend({
            debug: false,
            reconTimeout: 3000
        }, opt);

        self.socket = null;
        self.UUIDhistory = [];

        self.wsOpen();
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
            self.socket.send('test');
        };

        self.socket.onclose = function(event) {
            clearTimeout(_timeout);
            if (self.options.debug)
                console.debug('chatApp.ws:onclose','code: ' + event.code + ' reason: ' + event.reason);
            self.wsOpen();
        };

        self.socket.onmessage = function(event) {
            if (self.options.debug)
                console.debug('chatApp.ws:onmessage',event.data);
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
            if (this.UUIDhistory.length > 100) this.UUIDhistory.splice(0,1); //max 100 element in history,  memory leaks fixed
        }
        return uuid;
    };


    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return chatApp;
        });
    }
    // included directly via <script> tag
    else {
        root.chatApp = chatApp;
    }

}());