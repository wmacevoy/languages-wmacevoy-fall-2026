"""The one error type every stage raises."""


class CjError(Exception):
    """A problem in the input, with the stage that found it and where it is."""

    def __init__(self, stage, message, line, col):
        super().__init__(f"{line}:{col}: {stage} error: {message}")
        self.stage = stage
        self.message = message
        self.line = line
        self.col = col
