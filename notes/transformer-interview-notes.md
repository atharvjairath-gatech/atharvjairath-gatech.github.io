# Transformer Interview Notes

Quick revision sheet for attention, code shape checks, and the kind of math that usually shows up in ML interviews.

![Animated desk setup](assets/images/decorative.gif)

## Core Idea

Self-attention lets every token compare itself with every other token. Each token creates a query, key, and value vector:

$$
Q = XW_Q,\quad K = XW_K,\quad V = XW_V
$$

The scaled dot-product attention equation is:

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

The \( \sqrt{d_k} \) term keeps logits from getting too large as dimensionality grows.

## Interview Checks

| Topic | What to Say |
| --- | --- |
| Why attention? | It gives direct token-to-token paths instead of compressing everything through one hidden state. |
| Why multi-head? | Different heads can attend to different relationships in parallel. |
| Complexity | Vanilla attention is \(O(n^2)\) in sequence length because every token compares with every token. |

> A good answer usually connects the equation to shapes, not just intuition.

## Shape Debugging

```python
import torch

batch, tokens, model_dim, heads = 2, 8, 64, 4
head_dim = model_dim // heads

x = torch.randn(batch, tokens, model_dim)
q = x.view(batch, tokens, heads, head_dim).transpose(1, 2)
k = x.view(batch, tokens, heads, head_dim).transpose(1, 2)
v = x.view(batch, tokens, heads, head_dim).transpose(1, 2)

scores = q @ k.transpose(-2, -1) / head_dim**0.5
weights = scores.softmax(dim=-1)
context = weights @ v

print(context.shape)  # [batch, heads, tokens, head_dim]
```

## Mental Model

Think of attention as retrieval:

1. Query: what am I looking for?
2. Key: what do I contain?
3. Value: what information do I pass forward?

For a token \(x_i\), the output is a weighted sum:

$$
z_i = \sum_j \alpha_{ij}v_j
$$

where \( \alpha_{ij} \) is the attention weight from token \(i\) to token \(j\).
