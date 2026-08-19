"""The device layer must give a usable answer on every platform."""

import dataclasses

import pytest
import torch

from mldemo.device import Accelerator, report, select


def test_selects_a_known_kind():
    assert select().kind in {"cuda", "mps", "cpu"}


def test_selected_device_actually_works():
    """Whatever was selected must accept a tensor -- a wrong guess fails here."""
    accelerator = select()
    x = torch.ones(4, 4, device=accelerator.torch_device)
    assert x.sum().item() == 16.0
    assert x.device.type == accelerator.torch_device


def test_prefers_cuda_then_metal_then_cpu():
    """The fallback order must match the hardware actually present."""
    accelerator = select()
    if torch.cuda.is_available():
        assert accelerator.kind == "cuda"
    elif getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        assert accelerator.kind == "mps"
    else:
        assert accelerator.kind == "cpu"


def test_report_names_the_accelerator():
    text = report()
    assert "accelerator :" in text
    assert select().kind in text


def test_accelerator_is_immutable():
    """Frozen so callers cannot rewrite the detected device behind our back."""
    accelerator = Accelerator("cpu", "test", "cpu")
    with pytest.raises(dataclasses.FrozenInstanceError):
        accelerator.kind = "cuda"
