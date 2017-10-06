#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
NC='\033[0m'

while getopts ":t:p:" opt; do
  case $opt in
    t)
      githubLogin=${OPTARG}
      ;;
    p)
      projectId=${OPTARG}
      ;;
  esac
done

function usage {
  echo "Usage: ./setup-gcp.sh -t <githubLogin> -p <projectId>"
  exit 1
}

if [[ -z "$githubLogin" || -z "$projectId" ]]; then
  usage
fi

function cloneTemplate {
  echo -n "* Cloning template project..."
  RES=$(git clone "https://github.com/$githubLogin/actions-on-google-project-template-gcp.git" actions-on-google 2>&1)
  checkResult "$RES"
}

function gitConfig {
  echo -n "* Config credential sh..."
  RES=$(git config credential.helper gcloud.sh 2>&1)
  checkResult "$RES"
}

function gitRemote {
  echo -n "* Git remote add google..."
  RES=$(git remote add google "https://source.developers.google.com/p/$projectI/r/default" 2>&1)
  checkResult "$RES"
}

function checkResult {

  if [ $? -eq 0 ]; then
    echo -e "${GREEN} done${NC}"
  else
    echo -e "${RED} fail${NC}"
    echo -e "${ORANGE} $1 ${NC}"
    exit 1
  fi
}

cloneTemplate
cd actions-on-google
gitConfig
gitRemote
