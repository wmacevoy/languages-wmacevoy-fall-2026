"""Training must actually learn, and must do so identically everywhere."""

from mldemo.train import build_model, make_data, train


def test_data_shape_and_range():
    x, y = make_data(samples=128, seed=0)
    assert x.shape == (128, 1) and y.shape == (128, 1)
    assert -3.15 <= x.min().item() and x.max().item() <= 3.15


def test_model_is_seeded_identically():
    """Same seed, same starting weights -- the basis of the reproducibility claim."""
    a = list(build_model(seed=0).parameters())
    b = list(build_model(seed=0).parameters())
    assert all((p - q).abs().max().item() == 0.0 for p, q in zip(a, b))


def test_loss_drops_substantially():
    result = train(steps=200, seed=0, device="cpu")
    assert result.final_loss < result.first_loss
    assert result.improvement > 5.0, f"only improved {result.improvement:.1f}x"


def test_training_is_reproducible_on_cpu():
    """Pinned to CPU: RNG streams are not guaranteed to match across backends."""
    first = train(steps=50, seed=1, device="cpu")
    second = train(steps=50, seed=1, device="cpu")
    assert first.final_loss == second.final_loss


def test_runs_on_the_selected_device():
    """The default path -- whatever this machine has -- must also learn."""
    result = train(steps=100, seed=0)
    assert result.final_loss < result.first_loss
