import pytest
from pydantic import ValidationError

from app.schemas.search import QuerySequence, SimilarSearchRequest


def test_query_sequence_normalizes_whitespace_and_case():
    q = QuerySequence(id="q1", seq="  mstn\n acdef \n")
    assert q.seq == "MSTNACDEF"


def test_query_sequence_rejects_bad_alphabet():
    with pytest.raises(ValidationError):
        QuerySequence(id="q1", seq="MSTN1234!!")


def test_similar_search_request_defaults():
    req = SimilarSearchRequest(sequences=[QuerySequence(id="q", seq="MSTNACDEF" * 4)])
    assert req.top_k_retrieval == 500
    assert req.top_k_final == 50
    assert req.use_pfam_segmentation is True
    assert req.rerank_with_blast is True
    assert req.rerank_with_foldseek is False


def test_similar_search_request_too_many_sequences():
    seqs = [QuerySequence(id=f"q{i}", seq="MSTNACDEF" * 4) for i in range(21)]
    with pytest.raises(ValidationError):
        SimilarSearchRequest(sequences=seqs)
