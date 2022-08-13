#!/bin/bash
set -Eeuo pipefail

npm ci
npm test
