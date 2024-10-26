import React from 'react';
import SecurityDashboard from './components/Dashboard';
import { gapi } from 'gapi-script';

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Email Security Dashboard</h1>
      <SecurityDashboard gapi={gapi} />
    </div>
  );
}

export default App;