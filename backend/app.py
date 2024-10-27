from flask import Flask, request, jsonify
import torch
from model import NanoTransformer  # Import your model class from model.py
from utils import preprocess_text, tokenize_and_prepare_single
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


# Check for available device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")
# Assuming the following values based on your dataset and requirements
vocab_size = 120833  # Number of unique tokens from your vectorizer
output_size = 2  # For binary classification
hidden_size = 128  # Default hidden size
num_heads = 4  # Default number of heads
max_seq_length = 256


# Load the trained model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = NanoTransformer(num_emb=vocab_size, output_size=output_size, hidden_size=hidden_size, num_heads=num_heads)
model = model.to(device)
model.load_state_dict(torch.load('model_weights.pth', map_location=device))
model.eval()  # Set the model to evaluation mode

@app.route('/api/inference', methods=['POST'])
def inference():
    data = request.json
    email_body = data.get('email_body')

    if email_body:
        processed_text = preprocess_text(email_body)
        input_tensor = tokenize_and_prepare_single(processed_text)
        
        with torch.no_grad():
            output = model(input_tensor.to(device))
            output = output[:, 0, :]
        
        result = torch.nn.functional.softmax(output, dim=1).cpu().numpy().tolist()

        response = {
            "not_phishing": result[0][0],
            "phishing": result[0][1]
        }
        return jsonify(response), 200
    else:
        return jsonify({"error": "No email body provided"}), 400

if __name__ == '__main__':
    app.run(debug=True)
