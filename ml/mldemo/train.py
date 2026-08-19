"""Fit a small MLP to a noisy sine, on whatever device this machine has.

The model is deliberately trivial and finishes in seconds on a CPU. Nothing
here is device-specific: the only line that changes between a CUDA laptop, an
Apple Silicon laptop and a CI runner is what `device.select()` returned.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import torch
from torch import nn

from .device import select

# MPS has no float64, so everything stays in the default float32.
DTYPE = torch.float32


def make_data(samples: int = 2048, seed: int = 0, device: str = "cpu"):
    """A noisy sine wave. Generated on the CPU, then moved.

    The generator is pinned to the CPU on purpose: RNG streams are not
    guaranteed to match across backends, so seeding on the CPU and copying is
    what keeps this reproducible on every platform.
    """
    generator = torch.Generator(device="cpu").manual_seed(seed)
    x = torch.rand(samples, 1, generator=generator, dtype=DTYPE) * (2 * math.pi) - math.pi
    y = torch.sin(x) + 0.05 * torch.randn(samples, 1, generator=generator, dtype=DTYPE)
    return x.to(device), y.to(device)


def build_model(seed: int = 0) -> nn.Module:
    """A 2-hidden-layer MLP, seeded so weights start identically everywhere."""
    torch.manual_seed(seed)
    return nn.Sequential(
        nn.Linear(1, 64),
        nn.Tanh(),
        nn.Linear(64, 64),
        nn.Tanh(),
        nn.Linear(64, 1),
    )


@dataclass(frozen=True)
class Result:
    """What a training run produced.

    `holdout_loss` is the one that matters across platforms: it is measured on
    data the model never saw, so it says the backend computed a *correct*
    answer, not merely a converging one.
    """

    device: str
    steps: int
    first_loss: float
    final_loss: float
    holdout_loss: float
    model: nn.Module = field(repr=False)

    @property
    def improvement(self) -> float:
        """How many times smaller the loss got."""
        return self.first_loss / self.final_loss if self.final_loss else float("inf")


def train(steps: int = 400, seed: int = 0, device: str | None = None) -> Result:
    """Run full-batch Adam for `steps` and report the loss at both ends."""
    target = device or select().torch_device
    x, y = make_data(seed=seed, device=target)
    model = build_model(seed).to(target)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-2)
    criterion = nn.MSELoss()

    first_loss = None
    loss = None
    for _ in range(steps):
        optimizer.zero_grad()
        loss = criterion(model(x), y)
        loss.backward()
        optimizer.step()
        if first_loss is None:
            first_loss = loss.item()

    # Held-out data, drawn from a different seed so none of it was trained on.
    with torch.no_grad():
        holdout_x, holdout_y = make_data(samples=512, seed=seed + 1000, device=target)
        holdout = criterion(model(holdout_x), holdout_y).item()

    return Result(
        device=target,
        steps=steps,
        first_loss=float(first_loss),
        final_loss=float(loss.item()),
        holdout_loss=float(holdout),
        model=model,
    )


def main() -> None:
    accelerator = select()
    print(f"training on {accelerator.kind} ({accelerator.detail})")
    result = train()
    print(f"  steps      : {result.steps}")
    print(f"  first loss : {result.first_loss:.6f}")
    print(f"  final loss : {result.final_loss:.6f}")
    print(f"  holdout    : {result.holdout_loss:.6f}  (never trained on)")
    print(f"  improvement: {result.improvement:.1f}x")


if __name__ == "__main__":
    main()
