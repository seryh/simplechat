var _ = require('underscore');

var wsObserver = function() {
    this.users = {};
};

wsObserver.prototype.emit = function(socket, event, data) {
    data = (data === undefined) ? null : data;
    return socket.send(JSON.stringify([event, data]));
};

wsObserver.prototype.countUsers = function() {
    return Object.keys(this.users).length;
};

wsObserver.prototype.Events = {
    'setNick': function(nick, self) {
        this.nick = nick;
        console.log(self.users);
    }
};

wsObserver.prototype.listener = function() {
    var self = this;

    return function(socket) {
        var _user = {
                'id':  _.uniqueId(),
                'nick': null,
                'socket': socket
            };

        self.users[_user.id] = _user;

        var _emit = function(event, data) {
            return self.emit(socket, event, data);
        };

        socket.on('message', function incoming(json) {
            var dataArray;
            try {
                dataArray = JSON.parse(json);
                if( dataArray &&
                    Object.prototype.toString.call( dataArray ) === '[object Array]' &&
                    dataArray.length === 2 ) {

                    var event = dataArray[0],
                        data = dataArray[1];

                    if ( !Boolean(self.Events[event]) ) return false;

                    self.Events[event].call(_user, data, self);

                } else {
                    _emit('error', 'invalid data');
                }
            } catch (er) {
                _emit('error', er.message);
            }
        });

        socket.on('close', function close() {
            delete self.users[_user.id];
            //console.log('disconnect countUsers:', self.countUsers());
        });
    };
};

wsObserver.prototype.broadcast = function(event, data) {
    var self = this;
    _.each(self.users, function(user) {
        self.emit(user.socket, event, data);
    });
};

module.exports = wsObserver;