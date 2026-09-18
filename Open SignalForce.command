#!/bin/zsh
cd '/Users/omrigalor/Desktop/SignalGraph' || exit 1
'/usr/local/bin/node' '/Users/omrigalor/Desktop/SignalGraph/scripts/launch.mjs'
if [ $? -ne 0 ]; then
  read '?Press Return to close.'
fi
