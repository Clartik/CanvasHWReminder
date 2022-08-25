import canvasapi
from datetime import datetime, timedelta
from win10toast_click import ToastNotifier
import webbrowser

onScreenTime = 10
notifyMessageCharLimit = 160

canvas = canvasapi.Canvas("https://vcccd.instructure.com/", "5499~bcVvGMzdng3rwfyMgLKiEaSLekEyaSZJchKxsV8Wq5HHdFeGeNAwYxX8FgoTE4fU")

courses = canvas.get_courses(enrollment_state='active')

def ConvertToDateTime(time: str) -> datetime:
    convertedTime = datetime.strptime(time, '%Y-%m-%d %I:%M %p')
    return convertedTime

def ConvertCanvasTimeToDateTime(time: str) -> datetime:
    convertedTime = datetime.strptime(time, '%Y-%m-%dT%H:%M:%SZ')
    convertedTime = convertedTime - timedelta(hours=7)
    convertedTime = convertedTime.strftime('%Y-%m-%d %I:%M %p')
    convertedTime = ConvertToDateTime(convertedTime)
    return convertedTime
    
def LaunchCanvas():
    webbrowser.open_new_tab('https://vcccd.instructure.com/')

for course in courses:
    for assignment in course.get_assignments(bucket='upcoming', order='due_at'):
        assignmentDueDate = ConvertCanvasTimeToDateTime(assignment.due_at)
        assignmentUnlockDate = ConvertCanvasTimeToDateTime(assignment.unlock_at)
        currentDate = datetime.now().strftime('%Y-%m-%d %I:%M %p')
        currentDate = ConvertToDateTime(currentDate)
        # assignmentDueDate = f'{currentDate.strftime("%Y-%m-%d")} 11:59 PM'
        # assignmentDueDate = ConvertToDateTime(assignmentDueDate)
        if currentDate <= assignmentUnlockDate:
            if assignmentDueDate > currentDate.replace(hour=18, minute=0, second=0, microsecond=-0) and assignmentDueDate < (currentDate + timedelta(days=1)).replace(hour=12, minute=0, second=0, microsecond=-0):
                toast = ToastNotifier()
                if assignmentDueDate.day == currentDate.day:
                    toast.show_toast(title='Homework Due', msg=f'{assignment.name if len(assignment.name) <= notifyMessageCharLimit else assignment.name[:notifyMessageCharLimit] + "..."} is Due At {assignmentDueDate.strftime("%#I:%M %p")}', duration=onScreenTime, threaded=True, callback_on_click=LaunchCanvas)
                else:
                    toast.show_toast(title='Homework Due', msg=f'{assignment.name if len(assignment.name) <= notifyMessageCharLimit else assignment.name[:notifyMessageCharLimit] + "..."} is Due On {assignmentDueDate.strftime("%#m/%#d/%y")} At {assignmentDueDate.strftime("%#I:%M %p")}', duration=onScreenTime, threaded=True, callback_on_click=LaunchCanvas)
