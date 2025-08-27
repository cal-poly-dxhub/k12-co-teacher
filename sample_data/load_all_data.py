import boto3
import json
import os
from decimal import Decimal

# Table mappings
TABLE_MAPPINGS = {
    'k12-coteacher-student-profiles': 'sample-student-profiles',
    'k12-coteacher-class-attributes': 'sample-class-attributes', 
    'k12-coteacher-class-to-students': 'sample-class-to-student',
    'k12-coteacher-teacher-to-classes': 'sample-teachers-to-class'
}

def load_json_files(directory):
    """Load all JSON files from directory and subdirectories"""
    items = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f, parse_float=Decimal)
                        items.append(data)
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")
    return items

def load_data_to_table(table_name, data_directory):
    """Load data from directory to DynamoDB table"""
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.Table(table_name)
    
    items = load_json_files(data_directory)
    
    for item in items:
        try:
            # Map field names to partition keys
            if table_name == 'k12-coteacher-student-profiles' and 'studentID' in item:
                item['studentId'] = item['studentID']
            elif table_name == 'k12-coteacher-class-attributes' and 'classID' in item:
                item['classId'] = item['classID']
            elif table_name == 'k12-coteacher-class-to-students' and 'classID' in item:
                item['classId'] = item['classID']
            elif table_name == 'k12-coteacher-teacher-to-classes' and 'teacherID' in item:
                item['teacherId'] = item['teacherID']
            
            table.put_item(Item=item)
            print(f"Added item to {table_name}")
        except Exception as e:
            print(f"Error adding item to {table_name}: {e}")
    
    print(f"Loaded {len(items)} items to {table_name}")

def main():
    for table_name, data_dir in TABLE_MAPPINGS.items():
        print(f"\nLoading data for {table_name}...")
        load_data_to_table(table_name, data_dir)
    
    print("\nAll data loaded successfully!")

if __name__ == "__main__":
    main()