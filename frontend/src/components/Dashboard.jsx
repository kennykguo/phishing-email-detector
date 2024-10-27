import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import Gmail from './Gmail';

const calculateRiskScore = (inferenceResults) => {
  if (inferenceResults.length === 0) return 100; // Return full score if no emails
  
  // Count how many emails were identified as phishing
  const phishedCount = inferenceResults.filter(result => result.phishing > result.not_phishing).length;
  
  // Calculate the risk score based on the average number of phished emails
  const averageRiskScore = Math.max(0, 100 - (phishedCount * 10)); // Decrease score by 10 for each phished email
  
  return phishedCount / inferenceResults.length * 100;
};

function SecurityDashboard({ gapi }) {
  const [riskScore, setRiskScore] = useState(0);
  const [activeView, setActiveView] = useState('overview');
  const [patterns, setPatterns] = useState([]);
  const [firstTimeSenders, setFirstTimeSenders] = useState([]);
  const [emails, setEmails] = useState([]);
  const [inferenceResults, setInferenceResults] = useState([]);

  const handleEmailsReceived = async (messages) => {
    const processedEmails = await Promise.all(messages.map(async (message) => {
      try {
        const response = await gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const email = response.result;
        const headers = email.payload.headers;
        const rawText = getEmailBodyText(email.payload); // Extract raw text

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
      analyzeEmails(validEmails);
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
      setRiskScore(calculateRiskScore(results)); // Update risk score based on inference results
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
          {['overview', 'quiz', 'patterns'].map((view) => (
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

        {activeView === 'quiz' && <SecurityQuiz />}

        {/* Inference Results */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-blue-400" />
              Email Analysis Results
            </h2>
            <div className="grid gap-4">
              {emails.map((email, index) => {
                const result = inferenceResults[index];
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityDashboard;
