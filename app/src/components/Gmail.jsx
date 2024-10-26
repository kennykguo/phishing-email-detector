import React, { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';

// Configuration constants
// Replace with your actual Client ID and API key
const CLIENT_ID = '284401762274-9japsbb9v3n35hgqupkrg8j9fnhpbvub.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAkHZSjjDzvwI5QZdyDJt0Lkkf4Ij_dZ9o';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
const MAX_EMAILS = 10; // Easily adjustable number of emails to display

function Gmail() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
        scope: SCOPES,
      }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance();
        setIsSignedIn(authInstance.isSignedIn.get());
        authInstance.isSignedIn.listen(setIsSignedIn);
      });
    };

    gapi.load('client:auth2', initClient);
  }, []);

  const handleSignIn = () => {
    gapi.auth2.getAuthInstance().signIn();
  };

  const handleSignOut = () => {
    gapi.auth2.getAuthInstance().signOut();
    setEmails([]);
  };

  const fetchEmails = async () => {
    if (isSignedIn) {
      const response = await gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: MAX_EMAILS,
      });

      const messages = await Promise.all(
        response.result.messages.map(async (msg) => {
          const msgDetails = await gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
          });

          // Extract relevant information
          const headers = msgDetails.result.payload.headers;
          const senderInfo = headers.find(header => header.name === 'From');
          const subject = headers.find(header => header.name === 'Subject');
          const date = headers.find(header => header.name === 'Date');

          return {
            snippet: msgDetails.result.snippet,
            sender: senderInfo ? senderInfo.value : 'Unknown',
            subject: subject ? subject.value : 'No subject',
            date: date ? date.value : 'Unknown date',
          };
        })
      );

      setEmails(messages);
    }
  };

  return (
    <div>
      {isSignedIn ? (
        <>
          <button onClick={handleSignOut}>Sign Out</button>
          <button onClick={fetchEmails}>Fetch Emails</button>
          <ul>
            {emails.map((email, index) => (
              <li key={index}>
                <p><strong>Sender:</strong> {email.sender}</p>
                <p><strong>Subject:</strong> {email.subject}</p>
                <p><strong>Date:</strong> {email.date}</p>
                <p><strong>Snippet:</strong> {email.snippet}</p>
                <hr />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button onClick={handleSignIn}>Sign In with Google</button>
      )}
    </div>
  );
}

export default Gmail;
