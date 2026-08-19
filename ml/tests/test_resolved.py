"""These tests assert the demo's actual thesis: the lock file resolves the same
manifest differently per platform. If pixi ever stopped doing that, the point of
this directory would be gone, so it is worth failing the build over."""

from mldemo.resolved import _accelerator, resolutions

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
