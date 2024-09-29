const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    name: "Canvas HW Reminder",
    icon: "./assets/images/icon.png",
    asar: true,
    extraResource: [
      "./assets/images/icon.ico"
    ]
  },
  makers: [
    // {
    //   name: '@electron-forge/maker-squirrel',
    //   config: {
    //     icon: './assets/images/icon.ico',
    //     setupIcon: "./assets/images/icon.ico",
    //   },
    // },
    // {
    //   name: '@electron-forge/maker-wix',
    //   config: {
    //     appUserModelId: "Canvas HW Reminder",
    //     description: "Canavs HW Reminder",
    //     exe: "Canavs HW Reminder",
    //     icon: './assets/images/icon.ico',
    //     manufacturer: "Clartik",
    //     name: "Canvas HW Reminder",
    //     programFilesFolderName: "Canvas HW Reminder",
    //     shortName: "CanvasHWReminder",
    //     shortcutFolderName: "Canvas HW Reminder",
    //     ui: {
    //       chooseDirectory: true
    //     }
    //   },
    // },
    // {
    //   name: '@electron-forge/maker-zip',
    //   platforms: ['darwin'],
    // },
    // {
    //   name: '@electron-forge/maker-deb',
    //   config: {},
    // },
    // {
    //   name: '@electron-forge/maker-rpm',
    //   config: {},
    // },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
