// Demo Application Logic
console.log('App initialization started');

// Simulating a component list render
function renderItemList() {
  const items = [
    { id: 1, name: 'Analytics Module' },
    { id: 2, name: 'Security Suite' },
    { id: 3, name: 'Workflow Automator' }
  ];

  // Intentionally trigger a React-like console warning for demonstration
  console.warn('Warning: Each child in a list should have a unique "key" prop.');

  return items;
}

// Insecure storage demonstration (for SAST & VAPT scanning)
function saveUserSession(user) {
  // SAST scanner should flag storing auth token in localStorage!
  localStorage.setItem('auth_token', 'demo-jwt-sample-token');
}

renderItemList();

