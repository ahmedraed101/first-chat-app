const generateMessage = (username, text) => ({
  username,
  text,
  createdAt: new Date().getTime(),
});

const generateLocationMessage = (username, latitude, longitude) => ({
  username,
  url: `https://www.google.com/maps/place/${latitude},${longitude}`,
  createdAt: new Date().getTime(),
});

module.exports = { generateMessage, generateLocationMessage };
