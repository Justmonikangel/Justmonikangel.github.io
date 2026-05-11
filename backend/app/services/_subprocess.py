from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from app.core.exceptions import ToolExecutionError, ToolNotFoundError


def assert_binary(name: str) -> str:
    """Resolve a binary name on PATH; raise ToolNotFoundError if missing."""
    resolved = shutil.which(name)
    if not resolved:
        raise ToolNotFoundError(name)
    return resolved


def run(
    argv: list[str],
    *,
    workdir: Path,
    timeout: int = 3600,
    stdin: bytes | None = None,
) -> tuple[Path, Path]:
    """Run a subprocess, capturing stdout/stderr to files in workdir.

    Never use shell=True. argv must be a list of explicit args.
    """
    workdir.mkdir(parents=True, exist_ok=True)
    stdout_path = workdir / "stdout.log"
    stderr_path = workdir / "stderr.log"
    with stdout_path.open("wb") as out, stderr_path.open("wb") as err:
        proc = subprocess.run(  # noqa: S603 — argv is a list, no shell
            argv,
            stdout=out,
            stderr=err,
            input=stdin,
            timeout=timeout,
            check=False,
            cwd=str(workdir),
        )
    if proc.returncode != 0:
        raise ToolExecutionError(argv[0], proc.returncode, stderr_path.read_text(errors="ignore"))
    return stdout_path, stderr_path
