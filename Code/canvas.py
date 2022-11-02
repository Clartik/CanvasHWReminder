from datetime import datetime, timedelta

import canvasapi.course
from winotify import Notification
from threading import Thread
from constants import *

import time
import core
import gui

# TODO: RESET EVERY DAY
shownComingNextDay = False

upcomingAssignments = []

def updateGUI(courseAssignments: list):
    gui.updateCourses(courseAssignments)

def startCanvasScan():
    # Starts Independent Threads
    Thread(target=upcomingAssignmentsUpdate).start()
    Thread(target=assignmentDueReminderUpdate).start()

# region Upcoming Assignments

def upcomingAssignmentsUpdate():
    while True:
        updateUpcomingAssignments()
        time.sleep(UPCOMING_UPDATE_TIME)

def updateUpcomingAssignments():
    global upcomingAssignments

    # Connects to Canvas
    canvas = core.connectToCanvas()

    # Couldn't Connect to Canvas
    if not canvas:
        # TODO: Add GUi
        return

    # Only Get Courses That Are Happening Right Now
    courses = canvas.get_courses(enrollment_state='active')

    # No Courses
    if not courses:
        print(NO_COURSES)
        return

    for course in courses:
        specificCourseAssignments = []

        # Converts Obj for Intellisense
        course: canvasapi.course.Course = course

        for assignment in course.get_assignments(bucket='upcoming', order_by='due_at'):
            # Converts Obj for Intellisense
            assignment: canvasapi.assignment.Assignment = assignment

            # Creates an Assignment Object
            assignmentFormated = core.Assignment(assignment, canvas)

            currentDate = datetime.now()
            currentDate = core.ConvertToLocalTime(currentDate)

            # Checks if There is An Unlock Date
            # Should Skip if There Isn't As Not All Teachers Will Put Those (JAPN PROF)
            if assignmentFormated.unlockDate:
                # If the Assignment Hasn't Been Unlocked Yet
                if currentDate <= assignmentFormated.unlockDate:
                    return

            # Gets Tomorrow's Date
            tomorrow = currentDate + timedelta(days=1)

            # Gets Tomorrow's Date at the Last Second
            tomorrowLastPossibleSecond = tomorrow.replace(hour=11, minute=59, second=59)

            # Checks to See If The Assignment is Due Within the Next Day Up to 11:59:59 PM
            if assignmentFormated.dueDate <= tomorrowLastPossibleSecond:
                upcomingAssignments.append(assignmentFormated)
                specificCourseAssignments.append(assignmentFormated)

        updateGUI(specificCourseAssignments)

# endregion

# region Assignment Due Reminder

def dueSoonReminder(assignmentDueSoon):
    # No Assignment Due Soon
    if not assignmentDueSoon:
        return

    # Summary Reminder (Reminds About More Than One Assignment)
    if len(assignmentDueSoon) > 1:
        assignmentFormat = ''
        for assignment in assignmentDueSoon:
            assignmentCourse = assignment.course.name
            assignmentCourse = assignmentCourse[:8]     # Removing the Course Number From Name

            if assignmentCourse not in assignmentFormat:
                assignmentFormat += HW_DUE_TMR_DETAILS.format(course=assignmentCourse)

        toast = Notification(app_id=APP_NAME,
                             title=HW_DUE_TMR_TITLE,
                             msg=assignmentFormat,
                             duration='short')

        # TODO: Create File that Has All Assignments Due
        # toast.add_actions(label='See All Assignments Due',
        #                   launch=assignment.url)
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

def assignmentDueReminderUpdate():
    while True:
        assignmentDueReminder()
        time.sleep(UPDATE_REMIND_TIME)

def assignmentDueReminder():
    global upcomingAssignments
    global shownComingNextDay

    if not upcomingAssignments:
        print(NO_ASSIGNMENT_DUE)
        return

    currentDate = datetime.now()
    currentDate = core.ConvertToLocalTime(currentDate)

    dueInNextHours = currentDate + timedelta(hours=4)
    dueInDay = (currentDate + timedelta(days=1)).replace(hour=11, minute=59, second=59)

    assignmentsDueInNextHours = []
    assignmentsDueInDay = []
    for assignment in upcomingAssignments['assignments']:
        if assignment.dueDate <= dueInNextHours:
            assignmentsDueInNextHours.append(assignment)
        elif assignment.dueDate <= dueInDay and not shownComingNextDay:
            assignmentsDueInDay.append(assignment)

    # Sends Notification
    dueSoonReminder(assignmentsDueInNextHours)
    dueSoonReminder(assignmentsDueInDay)

    if assignmentsDueInDay and not shownComingNextDay:
        shownComingNextDay = True

# endregion