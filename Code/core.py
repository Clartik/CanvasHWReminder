from datetime import datetime
from zoneinfo import ZoneInfo

import tzlocal
import canvasapi

# Switching From UTC Timezone to Locacl Timezone
def ConvertToLocalTime(time: datetime) -> datetime:
    localTZ = ZoneInfo(str(tzlocal.get_localzone()))
    localtime = time.astimezone(localTZ)
    return localtime

# Connects to Canvas and Returns the Object
def connectToCanvas() -> canvasapi.canvas.Canvas:
    try:
        canvas = canvasapi.Canvas("https://vcccd.instructure.com/",
                                  "5499~bcVvGMzdng3rwfyMgLKiEaSLekEyaSZJchKxsV8Wq5HHdFeGeNAwYxX8FgoTE4fU")
        return canvas
    except:
        print("[ERROR]: Couldn't Connect to Canvas")
        return None

class Assignment(object):
    def __init__(self, assignment: canvasapi.paginated_list.PaginatedList, canvas: canvasapi.canvas.Canvas):
        self.name = assignment.name

        # Convert Course ID to Course Object
        self.course: canvasapi.course.Course = canvas.get_course(int(assignment.course_id))

        self.url = assignment.html_url

        assignmentDueDate = ConvertToLocalTime(assignment.due_at_date)
        self.dueDate = assignmentDueDate

        if assignment.unlock_at:
            assignmentUnlockDate = ConvertToLocalTime(assignment.unlock_at_date)

            self.unlockDate = assignmentUnlockDate
        else:
            self.unlockDate = None

    # Sets How the Class is Printed
    def __str__(self):
        return f'Assignment: {self.name} | Course: {self.course} | Due: {self.dueDate} | Unlocked: {self.unlockDate} | URL: {self.url}'

class Course:
    def __init__(self, courseName: str, courseId: int):
        self.name = courseName
        self.id = courseId
        self.assignments = []

    def add_assignment(self, assignment: Assignment):
        self.assignments.append(assignment)

    def remove_assignment(self, assignment: Assignment):
        self.assignments.remove(assignment)