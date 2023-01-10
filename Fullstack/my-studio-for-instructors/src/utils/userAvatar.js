const getUserAvatar = username => {
  if (!username) return null;
  const arr = username.split(' ');
  let letters = null;
  if (arr.length === 1) letters = username[0].toUpperCase();
  else letters = (arr[0][0] + arr[1][0]).toUpperCase();
  return {
    letters,
    color: toColor(letters)
  };
};

const toColor = txt => {
  const len = txt && txt.length;
  if (!len) {
    return '#3498DB';
  }

  let hash = 0;
  for (let i = 0; i < len; i++) {
    hash = txt.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  return `hsl(${h}, 50%, 65%)`;
};

export default getUserAvatar;
