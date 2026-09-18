import {build} from 'esbuild';
import {mkdir,writeFile,chmod,copyFile,rename} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),desktop=join(homedir(),'Desktop');
await build({entryPoints:[join(root,'server/index.ts')],outfile:join(root,'dist-server/server.mjs'),bundle:true,platform:'node',format:'esm',target:'node22',logLevel:'warning'});
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
const launcher=join(root,'Open SignalForce.command'),setup=join(desktop,'Set Up SignalForce Research.command');
try{await rename(join(desktop,'Open SignalForce.command'),launcher)}catch(e){if(e.code!=='ENOENT')throw e}
await writeFile(launcher,`#!/bin/zsh\ncd ${quote(root)} || exit 1\n${quote(process.execPath)} ${quote(join(root,'scripts/launch.mjs'))}\nif [ $? -ne 0 ]; then\n  read '?Press Return to close.'\nfi\n`);await chmod(launcher,0o755);
await writeFile(setup,`#!/bin/zsh\nSIGNALGRAPH_NODE=${quote(process.execPath)} /usr/bin/python3 ${quote(join(root,'scripts/setup-research.py'))}\nread '?Press Return to close.'\n`);await chmod(setup,0o755);
try{await rename(join(desktop,'Revenue Compass.app'),join(desktop,'SignalForce.app'))}catch(e){if(e.code!=='ENOENT')throw e}
try{await rename(join(desktop,'Set Up Revenue Compass Research.command'),setup)}catch(e){if(e.code!=='ENOENT')throw e}
try{await rename(join(root,'Open Revenue Compass.command'),launcher)}catch(e){if(e.code!=='ENOENT')throw e}
try{await rename(join(desktop,'SignalGraph.app'),join(desktop,'SignalForce.app'))}catch(e){if(e.code!=='ENOENT')throw e}
try{await rename(join(desktop,'Set Up SignalGraph Research.command'),setup)}catch(e){if(e.code!=='ENOENT')throw e}
try{await rename(join(root,'Open SignalGraph.command'),launcher)}catch(e){if(e.code!=='ENOENT')throw e}
const app=join(desktop,'SignalForce.app','Contents');await mkdir(join(app,'MacOS'),{recursive:true});await mkdir(join(app,'Resources'),{recursive:true});
await writeFile(join(app,'Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleName</key><string>SignalForce</string><key>CFBundleDisplayName</key><string>SignalForce</string><key>CFBundleExecutable</key><string>SignalForce</string><key>CFBundleIdentifier</key><string>local.signalgraph.guide</string><key>CFBundleVersion</key><string>3</string><key>CFBundleShortVersionString</key><string>2.0</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleIconFile</key><string>AppIcon</string></dict></plist>`);
await writeFile(join(app,'MacOS','SignalForce'),`#!/bin/zsh\ncd ${quote(root)} || exit 1\n${quote(process.execPath)} ${quote(join(root,'scripts/launch.mjs'))}\nif [ $? -ne 0 ]; then\n  /usr/bin/open -a Terminal ${quote(launcher)}\nfi\n`);await chmod(join(app,'MacOS','SignalForce'),0o755);
await copyFile(join(root,'assets/AppIcon.icns'),join(app,'Resources/AppIcon.icns'));
await copyFile(join(root,'dist/index.html'),join(root,'Open Offline Map.html'));
console.log('Desktop app created: SignalForce.app. Key setup is separate; backup launcher is inside the project folder.');
