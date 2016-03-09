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

wsObserver.prototype.listener = function() {
    var self = this;

    return function(socket) {
        var _user = {
                'id':  _.uniqueId(),
                'socket': socket
            };

        self.users[_user.id] = _user;

        var _emit = function(event, data) {
            return self.emit(socket, event, data);
        };

        socket.on('message', function incoming(json) {
            var data;
            try {
                data = JSON.parse(json);
                if( data &&
                    Object.prototype.toString.call( data ) === '[object Array]' &&
                    data.length === 2 ) {

                    console.log('->', data);
                    console.log('countUsers:', self.countUsers());
                } else {
                    _emit('error', 'invalid data');
                }
            } catch (er) {
                _emit('error', er.message);
            }
        });

        socket.on('close', function close() {
            delete self.users[_user.id];
            console.log('disconnect countUsers:', self.countUsers());
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