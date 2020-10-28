#! /bin/sh

force=false
path=
while getopts fp: flag; do
    case "${flag}" in
        f) force=true ;;
        p) path="${OPTARG}" ;;
        \?) exit 1 ;;
    esac
done
shift $((${OPTIND} - 1))

[ -n "${path}" ] || { echo "Path (-p) is empty" 1>&2; exit 1; }

echo "Force: ${force}"
echo "Path: ${path}"
