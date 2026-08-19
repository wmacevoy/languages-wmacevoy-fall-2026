"""These tests assert the demo's actual thesis: the lock file resolves the same
manifest differently per platform. If pixi ever stopped doing that, the point of
this directory would be gone, so it is worth failing the build over."""

from mldemo.resolved import (
    _accelerator,
    current_subdir,
    installed_build,
    resolutions,
)

EXPECTED_PLATFORMS = {"linux-64", "osx-arm64", "win-64"}


def test_every_declared_platform_is_locked():
    covered = {r.platform for r in resolutions() if r.environment == "default"}
    assert covered == EXPECTED_PLATFORMS


def test_cuda_environment_selects_cuda_builds():
    cuda = [r for r in resolutions() if r.environment == "cuda"]
    assert cuda, "the cuda environment resolved no pytorch at all"
    assert all(r.build.startswith("cuda") for r in cuda)
    assert {r.platform for r in cuda} == {"linux-64", "win-64"}


def test_default_environment_avoids_cuda_builds():
    default = [r for r in resolutions() if r.environment == "default"]
    assert all(not r.build.startswith("cuda") for r in default)


def test_the_same_manifest_resolved_to_different_builds():
    """The whole demo in one assertion."""
    builds = {r.build for r in resolutions()}
    assert len(builds) > 1, f"expected per-platform drift, got only {builds}"


def test_cuda_selection_is_driven_by_a_virtual_package():
    cuda = [r for r in resolutions() if r.environment == "cuda"]
    assert all(
        any(v.startswith("__cuda") for v in r.virtual_packages) for r in cuda
    ), "cuda builds should be justified by a __cuda virtual package in the lock"


def test_macos_cpu_build_is_reported_as_metal():
    """A macOS `cpu_*` build still carries Metal; the report must not call it CPU."""
    assert _accelerator("cpu_generic_py313_h0", "osx-arm64") == "Metal (MPS)"
    assert _accelerator("cpu_mkl_py312_h0", "linux-64") == "CPU"
    assert _accelerator("cuda129_mkl_py312_h0", "linux-64") == "CUDA 12.9"


def test_this_platform_is_one_we_declared():
    assert current_subdir() in EXPECTED_PLATFORMS


def test_installed_build_matches_the_lock():
    """The environment actually installed here must be the one the lock names.

    This is the install check: it runs on every platform in CI and fails if a
    stale cache, a partial install or a stray `pip install` left the running
    environment different from the committed lock file.
    """
    installed = installed_build()
    assert installed is not None, "pytorch is not installed in this environment"

    expected = [
        r
        for r in resolutions()
        if r.environment == "default" and r.platform == current_subdir()
    ]
    assert len(expected) == 1, f"expected one locked pytorch, got {expected}"
    assert installed == (expected[0].version, expected[0].build)


def test_installed_build_is_not_a_cuda_build_without_a_gpu():
    """The default environment must never install a CUDA build."""
    version, build = installed_build()
    assert not build.startswith("cuda"), f"default environment installed {build}"
    assert version == next(
        r.version for r in resolutions() if r.platform == current_subdir()
    )
