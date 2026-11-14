import csv
import gzip
import re
import statistics
from pathlib import Path

DATA_DIR = Path("data/raw/nasa/osd946")
RAW_DIR = DATA_DIR / "miRNA-array"

SAMPLE_OUTPUT = DATA_DIR / "qc_summary.csv"
GROUP_OUTPUT = DATA_DIR / "qc_group_summary.csv"

TOTAL_EXPECTED_PROBES = 50980


def parse_metadata(filename):
    gsm = re.search(r"(GSM\d+)", filename, re.I)
    meta = re.search(
        r"_(CON|EX|FLY)__?(\d+)_(PRE|POST)_",
        filename,
        re.I
    )

    if not gsm or not meta:
        raise ValueError(f"Cannot parse sample metadata: {filename}")

    return (
        gsm.group(1).upper(),
        int(meta.group(2)),
        meta.group(1).upper(),
        meta.group(3).upper()
    )


def calculate_sample(file_path):
    gsm, subject, group, time = parse_metadata(file_path.name)

    in_features = False
    headers = None
    total_probes = 0
    detected_probes = 0

    with gzip.open(
        file_path,
        "rt",
        encoding="utf-8-sig",
        errors="replace",
        newline=""
    ) as handle:

        reader = csv.reader(handle, delimiter="\t")

        for row in reader:
            if not row:
                continue

            if row[0].strip() == "FEATURES":
                headers = row
                required = {"SystematicName", "gIsGeneDetected"}

                if not required.issubset(set(headers)):
                    raise ValueError(
                        f"Required columns missing in {file_path.name}"
                    )

                systematic_index = headers.index("SystematicName")
                detected_index = headers.index("gIsGeneDetected")
                in_features = True
                continue

            if not in_features or row[0].strip() != "DATA":
                continue

            if len(row) <= max(systematic_index, detected_index):
                continue

            systematic_name = row[systematic_index].strip()

            if not systematic_name.lower().startswith("hsa-"):
                continue

            total_probes += 1
            detected_value = row[detected_index].strip().lower()

            if detected_value in ("1", "true", "yes"):
                detected_probes += 1

    if total_probes == 0:
        raise ValueError(
            f"No human miRNA probes found in {file_path.name}"
        )

    if total_probes != TOTAL_EXPECTED_PROBES:
        print(
            f"WARNING: {file_path.name}: expected "
            f"{TOTAL_EXPECTED_PROBES} probes, found {total_probes}"
        )

    percentage = round(detected_probes / total_probes * 100, 2)

    return {
        "Sample": file_path.name,
        "GSM": gsm,
        "Subject": subject,
        "Group": group,
        "Time": time,
        "TotalProbes": total_probes,
        "DetectedProbes": detected_probes,
        "DetectionPercent": percentage
    }


def main():
    files = sorted(RAW_DIR.glob("*.txt.gz"))

    if len(files) != 44:
        raise RuntimeError(
            f"Expected 44 raw files, found {len(files)}. "
            "Check the raw data directory before proceeding."
        )

    records = [calculate_sample(path) for path in files]

    sample_columns = [
        "Sample",
        "GSM",
        "Subject",
        "Group",
        "Time",
        "TotalProbes",
        "DetectedProbes",
        "DetectionPercent"
    ]

    with SAMPLE_OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=sample_columns)
        writer.writeheader()
        writer.writerows(records)

    group_columns = [
        "Group",
        "Time",
        "Samples",
        "AverageDetection",
        "Minimum",
        "Maximum"
    ]

    grouped = {}

    for record in records:
        key = (record["Group"], record["Time"])
        grouped.setdefault(key, []).append(record["DetectionPercent"])

    with GROUP_OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=group_columns)
        writer.writeheader()

        for (group, time), values in sorted(grouped.items()):
            writer.writerow({
                "Group": group,
                "Time": time,
                "Samples": len(values),
                "AverageDetection": round(statistics.mean(values), 2),
                "Minimum": round(min(values), 2),
                "Maximum": round(max(values), 2)
            })

    print("\nOSD-946 QC generation complete")
    print("Samples processed:", len(records))
    print("Group/time combinations:", len(grouped))
    print("Sample CSV:", SAMPLE_OUTPUT)
    print("Group CSV:", GROUP_OUTPUT)
    print(
        "Overall mean detection:",
        round(statistics.mean(
            r["DetectionPercent"] for r in records
        ), 2),
        "%"
    )


if __name__ == "__main__":
    main()
