#!/bin/bash
set -e
set -x

release_as='minor'
package_name='wallet-ui'
prefix='prerelease'
prerelease='--prerelease'
first_release=''
dry_run=''

print_usage() {
  cat <<EOF

$0 [Options]

Options:

-r <value>      release level, can be one of major, minor or patch
-n <value>      package name, i.e. wallet-ui
-p              flag if release, otherwise it will be considered a pre-release
-f              flag if first time release
-d              flag if dry run

EOF
}

while getopts 'r:n:pfd' flag; do
  case "${flag}" in
    r) release_as="${OPTARG}" ;;
    n) package_name="${OPTARG}" ;;
    p) prefix='release' && prerelease='' ;;
    f) first_release="--first-release" ;;
    d) dry_run="--dry-run" ;;
    *) print_usage
       exit 1 ;;
  esac
done

git checkout main
git pull --rebase
standard-version --tag-prefix "${package_name}-${prefix}-" --release-as $release_as $prerelease $first_release $dry_run
git push
git push --tags

exit 0
