
module.exports = function(server) {
    var io = require('socket.io')(server);
    
    //wires socket.io for sessions
    var sessionObjs = {};

    io.on('connection', function(socket) {
        var thisSessionId;
        var thisUserId;

        function checkForAliveSessions(sessionId) {
            console.log("CHECKING!!!");
            console.log(sessionId);
            console.log(sessionObjs[sessionId]);
            if (sessionObjs[sessionId].length > 0) {
                var purgatory;

                // Ask all in session to report back
                io.to(sessionId).emit('areYouAlive');

                // Clone: Set aside all current listed user ids
                purgatory = sessionObjs[sessionId].slice();

                // Respond to those that report back
                socket.on('stillAlive', function(session) {
                    console.log('Still alive!');
                    console.log(session.user);
                    var thisUserId = session.user;
                    var purgInd = purgatory.indexOf(thisUserId);
                    if (purgInd > -1) {
                        purgatory.splice(purgInd, 1);
                    }
                    console.log('Purgatory left:');
                    console.log(purgatory);
                });

                setTimeout(function() {
                    // Clear out ids left in purgatory
                    console.log("Remove ids:");
                    console.log(purgatory);
                    for (var i =0; i < purgatory.length; i++) {
                        var idInd = sessionObjs[sessionId].indexOf( purgatory[i] );
                        if (idInd > -1) {
                            sessionObjs[sessionId].splice(idInd, 1);
                        }
                    }

                    // Emit check again
                    checkForAliveSessions(sessionId);
                }, 2000);
            } else {
                // stop checking
            }
        }

        socket.on('newSession', function(session) {
            thisSessionId = session.id;
            thisUserId = session.user;
            socket.join(thisSessionId);

            if (!sessionObjs[thisSessionId] || sessionObjs[thisSessionId].length < 1) {
                sessionObjs[thisSessionId] = [thisUserId];
                checkForAliveSessions(thisSessionId);
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

