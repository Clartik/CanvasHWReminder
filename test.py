import canvasapi

canvas = canvasapi.Canvas("https://vcccd.instructure.com/",
                                  "5499~bcVvGMzdng3rwfyMgLKiEaSLekEyaSZJchKxsV8Wq5HHdFeGeNAwYxX8FgoTE4fU")

courses = canvas.get_courses(enrollment_state='active')

for course in courses:
    print(course.name)