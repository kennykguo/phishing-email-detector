import torch
import torch.nn as nn

class NanoTransformer(nn.Module):
    """
        This class implements a simplified Transformer model for sequence classification.
        It uses an embedding layer for tokens, learned positional embeddings,
        a Transformer, and a Linear layer.

        num_emb: The number of unique tokens in the vocabulary. (vocab_size)
        output_size: The size of the output layer (number of classes). (2)
        hidden_size: The dimension of the hidden layer in the Transformer block (default: 128)
        num_heads: The number of heads in the multi-head attention layer (default: 4).
    """
    def __init__(self, num_emb, output_size, hidden_size=128, num_heads=4, max_seq_length=256):
        super(NanoTransformer, self).__init__()

        # Create an embedding for each token
        self.embedding = nn.Embedding(num_emb, hidden_size)  # (vocab_size, 128)

        # Learned positional embeddings
        self.pos_embedding = nn.Embedding(max_seq_length, hidden_size)  # (max_seq_length, 128)

        # Multi-head attention
        self.multihead_attn = nn.MultiheadAttention(hidden_size, num_heads=num_heads, batch_first=True)

        # Feed-forward network
        self.mlp = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.LayerNorm(hidden_size),
            nn.ELU(),
            nn.Linear(hidden_size, hidden_size)
        )

        self.fc_out = nn.Linear(hidden_size, output_size)  # (batch_size, 128) -> (batch_size, 2)

    def forward(self, input_seq):
        # (B, 256) 
        batch_size, seq_length = input_seq.shape  # (32, 160)
        # (1, 6, 777, 111 ,... ) # 0 - LENGTH OF THE VOCABULARY DICTIONARY
        input_embs = self.embedding(input_seq)  # (32, 256, 1) -> (32, 256, 128)

        # Create positional indices
        pos_indices = torch.arange(seq_length, device=input_seq.device)  # (128)

        pos_embs = self.pos_embedding(pos_indices).unsqueeze(0).expand(batch_size, seq_length, -1)  # (1, 160, 128) -> (32, 160, 128)

        embs = input_embs + pos_embs  # (32, 160, 128) + (32, 160, 128)

        output, attn_map = self.multihead_attn(embs, embs, embs)  # (32, 160, 128)
        # print(output.shape)
        output = self.mlp(output)  # (32, 256, 128) @ (128, 2) (32, 160, 2)
        return self.fc_out(output)  # (32, 160, 2)
