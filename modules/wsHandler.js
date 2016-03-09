module.exports = function(ws) {
    console.log('ws connect');

    var _emit = function(event, data) {
        data = (data === undefined) ? null : data;
        return ws.send(JSON.stringify([event, data]));
    };

    ws.on('message', function incoming(json) {
        var data;
        try {
            console.log('->', json);
            data = JSON.parse(json);
            if( data
                && Object.prototype.toString.call( data ) === '[object Array]'
                && data.length === 2 ) {

                console.log('->', json);
            } else {
                _emit('error', 'invalid data');
            }
        } catch (er) {
            _emit('error', er.message);
        }
    });

    ws.send('something');
};