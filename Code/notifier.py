from constants import *
from winotify import Notification

import gui

def dueSoonReminder(assignmentDueSoon):
    # No Assignment Due Soon
    if not assignmentDueSoon:
        return

    # Summary Reminder (Reminds About More Than One Assignment)
    if len(assignmentDueSoon) > 1:
        assignmentFormat = ''
        for assignment in assignmentDueSoon:
            assignmentCourse = assignment.course.name[:-8]  # Removing the Course Number From Name

            if assignmentCourse not in assignmentFormat:
                assignmentFormat += HW_DUE_TMR_DETAILS.format(course=assignmentCourse)

        toast = Notification(app_id=APP_NAME,
                             title=HW_DUE_TMR_TITLE,
                             msg=assignmentFormat,
                             duration='long')

        toast.add_actions(label=HW_DUE_TMR_ACTION,
                          launch=gui.startGUI())
    # Reminds About One Assignment
    else:
        # Assigns the First Element Since Only One Assignment is Due Soon
        assignmentDue = assignmentDueSoon[0]
        assignmentDueDate = assignmentDue.dueDate
        # Converts Date Time to A Easy-to-Understand Time Format (7:06 PM)
        assignmentDueDate = assignmentDueDate.strftime('%#I:%M %p')

        assignmentCourse = assignmentDue.course.name
        assignmentCourse = assignmentCourse[:8]  # Removing the Course Number From Name

        toast = Notification(app_id=APP_NAME,
                             title=HW_DUE_HOURS_TITLE,
                             msg=HW_DUE_HOURS_DETAILS.format(assignment=assignmentDue,
                                                             course=assignmentCourse,
                                                             dueDate=assignmentDueDate),
                             duration='short')

        toast.add_actions(label=HW_DUE_HOURS_ACTION,
                          launch=assignmentDue.url)

    toast.show()
