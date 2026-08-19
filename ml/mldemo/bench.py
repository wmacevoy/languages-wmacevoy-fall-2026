"""Time a matmul on the accelerator against the CPU.

This is the payoff line of the demo: on a machine with a GPU the ratio is large
and on one without it there is nothing to compare, and the *same command* says
so either way.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import torch

from .device import select

SIZE = 2048
ITERATIONS = 10
WARMUP = 3


def _synchronize(device: str) -> None:
    """Block until queued GPU work is done.

    Both CUDA and MPS dispatch asynchronously, so timing without this measures
    how fast Python can enqueue work rather than how fast the GPU runs it.
    """
    if device == "cuda":
        torch.cuda.synchronize()
    elif device == "mps" and hasattr(torch, "mps"):
        torch.mps.synchronize()


@dataclass(frozen=True)
class Timing:
    """Seconds per matmul on one device."""

    device: str
    seconds: float


def time_matmul(device: str, size: int = SIZE, iterations: int = ITERATIONS) -> Timing:
    """Average wall-clock seconds for one `size` x `size` matmul."""
    a = torch.rand(size, size, device=device)
    b = torch.rand(size, size, device=device)

    for _ in range(WARMUP):
        a @ b
    _synchronize(device)

    start = time.perf_counter()
    for _ in range(iterations):
        a @ b
    _synchronize(device)
    return Timing(device, (time.perf_counter() - start) / iterations)


def main() -> None:
    accelerator = select()
    print(f"{SIZE}x{SIZE} matmul, mean of {ITERATIONS} runs")

    cpu = time_matmul("cpu")
    print(f"  cpu : {cpu.seconds * 1000:8.2f} ms")

    if accelerator.kind == "cpu":
        print("\nno accelerator on this machine -- nothing to compare against.")
        return

    fast = time_matmul(accelerator.torch_device)
    print(f"  {accelerator.kind:<4}: {fast.seconds * 1000:8.2f} ms  ({accelerator.detail})")
    print(f"\nspeedup: {cpu.seconds / fast.seconds:.1f}x")


if __name__ == "__main__":
    main()
