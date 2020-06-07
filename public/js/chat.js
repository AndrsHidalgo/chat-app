const socket = io()
//Elements
const $form = document.querySelector('form'),
    $message = $form.querySelector('#input-message'),
    $sendMessage = $form.querySelector('#btn-message'),
    $location = document.querySelector('#btn-location'),
    $messages = document.querySelector('#messages')
    //$sidebar = document.querySelector('#sidebar')

//Template
const templateMessage = document.querySelector('#template-message').innerHTML,
    templateLocation = document.querySelector('#template-location').innerHTML,
    templateSidebar = document.querySelector('#template-sidebar').innerHTML

//Options 
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscrool = () => {
    const $newMessage = $messages.lastElementChild,
        newMessageStyles = getComputedStyle($newMessage),
        newMessageMargin = parseInt(newMessageStyles.marginBottom)
        newMessageHeight = $newMessage.offsetHeight * newMessageMargin,
        visibleHeight = $messages.offsetHeight,
        containerHeight = $messages.scrollHeight,
        scrollOffset = $messages.scrollTop + visibleHeight

        if(containerHeight - newMessageHeight <= scrollOffset)
            $messages.scrollTop = $messages.scrollHeight

}

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

socket.on('message', (message) => {
    console.log(message)
    
    const html = Mustache.render(templateMessage, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)

    autoscrool()
})

socket.on('location', (message) => {
    console.log(message)

    const html = Mustache.render(templateLocation, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)

    autoscrool()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(templateSidebar, { room, users })

    //$sidebar.insertAdjacentHTML('beforeend', html)
    document.querySelector('#sidebar').innerHTML = html
})

$form.addEventListener('submit', (e) => {
    e.preventDefault()

    $sendMessage.setAttribute('disabled', 'disabled')

    socket.emit('SendMessage', $message.value, (error) => {
        $sendMessage.removeAttribute('disabled')
        $message.value = ''
        $message.focus()

        if(error)
            return console.log('Error!', error)
            
        console.log('Success! The message was delivered.')
    })
})

$location.addEventListener('click', () => {
    if(!navigator.geolocation)
        return alert('Geolocation is not supported by your browser.')

    $location.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        socket.emit('sendLocation', { latitude, longitude }, (error) => {
            $location.removeAttribute('disabled')

            if(error)
                return console.log('Error!', error)
                
            console.log('Success! Location shared.')
        })
    })
})