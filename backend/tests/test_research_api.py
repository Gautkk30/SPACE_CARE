"""
Tests for NASA OSD-946 / GLDS-773 Research Quality Control Endpoints
====================================================================

Validates:
- Correct endpoint routing and status codes.
- Accurate study provenance and metadata retrieval.
- Exact reproduction of technical probe detection metrics and group summaries.
- Scientific integrity disclaimers:
  - Ground-based bed-rest study identification.
  - Prohibition of misclassifying technical QC detection as clinical health metrics.
  - Prohibition of misclassifying research data as live astronaut telemetry.
  - Absence of simplistic 'PASS' labels based only on probe counts.
- Robust handling of query filters, missing files, and malformed inputs.
"""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.research_service import (
    load_group_qc_summary,
    load_sample_qc_summary,
)

client = TestClient(app)


def test_root_endpoint():
    """Verify backend root endpoint availability."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "SPACECARE"
    assert data["status"] == "initialized"


def test_health_endpoint():
    """Verify backend health endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_osd946_overview_endpoint():
    """
    Test GET /api/v1/research/osd946/overview.
    Validates metadata, statistics, group summaries, and scientific notices.
    """
    response = client.get("/api/v1/research/osd946/overview")
    assert response.status_code == 200
    data = response.json()

    # Metadata validation
    metadata = data["metadata"]
    assert metadata["accession"] == "OSD-946"
    assert metadata["genelab_id"] == "GLDS-773"
    assert metadata["geo_accession"] == "GSE226504"
    assert metadata["doi"] == "10.26030/wzr2-r025"
    assert metadata["participants"] == 22
    assert metadata["total_samples"] == 44
    assert metadata["probes_per_sample"] == 50980
    assert "bed-rest" in metadata["study_type"].lower()

    # Statistics validation
    stats = data["statistics"]
    assert stats["total_samples"] == 44
    assert stats["total_human_probes_per_sample"] == 50980
    assert stats["cohorts_count"] == 3
    assert stats["min_detection_percent"] == 11.22
    assert stats["max_detection_percent"] == 24.13
    assert stats["total_detected_probes"] == 338480

    # Scientific notice validation
    notice = data["scientific_notice"]
    assert "ground-based" in notice["data_classification"].lower()
    assert "not live astronaut biometric telemetry" in notice["telemetry_boundary"].lower()
    assert "technical microarray hybridization qc indicator" in notice["qc_interpretation"].lower()
    assert "not a clinical health measurement" in notice["qc_interpretation"].lower()

    # Group summaries validation
    group_summaries = data["group_summaries"]
    assert len(group_summaries) == 6


def test_osd946_samples_list():
    """
    Test GET /api/v1/research/osd946/samples.
    Validates all 44 samples and required schema fields.
    """
    response = client.get("/api/v1/research/osd946/samples")
    assert response.status_code == 200
    data = response.json()

    assert data["total_count"] == 44
    samples = data["samples"]
    assert len(samples) == 44

    for sample in samples:
        assert sample["total_probes"] == 50980
        assert sample["detected_probes"] > 0
        assert 10.0 <= sample["detection_percent"] <= 30.0
        assert sample["group"] in ["CON", "EX", "FLY"]
        assert sample["time"] in ["PRE", "POST"]
        assert sample["gsm_accession"].startswith("GSM")
        # Ensure no sample is simplistically labeled "PASS" based only on probe count
        assert "status" not in sample or sample.get("status") != "PASS"


def test_osd946_samples_filtering():
    """
    Test query parameter filtering on GET /api/v1/research/osd946/samples.
    """
    # Filter by group
    r_con = client.get("/api/v1/research/osd946/samples?group=CON")
    assert r_con.status_code == 200
    assert r_con.json()["total_count"] == 14

    r_ex = client.get("/api/v1/research/osd946/samples?group=EX")
    assert r_ex.status_code == 200
    assert r_ex.json()["total_count"] == 14

    r_fly = client.get("/api/v1/research/osd946/samples?group=FLY")
    assert r_fly.status_code == 200
    assert r_fly.json()["total_count"] == 16

    # Filter by group and time
    r_con_pre = client.get("/api/v1/research/osd946/samples?group=CON&time=PRE")
    assert r_con_pre.status_code == 200
    assert r_con_pre.json()["total_count"] == 7

    r_fly_post = client.get("/api/v1/research/osd946/samples?group=FLY&time=POST")
    assert r_fly_post.status_code == 200
    assert r_fly_post.json()["total_count"] == 8

    # Filter by GSM accession
    r_gsm = client.get("/api/v1/research/osd946/samples?gsm=GSM7078076")
    assert r_gsm.status_code == 200
    assert r_gsm.json()["total_count"] == 1
    assert r_gsm.json()["samples"][0]["gsm_accession"] == "GSM7078076"


def test_osd946_groups_endpoint():
    """
    Test GET /api/v1/research/osd946/groups.
    Verifies that group averages reproduce the published QC summary.
    """
    response = client.get("/api/v1/research/osd946/groups")
    assert response.status_code == 200
    data = response.json()

    assert data["total_groups"] == 6
    groups = {f"{g['group']}_{g['time']}": g for g in data["groups"]}

    # Reference values from qc_group_summary.csv
    expected = {
        "CON_POST": {"samples": 7, "avg": 15.65, "min": 13.26, "max": 19.89},
        "CON_PRE": {"samples": 7, "avg": 15.33, "min": 12.75, "max": 19.5},
        "EX_POST": {"samples": 7, "avg": 16.56, "min": 11.22, "max": 24.13},
        "EX_PRE": {"samples": 7, "avg": 15.95, "min": 11.26, "max": 21.5},
        "FLY_POST": {"samples": 8, "avg": 13.79, "min": 12.12, "max": 15.73},
        "FLY_PRE": {"samples": 8, "avg": 13.65, "min": 12.36, "max": 14.99},
    }

    for key, exp in expected.items():
        assert key in groups, f"Missing group {key}"
        g = groups[key]
        assert g["samples"] == exp["samples"]
        assert g["average_detection"] == exp["avg"]
        assert g["minimum"] == exp["min"]
        assert g["maximum"] == exp["max"]


def test_osd946_sample_detail_endpoint():
    """
    Test GET /api/v1/research/osd946/samples/{sample_id}.
    """
    # Lookup by full filename
    filename = "GLDS-773_miRNA-array_GSM7078076_CON__1_POST_miRNA.txt.gz"
    res1 = client.get(f"/api/v1/research/osd946/samples/{filename}")
    assert res1.status_code == 200
    assert res1.json()["gsm_accession"] == "GSM7078076"
    assert res1.json()["detection_percent"] == 16.24

    # Lookup by GSM accession
    res2 = client.get("/api/v1/research/osd946/samples/GSM7078092")
    assert res2.status_code == 200
    assert res2.json()["group"] == "EX"
    assert res2.json()["time"] == "POST"
    assert res2.json()["detection_percent"] == 24.13

    # Lookup non-existent
    res_none = client.get("/api/v1/research/osd946/samples/GSM9999999")
    assert res_none.status_code == 404


def test_service_missing_file_handling(tmp_path: Path):
    """
    Verify that missing files raise FileNotFoundError gracefully in the service layer.
    """
    with pytest.raises(FileNotFoundError):
        load_sample_qc_summary(data_dir=tmp_path)

    with pytest.raises(FileNotFoundError):
        load_group_qc_summary(data_dir=tmp_path)


def test_service_malformed_csv_handling(tmp_path: Path):
    """
    Verify that malformed CSV files with missing headers raise ValueError.
    """
    bad_sample_csv = tmp_path / "qc_summary.csv"
    bad_sample_csv.write_text("WrongHeader1,WrongHeader2\nval1,val2\n", encoding="utf-8")

    with pytest.raises(ValueError, match="Missing required columns"):
        load_sample_qc_summary(data_dir=tmp_path)
