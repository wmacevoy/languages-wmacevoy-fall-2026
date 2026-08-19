"""A deliberately small PyTorch demo whose *environment* is the interesting part.

The code here is ordinary. What differs between machines is the stack beneath
it, which pixi resolves per platform from a single manifest: CUDA on Linux and
Windows, Metal on Apple Silicon, plain CPU as the fallback.
"""

__all__ = ["device", "train", "bench", "resolved"]
