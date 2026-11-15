import httpx

client = httpx.Client(base_url="http://127.0.0.1:8000", timeout=20.0)

print("=== 1. NASA OSDR OVERVIEW (OSD-946) ===")
r_osdr = client.get("/api/v1/research/osd946/overview")
print("Status:", r_osdr.status_code)
osdr_data = r_osdr.json()
print("Study Title:", osdr_data["metadata"]["title"])
print("Accession:", osdr_data["metadata"]["accession"], "/", osdr_data["metadata"]["genelab_id"])
print("Tissue:", osdr_data["metadata"]["tissue"])
print("Total Samples:", osdr_data["statistics"]["total_samples"])
groups = [f"{g['group']}_{g['time']} (avg {g['average_detection']}%)" for g in osdr_data["group_summaries"]]
print("Groups:", groups)
print("Notice:", osdr_data["scientific_notice"]["telemetry_boundary"])

print("\n=== 2. NASA OSDR SAMPLES ===")
r_samples = client.get("/api/v1/research/osd946/samples")
print("Status:", r_samples.status_code)
samples = r_samples.json()["samples"]
print("Total samples retrieved:", len(samples))
print("Sample 1:", samples[0]["sample_id"], "Group:", samples[0]["group"], "Time:", samples[0]["time"], "Detection %:", samples[0]["detection_percent"])

print("\n=== 3. POST TELEMETRY INGESTION ===")
tel_payload = {
    "astronaut_id": "astro_03",
    "heart_rate": 74.5,
    "systolic_bp": 121.0,
    "diastolic_bp": 79.0,
    "spo2": 98.3,
    "body_temperature": 36.85,
    "respiration_rate": 15.0,
    "data_source": "SYNTHETIC_SIMULATED",
    "is_simulated": True,
    "dataset_reference": "TEST_LIVE_API_RUN"
}
r_tel = client.post("/api/v1/telemetry", json=tel_payload)
print("Status (201 expected):", r_tel.status_code)
tel_res = r_tel.json()
print("Saved Telemetry ID:", tel_res["telemetry"]["id"])
print("Overall Status:", tel_res["assessment_summary"]["overall_status"])
print("Highest Severity:", tel_res["assessment_summary"]["highest_severity"])

print("\n=== 4. ASTRONAUT TELEMETRY HISTORY ===")
r_hist = client.get("/api/v1/astronauts/astro_03/telemetry")
print("Status:", r_hist.status_code)
print("Record count in database:", len(r_hist.json()))

print("\n=== 5. ASTRONAUT ALERTS ===")
r_alerts = client.get("/api/v1/astronauts/astro_03/alerts")
print("Status:", r_alerts.status_code)
print("Alerts count for astro_03:", len(r_alerts.json()))
