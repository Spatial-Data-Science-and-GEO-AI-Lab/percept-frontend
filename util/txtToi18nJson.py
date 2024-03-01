#!/usr/bin/env python3
import json
import sys

mode = 0
curKey = ""
curTxt = ""

trans = {}

with open(sys.argv[1], 'r') as fp:
  for l in fp:
    if mode == 0:
      # expect i18n key followed by colon, possibly text
      colonPos = l.find(':')
      if colonPos == -1:
        print(f'invalid key line: {l}')
        sys.exit(1)
      curTxt = l[colonPos+1:].lstrip()
      curKey = l[0:colonPos]
      mode = 1
    elif mode == 1:
      if l[0] == '%':
        # finished
        mode = 0
        trans[curKey] = curTxt.rstrip()
        curTxt = ""
        curKey = ""
      else:
        # Reading translation, line by line
        curTxt += l

print(json.dumps(trans, indent=4, ensure_ascii=False))
