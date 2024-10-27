import torch
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import pickle

# Download required NLTK data files
nltk.download('stopwords')
nltk.download('punkt')

# Define special tokens and MAX_SEQ_LENGTH
START_TOKEN = '<start>'
END_TOKEN = '<end>'
PADDING_TOKEN = '<pad>'
MAX_SEQ_LENGTH = 256

# Load the word-to-index mapping
with open('word_to_index.pkl', 'rb') as f:
    word_to_index = pickle.load(f)

def clean_email(email):
    """Converts email text to lowercase."""
    return email.lower()

def preprocess_text(text):
    """
    Preprocesses text by removing stop words.
    
    Args:
        text (str): The text to preprocess.

    Returns:
        str: The processed text with stop words removed.
    """
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(text)
    
    # Filter out stop words and convert to lowercase
    filtered_words = [word.lower() for word in words if word.lower() not in stop_words]
    
    # Join the filtered words back into a string
    processed_text = ' '.join(filtered_words)
    
    return processed_text

def tokenize_and_prepare_single(email):
    """
    Tokenizes and prepares a single email for model input.
    
    Args:
        email (str): The email to tokenize and prepare.

    Returns:
        torch.Tensor: The tensor representation of the tokenized email.
    """
    # Clean and preprocess the email
    cleaned_email = clean_email(email)
    preprocessed_email = preprocess_text(cleaned_email)  # Ensure the email is preprocessed
    print(preprocessed_email)

    # Tokenize and add special tokens
    tokens = [START_TOKEN] + word_tokenize(preprocessed_email) + [END_TOKEN]
    # print(len(tokens), " = = = = = = == = =  = = =")
    # Truncate or pad to MAX_SEQ_LENGTH
    if len(tokens) > MAX_SEQ_LENGTH:
        tokens = tokens[:MAX_SEQ_LENGTH]
    else:
        tokens += [PADDING_TOKEN] * (MAX_SEQ_LENGTH - len(tokens))
    print(len(tokens), " = = = = = = == = =  = = =")

    # Convert tokens to indices
    index_sequence = [word_to_index.get(token, word_to_index[PADDING_TOKEN]) for token in tokens]
    
    # Convert to tensor of shape (1, T)
    tensor_sequence = torch.tensor(index_sequence).unsqueeze(0)
    
    return tensor_sequence
