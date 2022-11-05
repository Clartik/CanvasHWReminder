from constants import *

import gui
import sysTray
import canvas

from threading import Thread

if __name__ == "__main__":
    Thread(sysTray.startSysTray()).start()
    Thread(canvas.startCanvasScan()).start()
    Thread(gui.createGUI(APP_NAME, 800, 500)).start()
