// import React from 'react';
// import SecurityDashboard from './components/Dashboard';
// import { gapi } from 'gapi-script';

// function App() {
//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-6">Email Security Dashboard</h1>
//       <SecurityDashboard gapi={gapi} />
//     </div>
//   );
// }

// export default App;

import React from 'react';
import SecurityDashboard from './components/Dashboard';
import { gapi } from 'gapi-script';
import Navbar from './Navbar'; // Import Navbar component

function App() {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto p-4">
        {/* <h1 className="text-4xl font-bold text-center mb-6">Email Security Dashboard</h1> */}
        <SecurityDashboard gapi={gapi} />
      </div>
    </div>
  );
}

export default App;

