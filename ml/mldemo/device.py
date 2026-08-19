"""Pick the best device torch can reach, and say so.

`pixi run device` is meant to print something *different* on each student's
machine even though everyone ran the same command against the same lock file.
"""

from __future__ import annotations

import platform
from dataclasses import dataclass

import torch


@dataclass(frozen=True)
class Accelerator:
    """The fastest device available here.

    `kind` is the hardware family; `torch_device` is what you pass to `.to()`.
    """

    kind: str  # "cuda" | "mps" | "cpu"
    detail: str
    torch_device: str


def _mps_available() -> bool:
    """True when Apple's Metal backend is usable.

    Guarded rather than called directly: the attribute exists in every modern
    build, but this keeps a CPU-only or older wheel from turning into an
    AttributeError halfway through a lecture.
    """
    backend = getattr(torch.backends, "mps", None)
    return bool(backend is not None and backend.is_available())


def select() -> Accelerator:
    """Return the best available accelerator, preferring CUDA, then Metal."""
    if torch.cuda.is_available():
        return Accelerator("cuda", torch.cuda.get_device_name(0), "cuda")
    if _mps_available():
        return Accelerator("mps", f"Apple {platform.machine()} GPU via Metal", "mps")
    return Accelerator("cpu", platform.processor() or platform.machine(), "cpu")


def report() -> str:
    """A human-readable summary of what this machine resolved to."""
    accelerator = select()
    mps = getattr(torch.backends, "mps", None)
    return "\n".join(
        [
            f"platform    : {platform.system()} {platform.machine()}",
            f"python      : {platform.python_version()}",
            f"torch       : {torch.__version__}",
            f"torch build : cuda={torch.version.cuda or 'none'} "
            f"metal={bool(mps is not None and mps.is_built())}",
            f"accelerator : {accelerator.kind} ({accelerator.detail})",
        ]
    )


def main() -> None:
    print(report())


if __name__ == "__main__":
    main()
