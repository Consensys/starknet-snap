#!/usr/bin/env bash

VERSION=$(node -p "require('./packages/get-starknet/package.json').version")
HASH=$(git rev-parse --short HEAD)
DATE=$(date +%Y%m%d%M%S)
npm --prefix ./packages/get-starknet version --new-version ${VERSION}-dev-${HASH}-${DATE} --no-git-tag-version
npm publish ./packages/get-starknet --tag dev --access public