import canvasapi
from datetime import datetime, timedelta

canvas = canvasapi.Canvas("https://vcccd.instructure.com/", "5499~bcVvGMzdng3rwfyMgLKiEaSLekEyaSZJchKxsV8Wq5HHdFeGeNAwYxX8FgoTE4fU")

courses = canvas.get_courses(enrollment_state='active')

def ConvertToDateTime(time: str) -> datetime:
    convertedTime = datetime.strptime(time, '%Y-%m-%dT%H:%M:%SZ')
    convertedTime = convertedTime - timedelta(hours=7)
    convertedTime = convertedTime.strftime('%Y-%m-%d %I:%M:%S %p')
    return convertedTime

for course in courses:
    print(f'*** {course.name} ***')
    for assignment in course.get_assignments(bucket='upcoming', order='due_at'):
        assignmentDueDate = ConvertToDateTime(assignment.due_at)
        assignmentUnlockDate = ConvertToDateTime(assignment.unlock_at)
        currentDate = datetime.now().strftime('%Y-%m-%d %I:%M:%S %p')
        if currentDate <= assignmentUnlockDate:
            if datetime.strptime(assignmentDueDate, '%Y-%m-%d %I:%M:%S %p') > datetime.strptime(currentDate, '%Y-%m-%d %I:%M:%S %p').replace(hour=18, minute=0, second=0, microsecond=-0) and datetime.strptime(assignmentDueDate, '%Y-%m-%d %I:%M:%S %p') < (datetime.strptime(currentDate, '%Y-%m-%d %I:%M:%S %p') + timedelta(days=1)).replace(hour=12, minute=0, second=0, microsecond=-0):
                print("ok")