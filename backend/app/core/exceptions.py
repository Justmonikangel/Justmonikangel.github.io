class AppError(Exception):
    """Base application error."""


class ToolNotFoundError(AppError):
    """Raised when an external bioinformatics tool binary is missing."""


class ToolExecutionError(AppError):
    """Raised when an external tool exits non-zero."""

    def __init__(self, tool: str, returncode: int, stderr: str) -> None:
        super().__init__(f"{tool} failed with rc={returncode}: {stderr[:500]}")
        self.tool = tool
        self.returncode = returncode
        self.stderr = stderr


class UpstreamUnavailable(AppError):
    """UniProt / AlphaFold / RAST upstream failed."""
