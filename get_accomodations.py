import json

def simplify_provider(text):
    """Parses checkbox output and determines if student, personnel, or both were checked"""
    text = text.replace("<", "").strip()
    tokens = text.split()

    if len(tokens) >= 4:
        status1, status2, role1, role2 = tokens[:4]

        student_selected = (role1.lower() == "student" and status2 == "SELECTED") or \
                           (role2.lower() == "student" and status1 == "SELECTED")

        personnel_selected = (role1.lower() == "personnel" and status2 == "SELECTED") or \
                             (role2.lower() == "personnel" and status1 == "SELECTED")

        if student_selected and personnel_selected:
            return "Both"
        elif student_selected:
            return "Student"
        elif personnel_selected:
            return "Personnel"
        else:
            return ""
    return text 

def extract_student_accommodations_from_json(
    input_json_path="filtered_current_placement_output.json",
    output_json_path="student_accommodations.json"
):
    """
    Extracts student accommodations from filtered Textract output and saves as structured JSON.

    Args:
        input_json_path (str): Path to the filtered output file from Textract.
        output_json_path (str): Path to save the extracted accommodations.

    Returns:
        List[dict]: List of extracted accommodation entries.
    """
    with open(input_json_path) as f:
        data = json.load(f)

    extracted_accommodations = []

    for entry in data:
        for table in entry.get("tables", []):
            if not table or not isinstance(table[0], list):
                continue

            header = table[0]
            lower_header = [h.lower() for h in header]

            # checking for the accomodations/aids/support table 
            if (
                "accommodations" in lower_header[0]
                or "aids" in lower_header[0]
                or "modifications" in lower_header[0]
                or lower_header[0].startswith("will be provided with")
            ):
                for row in table[1:]:
                    if len(row) < 6:
                        continue

                    support_text = row[0]
                    provider_info = simplify_provider(row[1])
                    dates = row[2]
                    frequency = row[3]
                    duration = row[4]
                    location = row[5]

                    # split date field as start/end dates
                    if " " in dates:
                        start_date, end_date = dates.split(" ", 1)
                    else:
                        start_date = dates
                        end_date = ""

                    extracted_accommodations.append({
                        "accomodations": support_text,
                        "to_support": provider_info,
                        "start_date": start_date,
                        "end_date": end_date,
                        "frequency": frequency,
                        "duration": duration,
                        "location": location
                    })

    with open(output_json_path, "w") as f:
        json.dump(extracted_accommodations, f, indent=2)

    print(f"{len(extracted_accommodations)} accommodations extracted and saved to {output_json_path}")
    return extracted_accommodations

if __name__ == "__main__":
    extract_student_accommodations_from_json()

