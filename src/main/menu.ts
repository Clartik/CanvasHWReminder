import { Menu, MenuItemConstructorOptions } from 'electron'
import { openPage } from './main';

// const isMac = process.platform === 'darwin';

const template: MenuItemConstructorOptions[] = [
    {
        label: "Open Page",
        submenu: [
            { 
                label: "Home",
                click: async () => openPage('home')
            },
            { 
                label: "Settings",
                click: async () => openPage('settings')
            },
            { 
                label: "Credits",
                click: async () => openPage('credits')
            },
            { type: "separator" },
            { 
                label: "Welcome",
                click: async () => openPage('welcome')
            },
            { 
                label: "Setup Connect",
                click: async () => openPage('setupConnect')
            },
            { 
                label: "Setup Configure",
                click: async () => openPage('setupConfigure')
            },
        ]
    }
];

function createMenu() {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

export default createMenu;