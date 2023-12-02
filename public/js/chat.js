const socket = io();

// Ellements
const $messageForm = document.querySelector('#messageForm');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#shareLocation');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector(
  '#location-message-template'
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  // new Message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of the messages container
  const containerHeight = $messages.scrollHeight;

  // how far have i scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', ({ username, text, createdAt }) => {
  const html = Mustache.render(messageTemplate, {
    message: text,
    createdAt: moment(createdAt).format('h:mm a'),
    username,
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('locationMessage', ({ username, url, createdAt }) => {
  const html = Mustache.render(locationMessageTemplate, {
    url,
    createdAt: moment(createdAt).format('h:mm a'),
    username,
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ users, room }) => {
  const html = Mustache.render(sidebarTemplate, { users, room });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');
  const message = e.target.message.value;
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) {
      alert(console.log(error));
    }
  });
});

$sendLocationButton.addEventListener('click', (e) => {
  if (!navigator.geolocation) {
    alert('geolocation is not supported by your browser');
    return;
  }

  e.target.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;

    socket.emit('sendLocation', { latitude, longitude }, (error) => {
      e.target.removeAttribute('disabled');
      if (error) {
        return console.log(error);
      }
      // console.log('location shared successfully!');
    });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
