# yml-builder

[![Build Status](https://travis-ci.org/janis-commerce/yml-builder.svg?branch=master)](https://travis-ci.org/janis-commerce/yml-builder)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/yml-builder/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/yml-builder?branch=master)

A package for build a single yml file from multiple source files.

## Installation
```sh
npm install @janiscommerce/yml-builder
```

## Usage
```sh
npx @janiscommerce/yml-builder -i sourceDir -o outputFile.yml
```

### Important:
- **The source files must be `.yml` or `.yaml` any other file types will be skipped.**
- **The input path and output file path starts from the current working directory.**
- **The output file will be replaced if it exists.**
- **The output directory will be recursively created if not exists.**
- **If there is not any source files in the specified input directory, an empty file will be generated.**

### Options:
```sh
--input, -i   the path to your sources directory
--output, -o  the path to the file that will be generated
```

## Examples

```sh
npx @janiscommerce/yml-builder -i permissions/src -o permissions/permissions.yml

# Will get the source files from /path/to/root/permissions/src
# Will generate the output file into /path/to/root/permissions/permissions.yml
```