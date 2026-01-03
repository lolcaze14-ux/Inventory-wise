export function createPageUrl(pageName) {
  const routes = {
    'Login': '/login',
    'AdminSignup': '/admin-signup',
    'UserSignup': '/user-signup',
    'InviteUser': '/invite-user',
    'Dashboard': '/dashboard',
    'AdminDashboard': '/admin',
    'Scanner': '/scanner',
    'Transaction': '/transaction',
    'AddProduct': '/add-product',
    'ActivityLog': '/activity-log',
    'AllActivity': '/admin/activity',
  };
  return routes[pageName] || '/login';
}

export function generateBarcode() {
  return 'QR-' + Date.now() + '-' + Math.random().toString(36).substring(7);
}