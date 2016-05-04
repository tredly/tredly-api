#!/usr/local/bin/bash

##########################################################################
# Copyright 2016 Vuid Pty Ltd
# https://www.vuid.com
#
# This file is part of tredly-api.
#
# tredly-api is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# tredly-api is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with tredly-api.  If not, see <http://www.gnu.org/licenses/>.
##########################################################################

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
