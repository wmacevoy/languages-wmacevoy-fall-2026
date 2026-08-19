"""Training must actually learn, and must do so identically everywhere."""

import math

import torch

from mldemo.train import build_model, make_data, train

# sin(x) over [-pi, pi] has variance ~0.5, and the data carries 0.05 of noise,
# so a model that learned nothing scores ~0.5 and a perfect one ~0.0025. 0.02
# sits well clear of both, which keeps this meaningful without being flaky on a
# backend whose arithmetic differs slightly.
HOLDOUT_TOLERANCE = 0.02


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


def test_generalizes_on_the_selected_device():
    """The real cross-platform check: did this backend compute a *correct* fit?

    Runs on CUDA, Metal or CPU depending on the machine, and is measured on data
    the model never saw -- so a backend that silently produces wrong arithmetic
    fails here even though its loss curve looked fine.
    """
    result = train(steps=400, seed=0)
    assert result.holdout_loss < HOLDOUT_TOLERANCE, (
        f"holdout loss {result.holdout_loss:.4f} on {result.device}"
    )


def test_predicts_sine_at_known_points():
    """Spot-check the learned function against values we know by hand."""
    result = train(steps=400, seed=0)
    probe = torch.tensor([[0.0], [math.pi / 2], [-math.pi / 2]], device=result.device)
    with torch.no_grad():
        predicted = result.model(probe).cpu().flatten().tolist()

    for got, want in zip(predicted, [0.0, 1.0, -1.0]):
        assert abs(got - want) < 0.15, f"predicted {predicted}, wanted [0, 1, -1]"


def test_holdout_is_close_to_training_loss():
    """A large gap would mean the model memorised rather than generalised."""
    result = train(steps=400, seed=0, device="cpu")
    assert abs(result.holdout_loss - result.final_loss) < 0.01
