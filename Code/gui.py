from constants import *
from datetime import datetime

import canvasapi.assignment
import core
import dearpygui.dearpygui as dpg
import dearpygui.demo as demo
import webbrowser

coursePanels = []

class CoursePanel:
    def __init__(self, courseName: str, assignments: list, root):
        self.name = courseName
        self.root = root
        self.amountOfAssignments = len(assignments)
        self.assignmentsList = []

        with dpg.tree_node(label=self.name[:-8], default_open=True if self.amountOfAssignments > 0 else False,
                           parent=self.root) as self.courseNameText:
            self.noAssigmentText = dpg.add_text('No Assignments Are Due As Of the Moment', show=True)
            self.add_assignments(assignments)

    class AssignmentText:
        def __init__(self, assignmentObj: core.Assignment, parent):
            self.name = assignmentObj.name
            self.dueDate: str = assignmentObj.dueDate.strftime('%#I:%M %p')
            self.launchLink = assignmentObj.url

            currentDate = datetime.now()
            currentDate = core.ConvertToLocalTime(currentDate)

            dueToday = currentDate.date() == assignmentObj.dueDate.date()

            self.assignmentText = dpg.add_text(self.name,
                                               parent=parent,
                                               wrap=(dpg.get_viewport_width() * 2) / 2.15
                                               # wrap=dpg.get_viewport_width() / 2.25
                                               )
            if dueToday:
                self.dueDateText = dpg.add_text(f'Due at {self.dueDate}', parent=parent)
            else:
                self.dueDateText = dpg.add_text(f'Due Tomorrow at {self.dueDate}', parent=parent)

            self.launchButton = dpg.add_button(label='Launch Canvas', show=True, parent=parent, callback=self.launch_canvas)

        def launch_canvas(self):
            webbrowser.open(self.launchLink)

    def add_assignments(self, assignments: list):
        self.amountOfAssignments = len(assignments)

        for assignment in assignments:
            if assignment.name in (a.name for a in self.assignmentsList):
                return

            assignment: core.Assignment = assignment

            assignmentObj = self.AssignmentText(assignment, self.courseNameText)
            self.assignmentsList.append(assignmentObj)

        if self.amountOfAssignments > 0:
            dpg.configure_item(self.courseNameText, default_open=True)
            dpg.configure_item(self.noAssigmentText, show=False)
        else:
            dpg.configure_item(self.courseNameText, default_open=False)
            dpg.configure_item(self.noAssigmentText, show=True)

dpg.create_context()
dpg.create_viewport(title=APP_NAME, width=800, height=500)
dpg.setup_dearpygui()
dpg.show_viewport()

# region Fonts

# add a font registry
with dpg.font_registry():
    # first argument ids the path to the .ttf or .otf file
    default_font = dpg.add_font("Font/Poppins-Regular.ttf", 20)

# Sets Default Font
dpg.bind_font(default_font)

# endregion

def vpResizeUpdate():
    for coursePanel in coursePanels:
        for assignmentText in coursePanel.assignmentsList:
            dpg.configure_item(assignmentText.assignmentText, wrap=(dpg.get_viewport_width() * 2) / 2.15)

def exitCall():
    dpg.stop_dearpygui()
    dpg.destroy_context()
    exit()

dpg.set_viewport_resize_callback(vpResizeUpdate)
dpg.set_exit_callback(exitCall)

with dpg.window(tag="Main Page", horizontal_scrollbar=True) as mainPage:
    with dpg.group(horizontal=True):
        c1 = dpg.add_child_window(menubar=False,
                                  border=False,
                                  autosize_y=True,
                                  autosize_x=True,
                                  horizontal_scrollbar=True
                                  # width=dpg.get_viewport_width() / 2
                                  )
        # c2 = dpg.add_child_window(menubar=False,
        #                           border=False,
        #                           autosize_y=True,
        #                           # Need to Add as I want it to start drawing after the previous window
        #                           width=(dpg.get_viewport_width() / 2) + dpg.get_viewport_width() - 50)

# Creates/Updates Courses GUI
def updateCourse(course: core.Course):
    global coursePanels

    # Looks Through the Registers Course Panels to Find the Course of These Upcoming Assignments
    for coursePanel in coursePanels:
        coursePanel: CoursePanel = coursePanel

        if coursePanel.name == course.name:
            coursePanel.add_assignments(course.assignments)
            return

def configCourse(allCourses: list):
    global coursePanels

    for course in allCourses:
        # If none of the registered course panels have this course, it will create one
        coursePanel = CoursePanel(course.name, course.assignments, root=c1)
        coursePanels.append(coursePanel)

# dpg.show_style_editor()
# dpg.show_font_manager()
# demo.show_demo()

dpg.set_primary_window(mainPage, True)

def startGUI():
    dpg.start_dearpygui()
    dpg.destroy_context()
