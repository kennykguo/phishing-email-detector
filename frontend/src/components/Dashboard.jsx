import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Search, Clock, Loader } from 'lucide-react';
import Gmail from './Gmail';

const calculateRiskScore = (inferenceResults) => {
  if (inferenceResults.length === 0) return 100;
  const phishedCount = inferenceResults.filter(result => result.phishing > result.not_phishing).length;
  const averageRiskScore = Math.max(0, 100 - (phishedCount * 10));
  console.log(inferenceResults);
  return phishedCount / inferenceResults.length * 100;
};

function SecurityDashboard({ gapi }) {
  const [riskScore, setRiskScore] = useState(0);
  const [activeView, setActiveView] = useState('overview');
  const [patterns, setPatterns] = useState([]);
  const [firstTimeSenders, setFirstTimeSenders] = useState([]);
  const [emails, setEmails] = useState([]);
  const [inferenceResults, setInferenceResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmails, setFilteredEmails] = useState([]);
  const itemsPerPage = 5;

  useEffect(() => {
    const filtered = emails.filter(email =>
      email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.snippet.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmails(filtered);
    setCurrentPage(1);
  }, [searchTerm, emails]);

  const handleEmailsReceived = async (messages) => {
    setIsLoading(true);
    try {
      const processedEmails = await Promise.all(messages.map(async (message) => {
        try {
          const response = await gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          const email = response.result;
          const headers = email.payload.headers;
          const rawText = getEmailBodyText(email.payload);

          return {
            id: email.id,
            sender: headers.find(h => h.name === 'From')?.value || 'unknown',
            subject: headers.find(h => h.name === 'Subject')?.value || '(no subject)',
            date: headers.find(h => h.name === 'Date')?.value || '',
            snippet: rawText || ''
          };
        } catch (error) {
          console.error('Error processing email:', error);
          return null;
        }
      }));

      const validEmails = processedEmails.filter(email => email !== null);
      setEmails(validEmails);
      
      if (validEmails.length > 0) {
        await analyzeEmails(validEmails);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getEmailBodyText = (payload) => {
    const parts = payload.parts || [];
    const htmlPart = parts.find(part => part.mimeType === 'text/html');
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      const htmlContent = decodeBase64(htmlPart.body.data);
      return stripHtml(htmlContent);
    }
    const plainPart = parts.find(part => part.mimeType === 'text/plain');
    if (plainPart && plainPart.body && plainPart.body.data) {
      return decodeBase64(plainPart.body.data);
    }
    return 'No body found';
  };

  const decodeBase64 = (data) => {
    return decodeURIComponent(escape(window.atob(data.replace(/-/g, '+').replace(/_/g, '/'))));
  };

  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const analyzeEmails = async (emails) => {
    setIsAnalyzing(true);
    try {
      const patternData = {};
      emails.forEach(email => {
        const hour = new Date(email.date).getHours();
        patternData[hour] = (patternData[hour] || 0) + 1;
      });

      const patterns = Object.keys(patternData).map(hour => ({
        hour: `${hour}:00`,
        count: patternData[hour],
      }));

      setPatterns(patterns);

      const newSenders = emails.filter(email => {
        return !email.sender.includes('@trusted-domain.com');
      });
      setFirstTimeSenders(newSenders);

      if (emails.length > 0) {
        const results = await Promise.all(emails.map(async (email) => {
          try {
            const response = await fetch('http://127.0.0.1:5000/api/inference', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email_body: email.snippet }),
            });

            if (response.ok) {
              return await response.json();
            } else {
              console.error('Inference error:', response.statusText);
              return null;
            }
          } catch (error) {
            console.error('Network error:', error);
            return null;
          }
        }));

        setInferenceResults(results);
        setRiskScore(calculateRiskScore(results));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMoveToSpam = (emailId) => {
    gapi.client.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      resource: {
        removeLabelIds: [],
        addLabelIds: ['SPAM']
      }
    }).then(() => {
      setFirstTimeSenders(prev => prev.filter(email => email.id !== emailId));
      console.log('Moved to spam:', emailId);
    }).catch(error => {
      console.error('Failed to move to spam:', error);
    });
  };

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmails.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-300">Loading emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Gmail Integration */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <Gmail 
            gapi={gapi}
            onEmailsReceived={handleEmailsReceived}
            onError={(error) => console.error('Gmail error:', error)}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2">
          {['overview'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeView === view
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {/* Security Score Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-400" />
                Email Security Score
              </h2>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center gap-3">
                <Loader className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-gray-400">Analyzing emails...</span>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold text-blue-400">{Math.round(riskScore)}</span>
                  <span className="text-2xl text-gray-500 mb-1">/100</span>
                </div>
                <div className="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      riskScore > 70 ? 'bg-green-500' : 
                      riskScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Patterns View */}
        {activeView === 'patterns' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-400" />
                Email Activity Patterns
              </h2>
              <div className="h-96 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                {patterns.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No pattern data available
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {patterns.map((pattern, index) => (
                      <li key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        <span className="font-medium">{pattern.hour}</span>
                        <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm">
                          {pattern.count} emails
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* {activeView === 'quiz' && <SecurityQuiz />} */}

        {/* Inference Results with Search and Pagination */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-400" />
                  Email Analysis Results
                </h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500 w-64"
                  />
                </div>
              </div>

              {/* Email List */}
              {isAnalyzing ? (
                <div className="flex items-center justify-center p-8">
                  <Loader className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-400">Analyzing emails...</span>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentItems.map((email, index) => {
                    const result = inferenceResults[emails.indexOf(email)];
                    const isPhishing = result && result.phishing > result.not_phishing;
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          isPhishing 
                            ? 'bg-red-900/30 border-red-800 hover:bg-red-900/40' 
                            : 'bg-green-900/30 border-green-800 hover:bg-green-900/40'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-100">{email.sender}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isPhishing 
                                ? 'bg-red-900 text-red-300' 
                                : 'bg-green-900 text-green-300'
                            }`}>
                              {isPhishing ? 'Potential Threat' : 'Safe'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {new Date(email.date).toLocaleString()}
                          </p>
                          <p className="text-sm font-medium text-gray-300">
                            {email.subject}
                          </p>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {email.snippet}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              


            {/* Pagination Controls */}
            {!isAnalyzing && totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  
                  // Always show first page, last page, current page, and one page before and after current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={index}
                        onClick={() => paginate(pageNumber)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                  
                  // Show ellipsis for breaks in sequence
                  if (
                    pageNumber === 2 || 
                    pageNumber === totalPages - 1
                  ) {
                    return (
                      <span
                        key={index}
                        className="px-4 py-2 text-gray-500"
                      >
                        ...
                      </span>
                    );
                  }
                  
                  return null;
                })}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            )}

              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityDashboard;