import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import Gmail from './Gmail';

const calculateRiskScore = (emails) => {
  let score = 100;
  emails.forEach(email => {
    if (email.sender.includes('unknown')) score -= 10;
    if (email.subject.toLowerCase().includes('urgent')) score -= 5;
    if (email.snippet.toLowerCase().includes('password')) score -= 15;
  });
  return Math.max(0, score);
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
        
        return {
          id: email.id,
          sender: headers.find(h => h.name === 'From')?.value || 'unknown',
          subject: headers.find(h => h.name === 'Subject')?.value || '(no subject)',
          date: headers.find(h => h.name === 'Date')?.value || '',
          snippet: email.snippet || ''
        };
      } catch (error) {
        console.error('Error processing email:', error);
        return null;
      }
    }));

    const validEmails = processedEmails.filter(email => email !== null);
    setEmails(validEmails);
    
    if (validEmails.length > 0) {
      setRiskScore(calculateRiskScore(validEmails));
      analyzeEmails(validEmails);
    }
  };

  const handleError = (error) => {
    console.error('Gmail error:', error);
  };

  const analyzeEmails = async (emails) => {
    const patternData = {};
    emails.forEach(email => {
      console.log(email);
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

      console.log(results);
      setInferenceResults(results);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <Gmail 
        gapi={gapi}
        onEmailsReceived={handleEmailsReceived}
        onError={handleError}
      />

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

      {activeView === 'quiz' && <SecurityQuiz />}

      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="font-semibold">Inference Results</h2>
        </div>
        <div className="space-y-4 mt-4">
          {emails.map((email, index) => {
            const result = inferenceResults[index];
            const isPhishing = result && result.phishing > result.not_phishing;
            return (
              <div key={index} className={`flex flex-col p-4 border rounded-lg ${isPhishing ? 'bg-red-100' : 'bg-green-100'}`}>
                <div>
                  <p className="font-medium">Sender: {email.sender}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(email.date).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Subject: {email.subject}</p>
                  <p className="text-sm">Preview: {email.snippet}</p>
                  <p className={`text-sm ${isPhishing ? 'text-red-500' : 'text-green-500'}`}>
                    {isPhishing ? 'Phishing Detected' : 'Safe Email'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
                <p className="text-sm text-gray-500">{sender.snippet}</p>
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

function SecurityQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions = [
    { question: "What should you never share?", options: ["Password", "Email"], answer: "Password" },
    { question: "Is it safe to click unknown links?", options: ["Yes", "No"], answer: "No" },
    { question: "Should you verify sender before opening attachments?", options: ["Yes", "No"], answer: "Yes" },
  ];

  const handleAnswer = (option) => {
    if (option === questions[currentQuestion].answer) {
      setScore(score + 1);
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  if (quizCompleted) {
    return (
      <div className="p-4 border rounded-lg">
        <h2 className="font-semibold">Quiz Completed</h2>
        <p>Your score: {score}/{questions.length}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="font-semibold">{questions[currentQuestion].question}</h2>
      <div className="space-y-2 mt-4">
        {questions[currentQuestion].options.map((option, index) => (
          <button 
            key={index} 
            className="px-4 py-2 border rounded hover:bg-gray-200"
            onClick={() => handleAnswer(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SecurityDashboard;