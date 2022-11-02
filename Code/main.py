from constants import *

import gui
import sysTray
import canvas

def main():
    sysTray.startSysTray()
    canvas.startCanvasScan()
    window = gui.startGUI()

if __name__ == "__main__":
    main()