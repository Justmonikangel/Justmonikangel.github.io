from pathlib import Path

from app.services.blast import _parse_outfmt6


def test_parse_outfmt6_basic(tmp_path: Path):
    p = tmp_path / "blast.tsv"
    p.write_text(
        "q1\tP12345\t99.5\t250\t1\t0\t1\t250\t1\t250\t1e-180\t620.5\t99\n"
        "q1\tP67890\t45.2\t200\t50\t3\t10\t210\t5\t205\t1e-30\t140.0\t80\n"
    )
    rows = _parse_outfmt6(p)
    assert len(rows) == 2
    assert rows[0]["target"] == "P12345"
    assert rows[0]["identity"] == 99.5
    assert rows[0]["evalue"] == 1e-180
    assert rows[1]["qcov"] == 80.0
