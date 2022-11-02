from constants import *

import canvasapi.assignment
import core
import dearpygui.dearpygui as dpg
import dearpygui.demo as demo

coursePanels = []

# class CoursePanel:
#     def __init__(self, courseName: str, assignments: str, parent):
#         self.name = courseName
#         self.assignments = assignments
#         self.parent = parent
#         self.amountOfAssignments = len(self.assignments)
#         self.courseNameText = None
#         self.courseAssignmentText = None
#         self.launchButton = None
#
#         with dpg.tree_node(label=self.name, default_open=True if self.amountOfAssignments > 0 else False, parent=self.parent) as self.courseNameText:
#             dpg.add_text('No Assignments Are Due As Of the Moment')
#             self.launchButton = dpg.add_button(label='Launch Canvas', show=False)
#             self.set_assignments_text(self.assignments)
#
#     def set_course_info(self, name: str, assignments: list):
#         self.name = name
#         self.assignments = assignments
#         # Updates the Course Information
#         dpg.configure_item(self.courseNameText, label=self.name)
#         self.set_assignments_text(assignments)
#
#     @staticmethod
#     def create_new_assignment_text(i: int, assignment: core.Assignment):
#         dpg.add_text(assignment.name, tag=f'assignmentText{i}')
#         dpg.add_button(label='Launch Canvas', show=True, tag=f'assignmentButton{i}')
#
#     def set_assignments_text(self, assignments: list):
#         self.amountOfAssignments = len(assignments)
#         self.assignments = assignments
#
#         for assignment in self.assignments:
#             assignment: canvasapi.assignment.Assignment = assignment
#             dpg.set_value(self.courseAssignmentText, assignment.name)
#             dpg.configure_item(self.launchButton, show=True)
#
#         if self.amountOfAssignments <= 0:
#             dpg.configure_item(self.courseNameText, default_open=False)
#             dpg.set_item_label(self.courseAssignmentText, 'No Assignments Are Due As Of the Moment')
#             dpg.configure_item(self.launchButton, show=False)
#         else:
#             dpg.configure_item(self.courseNameText, default_open=True)

dpg.create_context()
dpg.create_viewport(title=APP_NAME, width=800, height=500)
dpg.setup_dearpygui()
dpg.show_viewport()

def vpResizeUpdate():
    dpg.set_item_width(c1, dpg.get_viewport_width() / 2)
    dpg.set_item_width(c2, (dpg.get_viewport_width() / 2) + dpg.get_viewport_width())

dpg.set_viewport_resize_callback(vpResizeUpdate)

with dpg.window(tag="Main Page") as mainPage:
    with dpg.group(horizontal=True):
        with dpg.child_window(menubar=False,
                              border=False,
                              autosize_y=True,
                              width=dpg.get_viewport_width() / 2) as c1:
            with dpg.tree_node(label='Course 1', default_open=True):
                dpg.add_text('Assignment 1')
        with dpg.child_window(menubar=False,
                              border=False,
                              autosize_y=True,
                              # Need to Add as I want it to start drawing after the previous window
                              width=(dpg.get_viewport_width() / 2) + dpg.get_viewport_width()) as c2:
            with dpg.tree_node(label='Course 2', default_open=False):
                dpg.add_text('No Assignments Available')

# Creates/Updates Courses GUI
def updateCourses(courseAssignments: list):
    global coursePanels

    if not courseAssignments:
        return

    # Looks Through the Registers Course Panels to Find the Course of These Upcoming Assignments
    for course in coursePanels:
        if course.name == courseAssignments[0].course.name:
            course.set_course_info(course.name, courseAssignments)
            return

    # If none of the registered course panels have this course, it will create one
    coursePanel = CoursePanel(courseAssignments[0].course.name, courseAssignments, parent=group1)
    coursePanels.append(coursePanel)

# dpg.show_style_editor()
# dpg.show_font_manager()
demo.show_demo()

dpg.set_primary_window(mainPage, True)

# def startGUI():
dpg.start_dearpygui()
dpg.destroy_context()
