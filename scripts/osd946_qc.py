import csv
import gzip
import re
import statistics
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "raw" / "nasa" / "osd946"
RAW_DIR = DATA_DIR / "miRNA-array"

SAMPLE_OUTPUT = DATA_DIR / "qc_summary.csv"
GROUP_OUTPUT = DATA_DIR / "qc_group_summary.csv"

FILENAME_PATTERN = re.compile(
    r"_(CON|EX|FLY)__?(\d+)_(PRE|POST)_",
    re.IGNORECASE,
)


def read_sample(file_path):
    header = None
    total_probes = 0
    detected_probes = 0

    with gzip.open(
        file_path, "rt", encoding="utf-8-sig", newline=""
    ) as handle:
        reader = csv.reader(handle, delimiter="\t")

        for row in reader:
            if not row:
                continue

            record_type = row[0].strip().upper()

            # Actual column names are on the FEATURES row.
            if record_type == "FEATURES":
                header = [value.strip() for value in row[1:]]

                required = {"SystematicName", "gIsGeneDetected"}
                missing = required - set(header)

                if missing:
                    raise ValueError(
                        f"{file_path.name}: missing columns {missing}"
                    )

                systematic_index = header.index("SystematicName")
                detected_index = header.index("gIsGeneDetected")
                continue

            if record_type != "DATA" or header is None:
                continue

            values = row[1:]

            if len(values) < len(header):
                continue

            systematic_name = values[systematic_index].strip()

            # Count human miRNA probes only.
            if not systematic_name.lower().startswith("hsa-"):
                continue

            flag = values[detected_index].strip().lower()

            if flag not in {"0", "1", "true", "false"}:
                raise ValueError(
                    f"Unexpected detection flag {flag!r} "
                    f"in {file_path.name}"
                )

            total_probes += 1

            if flag in {"1", "true"}:
                detected_probes += 1

    if total_probes == 0:
        raise ValueError(
            f"No human miRNA probes found in {file_path.name}"
        )

    detection_percent = round(
        detected_probes / total_probes * 100, 2
    )

    return total_probes, detected_probes, detection_percent


def main():
    files = sorted(RAW_DIR.glob("*.txt.gz"))

    if len(files) != 44:
        raise ValueError(
            f"Expected 44 raw files, found {len(files)} in {RAW_DIR}"
        )

    sample_rows = []
    grouped = defaultdict(list)

    for index, file_path in enumerate(files, start=1):
        match = FILENAME_PATTERN.search(file_path.name)

        if not match:
            raise ValueError(
                f"Cannot extract group/time metadata: {file_path.name}"
            )

        group, subject, time = match.groups()
        group = group.upper()
        time = time.upper()

        total, detected, percentage = read_sample(file_path)

        if total != 50980:
            print(
                f"WARNING: {file_path.name}: "
                f"found {total} human probes, expected 50980"
            )

        sample_rows.append({
            "Sample": file_path.name,
            "TotalProbes": total,
            "DetectedProbes": detected,
            "DetectionPercent": percentage,
        })

        grouped[(group, time)].append(percentage)

        print(
            f"[{index}/44] {file_path.name}: "
            f"{detected}/{total} detected ({percentage}%)"
        )

    # Write individual sample QC.
    with SAMPLE_OUTPUT.open(
        "w", newline="", encoding="utf-8"
    ) as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "Sample",
                "TotalProbes",
                "DetectedProbes",
                "DetectionPercent",
            ],
        )
        writer.writeheader()
        writer.writerows(sample_rows)

    # Write group/timepoint summaries.
    group_rows = []

    for (group, time), percentages in sorted(grouped.items()):
        group_rows.append({
            "Group": group,
            "Time": time,
            "Samples": len(percentages),
            "AverageDetection": round(
                statistics.mean(percentages), 2
            ),
            "Minimum": round(min(percentages), 2),
            "Maximum": round(max(percentages), 2),
        })

    with GROUP_OUTPUT.open(
        "w", newline="", encoding="utf-8"
    ) as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "Group",
                "Time",
                "Samples",
                "AverageDetection",
                "Minimum",
                "Maximum",
            ],
        )
        writer.writeheader()
        writer.writerows(group_rows)

    print("\nQC generation completed.")
    print("Samples:", len(sample_rows))
    print("Group/time summaries:", len(group_rows))
    print("Mean detection:", round(
        statistics.mean(
            row["DetectionPercent"] for row in sample_rows
        ), 2
    ), "%")
    print("Sample CSV:", SAMPLE_OUTPUT)
    print("Group CSV:", GROUP_OUTPUT)


if __name__ == "__main__":
    main()
