
module.exports = function(server) {
    var io = require('socket.io')(server);
    
    //wires socket.io for sessions
    var sessionObjs = {};
    io.on('connection', function(socket) {
        var thisSessionId;
        var thisUserId;

        socket.on('newSession', function(session) {
            thisSessionId = session.id;
            thisUserId = session.user;
            socket.join(thisSessionId);

            if (!sessionObjs[thisSessionId]) {
                sessionObjs[thisSessionId] = [thisUserId];
            } else if (sessionObjs[thisSessionId].indexOf(thisUserId) < 0) {
                sessionObjs[thisSessionId].push(thisUserId);
            }
            io.to(thisSessionId).emit('liveUsers',sessionObjs[thisSessionId].length);
        });

        socket.on('disconnect', function() {
            var returnCount = 0;
            if (sessionObjs[thisSessionId]) {
                var i = sessionObjs[thisSessionId].indexOf(thisUserId);
                if (i > -1) {
                    sessionObjs[thisSessionId].splice(i, 1);
                }
                returnCount = sessionObjs[thisSessionId].length;
            }
            io.to(thisSessionId).emit('liveUsers', returnCount);
        });

        socket.on('manualDisconnect', function() {
            var returnCount = 0;
            if (sessionObjs[thisSessionId]) {
                var i = sessionObjs[thisSessionId].indexOf(thisUserId);
                if (i > -1) {
                    sessionObjs[thisSessionId].splice(i, 1);
                }
                returnCount = sessionObjs[thisSessionId].length;
            }
            io.to(thisSessionId).emit('liveUsers', returnCount);
        });

        socket.on('deleteComment', function(comment) {
            io.to(thisSessionId).emit('deleteComment', comment);
        });

        socket.on('addComment', function(comment) {
            io.to(thisSessionId).emit('addComment', comment);
        });
    });
}

