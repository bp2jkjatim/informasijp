from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE_FILE = ROOT / "Data SDM BP2JK Jatim.20260420121614502.xlsx"
OUTPUT_FILE = ROOT / "public" / "data" / "jp-data.json"

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkg": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def load_shared_strings(workbook_zip: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(workbook_zip.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    items = []
    for string_item in root.findall("main:si", NS):
        texts = [node.text or "" for node in string_item.iterfind(".//main:t", NS)]
        items.append("".join(texts))
    return items


def get_sheet_path(workbook_zip: zipfile.ZipFile, target_name: str) -> str:
    workbook = ET.fromstring(workbook_zip.read("xl/workbook.xml"))
    workbook_rels = ET.fromstring(workbook_zip.read("xl/_rels/workbook.xml.rels"))
    relation_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in workbook_rels.findall("pkg:Relationship", NS)
    }

    for sheet in workbook.findall("main:sheets/main:sheet", NS):
        if sheet.attrib.get("name") == target_name:
            relationship_id = sheet.attrib.get(f"{{{NS['rel']}}}id")
            target = relation_map[relationship_id]
            return f"xl/{target}"

    raise RuntimeError(f'Sheet "{target_name}" not found in workbook.')


def column_letters(cell_reference: str) -> str:
    return "".join(re.findall(r"[A-Z]+", cell_reference))


def parse_cell(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value = cell.find("main:v", NS)
    if value is None or value.text is None:
        return ""

    raw_value = value.text
    if cell_type == "s":
      return shared_strings[int(raw_value)]

    if raw_value.endswith(".0"):
        return raw_value[:-2]
    return raw_value


def read_rows(workbook_zip: zipfile.ZipFile, sheet_path: str, shared_strings: list[str]) -> list[dict[str, str]]:
    root = ET.fromstring(workbook_zip.read(sheet_path))
    rows = []

    for row in root.findall(".//main:sheetData/main:row", NS):
        row_data = {}
        for cell in row.findall("main:c", NS):
            row_data[column_letters(cell.attrib["r"])] = parse_cell(cell, shared_strings)
        rows.append(row_data)

    return rows


def normalize_records(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    records = []
    for row in rows[1:]:
        if not row.get("B"):
            continue

        total_hours = float(row.get("C", "0") or 0)
        employee_type = (row.get("E") or "").strip().upper()
        threshold = 20 if employee_type == "PNS" else 0
        completed = total_hours >= threshold if employee_type == "PNS" else total_hours > 0
        progress = round(min(100, (total_hours / threshold) * 100)) if threshold else (100 if total_hours > 0 else 0)

        records.append(
            {
                "sequence": int(row.get("A", len(records) + 1)),
                "name": row.get("B", "").strip(),
                "totalHours": total_hours,
                "statusText": row.get("D", "").strip(),
                "employeeType": employee_type,
                "completed": completed,
                "progress": progress,
            }
        )

    return records


def main() -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(SOURCE_FILE) as workbook_zip:
        shared_strings = load_shared_strings(workbook_zip)
        sheet_path = get_sheet_path(workbook_zip, "Sheet1")
        rows = read_rows(workbook_zip, sheet_path, shared_strings)
        records = normalize_records(rows)

    payload = {
        "sourceFile": SOURCE_FILE.name,
        "records": records,
    }

    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} records to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
