#!/bin/bash

archiveInGCP='https://storage.googleapis.com/project-2966895523221308821.appspot.com/actions-on-google-project-template-master.zip';
filename='actions-on-google-project-template'

curl --silent --output $filename.zip $archiveInGCP
size=$(ls -l $filename.zip | awk '{print $5}')
md5=$(openssl md5 -binary $filename.zip | openssl enc -base64)

echo "TsvHttpData-1.0" > $filename.tsv
echo -e "$archiveInGCP\t$size\t$md5\n" >> $filename.tsv

rm -fr $filename.zip