import dearpygui.dearpygui as dpg\

import dearpygui.demo as demo

from constants import *

class CoursePanel:
    def __init__(self, name: str, assignments: list):
        self.name = name
        self.assignments = assignments

        amountOfAssignments = len(self.assignments)

        with dpg.tree_node(label=self.name, default_open=True if amountOfAssignments > 0 else False):
            for i in range(amountOfAssignments):
                courseAssignment = dpg.add_text(assignments[i])
                launchButton = dpg.add_button(label='Launch Canvas')

            if amountOfAssignments <= 0:
                noAssignmentsDue = dpg.add_text('No Assignments Are Due As Of the Moment')

dpg.create_context()

with dpg.window(tag="Main Page") as mainPage:
    coursePanel1 = CoursePanel('Course 1', ['Assignment 1', 'Assignment 2'])
    coursePanel2 = CoursePanel('Course 2', [])
    coursePanel3 = CoursePanel('Course 3', ['Assignment 1'])
    coursePanel4 = CoursePanel('Course 4', ['Assignment 1'])

# dpg.show_style_editor()
# dpg.show_font_manager()
demo.show_demo()

dpg.create_viewport(title=APP_NAME, width=800, height=500)
dpg.setup_dearpygui()
dpg.show_viewport()
dpg.set_primary_window(mainPage, True)
dpg.start_dearpygui()
dpg.destroy_context()