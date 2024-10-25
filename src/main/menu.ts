import { BrowserWindow, Menu, MenuItemConstructorOptions, nativeImage } from 'electron'
import { openPage } from './main';

import { ContextMenuParams, ContextMenuCommandParams } from 'src/shared/interfaces/contextMenuParams';
import { getIconPath } from './util/misc';

// const isMac = process.platform === 'darwin';

function createAppMenu() {
    const template: MenuItemConstructorOptions[] = [
        {
            label: "Open",
            submenu: [
                { 
                    label: "Home",
                    click: () => openPage('home')
                },
                { 
                    label: "Settings",
                    click: () => openPage('settings')
                },
                { 
                    label: "Credits",
                    click: () => openPage('credits')
                },
                { type: "separator" },
                { 
                    label: "Welcome",
                    click: () => openPage('welcome')
                },
                { 
                    label: "Setup Connect",
                    click: () => openPage('setupConnect')
                },
                { 
                    label: "Setup Configure",
                    click: () => openPage('setupConfigure')
                },
            ]
        },
        {
            label: "Debug",
            submenu: [
                { role: "reload" },
                { role: 'toggleDevTools' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createAssignmentContextMenu(webContents: Electron.WebContents, data: ContextMenuParams) {
    const isAssignmentValidForDontRemind = data.isAssignmentValidForDontRemind;
    const isAssignmentInDontRemind = data.isAssignmentInDontRemind;

    const returnData: ContextMenuCommandParams = {
        assignment: data.assignment
    };

    const remindMeIconPath = getIconPath('bell.png');
    const dontRemindMeIconPath = getIconPath('bell-slash.png');

    const remindMeIcon = nativeImage.createFromPath(remindMeIconPath).resize({width: 17});
    const dontRemindMeIcon = nativeImage.createFromPath(dontRemindMeIconPath).resize({width: 25});

    const template: MenuItemConstructorOptions[] = [
        isAssignmentInDontRemind ? {
            label: "Remind Me",
            click: () => { webContents.send('context-menu-command', 'do-remind', returnData)},
            enabled: isAssignmentValidForDontRemind,
            icon: remindMeIcon
        }
        : {
            label: "Dont Remind Me",
            checked: isAssignmentInDontRemind,
            click: () => { webContents.send('context-menu-command', 'dont-remind', returnData)},
            enabled: isAssignmentValidForDontRemind,
            icon: dontRemindMeIcon
        }
    ]

    const menu = Menu.buildFromTemplate(template);
    const mainWindow = BrowserWindow.fromWebContents(webContents);

    if (!mainWindow)
        return;

    menu.popup({ window: mainWindow })
}

export { createAppMenu, createAssignmentContextMenu };