// Got tired of getting burned by Socket.IO.  This is a very small subset
// of what Socket.IO did, using WebSockets which is supported in most
// popular browsers.


var socket = (function() {

    // We keep all data private except the object ws which we return.

    var url = location.protocol.replace(/^http/, 'ws') +
        '//' + location.hostname + ':' + location.port + '/';
    var ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    var onCallbacks = {};

    // This calls the function from 
    // ws.on('messageName', function(arg1, arg2, ...) {})
    // Similar to Socket.IO
    ws.onmessage = function(ev) {

        //console.log('WebSocket message:\n  ' + ev.data);

        // We assume that the data is in a json string like so:
        // ev.data =  { name: messageName, args:  [ {}, {}, {}, ... ] }

        var obj = JSON.parse(ev.data);
        var name = obj.name;
        if(name === undefined || obj.args === undefined ||
                !(obj.args instanceof Array)) {
            Fail('Bad WebSocket "on" message from ' +
                    ws.url + '\n  ' + ev.data);
            return;
        }
        if(onCallbacks[name] === undefined) {
            Fail('WebSocket on callback "' + name +
                    '" not found for message from ' + ws.url + ':' +
                    '\n  ' + ev.data);
            return;
        }
        if(typeof onCallbacks[name] === 'function')
            onCallbacks[name](...obj.args);
        else if(onCallbacks[name] instanceof Array)
            // Call a bunch of functions
            onCallbacks[name].forEach(
                    function(func){ func(...obj.args); });
        else
            Fail('Bad callbacks: ' + onCallbacks[name]);
    };

    ws.onopen = function(ev) {

        console.log('WebSocket  opened ' + ws.url);
    };

    // Like socket.IO emit()
    ws.emit = function() {

        var args = [].slice.call(arguments);
        var name = args.shift();
        ws.send(JSON.stringify({ name: name, args: args }));
    };

    ws.onclose = function(ev) {

        console.log('WebSocket  closed ' + ws.url);
        socket.close();
        socket = null;
        ws = null;
    };

    ws.onerror = function(ev) {

        Fail('WebSocket ' + ws.url + ' errored: ' + ev.data);
    };

    ws.on = function(name, func) {

        if(onCallbacks[name] === undefined) {
            onCallbacks[name] = func;
            return;
        }
        // We have one already so lets add another
        if(onCallbacks[name] instanceof Array) {
            onCallbacks[name].push(func);
        } else {
            onCallbacks[name] = [onCallbacks[name]];
            onCallbacks[name].push(func);
        }
    };

    return ws;
})();


// Just a test.
socket.on('connect', function(mesg) {
    console.log('from: ' + socket.url + ' got message: ' + mesg);
});
