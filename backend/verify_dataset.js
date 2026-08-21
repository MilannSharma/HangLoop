const fs = require('fs');

// Verification helper using YouTube oEmbed
async function verifyVideoId(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (res.ok) {
      const data = await res.json();
      return { playable: true, title: data.title, author: data.author_name };
    }
    return { playable: false };
  } catch (e) {
    return { playable: false, error: e.message };
  }
}

console.log('Script initialized for verification.');
