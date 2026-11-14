"""
Research API Routes (NASA OSD-946 / GLDS-773)
==============================================

FastAPI router exposing quality control summaries, study provenance metadata,
and aggregate statistics for NASA OSDR study OSD-946 / GLDS-773.

Scientific Integrity Notice:
OSD-946 is an open-access ground-based 70-day bed-rest analogue study.
Probe detection percentages represent technical hybridization quality
indicators and must NOT be interpreted as live astronaut biometrics,
clinical health indicators, or clinical countermeasure outcomes.
"""

from __future__ import annotations

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.research import (
    OSD946GroupListResponse,
    OSD946OverviewResponse,
    OSD946SampleListResponse,
    OSD946SampleQC,
    OSD946ScientificNotice,
)
from app.services.research_service import (
    find_sample_by_id,
    get_osd946_overview,
    load_group_qc_summary,
    load_sample_qc_summary,
)

logger = logging.getLogger("research_api")

router = APIRouter()


@router.get(
    "/osd946/overview",
    response_model=OSD946OverviewResponse,
    summary="Get OSD-946 study metadata, statistics, and cohort summaries",
    tags=["Research"],
)
@router.get(
    "/osd946",
    response_model=OSD946OverviewResponse,
    include_in_schema=False,
)
async def get_overview():
    """
    Retrieve comprehensive study metadata, dataset-wide technical statistics,
    cohort PRE/POST summaries, and scientific integrity notices for NASA OSD-946.
    """
    try:
        return get_osd946_overview()
    except FileNotFoundError as err:
        logger.error(f"OSD-946 data file not found: {err}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "OSD-946 quality control data is currently unavailable. "
                "Ensure qc_summary.csv and qc_group_summary.csv exist in data/raw/nasa/osd946/."
            ),
        )
    except ValueError as err:
        logger.error(f"Error parsing OSD-946 data: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Malformed OSD-946 dataset: {err}",
        )


@router.get(
    "/osd946/samples",
    response_model=OSD946SampleListResponse,
    summary="List individual sample QC metrics for OSD-946",
    tags=["Research"],
)
async def list_samples(
    group: Optional[str] = Query(
        None,
        description="Filter by study cohort: CON (Control), EX (Exercise), FLY (Flywheel)",
        pattern=r"^(CON|EX|FLY)$",
    ),
    time: Optional[str] = Query(
        None,
        description="Filter by sampling timepoint: PRE (Baseline), POST (Bed Rest)",
        pattern=r"^(PRE|POST)$",
    ),
    gsm: Optional[str] = Query(
        None,
        description="Filter by GEO accession prefix/id (e.g. GSM7078076)",
    ),
):
    """
    List all 44 processed Agilent miRNA microarray samples with technical
    probe detection counts, detection percentages, and cohort annotations.
    """
    try:
        samples = load_sample_qc_summary()
    except FileNotFoundError as err:
        logger.error(f"OSD-946 sample QC file missing: {err}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OSD-946 sample QC summary file not found.",
        )
    except ValueError as err:
        logger.error(f"Error parsing sample QC CSV: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Malformed sample QC data: {err}",
        )

    # Apply filters if provided
    if group:
        samples = [s for s in samples if s.group == group.upper()]
    if time:
        samples = [s for s in samples if s.time == time.upper()]
    if gsm:
        gsm_query = gsm.strip().upper()
        samples = [s for s in samples if gsm_query in s.gsm_accession.upper()]

    return OSD946SampleListResponse(
        total_count=len(samples),
        scientific_notice=OSD946ScientificNotice(),
        samples=samples,
    )


@router.get(
    "/osd946/groups",
    response_model=OSD946GroupListResponse,
    summary="Get group-level PRE vs POST detection QC summaries",
    tags=["Research"],
)
async def list_groups():
    """
    Retrieve group-level average, minimum, and maximum technical detection
    percentages for the 3 study cohorts (CON, EX, FLY) across PRE and POST conditions.
    """
    try:
        groups = load_group_qc_summary()
    except FileNotFoundError as err:
        logger.error(f"OSD-946 group summary file missing: {err}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OSD-946 group summary file not found.",
        )
    except ValueError as err:
        logger.error(f"Error parsing group summary CSV: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Malformed group summary data: {err}",
        )

    return OSD946GroupListResponse(
        total_groups=len(groups),
        scientific_notice=OSD946ScientificNotice(),
        groups=groups,
    )


@router.get(
    "/osd946/samples/{sample_id}",
    response_model=OSD946SampleQC,
    summary="Retrieve QC record for a single sample by filename or GSM accession",
    tags=["Research"],
)
async def get_sample_detail(sample_id: str):
    """
    Look up an individual sample record by either its full filename or GSM accession.
    """
    try:
        sample = find_sample_by_id(sample_id)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OSD-946 dataset files unavailable.",
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data parsing error: {err}",
        )

    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample '{sample_id}' not found in OSD-946 dataset.",
        )

    return sample
