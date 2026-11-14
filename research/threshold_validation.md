
# SPACECARE — Scientific Threshold Validation

**Status:** Provisional engineering specification
**Last reviewed:** 2026-11-14
**Purpose:** Define safe input validation, anomaly detection, threshold provenance, and scientific limitations.

---

## 1. Scope and safety statement

SPACECARE is a research and decision-support prototype. It is not a certified medical device, clinical diagnostic system, or operational NASA flight-health system.

The thresholds currently implemented in the API are input-validation boundaries. They are not clinical normal ranges, emergency limits, astronaut fitness criteria, or NASA-approved alarm thresholds.

Three concepts must remain separate:

1. **Input validation:** Checks whether submitted data is structurally and numerically acceptable.
2. **Anomaly detection:** Identifies unusual patterns relative to a defined baseline or statistical model.
3. **Clinical alerting:** Requires clinically justified limits, validated procedures, and appropriate medical oversight.

A successful input-validation response must never be interpreted as confirmation that a person is healthy.

## 2. Existing API input-validation bounds

The current Pydantic schema applies these broad numerical boundaries:

| Parameter | API lower bound | API upper bound | Unit |
|---|---:|---:|---|
| Heart rate | > 0 | 250 | bpm |
| SpO2 | > 0 | 100 | % |
| Systolic blood pressure | > 0 | 300 | mmHg |
| Diastolic blood pressure | > 0 | 200 | mmHg |
| Body temperature | > 25 | < 45 | °C |
| Respiration rate | > 0 | 80 | breaths/min |
| HRV RMSSD | >= 0 | 300 | ms |

These are permissive software input bounds intended to reject impossible or unsupported values. They are not medically validated safe operating ranges.

A value passing these checks may still be clinically concerning. A value outside them may represent a sensor fault, unit mismatch, data-entry error, or an unusual physiological event.

### 2.1 Validation requirements

- Reject missing required fields.
- Reject non-numeric values.
- Reject values outside the schema bounds.
- Reject empty astronaut identifiers.
- Preserve the submitted value and unit.
- Record the timestamp and data source.
- Do not silently clamp, replace, or normalize invalid values.
- Return a clear validation error.
- Do not generate a clinical diagnosis from schema validation.

## 3. Threshold evidence and validation status

Every threshold used by SPACECARE must have an explicit status.

| Status | Meaning |
|---|---|
| `INPUT_VALIDATION` | Software boundary only |
| `PROVISIONAL_ENGINEERING` | Candidate algorithmic rule, not clinically approved |
| `LITERATURE_SUPPORTED` | Supported by a cited scientific source, but not necessarily validated for this mission |
| `CLINICALLY_VALIDATED` | Reviewed and approved for the intended population and operational use |
| `NASA_PROGRAM_APPROVED` | Approved through the applicable NASA program authority |

SPACECARE must not label a threshold clinically validated or NASA-approved without documentary evidence and the relevant approval.

## 4. Physiological parameter policy

### 4.1 Heart rate

- Store heart rate in beats per minute.
- Check sensor quality and timestamp validity.
- Compare against an individual's established baseline where sufficient data exists.
- Consider sustained deviations and changes over time.
- Do not treat a single unusual reading as a diagnosis.

**Current status:** Input validation only. No clinically approved SPACECARE heart-rate alarm threshold.

### 4.2 Blood pressure

- Store systolic and diastolic values separately in mmHg.
- Preserve both values and their measurement timestamps.
- Check for incomplete measurements and implausible combinations.
- Evaluate trends only when measurement quality and context are adequate.

NASA aerospace medical certification criteria are designed for astronaut selection and recertification. They must not be reused as generic in-flight emergency alert limits.

**Current status:** Input validation only. No clinically approved SPACECARE blood-pressure alarm threshold.

### 4.3 Oxygen saturation (SpO2)

- Store the percentage and measurement timestamp.
- Account for sensor quality and possible motion artefacts.
- Flag missing, stale, or poor-quality readings separately.
- Use sustained baseline deviation only as a provisional engineering signal.

**Current status:** Input validation only. No clinically approved SPACECARE SpO2 alarm threshold.

### 4.4 Body temperature

- Store the value in degrees Celsius.
- Record the measurement method and sensor source where available.
- Do not compare measurements from different sensor methods as if they were interchangeable.
- Evaluate trends with measurement quality and context.

**Current status:** Input validation only. No clinically approved SPACECARE temperature alarm threshold.

### 4.5 Respiration rate

- Store breaths per minute and the measurement method.
- Reject missing or invalid measurements.
- Evaluate sustained deviations relative to an established baseline.
- Distinguish manually entered values from sensor-derived values.

**Current status:** Input validation only. No clinically approved SPACECARE respiration alarm threshold.

### 4.6 Heart-rate variability (HRV RMSSD)

- Store RMSSD in milliseconds.
- Record the calculation method and source window when available.
- Compare only measurements generated using compatible methods.
- Prefer individual baseline and longitudinal trends over a universal cutoff.

**Current status:** Input validation only. No clinically approved SPACECARE HRV alarm threshold.

## 5. Provisional statistical anomaly detection

A statistical anomaly detector may be used for prototype evaluation. It must be labelled `PROVISIONAL_ENGINEERING`.

### 5.1 Baseline construction

For each astronaut and parameter:

1. Collect valid observations with timestamps.
2. Exclude missing, stale, duplicated, and poor-quality observations.
3. Require a documented minimum baseline sample count.
4. Calculate a rolling median.
5. Calculate the median absolute deviation (MAD).
6. Record the baseline window and algorithm version.

Do not compare one astronaut's measurements against another astronaut's baseline without an explicitly justified model.

### 5.2 Robust deviation score

For a valid observation x:

`robust_z = 0.6745 * (x - rolling_median) / MAD`

Where:

- `x` is the current observation.
- `rolling_median` is the baseline median.
- `MAD` is the median absolute deviation.

A candidate statistical flag may be raised when:

`abs(robust_z) > 3`

This is a proposed engineering parameter for testing. It is not a NASA medical threshold or a validated clinical alarm criterion.

### 5.3 Persistence and quality rules

For prototype evaluation:

- Require a configurable number of consecutive valid observations before raising a sustained-deviation candidate.
- Make the persistence count and time window configurable.
- Do not count missing or poor-quality observations as normal.
- Do not interpolate missing observations into safety-critical alerts without an explicitly validated method.
- Handle MAD equal to zero using a documented fallback; do not divide by zero.
- Record the values, baseline, score, and algorithm version used for each flag.
- Allow a candidate flag to clear when subsequent valid observations return toward baseline.

The persistence count and rolling window must be treated as tunable experimental settings, not established medical rules.

### 5.4 Example candidate output

```json
{
  "status": "candidate_anomaly",
  "validation_status": "PROVISIONAL_ENGINEERING",
  "parameter": "heart_rate",
  "observed_value": 110,
  "unit": "bpm",
  "baseline_method": "rolling_median_mad",
  "robust_z_score": 3.2,
  "persistence": "pending_validation",
  "clinical_assessment": "not_performed",
  "message": "Statistical deviation detected. Clinical interpretation is not performed."
}
```

This is an illustrative output structure, not a real astronaut observation or validated alert.

## 6. Data-quality and alert states

Keep data quality separate from physiological interpretation.

Recommended states:

| State | Meaning |
|---|---|
| `VALID` | Passed structural and configured input checks |
| `INVALID` | Failed input validation |
| `STALE` | Older than the configured freshness window |
| `MISSING` | No measurement available |
| `POOR_QUALITY` | Sensor or measurement quality is insufficient |
| `CANDIDATE_ANOMALY` | Provisional statistical deviation detected |
| `NOT_ASSESSED` | No validated assessment has been performed |

A missing or stale measurement must never be displayed as a normal measurement.

A candidate anomaly is not a diagnosis and must not be described as a medical emergency without validated clinical criteria.

## 7. Radiation and space-weather thresholds

Radiation requires a separate validation process.

The following are distinct:

- DONKI space-weather event records.
- Instrument-measured radiation dose or dose rate.
- Modelled radiation exposure estimates.
- Simulated radiation values.

A CME or SEP event record alone cannot determine an individual astronaut's absorbed dose or effective dose.

A radiation assessment must document, as applicable:

- Measurement or model source.
- Instrument or model identifier.
- Radiation quantity.
- Unit.
- Measurement interval.
- Calibration or model version.
- Shielding assumptions.
- Spacecraft location and mission context.
- Uncertainty and limitations.

Do not create a universal radiation alarm threshold from a DONKI event category.

Mission-specific exposure limits and radiation alert rules require the applicable radiation standard, mission profile, instrument characteristics, and authorized technical review.

**Current status:** No validated personal radiation-dose alarm threshold is implemented.

## 8. Threshold registry

Future thresholds should be stored as versioned configuration records.

Recommended logical structure:

```json
{
  "threshold_id": "HR_BASELINE_DEVIATION_V1",
  "parameter": "heart_rate",
  "unit": "bpm",
  "method": "rolling_median_mad",
  "configuration": {
    "robust_z_limit": 3.0
  },
  "status": "PROVISIONAL_ENGINEERING",
  "source": "SPACECARE engineering proposal",
  "rationale": "Prototype statistical deviation detection",
  "population": "Not clinically validated",
  "effective_from": null,
  "reviewed_by": null,
  "algorithm_version": "1.0"
}
```

The example is a candidate configuration, not a medically approved limit.

Every threshold change must record:

- Previous and new values.
- Unit.
- Source and evidence.
- Rationale.
- Reviewer.
- Review date.
- Intended population and mission context.
- Validation status.
- Software or model version.

## 9. Testing and acceptance criteria

- [ ] Input validation is tested for all physiological fields.
- [ ] Boundary values and invalid types are tested.
- [ ] Schema limits are documented as software bounds only.
- [ ] Missing and stale measurements are not classified as normal.
- [ ] Manual, simulated, and sensor-derived records retain source labels.
- [ ] Baseline calculations use valid, timestamped observations.
- [ ] Statistical anomaly rules are explicitly marked provisional.
- [ ] MAD-zero and insufficient-baseline cases are handled.
- [ ] Persistence logic is configurable and tested.
- [ ] Candidate anomalies are not presented as diagnoses.
- [ ] No universal clinical threshold is claimed without evidence.
- [ ] DONKI events are not converted directly into personal radiation dose.
- [ ] Threshold configuration and algorithm versions are traceable.

## 10. Scientific references

1. NASA-STD-3001 Volume 1, Revision C — Crew Health:
   https://www.nasa.gov/reference/nasa-std-3001v1/

2. NASA Technical Standards System — NASA-STD-3001 Volume 1, active standard record:
   https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_1

3. NASA Aerospace Medical Certification Standard:
   https://www.nasa.gov/organizations/ochmo/aerospace-medical-certification-standard/

4. NASA Crew Health Records — monitoring, trend analysis, and record security:
   https://www.nasa.gov/reference/7-0-crew-health-records/

5. NASA Human Spaceflight Standards overview:
   https://www.nasa.gov/ochmo/human-spaceflight-and-aviation-standards/

---

**Final scientific limitation:** The current SPACECARE prototype validates input and can support experimental statistical anomaly detection. It does not yet implement medically validated astronaut alert thresholds or NASA-approved clinical decision logic.
