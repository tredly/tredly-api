#!/usr/local/bin/bash

# make sure this user is root
euid=$( id -u )
if test $euid != 0
then
   echo "Please run this installer as root." 1>&2
   exit 1
fi


mkdir -p .ssl

echo -e "\u001b[32m>>> Generating a Private Key \u001b[39m"
openssl genrsa -des3 -out .ssl/server.key -passout pass:tredly 2048

echo -e "\u001b[32m>>> Generating a CSR (Certificate Signing Request) \u001b[39m"
openssl req -new -key .ssl/server.key -out .ssl/server.csr -passin pass:tredly -subj "/C=AU/ST=QLD/L=Brisbane/O=Tredly/OU=IT/CN=tredly.com"

echo -e "\u001b[32m>>> Removing Passphrase from Key \u001b[39m"
cp .ssl/server.key .ssl/server.key.org
openssl rsa -in .ssl/server.key.org -out .ssl/server.key -passin pass:tredly

echo -e "\u001b[32m>>> Generating a Self-Signed Certificate \u001b[39m"
openssl x509 -req -days 3650 -in .ssl/server.csr -signkey .ssl/server.key -out .ssl/server.crt -passin pass:tredly
