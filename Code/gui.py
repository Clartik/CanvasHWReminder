import dearpygui.dearpygui as dpg\

import dearpygui.demo as demo

from constants import *

class CoursePanel:
    def __init__(self, name: str, assignments: list):
        self.name = name
        self.assignments = assignments
        self.amountOfAssignments = len(self.assignments)
        self.courseNameText = None
        self.courseAssignmentText = None
        self.launchButton = None

        with dpg.tree_node(label=self.name, default_open=True if self.amountOfAssignments > 0 else False) as self.courseNameText:
            self.set_assignments_text(self.assignments)

    def set_course_info(self, name: str, assignments: list):
        self.name = name
        self.assignments = assignments
        self.courseNameText = dpg.set_item_label(self.courseAssignmentText, self.name)
        self.set_assignments_text(assignments)

    def set_assignments_text(self, assignments: list):
        for i in range(self.amountOfAssignments):
            self.courseAssignmentText = dpg.add_text(assignments[i])
            self.launchButton = dpg.add_button(label='Launch Canvas')

        if self.amountOfAssignments <= 0:
            self.courseAssignmentText = dpg.add_text('No Assignments Are Due As Of the Moment')

dpg.create_context()
dpg.create_viewport(title=APP_NAME, width=800, height=500)
dpg.setup_dearpygui()
dpg.show_viewport()

with dpg.window(tag="Main Page") as mainPage:
    with dpg.group(horizontal=True):
        with dpg.group(width=(dpg.get_viewport_width() / 2)):
            coursePanel1 = CoursePanel('Course 1', ['Assignment 1', 'Assignment 2'])
            coursePanel2 = CoursePanel('Course 2', [])
            coursePanel3 = CoursePanel('Course 3', ['Assignment 1'])
            coursePanel4 = CoursePanel('Course 4', ['Assignment 1'])

        with dpg.group(width=(dpg.get_viewport_width() / 2)):
            coursePanel1 = CoursePanel('Course 1', ['Assignment 1', 'Assignment 2'])
            coursePanel2 = CoursePanel('Course 2', [])
            coursePanel3 = CoursePanel('Course 3', ['Assignment 1'])
            coursePanel4 = CoursePanel('Course 4', ['Assignment 1'])

def updateCourses(courseName, upcomingAssignments: dict):
    pass

# dpg.show_style_editor()
# dpg.show_font_manager()
demo.show_demo()

dpg.set_primary_window(mainPage, True)
dpg.start_dearpygui()
dpg.destroy_context()
