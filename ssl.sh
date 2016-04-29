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

# make sure this user is root
euid=$( id -u )
if test $euid != 0
then
   echo "Please run this installer as root." 1>&2
   exit 1
fi


mkdir -p .ssl

echo -e "\u001b[32m>>> Generating a Private Key \u001b[39m"
openssl genrsa -des3 -out .ssl/server.key 2048

echo -e "\u001b[32m>>> Generating a CSR (Certificate Signing Request) \u001b[39m"
openssl req -new -key .ssl/server.key -out .ssl/server.csr

echo -e "\u001b[32m>>> Removing Passphrase from Key \u001b[39m"
cp .ssl/server.key .ssl/server.key.org
openssl rsa -in .ssl/server.key.org -out .ssl/server.key

echo -e "\u001b[32m>>> Generating a Self-Signed Certificate \u001b[39m"
openssl x509 -req -days 3650 -in .ssl/server.csr -signkey .ssl/server.key -out .ssl/server.crt
