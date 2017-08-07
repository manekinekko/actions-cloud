#!/bin/bash

archiveIn='https://github.com/actions-on-google-builder/actions-on-google-project-template/archive/master.zip';
filename='actions-on-google-project-template'

curl --silent --output $filename.zip $archiveIn
size=$(ls -l $filename.zip | awk '{print $5}')
md5=$(openssl md5 -binary $filename.zip | openssl enc -base64)

echo "TsvHttpData-1.0" > $filename.tsv
echo -e "$archiveIn\t$size\t$md5\n" >> $filename.tsv

rm -fr $filename.zip