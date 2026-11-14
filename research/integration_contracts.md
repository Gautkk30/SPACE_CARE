
# SPACECARE — NASA OSDR / DONKI Integration Contracts

**Status:** Integration specification
**Last reviewed:** 2026-11-14
**Purpose:** Define data-source boundaries, normalized records, provenance, and ingestion requirements for NASA research and space-weather data.

---

## 1. Core data-source boundaries

SPACECARE must distinguish the following data categories:

| Category | Source | Meaning |
|---|---|---|
| Research data | NASA OSDR | Published space-biology and spaceflight research datasets |
| Space-weather events | NASA CCMC DONKI | Solar and heliospheric event information |
| Measured radiation | Calibrated radiation instrument | Instrument-reported radiation measurements |
| Modelled radiation | Identified radiation model | Model-generated exposure estimates |
| Simulated telemetry | SPACECARE simulator | Synthetic astronaut-like readings |
| Manual telemetry | SPACECARE manual input API | User-entered readings, not independently verified sensor data |

These categories must not be silently combined or presented as equivalent.

## 2. NASA OSDR integration contract

### 2.1 Purpose

NASA Open Science Data Repository (OSDR) provides research datasets and metadata covering space biology, physiology, environmental data, and related research.

OSDR is a research-data source. Its records are not automatically live astronaut telemetry.

Official resources:

- OSDR: https://osdr.nasa.gov/
- OSDR API documentation: https://api.nasa.gov/
- NASA OSDR overview: https://science.nasa.gov/biological-physical/data/osdr/

### 2.2 API access

The documented study metadata endpoint is:

`GET https://osdr.nasa.gov/osdr/data/osd/meta/{OSD_STUDY_ID}`

The documented study-file listing endpoint is:

`GET https://osdr.nasa.gov/osdr/data/osd/files/{OSD_STUDY_ID}`

The file-list response can provide remote file locations. Follow the returned metadata rather than constructing download URLs from guessed filenames.

Implementation requirements:

- Use configurable base URLs.
- Set request timeouts.
- Check HTTP status codes.
- Validate response structure before processing.
- Handle missing metadata and unavailable files.
- Preserve original source identifiers and URLs.
- Record retrieval timestamps in UTC.
- Do not assume every study has identical metadata or assay structures.

### 2.3 Normalized research record

The OSDR adapter should map available source metadata into the following logical record:

| Field | Description |
|---|---|
| `study_id` | NASA study accession, e.g. `OSD-946` |
| `dataset_id` | Dataset accession, e.g. `GLDS-773`, where applicable |
| `source` | `NASA_OSDR` |
| `source_url` | Original study or file URL |
| `assay_type` | Assay or measurement technology |
| `organism` | Source organism |
| `tissue` | Tissue or biospecimen, if applicable |
| `sample_id` | Original sample identifier |
| `group` | Study cohort or experimental group |
| `timepoint` | Original collection timepoint |
| `measurement_name` | Source measurement or feature |
| `measurement_value` | Numeric value, where applicable |
| `unit` | Original measurement unit |
| `retrieved_at` | UTC retrieval timestamp |
| `data_provenance` | Original source and processing history |

Fields not supplied by the source must remain null or be omitted. Do not infer biological values or units.

### 2.4 OSD-946 dataset-specific handling

SPACECARE currently uses:

- Study: `OSD-946`
- Dataset: `GLDS-773`
- Related GEO accession: `GSE226504`
- DOI: `10.26030/wzr2-r025`
- Study type: Ground-based 70-day head-down bed-rest study
- Tissue: Vastus lateralis skeletal muscle
- Assay: miRNA microarray
- Samples: 44
- Cohorts: CON, EX, FLY
- Timepoints: PRE and POST

The current dashboard's sample detection statistics are technical microarray quality-control measurements.

**Mandatory interpretation rules:**

1. OSD-946 is not a live astronaut vital-sign dataset.
2. Microarray probe-detection percentages are not health scores.
3. `gIsGeneDetected` is a technical detection flag, not a clinical positive/negative result.
4. OSD-946 must not be fed directly into a heart-rate, blood-pressure, SpO2, or other wearable-vitals anomaly detector.
5. Any future biological analysis must preserve assay type, tissue, cohort, timepoint, and preprocessing provenance.
6. Do not claim that the dataset proves exercise efficacy or predicts an individual astronaut's health from QC statistics.

The existing OSD-946 quality-control dashboard must remain a separate research module.

## 3. NASA CCMC DONKI integration contract

### 3.1 Purpose

DONKI (Database of Notifications, Knowledge, Information) provides space-weather event records and associated analyses, notifications, and event relationships.

Official resources:

- DONKI: https://ccmc.gsfc.nasa.gov/DONKI/
- DONKI guide: https://ccmc.gsfc.nasa.gov/DONKI/guide/
- CCMC API resources: https://ccmc.gsfc.nasa.gov/tools/API/

DONKI data can provide space-weather context for mission monitoring. It does not independently measure an astronaut's absorbed or effective radiation dose.

### 3.2 Current API base URL

Use the post-migration CCMC API base:

`https://ccmc.gsfc.nasa.gov/DONKI-API/get/`

The API migration took effect on 2026-09-30. Do not configure the old `api.nasa.gov/DONKI` or legacy `kauai.ccmc.gsfc.nasa.gov` address as the active integration base.

Endpoint paths include:

- `CME`
- `CMEAnalysis`
- `FLR`
- `GST`
- `IPS`
- `SEP`

Use the current CCMC API documentation for valid query parameters and response schemas. Do not assume that every event type has the same fields.

### 3.3 Configuration

Recommended environment configuration:

`NASA_DONKI_BASE_URL=https://ccmc.gsfc.nasa.gov/DONKI-API/get`

Keep the base URL configurable. Do not hard-code it in multiple services.

Do not expose credentials or secrets in frontend code. If a future source requires authentication, keep credentials on the backend.

### 3.4 Normalized DONKI event record

Normalize event records into this logical structure:

```json
{
  "event_id": "source-generated-id",
  "event_type": "SEP",
  "start_time": "2026-11-14T00:00:00Z",
  "peak_time": null,
  "end_time": null,
  "source": "NASA_DONKI",
  "source_url": "original-source-event-url",
  "instruments": [],
  "linked_events": [],
  "raw_payload": {},
  "retrieved_at": "2026-11-14T00:00:00Z"
}
```

This is a SPACECARE normalized contract, not a claim that DONKI returns these exact field names.

Mapping rules:

- Preserve the original DONKI event identifier.
- Preserve the original event type.
- Convert valid timestamps to UTC ISO-8601.
- Preserve source URLs and linked-event references.
- Retain the original JSON payload for traceability.
- Missing optional fields must remain null or empty.
- Do not invent event severity, particle flux, dose, or instrument measurements.
- Keep source-specific fields available when normalization cannot represent them.

### 3.5 Ingestion and failure handling

The DONKI adapter must:

1. Validate requested date ranges and event types.
2. Apply connection and read timeouts.
3. Handle HTTP errors and malformed JSON.
4. Handle empty responses without treating them as failures.
5. Avoid duplicate events using source identifiers.
6. Record retrieval time and source URL.
7. Log failures without crashing unrelated dashboard modules.
8. Avoid presenting cached records as current observations.
9. Preserve the original event payload for later reprocessing.

## 4. Radiation interpretation boundary

DONKI event records and radiation-dose measurements are different data products.

SPACECARE must label radiation information as one of:

- `space_weather_event`
- `instrument_measured_dose`
- `modelled_dose_estimate`
- `simulated_radiation`
- `unknown_provenance`

A DONKI SEP or CME event must not be converted directly into an individual astronaut dose.

A dose estimate requires an appropriate radiation transport/exposure model, relevant spacecraft shielding and trajectory information, and validated input measurements or model outputs.

If no valid dose measurement or estimate exists, display the event as space-weather context only.

## 5. Common provenance requirements

Every ingested external record should retain:

- Source name
- Original source identifier
- Original source URL
- Source event/study type
- Retrieval timestamp in UTC
- Processing or adapter version
- Raw source payload or a traceable reference to it
- Data classification
- Any known limitations

Recommended classifications:

- `RESEARCH`
- `SPACE_WEATHER_EVENT`
- `MEASURED`
- `MODELLED`
- `SIMULATED`
- `MANUAL_ENTRY`

Do not relabel a record merely because it appears on the same dashboard as another category.

## 6. Backend integration boundaries

Recommended logical components:

- `OSDR adapter`: retrieves study metadata and files.
- `DONKI adapter`: retrieves space-weather event records.
- `Normalization layer`: validates and maps source records.
- `Persistence layer`: stores normalized records and provenance.
- `Analytics layer`: performs source-appropriate analysis.
- `API layer`: exposes validated records to the frontend.

The research-data pipeline must remain separate from the live/manual vital-sign pipeline unless a scientifically justified and explicitly validated integration is implemented.

## 7. Acceptance criteria

- [ ] OSDR study metadata and file references retain original identifiers.
- [ ] OSD-946 research data is labelled as ground-based research.
- [ ] OSD-946 QC statistics are not presented as astronaut health scores.
- [ ] OSD-946 is excluded from direct wearable-vitals model input.
- [ ] DONKI uses the current CCMC API base URL.
- [ ] DONKI event type and source identifiers are retained.
- [ ] Event timestamps are normalized to UTC.
- [ ] Missing optional fields do not break ingestion.
- [ ] Raw payloads or traceable source references are retained.
- [ ] HTTP errors, timeouts, and malformed responses are handled.
- [ ] DONKI events are not represented as personal radiation-dose measurements.
- [ ] Research, measured, modelled, simulated, and manual data remain distinguishable.

## 8. References

1. NASA Open Science Data Repository API: https://api.nasa.gov/
2. NASA OSDR overview: https://science.nasa.gov/biological-physical/data/osdr/
3. NASA CCMC announcements and DONKI migration: https://ccmc.gsfc.nasa.gov/news/major-updates/
4. NASA CCMC DONKI system: https://ccmc.gsfc.nasa.gov/tools/DONKI/
5. DONKI user guide: https://ccmc.gsfc.nasa.gov/DONKI/guide/
6. CCMC public APIs: https://ccmc.gsfc.nasa.gov/tools/API/
7. OSD-946 DOI: https://doi.org/10.26030/wzr2-r025
