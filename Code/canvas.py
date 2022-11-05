from datetime import datetime, timedelta

import canvasapi.course
from threading import Thread
from constants import *

import time
import core
import gui
import notifier

# TODO: RESET EVERY DAY
shownComingNextDay = False

allCourses = []

def updateGUI(course: core.Course):
    app = gui.getGUI()

    if not app:
        return

    app.updateCourse(course)

def configGUI():
    global allCourses

    app = gui.getGUI()

    if not app:
        return

    app.configCourse(allCourses)

def startCanvasScan():
    # Starts Independent Threads
    Thread(target=upcomingAssignmentsUpdate).start()
    # Thread(target=assignmentDueReminderUpdate).start()

# region Upcoming Assignments

def upcomingAssignmentsUpdate():
    while True:
        updateUpcomingAssignments()
        time.sleep(UPCOMING_UPDATE_TIME)

def updateUpcomingAssignments():
    global allCourses
    global allCourses

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
        # ADD GUI
        return

    if not allCourses:
        for course in courses:
            cObj = core.Course(course.name, course.id)
            allCourses.append(cObj)

        configGUI()

    for course in courses:
        # Converts Obj for Intellisense
        course: canvasapi.course.Course = course

        courseObj = core.Course(course.name, course.id)

        # Later
        # # Checks If Current Course Exists in All Courses
        # if courseObj.name not in (c.name for c in allCourses):
        #     allCourses.append(courseObj)
        #     configGUI()

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
            tomorrow = currentDate.replace(hour=0, minute=0, second=0) + timedelta(days=1)

            # Gets Tomorrow's Date at the Last Second
            tomorrowLastPossibleSecond = tomorrow.replace(hour=23, minute=59, second=59)

            # Checks to See If The Assignment is Due Within the Next Day Up to 11:59:59 PM
            if assignmentFormated.dueDate <= tomorrowLastPossibleSecond:
                courseObj.add_assignment(assignmentFormated)
                updateGUI(courseObj)

# endregion

# region Assignment Due Reminder

def assignmentDueReminderUpdate():
    while True:
        assignmentDueReminder()
        time.sleep(UPDATE_REMIND_TIME)

def assignmentDueReminder():
    global allCourses
    global shownComingNextDay

    if not allCourses:
        print(NO_ASSIGNMENT_DUE)
        return

    currentDate = datetime.now()
    currentDate = core.ConvertToLocalTime(currentDate)

    dueInNextHours = currentDate + timedelta(hours=4)
    dueInDay = (currentDate + timedelta(days=1)).replace(hour=23, minute=59, second=59)

    assignmentsDueInNextHours = []
    assignmentsDueInDay = []
    for course in allCourses:
        for assignment in course.assignments:
            if assignment.dueDate <= dueInNextHours:
                assignmentsDueInNextHours.append(assignment)
            elif assignment.dueDate <= dueInDay and not shownComingNextDay:
                assignmentsDueInDay.append(assignment)

    # Sends Notification
    notifier.dueSoonReminder(assignmentsDueInNextHours)
    notifier.dueSoonReminder(assignmentsDueInDay)

    if assignmentsDueInDay and not shownComingNextDay:
        shownComingNextDay = True

# endregion