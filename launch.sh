#!/bin/bash
export PATH=`pwd`/node_modules/.2.27.2@chromedriver/lib/chromedriver:$PATH
export DISPLAY=:1.5
Xvfb :1 -screen 5 1024x768x8 &
npm run start
