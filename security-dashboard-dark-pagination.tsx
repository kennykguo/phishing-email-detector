import React, { useState } from 'react';
import { AlertTriangle, Shield, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Gmail from './Gmail';

const EMAILS_PER_PAGE = 10;

const calculateRiskScore = (inferenceResults) => {
  if (inferenceResults.length === 0) return 100;
  const phishedCount = inferenceResults.filter(result => result.phishing > result.not_phishing).length;
  return Math.max(0, 100 - (phishedCount / inferenceResults.length * 100));
};

function SecurityDashboard({ gapi }) {
  const [riskScore, setRiskScore] = useState(0);
  const [activeView, setActiveView] = useState('overview');
  const [patterns, setPatterns] = useState([]);
  const [firstTimeSenders, setFirstTimeSenders] = useState([]);
  const [emails, setEmails] = useState([]);
  const [inferenceResults, setInferenceResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  

  // Calculate total pages
  const totalEmails = emails.length;
  const totalPages = Math.ceil(totalEmails / EMAILS_PER_PAGE);


  
  // Filter and sort emails
  const filteredEmails = emails.filter(email => {
    const searchLower = searchTerm.toLowerCase();
    return (
      email.sender.toLowerCase().includes(searchLower) ||
      email.subject.toLowerCase().includes(searchLower) ||
      email.snippet.toLowerCase().includes(searchLower)
    );
  });

  
  const sortedEmails = [...filteredEmails].sort((a, b) => {
    switch (sortField) {
      case 'date':
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      case 'sender':
        return sortDirection === 'asc' 
          ? a.sender.localeCompare(b.sender)
          : b.sender.localeCompare(a.sender);
      case 'subject':
        return sortDirection === 'asc'
          ? a.subject.localeCompare(b.subject)
          : b.subject.localeCompare(a.subject);
      default:
        return 0;
    }
  });

  // Get current page emails
  const indexOfLastEmail = currentPage * EMAILS_PER_PAGE;
  const indexOfFirstEmail = indexOfLastEmail - EMAILS_PER_PAGE;
  const currentEmails = sortedEmails.slice(indexOfFirstEmail, indexOfLastEmail);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Keep existing functions unchanged...
  
  return (
    <div className="min-h-screen bg-gray-900 p-6 text-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Previous sections remain unchanged */}

        {/* Email Analysis Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-400" />
                Email Analysis Results
              </h2>
              <div className="flex items-center gap-4">
                <input
                  type="search"
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-400 text-sm">
                  {filteredEmails.length} emails found
                </span>
              </div>
            </div>

            {/* Table Header */}
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th 
                      className="px-4 py-3 text-left cursor-pointer hover:bg-gray-600"
                      onClick={() => toggleSort('sender')}
                    >
                      <div className="flex items-center gap-2">
                        Sender
                        {sortField === 'sender' && (
                          <span className="text-blue-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer hover:bg-gray-600"
                      onClick={() => toggleSort('subject')}
                    >
                      <div className="flex items-center gap-2">
                        Subject
                        {sortField === 'subject' && (
                          <span className="text-blue-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer hover:bg-gray-600"
                      onClick={() => toggleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {sortField === 'date' && (
                          <span className="text-blue-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmails.map((email, index) => {
                    const result = inferenceResults[emails.indexOf(email)];
                    const isPhishing = result && result.phishing > result.not_phishing;
                    return (
                      <tr 
                        key={email.id || index}
                        className={`border-t border-gray-700 ${
                          isPhishing 
                            ? 'bg-red-900/20 hover:bg-red-900/30' 
                            : 'hover:bg-gray-700/50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{email.sender}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{email.subject}</div>
                          <div className="text-sm text-gray-400 line-clamp-1">
                            {email.snippet}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(email.date).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isPhishing 
                              ? 'bg-red-900 text-red-300' 
                              : 'bg-green-900 text-green-300'
                          }`}>
                            {isPhishing ? 'Potential Threat' : 'Safe'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="text-gray-400">
                Showing {indexOfFirstEmail + 1}-{Math.min(indexOfLastEmail, filteredEmails.length)} of {filteredEmails.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = currentPage <= 3
                    ? i + 1
                    : currentPage >= totalPages - 2
                      ? totalPages - 4 + i
                      : currentPage - 2 + i;
                  
                  if (pageNumber > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityDashboard;
