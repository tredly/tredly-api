#!/usr/local/bin/bash

set -e

# make sure this user is root
euid=$( id -u )
if test $euid != 0
then
   echo "Please run this installer as root." 1>&2
   exit 1
fi

BINDIR="/usr/local/sbin/tredly-api"

echo -e "\u001b[32m\u001b[1m################\u001b[22m\u001b[39m"
echo -e "\u001b[32m\u001b[1m### Installing Tredly Host API... \u001b[22m\u001b[39m"

echo -e "\u001b[32m\u001b[1m### Installing Node.js... \u001b[22m\u001b[39m"
pkg install -y node

echo -e "\u001b[32m\u001b[1m### Installing NPM... \u001b[22m\u001b[39m"
pkg install -y npm

echo -e "\u001b[32m\u001b[1m### Moving installation folder... \u001b[22m\u001b[39m"
rm -rf .git
rm -rf "${BINDIR}"
mkdir -p "${BINDIR}/"
mv -f ./tredlyapi /etc/rc.d/
chmod 555 /etc/rc.d/tredlyapi
mv -f ./* "${BINDIR}/"
rm -rf ./*
cd "${BINDIR}/"
pwd

echo -e "\u001b[32m\u001b[1m### Installing dependencies... \u001b[22m\u001b[39m"
npm install

echo -e "\u001b[32m\u001b[1m### Installing Tredly Host API server... \u001b[22m\u001b[39m"
node ./lib/install.js $@

echo -e "\u001b[32m\u001b[1m### Starting Tredly Host API server... \u001b[22m\u001b[39m"
service tredlyapi stop &> /dev/null || true
service tredlyapi start


echo -e "\u001b[32m\u001b[1m### ################"
echo -e "\u001b[32m\u001b[1m### Tredly Host API Installation complete. \u001b[22m\u001b[39m"
