#!/usr/local/bin/bash

set -e

# make sure this user is root
euid=$( id -u )
if test $euid != 0
then
   echo "Please run this installer as root." 1>&2
   exit 1
fi

read -t 1 STDIN || true

BINDIR="/usr/local/sbin/tredly-api"

echo -e "\u001b[32m\u001b[1m################\u001b[22m\u001b[39m"
echo -e "\u001b[32m\u001b[1m### Installing Tredly Host API... \u001b[22m\u001b[39m"

echo -e "\u001b[32m\u001b[1m### Installing Node.js... \u001b[22m\u001b[39m"
/usr/sbin/pkg install -y node4

echo -e "\u001b[32m\u001b[1m### Installing NPM... \u001b[22m\u001b[39m"
/usr/sbin/pkg install -y npm2

echo -e "\u001b[32m\u001b[1m### Moving installation folder... \u001b[22m\u001b[39m"
rm -rf .git
rm -rf "${BINDIR}"
mkdir -p "${BINDIR}/"
mv -f ./tredlyapi /usr/local/etc/rc.d/
chmod 555 /usr/local/etc/rc.d/tredlyapi
mv -f ./* "${BINDIR}/"
rm -rf ./*
cd "${BINDIR}/"
pwd

echo -e "\u001b[32m\u001b[1m### Installing dependencies... \u001b[22m\u001b[39m"
/usr/local/bin/npm install

echo -e "\u001b[32m\u001b[1m### Installing Tredly Host API server... \u001b[22m\u001b[39m"
API_PASSWORD="$(/usr/local/bin/node ./lib/install.js --username=admin --password="$STDIN" --port=65223 --ssl)"
echo -e "Your API password is: ${API_PASSWORD}"

echo -e "\u001b[32m\u001b[1m### Starting Tredly Host API server... \u001b[22m\u001b[39m"
echo tredlyapi_enable=\"YES\" >> /etc/rc.conf
service tredlyapi stop &> /dev/null || true
service tredlyapi start


echo -e "\n\n"
echo -e "\u001b[33m\u001b[1m### IMPORTANT \u001b[22m\u001b[39m"
echo -e "\u001b[33m\u001b[1m### Tredly API has been configured for USER - \"admin\", PASSWORD - \"${API_PASSWORD}\" \u001b[22m\u001b[39m"
echo -e "\u001b[33m\u001b[1m### Please, use \"tredly config api\" command if you want to change the credentials \u001b[22m\u001b[39m"
echo -e "\n\n"

sleep 10

echo -e "\u001b[32m\u001b[1m### ################"
echo -e "\u001b[32m\u001b[1m### Tredly Host API Installation complete. \u001b[22m\u001b[39m"

