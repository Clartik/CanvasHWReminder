from constants import *
from datetime import datetime

import canvasapi.assignment
import core
import dearpygui.dearpygui as dpg
import dearpygui.demo as demo
import webbrowser

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

            self.launchButton = dpg.add_button(label='Launch Canvas', show=True, parent=parent,
                                               callback=self.launch_canvas)

        def launch_canvas(self):
            webbrowser.open(self.launchLink)

    def add_assignments(self, assignments: list):
        self.amountOfAssignments = len(assignments)

        for assignment in assignments:
            assignment: core.Assignment = assignment

            # Skip Adding if it already exists
            if assignment.name in (a.name for a in self.assignmentsList):
                continue

            assignmentObj = self.AssignmentText(assignment, self.courseNameText)
            self.assignmentsList.append(assignmentObj)

        if self.amountOfAssignments > 0:
            dpg.configure_item(self.courseNameText, default_open=True)
            dpg.configure_item(self.noAssigmentText, show=False)
        else:
            dpg.configure_item(self.courseNameText, default_open=False)
            dpg.configure_item(self.noAssigmentText, show=True)

app = None

class App:
    def __init__(self, name: str, width: int, height: int):
        self.name = name
        self.coursePanels = []

        dpg.create_context()
        dpg.create_viewport(title=self.name, width=width, height=height)
        dpg.setup_dearpygui()

        # region Fonts

        # add a font registry
        with dpg.font_registry():
            # first argument ids the path to the .ttf or .otf file
            default_font = dpg.add_font("../Font/Poppins-Regular.ttf", 20)

        # Sets Default Font
        dpg.bind_font(default_font)

        # endregion

        # region Callbacks

        dpg.set_viewport_resize_callback(self._vpResizeUpdate)
        dpg.set_exit_callback(self._exitCallBack)

        # endregion

        with dpg.window(horizontal_scrollbar=True, show=True) as self.mainPage:
            with dpg.group(horizontal=True):
                self.c1 = dpg.add_child_window(menubar=False,
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

        # dpg.show_style_editor()
        # dpg.show_font_manager()
        # demo.show_demo()

        dpg.show_viewport()
        dpg.set_viewport_vsync(True)
        dpg.set_primary_window(self.mainPage, True)
        dpg.start_dearpygui()
        dpg.destroy_context()

    def _vpResizeUpdate(self):
        for coursePanel in self.coursePanels:
            for assignmentText in coursePanel.assignmentsList:
                dpg.configure_item(assignmentText.assignmentText, wrap=(dpg.get_viewport_width() * 2) / 2.15)

    @staticmethod
    def _exitCallBack():
        dpg.stop_dearpygui()
        dpg.destroy_context()

        global app
        app = None

    def configCourse(self, allCourses: list):
        for course in allCourses:
            # If none of the registered course panels have this course, it will create one
            coursePanel = CoursePanel(course.name, course.assignments, root=self.c1)
            self.coursePanels.append(coursePanel)

    # Creates/Updates Courses GUI
    def updateCourse(self, course: core.Course):
        # Looks Through the Registers Course Panels to Find the Course of These Upcoming Assignments
        for coursePanel in self.coursePanels:
            coursePanel: CoursePanel = coursePanel

            if coursePanel.name == course.name:
                coursePanel.add_assignments(course.assignments)
                return


def createGUI(name: str, width: int, height: int):
    global app

    app = App(name, width, height)

def getGUI() -> App:
    return app
