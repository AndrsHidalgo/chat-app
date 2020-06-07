const http = require('http')
const socketio = require('socket.io')
const app = require('./app')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { getUsersInRoom, addUser, getUser, removeUser } = require('./utils/users')
const Filter = require('bad-words')

const server = http.createServer(app)
const port = process.env.PORT
const io = socketio(server)

io.on('connection', (socket) => {
    console.log("New WebSocket connection")
    
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if(error)
            return callback(error)

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome to Chap App!'))
        
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${ user.username } has joined!`))
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('SendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        
        if(filter.isProfane(message))
            return callback('Profanity is not allowed!')

        io.to(user.room).emit('message', generateMessage(user.username, message))
        
        callback()
    })

    socket.on('sendLocation', ({ latitude, longitude }, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('location', generateLocationMessage(user.username, `https://www.google.com/maps?q=${latitude},${longitude}`))
        
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${ user.username } has left!`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

/**Server UP!*/
server.listen(port, () => console.log(`Server is up on port ${ port }`))     