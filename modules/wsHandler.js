function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

var handler = function(ws) {
    console.log('ws connect');

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    ws.send('something');
};


module.exports = handler;