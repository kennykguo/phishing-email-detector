import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import Gmail from './Gmail';

// Utility functions
const calculateRiskScore = (emails) => {
  let score = 100;
  emails.forEach(email => {
    if (email.sender.includes('unknown')) score -= 10;
    if (email.subject.toLowerCase().includes('urgent')) score -= 5;
    if (email.snippet.toLowerCase().includes('password')) score -= 15;
  });
  return Math.max(0, score);
};

// Main Dashboard Component
function SecurityDashboard({ gapi }) {
  const [riskScore, setRiskScore] = useState(0);
  const [activeView, setActiveView] = useState('overview');
  const [patterns, setPatterns] = useState([]);
  const [firstTimeSenders, setFirstTimeSenders] = useState([]);
  const [emails, setEmails] = useState([]);

  // Gmail callback handlers
  const handleEmailsReceived = (receivedEmails) => {
    setEmails(receivedEmails);
    if (receivedEmails.length > 0) {
      setRiskScore(calculateRiskScore(receivedEmails));
      analyzeEmails(receivedEmails);
    }
  };

  const handleError = (error) => {
    console.error('Gmail error:', error);
  };

  const analyzeEmails = (emails) => {
    // Create hourly pattern data
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

    // Find first-time senders
    const newSenders = emails.filter(email => {
      return !email.sender.includes('@trusted-domain.com');
    });
    setFirstTimeSenders(newSenders);
  };

  const moveToFolder = async (emailId, folderName) => {
    try {
      await gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: emailId,
        resource: {
          addLabelIds: [folderName],
        },
      });
    } catch (error) {
      console.error('Error moving email:', error);
    }
  };

  const addLabel = async (emailId, labelName) => {
    try {
      await gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: emailId,
        resource: {
          addLabelIds: [labelName],
        },
      });
    } catch (error) {
      console.error('Error adding label:', error);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Gmail Component */}
      <Gmail 
        gapi={gapi}
        onEmailsReceived={handleEmailsReceived}
        onError={handleError}
      />

      {/* Navigation */}
      <div className="flex gap-4">
        <button 
          className={`px-4 py-2 rounded ${activeView === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveView('overview')}
        >
          Overview
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeView === 'quiz' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveView('quiz')}
        >
          Security Quiz
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeView === 'patterns' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveView('patterns')}
        >
          Email Patterns
        </button>
      </div>

      {/* Risk Score Section */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="font-semibold">Email Security Score</h2>
        </div>
        <div className="text-4xl font-bold mb-4">{riskScore}/100</div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className={`h-2 rounded-full ${
              riskScore > 70 ? 'bg-green-500' : 
              riskScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
      </div>

      {/* Patterns View */}
      {activeView === 'patterns' && (
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold">Email Activity Patterns</h2>
          <div className="h-64 overflow-auto border rounded-lg">
            <div className="p-2">
              {patterns.length === 0 ? (
                <p>No pattern data available.</p>
              ) : (
                <ul>
                  {patterns.map((pattern, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{pattern.hour}</span>
                      <span>{pattern.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz View */}
      {activeView === 'quiz' && <SecurityQuiz />}

      {/* First Time Senders */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="font-semibold">New Senders</h2>
        </div>
        <div className="space-y-4 mt-4">
          {firstTimeSenders.map((sender, index) => (
            <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-medium">{sender.sender}</p>
                <p className="text-sm text-gray-500">{sender.subject}</p>
              </div>
              <div className="space-x-2">
                <button 
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                  onClick={() => moveToFolder(sender.id, 'SPAM')}
                >
                  Move to Spam
                </button>
                <button 
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => addLabel(sender.id, 'SUSPICIOUS')}
                >
                  Mark Suspicious
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Security Quiz Component
function SecurityQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const questions = [
    {
      question: "What's the best action when receiving a suspicious email?",
      options: [
        "Open all attachments",
        "Reply immediately",
        "Report to IT security",
        "Forward to colleagues"
      ],
      correct: 2
    },
    {
      question: "Which email address is most likely to be suspicious?",
      options: [
        "john@company.com",
        "paypal.support@mail.com",
        "support@paypal.com",
        "help@company.com"
      ],
      correct: 1
    }
  ];

  const handleAnswer = (selectedIndex) => {
    if (selectedIndex === questions[currentQuestion].correct) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="font-semibold">Security Awareness Quiz</h2>
      <div className="mt-4">
        {!showResults ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {questions[currentQuestion].question}
            </h3>
            <div className="space-y-2">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  className="w-full p-3 text-left border rounded hover:bg-gray-100"
                  onClick={() => handleAnswer(index)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Quiz Complete!</h3>
            <p>Your Score: {score}/{questions.length}</p>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                setCurrentQuestion(0);
                setScore(0);
                setShowResults(false);
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurityDashboard;