import canvasapi
import datetime

canvas = canvasapi.Canvas("https://vcccd.instructure.com/", "5499~BXHt8xRg7WotXtqaA3JkJByvZGbXzPF5ortw6fgOMQwOVIKtINAPMTHmrWS1ZD7Z")

courses = canvas.get_courses(enrollment_state='active')

def ConvertToDateTime(time: str) -> datetime.datetime:
    convertedTime = datetime.datetime.strptime(time, '%Y-%m-%dT%H:%M:%SZ')
    convertedTime = convertedTime - datetime.timedelta(hours=7)
    convertedTime = convertedTime.strftime('%Y-%m-%d %I:%M:%S %p')
    return convertedTime

for course in courses:
    print(f'*** {course.name} ***')
    for assignment in course.get_assignments(bucket='upcoming', order='due_at'):
        assignmentDueDate = ConvertToDateTime(assignment.due_at)
        assignmentUnlockDate = ConvertToDateTime(assignment.unlock_at)
        currentDate = datetime.datetime.now().strftime('%Y-%m-%d %I:%M:%S %p')
        if currentDate <= assignmentUnlockDate:
