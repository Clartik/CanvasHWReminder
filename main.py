from canvasapi import Canvas

canvas = Canvas("https://vcccd.instructure.com/", "5499~BXHt8xRg7WotXtqaA3JkJByvZGbXzPF5ortw6fgOMQwOVIKtINAPMTHmrWS1ZD7Z")

courses = canvas.get_courses(enrollment_state='active')

for course in courses:
    print(course.name)
    for assignment in course.get_assignments():
        print(assignment.name)