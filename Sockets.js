
module.exports = function(server) {
    var io = require('socket.io')(server)
    function getAllRoomMembers(room, _nsp) {
        var roomMembers = []
        
        // Make an array of sockets in room
        if (io.nsps['/'].adapter.rooms[room]) {
            for( var member in io.nsps['/'].adapter.rooms[room].sockets ) {
                roomMembers.push(member)
            }
        }

        return roomMembers
    }

    //wires socket.io for sessions
    var sessionObjs = {}
    io.on('connection', function(socket) {
        var thisSessionId
        var thisUserId

        socket.on('newSession', function(session) {
            thisSessionId = session.id
            thisUserId = session.user
            // Join rooms based on Session ID
            socket.join(thisSessionId, function() {
                io.to(thisSessionId).emit('liveUsers', getAllRoomMembers(thisSessionId).length)
            })
            
        })

        socket.on('disconnect', function() {
            io.to(thisSessionId).emit('liveUsers', getAllRoomMembers(thisSessionId).length)
        })

        socket.on('manualDisconnect', function(session) {
            socket.leave(session.id, function() {
                io.to(thisSessionId).emit('liveUsers', getAllRoomMembers(thisSessionId).length)
            })
        })

        // Deprecated
        socket.on('deleteComment', function(comment) {
            io.to(thisSessionId).emit('deleteComment', comment)
        })

        // Deprecated
        socket.on('addComment', function(comment) {
            io.to(thisSessionId).emit('addComment', comment)
        })

        // Support ADD, DELETE, or UPDATE
        // @param commentUpdate: any { comment: commentObj, action: 'ADD', projectId: PROJECTID }
        socket.on('updateComment', function(commentUpdate) {
            io.to(commentUpdate.projectId).emit('updateComment', commentUpdate)
        })
    })
}
