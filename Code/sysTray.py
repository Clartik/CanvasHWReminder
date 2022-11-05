import pystray
import gui

from PIL import Image
from constants import *
from threading import Thread

def launchGUI():
    if gui.getGUI():
        return

    Thread(target=gui.createGUI(APP_NAME, 800, 500)).start()

def startSysTray():
    image = Image.open("../4k.png")

    # In order for the icon to be displayed, you must provide an icon
    icon = pystray.Icon(
        name=APP_NAME,
        icon=image,
        title=APP_NAME,
        menu=pystray.Menu(
            pystray.MenuItem('Open App', launchGUI, default=True),
            pystray.MenuItem('Settings', lambda e: print('Settings')),
        )
    )

    # Run on Seperate Thread
    icon.run()