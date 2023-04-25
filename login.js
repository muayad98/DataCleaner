document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (username === 'admin' && password === 'admin') {
    window.location.href = 'popup.html';
  } else {
    document.getElementById('errorMessage').textContent = 'Invalid username or password';
  }
});
