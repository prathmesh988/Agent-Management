import csv

with open('Sample Sheet.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    headers = next(reader)

def make_camel(s):
    s = s.replace('%', 'Perc').replace('.', '').replace('-', ' ')
    parts = s.split()
    if not parts: return 'unknown'
    out = parts[0].lower()
    for p in parts[1:]:
        out += p.capitalize()
    return out

fixes = {
    'sNo': 'serialNo',
    'emplId': 'employeeId',
    'name': 'name',
    'ctc': 'ctc',
    'attenAllow': 'attendanceAllowance',
    'process': 'process',
    'designation': 'designation',
    'doj': 'dateOfJoining',
    'uanNo': 'uanNumber',
    'accountNumber': 'accountNumber',
    'ifscCode': 'ifscCode',
    'bankName': 'bankName',
    'mode': 'paymentMode',
    'present': 'presentDays',
    'absent': 'absentDays',
    'leave': 'leaveDays',
    'hd': 'halfDays',
    'weekOff': 'weekOffDays',
    'hoilday': 'holidayDays',
    'cl': 'cl',
    'lc': 'lc',
    'trp': 'trp',
    'tra': 'tra',
    'trl': 'trl',
    'totalPrsent': 'totalPresent',
    'ot': 'overtime',
    'finalDays': 'finalDays',
    'arrear': 'arrear',
    'advance': 'advance',
    'shiftAllow': 'shiftAllowance',
    'grossSalary': 'grossSalary',
    'employeePf': 'employeeContribution',
    'employeeEsic': 'employeeEsic',
    'employeerPf': 'employerContribution',
    'employeerEsic': 'employerEsic',
    'tds5Perc': 'tds',
    'netSalary': 'netSalary',
    'penalty': 'penalty',
    'paid': 'paidAmount',
}

db_cols = []
excel_mapping = []

atten_allow_count = 0

for h in headers:
    if h == 'Atten Allow':
        atten_allow_count += 1
        if atten_allow_count == 2:
            camel = 'attendanceDeduction'
        else:
            camel = 'attendanceAllowance'
    else:
        camel = make_camel(h)
        if camel in fixes:
            camel = fixes[camel]
    
    is_string = h in ['EmPl. ID', 'Name', 'Process', 'Designation', 'DOJ ', 'UAN NO.', 'ACCOUNT NUMBER', 'IFSC CODE', 'BANK NAME', 'Mode']
    if 'SUN' in h or 'MON' in h or 'TUE' in h or 'WED' in h or 'THU' in h or 'FRI' in h or 'SAT' in h:
        is_string = True
    
    col_type = 'string' if is_string else 'double'
    
    db_cols.append(f'      {{ key: "{camel}", type: "{col_type}" as const, required: {"true" if h == "Name" or h == "EmPl. ID" else "false"} }},')
    
    if col_type == 'string':
        excel_mapping.append(f"    '{h}': ['{camel}', (val: any) => String(val).trim()],")
    else:
        excel_mapping.append(f"    '{h}': ['{camel}', (val: any) => parseNum(val)],")

col_str = '\n'.join(db_cols)
map_str = '\n'.join(excel_mapping)

print('--- COLUMNS ---')
print(col_str)
print('--- MAPPING ---')
print(map_str)
