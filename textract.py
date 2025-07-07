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

def extract_tables_from_textract_blocks(blocks):
    block_map = {block["Id"]: block for block in blocks}
    tables = []

    for block in blocks:
        if block["BlockType"] != "TABLE":
            continue

        cell_blocks = []
        for rel in block.get("Relationships", []):
            if rel["Type"] == "CHILD":
                for cell_id in rel["Ids"]:
                    cell = block_map.get(cell_id)
                    if cell and cell["BlockType"] == "CELL":
                        cell_blocks.append(cell)

        if not cell_blocks:
            continue

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
                        child = block_map.get(child_id)
                        if child:
                            if child["BlockType"] == "WORD":
                                cell_text_parts.append(child["Text"])
                            elif child["BlockType"] == "SELECTION_ELEMENT":
                                cell_text_parts.append(child["SelectionStatus"])

            table[row_idx][col_idx] = " ".join(cell_text_parts).strip()

        tables.append(table)

    return tables

# processing the IEP accommadations section
def process_section_with_textract(full_pdf_path, section_title, end_marker=None, output_tmp_pdf="section_extract.pdf"):
    start_page, end_page = find_section_page_range(full_pdf_path, section_title, end_marker)
    if start_page is None:
        raise ValueError(f"Can't find: {section_title}")
    
    print(f"Section detected on pages {start_page + 1} to {end_page + 1}")
    extract_page_range(full_pdf_path, output_tmp_pdf, start_page, end_page)
    textract_responses = analyze_with_textract(output_tmp_pdf)
    return textract_responses


def extract_placement_and_goals_section(
    full_pdf_path,
    section_title="CURRENT PLACEMENT/GOALS/SUPPLEMENTARY AIDS/RELATED SERVICES",
    end_marker="INTERVIEWS",
    save_to_file="filtered_current_placement_output.json"
):
    """
    Extracts all TABLE blocks from a defined section of the student report using Textract.

    Args:
        full_pdf_path (str): Path to the input PDF.
        section_title (str): Title of the section to extract from.
        end_marker (str): Title of the section where extraction should stop.
        save_to_file (str): Optional path to save the JSON output.

    Returns:
        list: A list of dicts with extracted "tables" per page.
    """
    textract_data = process_section_with_textract(
        full_pdf_path=full_pdf_path,
        section_title=section_title,
        end_marker=end_marker
    )

    extracted = []

    for i, page in enumerate(textract_data):
        blocks = page["Blocks"]
        tables = extract_tables_from_textract_blocks(blocks)
        if tables:
            extracted.append({"tables": tables})

    if save_to_file:
        with open(save_to_file, "w") as f:
            json.dump(extracted, f, indent=2)
        print(f"saved all tables from section to {save_to_file}")

    return extracted


if __name__ == "__main__":
    extract_placement_and_goals_section("student_reports/SLD Report.pdf")