### Inspiration
Originally, we were interested in learning more about neural networks and using their pattern recognition capabilities to detect threats that humans might overlook. After brainstorming, we realized that a phishing email detector would be ideal since it can use the context from a large dataset of phishing and legitimate emails to detect fraud.

### What It Does
Our web application allows users to sign in with their personal Gmail accounts and lets our program analyze the legitimacy of their recent emails without storing any information in a database. If our model detects a suspicious email, the user is alerted to be cautious. Currently, the model achieves 95% accuracy on unseen data.

### How We Built It
We trained a neural network using Google Colab and Kaggle. First, we processed the data from a .csv file by removing unreadable characters and excluding stop words, allowing our program to focus on key phrases like "free," "credit card," and "prince" instead of common words like "the," "with," and "him."

Next, the program tokenizes the email content and maps it to a 128-dimensional list, helping to recognize synonyms or similar terms. We then designed our model architecture specifically for natural language processing (NLP) and trained it. Afterward, we created a testing loop to evaluate accuracy.

To make our model user-friendly, we integrated it into a web application with React as the front end and Flask as the backend. The app allows users to log in via Gmail, uses the Gmail API to fetch recent emails, and applies the model to confirm each email’s legitimacy.

### Challenges We Ran Into
Choosing the right model architecture was challenging, as NLP was new to us.
Processing data was problematic due to some rows containing invalid characters, initially breaking our parser.
The Gmail API initially limited us to snippets, leading to inconclusive results because the emails were too short.
### Accomplishments We’re Proud Of
Security: We designed our application to avoid storing emails, minimizing security risks.
Accuracy: The model performed better than expected, identifying DevPost emails as legitimate and detecting a “wealthy British investor” email as phishing.
User Integration: Users don’t need to copy-paste emails; simply log in and view results.
Learning: Machine learning can be complex, but we gained a solid understanding of each program step.
### What We Learned
Processing and preparing unstructured data from Kaggle.
Full-stack development with React and Flask.
Training a neural network in Google Colab and understanding the fundamentals.
### What's Next for Our Project
With phishing and legitimate emails identified, we aim to detect deeper trends. For example, we could implement blacklists for emails that are consistently flagged for phishing or spam.

### Built With
Flask
Google
JavaScript
Kaggle
Machine Learning
Python
PyTorch
React
