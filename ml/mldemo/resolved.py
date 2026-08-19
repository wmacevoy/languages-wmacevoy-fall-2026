"""Read pixi.lock and show what *every* platform resolved to.

`device.py` reports the machine you are sitting at. This reports all of them at
once, from the lock file, including platforms this machine cannot run -- which
is the only way to see the per-platform drift without borrowing three laptops.
"""

from __future__ import annotations

import os
import platform
import sys
from dataclasses import dataclass
from pathlib import Path

import yaml

LOCK_PATH = Path(__file__).resolve().parent.parent / "pixi.lock"

# How Python names a machine -> how conda names the same machine.
_SUBDIRS = {
    ("Darwin", "arm64"): "osx-arm64",
    ("Darwin", "x86_64"): "osx-64",
    ("Linux", "x86_64"): "linux-64",
    ("Linux", "aarch64"): "linux-aarch64",
    ("Windows", "AMD64"): "win-64",
}


@dataclass(frozen=True)
class Resolution:
    """One package, as resolved for one environment on one platform."""

    environment: str
    platform: str
    version: str
    build: str
    accelerator: str
    virtual_packages: tuple[str, ...]


def _subdirs(lock: dict) -> dict[str, tuple[str, tuple[str, ...]]]:
    """Map each lock platform name to its real subdir and virtual packages.

    A feature carrying `system-requirements` gets a *synthetic* platform in the
    lock -- named `p1`, `p2`, ... with a `subdir` pointing at the real one. That
    is how a Mac can solve for "linux-64 with a CUDA 12 GPU present": the
    synthetic platform declares the `__cuda=12` virtual package the solver needs
    to see, without this machine having any such hardware.
    """
    table: dict[str, tuple[str, tuple[str, ...]]] = {}
    for entry in lock.get("platforms", []):
        name = entry["name"]
        table[name] = (
            entry.get("subdir", name),
            tuple(entry.get("virtual-packages", [])),
        )
    return table


def current_subdir() -> str:
    """The conda subdir for the machine running this code."""
    key = (platform.system(), platform.machine())
    if key not in _SUBDIRS:
        raise RuntimeError(f"no known conda subdir for {key}")
    return _SUBDIRS[key]


def installed_build(package: str = "pytorch") -> tuple[str, str] | None:
    """Read (version, build) of `package` from the *live* environment.

    conda records every installed artifact under `conda-meta/`, named exactly as
    the file it came from. Comparing that against the lock is what proves the
    environment on this machine is the one the lock describes, rather than
    something a stale cache or a manual `pip install` left behind.
    """
    for meta in sorted(Path(sys.prefix, "conda-meta").glob(f"{package}-*.json")):
        parsed = _parse_filename(meta.name.replace(".json", ".conda"))
        if parsed and parsed[0] == package:
            return parsed[1], parsed[2]
    return None


def _accelerator(build: str, subdir: str) -> str:
    """Name the hardware a given build can actually use.

    Note the asymmetry this exposes: on Linux and Windows the accelerator is
    chosen by picking a *different build*, but every macOS build carries Metal,
    so there the same `cpu_*` build is the GPU build.
    """
    if build.startswith("cuda"):
        digits = "".join(c for c in build[4:] if c.isdigit())[:3]
        if len(digits) == 3:
            return f"CUDA {digits[:2]}.{digits[2:]}"
        return "CUDA"
    if subdir.startswith("osx"):
        return "Metal (MPS)"
    return "CPU"


def _parse_filename(url: str) -> tuple[str, str, str] | None:
    """Split a conda artifact URL into (name, version, build)."""
    base = os.path.basename(url)
    for suffix in (".conda", ".tar.bz2"):
        if base.endswith(suffix):
            base = base[: -len(suffix)]
            break
    else:
        return None
    parts = base.rsplit("-", 2)
    return (parts[0], parts[1], parts[2]) if len(parts) == 3 else None


def resolutions(package: str = "pytorch", lock_path: Path = LOCK_PATH) -> list[Resolution]:
    """Every resolution of `package` recorded in the lock file."""
    lock = yaml.safe_load(lock_path.read_text())
    subdirs = _subdirs(lock)

    found: list[Resolution] = []
    for environment, spec in sorted(lock["environments"].items()):
        for platform_name, packages in sorted(spec["packages"].items()):
            subdir, virtual = subdirs.get(platform_name, (platform_name, ()))
            for entry in packages:
                url = entry.get("conda")
                if not url:
                    continue
                parsed = _parse_filename(url)
                if parsed is None or parsed[0] != package:
                    continue
                _, version, build = parsed
                found.append(
                    Resolution(
                        environment=environment,
                        platform=subdir,
                        version=version,
                        build=build,
                        accelerator=_accelerator(build, subdir),
                        virtual_packages=virtual,
                    )
                )
    return found


def report(package: str = "pytorch") -> str:
    """A table of who resolved to what."""
    rows = resolutions(package)
    if not rows:
        return f"no {package} entries found in {LOCK_PATH.name}"

    header = f"{'environment':<12} {'platform':<10} {'version':<8} {'accelerator':<12} build"
    lines = [header, "-" * len(header)]
    for r in rows:
        lines.append(
            f"{r.environment:<12} {r.platform:<10} {r.version:<8} "
            f"{r.accelerator:<12} {r.build}"
        )

    cuda = sorted({v for r in rows for v in r.virtual_packages if v.startswith("__cuda")})
    if cuda:
        lines += ["", f"CUDA builds were selected by the virtual package: {', '.join(cuda)}"]

    installed = installed_build(package)
    if installed is not None:
        version, build = installed
        lines += ["", f"installed here ({current_subdir()}): {package} {version} {build}"]
    return "\n".join(lines)


def main() -> None:
    print(report())


if __name__ == "__main__":
    main()
