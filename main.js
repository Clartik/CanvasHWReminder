const { app, BrowserWindow } = require('electron');

// const {PythonShell} = require('python-shell');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  });

  win.loadFile('mainPage.html');

  // PythonShell.run('test.py', null, function(err) {
  //   if (err) throw err;
  //   console.log('UH OH');
  // })

}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin')
    {
        app.quit()
    }
});