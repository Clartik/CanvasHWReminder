import pystray
import gui

from PIL import Image
from constants import *

def startSysTray():
    image = Image.open("4k.png")

    # In order for the icon to be displayed, you must provide an icon
    icon = pystray.Icon(
        name=APP_NAME,
        icon=image,
        title=APP_NAME,
        menu=pystray.Menu(
            pystray.MenuItem('Open App', action=gui.startGUI(), default=True),
            pystray.MenuItem('Settings', lambda e: print('Settings')),
        )
    )

    # Run on Seperate Thread
    icon.run_detached()