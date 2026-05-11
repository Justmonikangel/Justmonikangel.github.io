from app.services.hmmer import PfamHit, segment


def test_segment_falls_back_to_whole_when_no_hits():
    chunks = segment("q1", "MSTN" * 10, hits=[])
    assert len(chunks) == 1
    assert chunks[0]["kind"] == "whole"
    assert chunks[0]["start"] == 1
    assert chunks[0]["end"] == 40


def test_segment_uses_pfam_windows_when_present():
    seq = "M" * 200
    hits = [
        PfamHit(query_id="q1", pfam_acc="PF00001", pfam_name="A", evalue=1e-10, start=10, end=80),
        PfamHit(query_id="q1", pfam_acc="PF00002", pfam_name="B", evalue=1e-10, start=120, end=190),
        PfamHit(query_id="other", pfam_acc="PF99999", pfam_name="X", evalue=1e-10, start=1, end=50),
    ]
    chunks = segment("q1", seq, hits)
    assert [c["kind"] for c in chunks] == ["pfam", "pfam"]
    assert chunks[0]["pfam_acc"] == "PF00001"
    assert chunks[0]["end"] - chunks[0]["start"] + 1 == 71
