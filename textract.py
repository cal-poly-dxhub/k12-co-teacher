import pdfplumber
from PyPDF2 import PdfReader, PdfWriter
from pdf2image import convert_from_path
from io import BytesIO
import boto3
import json

# splitting pdf to specific section
def find_section_page_range(pdf_path, section_title, end_marker=None, max_pages=3):
    start_page, end_page = None, None
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                if start_page is None and section_title.lower() in text.lower():
                    start_page = i
                elif start_page is not None and end_marker and end_marker.lower() in text.lower():
                    end_page = i - 1
                    break
        if start_page is not None and end_page is None:
            end_page = min(start_page + max_pages - 1, total_pages - 1)

    print(f"start page: {start_page}")
    print(f"end page: {end_page}")
    return (start_page, end_page)

def extract_page_range(input_pdf_path, output_pdf_path, start_page, end_page):
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()
    for page_num in range(start_page, end_page + 1):
        writer.add_page(reader.pages[page_num])
    with open(output_pdf_path, "wb") as f:
        writer.write(f)

# textract helpers
def analyze_with_textract(pdf_path):
    textract = boto3.client("textract", region_name="us-west-2")
    pages = convert_from_path(pdf_path, dpi=300)
    all_responses = []

    for i, page in enumerate(pages):
        img_bytes = BytesIO()
        page.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        print(f"Sending page {i + 1} to Textract...")
        response = textract.analyze_document(
            Document={"Bytes": img_bytes.read()},
            FeatureTypes=["TABLES"]
        )
        all_responses.append(response)

    return all_responses

def get_section_top_y(blocks, section_title):
    for block in blocks:
        if block["BlockType"] == "LINE" and section_title.lower() in block.get("Text", "").lower():
            return block["Geometry"]["BoundingBox"]["Top"]
    return None

def extract_tables_from_textract_blocks(blocks):
    block_map = {block["Id"]: block for block in blocks}
    tables = []

    for block in blocks:
        if block["BlockType"] == "TABLE":
            cell_blocks = []
            for rel in block.get("Relationships", []):
                if rel["Type"] == "CHILD":
                    for cell_id in rel["Ids"]:
                        cell = block_map[cell_id]
                        if cell["BlockType"] == "CELL":
                            cell_blocks.append(cell)

            max_row = max(cell["RowIndex"] for cell in cell_blocks)
            max_col = max(cell["ColumnIndex"] for cell in cell_blocks)
            table = [["" for _ in range(max_col)] for _ in range(max_row)]

            for cell in cell_blocks:
                row_idx = cell["RowIndex"] - 1
                col_idx = cell["ColumnIndex"] - 1
                cell_text_parts = []

                for rel in cell.get("Relationships", []):
                    if rel["Type"] == "CHILD":
                        for child_id in rel["Ids"]:
                            child = block_map[child_id]
                            if child["BlockType"] == "WORD":
                                cell_text_parts.append(child["Text"])
                            elif child["BlockType"] == "SELECTION_ELEMENT":
                                cell_text_parts.append(child["SelectionStatus"])

                table[row_idx][col_idx] = " ".join(cell_text_parts).strip()

            tables.append(table)
    return tables

def extract_tables_after_section(blocks, section_title):
    section_top_y = get_section_top_y(blocks, section_title)
    if section_top_y is None:
        return []
    # filter only tables below section_top_y
    tables_below = [
        block for block in blocks
        if block["BlockType"] == "TABLE" and
        block["Geometry"]["BoundingBox"]["Top"] >= section_top_y
    ]
    return extract_tables_from_textract_blocks(tables_below)


def extract_text_not_in_tables(blocks, section_top_y=None):
    table_bboxes = [
        block["Geometry"]["BoundingBox"]
        for block in blocks
        if block["BlockType"] == "TABLE"
    ]
    non_table_lines = []
    for block in blocks:
        if block["BlockType"] != "LINE":
            continue

        top = block["Geometry"]["BoundingBox"]["Top"]

        if section_top_y is not None and top < section_top_y:
            continue

        overlaps_table = any(
            top >= tb["Top"] and top <= tb["Top"] + tb["Height"]
            for tb in table_bboxes
        )

        if not overlaps_table:
            non_table_lines.append(block["Text"])

    return non_table_lines

# processing the IEP accomadations section

def process_section_with_textract(full_pdf_path, section_title, end_marker=None, output_tmp_pdf="section_extract.pdf"):
    start_page, end_page = find_section_page_range(full_pdf_path, section_title, end_marker)
    if start_page is None:
        raise ValueError(f"Can't find: {section_title}")
    
    print(f"Section detected on pages {start_page + 1} to {end_page + 1}")
    extract_page_range(full_pdf_path, output_tmp_pdf, start_page, end_page)
    textract_responses = analyze_with_textract(output_tmp_pdf)
    return textract_responses


if __name__ == "__main__":
    textract_data = process_section_with_textract(
        full_pdf_path="student_reports/OHI Report.pdf",
        section_title="CURRENT PLACEMENT/GOALS/SUPPLEMENTARY AIDS/RELATED SERVICES",
        end_marker="INTERVIEWS"
    )

    extracted = []
    section_found = False

    for i, page in enumerate(textract_data):
        blocks = page["Blocks"]

        if not section_found:
            section_top_y = get_section_top_y(blocks, "CURRENT PLACEMENT/GOALS/SUPPLEMENTARY AIDS/RELATED SERVICES")
            if section_top_y is not None:
                section_found = True

                # first page only want lines below the section and not in tables
                filtered_text = extract_text_not_in_tables(blocks, section_top_y)
                filtered_tables = extract_tables_after_section(blocks, "CURRENT PLACEMENT/GOALS/SUPPLEMENTARY AIDS/RELATED SERVICES")

                extracted.append({
                    "text": filtered_text,
                    "tables": filtered_tables
                })

        elif section_found:
            # all lines not in tables
            full_text = extract_text_not_in_tables(blocks)
            full_tables = extract_tables_from_textract_blocks(blocks)

            extracted.append({
                "text": full_text,
                "tables": full_tables
            })

    with open("filtered_current_placement_output.json", "w") as f:
        json.dump(extracted, f, indent=2)
    print("saved filtered output to filtered_current_placement_output.json")
