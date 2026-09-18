#!/usr/bin/env python3
"""Run in a normal Terminal. The secret is read without echo and never logged."""
import getpass, json, os, pathlib, sys, tempfile, subprocess, shutil
base=pathlib.Path.home()/'Library'/'Application Support'/'SignalGraph'
print('\nSignalForce — one-time research setup\n')
print('Use an OpenAI key (platform.openai.com/api-keys) or Anthropic key (console.anthropic.com).')
print('Research uses your API project and its billing. Set a project budget there.')
print('Your key stays in an owner-only file on this Mac, outside the browser and app folder.\n')
try:
    if not sys.stdin.isatty():
        raise ValueError('Run this setup by double-clicking the Desktop command in Terminal.')
    key=getpass.getpass('Paste your OpenAI or Anthropic API key (typing is hidden): ').strip()
    if not key.startswith('sk-') or len(key)<20 or any(c.isspace() for c in key):
        raise ValueError('That does not look like an API key. Nothing was changed.')
    anthropic=key.startswith('sk-ant-')
    provider='Anthropic' if anthropic else 'OpenAI'
    model=os.environ.get('SIGNALGRAPH_MODEL','claude-sonnet-4-6' if anthropic else 'gpt-5-mini')
    if not all(c.isalnum() or c in '-_.' for c in model):raise ValueError('Invalid model name. Nothing was changed.')
    print('Checking authentication (no paid model request)...')
    verified=False
    node=os.environ.get('SIGNALGRAPH_NODE') or shutil.which('node') or '/usr/local/bin/node'
    try:
        result=subprocess.run([node,str(pathlib.Path(__file__).with_name('verify-key.mjs'))],input=json.dumps({'key':key}),text=True,capture_output=True,timeout=30)
        status=json.loads(result.stdout).get('status',0)
        if status==401:
            raise ValueError(provider+' rejected this key (401). Create or copy a valid API key and run setup again. Your previous setup was not changed.')
        verified=status==200
        if not verified:print('Authentication could not be verified (status '+str(status)+'). The key will be saved; verify access in the app.')
    except (OSError,subprocess.TimeoutExpired,json.JSONDecodeError):
        print('The provider could not be reached for verification. The key will be saved, but live access is not yet verified.')
    base.mkdir(parents=True,exist_ok=True,mode=0o700);base.chmod(0o700)
    fd,name=tempfile.mkstemp(prefix='.credentials-',dir=base)
    try:
        os.fchmod(fd,0o600)
        with os.fdopen(fd,'w') as f:json.dump({'apiKey':key,'model':model,'provider':provider},f)
        os.replace(name,base/'credentials.json')
    finally:
        if os.path.exists(name):os.unlink(name)
    print('\nSaved'+(' and authentication verified.' if verified else '; authentication is not yet verified.'))
    print('Open SignalForce, choose Company research, and enter a company.\nNo key needs to be entered in the app. Setup has not made a paid model request.\nModel, web-search, and billing access are checked when you run research.')
except (KeyboardInterrupt,EOFError):
    print('\nCancelled. Your existing setup was kept.')
except Exception as e:
    print(str(e));sys.exit(1)
