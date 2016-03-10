var _ = require('underscore');

var _protocol = {
    isValidProtocol : function (data) {
        return (data &&
                Object.prototype.toString.call( data ) === '[object Array]' &&
                (data.length === 2 || data.length === 3))
    },
    /**
     * @param {Array} dataArray - [Event, data, UUID]
     * @return {Object}
     */
    parseData : function(dataArray) {
        if( !this.isValidProtocol(dataArray) ) return false;
        return {
            event : dataArray[0],
            data : dataArray[1],
            uuid : dataArray[2] || null,
            user: null
        }
    }
};

var wsObserver = function() {
    this.users = {};
    this.messages = [];
    this._protocol = _protocol;
};

wsObserver.prototype.emit = function(socket, event, data, uuid) {
    data = (data === undefined) ? null : data;
    return socket.send(JSON.stringify([event, data, uuid]));
};

wsObserver.prototype.countUsers = function() {
    return Object.keys(this.users).length;
};

wsObserver.prototype.onJoinUser = function(nick) {
    this.broadcast('join', nick)
};

wsObserver.prototype.onLeftUser = function(nick) {
    this.broadcast('left', nick)
};

wsObserver.prototype.Events = {
    'message': function(req, respond) {
        if (!req.user.nick) {
            respond({error: 'ошибка доступа'});
            return false;
        }

        var self = this,
            msgData = {
                date: new Date(),
                nick: req.user.nick,
                msg: _.escape(req.data)
            };

        self.messages.push(msgData);
        self.broadcast('newMessage', msgData);
        self.messages =_.sortBy(self.messages, function(o) { return o.date; });

        if (self.messages.length > 100) { //храним только последние 100 сообщений
            self.messages = self.messages.slice(1, self.messages.length.length);
        }
    },
    'getUsers': function(req, respond) {
        if (!req.user.nick) {
            respond({error: 'ошибка доступа'});
            return false;
        }
        var self = this;
        respond({result: _.chain(self.users)
                            .filter(function(user){ return user.nick !== null; })
                            .map(function(user){ return {nick: user.nick} })
                            .value() });
    },
    'getMessages': function(req, respond) {
        if (!req.user.nick) return false;
        var self = this;
        respond({result: self.messages});
    },
    'setNick': function(req, respond) {
        var self = this;

        var findNick = _.where(self.users, {'nick':req.data});

        if (findNick.length) {
            respond({error: 'Этот псевдоним уже занят, введите другой'});
            return false;
        }

        req.user.nick = req.data;
        respond({result: true});
        self.onJoinUser( req.user.nick );
    }
};

wsObserver.prototype.listener = function() {
    var self = this;

    return function(socket) {
        var _user = {
                'id':  _.uniqueId(),
                'nick': null,
                'socket': socket,
                'emit' : function(event, data, uuid) {
                    uuid = (uuid === undefined) ? null : uuid;
                    return self.emit(this.socket, event, data, uuid);
                }
            };

        self.users[_user.id] = _user;

        socket.on('message', function incoming(json) {
            var dataArray;
            try {
                dataArray = JSON.parse(json);
                if( _protocol.isValidProtocol(dataArray) ) {
                    var req =_protocol.parseData(dataArray);
                    req.user = _user;

                    if ( !Boolean(self.Events[req.event]) ) return false;

                    self.Events[req.event].call(self, req, function respond(data) {
                        return req.user.emit('response', data, req.uuid);
                    });

                } else {
                    _user.emit('error', 'invalid data');
                }
            } catch (er) {
                _user.emit('error', er.message);
            }
        });

        socket.on('close', function close() {
            delete self.users[_user.id];
            self.onLeftUser( _user.nick );
            //console.log('disconnect countUsers:', self.countUsers());
        });
    };
};

wsObserver.prototype.broadcast = function(event, data) {
    var self = this;
    _.each(self.users, function(user) {
        if (Boolean(user.nick))
            self.emit(user.socket, event, data);
    });
};

module.exports = wsObserver;